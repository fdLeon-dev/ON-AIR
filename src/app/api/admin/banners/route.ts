import { NextResponse } from "next/server";
import { resolveAdminAccess } from "@/lib/admin/auth";
import { loadHeroConfig, saveHeroConfig } from "@/lib/data/persistence";
import type { HeroConfig } from "@/types";

export async function GET() {
  const { isAdmin } = await resolveAdminAccess();
  if (!isAdmin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  return NextResponse.json(await loadHeroConfig());
}

export async function POST(request: Request) {
  const { isAdmin } = await resolveAdminAccess();
  if (!isAdmin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const body = (await request.json()) as Partial<HeroConfig>;
  const saved = await saveHeroConfig(body);
  return NextResponse.json(saved, { status: 201 });
}

export async function PATCH(request: Request) {
  const { isAdmin } = await resolveAdminAccess();
  if (!isAdmin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const body = (await request.json()) as Partial<HeroConfig>;
  const saved = await saveHeroConfig(body);
  return NextResponse.json(saved);
}

export async function DELETE() {
  const { isAdmin } = await resolveAdminAccess();
  if (!isAdmin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const saved = await saveHeroConfig({
    hero1Url: "",
    hero2Url: "",
    hero3Url: "",
    carouselEnabled: false,
    autoplay: true,
    loop: true,
    pauseOnHover: true,
    transitionType: "fade",
    transitionInterval: 5,
  });
  return NextResponse.json(saved);
}
