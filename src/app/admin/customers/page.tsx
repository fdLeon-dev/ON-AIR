import { Users } from "lucide-react";
import { Panel, StatCard, formatCurrency } from "@/components/dashboard/dashboard-ui";
import { loadAdminOverview } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const overview = await loadAdminOverview();
  const activeCustomers = overview.customers.filter((customer) => customer.orders > 0);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Clientes" value={overview.customers.length} helpText="Perfiles encontrados" tone="emerald" />
        <StatCard label="Clientes activos" value={activeCustomers.length} helpText="Con al menos una compra" tone="sky" />
        <StatCard label="Valor total" value={formatCurrency(activeCustomers.reduce((sum, customer) => sum + customer.total, 0))} helpText="Compras registradas" tone="amber" />
      </section>

      <Panel title="Clientes" description="Listado de usuarios con actividad en pedidos.">
        <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5 text-zinc-400">
              <tr>
                <th className="px-5 py-4">Cliente</th>
                <th className="px-5 py-4">Pedidos</th>
                <th className="px-5 py-4">Total gastado</th>
              </tr>
            </thead>
            <tbody>
              {overview.customers.map((customer) => (
                <tr key={customer.id} className="border-t border-white/10">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-zinc-500" />
                      <div>
                        <p className="font-medium text-white">{customer.full_name ?? "Cliente"}</p>
                        <p className="text-xs text-zinc-400">{customer.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">{customer.orders}</td>
                  <td className="px-5 py-4">{formatCurrency(customer.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
