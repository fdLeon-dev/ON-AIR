import { loadStoreSettings } from "@/lib/data/store-settings";
import { StoreSettingsEditor } from "@/components/dashboard/store-settings-editor";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await loadStoreSettings();
  return <StoreSettingsEditor initialSettings={settings} />;
}
