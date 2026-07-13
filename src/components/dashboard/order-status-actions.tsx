"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function OrderStatusActions({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const updateStatus = async (status: string) => {
    setLoading(true);
    setMessage(null);
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status, note: `Estado actualizado a ${status}` }),
    });
    setLoading(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setMessage(payload.error ?? "No se pudo actualizar el pedido.");
      return;
    }

    setMessage("Pedido actualizado.");
    window.location.reload();
  };

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap gap-2">
        {currentStatus !== "processing" ? <Button size="sm" variant="secondary" disabled={loading} onClick={() => void updateStatus("processing")}>Procesar</Button> : null}
        {currentStatus !== "shipped" ? <Button size="sm" disabled={loading} onClick={() => void updateStatus("shipped")}>Enviar</Button> : null}
        {currentStatus !== "completed" ? <Button size="sm" variant="ghost" disabled={loading} onClick={() => void updateStatus("completed")}>Completar</Button> : null}
      </div>
      {message ? <p className="text-sm text-zinc-400">{message}</p> : null}
    </div>
  );
}
