import "server-only";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { escapeHtml } from "@/lib/html";
import { defaultSiteConfig } from "@/lib/config";
import { getSiteConfig } from "@/lib/site-settings";
import {
  birthdayMatches,
  classifyWeather,
  isInactiveForDays,
  periodKey,
  type WeatherKind,
} from "@/lib/marketing-rules";

type Recipient = {
  email: string;
  name?: string | null;
  dedupeKey: string;
  dish?: string;
};

export const DEFAULT_MARKETING_RULES = [
  {
    id: "birthday",
    name: "Anniversaire client",
    type: "birthday",
    subject: `Joyeux anniversaire de la part de ${defaultSiteConfig.shortName} 🎉`,
    body: "Bonjour {prenom}, profitez de votre anniversaire avec le code {code}.",
    promoCode: "ANNIVERSAIRE",
  },
  {
    id: "inactive-30",
    name: "Client absent depuis 30 jours",
    type: "inactive",
    delayDays: 30,
    subject: `Vous nous manquez chez ${defaultSiteConfig.shortName}`,
    body: "Bonjour {prenom}, revenez découvrir nos spécialités avec le code {code}.",
    promoCode: "RETOUR10",
  },
  {
    id: "inactive-60",
    name: "Client absent depuis 60 jours",
    type: "inactive",
    delayDays: 60,
    subject: "Une offre spéciale vous attend",
    body: "Bonjour {prenom}, cela fait longtemps ! Votre offre : {code}.",
    promoCode: "RETOUR15",
  },
  {
    id: "abandoned-cart",
    name: "Panier abandonné",
    type: "cart",
    subject: "Votre panier vous attend",
    body: "Bonjour {prenom}, votre sélection est toujours disponible chez {restaurant}.",
  },
  {
    id: "favorite-restock",
    name: "Plat préféré de nouveau disponible",
    type: "restock",
    subject: "Votre plat préféré est de retour",
    body: "Bonjour {prenom}, {plat} est de nouveau disponible !",
  },
  {
    id: "weather-rain",
    name: "Offre météo : pluie",
    type: "weather",
    weatherKind: "pluie",
    subject: "Une envie de réconfort ?",
    body: "Avec cette météo {meteo}, profitez de notre offre {code}.",
    promoCode: "METEO10",
  },
  {
    id: "weekday",
    name: "Offre du jour",
    type: "weekday",
    weekday: 2,
    subject: "L’offre du jour est arrivée",
    body: "Bonjour {prenom}, votre offre du jour : {code}.",
    promoCode: "MARDI10",
  },
] as const;

export async function ensureMarketingRules(): Promise<void> {
  await Promise.all(
    DEFAULT_MARKETING_RULES.map((rule) =>
      prisma.marketingRule.upsert({
        where: { id: rule.id },
        update: {},
        create: { ...rule, enabled: false },
      }),
    ),
  );
}

async function consentedEmails(): Promise<Set<string>> {
  const rows = await prisma.newsletterSubscriber.findMany({
    select: { email: true },
  });
  return new Set(rows.map((row) => row.email.toLowerCase()));
}

