import { NextResponse } from "next/server";
import { consumeMagicToken } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { getSiteConfig } from "@/lib/site-settings";

/** GET /compte/verify?token=… — valide le lien magique et ouvre la session. */
export async function GET(request: Request) {
  const siteConfig = await getSiteConfig();
  const token = new URL(request.url).searchParams.get("token");
  const email = token ? await consumeMagicToken(token) : null;

  if (!email) {
    return NextResponse.redirect(`${siteConfig.url}/compte?error=expired`);
  }

  await createSession(email);
  return NextResponse.redirect(`${siteConfig.url}/compte`);
}
