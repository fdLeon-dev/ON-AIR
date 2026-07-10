import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-black px-6 py-16 text-white">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-sm text-red-400">Debes iniciar sesión como administrador.</p>
        </div>
      </div>
    );
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, total, status, payment_status, created_at")
    .order("created_at", { ascending: false });

  const { data: products, error: productsError } = await supabase.from("products").select("stock, price");

  const orderCount = orders?.length ?? 0;
  const pendingCount = orders?.filter((order) => order.status === "pending").length ?? 0;
  const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total), 0) ?? 0;
  const productCount = products?.length ?? 0;
  const totalStock = products?.reduce((sum, product) => sum + Number(product.stock), 0) ?? 0;
  const estimatedRevenue = products?.reduce((sum, product) => sum + Number(product.price), 0) ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Dashboard</p>
          <h1 className="text-3xl font-semibold">Panel administrativo</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/products" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:text-white">Gestionar productos</Link>
          <Link href="/admin/orders" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:text-white">Ver pedidos</Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6">
          <p className="text-sm text-zinc-400">Pedidos totales</p>
          <p className="mt-3 text-3xl font-semibold">{orderCount}</p>
          <p className="mt-2 text-sm text-zinc-400">Pendientes: {pendingCount}</p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6">
          <p className="text-sm text-zinc-400">Productos</p>
          <p className="mt-3 text-3xl font-semibold">{productCount}</p>
          <p className="mt-2 text-sm text-zinc-400">Stock total: {totalStock}</p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6">
          <p className="text-sm text-zinc-400">Ingresos pedidos</p>
          <p className="mt-3 text-3xl font-semibold">$ {totalRevenue.toLocaleString("es-AR")}</p>
          <p className="mt-2 text-sm text-zinc-400">Estimado desde órdenes</p>
        </div>
      </div>

      <div className="gap-6 lg:grid lg:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Visión rápida</p>
          <p className="mt-4 text-sm text-zinc-300">Controla el inventario, las órdenes más recientes y el estado de pago desde el panel central.</p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Acciones</p>
          <ul className="mt-4 space-y-3 text-sm text-zinc-300">
            <li className="flex items-center gap-2">• Revisa pedidos en tiempo real</li>
            <li className="flex items-center gap-2">• Actualiza el estado de cada orden</li>
            <li className="flex items-center gap-2">• Gestiona productos y existencias</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
