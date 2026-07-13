import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminOrdersTable, type AdminOrderSummary } from "@/components/admin/admin-orders-table";

export default async function AdminOrdersPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const { data, error } = await supabase
    .from("orders")
    .select(`id, status, total, payment_status, created_at, user_id, profiles(full_name)`)
    .order("created_at", { ascending: false }) as { data: AdminOrderSummary[] | null; error: { message: string } | null };

  const orders = data ?? [];

  if (error) {
    return <p className="text-sm text-red-400">No se pudieron cargar los pedidos: {error.message}</p>;
  }

  return (
    <div className="space-y-8">
      <AdminOrdersTable orders={orders} />
    </div>
  );
}
