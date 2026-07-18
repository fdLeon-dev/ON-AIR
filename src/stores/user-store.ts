import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";

interface OrderSummary {
  id: string;
  status: string;
  total: number;
  date: string;
  subtotal: number;
  discountAmount: number;
  coupon: {
    code: string;
    label: string;
    discount: number;
  } | null;
  items: Array<{
    quantity: number;
    priceAtPurchase: number;
    size: string;
    color: string;
    productName: string;
    productImage: string;
    wasOnPromotion: boolean;
    regularPrice: number;
  }>;
}

interface UserStore {
  profile: {
    name: string;
    email: string;
    is_admin?: boolean;
  };
  orders: OrderSummary[];
  setProfile: (profile: { name: string; email: string }) => void;
  addOrder: (order: OrderSummary) => void;
  syncFromSupabase: () => Promise<void>;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      profile: {
        name: "",
        email: "",
        is_admin: false,
      },
      orders: [],
      setProfile: (profile) => set({ profile }),
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
      syncFromSupabase: async () => {
        try {
          const supabase = createClient();
          const { data: userResult } = await supabase.auth.getUser();
          const user = userResult?.user ?? null;
          if (!user) return;

          const { data: profileData } = await supabase.from("profiles").select("full_name, is_admin").eq("id", user.id).maybeSingle();

          const { data: ordersData } = await supabase
            .from("orders")
            .select("id, status, total, created_at, shipping_address, order_items(quantity, price_at_purchase, size, color, products(name, image1, price, offer_price))")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          set({
            profile: {
              name: profileData?.full_name ?? user.email ?? "",
              email: user.email ?? "",
              is_admin: profileData?.is_admin ?? false,
            },
            orders: (ordersData ?? []).map((order: any) => {
              const shippingAddress = order.shipping_address && typeof order.shipping_address === "object" ? order.shipping_address : {};
              const coupon = shippingAddress.coupon && typeof shippingAddress.coupon === "object"
                ? {
                    code: String(shippingAddress.coupon.code ?? ""),
                    label: String(shippingAddress.coupon.label ?? shippingAddress.coupon.code ?? ""),
                    discount: Number(shippingAddress.coupon.discount ?? 0),
                  }
                : null;
              const items = Array.isArray(order.order_items)
                ? order.order_items.map((item: any) => {
                    const product = Array.isArray(item.products) ? item.products[0] : item.products;
                    const regularPrice = Number(product?.price ?? 0);
                    const offerPrice = Number(product?.offer_price ?? 0);
                    const hasValidPromo = regularPrice > 0 && offerPrice > 0 && offerPrice < regularPrice;
                    const wasOnPromotion = hasValidPromo && Number(item.price_at_purchase ?? 0) <= offerPrice;
                    return {
                      quantity: Number(item.quantity ?? 0),
                      priceAtPurchase: Number(item.price_at_purchase ?? 0),
                      size: String(item.size ?? ""),
                      color: String(item.color ?? ""),
                      productName: String(product?.name ?? "Producto"),
                      productImage: String(product?.image1 ?? ""),
                      wasOnPromotion,
                      regularPrice,
                    };
                  })
                : [];

              return {
                id: order.id,
                status: order.status,
                total: Number(order.total),
                date: new Date(order.created_at).toLocaleDateString("es-AR"),
                subtotal: Number(shippingAddress.subtotal ?? order.total ?? 0),
                discountAmount: Number(shippingAddress.discountAmount ?? 0),
                coupon,
                items,
              };
            }),
          });
        } catch {
          set({
            profile: {
              name: "",
              email: "",
              is_admin: false,
            },
            orders: [],
          });
        }
      },
    }),
    { name: "peak-sport-user" },
  ),
);
