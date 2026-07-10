import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getAdminEmails() {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "No authenticated user" },
      { status: 401 },
    );
  }

  const normalizedEmail = user.email?.toLowerCase() ?? "";
  const adminEmails = getAdminEmails();
  const isConfiguredAdmin = adminEmails.includes(normalizedEmail);

  let profile: { full_name?: string | null; is_admin?: boolean | null } | null = null;
  let orders: Array<{ id: string; status: string; total: number; created_at: string }> = [];
  let isAdmin = isConfiguredAdmin;

  try {
    const serviceSupabase = await createServerSupabaseClient({ serviceRole: true });
    const { data: profileData } = await serviceSupabase.from("profiles").select("full_name, is_admin").eq("id", user.id).maybeSingle();
    profile = profileData;
    isAdmin = isAdmin || Boolean(profileData?.is_admin);

    const { data: ordersData, error: ordersError } = await serviceSupabase
      .from("orders")
      .select("id, status, total, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!ordersError) {
      orders = (ordersData ?? []).map((order) => ({
        id: order.id,
        status: order.status,
        total: Number(order.total ?? 0),
        created_at: order.created_at,
      }));
    }
  } catch {
    // Fallback to configured admin email if the profiles table is unavailable or blocked.
  }

  return NextResponse.json({
    ok: true,
    user,
    profile: {
      full_name: profile?.full_name ?? user.email ?? "",
      is_admin: isAdmin,
    },
    is_admin: isAdmin,
    orders,
  });
}
