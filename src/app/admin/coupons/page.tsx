import { loadCoupons } from "@/lib/data/coupons";
import { CouponsManager } from "@/components/dashboard/coupons-manager";
import { loadProducts } from "@/lib/data/persistence";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const [coupons, products] = await Promise.all([loadCoupons(), loadProducts()]);
  return <CouponsManager initialCoupons={coupons} initialProducts={products} />;
}
