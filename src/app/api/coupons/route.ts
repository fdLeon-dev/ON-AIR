import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([
    { code: "PEAK10", discount: 10, label: "10% off" },
    { code: "WELCOME20", discount: 20, label: "20% off" },
  ]);
}
