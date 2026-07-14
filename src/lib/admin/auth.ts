import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminProfile = {
  full_name?: string | null;
  avatar_url?: string | null;
  is_admin?: boolean | null;
};

export type AdminAccess = {
  user: User | null;
  profile: AdminProfile | null;
  isAdmin: boolean;
};

export function getConfiguredAdminEmails() {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export async function resolveAdminAccess(): Promise<AdminAccess> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, profile: null, isAdmin: false };
  }

  const normalizedEmail = user.email?.toLowerCase() ?? "";
  const isConfiguredAdmin = getConfiguredAdminEmails().includes(normalizedEmail);

  let profile: AdminProfile | null = null;
  let isAdmin = isConfiguredAdmin;

  try {
    const { data } = await supabase.from("profiles").select("full_name, avatar_url, is_admin").eq("id", user.id).maybeSingle();
    profile = data ?? null;
    isAdmin = isAdmin || Boolean(data?.is_admin);
  } catch {
    try {
      const serviceSupabase = await createServerSupabaseClient({ serviceRole: true });
      const { data } = await serviceSupabase.from("profiles").select("full_name, avatar_url, is_admin").eq("id", user.id).maybeSingle();
      profile = data ?? null;
      isAdmin = isAdmin || Boolean(data?.is_admin);
    } catch {
      profile = null;
    }
  }

  return { user, profile, isAdmin };
}
