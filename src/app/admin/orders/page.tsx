import { AlertCircle } from "lucide-react";
import { OrdersManager } from "@/components/dashboard/orders-manager";
import { Panel, StatCard, formatCurrency } from "@/components/dashboard/dashboard-ui";
import { loadAdminOrders } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const { orders, error } = await loadAdminOrders();

  if (error) {
    return (
      <Panel title="Pedidos" description="No se pudieron cargar los pedidos.">
        <div className="flex items-center gap-2 text-sm text-red-300">
          <AlertCircle className="h-4 w-4" />
          {(error as { message?: string }).message ?? "Error desconocido"}
        </div>
      </Panel>
    );
  }

  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
  const pendingOrders = orders.filter((order) => order.status === "pending").length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Pedidos totales" value={orders.length} helpText={`${pendingOrders} pendientes`} tone="emerald" />
        <StatCard label="Ingresos" value={formatCurrency(totalRevenue)} helpText="Monto acumulado" tone="sky" />
        <StatCard label="Pendientes" value={pendingOrders} helpText="Esperan revisión" tone="amber" />
      </section>

      <OrdersManager initialOrders={orders} />
    </div>
  );
}
