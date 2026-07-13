import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusActions } from "@/components/dashboard/order-status-actions";
import { Panel, formatCurrency } from "@/components/dashboard/dashboard-ui";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveAdminAccess } from "@/lib/admin/auth";

type OrderDetail = {
  id: string;
  status: string;
  total: number;
  payment_status: string;
  created_at: string;
  shipping_address: Record<string, unknown> | null;
  user_id: string;
  profiles?: { full_name?: string }[] | { full_name?: string };
  order_items?: {
    quantity: number;
    price_at_purchase: number;
    products?: {
      slug?: string;
      name?: string;
      image1?: string;
      image2?: string;
      image3?: string;
      image4?: string;
    }[];
  }[];
  order_histories?: {
    id: string;
    old_status: string;
    new_status: string;
    notes: string | null;
    created_at: string;
    profiles?: { full_name?: string }[] | { full_name?: string };
  }[];
};

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, isAdmin } = await resolveAdminAccess();
  if (!user || !isAdmin) notFound();

  const supabase = await createServerSupabaseClient({ serviceRole: true });
  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, status, total, payment_status, created_at, shipping_address, user_id, profiles(full_name), order_items(quantity, price_at_purchase, products(slug, name, image1, image2, image3, image4)), order_histories(id, old_status, new_status, notes, created_at, profiles(full_name))`,
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const order = data as OrderDetail;
  const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
  const shipping = order.shipping_address ?? {};
  const items = order.order_items ?? [];
  const history = order.order_histories ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Pedido</p>
          <h1 className="mt-2 text-3xl font-semibold">{order.id}</h1>
        </div>
        <Link href="/admin/orders" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:text-white">
          Volver a pedidos
        </Link>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Resumen" description="Estado actual, cliente y dirección de entrega.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Cliente</p>
              <p className="mt-3 text-sm text-white">{profile?.full_name ?? "Cliente"}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Fecha</p>
              <p className="mt-3 text-sm text-white">{new Date(order.created_at).toLocaleString("es-AR")}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Pago</p>
              <p className="mt-3 text-sm text-white">{order.payment_status}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Total</p>
              <p className="mt-3 text-sm text-white">{formatCurrency(Number(order.total ?? 0))}</p>
            </div>
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Dirección</p>
            <div className="mt-3 space-y-2 text-sm text-zinc-300">
              {Object.entries(shipping).map(([key, value]) => (
                <p key={key}>
                  <span className="font-medium text-white">{key}:</span> {String(value)}
                </p>
              ))}
            </div>
          </div>

          <OrderStatusActions orderId={order.id} currentStatus={order.status} />
        </Panel>

        <Panel title="Items" description="Detalle de productos comprados.">
          <div className="space-y-4">
            {items.map((item, index) => {
              const product = item.products?.[0];
              const image = product?.image1 ?? product?.image2 ?? product?.image3 ?? product?.image4 ?? "";
              return (
                <div key={`${order.id}-${index}`} className="flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                  {image ? <img src={image} alt={product?.name ?? "Producto"} className="h-16 w-16 rounded-2xl object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900 text-xs text-zinc-400">No img</div>}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">{product?.name ?? "Producto"}</p>
                    <p className="text-sm text-zinc-400">{item.quantity} unidades · {formatCurrency(item.price_at_purchase)}</p>
                  </div>
                  <div className="text-sm text-zinc-300">{formatCurrency(item.quantity * item.price_at_purchase)}</div>
                </div>
              );
            })}
          </div>
        </Panel>
      </section>

      <Panel title="Historial" description="Cambios de estado y notas administrativas.">
        <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5 text-zinc-400">
              <tr>
                <th className="px-5 py-4">Fecha</th>
                <th className="px-5 py-4">De</th>
                <th className="px-5 py-4">A</th>
                <th className="px-5 py-4">Nota</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-zinc-400">Sin historial registrado.</td>
                </tr>
              ) : history.map((entry) => {
                const admin = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles;
                return (
                  <tr key={entry.id} className="border-t border-white/10">
                    <td className="px-5 py-4 text-zinc-300">{new Date(entry.created_at).toLocaleString("es-AR")}</td>
                    <td className="px-5 py-4">{entry.old_status}</td>
                    <td className="px-5 py-4">{entry.new_status}</td>
                    <td className="px-5 py-4">
                      <div>
                        <p>{entry.notes ?? "—"}</p>
                        <p className="text-xs text-zinc-500">{admin?.full_name ?? "Administrador"}</p>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
