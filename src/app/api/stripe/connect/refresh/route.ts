import { NextRequest, NextResponse } from "next/server";
import { createRestaurantOnboardingLink } from "@/lib/stripe-connect";
import { getSiteConfig } from "@/lib/site-settings";
import { isAdminSession } from "@/lib/session";

// NOTE sécurité : cette route DOIT rester en GET — c'est le `refresh_url` fourni
// à Stripe, atteint par une redirection navigateur (GET) quand un lien
// d'onboarding expire ; la passer en POST casserait l'onboarding Stripe Connect.
// Protection : session admin (rôle mot de passe) obligatoire. L'effet de bord
// (création/rafraîchissement d'un lien d'onboarding) est idempotent et limité à
// un restaurant déjà géré → risque CSRF résiduel faible.
export async function GET(request: NextRequest) {
  const siteConfig = await getSiteConfig();
  const base = siteConfig.url.replace(/\/$/, "");

  // Cette route génère un lien d'onboarding Stripe Connect : réservée aux admins.
  if (!(await isAdminSession())) {
    return NextResponse.redirect(`${base}/compte`);
  }

  const restaurantId = request.nextUrl.searchParams.get("restaurant") ?? "";
  const fallback = `${base}/admin/parametres?stripe=refresh-error`;

  if (!restaurantId) {
    return NextResponse.redirect(fallback);
  }

  try {
    const onboardingUrl = await createRestaurantOnboardingLink(restaurantId);
    return NextResponse.redirect(onboardingUrl);
  } catch {
    return NextResponse.redirect(fallback);
  }
}
