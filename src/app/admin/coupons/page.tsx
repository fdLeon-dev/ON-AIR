import { loadCoupons } from "@/lib/data/coupons";
import { CouponsManager } from "@/components/dashboard/coupons-manager";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const coupons = await loadCoupons();
  return <CouponsManager initialCoupons={coupons} />;
}
