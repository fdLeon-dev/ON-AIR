"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, LoaderCircle, Search, Truck } from "lucide-react";
import type { AdminOrderSummary } from "@/lib/admin/queries";
import { Button } from "@/components/ui/button";
import { Panel, formatCurrency } from "@/components/dashboard/dashboard-ui";

const statusOptions = ["pending", "processing", "shipped", "completed", "cancelled"] as const;

export function OrdersManager({ initialOrders }: { initialOrders: AdminOrderSummary[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
        const haystack = `${order.id} ${order.status} ${profile?.full_name ?? ""}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      }),
    [orders, search],
  );

  const updateStatus = async (orderId: string, status: string) => {
    setLoadingId(orderId);
    setMessage(null);
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    setLoadingId(null);

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setMessage(payload.error ?? "No se pudo actualizar el pedido.");
      return;
    }

    setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status } : order)));
    setMessage("Pedido actualizado.");
  };

  return (
    <Panel
      title="Pedidos"
      description="Seguimiento de compras y cambios de estado."
      action={<span className="inline-flex items-center gap-2 text-sm text-zinc-400"><Truck className="h-4 w-4" /> {orders.length} pedidos</span>}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            className="h-12 w-full rounded-full border border-white/10 bg-white/5 pl-11 pr-4 text-sm placeholder:text-zinc-500"
            placeholder="Buscar pedido o cliente"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        {message ? <p className="text-sm text-zinc-400">{message}</p> : null}
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-zinc-400">
            <tr>
              <th className="px-5 py-4">Pedido</th>
              <th className="px-5 py-4">Cliente</th>
              <th className="px-5 py-4">Estado</th>
              <th className="px-5 py-4">Total</th>
              <th className="px-5 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => {
              const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
              return (
                <tr key={order.id} className="border-t border-white/10">
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium text-white">{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-zinc-400">{new Date(order.created_at).toLocaleString("es-AR")}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">{profile?.full_name ?? "Cliente"}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">{order.status}</span>
                  </td>
                  <td className="px-5 py-4">{formatCurrency(Number(order.total ?? 0))}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" asChild>
                        <Link href={`/admin/orders/${order.id}`}>Ver</Link>
                      </Button>
                      {statusOptions.map((status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant={status === "shipped" ? "default" : "ghost"}
                          disabled={loadingId === order.id || order.status === status}
                          onClick={() => void updateStatus(order.id, status)}
                        >
                          {status === "pending" ? <Clock3 className="mr-1 h-4 w-4" /> : null}
                          {status === "shipped" ? <Truck className="mr-1 h-4 w-4" /> : null}
                          {status === "completed" ? <CheckCircle2 className="mr-1 h-4 w-4" /> : null}
                          {status}
                        </Button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filteredOrders.length === 0 ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          No hay pedidos que coincidan.
        </div>
      ) : null}
    </Panel>
  );
}
