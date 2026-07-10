"use client";

import { useEffect, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/stores/cart-store";
import { useFavoritesStore } from "@/stores/favorites-store";
import { useUserStore } from "@/stores/user-store";

interface SupabaseSyncProviderProps {
  children: ReactNode;
}

export function SupabaseSyncProvider({ children }: SupabaseSyncProviderProps) {
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const sync = () => {
      void useCartStore.getState().syncFromSupabase();
      void useFavoritesStore.getState().syncFromSupabase();
      void useUserStore.getState().syncFromSupabase();
    };

    sync();

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        void useCartStore.getState().mergeLocalToSupabase();
        void useFavoritesStore.getState().mergeLocalToSupabase();
      }
      // Always refresh canonical state after auth change
      sync();
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
