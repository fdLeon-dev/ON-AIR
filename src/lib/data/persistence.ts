import { promises as fs } from "fs";
import path from "path";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { products as fallbackProducts } from "@/lib/data/products";
import type { HeroConfig, Product } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const HERO_CONFIG_FILE = path.join(DATA_DIR, "hero-config.json");
const STORAGE_BUCKET = "productos";
const STORAGE_PRODUCTS_OBJECT = "app-data/products.json";
const STORAGE_HERO_OBJECT = "app-data/hero-config.json";

const defaultHeroConfig: HeroConfig = {
  leftCardImages: ["/peak.png", "", ""],
  rightCardImages: ["/peak.png", "", ""],
  carouselEnabled: false,
  transitionMs: 3000,
};

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function getImageFields(raw: any): [string, string, string, string] {
  const images = Array.isArray(raw?.images) ? raw.images : [];
  return [
    String(raw?.image1 ?? images[0] ?? ""),
    String(raw?.image2 ?? images[1] ?? ""),
    String(raw?.image3 ?? images[2] ?? ""),
    String(raw?.image4 ?? images[3] ?? ""),
  ];
}

function normalizeProduct(raw: any): Product {
  const [image1, image2, image3, image4] = getImageFields(raw);
  return {
    id: String(raw.id ?? crypto.randomUUID()),
    slug: String(raw.slug ?? String(raw.name ?? "")).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    name: String(raw.name ?? ""),
    brand: String(raw.brand ?? "Peak Sport"),
    category: raw.category ?? "Conjuntos deportivos",
    subcategory: raw.subcategory ?? "General",
    price: Number(raw.price ?? 0),
    offerPrice: typeof raw.offerPrice === "number" ? raw.offerPrice : undefined,
    description: String(raw.description ?? "Producto premium"),
    longDescription: String(raw.longDescription ?? raw.description ?? "Producto premium"),
    features: Array.isArray(raw.features) ? raw.features.map(String) : [],
    sizes: Array.isArray(raw.sizes) ? raw.sizes.map(String) : ["M"],
    colors: Array.isArray(raw.colors) ? raw.colors.map(String) : ["Negro"],
    image1,
    image2,
    image3,
    image4,
    stock: Number(raw.stock ?? 10),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : ["Nuevo"],
    status: raw.status ?? "Nuevo",
    material: String(raw.material ?? "Tejido premium"),
    fabricDetails: typeof raw.fabricDetails === "string" ? raw.fabricDetails : undefined,
    print: typeof raw.print === "string" ? raw.print : undefined,
    style: typeof raw.style === "string" ? raw.style : undefined,
    weight: String(raw.weight ?? "0.3 kg"),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  };
}

