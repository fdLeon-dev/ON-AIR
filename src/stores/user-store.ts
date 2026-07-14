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
          const supabase = createClient();
          const { data: userResult } = await supabase.auth.getUser();
          const user = userResult?.user ?? null;
          if (!user) return;

          const { data: profileData } = await supabase.from("profiles").select("full_name, is_admin").eq("id", user.id).maybeSingle();

          const { data: ordersData } = await supabase
            .from("orders")
            .select("id, status, total, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          set({
            profile: {
              name: profileData?.full_name ?? user.email ?? "",
              email: user.email ?? "",
              is_admin: profileData?.is_admin ?? false,
            },
            orders: (ordersData ?? []).map((order: any) => ({
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
