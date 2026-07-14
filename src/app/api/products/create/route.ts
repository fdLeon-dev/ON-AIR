import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createProduct } from "@/lib/data/persistence";
import { resolveAdminAccess } from "@/lib/admin/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { user, isAdmin } = await resolveAdminAccess();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!isAdmin) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const supabase = await createServerSupabaseClient({ serviceRole: true });
    const body = await request.json();
    const product = await createProduct(body, supabase);

    revalidatePath("/");
    revalidatePath("/catalog");
    revalidatePath(`/product/${product.slug}`);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Failed to create product", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo crear el producto" },
      { status: 500 },
    );
  }
}
