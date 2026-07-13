import Link from "next/link";
import { AlertTriangle, Package2 } from "lucide-react";
import { Panel, StatCard, formatCurrency } from "@/components/dashboard/dashboard-ui";
import { loadProducts } from "@/lib/data/persistence";

export const dynamic = "force-dynamic";

export default async function AdminStockPage() {
  const products = await loadProducts();
  const lowStock = products.filter((product) => product.stock <= 5);
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const inventoryValue = products.reduce((sum, product) => sum + Number(product.price ?? 0) * product.stock, 0);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Stock total" value={totalStock} helpText="Unidades disponibles" tone="emerald" />
        <StatCard label="Productos críticos" value={lowStock.length} helpText="Requieren reposición" tone="amber" />
        <StatCard label="Valor estimado" value={formatCurrency(inventoryValue)} helpText="Inventario valuado" tone="sky" />
      </section>

      <Panel title="Inventario" description="Productos con prioridad de reposición y control manual.">
        <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5 text-zinc-400">
              <tr>
                <th className="px-5 py-4">Producto</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4">Valor</th>
                <th className="px-5 py-4">Acción</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t border-white/10">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Package2 className="h-4 w-4 text-zinc-500" />
                      <div>
                        <p className="font-medium text-white">{product.name}</p>
                        <p className="text-xs text-zinc-400">{product.brand} · {product.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs ${product.stock <= 5 ? "bg-amber-500/15 text-amber-200" : "bg-emerald-500/15 text-emerald-200"}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-5 py-4">{formatCurrency(product.stock * Number(product.price ?? 0))}</td>
                  <td className="px-5 py-4">
                    <Link href="/admin/products" className="text-sm text-emerald-300 hover:text-emerald-200">
                      Editar producto
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {lowStock.length > 0 ? (
          <div className="mt-5 flex items-start gap-3 rounded-[1.5rem] border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <p>{lowStock.length} productos están por debajo del umbral recomendado de stock.</p>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
