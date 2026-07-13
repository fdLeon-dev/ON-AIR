"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/dashboard/dashboard-ui";
import type { Coupon } from "@/lib/data/coupons";

export function CouponsManager({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", label: "", discount: "10", active: true });

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

  return (
    <Panel title="Cupones" description="Promociones activas y códigos reutilizables.">
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="grid gap-3 md:grid-cols-4">
          <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm" placeholder="Código" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />
          <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm" placeholder="Etiqueta" value={form.label} onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))} />
          <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm" placeholder="Descuento" type="number" value={form.discount} onChange={(event) => setForm((current) => ({ ...current, discount: event.target.value }))} />
          <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm">
            <input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />
            Activo
          </label>
        </div>
        <Button onClick={() => void save({ code: form.code, label: form.label, discount: Number(form.discount), active: form.active }, "POST")}>Crear</Button>
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-zinc-400">
            <tr>
              <th className="px-5 py-4">Código</th>
              <th className="px-5 py-4">Etiqueta</th>
              <th className="px-5 py-4">Descuento</th>
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
          </tbody>
        </table>
      </div>

      {message ? <p className="mt-4 text-sm text-zinc-400">{message}</p> : null}
    </Panel>
  );
}
