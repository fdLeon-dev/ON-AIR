"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useUserStore } from "@/stores/user-store";
import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const profile = useUserStore((state) => state.profile);
  const orders = useUserStore((state) => state.orders);
  const syncUserOrders = useUserStore((state) => state.syncFromSupabase);
  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoadingSession(false);
      return;
    }

    const loadSession = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ?? null);
      if (data.user) {
        await syncUserOrders();
      }
      setLoadingSession(false);
    };

    void loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        void syncUserOrders();
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold">Mi cuenta</h1>
        <p className="mt-4 max-w-2xl text-zinc-400">Tus pedidos, favoritos y acceso rápido al seguimiento del estado de compra.</p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Perfil</p>
            {loadingSession ? (
              <p className="mt-4 text-sm text-zinc-400">Comprobando sesión...</p>
            ) : user ? (
              <>
                <h2 className="mt-4 text-2xl font-semibold">{profile.name || user.email}</h2>
                <p className="mt-2 text-zinc-400">{profile.email || user.email}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/favorites" className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300">Favoritos</Link>
                  <Link href="/checkout" className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black">Nuevo pedido</Link>
                  {profile.is_admin ? (
                    <Link href="/admin" className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300">Ver administración</Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={async () => {
                      const supabase = createClient();
                      await supabase?.auth.signOut();
                      window.location.href = "/";
                    }}
                    className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="mt-4 text-2xl font-semibold">Invitado</h2>
                <p className="mt-2 text-zinc-400">Inicia sesión para ver tu perfil, crear pedidos y revisar tus compras.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/auth/sign-in" className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black">Entrar</Link>
                  <Link href="/auth/register" className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300">Registrarse</Link>
                </div>
              </>
            )}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Pedidos</p>
            <div className="mt-6 space-y-4">
              {user ? (
                orders.map((order) => (
                  <div key={order.id} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-white">{order.id}</p>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">{order.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-400">{order.date}</p>
                    <p className="mt-3 text-sm text-zinc-300">Total: $ {order.total.toLocaleString("es-AR")}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-400">Inicia sesión para ver tus pedidos pasados.</p>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
