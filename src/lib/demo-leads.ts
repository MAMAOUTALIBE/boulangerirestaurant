import "server-only";
import type { DemoLead } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const DEMO_LEAD_SOURCES = [
  "panier",
  "commande",
  "réservation",
  "contact",
  "newsletter",
  "traiteur",
  "sur-mesure",
  "saison",
  "anti-gaspi",
] as const;

export type DemoLeadSource = (typeof DEMO_LEAD_SOURCES)[number];

export const demoLeadSourceLabels: Record<DemoLeadSource, string> = {
  panier: "Panier test",
  commande: "Commande",
  réservation: "Réservation",
  contact: "Contact",
  newsletter: "Newsletter",
  traiteur: "Traiteur",
  "sur-mesure": "Sur-mesure",
  saison: "Précommande saison",
  "anti-gaspi": "Anti-gaspi",
};

type RecordDemoLeadInput = {
  source: DemoLeadSource;
  sourceId?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  converted?: boolean;
};

function clean(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function cleanEmail(value?: string | null): string | undefined {
  return clean(value)?.toLowerCase();
}

function truncate(value: string | undefined, max: number): string | undefined {
  return value ? value.slice(0, max) : undefined;
}

/** Enregistre un contact de test sans bloquer le parcours client. */
export async function recordDemoLead(
  input: RecordDemoLeadInput,
): Promise<void> {
  const email = truncate(cleanEmail(input.email), 320);
  const phone = truncate(clean(input.phone), 80);
  if (!email && !phone) return;

  const name = truncate(clean(input.name), 160);
  const sourceId = truncate(clean(input.sourceId), 120);
  const message = truncate(clean(input.message), 500);
  const now = new Date();

  try {
    const existing = await prisma.demoLead.findFirst({
      where: {
        OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
      },
      orderBy: { lastSeenAt: "desc" },
    });

    const data = {
      source: input.source,
      ...(sourceId ? { sourceId } : {}),
      ...(name ? { name } : {}),
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(message ? { message } : {}),
      ...(input.converted ? { converted: true } : {}),
      lastSeenAt: now,
    };

    if (existing) {
      await prisma.demoLead.update({
        where: { id: existing.id },
        data: {
          ...data,
          visits: { increment: 1 },
        },
      });
      return;
    }

    await prisma.demoLead.create({ data });
  } catch (error) {
    console.error("[demo-leads] enregistrement impossible", error);
  }
}

export async function listDemoLeads(params?: {
  q?: string;
  source?: string;
}): Promise<DemoLead[]> {
  const q = clean(params?.q);
  const source = clean(params?.source);
  const like = q ? { contains: q, mode: "insensitive" as const } : undefined;

  return prisma.demoLead.findMany({
    where: {
      ...(source ? { source } : {}),
      ...(like
        ? {
            OR: [
              { name: like },
              { email: like },
              { phone: like },
              { message: like },
            ],
          }
        : {}),
    },
    orderBy: { lastSeenAt: "desc" },
    take: 500,
  });
}
