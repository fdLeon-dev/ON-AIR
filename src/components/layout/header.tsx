"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Menu, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ecommerce/search-bar";
import { AuthStateButton } from "@/components/auth/auth-state-button";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/stores/cart-store";
import { useFavoritesStore } from "@/stores/favorites-store";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const cartCount = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
  const favoriteCount = useFavoritesStore((state) => state.ids.length);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    let active = true;

    const syncAdminStatus = async () => {
      try {
        const cachedValue = window.localStorage.getItem("peak-sport-admin");
        if (cachedValue === "true") {
          if (active) setIsAdmin(true);
          return;
        }

        const { data: userResult } = await supabase.auth.getUser();
        const user = userResult?.user ?? null;
        if (!user) {
          if (active) {
            setIsAdmin(false);
            window.localStorage.removeItem("peak-sport-admin");
          }
          return;
        }

        const normalizedEmail = user.email?.toLowerCase() ?? "";
        const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
          .split(",")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean);

        let storedAdmin = adminEmails.includes(normalizedEmail);

        try {
          const { data: profileData } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
          if (profileData?.is_admin) storedAdmin = true;
        } catch {
          // ignore profile lookup errors
        }

        if (active) {
          setIsAdmin(Boolean(storedAdmin));
          if (typeof window !== "undefined") {
            window.localStorage.setItem("peak-sport-admin", String(Boolean(storedAdmin)));
          }
        }
      } catch {
        if (active) setIsAdmin(false);
      }
    };

    void syncAdminStatus();

    const { data } = supabase.auth.onAuthStateChange(() => {
      void syncAdminStatus();
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-semibold tracking-[0.3em] text-white">
          RUNTIME®
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-zinc-300 md:flex">
          <Link href="/catalog" className="transition hover:text-white">Catálogo</Link>
          <Link href="/promotions" className="transition hover:text-white">Promociones</Link>
          <Link href="/contact" className="transition hover:text-white">Contacto</Link>
        </nav>

        <div className="hidden flex-1 justify-center md:flex">
          <SearchBar />
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm" className="rounded-full p-2">
            <Link href="/favorites" aria-label="Ir a favoritos" className="relative flex items-center gap-2">
              <Heart className="h-4 w-4" />
              {favoriteCount > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {favoriteCount}
                </span>
              ) : null}
            </Link>
          </Button>
          {isAdmin ? (
            <Button asChild variant="ghost" size="sm" className="rounded-full p-2">
              <Link href="/admin" aria-label="Ir al panel administrativo">
                <ShieldCheck className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
          <AuthStateButton />
          <Button asChild variant="primary" size="sm" className="rounded-full px-4">
            <Link href="/cart" className="relative flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span>Carrito</span>
              {cartCount > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <div className="hidden xs:block">
            <AuthStateButton />
          </div>
          <Button variant="ghost" size="sm" className="rounded-full p-2" onClick={() => setMobileMenuOpen((value) => !value)}>
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-white/10 bg-black/95 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link href="/catalog" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" onClick={() => setMobileMenuOpen(false)}>
              Catálogo
            </Link>
            <Link href="/promotions" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" onClick={() => setMobileMenuOpen(false)}>
              Promociones
            </Link>
            <Link href="/favorites" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" onClick={() => setMobileMenuOpen(false)}>
              <span className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Favoritos
              </span>
              {favoriteCount > 0 ? <span className="rounded-full bg-white/10 px-2 py-1 text-xs">{favoriteCount}</span> : null}
            </Link>
            <Link href="/cart" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" onClick={() => setMobileMenuOpen(false)}>
              <span className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Carrito
              </span>
              {cartCount > 0 ? <span className="rounded-full bg-white/10 px-2 py-1 text-xs">{cartCount}</span> : null}
            </Link>
            {isAdmin ? (
              <Link href="/admin" className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" onClick={() => setMobileMenuOpen(false)}>
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Panel admin
                </span>
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
