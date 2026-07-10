import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createClient } from "@/lib/supabase/client";

interface OrderSummary {
  id: string;
  status: string;
  total: number;
  date: string;
}

interface UserStore {
  profile: {
    name: string;
    email: string;
    is_admin?: boolean;
  };
  orders: OrderSummary[];
  setProfile: (profile: { name: string; email: string }) => void;
  addOrder: (order: OrderSummary) => void;
  syncFromSupabase: () => Promise<void>;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      profile: {
        name: "",
        email: "",
        is_admin: false,
      },
      orders: [],
      setProfile: (profile) => set({ profile }),
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
      syncFromSupabase: async () => {
        try {
          const response = await fetch("/api/auth/me", { cache: "no-store" });
          if (!response.ok) {
            return;
          }

          const payload = (await response.json()) as {
            user?: { email?: string | null };
            profile?: { full_name?: string | null; is_admin?: boolean | null };
            orders?: Array<{ id: string; status: string; total: number; created_at: string }>;
          };

          set({
            profile: {
              name: payload.profile?.full_name ?? payload.user?.email ?? "",
              email: payload.user?.email ?? "",
              is_admin: payload.profile?.is_admin ?? false,
            },
            orders: (payload.orders ?? []).map((order) => ({
              id: order.id,
              status: order.status,
              total: Number(order.total),
              date: new Date(order.created_at).toLocaleDateString("es-AR"),
            })),
          });
        } catch {
          set({
            profile: {
              name: "",
              email: "",
              is_admin: false,
            },
            orders: [],
          });
        }
      },
    }),
    { name: "peak-sport-user" },
  ),
);
