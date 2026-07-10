import { NextResponse } from "next/server";
import { loadProducts } from "@/lib/data/persistence";

export async function GET() {
  const products = await loadProducts();
  return NextResponse.json(products);
}
