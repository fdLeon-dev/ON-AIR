import { createServerSupabaseClient } from "@/lib/supabase/server";
import { products as fallbackProducts } from "@/lib/data/products";

const TABLE_NAME = "store_settings";

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
  const result = Array.isArray(values) ? values.map((value) => String(value).trim()).filter(Boolean) : fallback;
  return Array.from(new Set(result));
}

export async function loadStoreSettings(): Promise<StoreSettings> {
  const supabase = await createServerSupabaseClient({ serviceRole: true });
  const { data } = await supabase.from(TABLE_NAME).select("*").eq("singleton_key", "default").maybeSingle();
  if (!data) return defaultStoreSettings;

  return {
    storeName: typeof data.store_name === "string" ? data.store_name : defaultStoreSettings.storeName,
    supportEmail: typeof data.support_email === "string" ? data.support_email : defaultStoreSettings.supportEmail,
    supportPhone: typeof data.support_phone === "string" ? data.support_phone : defaultStoreSettings.supportPhone,
    shippingMessage: typeof data.shipping_message === "string" ? data.shipping_message : defaultStoreSettings.shippingMessage,
    currency: typeof data.currency === "string" ? data.currency : defaultStoreSettings.currency,
    categories: normalizeList(data.categories, defaultStoreSettings.categories),
    brands: normalizeList(data.brands, defaultStoreSettings.brands),
    featuredNote: typeof data.featured_note === "string" ? data.featured_note : defaultStoreSettings.featuredNote,
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

  const supabase = await createServerSupabaseClient({ serviceRole: true });
  const { error } = await supabase.from(TABLE_NAME).upsert(
    {
      singleton_key: "default",
      store_name: nextSettings.storeName,
      support_email: nextSettings.supportEmail,
      support_phone: nextSettings.supportPhone,
      shipping_message: nextSettings.shippingMessage,
      currency: nextSettings.currency,
      categories: nextSettings.categories,
      brands: nextSettings.brands,
      featured_note: nextSettings.featuredNote,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "singleton_key" },
  );

  if (error) {
    throw error;
  }

  return nextSettings;
}
