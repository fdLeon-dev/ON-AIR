import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { loadCoupons } from "@/lib/data/coupons";

type PaymentMethod = "whatsapp_transfer" | "mercado_pago" | "transferencia_bancaria" | "efectivo_entrega";

type CouponPayload = {
  code?: string;
  discount?: number;
  label?: string;
};

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

  const paymentMethod = body.paymentMethod as PaymentMethod | undefined;
  const validMethods: PaymentMethod[] = ["whatsapp_transfer", "mercado_pago", "transferencia_bancaria", "efectivo_entrega"];
  if (!paymentMethod || !validMethods.includes(paymentMethod)) {
    return NextResponse.json({ error: "Selecciona un método de pago válido." }, { status: 400 });
  }

  const shippingAddress = (body.shippingAddress ?? {}) as {
    name?: string;
    email?: string;
    address?: string;
    department?: string;
    city?: string;
  };
  const coupon = (body.coupon ?? null) as CouponPayload | null;
  const normalizedCouponCode = String(coupon?.code ?? "").trim().toUpperCase();

  const department = String(shippingAddress.department ?? "").toLowerCase();
  const city = String(shippingAddress.city ?? "").toLowerCase();
  const isMaldonadoSanCarlos = department.includes("maldonado") && city.includes("san carlos");
  if (paymentMethod === "efectivo_entrega" && !isMaldonadoSanCarlos) {
    return NextResponse.json({ error: "Efectivo al entregar solo está disponible para Maldonado (San Carlos)." }, { status: 400 });
  }

  let resolvedCoupon: { code: string; label: string; discount: number; maxUsesPerUser?: number } | null = null;
  if (normalizedCouponCode) {
    const coupons = await loadCoupons();
    const foundCoupon = coupons.find((entry) => entry.active && entry.code.toUpperCase() === normalizedCouponCode);
    if (!foundCoupon) {
      return NextResponse.json({ error: "El cupón seleccionado no es válido o ya no está activo." }, { status: 400 });
    }

    if (typeof foundCoupon.maxUsesPerUser === "number" && foundCoupon.maxUsesPerUser > 0) {
      const { count, error: usageError } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .contains("shipping_address", { coupon: { code: foundCoupon.code } });

      if (usageError) {
        return NextResponse.json({ error: usageError.message ?? "No se pudo validar el cupón." }, { status: 500 });
      }

      if ((count ?? 0) >= foundCoupon.maxUsesPerUser) {
        return NextResponse.json({ error: `Este cupón puede usarse hasta ${foundCoupon.maxUsesPerUser} vez${foundCoupon.maxUsesPerUser === 1 ? "" : "es"} por usuario.` }, { status: 400 });
      }
    }

    resolvedCoupon = {
      code: foundCoupon.code,
      label: foundCoupon.label,
      discount: foundCoupon.discount,
      maxUsesPerUser: foundCoupon.maxUsesPerUser,
    };
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
      size: item.size ?? "",
      color: item.color ?? "",
      short_description: item.shortDescription ?? "",
    });
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.price_at_purchase * item.quantity, 0);
  const couponDiscount = Number(resolvedCoupon?.discount ?? 0);
  const hasValidCoupon = Boolean(resolvedCoupon?.code) && Number.isFinite(couponDiscount) && couponDiscount > 0 && couponDiscount <= 100;
  const discountAmount = hasValidCoupon ? (subtotal * couponDiscount) / 100 : 0;
  const total = Math.max(0, subtotal - discountAmount);
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      status: "pending",
      total,
      shipping_address: {
        ...shippingAddress,
        paymentMethod,
        subtotal,
        discountAmount,
        coupon: hasValidCoupon
          ? {
              code: String(resolvedCoupon?.code ?? ""),
              label: String(resolvedCoupon?.label ?? resolvedCoupon?.code ?? ""),
              discount: couponDiscount,
              maxUsesPerUser: resolvedCoupon?.maxUsesPerUser ?? null,
            }
          : null,
      },
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
    paymentMethods: ["WhatsApp (transferencia)", "Mercado Pago", "Transferencia bancaria", "Efectivo al entregar"],
    received: body,
  });
}
