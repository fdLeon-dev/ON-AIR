import { NextResponse } from "next/server";
import { resolveAdminAccess } from "@/lib/admin/auth";
import { loadBanners, saveBanners, type StoreBanner } from "@/lib/data/banners";

export async function GET() {
  const { isAdmin } = await resolveAdminAccess();
  if (!isAdmin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  return NextResponse.json(await loadBanners());
}

export async function POST(request: Request) {
  const { isAdmin } = await resolveAdminAccess();
  if (!isAdmin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const body = (await request.json()) as Partial<StoreBanner>;
  const banners = await loadBanners();
  const nextBanner: StoreBanner = {
    id: body.id ?? crypto.randomUUID(),
    title: String(body.title ?? ""),
    subtitle: String(body.subtitle ?? ""),
    imageUrl: String(body.imageUrl ?? ""),
    href: String(body.href ?? "/catalog"),
    active: body.active !== false,
  };

  const updated = [nextBanner, ...banners.filter((banner) => banner.id !== nextBanner.id)];
  await saveBanners(updated);
  return NextResponse.json(nextBanner, { status: 201 });
}

export async function PATCH(request: Request) {
  const { isAdmin } = await resolveAdminAccess();
  if (!isAdmin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const body = (await request.json()) as Partial<StoreBanner> & { id?: string };
  if (!body.id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const banners = await loadBanners();
  const updated = banners.map((banner) =>
    banner.id === body.id
      ? {
          ...banner,
          title: typeof body.title === "string" ? body.title : banner.title,
          subtitle: typeof body.subtitle === "string" ? body.subtitle : banner.subtitle,
          imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : banner.imageUrl,
          href: typeof body.href === "string" ? body.href : banner.href,
          active: typeof body.active === "boolean" ? body.active : banner.active,
        }
      : banner,
  );

  await saveBanners(updated);
  return NextResponse.json(updated.find((banner) => banner.id === body.id));
}

export async function DELETE(request: Request) {
  const { isAdmin } = await resolveAdminAccess();
  if (!isAdmin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const body = (await request.json()) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const banners = await loadBanners();
  const updated = banners.filter((banner) => banner.id !== body.id);
  await saveBanners(updated);
  return NextResponse.json({ success: true });
}
