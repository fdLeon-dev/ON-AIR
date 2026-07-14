import { createServerSupabaseClient } from "@/lib/supabase/server";

const TABLE_NAME = "banners";

export interface StoreBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  href: string;
  active: boolean;
}

export const defaultBanners: StoreBanner[] = [
  {
    id: "hero-collection",
    title: "Nueva colección performance",
    subtitle: "Texturas premium y cortes pensados para moverse con intención.",
    imageUrl: "/peak.png",
    href: "/catalog",
    active: true,
  },
];

function mapRowToBanner(row: Record<string, unknown>): StoreBanner {
  return {
    id: String(row.id ?? crypto.randomUUID()),
    title: String(row.title ?? ""),
    subtitle: String(row.subtitle ?? ""),
    imageUrl: String(row.image_url ?? ""),
    href: String(row.href ?? "/catalog"),
    active: Boolean(row.active ?? true),
  };
}

export async function loadBanners(): Promise<StoreBanner[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from(TABLE_NAME).select("*").order("created_at", { ascending: false });
  if (error || !Array.isArray(data) || data.length === 0) return defaultBanners;
  return data.map((row) => mapRowToBanner(row as Record<string, unknown>));
}

export async function saveBanners(banners: StoreBanner[]) {
  const supabase = await createServerSupabaseClient();
  const rows = banners.map((banner) => ({
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle,
    image_url: banner.imageUrl,
    href: banner.href,
    active: banner.active,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from(TABLE_NAME).upsert(rows, { onConflict: "id" });
  if (error) {
    throw error;
  }
  return banners;
}
