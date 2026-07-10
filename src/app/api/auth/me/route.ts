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

  let isAdmin = isConfiguredAdmin;

  try {
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
    isAdmin = isAdmin || Boolean(profile?.is_admin);
  } catch {
    // Fallback to configured admin email if the profiles table is unavailable or blocked
  }

  return NextResponse.json({ ok: true, user, is_admin: isAdmin });
}
