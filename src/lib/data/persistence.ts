import { createServerSupabaseClient } from "@/lib/supabase/server";
import { products as fallbackProducts } from "@/lib/data/products";
import type { HeroConfig, Product, ProductCategory, ProductStatus } from "@/types";

const STORAGE_BUCKET = "productos";
const STORAGE_PRODUCTS_OBJECT = "app-data/products.json";
const STORAGE_HERO_OBJECT = "app-data/hero-config.json";

const defaultHeroConfig: HeroConfig = {
  leftCardImages: ["/peak.png", "", ""],
  rightCardImages: ["/peak.png", "", ""],
  carouselEnabled: false,
  transitionMs: 3000,
};

async function getServiceSupabase() {
  return createServerSupabaseClient({ serviceRole: true });
}

async function getSessionSupabase() {
  return createServerSupabaseClient();
}

function getImageFields(raw: Record<string, unknown>): [string, string, string, string] {
  const images = Array.isArray(raw?.images) ? raw.images : [];
  return [
    String(raw?.image1 ?? images[0] ?? ""),
    String(raw?.image2 ?? images[1] ?? ""),
    String(raw?.image3 ?? images[2] ?? ""),
    String(raw?.image4 ?? images[3] ?? ""),
  ];
}

function getMetadata(raw: Record<string, unknown>): Record<string, unknown> {
  return typeof raw?.metadata === "object" && raw.metadata && !Array.isArray(raw.metadata) ? (raw.metadata as Record<string, unknown>) : {};
}

function toProductCategory(value: unknown): ProductCategory {
  const allowedCategories: ProductCategory[] = [
    "Conjuntos deportivos",
    "Buzos",
    "Medias anti deslizante",
    "Camperas",
    "Remeras",
    "Shorts",
    "Accesorios",
  ];

  return allowedCategories.includes(value as ProductCategory) ? (value as ProductCategory) : "Conjuntos deportivos";
}

function toProductStatus(value: unknown): ProductStatus {
  const allowedStatuses: ProductStatus[] = ["Nuevo", "Destacado", "Oferta", "Popular"];
  return allowedStatuses.includes(value as ProductStatus) ? (value as ProductStatus) : "Nuevo";
}

function toStringArray(value: unknown, fallback: string[]): string[] {
  return Array.isArray(value) ? value.map((entry) => String(entry)) : fallback;
}

function normalizeProduct(raw: Record<string, unknown>): Product {
  const [image1, image2, image3, image4] = getImageFields(raw);
  const metadata = getMetadata(raw);
  const metadataFeatures = metadata.features ?? raw.features;
  const metadataSizes = metadata.sizes ?? raw.sizes;
  const metadataColors = metadata.colors ?? raw.colors;
  const metadataTags = metadata.tags ?? raw.tags;
  return {
    id: String(raw.id ?? crypto.randomUUID()),
    slug: String(raw.slug ?? String(raw.name ?? "")).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    name: String(raw.name ?? ""),
    brand: String(raw.brand ?? "Peak Sport"),
    category: toProductCategory(raw.category),
    subcategory: String(raw.subcategory ?? "General"),
    price: Number(raw.price ?? 0),
    offerPrice: typeof raw.offerPrice === "number" ? raw.offerPrice : typeof raw.offer_price === "number" ? raw.offer_price : undefined,
    description: String(raw.short_description ?? raw.description ?? "Producto premium"),
    longDescription: String(raw.longDescription ?? raw.description ?? raw.short_description ?? "Producto premium"),
    features: toStringArray(metadataFeatures, []),
    sizes: toStringArray(metadataSizes, ["M"]),
    colors: toStringArray(metadataColors, ["Negro"]),
    image1,
    image2,
    image3,
    image4,
    stock: Number(raw.stock ?? 10),
    tags: toStringArray(metadataTags, ["Nuevo"]),
    status: toProductStatus(raw.status),
    material: String(metadata.material ?? raw.material ?? "Tejido premium"),
    fabricDetails: typeof metadata.fabricDetails === "string" ? metadata.fabricDetails : typeof raw.fabricDetails === "string" ? raw.fabricDetails : undefined,
    print: typeof metadata.print === "string" ? metadata.print : typeof raw.print === "string" ? raw.print : undefined,
    style: typeof metadata.style === "string" ? metadata.style : typeof raw.style === "string" ? raw.style : undefined,
    weight: String(metadata.weight ?? raw.weight ?? "0.3 kg"),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  };
}

