import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { deleteProduct, updateProduct } from "@/lib/data/persistence";
import { resolveAdminAccess } from "@/lib/admin/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, isAdmin } = await resolveAdminAccess();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!isAdmin) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = await createServerSupabaseClient();
    const result = await updateProduct(id, body, supabase);

    revalidatePath("/");
    revalidatePath("/catalog");
    if (result?.slug) {
      revalidatePath(`/product/${result.slug}`);
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to update product", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo actualizar el producto" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, isAdmin } = await resolveAdminAccess();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!isAdmin) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    await deleteProduct(id, supabase);

    revalidatePath("/");
    revalidatePath("/catalog");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete product", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo eliminar el producto" },
      { status: 500 },
    );
  }
}
