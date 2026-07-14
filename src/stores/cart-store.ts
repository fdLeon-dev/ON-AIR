import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
  shortDescription?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clear: () => Promise<void>;
  syncFromSupabase: () => Promise<void>;
  mergeLocalToSupabase: () => Promise<void>;
}

function getLegacyCartColumns(selectFallback = false) {
  return selectFallback
    ? "id, product_id, quantity, price_snapshot"
    : "id, product_id, quantity, price_snapshot, size, color, short_description";
}

function usesVariantColumns(error: any) {
  const message = error?.message ?? String(error ?? "");
  return /column\s+(?:"?cart_items\.\"?)?(?:size|color|short_description)\"?\s+does not exist/i.test(message);
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: async (item) => {
        const supabase = createClient();
        const user = await supabase?.auth.getUser();
        const userId = user?.data?.user?.id;

        // If no user or supabase client, fall back to local-only behavior
        if (!supabase || !userId) {
          set((state) => {
            const existing = state.items.find((entry) => entry.id === item.id);
            if (existing) {
              return {
                items: state.items.map((entry) =>
                  entry.id === item.id ? { ...entry, quantity: entry.quantity + item.quantity } : entry,
                ),
              };
            }
            return { items: [...state.items, item] };
          });
          return;
        }

        // Try to persist to Supabase. If any DB error occurs, fall back to local update
        try {
          // Resolve product identifier: prefer explicit productId, but support legacy and slug formats.
          let productId = item.productId || item.id;
          const isUuid = (val: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);
          if (!isUuid(productId)) {
            if (productId.includes(":")) {
              productId = productId.split(":")[0];
            }

            const { data: prod, error: prodError } = await supabase.from("products").select("id").eq("slug", productId).maybeSingle();
            if (prod && prod.id) {
              productId = prod.id;
            } else {
              // Could not resolve slug to uuid — warn and fallback to local cart
              // eslint-disable-next-line no-console
              console.warn("Could not resolve product slug to UUID, falling back to local cart:", productId, prodError);
              throw prodError ?? new Error("Product slug not found: " + productId);
            }
          }

          let existingResponse = await supabase
            .from("cart_items")
            .select("id, quantity")
            .match({
              user_id: userId,
              product_id: productId,
              size: item.size ?? "",
              color: item.color ?? "",
            })
            .maybeSingle();

          let supportsVariantColumns = true;
          if (existingResponse.error && usesVariantColumns(existingResponse.error)) {
            supportsVariantColumns = false;
            existingResponse = await supabase
              .from("cart_items")
              .select("id, quantity")
              .match({ user_id: userId, product_id: productId })
              .maybeSingle();
          }

          const existing = existingResponse.data;
          const isNonEmptyError = (e: any) => {
            try {
              if (!e) return false;
              if (typeof e === "string") return e.length > 0;
              if (e instanceof Error && e.message) return true;
              if (typeof e === "object") return Object.keys(e).length > 0;
              return Boolean(e);
            } catch {
              return true;
            }
          };

          if (isNonEmptyError(existingResponse.error)) {
            // Log but don't throw raw empty error objects
            // eslint-disable-next-line no-console
            console.warn("Supabase existing check returned error:", existingResponse.error);
            throw existingResponse.error;
          }

          if (existing) {
            const updatePayload: Record<string, unknown> = {
              quantity: existing.quantity + item.quantity,
              price_snapshot: item.price,
              updated_at: new Date().toISOString(),
            };
            if (supportsVariantColumns) {
              updatePayload.size = item.size ?? "";
              updatePayload.color = item.color ?? "";
              updatePayload.short_description = item.shortDescription ?? "";
            }

            const { error: updateError } = await supabase.from("cart_items").update(updatePayload).eq("id", existing.id);
            if (isNonEmptyError(updateError)) {
              // eslint-disable-next-line no-console
              console.warn("Supabase update returned error (non-empty):", updateError);
              throw updateError;
            }
          } else {
            const insertPayload: Record<string, unknown> = {
              user_id: userId,
              product_id: productId,
              quantity: item.quantity,
              price_snapshot: item.price,
            };
            const onConflict = supportsVariantColumns ? "user_id,product_id,size,color" : "user_id,product_id";
            if (supportsVariantColumns) {
              insertPayload.size = item.size ?? "";
              insertPayload.color = item.color ?? "";
              insertPayload.short_description = item.shortDescription ?? "";
            }

            const { error: insertError } = await supabase.from("cart_items").upsert(insertPayload, { onConflict });
            if (isNonEmptyError(insertError)) {
              // eslint-disable-next-line no-console
              console.warn("Supabase upsert returned error (non-empty):", insertError);
              throw insertError;
            }
          }

          // Refresh the local store from Supabase to keep canonical state
          await get().syncFromSupabase();
        } catch (err: any) {
          // Better error formatting for debugging
          const errMsg = err instanceof Error ? err.message : typeof err === "object" ? JSON.stringify(err) : String(err);
          // eslint-disable-next-line no-console
          console.error("Cart sync error, falling back to local cart:", errMsg);
          set((state) => {
            const existing = state.items.find((entry) => entry.id === item.id);
            if (existing) {
              return {
                items: state.items.map((entry) =>
                  entry.id === item.id ? { ...entry, quantity: entry.quantity + item.quantity } : entry,
                ),
              };
            }
            return { items: [...state.items, item] };
          });
        }
      },
      removeItem: async (id) => {
        const supabase = createClient();
        const user = await supabase?.auth.getUser();
        const userId = user?.data?.user?.id;
        if (!supabase || !userId) {
          set((state) => ({ items: state.items.filter((entry) => entry.id !== id) }));
          return;
        }

        await supabase.from("cart_items").delete().eq("id", id).eq("user_id", userId);
        await get().syncFromSupabase();
      },
      updateQuantity: async (id, quantity) => {
        const supabase = createClient();
        const user = await supabase?.auth.getUser();
        const userId = user?.data?.user?.id;
        if (!supabase || !userId) {
          set((state) => ({ items: state.items.map((entry) => (entry.id === id ? { ...entry, quantity } : entry)) }));
          return;
        }

        if (quantity <= 0) {
          await supabase.from("cart_items").delete().eq("id", id).eq("user_id", userId);
        } else {
          await supabase.from("cart_items").update({ quantity, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId);
        }

        await get().syncFromSupabase();
      },
      clear: async () => {
        const supabase = createClient();
        const user = await supabase?.auth.getUser();
        const userId = user?.data?.user?.id;
        if (!supabase || !userId) {
          set({ items: [] });
          return;
        }

        await supabase.from("cart_items").delete().eq("user_id", userId);
        set({ items: [] });
      },
      syncFromSupabase: async () => {
        const supabase = createClient();
        const user = await supabase?.auth.getUser();
        const userId = user?.data?.user?.id;
        if (!supabase || !userId) {
          set({ items: [] });
          return;
        }

        try {
          let response = await supabase
            .from("cart_items")
            .select(getLegacyCartColumns())
            .eq("user_id", userId);

          if (response.error && usesVariantColumns(response.error)) {
            response = await supabase
              .from("cart_items")
              .select(getLegacyCartColumns(true))
              .eq("user_id", userId);
          }

          const { data, error } = response;
          if (error) {
            const message = error.message ?? "Unknown error";
            // eslint-disable-next-line no-console
            console.warn("Failed to sync cart from Supabase:", message);
            return;
          }

          const cartItems = data ?? [];
          if (cartItems.length === 0) {
            set({ items: [] });
            return;
          }

          const productIds = [...new Set(cartItems.map((entry: any) => entry.product_id).filter(Boolean))];
          const productsById = new Map<string, any>();

          if (productIds.length > 0) {
            const { data: productsData, error: productsError } = await supabase
              .from("products")
              .select("id, name, image1, image2, image3, image4")
              .in("id", productIds);

            if (!productsError && productsData) {
              productsData.forEach((product: any) => {
                productsById.set(product.id, product);
              });
            }
          }

          const items = cartItems.map((entry: any) => {
            const product = productsById.get(entry.product_id);
            return {
              id: entry.id,
              productId: entry.product_id,
              name: product?.name ?? entry.product_id,
              price: Number(entry.price_snapshot ?? 0),
              image: product?.image1 ?? product?.image2 ?? product?.image3 ?? product?.image4 ?? "",
              quantity: Number(entry.quantity ?? 0),
              size: entry.size ?? undefined,
              color: entry.color ?? undefined,
              shortDescription: entry.short_description ?? undefined,
            };
          });

          set({ items });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          // eslint-disable-next-line no-console
          console.warn("Failed to sync cart from Supabase:", message);
        }
      },
      mergeLocalToSupabase: async () => {
        const supabase = createClient();
        const user = await supabase?.auth.getUser();
        const userId = user?.data?.user?.id;
        if (!supabase || !userId) return;

        const localItems = get().items;
        if (!localItems || localItems.length === 0) return;

        const isUuid = (val: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);

        for (const item of localItems) {
          try {
            let productUuid = item.productId || item.id;
            if (!isUuid(productUuid) && productUuid.includes(":")) {
              productUuid = productUuid.split(":")[0];
            }

            if (!isUuid(productUuid)) {
              const { data: prod, error: prodError } = await supabase.from("products").select("id,slug").eq("slug", productUuid).maybeSingle();
              if (prod && prod.id) productUuid = prod.id;
              if (prodError) {
                // eslint-disable-next-line no-console
                console.warn("Failed to resolve product slug to uuid:", productUuid, prodError);
                continue;
              }
            }

            let supportsVariantColumns = true;
            let response = await supabase
              .from("cart_items")
              .select("id, quantity")
              .match({
                user_id: userId,
                product_id: productUuid,
                size: item.size ?? "",
                color: item.color ?? "",
              })
              .maybeSingle();

            if (response.error && usesVariantColumns(response.error)) {
              supportsVariantColumns = false;
              response = await supabase
                .from("cart_items")
                .select("id, quantity")
                .match({ user_id: userId, product_id: productUuid })
                .maybeSingle();
            }

            const existing = response.data;
            if (existing) {
              const updatePayload: Record<string, unknown> = {
                quantity: existing.quantity + item.quantity,
                price_snapshot: item.price,
                updated_at: new Date().toISOString(),
              };

              if (supportsVariantColumns) {
                updatePayload.size = item.size ?? "";
                updatePayload.color = item.color ?? "";
                updatePayload.short_description = item.shortDescription ?? "";
              }

              await supabase.from("cart_items").update(updatePayload).eq("id", existing.id);
            } else {
              const insertPayload: Record<string, unknown> = {
                user_id: userId,
                product_id: productUuid,
                quantity: item.quantity,
                price_snapshot: item.price,
              };

              const onConflict = supportsVariantColumns ? "user_id,product_id,size,color" : "user_id,product_id";
              if (supportsVariantColumns) {
                insertPayload.size = item.size ?? "";
                insertPayload.color = item.color ?? "";
                insertPayload.short_description = item.shortDescription ?? "";
              }

              await supabase.from("cart_items").upsert(insertPayload, { onConflict });
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error("Error merging local cart item:", err);
          }
        }

        // refresh canonical state
        await get().syncFromSupabase();
      },
    }),
    { name: "peak-sport-cart" },
  ),
);
