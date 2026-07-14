import { NextResponse } from "next/server";
import { resolveAdminAccess } from "@/lib/admin/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const body = await request.json();
  const orderId = String(body.orderId ?? "");
  const status = String(body.status ?? "");

  if (!orderId || !status) {
    return NextResponse.json({ error: "orderId y status son requeridos" }, { status: 400 });
  }

  const { user, isAdmin } = await resolveAdminAccess();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!isAdmin) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: existingOrder, error: readError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (readError || !existingOrder) {
    return NextResponse.json({ error: readError?.message ?? "Pedido no encontrado" }, { status: 404 });
  }

  const oldStatus = existingOrder.status;
  const { data, error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select("id, status")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "No se pudo actualizar el pedido" }, { status: 500 });
  }

  const historyNote = String(body.note ?? `Estado actualizado a ${status}`);

  const { error: historyError } = await supabase.from("order_histories").insert({
    order_id: orderId,
    admin_id: user.id,
    old_status: oldStatus,
    new_status: status,
    notes: historyNote,
  });

  if (historyError) {
    return NextResponse.json({ error: historyError.message }, { status: 500 });
  }

  return NextResponse.json({ order: data });
}
