import "server-only";
import { prisma } from "@/lib/prisma";

export interface Slot {
  /** "HH:MM" */
  time: string;
  /** ISO complet du créneau. */
  iso: string;
  available: boolean;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

/**
 * Génère les créneaux disponibles pour une date donnée (AAAA-MM-JJ).
 * Tient compte des horaires d'ouverture, du délai de préparation,
 * de l'intervalle et de la capacité par créneau (commandes déjà planifiées).
 */
export async function getSlotsForDate(dateStr: string): Promise<Slot[]> {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return [];
  const date = new Date(y, m - 1, d);
  const dow = date.getDay();

  const [hours, setting] = await Promise.all([
    prisma.openingHour.findUnique({ where: { dayOfWeek: dow } }),
    prisma.orderingSetting.findUnique({ where: { id: "default" } }),
  ]);
  if (!hours || hours.closed) return [];

  const interval = setting?.slotIntervalMin ?? 15;
  const lead = setting?.leadTimeMin ?? 20;
  const capacity = setting?.capacityPerSlot ?? 8;

  // Plage du jour (pour compter les commandes déjà planifiées).
  const dayStart = new Date(y, m - 1, d, 0, 0, 0);
  const dayEnd = new Date(y, m - 1, d, 23, 59, 59);
  const scheduled = await prisma.order.findMany({
    where: {
      status: { not: "annulée" },
      scheduledAt: { gte: dayStart, lte: dayEnd },
    },
    select: { scheduledAt: true },
  });
  const countByIso = new Map<string, number>();
  for (const o of scheduled) {
    if (o.scheduledAt) {
      const key = o.scheduledAt.toISOString();
      countByIso.set(key, (countByIso.get(key) ?? 0) + 1);
    }
  }

  const earliest = Date.now() + lead * 60 * 1000;
  const slots: Slot[] = [];
  for (
    let min = hours.openMinutes;
    min <= hours.closeMinutes;
    min += interval
  ) {
    const slotDate = new Date(
      y,
      m - 1,
      d,
      Math.floor(min / 60),
      min % 60,
      0,
      0,
    );
    const iso = slotDate.toISOString();
    const used = countByIso.get(iso) ?? 0;
    const available = slotDate.getTime() >= earliest && used < capacity;
    slots.push({
      time: `${pad(Math.floor(min / 60))}:${pad(min % 60)}`,
      iso,
      available,
    });
  }
  return slots;
}

/** Le restaurant est-il ouvert maintenant ? */
export async function isOpenNow(): Promise<boolean> {
  const now = new Date();
  const hours = await prisma.openingHour.findUnique({
    where: { dayOfWeek: now.getDay() },
  });
  if (!hours || hours.closed) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= hours.openMinutes && mins <= hours.closeMinutes;
}
