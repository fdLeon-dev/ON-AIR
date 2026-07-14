import { NextResponse } from "next/server";
import { resolveAdminAccess } from "@/lib/admin/auth";
import { loadFeaturedCategories, saveFeaturedCategories, deleteFeaturedCategory } from "@/lib/data/persistence";
import type { FeaturedCategory } from "@/types";

export async function GET() {
  const { isAdmin } = await resolveAdminAccess();
  if (!isAdmin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  return NextResponse.json(await loadFeaturedCategories(false));
}

export async function POST(request: Request) {
  const { isAdmin } = await resolveAdminAccess();
  if (!isAdmin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const body = (await request.json()) as Record<string, unknown>;
  const nextCategory: FeaturedCategory = {
    id: String(body.id ?? crypto.randomUUID()),
    name: String(body.name ?? "").trim(),
    slug: String(body.slug ?? String(body.name ?? "")).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    description: String(body.description ?? "").trim(),
    imageUrl: String(body.imageUrl ?? body.image_url ?? "").trim(),
    displayOrder: typeof body.displayOrder === "number" ? body.displayOrder : 0,
    isActive: typeof body.isActive === "boolean" ? body.isActive : Boolean(body.is_active ?? true),
    createdAt: String(body.createdAt ?? body.created_at ?? new Date().toISOString()),
    updatedAt: new Date().toISOString(),
  };

  if (!nextCategory.name || !nextCategory.description || !nextCategory.imageUrl) {
    return NextResponse.json({ error: "name, description y imageUrl son obligatorios." }, { status: 400 });
  }

  const existing = await loadFeaturedCategories(false);
  const nextCategories = [...existing.filter((item) => item.id !== nextCategory.id), nextCategory]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((category, index) => ({ ...category, displayOrder: index }));

  try {
    await saveFeaturedCategories(nextCategories);
    return NextResponse.json(nextCategory, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error, Object.getOwnPropertyNames(error));
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { isAdmin } = await resolveAdminAccess();
  if (!isAdmin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const body = (await request.json()) as Record<string, unknown>;
  const categories = Array.isArray(body.categories) ? body.categories : [];
  if (!Array.isArray(categories)) {
    return NextResponse.json({ error: "categories es requerido y debe ser un arreglo." }, { status: 400 });
  }

  const nextCategories = categories.map((category, index) => {
    const item = category as Record<string, unknown>;
    return {
      id: String(item.id ?? crypto.randomUUID()),
      name: String(item.name ?? "").trim(),
      slug: String(item.slug ?? item.name ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: String(item.description ?? "").trim(),
      imageUrl: String(item.imageUrl ?? item.image_url ?? "").trim(),
      displayOrder: index,
      isActive: typeof item.isActive === "boolean" ? item.isActive : Boolean(item.is_active ?? true),
      createdAt: String(item.createdAt ?? item.created_at ?? new Date().toISOString()),
      updatedAt: new Date().toISOString(),
    };
  });

  try {
    await saveFeaturedCategories(nextCategories);
    return NextResponse.json(nextCategories);
  } catch (error) {
    const message = error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error, Object.getOwnPropertyNames(error));
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { isAdmin } = await resolveAdminAccess();
  if (!isAdmin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const body = (await request.json()) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "id requerido" }, { status: 400 });
  }

  try {
    await deleteFeaturedCategory(body.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error, Object.getOwnPropertyNames(error));
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
