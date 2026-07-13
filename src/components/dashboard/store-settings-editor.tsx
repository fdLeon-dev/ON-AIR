"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/dashboard/dashboard-ui";
import type { StoreSettings } from "@/lib/data/store-settings";

export function StoreSettingsEditor({ initialSettings }: { initialSettings: StoreSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      setMessage("No se pudo guardar la configuración.");
      return;
    }

    setMessage("Configuración guardada.");
  };

  return (
    <Panel title="Configuración de la tienda" description="Nombre, soporte, moneda, texto destacado y taxonomías.">
      <div className="grid gap-4 md:grid-cols-2">
        <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm" value={settings.storeName} onChange={(event) => setSettings((current) => ({ ...current, storeName: event.target.value }))} placeholder="Nombre de la tienda" />
        <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm" value={settings.currency} onChange={(event) => setSettings((current) => ({ ...current, currency: event.target.value }))} placeholder="Moneda" />
        <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm" value={settings.supportEmail} onChange={(event) => setSettings((current) => ({ ...current, supportEmail: event.target.value }))} placeholder="Email de soporte" />
        <input className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm" value={settings.supportPhone} onChange={(event) => setSettings((current) => ({ ...current, supportPhone: event.target.value }))} placeholder="Teléfono de soporte" />
        <textarea className="min-h-24 rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 text-sm md:col-span-2" value={settings.shippingMessage} onChange={(event) => setSettings((current) => ({ ...current, shippingMessage: event.target.value }))} placeholder="Mensaje de envíos" />
        <textarea className="min-h-24 rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 text-sm md:col-span-2" value={settings.featuredNote} onChange={(event) => setSettings((current) => ({ ...current, featuredNote: event.target.value }))} placeholder="Nota destacada" />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={() => void save()}>Guardar configuración</Button>
        {message ? <p className="text-sm text-zinc-400">{message}</p> : null}
      </div>
    </Panel>
  );
}
