import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildSystemPrompt,
  getAssistantMenu,
  lookupOrderContext,
  resolveActions,
  ruleBasedAnswer,
  type ResolvedAction,
} from "@/lib/assistant";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(20),
});

// Fournisseur compatible OpenAI (défaut : Groq, gratuit). Configurable via env
// pour basculer vers OpenRouter / OpenAI / Together sans changer le code.
const BASE_URL =
  process.env.ASSISTANT_BASE_URL ?? "https://api.groq.com/openai/v1";
const MODEL = process.env.ASSISTANT_MODEL ?? "llama-3.3-70b-versatile";

function reply(text: string, mode: string, actions: ResolvedAction[] = []) {
  return NextResponse.json({ reply: text, actions, mode });
}

export async function POST(request: Request) {
  // Anti-abus : protège le quota gratuit du modèle.
  const ip = await clientIp();
  if (!(await rateLimit(`assistant:${ip}`, 15, 60_000))) {
    return NextResponse.json(
      { error: "Trop de messages. Réessayez dans une minute." },
      { status: 429 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const { messages } = parsed.data;
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const apiKey = process.env.ASSISTANT_API_KEY;

  // Pas de clé configurée → secours par règles (l'assistant reste fonctionnel).
  if (!apiKey) {
    return reply(ruleBasedAnswer(lastUser?.content ?? ""), "rules");
  }

  try {
    const menu = await getAssistantMenu();
    // Suivi de commande : si une référence NK-… est citée, on récupère son statut.
    const orderContext = await lookupOrderContext(lastUser?.content ?? "");
    const systemPrompt = await buildSystemPrompt(menu, orderContext?.summary);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        max_tokens: 600,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      console.error("Assistant LLM error:", res.status, await res.text());
      return reply(ruleBasedAnswer(lastUser?.content ?? ""), "rules");
    }

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";

    let replyText = "";
    let actions: ResolvedAction[] = [];
    try {
      const parsedContent = JSON.parse(content);
      replyText =
        typeof parsedContent?.reply === "string"
          ? parsedContent.reply.trim()
          : "";
      actions = resolveActions(parsedContent?.actions, menu);
    } catch {
      // Le modèle n'a pas renvoyé de JSON valide → on garde le texte brut.
      replyText = content.trim();
    }

    // Commande trouvée → on ajoute un lien direct vers sa page de suivi.
    if (orderContext?.found) {
      actions = [
        ...actions,
        {
          type: "link",
          label: `Voir ma commande ${orderContext.reference}`,
          href: `/commande/${orderContext.reference}`,
        },
      ];
    }

    return reply(
      replyText || ruleBasedAnswer(lastUser?.content ?? ""),
      replyText ? "llm" : "rules",
      actions,
    );
  } catch (error) {
    console.error("Assistant request failed:", error);
    return reply(ruleBasedAnswer(lastUser?.content ?? ""), "rules");
  }
}
