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
  const url = new URL(request.url);
  const provided =
    request.headers.get("authorization")?.replace("Bearer ", "") ??
    url.searchParams.get("secret");

  // En présence d'un secret configuré, on l'exige.
  if (secret && provided !== secret) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const customers = await listCustomers();
  const targets = customers.filter((c) => needsReengagement(c.segment));

  for (const c of targets) {
    await sendEmail({
      to: c.email,
      subject: `Vous nous manquez chez ${siteConfig.shortName}`,
      html: `<h1>Ça fait un moment ${c.name ?? ""} !</h1>
        <p>Revenez savourer nos produits du jour : profitez de <strong>-10%</strong> avec le code <strong>BOULANGERIE10</strong>.</p>`,
    });
    const phone = await prisma.customer.findUnique({
      where: { email: c.email },
      select: { phone: true },
    });
    if (phone?.phone) {
      await sendSms({
        to: phone.phone,
        body: `${siteConfig.shortName} : vous nous manquez ! -10% avec le code BOULANGERIE10 sur votre prochaine commande.`,
      });
    }
  }

  return NextResponse.json({ reengaged: targets.length });
}
