import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";

interface FavoritesStore {
  ids: string[];
  toggle: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
  syncFromSupabase: () => Promise<void>;
  mergeLocalToSupabase: () => Promise<void>;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: async (id) => {
        const supabase = createClient();
        const user = await supabase?.auth.getUser();
        const userId = user?.data?.user?.id;
        if (!supabase || !userId) {
          const isFavorite = get().ids.includes(id);
          set({ ids: isFavorite ? get().ids.filter((entry) => entry !== id) : [...get().ids, id] });
          return;
        }

        const isFavorite = get().ids.includes(id);
        try {
          if (isFavorite) {
            const { error } = await supabase.from("favorites").delete().eq("user_id", userId).eq("product_id", id);
            if (error) throw error;
          } else {
            const { error } = await supabase.from("favorites").insert({ user_id: userId, product_id: id });
            if (error) throw error;
          }

          await get().syncFromSupabase();
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("Favorites sync error, falling back to local state:", err);
          set({ ids: isFavorite ? get().ids.filter((entry) => entry !== id) : [...get().ids, id] });
        }
      },
      isFavorite: (id) => get().ids.includes(id),
      syncFromSupabase: async () => {
        const supabase = createClient();
        const user = await supabase?.auth.getUser();
        const userId = user?.data?.user?.id;
        if (!supabase || !userId) {
          return;
        }

        const { data, error } = await supabase.from("favorites").select("product_id").eq("user_id", userId);
        if (!error && data) {
          set({ ids: data.map((entry) => entry.product_id) });
        }
      },
      mergeLocalToSupabase: async () => {
        const supabase = createClient();
        const user = await supabase?.auth.getUser();
        const userId = user?.data?.user?.id;
        if (!supabase || !userId) return;

        const localIds = get().ids ?? [];
        if (localIds.length === 0) return;

        const isUuid = (val: string) => /^[0-9a-fA-F-]{36}$/.test(val);

        for (const id of localIds) {
          try {
            let productUuid = id;
            if (!isUuid(productUuid)) {
              const { data: prod, error: prodError } = await supabase.from("products").select("id,slug").eq("slug", productUuid).maybeSingle();
              if (prod && prod.id) productUuid = prod.id;
              if (prodError) {
                // eslint-disable-next-line no-console
                console.warn("Failed to resolve favorite slug to uuid:", productUuid, prodError);
                continue;
              }
            }

            const { data: existing } = await supabase.from("favorites").select("product_id").eq("user_id", userId).eq("product_id", productUuid).maybeSingle();
            if (!existing) {
              await supabase.from("favorites").insert({ user_id: userId, product_id: productUuid });
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error("Error merging local favorite:", err);
          }
        }

        await get().syncFromSupabase();
      },
    }),
    { name: "peak-sport-favorites" },
  ),
);
