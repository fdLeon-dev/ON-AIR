"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";

export type AdminOrderProfile = {
  full_name?: string;
  email?: string;
};

export type AdminOrderSummary = {
  id: string;
  status: string;
  total: number;
  payment_status: string;
  created_at: string;
  user_id: string;
  profiles?: AdminOrderProfile[];
};

const statusOptions = [
  { value: "pending", label: "Pendiente" },
  { value: "processing", label: "En preparación" },
  { value: "shipped", label: "Enviado" },
  { value: "completed", label: "Completado" },
  { value: "cancelled", label: "Cancelado" },
];

export function AdminOrdersTable({ orders }: { orders: AdminOrderSummary[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [statusByOrder, setStatusByOrder] = useState<Record<string, string>>(
    Object.fromEntries(orders.map((order) => [order.id, order.status])),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
        const customerValue = profile?.full_name ?? profile?.email ?? "";
        const normalizedSearch = search.toLowerCase();
        const matchesSearch =
          order.id.toLowerCase().includes(normalizedSearch) ||
          customerValue.toLowerCase().includes(normalizedSearch);

        const matchesStatus = statusFilter ? order.status === statusFilter : true;

        return matchesSearch && matchesStatus;
      }),
    [orders, search, statusFilter],
  );

  const handleUpdateStatus = async (orderId: string) => {
    const newStatus = statusByOrder[orderId];
    setMessage(null);
    setLoadingOrderId(orderId);

    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status: newStatus }),
    });

    const data = await response.json();
    setLoadingOrderId(null);

    if (!response.ok) {
      setMessage(data.error ?? "Error al actualizar el estado del pedido.");
      return;
    }

    setMessage(`Pedido ${orderId} actualizado a ${newStatus}.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Pedidos</p>
          <p className="text-sm text-zinc-300">Busca por pedido o cliente y filtra por estado.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar pedido o cliente"
            className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-white/20 focus:outline-none sm:w-80"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-white/20 focus:outline-none sm:w-64"
          >
            <option value="">Todos los estados</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-black text-white">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}

      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/80">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-zinc-400">
            <tr>
              <th className="px-6 py-4">Pedido</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Pago</th>
              <th className="px-6 py-4">Creado</th>
              <th className="px-6 py-4">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-zinc-400">
                  No se encontraron pedidos con esos filtros.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
                const customer = profile?.full_name ?? profile?.email ?? "Usuario";
                const selectedStatus = statusByOrder[order.id] ?? order.status;
                const orderDate = new Date(order.created_at).toLocaleDateString("es-AR");

                return (
                  <tr key={order.id} className="border-t border-white/10">
                    <td className="px-6 py-4 font-medium text-white">
                      <Link href={`/admin/orders/${order.id}`} className="text-white hover:text-zinc-200">
                        {order.id}
                      </Link>
                    </td>
                    <td className="px-6 py-4">{customer}</td>
                    <td className="px-6 py-4">{formatCurrency(order.total)}</td>
                    <td className="px-6 py-4">
                      <select
                        value={selectedStatus}
                        onChange={(event) =>
                          setStatusByOrder((current) => ({ ...current, [order.id]: event.target.value }))
                        }
                        className="w-full rounded-full border border-white/10 bg-black/90 px-3 py-2 text-sm text-white outline-none"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value} className="bg-black text-white">
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">{order.payment_status}</td>
                    <td className="px-6 py-4">{orderDate}</td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        disabled={loadingOrderId === order.id || selectedStatus === order.status}
                        onClick={() => void handleUpdateStatus(order.id)}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {loadingOrderId === order.id ? "Guardando..." : "Guardar"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
