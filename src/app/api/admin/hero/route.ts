import { NextResponse } from "next/server";
import { loadHeroConfig, saveHeroConfig } from "@/lib/data/persistence";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const config = await loadHeroConfig();
  return NextResponse.json(config);
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.is_admin) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const body = await request.json();
  const config = await saveHeroConfig(body);
  return NextResponse.json(config);
}
