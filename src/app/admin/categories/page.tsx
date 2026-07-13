import { loadStoreSettings } from "@/lib/data/store-settings";
import { TaxonomyEditor } from "@/components/dashboard/taxonomy-editor";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const settings = await loadStoreSettings();
  return (
    <TaxonomyEditor
      title="Categorías"
      description="Edita las categorías visibles en formularios y filtros."
      field="categories"
      initialItems={settings.categories}
      settings={settings}
    />
  );
}
