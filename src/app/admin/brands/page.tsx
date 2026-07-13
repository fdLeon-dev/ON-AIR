import { loadStoreSettings } from "@/lib/data/store-settings";
import { TaxonomyEditor } from "@/components/dashboard/taxonomy-editor";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  const settings = await loadStoreSettings();
  return (
    <TaxonomyEditor
      title="Marcas"
      description="Administra las marcas que utiliza el catálogo."
      field="brands"
      initialItems={settings.brands}
      settings={settings}
    />
  );
}
