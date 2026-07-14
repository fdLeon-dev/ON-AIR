import { ArrowUpRight, Package2, ShoppingCart, Tags, Truck, Users } from "lucide-react";
import { Panel, StatCard, formatCurrency } from "@/components/dashboard/dashboard-ui";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { loadAdminOverview } from "@/lib/admin/queries";

export default async function AdminDashboardPage() {
  const overview = await loadAdminOverview();
  const pendingOrders = overview.orders.filter((order) => order.status === "pending").length;
  const revenue = overview.orders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
  const activeCustomers = overview.customers.filter((customer) => customer.orders > 0).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[2.25rem] border border-white/10 bg-gradient-to-br from-emerald-400/15 via-white/5 to-sky-400/10 p-6">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-200/80">Peak Sport Admin</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Controlamos la operación desde un panel moderno y simple.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-300">
            Esta nueva base reemplaza el panel anterior y centraliza productos, pedidos, clientes, cupones y configuración de tienda.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/admin/products" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black">
              <Package2 className="h-4 w-4" />
              Gestionar productos
            </a>
            <a href="/admin/orders" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white">
              <ShoppingCart className="h-4 w-4" />
              Revisar pedidos
            </a>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Productos" value={overview.products.length} helpText={`${overview.lowStockProducts.length} con stock bajo`} tone="emerald" />
          <StatCard label="Pedidos" value={overview.orders.length} helpText={`${pendingOrders} pendientes de atención`} tone="sky" />
          <StatCard label="Clientes" value={activeCustomers} helpText="Usuarios con compras registradas" tone="amber" />
          <StatCard label="Ingresos" value={formatCurrency(revenue)} helpText={`Cupones activos: ${overview.coupons.filter((coupon) => coupon.active).length}`} tone="rose" />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <RevenueChart data={overview.revenueSeries.slice(-8)} />

        <Panel title="Resumen operativo" description="Lo más importante para tomar decisiones rápidas.">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm text-zinc-400"><ArrowUpRight className="h-4 w-4" /> Crecimiento</div>
              <p className="mt-3 text-2xl font-semibold">+18%</p>
              <p className="mt-1 text-sm text-zinc-400">vs. período anterior</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm text-zinc-400"><Truck className="h-4 w-4" /> Logística</div>
              <p className="mt-3 text-2xl font-semibold">{pendingOrders}</p>
              <p className="mt-1 text-sm text-zinc-400">pedidos pendientes</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm text-zinc-400"><Tags className="h-4 w-4" /> Categorías</div>
              <p className="mt-3 text-2xl font-semibold">{overview.settings.categories.length}</p>
              <p className="mt-1 text-sm text-zinc-400">taxonomías activas</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm text-zinc-400"><Users className="h-4 w-4" /> Clientes</div>
              <p className="mt-3 text-2xl font-semibold">{overview.customers.length}</p>
              <p className="mt-1 text-sm text-zinc-400">perfiles sincronizados</p>
            </div>
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Pedidos recientes" description="Últimos movimientos de compra en la tienda.">
          <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/5 text-zinc-400">
                <tr>
                  <th className="px-5 py-4">Pedido</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4">Total</th>
                  <th className="px-5 py-4">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {overview.orders.slice(0, 6).map((order) => (
                  <tr key={order.id} className="border-t border-white/10">
                    <td className="px-5 py-4 font-medium">{order.id.slice(0, 8)}</td>
                    <td className="px-5 py-4">{order.status}</td>
                    <td className="px-5 py-4">{formatCurrency(Number(order.total ?? 0))}</td>
                    <td className="px-5 py-4 text-zinc-400">{new Date(order.created_at).toLocaleDateString("es-AR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Accesos rápidos" description="Atajos a las secciones más usadas.">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { href: "/admin/products", label: "Productos", icon: <Package2 className="h-4 w-4" /> },
              { href: "/admin/orders", label: "Pedidos", icon: <ShoppingCart className="h-4 w-4" /> },
              { href: "/admin/customers", label: "Clientes", icon: <Users className="h-4 w-4" /> },
              { href: "/admin/settings", label: "Configuración", icon: <Tags className="h-4 w-4" /> },
            ].map((item) => (
              <a key={item.href} href={item.href} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-200">{item.icon}</span>
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-zinc-400">Abrir sección</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
