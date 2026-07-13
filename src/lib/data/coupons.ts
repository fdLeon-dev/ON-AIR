import { readStorageJson, writeStorageJson } from "@/lib/data/storage-json";

const STORAGE_COUPONS_OBJECT = "app-data/coupons.json";

export interface Coupon {
  id: string;
  code: string;
  label: string;
  discount: number;
  active: boolean;
  expiresAt?: string;
}

export const defaultCoupons: Coupon[] = [
  { id: "peak10", code: "PEAK10", label: "10% off", discount: 10, active: true },
  { id: "welcome20", code: "WELCOME20", label: "20% off", discount: 20, active: true },
];

function normalizeCoupon(value: Partial<Coupon> & { id?: string }): Coupon {
  return {
    id: value.id ?? crypto.randomUUID(),
    code: String(value.code ?? "").toUpperCase(),
    label: String(value.label ?? `${Number(value.discount ?? 0)}% off`),
    discount: Number(value.discount ?? 0),
    active: value.active !== false,
    expiresAt: typeof value.expiresAt === "string" ? value.expiresAt : undefined,
  };
}

export async function loadCoupons(): Promise<Coupon[]> {
  const remoteCoupons = await readStorageJson<unknown[]>(STORAGE_COUPONS_OBJECT);
  if (!Array.isArray(remoteCoupons)) return defaultCoupons;

  return remoteCoupons
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry) => normalizeCoupon(entry as Partial<Coupon>));
}

export async function saveCoupons(coupons: Coupon[]) {
  await writeStorageJson(STORAGE_COUPONS_OBJECT, coupons.map(normalizeCoupon));
  return coupons.map(normalizeCoupon);
}
