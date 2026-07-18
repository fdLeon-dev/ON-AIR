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

type PaymentMethod = "whatsapp_transfer" | "mercado_pago" | "transferencia_bancaria" | "efectivo_entrega";

const STORE_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_STORE_WHATSAPP_NUMBER ?? "59800000000";
const BANK_TRANSFER_NUMBER = process.env.NEXT_PUBLIC_BANK_TRANSFER_NUMBER ?? STORE_WHATSAPP_NUMBER;
const MERCADO_PAGO_INFO = process.env.NEXT_PUBLIC_MERCADO_PAGO_INFO ?? "Te enviaremos el link de pago por WhatsApp al confirmar el pedido.";

const paymentMethodOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: "whatsapp_transfer", label: "WhatsApp (transferencia)" },
  { value: "mercado_pago", label: "Mercado Pago" },
  { value: "transferencia_bancaria", label: "Transferencia bancaria" },
  { value: "efectivo_entrega", label: "Efectivo al entregar" },
];

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
  const [department, setDepartment] = useState("");
  const [city, setCity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("whatsapp_transfer");
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
  const isCashDelivery = paymentMethod === "efectivo_entrega";
  const isMaldonadoSanCarlos =
    department.trim().toLowerCase().includes("maldonado") &&
    city.trim().toLowerCase().includes("san carlos");

  const handleApplyCoupon = () => {
    const found = coupons.find((entry) => entry.code.toLowerCase() === couponCode.toLowerCase());
    setCoupon(found ?? null);
  };

  const getPaymentInstructions = () => {
    if (paymentMethod === "whatsapp_transfer") {
      return `Realiza la transferencia al número ${BANK_TRANSFER_NUMBER} y envía el comprobante por WhatsApp.`;
    }
    if (paymentMethod === "mercado_pago") {
      return MERCADO_PAGO_INFO;
    }
    if (paymentMethod === "transferencia_bancaria") {
      return `Transferencia bancaria al número/cuenta ${BANK_TRANSFER_NUMBER}. Luego envía el comprobante por WhatsApp.`;
    }
    return "Pago en efectivo al momento de la entrega, disponible solo en Maldonado (San Carlos).";
  };

  const buildWhatsAppMessage = (orderId: string) => {
    const itemLines = items
      .map((item) => `- ${item.name} x${item.quantity} (${formatCurrency(item.price * item.quantity)})`)
      .join("\n");

    const methodLabel = paymentMethodOptions.find((option) => option.value === paymentMethod)?.label ?? paymentMethod;
    const couponLine = coupon ? `\nCupón: ${coupon.code} (${coupon.discount}% off)` : "";

    return [
      "Hola, acabo de confirmar mi pedido en Peak Sport.",
      `Pedido: ${orderId}`,
      "",
      "Productos:",
      itemLines,
      "",
      `Subtotal: ${formatCurrency(subtotal)}`,
      `Descuento: ${formatCurrency(discount)}`,
      `Total: ${formatCurrency(total)}`,
      couponLine,
      `Método de pago: ${methodLabel}`,
      "",
      "Datos de entrega:",
      `Nombre: ${name}`,
      `Email: ${email}`,
      `Dirección: ${address}`,
      `Departamento: ${department}`,
      `Ciudad: ${city}`,
      "",
      "Adjunto comprobante de pago y quedo a disposición.",
    ]
      .filter(Boolean)
      .join("\n");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!authenticated) {
      setStatus("Debes iniciar sesión para completar el pedido.");
      return;
    }

    if (isCashDelivery && !isMaldonadoSanCarlos) {
      setStatus("Efectivo al entregar solo está disponible para Maldonado (San Carlos).");
      return;
    }

    const pendingWhatsAppWindow = typeof window !== "undefined" ? window.open("", "_blank", "noopener,noreferrer") : null;

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        coupon,
        paymentMethod,
        shippingAddress: {
          name,
          email,
          address,
          department,
          city,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      if (pendingWhatsAppWindow) {
        pendingWhatsAppWindow.close();
      }
      setStatus(data.error ?? "No se pudo crear el pedido. Intenta nuevamente.");
      return;
    }

    const whatsappMessage = buildWhatsAppMessage(data.orderId);
    const whatsappUrl = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;
    if (pendingWhatsAppWindow) {
      pendingWhatsAppWindow.location.href = whatsappUrl;
    } else {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }

    await syncUserOrders();
    clearCart();
    setStatus(`Pedido creado: ${data.orderId}. Se abrió WhatsApp para enviar comprobante y coordinar.`);
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
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  value={department}
                  onChange={(event) => setDepartment(event.target.value)}
                  className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3"
                  placeholder="Departamento"
                  required
                />
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3"
                  placeholder="Ciudad"
                  required
                />
              </div>
            </div>
            <div className="mt-8">
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Métodos de pago</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {paymentMethodOptions.map((method) => {
                  const selected = paymentMethod === method.value;
                  const disabled = method.value === "efectivo_entrega" && department.trim().length > 0 && city.trim().length > 0 && !isMaldonadoSanCarlos;
                  return (
                    <label
                      key={method.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                        selected ? "border-white bg-white/10 text-white" : "border-white/10 bg-white/5 text-zinc-300"
                      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={selected}
                        onChange={() => setPaymentMethod(method.value)}
                        disabled={disabled}
                        className="h-4 w-4"
                      />
                      <span>{method.label}</span>
                    </label>
                  );
                })}
              </div>
              <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                <p className="font-medium text-emerald-200">Instrucciones del método seleccionado</p>
                <p className="mt-2">{getPaymentInstructions()}</p>
                {isCashDelivery && !isMaldonadoSanCarlos ? (
                  <p className="mt-2 text-amber-200">Para efectivo al entregar debes indicar Departamento: Maldonado y Ciudad: San Carlos.</p>
                ) : null}
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-3" placeholder="Código de cupón" />
              <button type="button" onClick={handleApplyCoupon} className="rounded-full border border-white/10 px-4 py-3 text-sm text-zinc-300">Aplicar</button>
            </div>
            <button
              type="submit"
              disabled={!authenticated || items.length === 0 || (isCashDelivery && !isMaldonadoSanCarlos)}
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
