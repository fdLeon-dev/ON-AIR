import { loadFeaturedCategories } from "@/lib/data/persistence";
import { FeaturedCategoriesManager } from "@/components/dashboard/featured-categories-manager";

export const dynamic = "force-dynamic";

export default async function AdminFeaturedCategoriesPage() {
  const categories = await loadFeaturedCategories(false);

  return <FeaturedCategoriesManager initialCategories={categories} />;
}
