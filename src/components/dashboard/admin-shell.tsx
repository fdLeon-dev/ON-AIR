"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BarChart3,
  Bell,
  Box,
  Building2,
  ChevronLeft,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  Package2,
  PanelTop,
  Percent,
  Search,
  Settings2,
  ShoppingCart,
  Store,
  Tags,
  Truck,
  Users,
  UserCircle2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type AdminNavigationItem = {
  label: string;
  href: string;
  icon: ReactNode;
  description?: string;
};

const navigation: AdminNavigationItem[] = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-4 w-4" />, description: "Resumen general" },
  { label: "Productos", href: "/admin/products", icon: <Package2 className="h-4 w-4" />, description: "Catálogo y edición" },
  { label: "Categorías", href: "/admin/categories", icon: <Tags className="h-4 w-4" />, description: "Taxonomía" },
  { label: "Marcas", href: "/admin/brands", icon: <Building2 className="h-4 w-4" />, description: "Branding" },
  { label: "Stock", href: "/admin/stock", icon: <Box className="h-4 w-4" />, description: "Inventario" },
  { label: "Pedidos", href: "/admin/orders", icon: <ShoppingCart className="h-4 w-4" />, description: "Ventas y estados" },
  { label: "Clientes", href: "/admin/customers", icon: <Users className="h-4 w-4" />, description: "Usuarios y compras" },
  { label: "Cupones", href: "/admin/coupons", icon: <CircleDollarSign className="h-4 w-4" />, description: "Promociones" },
  { label: "Banners", href: "/admin/banners", icon: <PanelTop className="h-4 w-4" />, description: "Hero y campañas" },
  { label: "Configuración", href: "/admin/settings", icon: <Settings2 className="h-4 w-4" />, description: "Ajustes globales" },
  { label: "Perfil", href: "/admin/profile", icon: <UserCircle2 className="h-4 w-4" />, description: "Cuenta admin" },
];

export function AdminShell({
  children,
  displayName,
  email,
}: {
  children: ReactNode;
  displayName: string;
  email?: string | null;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#060816] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.03),_transparent_20%)]" />
      <div className="relative flex min-h-screen">
        <aside className={cn(
          "fixed inset-y-0 left-0 z-40 w-[18rem] border-r border-white/10 bg-[#070b1c]/95 px-4 py-5 backdrop-blur-xl transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}>
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.2em] text-white">PEAK SPORT</p>
                <p className="text-xs text-zinc-400">Admin panel</p>
              </div>
            </Link>
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setMobileOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="mt-8 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-4 py-3 transition",
                    isActive ? "bg-white/10 text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)]" : "text-zinc-300 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl border border-white/10", isActive ? "bg-emerald-400/15 text-emerald-200" : "bg-white/5 text-zinc-300")}>
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{item.label}</span>
                    <span className="block truncate text-xs text-zinc-400">{item.description}</span>
                  </span>
                  <ChevronLeft className={cn("h-4 w-4 transition", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-80")} />
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Sesión</p>
            <p className="mt-3 text-sm font-medium">{displayName}</p>
            {email ? <p className="mt-1 truncate text-xs text-zinc-400">{email}</p> : null}
            <div className="mt-4 flex items-center gap-2 text-xs text-zinc-300">
              <LogOut className="h-4 w-4" />
              <span>Panel protegido por Supabase</span>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col lg:pl-[18rem]">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#060816]/80 backdrop-blur-xl">
            <div className="flex items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setMobileOpen((value) => !value)}>
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
              <div className="flex-1">
                <div className="relative max-w-xl">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    className="h-12 w-full rounded-full border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-400/30 focus:outline-none"
                    placeholder="Buscar productos, pedidos o clientes"
                  />
                </div>
              </div>
              <div className="hidden items-center gap-2 md:flex">
                <Button variant="ghost" size="sm" className="rounded-full">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button asChild variant="secondary" size="sm" className="rounded-full">
                  <Link href="/">
                    <Truck className="mr-2 h-4 w-4" />
                    Ver tienda
                  </Link>
                </Button>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[96rem] flex-1 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
