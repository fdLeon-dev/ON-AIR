import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
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
          // Resolve product identifier: allow storing slugs locally and resolve to UUID in DB
          let productId = item.id;
          const isUuid = (val: string) => /^[0-9a-fA-F-]{36}$/.test(val);
          if (!isUuid(productId)) {
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

          const { data: existing, error: existingError } = await supabase
            .from("cart_items")
            .select("quantity")
            .eq("user_id", userId)
            .eq("product_id", productId)
            .maybeSingle();

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

          if (isNonEmptyError(existingError)) {
            // Log but don't throw raw empty error objects
            // eslint-disable-next-line no-console
            console.warn("Supabase existing check returned error:", existingError);
            throw existingError;
          }

          if (existing) {
            const { error: updateError } = await supabase
              .from("cart_items")
              .update({ quantity: existing.quantity + item.quantity, price_snapshot: item.price, updated_at: new Date().toISOString() })
              .eq("user_id", userId)
              .eq("product_id", productId);

            if (isNonEmptyError(updateError)) {
              // eslint-disable-next-line no-console
              console.warn("Supabase update returned error (non-empty):", updateError);
              throw updateError;
            }
          } else {
            const { error: insertError } = await supabase.from("cart_items").insert({
              user_id: userId,
              product_id: productId,
              quantity: item.quantity,
              price_snapshot: item.price,
            });

            if (isNonEmptyError(insertError)) {
              // eslint-disable-next-line no-console
              console.warn("Supabase insert returned error (non-empty):", insertError);
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

        await supabase.from("cart_items").delete().eq("user_id", userId).eq("product_id", id);
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
          await supabase.from("cart_items").delete().eq("user_id", userId).eq("product_id", id);
        } else {
          await supabase.from("cart_items").update({ quantity, updated_at: new Date().toISOString() }).eq("user_id", userId).eq("product_id", id);
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
          const { data, error } = await supabase.from("cart_items").select("product_id, quantity, price_snapshot").eq("user_id", userId);

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
              id: entry.product_id,
              name: product?.name ?? entry.product_id,
              price: Number(entry.price_snapshot ?? 0),
              image: product?.image1 ?? product?.image2 ?? product?.image3 ?? product?.image4 ?? "",
              quantity: Number(entry.quantity ?? 0),
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

        const isUuid = (val: string) => /^[0-9a-fA-F-]{36}$/.test(val);

        for (const item of localItems) {
          try {
            let productUuid = item.id;
            if (!isUuid(productUuid)) {
              const { data: prod, error: prodError } = await supabase.from("products").select("id,slug").eq("slug", productUuid).maybeSingle();
              if (prod && prod.id) productUuid = prod.id;
              if (prodError) {
                // eslint-disable-next-line no-console
                console.warn("Failed to resolve product slug to uuid:", productUuid, prodError);
                continue;
              }
            }

            const { data: existing } = await supabase
              .from("cart_items")
              .select("quantity")
              .eq("user_id", userId)
              .eq("product_id", productUuid)
              .maybeSingle();

            if (existing) {
              await supabase
                .from("cart_items")
                .update({ quantity: existing.quantity + item.quantity, price_snapshot: item.price, updated_at: new Date().toISOString() })
                .eq("user_id", userId)
                .eq("product_id", productUuid);
            } else {
              await supabase.from("cart_items").insert({
                user_id: userId,
                product_id: productUuid,
                quantity: item.quantity,
                price_snapshot: item.price,
              });
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
