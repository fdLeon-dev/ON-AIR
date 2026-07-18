"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useUserStore } from "@/stores/user-store";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, resolveProductImageUrl } from "@/lib/utils";

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

        <div className="mt-10 space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Perfil</p>
            {loadingSession ? (
              <p className="mt-4 text-sm text-zinc-400">Comprobando sesión...</p>
            ) : user ? (
              <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">{profile.name || user.email}</h2>
                  <p className="mt-2 text-zinc-400">{profile.email || user.email}</p>
                </div>
                <div className="flex flex-wrap gap-3">
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
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Invitado</h2>
                  <p className="mt-2 text-zinc-400">Inicia sesión para ver tu perfil, crear pedidos y revisar tus compras.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/auth/sign-in" className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black">Entrar</Link>
                  <Link href="/auth/register" className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300">Registrarse</Link>
                </div>
              </div>
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
                    <div className="mt-3 space-y-1 text-sm text-zinc-300">
                      {order.coupon ? <p>Subtotal: {formatCurrency(order.subtotal)}</p> : null}
                      {order.coupon ? (
                        <p className="text-emerald-300">
                          Cupón aplicado: {order.coupon.label || order.coupon.code} ({order.coupon.discount}% off) · Descuento: {formatCurrency(order.discountAmount)}
                        </p>
                      ) : null}
                      <p>Total: {formatCurrency(order.total)}</p>
                    </div>

                    {order.items.length > 0 ? (
                      <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Detalle de productos</p>
                        {order.items.map((item, index) => (
                          <div key={`${order.id}-item-${index}`} className="rounded-xl border border-white/10 bg-black/30 p-3">
                            <div className="flex items-start gap-3">
                              {item.productImage ? (
                                <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-white/10">
                                  <Image
                                    src={resolveProductImageUrl(item.productImage)}
                                    alt={item.productName}
                                    fill
                                    className="object-cover"
                                    sizes="56px"
                                  />
                                </div>
                              ) : (
                                <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-white/10 bg-zinc-900 text-[10px] text-zinc-500">
                                  Sin imagen
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium text-white">{item.productName}</p>
                                <p className="mt-1 text-xs text-zinc-400">Cantidad: {item.quantity} · Precio unitario: {formatCurrency(item.priceAtPurchase)}</p>
                                {item.wasOnPromotion ? (
                                  <p className="mt-1 text-xs text-emerald-300">
                                    En promoción · Precio regular: {formatCurrency(item.regularPrice)}
                                  </p>
                                ) : null}
                                <p className="mt-1 text-xs text-zinc-300">Color: {item.color || "No especificado"} · Talle: {item.size || "No especificado"}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-xs text-zinc-500">Este pedido no tiene detalle de productos disponible.</p>
                    )}
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
