import { createServerSupabaseClient } from "@/lib/supabase/server";

const TABLE_NAME = "coupons";

export interface Coupon {
  id: string;
  code: string;
  label: string;
  discount: number;
  active: boolean;
  expiresAt?: string;
  maxUsesPerUser?: number;
}

export const defaultCoupons: Coupon[] = [
  { id: "peak10", code: "PEAK10", label: "10% off", discount: 10, active: true },
  { id: "welcome20", code: "WELCOME20", label: "20% off", discount: 20, active: true },
];

function mapRowToCoupon(row: Record<string, unknown>): Coupon {
  return {
    id: String(row.id ?? crypto.randomUUID()),
    code: String(row.code ?? "").toUpperCase(),
    label: String(row.label ?? `${Number(row.discount ?? 0)}% off`),
    discount: Number(row.discount ?? 0),
    active: Boolean(row.active ?? true),
    expiresAt: typeof row.expires_at === "string" ? row.expires_at : undefined,
    maxUsesPerUser: typeof row.max_uses_per_user === "number" ? row.max_uses_per_user : undefined,
  };
}

export async function loadCoupons(): Promise<Coupon[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from(TABLE_NAME).select("*").order("created_at", { ascending: false });
  if (error || !Array.isArray(data)) return defaultCoupons;
  return data.map((row) => mapRowToCoupon(row as Record<string, unknown>));
}

export async function saveCoupons(coupons: Coupon[]) {
  const supabase = await createServerSupabaseClient();
  const rows = coupons.map((coupon) => ({
    id: coupon.id,
    code: coupon.code.toUpperCase(),
    label: coupon.label,
    discount: coupon.discount,
    active: coupon.active,
    expires_at: coupon.expiresAt ?? null,
    max_uses_per_user: typeof coupon.maxUsesPerUser === "number" ? coupon.maxUsesPerUser : null,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from(TABLE_NAME).upsert(rows, { onConflict: "id" });
  if (error) {
    throw error;
  }
  return coupons;
}
