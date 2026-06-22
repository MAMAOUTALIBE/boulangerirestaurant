import { NextResponse } from "next/server";
import { getSlotsForDate } from "@/lib/slots";

export const dynamic = "force-dynamic";

/** GET /api/slots?date=AAAA-MM-JJ — créneaux disponibles pour une date. */
export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date");
  if (!date) {
    return NextResponse.json(
      { error: "Paramètre 'date' requis" },
      { status: 400 },
    );
  }
  const slots = await getSlotsForDate(date);
  return NextResponse.json({ slots });
}
