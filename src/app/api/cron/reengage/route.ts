import { NextResponse } from "next/server";
import { listCustomers } from "@/lib/customers";
import { needsReengagement } from "@/lib/segmentation";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/reengage — relance automatique des clients inactifs.
 * Protégé par `CRON_SECRET` (header Authorization: Bearer … ou ?secret=).
 * À planifier via Vercel Cron (voir vercel.json).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  // Sécurité : on refuse tant que le secret n'est pas configuré (jamais ouvert par défaut).
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET non configuré." },
      { status: 503 },
    );
  }
  const url = new URL(request.url);
  const provided =
    request.headers.get("authorization")?.replace("Bearer ", "") ??
    url.searchParams.get("secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const customers = await listCustomers();
  const targets = customers.filter((c) => needsReengagement(c.segment));

  for (const c of targets) {
    await sendEmail({
      to: c.email,
      subject: `Vous nous manquez chez ${siteConfig.shortName}`,
      html: `<h1>Ça fait un moment ${c.name ?? ""} !</h1>
        <p>Revenez savourer nos grillades et spécialités turques : profitez de <strong>-10%</strong> avec le code <strong>BIENVENUE10</strong>.</p>`,
    });
    const phone = await prisma.customer.findUnique({
      where: { email: c.email },
      select: { phone: true },
    });
    if (phone?.phone) {
      await sendSms({
        to: phone.phone,
        body: `${siteConfig.shortName} : vous nous manquez ! -10% avec le code BIENVENUE10 sur votre prochaine commande.`,
      });
    }
  }

  return NextResponse.json({ reengaged: targets.length });
}
