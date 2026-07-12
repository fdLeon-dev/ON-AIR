import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { deleteProduct, updateProduct } from "@/lib/data/persistence";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const result = await updateProduct(id, body);

  revalidatePath("/");
  revalidatePath("/catalog");
  if (result?.slug) {
    revalidatePath(`/product/${result.slug}`);
  }
  return NextResponse.json(result);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteProduct(id);

  revalidatePath("/");
  revalidatePath("/catalog");
  return NextResponse.json({ success: true });
}
