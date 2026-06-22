import { NextResponse } from "next/server";
import { getDishes } from "@/lib/dishes";

export const dynamic = "force-dynamic";

/** GET /api/dishes — liste des plats disponibles (source : base de données). */
export async function GET() {
  const dishes = await getDishes();
  return NextResponse.json({ dishes });
}
