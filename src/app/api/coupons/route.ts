import { NextResponse } from "next/server";
import { loadCoupons } from "@/lib/data/coupons";

export async function GET() {
  const coupons = await loadCoupons();
  return NextResponse.json(coupons);
}
