"use client";

import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 0 ? 0 : 0;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold">Carrito</h1>
        <p className="mt-4 max-w-2xl text-zinc-400">Actualiza cantidades, elimina productos y avanza al checkout con un flujo listo para pagos reales.</p>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-8">
            {items.length === 0 ? (
              <p className="text-zinc-500">Tu carrito está vacío.</p>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 overflow-hidden rounded-[1rem] border border-white/10">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{item.name}</p>
                        {item.size ? <p className="mt-1 text-sm text-emerald-300">Talle: {item.size}</p> : null}
                        <p className="mt-1 text-sm text-zinc-400">{formatCurrency(item.price)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                        className="w-16 rounded-full border border-white/10 bg-black px-3 py-2 text-sm"
                      />
                      <button onClick={() => removeItem(item.id)} className="text-sm text-zinc-400 transition hover:text-white">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Resumen</p>
            <div className="mt-6 space-y-4 text-sm text-zinc-300">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span>Envío</span><span>{shipping === 0 ? "Gratis" : formatCurrency(shipping)}</span></div>
              <div className="flex justify-between border-t border-white/10 pt-4 text-base font-semibold text-white"><span>Total</span><span>{formatCurrency(total)}</span></div>
            </div>
            <Link href="/checkout" className="mt-8 inline-flex w-full justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-zinc-200">Ir al checkout</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
