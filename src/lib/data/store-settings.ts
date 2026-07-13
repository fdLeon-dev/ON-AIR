import { products as fallbackProducts } from "@/lib/data/products";
import { readStorageJson, writeStorageJson } from "@/lib/data/storage-json";

const STORAGE_SETTINGS_OBJECT = "app-data/store-settings.json";

export interface StoreSettings {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  shippingMessage: string;
  currency: string;
  categories: string[];
  brands: string[];
  featuredNote: string;
}

export const defaultStoreSettings: StoreSettings = {
  storeName: "Peak Sport",
  supportEmail: "support@peak-sport.example",
  supportPhone: "+598 0000 0000",
  shippingMessage: "Envíos rápidos en 24/48h y cambios fáciles.",
  currency: "UYU",
  categories: Array.from(new Set(fallbackProducts.map((product) => product.category))),
  brands: Array.from(new Set(fallbackProducts.map((product) => product.brand))),
  featuredNote: "Colecciones premium pensadas para entrenamiento y uso urbano.",
};

function normalizeList(values: unknown, fallback: string[]) {
  const result = Array.isArray(values)
    ? values.map((value) => String(value).trim()).filter(Boolean)
    : fallback;
  return Array.from(new Set(result));
}

export async function loadStoreSettings(): Promise<StoreSettings> {
  const remoteSettings = await readStorageJson<Partial<StoreSettings>>(STORAGE_SETTINGS_OBJECT);
  if (!remoteSettings) return defaultStoreSettings;

  return {
    storeName: typeof remoteSettings.storeName === "string" ? remoteSettings.storeName : defaultStoreSettings.storeName,
    supportEmail: typeof remoteSettings.supportEmail === "string" ? remoteSettings.supportEmail : defaultStoreSettings.supportEmail,
    supportPhone: typeof remoteSettings.supportPhone === "string" ? remoteSettings.supportPhone : defaultStoreSettings.supportPhone,
    shippingMessage: typeof remoteSettings.shippingMessage === "string" ? remoteSettings.shippingMessage : defaultStoreSettings.shippingMessage,
    currency: typeof remoteSettings.currency === "string" ? remoteSettings.currency : defaultStoreSettings.currency,
    categories: normalizeList(remoteSettings.categories, defaultStoreSettings.categories),
    brands: normalizeList(remoteSettings.brands, defaultStoreSettings.brands),
    featuredNote: typeof remoteSettings.featuredNote === "string" ? remoteSettings.featuredNote : defaultStoreSettings.featuredNote,
  };
}

export async function saveStoreSettings(settings: Partial<StoreSettings>) {
  const current = await loadStoreSettings();
  const nextSettings: StoreSettings = {
    storeName: typeof settings.storeName === "string" ? settings.storeName : current.storeName,
    supportEmail: typeof settings.supportEmail === "string" ? settings.supportEmail : current.supportEmail,
    supportPhone: typeof settings.supportPhone === "string" ? settings.supportPhone : current.supportPhone,
    shippingMessage: typeof settings.shippingMessage === "string" ? settings.shippingMessage : current.shippingMessage,
    currency: typeof settings.currency === "string" ? settings.currency : current.currency,
    categories: normalizeList(settings.categories, current.categories),
    brands: normalizeList(settings.brands, current.brands),
    featuredNote: typeof settings.featuredNote === "string" ? settings.featuredNote : current.featuredNote,
  };

  await writeStorageJson(STORAGE_SETTINGS_OBJECT, nextSettings);
  return nextSettings;
}