async function readRemoteJson<T>(objectPath: string): Promise<T | null> {
  try {
    const supabase = await getServiceSupabase();
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
    const supabase = await getServiceSupabase();
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
    const supabase = await getSessionSupabase();
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (!error && Array.isArray(data)) {
      return data.map(normalizeProduct);
    }
  } catch {
    // ignore and fallback to storage/json
  }

  try {
    const remoteProducts = await readRemoteJson<unknown[]>(STORAGE_PRODUCTS_OBJECT);
    if (Array.isArray(remoteProducts)) return remoteProducts.filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null).map(normalizeProduct);
  } catch {
    // ignore
  }

  return fallbackProducts;
}

export async function saveProducts(products: Product[]) {
  try {
    const supabase = await getServiceSupabase();
    const rows = products.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      short_description: product.description,
      description: product.longDescription,
      category: product.category,
      subcategory: product.subcategory,
      price: product.price,
      offer_price: product.offerPrice,
      stock: product.stock,
      status: product.status,
      image1: product.image1,
      image2: product.image2,
      image3: product.image3,
      image4: product.image4,
      metadata: {
        features: product.features,
        sizes: product.sizes,
        colors: product.colors,
        tags: product.tags,
        material: product.material,
        fabricDetails: product.fabricDetails,
        print: product.print,
        style: product.style,
        weight: product.weight,
      },
      created_at: product.createdAt,
      updated_at: product.updatedAt,
    }));

    await supabase.from("products").upsert(rows, { onConflict: "id" });
    return;
  } catch {
    // fallback to storage json
  }

  await writeRemoteJson(STORAGE_PRODUCTS_OBJECT, products);
}

function normalizeHeroImages(images: unknown): string[] {
  if (!Array.isArray(images)) return [...defaultHeroConfig.leftCardImages];
  const normalized = images.slice(0, 3).map((item) => (typeof item === "string" ? item : ""));
  return [...normalized, "", ""].slice(0, 3);
}

export async function loadHeroConfig(): Promise<HeroConfig> {
  try {
    const supabase = await getSessionSupabase();
    const { data, error } = await supabase.from("hero_config").select("*").eq("config_key", "default").single();
    if (!error && data) {
      return {
        leftCardImages: normalizeHeroImages(data.left_card_images ?? defaultHeroConfig.leftCardImages),
        rightCardImages: normalizeHeroImages(data.right_card_images ?? defaultHeroConfig.rightCardImages),
        carouselEnabled: typeof data.carousel_enabled === "boolean" ? data.carousel_enabled : defaultHeroConfig.carouselEnabled,
        transitionMs: typeof data.transition_ms === "number" ? data.transition_ms : defaultHeroConfig.transitionMs,
      };
    }
  } catch {
    // fallback to storage
  }

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
    // ignore
  }

  return defaultHeroConfig;
}

export async function saveHeroConfig(config: Partial<HeroConfig>) {
  const nextConfig: HeroConfig = {
    leftCardImages: normalizeHeroImages(config.leftCardImages ?? defaultHeroConfig.leftCardImages),
    rightCardImages: normalizeHeroImages(config.rightCardImages ?? defaultHeroConfig.rightCardImages),
    carouselEnabled: typeof config.carouselEnabled === "boolean" ? config.carouselEnabled : defaultHeroConfig.carouselEnabled,
    transitionMs: typeof config.transitionMs === "number" ? config.transitionMs : defaultHeroConfig.transitionMs,
  };

  try {
    const supabase = await getSessionSupabase();
    await supabase.from("hero_config").upsert(
      {
        config_key: "default",
        left_card_images: nextConfig.leftCardImages,
        right_card_images: nextConfig.rightCardImages,
        carousel_enabled: nextConfig.carouselEnabled,
        transition_ms: nextConfig.transitionMs,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "config_key" },
    );
    return nextConfig;
  } catch {
    await writeRemoteJson(STORAGE_HERO_OBJECT, nextConfig);
    return nextConfig;
  }
}

