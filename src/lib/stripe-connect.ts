import "server-only";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/config";

function getStripeSecret() {
  return process.env.STRIPE_SECRET_KEY?.trim() ?? "";
}

function connectCountry() {
  return process.env.STRIPE_CONNECT_COUNTRY?.trim().toUpperCase() || "FR";
}

async function getStripeClient() {
  const secret = getStripeSecret();
  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY manquant.");
  }
  const { default: Stripe } = await import("stripe");
  return new Stripe(secret);
}

function hasPendingRequirements(account: Stripe.Account): boolean {
  const requirements = account.requirements;
  if (!requirements) return false;
  const due = [
    ...(requirements.currently_due ?? []),
    ...(requirements.past_due ?? []),
  ];
  return due.length > 0;
}

function mapAccountFlags(account: Stripe.Account) {
  const stripeDetailsSubmitted = Boolean(account.details_submitted);
  const stripeChargesEnabled = Boolean(account.charges_enabled);
  const stripePayoutsEnabled = Boolean(account.payouts_enabled);
  const stripeOnboardingComplete =
    stripeDetailsSubmitted &&
    stripeChargesEnabled &&
    stripePayoutsEnabled &&
    !hasPendingRequirements(account);

  return {
    stripeDetailsSubmitted,
    stripeChargesEnabled,
    stripePayoutsEnabled,
    stripeOnboardingComplete,
  };
}

export function isStripeConnectConfigured(): boolean {
  return Boolean(getStripeSecret());
}

export async function ensureRestaurantStripeAccount(restaurantId: string) {
  const stripe = await getStripeClient();
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true, slug: true, name: true, stripeAccountId: true },
  });
  if (!restaurant) throw new Error("Restaurant introuvable.");

  if (restaurant.stripeAccountId) {
    return { accountId: restaurant.stripeAccountId, created: false };
  }

  const account = await stripe.accounts.create({
    type: "express",
    country: connectCountry(),
    business_profile: {
      name: restaurant.name,
      url: siteConfig.url,
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      restaurantId: restaurant.id,
      restaurantSlug: restaurant.slug,
    },
  });

  await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: { stripeAccountId: account.id },
  });

  return { accountId: account.id, created: true };
}

export async function syncRestaurantStripeStatus(restaurantId: string) {
  const stripe = await getStripeClient();
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true, stripeAccountId: true },
  });
  if (!restaurant) throw new Error("Restaurant introuvable.");

  if (!restaurant.stripeAccountId) {
    return prisma.restaurant.update({
      where: { id: restaurant.id },
      data: {
        stripeDetailsSubmitted: false,
        stripeChargesEnabled: false,
        stripePayoutsEnabled: false,
        stripeOnboardingComplete: false,
        stripeLastSyncedAt: new Date(),
      },
    });
  }

  const account = await stripe.accounts.retrieve(restaurant.stripeAccountId);
  const flags = mapAccountFlags(account);
  return prisma.restaurant.update({
    where: { id: restaurant.id },
    data: {
      ...flags,
      stripeLastSyncedAt: new Date(),
    },
  });
}

export async function createRestaurantOnboardingLink(restaurantId: string) {
  const stripe = await getStripeClient();
  const { accountId } = await ensureRestaurantStripeAccount(restaurantId);
  const url = siteConfig.url.replace(/\/$/, "");

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${url}/api/stripe/connect/refresh?restaurant=${restaurantId}`,
    return_url: `${url}/admin/parametres?stripe=return&restaurant=${restaurantId}`,
    type: "account_onboarding",
  });
  return link.url;
}

export async function getRestaurantConnectTransferData(restaurantId?: string) {
  if (!restaurantId || !isStripeConnectConfigured()) return undefined;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      stripeAccountId: true,
      stripeOnboardingComplete: true,
      stripeChargesEnabled: true,
      stripePayoutsEnabled: true,
    },
  });
  if (
    !restaurant?.stripeAccountId ||
    !restaurant.stripeOnboardingComplete ||
    !restaurant.stripeChargesEnabled ||
    !restaurant.stripePayoutsEnabled
  ) {
    return undefined;
  }

  return { destination: restaurant.stripeAccountId };
}
