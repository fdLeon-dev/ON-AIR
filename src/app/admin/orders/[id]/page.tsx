import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { AdminOrderQuickSend } from "@/components/admin/admin-order-quick-send";

type OrderProfile = {
  full_name?: string;
  email?: string;
};

type OrderItemDetail = {
  quantity: number;
  price_at_purchase: number;
  products?: {
    slug?: string;
    name?: string;
    images?: string[];
  }[];
};

type OrderHistoryEntry = {
  id: string;
  old_status: string;
  new_status: string;
  notes: string | null;
  created_at: string;
  profiles?: {
    full_name?: string;
    email?: string;
  }[];
};

type OrderDetail = {
  id: string;
  status: string;
  total: number;
  payment_status: string;
  created_at: string;
  shipping_address: Record<string, unknown> | null;
  user_id: string;
  profiles?: OrderProfile[];
  order_items?: OrderItemDetail[];
  order_histories?: OrderHistoryEntry[];
};

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/admin-login");
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, status, total, payment_status, created_at, shipping_address, user_id, profiles(full_name), order_items(quantity, price_at_purchase, products(slug, name, image1, image2, image3, image4)), order_histories(id, old_status, new_status, notes, created_at, profiles(full_name))`,
    )
    .eq("id", params.id)
    .single() as { data: OrderDetail | null; error: any };

  if (error || !data) {
    notFound();
  }

  const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
  const items = data.order_items ?? [];
  const shipping = data.shipping_address ?? {};
  const history = data.order_histories ?? [];

  return (
    <div className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Pedido</p>
            <h1 className="text-3xl font-semibold">{data.id}</h1>
          </div>
          <Link href="/admin/orders" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition hover:text-white">
            Volver a pedidos
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Estado</p>
                <p className="mt-2 text-lg font-semibold text-white">{data.status}</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Pago</p>
                <p className="mt-2 text-lg font-semibold text-white">{data.payment_status}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Cliente</p>
                <p className="mt-3 text-sm text-zinc-300">{profile?.full_name ?? profile?.email ?? "Usuario"}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Fecha</p>
                <p className="mt-3 text-sm text-zinc-300">{new Date(data.created_at).toLocaleDateString("es-AR")}</p>
              </div>
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Dirección de envío</p>
              <div className="mt-3 space-y-2 text-sm text-zinc-300">
                {Object.entries(shipping).map(([key, value]) => (
                  <p key={key}>
                    <span className="font-semibold text-white">{key}:</span> {String(value)}
                  </p>
                ))}
              </div>
            </div>

            <AdminOrderQuickSend orderId={data.id} currentStatus={data.status} />
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Resumen del pedido</p>
            <div className="mt-6 space-y-4 text-sm text-zinc-300">
              <p>
                <span className="font-semibold text-white">Total:</span> {formatCurrency(data.total)}
              </p>
              <p>
                <span className="font-semibold text-white">Cliente ID:</span> {data.user_id}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Items del pedido</p>
          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/50">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/5 text-zinc-400">
                <tr>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Cantidad</th>
                  <th className="px-6 py-4">Precio unitario</th>
                  <th className="px-6 py-4">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const product = item.products?.[0];
                  const productName = product?.name ?? "Producto";
                  const productSlug = product?.slug;
                  const p = product as any;
                  const productImage = p?.image1 ?? p?.image2 ?? p?.image3 ?? p?.image4 ?? null;
                  const subtotal = item.quantity * item.price_at_purchase;

                  return (
                    <tr key={`${data.id}-${index}`} className="border-t border-white/10">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {productImage ? (
                            <img src={productImage} alt={productName} className="h-12 w-12 rounded-lg object-cover" />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-zinc-900 text-xs text-zinc-400">No img</div>
                          )}
                          {productSlug ? (
                            <Link href={`/product/${productSlug}`} className="font-medium text-white transition hover:text-emerald-300">
                              {productName}
                            </Link>
                          ) : (
                            <span className="font-medium text-white">{productName}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{item.quantity}</td>
                      <td className="px-6 py-4">{formatCurrency(item.price_at_purchase)}</td>
                      <td className="px-6 py-4">{formatCurrency(subtotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Historial de cambios</p>
              <p className="mt-2 text-sm text-zinc-300">Registro de cada cambio de estado y nota administrativa.</p>
            </div>
          </div>
          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/50">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/5 text-zinc-400">
                <tr>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Admin</th>
                  <th className="px-6 py-4">De</th>
                  <th className="px-6 py-4">A</th>
                  <th className="px-6 py-4">Nota</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-zinc-400">
                      No hay historial de cambios para este pedido.
                    </td>
                  </tr>
                ) : (
                  history.map((entry) => {
                    const adminProfile = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles;
                    const adminName = adminProfile?.full_name ?? adminProfile?.email ?? "Administrador";

                    return (
                      <tr key={entry.id} className="border-t border-white/10">
                        <td className="px-6 py-4">{new Date(entry.created_at).toLocaleString("es-AR")}</td>
                        <td className="px-6 py-4">{adminName}</td>
                        <td className="px-6 py-4">{entry.old_status}</td>
                        <td className="px-6 py-4">{entry.new_status}</td>
                        <td className="px-6 py-4">{entry.notes ?? "—"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
