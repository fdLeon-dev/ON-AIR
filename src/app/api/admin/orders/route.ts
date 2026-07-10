import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const body = await request.json();
  const orderId = String(body.orderId ?? "");
  const status = String(body.status ?? "");

  if (!orderId || !status) {
    return NextResponse.json({ error: "orderId y status son requeridos" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.is_admin) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

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
