import "server-only";
import { prisma } from "@/lib/prisma";
import {
  DEMO_LEAD_SOURCES,
  demoLeadSourceLabels,
  type DemoLeadSource,
} from "@/lib/demo-leads";
import {
  aggregateTesters,
  filterTesters,
  type TesterActivity,
  type TesterProfile,
} from "@/lib/site-activity";

/**
 * Regroupe toutes les traces laissées sur le site pour répondre à « qui teste
 * le site ? » : leads de démo, paniers non finalisés (`AbandonedCart`) et
 * commandes de TOUS les statuts (`Order`, y compris « en attente » et
 * « annulée »). Lecture seule — rien n'est jamais supprimé ni modifié ici.
 *
 * Les leads de source « panier » / « commande » sont ignorés : ils font double
 * emploi avec les paniers et commandes réels, plus riches.
 */
function sourceLabel(source: string): string {
  return DEMO_LEAD_SOURCES.includes(source as DemoLeadSource)
    ? demoLeadSourceLabels[source as DemoLeadSource]
    : source;
}

const REDUNDANT_LEAD_SOURCES = new Set(["panier", "commande"]);

export async function listSiteTesters(params?: {
  q?: string;
  stage?: string;
}): Promise<TesterProfile[]> {
  const [leads, carts, orders] = await Promise.all([
    prisma.demoLead.findMany({ orderBy: { lastSeenAt: "desc" }, take: 2000 }),
    prisma.abandonedCart.findMany({
      orderBy: { updatedAt: "desc" },
      take: 2000,
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 3000,
      select: {
        reference: true,
        status: true,
        fulfillment: true,
        total: true,
        promoCode: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        createdAt: true,
      },
    }),
  ]);

  const activities: TesterActivity[] = [];

  for (const lead of leads) {
    if (REDUNDANT_LEAD_SOURCES.has(lead.source)) continue;
    activities.push({
      kind: "lead",
      ref: lead.sourceId ?? lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      channel: sourceLabel(lead.source),
      status: lead.converted ? "converti" : null,
      detail: lead.message,
      at: lead.lastSeenAt.getTime(),
      visits: lead.visits,
    });
  }

  for (const cart of carts) {
    activities.push({
      kind: "panier",
      ref: cart.cartId,
      name: cart.name,
      email: cart.email,
      phone: cart.phone,
      channel: "Panier",
      status: cart.status,
      total: cart.total,
      detail: `${cart.itemCount} article(s)`,
      at: cart.updatedAt.getTime(),
    });
  }

  for (const order of orders) {
    activities.push({
      kind: "commande",
      ref: order.reference,
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
      channel: `Commande (${order.fulfillment})`,
      status: order.status,
      total: order.total,
      detail: order.promoCode ? `promo ${order.promoCode}` : null,
      at: order.createdAt.getTime(),
    });
  }

  return filterTesters(aggregateTesters(activities), params);
}
