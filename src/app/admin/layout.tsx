import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { resolveAdminAccess } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: "Admin | RUNTIME®",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, isAdmin } = await resolveAdminAccess();

  if (!user) {
    redirect("/auth/sign-in");
  }

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <AdminShell displayName={profile?.full_name ?? user.email ?? "Administrador"} email={user.email}>
      {children}
    </AdminShell>
  );
}
