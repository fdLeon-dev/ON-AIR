import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createProduct } from "@/lib/data/persistence";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const serviceSupabase = await createServerSupabaseClient({ serviceRole: true });
  const { data: profile, error: profileError } = await serviceSupabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.is_admin) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const body = await request.json();
  const product = await createProduct(body);

  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath(`/product/${product.slug}`);

  return NextResponse.json(product, { status: 201 });
}