type SupabaseClientLike = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export async function createProduct(
  input: Partial<Product> & Pick<Product, "name" | "brand" | "category" | "price">,
  supabaseClient?: SupabaseClientLike,
) {
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

  const supabase = supabaseClient ?? (await getServiceSupabase());
  const { data, error } = await supabase
    .from("products")
    .insert(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        category: product.category,
        subcategory: product.subcategory,
        price: product.price,
        offer_price: product.offerPrice,
        short_description: product.description,
        description: product.longDescription,
        stock: product.stock,
        status: product.status,
        image1: product.image1,
        image2: product.image2,
        image3: product.image3,
        image4: product.image4,
        metadata: {
          features: product.features,
          sizes: product.sizes,
          colors: product.colors,
          tags: product.tags,
          material: product.material,
          fabricDetails: product.fabricDetails,
          print: product.print,
          style: product.style,
          weight: product.weight,
        },
        created_at: product.createdAt,
        updated_at: product.updatedAt,
      },
    )
    .select()
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to create product");
  }

  return normalizeProduct(data);
}

export async function updateProduct(id: string, updates: Partial<Product>, supabaseClient?: SupabaseClientLike) {
  const rawUpdates: Record<string, unknown> = { ...(updates as Record<string, unknown>) };
  const imageKeysPresent =
    "image1" in rawUpdates ||
    "image2" in rawUpdates ||
    "image3" in rawUpdates ||
    "image4" in rawUpdates ||
    Array.isArray(rawUpdates.images);

  if (Array.isArray(rawUpdates.images)) delete rawUpdates.images;

  const [image1, image2, image3, image4] = getImageFields(updates);
  const metadata: Record<string, unknown> = {};

  if (Array.isArray(updates.features)) metadata.features = updates.features;
  if (Array.isArray(updates.sizes)) metadata.sizes = updates.sizes;
  if (Array.isArray(updates.colors)) metadata.colors = updates.colors;
  if (Array.isArray(updates.tags)) metadata.tags = updates.tags;
  if (typeof updates.material === "string") metadata.material = updates.material;
  if (typeof updates.fabricDetails === "string") metadata.fabricDetails = updates.fabricDetails;
  if (typeof updates.print === "string") metadata.print = updates.print;
  if (typeof updates.style === "string") metadata.style = updates.style;
  if (typeof updates.weight === "string") metadata.weight = updates.weight;
  if (typeof updates.longDescription === "string") metadata.longDescription = updates.longDescription;

  delete rawUpdates.description;
  delete rawUpdates.longDescription;
  delete rawUpdates.features;
  delete rawUpdates.sizes;
  delete rawUpdates.colors;
  delete rawUpdates.tags;
  delete rawUpdates.material;
  delete rawUpdates.fabricDetails;
  delete rawUpdates.print;
  delete rawUpdates.style;
  delete rawUpdates.weight;
  delete rawUpdates.offerPrice;
  delete rawUpdates.createdAt;
  delete rawUpdates.updatedAt;

  const updatePayload: Record<string, unknown> = {
    ...rawUpdates,
    ...(typeof updates.offerPrice === "number" ? { offer_price: updates.offerPrice } : {}),
    ...(typeof updates.description === "string" ? { short_description: updates.description } : {}),
    ...(typeof updates.longDescription === "string" ? { description: updates.longDescription } : {}),
    ...(Object.keys(metadata).length ? { metadata } : {}),
    ...(imageKeysPresent ? { image1, image2, image3, image4 } : {}),
    updated_at: new Date().toISOString(),
  };

  const supabase = supabaseClient ?? (await getServiceSupabase());
  const { data, error } = await supabase.from("products").update(updatePayload).eq("id", id).select("*").single();

  if (error || !data) throw error ?? new Error("Failed to update product");
  return normalizeProduct(data);
}

export async function deleteProduct(id: string, supabaseClient?: SupabaseClientLike) {
  const supabase = supabaseClient ?? (await getServiceSupabase());
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
  return { success: true };
}
