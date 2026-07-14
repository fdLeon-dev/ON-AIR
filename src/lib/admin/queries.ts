import { createServerSupabaseClient } from "@/lib/supabase/server";
import { loadProducts } from "@/lib/data/persistence";
import { loadCoupons } from "@/lib/data/coupons";
import { loadStoreSettings } from "@/lib/data/store-settings";

export type AdminOrderSummary = {
  id: string;
  status: string;
  total: number;
  payment_status: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name?: string | null;
  }[] | null;
};

export type RevenuePoint = {
  label: string;
  revenue: number;
  orders: number;
};

export async function loadAdminOverview() {
  const supabase = await createServerSupabaseClient();
  const [products, coupons, settings, ordersResponse, profilesResponse] = await Promise.all([
    loadProducts(),
    loadCoupons(),
    loadStoreSettings(),
    supabase.from("orders").select("id, status, total, payment_status, created_at, user_id, profiles(full_name)").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, avatar_url, is_admin, created_at").order("created_at", { ascending: false }),
  ]);

  const orders = (ordersResponse.data ?? []) as AdminOrderSummary[];
  const profiles = profilesResponse.data ?? [];
  const customerMap = new Map<string, { full_name?: string | null; total: number; orders: number; created_at?: string }>();

  for (const order of orders) {
    const profile = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
    const current = customerMap.get(order.user_id) ?? {
      full_name: profile?.full_name ?? null,
      total: 0,
      orders: 0,
    };
    current.total += Number(order.total ?? 0);
    current.orders += 1;
    customerMap.set(order.user_id, current);
  }

  for (const profile of profiles) {
    if (!profile?.is_admin && !customerMap.has(profile.id)) {
      customerMap.set(profile.id, {
        full_name: profile.full_name ?? null,
        total: 0,
        orders: 0,
        created_at: profile.created_at,
      });
    }
  }

  const revenueByDay = new Map<string, { revenue: number; orders: number }>();
  for (const order of orders.slice(0, 30).reverse()) {
    const label = new Date(order.created_at).toLocaleDateString("es-AR", { month: "short", day: "numeric" });
    const current = revenueByDay.get(label) ?? { revenue: 0, orders: 0 };
    current.revenue += Number(order.total ?? 0);
    current.orders += 1;
    revenueByDay.set(label, current);
  }

  const categoryCount = new Map<string, number>();
  const brandCount = new Map<string, number>();
  const lowStockProducts = products.filter((product) => product.stock <= 5).slice(0, 6);

  for (const product of products) {
    categoryCount.set(product.category, (categoryCount.get(product.category) ?? 0) + 1);
    brandCount.set(product.brand, (brandCount.get(product.brand) ?? 0) + 1);
  }

  return {
    products,
    coupons,
    settings,
    orders,
    customers: Array.from(customerMap.entries())
      .map(([id, customer]) => ({ id, ...customer }))
      .sort((left, right) => right.orders - left.orders || right.total - left.total),
    revenueSeries: Array.from(revenueByDay.entries()).map(([label, value]) => ({ label, ...value })),
    categorySummary: Array.from(categoryCount.entries()).map(([label, count]) => ({ label, count })),
    brandSummary: Array.from(brandCount.entries()).map(([label, count]) => ({ label, count })),
    lowStockProducts,
  };
}

export async function loadAdminOrders() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`id, status, total, payment_status, created_at, user_id, profiles(full_name)`)
    .order("created_at", { ascending: false });

  return { orders: (data ?? []) as AdminOrderSummary[], error };
}

export async function loadAdminCustomers() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("profiles").select("id, full_name, avatar_url, is_admin, created_at").order("created_at", { ascending: false });
  return { customers: data ?? [], error };
}
