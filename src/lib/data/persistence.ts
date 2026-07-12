import { createServerSupabaseClient } from "@/lib/supabase/server";
import { products as fallbackProducts } from "@/lib/data/products";
import type { HeroConfig, Product } from "@/types";

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
    const supabase = await getServiceSupabase();
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (!error && Array.isArray(data)) {
      return data.map(normalizeProduct);
    }
  } catch {
    // ignore and fallback to storage/json
  }

  try {
    const remoteProducts = await readRemoteJson<Product[]>(STORAGE_PRODUCTS_OBJECT);
    if (Array.isArray(remoteProducts)) return remoteProducts.map(normalizeProduct);
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
  } catch (err) {
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
    const supabase = await getServiceSupabase();
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
    const supabase = await getServiceSupabase();
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

export async function createProduct(input: Partial<Product> & Pick<Product, "name" | "brand" | "category" | "price">) {
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

  const supabase = await getServiceSupabase();
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

export async function updateProduct(id: string, updates: Partial<Product>) {
  const rawUpdates = { ...(updates as any) };
  const imageKeysPresent =
    "image1" in rawUpdates ||
    "image2" in rawUpdates ||
    "image3" in rawUpdates ||
    "image4" in rawUpdates ||
    Array.isArray(rawUpdates.images);

  if (Array.isArray(rawUpdates.images)) delete rawUpdates.images;

  const [image1, image2, image3, image4] = getImageFields(updates);
  const metadata: any = {};

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

  const updatePayload: any = {
    ...rawUpdates,
    ...(Object.keys(metadata).length ? { metadata } : {}),
    ...(imageKeysPresent ? { image1, image2, image3, image4 } : {}),
    updated_at: new Date().toISOString(),
  };

  const supabase = await getServiceSupabase();
  const { data, error } = await supabase.from("products").update(updatePayload).eq("id", id).select("*").single();

  if (error || !data) throw error ?? new Error("Failed to update product");
  return normalizeProduct(data);
}

export async function deleteProduct(id: string) {
  const supabase = await getServiceSupabase();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
  return { success: true };
}
