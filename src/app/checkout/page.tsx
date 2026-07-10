"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useCartStore } from "@/stores/cart-store";
import { useUserStore } from "@/stores/user-store";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface Coupon {
  code: string;
  discount: number;
  label: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clear);
  const syncUserOrders = useUserStore((state) => state.syncFromSupabase);
  const [status, setStatus] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [loadingSession, setLoadingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch("/api/coupons")
      .then((response) => response.json())
      .then((data) => setCoupons(data as Coupon[]));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const loadSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/auth/sign-in");
        setAuthenticated(false);
      } else {
        setAuthenticated(true);
        setEmail(data.user.email ?? "");
      }
      setLoadingSession(false);
    };

    void loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace("/auth/sign-in");
        setAuthenticated(false);
      } else {
        setAuthenticated(true);
        setEmail(session.user.email ?? "");
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = coupon ? (subtotal * coupon.discount) / 100 : 0;
  const total = subtotal - discount;

  const handleApplyCoupon = () => {
    const found = coupons.find((entry) => entry.code.toLowerCase() === couponCode.toLowerCase());
    setCoupon(found ?? null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!authenticated) {
      setStatus("Debes iniciar sesión para completar el pedido.");
      return;
    }

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        coupon,
        shippingAddress: {
          name,
          email,
          address,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "No se pudo crear el pedido. Intenta nuevamente.");
      return;
    }

    await syncUserOrders();
    clearCart();
    setStatus(`Pedido creado: ${data.orderId}`);
    router.push("/account");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold">Checkout</h1>
        <p className="mt-4 max-w-2xl text-zinc-400">Resumen del pedido, cupones y métodos de pago listos para una experiencia de compra real.</p>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-8">
            <div className="space-y-4">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3"
                placeholder="Nombre completo"
                required
              />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3"
                placeholder="Email"
                type="email"
                required
              />
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3"
                placeholder="Dirección"
                required
              />
            </div>
            <div className="mt-8">
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Métodos de pago</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {[
                  "Mercado Pago",
                  "Stripe",
                  "PayPal",
                  "Transferencia bancaria",
                  "WhatsApp",
                ].map((method) => (
                  <span key={method} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">{method}</span>
                ))}
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="Código de cupón" />
              <button type="button" onClick={handleApplyCoupon} className="rounded-full border border-white/10 px-4 py-3 text-sm text-zinc-300">Aplicar</button>
            </div>
            <button
              type="submit"
              disabled={!authenticated || items.length === 0}
              className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:bg-white/30"
            >
              Confirmar pedido
            </button>
            {status ? <p className="mt-4 text-sm text-zinc-400">{status}</p> : null}
            {!authenticated && !loadingSession ? (
              <p className="mt-3 text-sm text-red-300">Debes iniciar sesión para crear un pedido.</p>
            ) : null}
          </form>

          <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Resumen</p>
            <div className="mt-6 space-y-4 text-sm text-zinc-300">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.name} × {item.quantity}</span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-white/10 pt-4 text-base font-semibold text-white">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Descuento</span>
                <span>{coupon ? `${coupon.discount}%` : "—"}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-white">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
