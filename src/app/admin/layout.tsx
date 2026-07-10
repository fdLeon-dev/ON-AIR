import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin | Peak Sport",
};

function getAdminEmails() {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/sign-in");
  }

  const normalizedEmail = user.email?.toLowerCase() ?? "";
  const adminEmails = getAdminEmails();
  const isConfiguredAdmin = adminEmails.includes(normalizedEmail);

  let isAdmin = isConfiguredAdmin;

  try {
    const serviceSupabase = await createServerSupabaseClient({ serviceRole: true });
    const { data: profile } = await serviceSupabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
    isAdmin = isAdmin || Boolean(profile?.is_admin);
  } catch {
    // Keep the configured admin email fallback active if the profiles table cannot be queried.
  }

  if (!isAdmin) {
    redirect("/");
  }

  const adminName = "Administrador";

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex">
        <aside className="w-72 shrink-0 border-r border-white/6 bg-zinc-950/60 p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold">Peak Sport</h2>
            <p className="mt-1 text-xs text-zinc-400">Panel administrativo</p>
          </div>
          <nav className="space-y-2">
            <Link href="/admin" className="block rounded-md px-3 py-2 text-sm hover:bg-white/5">Dashboard</Link>
            <Link href="/admin/products" className="block rounded-md px-3 py-2 text-sm hover:bg-white/5">Productos</Link>
            <Link href="/admin/products/new" className="block rounded-md px-3 py-2 text-sm hover:bg-white/5">Nuevo producto</Link>
            <Link href="/admin/orders" className="block rounded-md px-3 py-2 text-sm hover:bg-white/5">Pedidos</Link>
            <Link href="/admin/hero" className="block rounded-md px-3 py-2 text-sm hover:bg-white/5">Hero</Link>
            <Link href="/admin" className="block rounded-md px-3 py-2 text-sm hover:bg-white/5">Ajustes</Link>
          </nav>
          <div className="mt-8 border-t border-white/6 pt-4">
            <p className="text-xs text-zinc-400">Sesión</p>
            <p className="mt-2 font-medium">{adminName}</p>
          </div>
        </aside>

        <main className="flex-1 p-8">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Administración</h1>
              <p className="text-sm text-zinc-400">Control central de tienda y pedidos</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300 hover:bg-white/6">Ver tienda</Link>
            </div>
          </header>

          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
