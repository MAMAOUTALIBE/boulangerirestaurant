"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { BotMessageSquare, Plus, Send, Sparkles, X } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { useCart } from "@/context/CartContext";

type AssistantAction =
  | {
      type: "add_to_cart";
      dishId: string;
      name: string;
      image: string;
      basePrice: number;
      quantity: number;
    }
  | { type: "link"; label: string; href: string };

interface Message {
  role: "assistant" | "user";
  text: string;
  actions?: AssistantAction[];
}

const initialMessage: Message = {
  role: "assistant",
  text: "Bonjour ! Je peux conseiller grillades, kebabs, pide, mezze ou desserts turcs, les ajouter à votre panier, ou vous aider pour la livraison, une réservation ou le traiteur.",
};

const FALLBACK_REPLY =
  "Désolé, je n'ai pas pu répondre pour le moment. Réessayez, ou contactez-nous via la page Contact.";

export function AiAssistant() {
  const pathname = usePathname();
  const { addItem } = useCart();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [loading, setLoading] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const hidden = useMemo(
    () => pathname?.startsWith("/admin") || pathname?.startsWith("/commander"),
    [pathname],
  );
  const desktopHidden = useMemo(
    () =>
      pathname === "/contact" ||
      pathname === "/reservation" ||
      pathname === "/sur-mesure" ||
      pathname === "/boutique-de-saison" ||
      pathname === "/anti-gaspi" ||
      pathname === "/traiteur" ||
      pathname === "/compte",
    [pathname],
  );

  if (hidden) return null;

  function onAddToCart(
    action: Extract<AssistantAction, { type: "add_to_cart" }>,
    key: string,
  ) {
    addItem(
      {
        dishId: action.dishId,
        name: action.name,
        image: action.image,
        basePrice: action.basePrice,
      },
      action.quantity,
    );
    setAdded((current) => ({ ...current, [key]: true }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = value.trim();
    if (!text || loading) return;

    const history = [...messages, { role: "user" as const, text }];
    setMessages(history);
    setValue("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // On envoie l'historique récent (hors message d'accueil) au format LLM.
          messages: history
            .slice(1)
            .map((m) => ({ role: m.role, content: m.text })),
        }),
      });
      const data = await res.json().catch(() => null);
      const reply: string =
        (res.ok && typeof data?.reply === "string" && data.reply) ||
        FALLBACK_REPLY;
      const actions: AssistantAction[] = Array.isArray(data?.actions)
        ? data.actions
        : [];
      setMessages((current) => [
        ...current,
        { role: "assistant", text: reply, actions },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: FALLBACK_REPLY },
      ]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      });
    }
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-40 flex flex-col items-end sm:bottom-7 sm:right-7 print:hidden ${desktopHidden ? "sm:hidden" : ""}`}
    >
      {open && (
        <section
          aria-label={`Assistant ${siteConfig.name}`}
          className="mb-3 w-[min(22rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-white/10 bg-ink-soft shadow-card"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gold text-ink">
                <BotMessageSquare className="h-4 w-4" />
              </span>
              <p className="text-sm font-semibold text-cream">
                {siteConfig.shortName} · Assistant IA
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer l'assistant"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-cream/70 transition hover:border-gold/60 hover:text-gold"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="max-h-80 space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className="space-y-2">
                <p
                  className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-6 ${
                    message.role === "assistant"
                      ? "bg-white/[0.08] text-cream/85"
                      : "ml-auto bg-gold text-ink"
                  }`}
                >
                  {message.text}
                </p>
                {message.actions && message.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {message.actions.map((action, ai) => {
                      const key = `${index}-${ai}`;
                      if (action.type === "add_to_cart") {
                        const done = added[key];
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => !done && onAddToCart(action, key)}
                            disabled={done}
                            className="inline-flex items-center gap-1 rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-gold-400 disabled:opacity-70"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            {done
                              ? `Ajouté · ${action.name}`
                              : `Ajouter ${action.quantity > 1 ? `${action.quantity}× ` : ""}${action.name} · ${(action.basePrice * action.quantity).toFixed(2)} €`}
                          </button>
                        );
                      }
                      return (
                        <Link
                          key={key}
                          href={action.href}
                          className="inline-flex items-center gap-1 rounded-full border border-gold/40 px-3 py-1.5 text-xs font-semibold text-gold transition hover:bg-gold/10"
                        >
                          {action.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <p className="max-w-[88%] rounded-2xl bg-white/[0.08] px-3 py-2 text-sm text-cream/60">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce">•</span>
                  <span className="animate-bounce [animation-delay:0.15s]">
                    •
                  </span>
                  <span className="animate-bounce [animation-delay:0.3s]">
                    •
                  </span>
                </span>
              </p>
            )}
          </div>

          <form
            onSubmit={onSubmit}
            className="flex gap-2 border-t border-white/10 p-3"
          >
            <label htmlFor="assistant-question" className="sr-only">
              Question
            </label>
            <input
              id="assistant-question"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Posez votre question"
              disabled={loading}
              className="min-w-0 flex-1 rounded-full border border-white/10 bg-ink px-4 py-2 text-sm text-cream placeholder:text-muted focus:border-gold/60 focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              aria-label="Envoyer"
              disabled={loading}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-ink transition hover:bg-gold-400 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}

      <motion.button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          setHasOpened(true);
        }}
        aria-expanded={open}
        aria-label={`Ouvrir l'assistant ${siteConfig.shortName}`}
        initial={{ opacity: 0, scale: 0.6, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.6 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="group relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-gold p-1 text-ink shadow-card transition hover:bg-gold-400 sm:h-14 sm:w-auto sm:justify-start sm:gap-2.5 sm:py-2 sm:pl-2 sm:pr-4"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-gold transition group-hover:scale-105">
          <BotMessageSquare className="h-5 w-5" />
        </span>
        <span className="hidden flex-col items-start leading-tight sm:flex">
          <span className="flex items-center gap-1 text-sm font-bold text-ink">
            {siteConfig.shortName}
            <Sparkles className="h-3 w-3" />
          </span>
          <span className="text-[11px] font-medium text-ink/65">
            Assistant IA
          </span>
        </span>

        {!hasOpened && !open && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white">
              1
            </span>
          </span>
        )}
      </motion.button>
    </div>
  );
}
