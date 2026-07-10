"use client";

import { useState } from "react";

interface AdminOrderQuickSendProps {
  orderId: string;
  currentStatus: string;
}

export function AdminOrderQuickSend({ orderId, currentStatus }: AdminOrderQuickSendProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSend = !["shipped", "completed", "cancelled"].includes(currentStatus);

  const handleQuickSend = async () => {
    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status: "shipped", note: "Enviado rápido desde admin." }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "No se pudo enviar el pedido.");
      return;
    }

    setMessage("Pedido marcado como enviado.");
    window.location.reload();
  };

  if (!canSend) {
    return null;
  }

  return (
    <div className="mt-6 rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-100">
      <p className="font-semibold text-white">Acción rápida</p>
      <p className="mt-2 text-zinc-300">Marca este pedido como enviado con un solo click.</p>
      <button
        type="button"
        onClick={handleQuickSend}
        disabled={loading}
        className="mt-4 inline-flex rounded-full bg-emerald-400 px-5 py-2 text-sm font-medium text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Enviando..." : "Enviar pedido"}
      </button>
      {message ? <p className="mt-3 text-sm text-emerald-100">{message}</p> : null}
    </div>
  );
}
