import { NextResponse } from "next/server";
import { loadProducts } from "@/lib/data/persistence";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase() ?? "";
  const products = await loadProducts();

  const filtered = products.filter((product) => {
    const haystack = `${product.name} ${product.brand} ${product.category} ${product.description}`.toLowerCase();
    return haystack.includes(q);
  });

  return NextResponse.json(filtered);
}
