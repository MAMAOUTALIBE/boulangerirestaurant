import { NextRequest, NextResponse } from "next/server";
import { createRestaurantOnboardingLink } from "@/lib/stripe-connect";
import { siteConfig } from "@/lib/config";
import { getSessionEmail } from "@/lib/session";
import { isAdminEmail } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const base = siteConfig.url.replace(/\/$/, "");

  // Cette route génère un lien d'onboarding Stripe Connect : réservée aux admins.
  if (!isAdminEmail(await getSessionEmail())) {
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