async function weatherKind(): Promise<WeatherKind | null> {
  const latitude = process.env.RESTAURANT_LATITUDE ?? "48.6908";
  const longitude = process.env.RESTAURANT_LONGITUDE ?? "2.3738";
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&current=temperature_2m,precipitation,weather_code&timezone=Europe%2FParis`,
      { next: { revalidate: 1800 } },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as {
      current?: {
        temperature_2m?: number;
        precipitation?: number;
        weather_code?: number;
      };
    };
    if (!data.current || data.current.temperature_2m == null) return null;
    return classifyWeather({
      temperature: data.current.temperature_2m,
      precipitation: data.current.precipitation ?? 0,
      weatherCode: data.current.weather_code ?? 0,
    });
  } catch {
    return null;
  }
}

async function recipientsForRule(
  rule: {
    id: string;
    type: string;
    delayDays: number | null;
    weekday: number | null;
    weatherKind: string | null;
  },
  now: Date,
  consented: Set<string>,
): Promise<{ recipients: Recipient[]; weather: WeatherKind | null }> {
  const allow = (email: string) => consented.has(email.toLowerCase());
  if (rule.type === "birthday") {
    const customers = await prisma.customer.findMany({
      where: { birthDate: { not: null } },
      select: { email: true, name: true, birthDate: true },
    });
    return {
      recipients: customers
        .filter((c) => allow(c.email) && birthdayMatches(c.birthDate, now))
        .map((c) => ({
          email: c.email,
          name: c.name,
          dedupeKey: `${rule.id}:${periodKey(now, "année")}:${c.email}`,
        })),
      weather: null,
    };
  }

  if (rule.type === "inactive") {
    const customers = await prisma.customer.findMany({
      select: { email: true, name: true },
    });
    const grouped = await prisma.order.groupBy({
      by: ["customerEmail"],
      _max: { createdAt: true },
    });
    const lastOrder = new Map(
      grouped.map((row) => [row.customerEmail, row._max.createdAt]),
    );
    return {
      recipients: customers
        .filter(
          (c) =>
            allow(c.email) &&
            isInactiveForDays(
              lastOrder.get(c.email) ?? null,
              rule.delayDays ?? 30,
              now,
            ),
        )
        .map((c) => ({
          email: c.email,
          name: c.name,
          // Une seule relance par seuil et par cycle d'achat. Une nouvelle
          // commande produit une nouvelle date et autorise un futur cycle.
          dedupeKey: `${rule.id}:${lastOrder.get(c.email)!.toISOString()}:${c.email}`,
        })),
      weather: null,
    };
  }

  if (rule.type === "cart") {
    const carts = await prisma.abandonedCart.findMany({
      where: {
        status: "actif",
        email: { not: null },
        updatedAt: { lte: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
      },
      select: { id: true, email: true, name: true },
    });
    return {
      recipients: carts
        .filter((cart) => cart.email && allow(cart.email))
        .map((cart) => ({
          email: cart.email!,
          name: cart.name,
          dedupeKey: `${rule.id}:${cart.id}`,
        })),
      weather: null,
    };
  }

  if (rule.type === "restock") {
    const dishes = await prisma.dish.findMany({
      where: { available: true },
      select: { id: true, slug: true, name: true, updatedAt: true },
    });
    const recipients: Recipient[] = [];
    for (const dish of dishes) {
      const orders = await prisma.order.findMany({
        where: {
          status: { not: "annulée" },
          items: { some: { dishId: dish.slug } },
        },
        select: { customerEmail: true, customerName: true },
        distinct: ["customerEmail"],
      });
      for (const order of orders) {
        if (!allow(order.customerEmail)) continue;
        recipients.push({
          email: order.customerEmail,
          name: order.customerName,
          dish: dish.name,
          dedupeKey: `${rule.id}:${dish.id}:${dish.updatedAt.toISOString()}:${order.customerEmail}`,
        });
      }
    }
    return { recipients, weather: null };
  }

  if (rule.type === "weekday" && rule.weekday !== now.getDay()) {
    return { recipients: [], weather: null };
  }

  const currentWeather = rule.type === "weather" ? await weatherKind() : null;
  if (rule.type === "weather" && currentWeather !== rule.weatherKind) {
    return { recipients: [], weather: currentWeather };
  }

  const customers = await prisma.customer.findMany({
    select: { email: true, name: true },
  });
  return {
    recipients: customers
      .filter((c) => allow(c.email))
      .map((c) => ({
        email: c.email,
        name: c.name,
        dedupeKey: `${rule.id}:${periodKey(now, "jour")}:${c.email}`,
      })),
    weather: currentWeather,
  };
}

function interpolate(
  template: string,
  recipient: Recipient,
  promoCode: string | null,
  weather: WeatherKind | null,
  restaurantName: string,
): string {
  return template
    .replaceAll("{prenom}", recipient.name?.trim() || "")
    .replaceAll("{code}", promoCode || "")
    .replaceAll("{restaurant}", restaurantName)
    .replaceAll("{plat}", recipient.dish || "votre plat préféré")
    .replaceAll("{meteo}", weather || "du jour");
}

export async function dispatchMarketingCampaign(input: {
  ruleId?: string;
  name: string;
  type: string;
  subject: string;
  body: string;
  promoCode?: string | null;
  recipients: Recipient[];
  weather?: WeatherKind | null;
}): Promise<number> {
  const campaign = await prisma.marketingCampaign.create({
    data: {
      ruleId: input.ruleId,
      name: input.name,
      type: input.type,
      subject: input.subject,
      promoCode: input.promoCode,
    },
  });
  const { shortName: restaurantName } = await getSiteConfig();
  let sent = 0;
  for (const recipient of input.recipients) {
    const dispatch = await prisma.marketingDispatch
      .create({
        data: {
          campaignId: campaign.id,
          email: recipient.email.toLowerCase(),
          dedupeKey: recipient.dedupeKey,
          status: "en cours",
        },
      })
      .catch(() => null);
    if (!dispatch) continue;
    const result = await sendEmail({
      to: recipient.email,
      subject: interpolate(
        input.subject,
        recipient,
        input.promoCode ?? null,
        input.weather ?? null,
        restaurantName,
      ),
      html: `<div>${escapeHtml(
        interpolate(
          input.body,
          recipient,
          input.promoCode ?? null,
          input.weather ?? null,
          restaurantName,
        ),
      ).replaceAll("\n", "<br>")}</div>`,
    });
    const success = result.simulated || result.ok !== false;
    await prisma.marketingDispatch.update({
      where: { id: dispatch.id },
      data: {
        status: success
          ? result.simulated
            ? "simulation"
            : "envoyé"
          : "échec",
      },
    });
    if (success) sent += 1;
  }
  await prisma.marketingCampaign.update({
    where: { id: campaign.id },
    data: { recipientCount: sent },
  });
  return sent;
}

export async function runMarketingAutomations(now = new Date()) {
  await ensureMarketingRules();
  const [rules, consented] = await Promise.all([
    prisma.marketingRule.findMany({
      where: { enabled: true },
      orderBy: { name: "asc" },
    }),
    consentedEmails(),
  ]);
  const results: { rule: string; sent: number }[] = [];
  for (const rule of rules) {
    const selection = await recipientsForRule(rule, now, consented);
    const sent = await dispatchMarketingCampaign({
      ruleId: rule.id,
      name: rule.name,
      type: rule.type,
      subject: rule.subject,
      body: rule.body,
      promoCode: rule.promoCode,
      recipients: selection.recipients,
      weather: selection.weather,
    });
    await prisma.marketingRule.update({
      where: { id: rule.id },
      data: { lastRunAt: now },
    });
    results.push({ rule: rule.id, sent });
  }
  return results;
}

export async function marketingDashboard() {
  await ensureMarketingRules();
  const [rules, campaigns] = await Promise.all([
    prisma.marketingRule.findMany({ orderBy: { name: "asc" } }),
    prisma.marketingCampaign.findMany({
      orderBy: { sentAt: "desc" },
      take: 50,
      include: { dispatches: { select: { email: true } } },
    }),
  ]);
  const promoCodes = [
    ...new Set(campaigns.flatMap((campaign) => campaign.promoCode ?? [])),
  ];
  const oldestCampaign = campaigns.at(-1)?.sentAt;
  const orders =
    promoCodes.length > 0 && oldestCampaign
      ? await prisma.order.findMany({
          where: {
            promoCode: { in: promoCodes },
            createdAt: { gte: oldestCampaign },
            status: { notIn: ["en attente", "annulée"] },
          },
          select: {
            promoCode: true,
            customerEmail: true,
            createdAt: true,
            total: true,
          },
        })
      : [];
  const attribution = new Map<
    string,
    { ordersCount: number; revenue: number }
  >();
  for (const order of orders) {
    const campaign = campaigns.find(
      (candidate) =>
        candidate.promoCode === order.promoCode &&
        candidate.sentAt <= order.createdAt &&
        candidate.dispatches.some(
          (dispatch) =>
            dispatch.email.toLowerCase() === order.customerEmail.toLowerCase(),
        ),
    );
    if (!campaign) continue;
    const current = attribution.get(campaign.id) ?? {
      ordersCount: 0,
      revenue: 0,
    };
    current.ordersCount += 1;
    current.revenue += order.total;
    attribution.set(campaign.id, current);
  }
  const enriched = campaigns.map((campaign) => ({
    ...campaign,
    ...(attribution.get(campaign.id) ?? { ordersCount: 0, revenue: 0 }),
  }));
  return { rules, campaigns: enriched };
}
