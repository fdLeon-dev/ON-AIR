import { loadBanners } from "@/lib/data/banners";
import { BannersManager } from "@/components/dashboard/banners-manager";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const banners = await loadBanners();
  return <BannersManager initialBanners={banners} />;
}
