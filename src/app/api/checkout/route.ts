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

  const orderItems: Array<{
    order_id: string;
    product_id: string;
    quantity: number;
    price_at_purchase: number;
    size?: string;
    color?: string;
    short_description?: string;
  }> = [];

  const isUuid = (value: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);

  for (const item of body.items as Array<{ id?: string; productId?: string; quantity: number; size?: string; color?: string; shortDescription?: string }>) {
    const quantity = Number(item.quantity);
    const itemRef = item.productId ?? item.id;
    if (!itemRef || !Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ error: "Cada item del carrito debe tener id y cantidad válidos" }, { status: 400 });
    }

    const productQuery = isUuid(itemRef)
      ? supabase.from("products").select("id, price, offer_price").eq("id", itemRef)
      : supabase.from("products").select("id, price, offer_price").eq("slug", itemRef);

    const { data: product, error: productError } = await productQuery.maybeSingle();

    if (productError || !product) {
      return NextResponse.json({ error: `Producto no encontrado en la base de datos: ${itemRef}` }, { status: 400 });
    }

    const priceAtPurchase = Number(product.offer_price ?? product.price ?? 0);
    if (!Number.isFinite(priceAtPurchase) || priceAtPurchase < 0) {
      return NextResponse.json({ error: `Precio inválido para el producto: ${itemRef}` }, { status: 400 });
    }

    orderItems.push({
      order_id: "",
      product_id: product.id,
      quantity,
      price_at_purchase: priceAtPurchase,
      size: item.size,
      color: item.color,
      short_description: item.shortDescription,
    });
  }

  const total = orderItems.reduce((sum, item) => sum + item.price_at_purchase * item.quantity, 0);
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

  const rowsToInsert = orderItems.map((item) => ({ ...item, order_id: order.id }));
  const { error: itemsError } = await supabase.from("order_items").insert(rowsToInsert);

  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    orderId: order.id,
    paymentMethods: ["Mercado Pago", "Stripe", "Transferencia bancaria"],
    received: body,
  });
}
