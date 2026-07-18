"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/dashboard/dashboard-ui";
import type { Coupon } from "@/lib/data/coupons";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

export function CouponsManager({ initialCoupons, initialProducts }: { initialCoupons: Coupon[]; initialProducts: Product[] }) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [products, setProducts] = useState(initialProducts);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", label: "", discount: "10", maxUsesPerUser: "1", active: true });
  const [promotionDiscount, setPromotionDiscount] = useState("20");

  const save = async (payload: Partial<Coupon> & { id?: string }, method: "POST" | "PATCH" | "DELETE") => {
    const response = await fetch("/api/admin/coupons", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      setMessage("No se pudo guardar el cupón.");
      return;
    }
    const refreshed = await fetch("/api/admin/coupons", { credentials: "include" }).then((res) => res.json());
    setCoupons(refreshed);
    setMessage("Cupón guardado.");
  };

  const updatePromotion = async (product: Product, enabled: boolean) => {
    const parsedDiscount = Number(promotionDiscount);
    const discount = Number.isFinite(parsedDiscount) ? Math.max(1, Math.min(95, parsedDiscount)) : 20;
    const discountedPrice = Math.max(1, Math.round(product.price * (1 - discount / 100)));

    const response = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: enabled ? "Oferta" : "Nuevo",
        offerPrice: enabled ? discountedPrice : null,
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(body?.error ?? "No se pudo actualizar la promoción del producto.");
      return;
    }

    const updated = (await response.json()) as Product;
    setProducts((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
    setMessage(enabled ? "Producto agregado a promociones." : "Producto removido de promociones.");
  };

  const promotionProducts = products.filter((product) => product.status === "Oferta" || typeof product.offerPrice === "number");

  return (
    <div className="space-y-6">
      <Panel title="Cupones" description="Promociones activas y códigos reutilizables.">
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="grid gap-3 md:grid-cols-5">
            <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm" placeholder="Código" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />
            <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm" placeholder="Etiqueta" value={form.label} onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))} />
            <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm" placeholder="Descuento" type="number" value={form.discount} onChange={(event) => setForm((current) => ({ ...current, discount: event.target.value }))} />
            <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm" placeholder="Usos por usuario" type="number" min="1" value={form.maxUsesPerUser} onChange={(event) => setForm((current) => ({ ...current, maxUsesPerUser: event.target.value }))} />
            <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />
              Activo
            </label>
          </div>
          <Button onClick={() => void save({ code: form.code, label: form.label, discount: Number(form.discount), maxUsesPerUser: Number(form.maxUsesPerUser), active: form.active }, "POST")}>Crear</Button>
        </div>

        <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5 text-zinc-400">
              <tr>
                <th className="px-5 py-4">Código</th>
                <th className="px-5 py-4">Etiqueta</th>
                <th className="px-5 py-4">Descuento</th>
                <th className="px-5 py-4">Usos por usuario</th>
                <th className="px-5 py-4">Estado</th>
                <th className="px-5 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-t border-white/10">
                  <td className="px-5 py-4 font-medium text-white">{coupon.code}</td>
                  <td className="px-5 py-4">{coupon.label}</td>
                  <td className="px-5 py-4">{coupon.discount}%</td>
                  <td className="px-5 py-4">{coupon.maxUsesPerUser ?? "Sin límite"}</td>
                  <td className="px-5 py-4">{coupon.active ? "Activo" : "Inactivo"}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => void save({ ...coupon, active: !coupon.active }, "PATCH")}>
                        {coupon.active ? "Desactivar" : "Activar"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void save({ id: coupon.id }, "DELETE")}>Eliminar</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-zinc-500" colSpan={6}>Sin cupones creados.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {message ? <p className="mt-4 text-sm text-zinc-400">{message}</p> : null}
      </Panel>

      <Panel title="Productos en promoción" description="Administra desde aquí los productos visibles en /promotions.">
        <div className="mb-4 grid gap-3 md:grid-cols-[auto_1fr] md:items-center">
          <label className="text-sm text-zinc-300">Descuento para activar promo (%)</label>
          <input
            type="number"
            min={1}
            max={95}
            value={promotionDiscount}
            onChange={(event) => setPromotionDiscount(event.target.value)}
            className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm md:max-w-xs"
          />
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5 text-zinc-400">
              <tr>
                <th className="px-5 py-4">Producto</th>
                <th className="px-5 py-4">Precio base</th>
                <th className="px-5 py-4">Precio promo</th>
                <th className="px-5 py-4">Estado</th>
                <th className="px-5 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const inPromotion = product.status === "Oferta" || typeof product.offerPrice === "number";
                return (
                  <tr key={product.id} className="border-t border-white/10">
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{product.name}</p>
                      <p className="text-xs text-zinc-500">{product.brand}</p>
                    </td>
                    <td className="px-5 py-4">{formatCurrency(product.price)}</td>
                    <td className="px-5 py-4">{typeof product.offerPrice === "number" ? formatCurrency(product.offerPrice) : "-"}</td>
                    <td className="px-5 py-4">{inPromotion ? "En promoción" : "Normal"}</td>
                    <td className="px-5 py-4">
                      {inPromotion ? (
                        <Button size="sm" variant="ghost" onClick={() => void updatePromotion(product, false)}>
                          Quitar promoción
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => void updatePromotion(product, true)}>
                          Activar promoción
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-zinc-500">Activos en promoción: {promotionProducts.length}</p>
      </Panel>
    </div>
  );
}
