import { readStorageJson, writeStorageJson } from "@/lib/data/storage-json";

const STORAGE_BANNERS_OBJECT = "app-data/banners.json";

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

function normalizeBanner(value: Partial<StoreBanner> & { id?: string }): StoreBanner {
  return {
    id: value.id ?? crypto.randomUUID(),
    title: String(value.title ?? ""),
    subtitle: String(value.subtitle ?? ""),
    imageUrl: String(value.imageUrl ?? ""),
    href: String(value.href ?? "/catalog"),
    active: value.active !== false,
  };
}

export async function loadBanners(): Promise<StoreBanner[]> {
  const remoteBanners = await readStorageJson<unknown[]>(STORAGE_BANNERS_OBJECT);
  if (!Array.isArray(remoteBanners)) return defaultBanners;

  return remoteBanners
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry) => normalizeBanner(entry as Partial<StoreBanner>));
}

export async function saveBanners(banners: StoreBanner[]) {
  await writeStorageJson(STORAGE_BANNERS_OBJECT, banners.map(normalizeBanner));
  return banners.map(normalizeBanner);
}
