import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { loadHeroConfig, saveHeroConfig } from "@/lib/data/persistence";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getAdminEmails() {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

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

  const normalizedEmail = user.email?.toLowerCase() ?? "";
  const adminEmails = getAdminEmails();
  const isConfiguredAdmin = adminEmails.includes(normalizedEmail);

  let isAdmin = isConfiguredAdmin;

  try {
    const serviceSupabase = await createServerSupabaseClient({ serviceRole: true });
    const { data: profile, error: profileError } = await serviceSupabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (!profileError) {
      isAdmin = isAdmin || Boolean(profile?.is_admin);
    }
  } catch {
    // Fall back to the configured admin email when profile lookups are blocked.
  }

  if (!isAdmin) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  try {
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    const config = await saveHeroConfig(body as Partial<import("@/types").HeroConfig>);
    revalidatePath("/");
    revalidatePath("/admin/hero");
    return NextResponse.json(config);
  } catch (error) {
    console.error("Failed to save hero config", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo guardar la configuración" },
      { status: 500 },
    );
  }
}
