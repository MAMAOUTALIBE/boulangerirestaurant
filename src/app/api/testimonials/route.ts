import { NextResponse } from "next/server";
import { testimonials } from "@/data/testimonials";

/** GET /api/testimonials — liste des avis clients. */
export async function GET() {
  return NextResponse.json({ testimonials });
}