async function readRemoteJson<T>(objectPath: string): Promise<T | null> {
  try {
    const supabase = await createServerSupabaseClient({ serviceRole: true });
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(objectPath);
    if (error || !data) return null;
    const text = await data.text();
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function writeRemoteJson(objectPath: string, value: unknown) {
  try {
    const supabase = await createServerSupabaseClient({ serviceRole: true });
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(objectPath, JSON.stringify(value), {
      upsert: true,
      contentType: "application/json",
    });
    if (error) {
      console.error(`Unable to persist ${objectPath} to Supabase Storage`, error);
    }
  } catch (error) {
    console.error(`Unable to persist ${objectPath} to Supabase Storage`, error);
  }
}

export async function loadProducts(): Promise<Product[]> {
  try {
    const remoteProducts = await readRemoteJson<Product[]>(STORAGE_PRODUCTS_OBJECT);
    if (Array.isArray(remoteProducts) && remoteProducts.length) {
      return remoteProducts.map(normalizeProduct);
    }
  } catch {
    // Fallback to the local file if storage-backed data is unavailable.
  }

  try {
    await ensureDataDir();
    const raw = await fs.readFile(PRODUCTS_FILE, "utf8");
    const parsed = JSON.parse(raw) as any[];
    const normalized = parsed.map(normalizeProduct);
    return normalized.length ? normalized : fallbackProducts;
  } catch {
    return fallbackProducts;
  }
}

export async function saveProducts(products: Product[]) {
  await ensureDataDir();
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf8");
  await writeRemoteJson(STORAGE_PRODUCTS_OBJECT, products);
}

function normalizeHeroImages(images: unknown): string[] {
  if (!Array.isArray(images)) return [...defaultHeroConfig.leftCardImages];
  const normalized = images.slice(0, 3).map((item) => (typeof item === "string" ? item : ""));
  return [...normalized, "", ""].slice(0, 3);
}

export async function loadHeroConfig(): Promise<HeroConfig> {
  try {
    const remoteHeroConfig = await readRemoteJson<Partial<HeroConfig>>(STORAGE_HERO_OBJECT);
    if (remoteHeroConfig) {
      return {
        leftCardImages: normalizeHeroImages(remoteHeroConfig.leftCardImages ?? defaultHeroConfig.leftCardImages),
        rightCardImages: normalizeHeroImages(remoteHeroConfig.rightCardImages ?? defaultHeroConfig.rightCardImages),
        carouselEnabled: typeof remoteHeroConfig.carouselEnabled === "boolean" ? remoteHeroConfig.carouselEnabled : defaultHeroConfig.carouselEnabled,
        transitionMs: typeof remoteHeroConfig.transitionMs === "number" ? remoteHeroConfig.transitionMs : defaultHeroConfig.transitionMs,
      };
    }
  } catch {
    // Fallback to the local file if storage-backed data is unavailable.
  }

  try {
    await ensureDataDir();
    const raw = await fs.readFile(HERO_CONFIG_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<HeroConfig>;

    return {
      leftCardImages: normalizeHeroImages(parsed.leftCardImages ?? defaultHeroConfig.leftCardImages),
      rightCardImages: normalizeHeroImages(parsed.rightCardImages ?? defaultHeroConfig.rightCardImages),
      carouselEnabled: typeof parsed.carouselEnabled === "boolean" ? parsed.carouselEnabled : defaultHeroConfig.carouselEnabled,
      transitionMs: typeof parsed.transitionMs === "number" ? parsed.transitionMs : defaultHeroConfig.transitionMs,
    };
  } catch {
    return defaultHeroConfig;
  }
}

export async function saveHeroConfig(config: Partial<HeroConfig>) {
  await ensureDataDir();

  const nextConfig: HeroConfig = {
    leftCardImages: normalizeHeroImages(config.leftCardImages ?? defaultHeroConfig.leftCardImages),
    rightCardImages: normalizeHeroImages(config.rightCardImages ?? defaultHeroConfig.rightCardImages),
    carouselEnabled: typeof config.carouselEnabled === "boolean" ? config.carouselEnabled : defaultHeroConfig.carouselEnabled,
    transitionMs: typeof config.transitionMs === "number" ? config.transitionMs : defaultHeroConfig.transitionMs,
  };

  await fs.writeFile(HERO_CONFIG_FILE, JSON.stringify(nextConfig, null, 2), "utf8");
  await writeRemoteJson(STORAGE_HERO_OBJECT, nextConfig);
  return nextConfig;
}

export async function createProduct(input: Partial<Product> & Pick<Product, "name" | "brand" | "category" | "price">) {
  const current = await loadProducts();
  const [image1, image2, image3, image4] = getImageFields(input);
  const hasImages = Boolean(image1 || image2 || image3 || image4);
  const product: Product = {
    id: input.id ?? crypto.randomUUID(),
    slug: input.slug ?? input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    name: input.name,
    brand: input.brand,
    category: input.category,
    subcategory: input.subcategory ?? "General",
    price: input.price,
    offerPrice: input.offerPrice,
    description: input.description ?? "Producto premium",
    longDescription: input.longDescription ?? input.description ?? "Producto premium",
    features: input.features ?? [],
    sizes: input.sizes ?? ["M"],
    colors: input.colors ?? ["Negro"],
    image1: hasImages ? image1 : "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80",
    image2: hasImages ? image2 : "",
    image3: hasImages ? image3 : "",
    image4: hasImages ? image4 : "",
    stock: input.stock ?? 10,
    tags: input.tags ?? ["Nuevo"],
    status: input.status ?? "Nuevo",
    material: input.material ?? "Tejido premium",
    fabricDetails: input.fabricDetails,
    print: input.print,
    style: input.style,
    weight: input.weight ?? "0.3 kg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const next = [product, ...current];
  await saveProducts(next);
  return product;
}

export async function updateProduct(id: string, updates: Partial<Product>) {
  const current = await loadProducts();
  const rawUpdates = { ...(updates as any) };
  const imageKeysPresent =
    "image1" in rawUpdates ||
    "image2" in rawUpdates ||
    "image3" in rawUpdates ||
    "image4" in rawUpdates ||
    Array.isArray(rawUpdates.images);

  if (Array.isArray(rawUpdates.images)) {
    delete rawUpdates.images;
  }

  const [image1, image2, image3, image4] = getImageFields(updates);

  const next = current.map((product) => {
    if (product.id !== id) return product;

    const updated = {
      ...product,
      ...rawUpdates,
      updatedAt: new Date().toISOString(),
    } as Product;

    if (imageKeysPresent) {
      updated.image1 = image1;
      updated.image2 = image2;
      updated.image3 = image3;
      updated.image4 = image4;
    }

    return updated;
  });
  await saveProducts(next);
  return next.find((product) => product.id === id);
}

export async function deleteProduct(id: string) {
  const current = await loadProducts();
  const next = current.filter((product) => product.id !== id);
  await saveProducts(next);
  return next;
}
