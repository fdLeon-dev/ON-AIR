import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase no está configurado" }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "El carrito está vacío. Añade items antes de confirmar el pedido." }, { status: 400 });
  }

  const total = body.items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      status: "pending",
      total,
      shipping_address: body.shippingAddress ?? {},
      payment_status: "pending",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message ?? "No se pudo crear el pedido" }, { status: 500 });
  }

  // Resolve product identifiers: allow slugs (local) by resolving to DB UUIDs
  const orderItems: any[] = [];
  for (const item of body.items as { id: string; price: number; quantity: number }[]) {
    let productId = item.id;
    const isUuid = (val: string) => /^[0-9a-fA-F-]{36}$/.test(val);
    if (!isUuid(productId)) {
      const { data: prod, error: prodError } = await supabase.from("products").select("id").eq("slug", productId).maybeSingle();
      if (prod && prod.id) {
        productId = prod.id;
      } else {
        return NextResponse.json({ error: `Producto no encontrado en la base de datos: ${productId}` }, { status: 400 });
      }
    }

    orderItems.push({
      order_id: order.id,
      product_id: productId,
      quantity: item.quantity,
      price_at_purchase: item.price,
    });
  }

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    orderId: order.id,
    paymentMethods: ["Mercado Pago", "Stripe", "Transferencia bancaria"],
    received: body,
  });
}
