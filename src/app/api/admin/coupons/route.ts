import { NextResponse } from "next/server";
import { resolveAdminAccess } from "@/lib/admin/auth";
import { loadCoupons, saveCoupons, type Coupon } from "@/lib/data/coupons";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const { isAdmin } = await resolveAdminAccess();
  if (!isAdmin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  return NextResponse.json(await loadCoupons());
}

export async function POST(request: Request) {
  const { isAdmin } = await resolveAdminAccess();
  if (!isAdmin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const body = (await request.json()) as Partial<Coupon>;
  const coupons = await loadCoupons();
  const nextCoupon: Coupon = {
    id: body.id ?? crypto.randomUUID(),
    code: String(body.code ?? "").trim().toUpperCase(),
    label: String(body.label ?? `${Number(body.discount ?? 0)}% off`),
    discount: Number(body.discount ?? 0),
    active: body.active !== false,
    expiresAt: typeof body.expiresAt === "string" ? body.expiresAt : undefined,
  };

  const updated = [nextCoupon, ...coupons.filter((coupon) => coupon.id !== nextCoupon.id)];
  await saveCoupons(updated);
  return NextResponse.json(nextCoupon, { status: 201 });
}

export async function PATCH(request: Request) {
  const { isAdmin } = await resolveAdminAccess();
  if (!isAdmin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const body = (await request.json()) as Partial<Coupon> & { id?: string };
  if (!body.id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const coupons = await loadCoupons();
  const updated = coupons.map((coupon) =>
    coupon.id === body.id
      ? {
          ...coupon,
          code: typeof body.code === "string" ? body.code.trim().toUpperCase() : coupon.code,
          label: typeof body.label === "string" ? body.label : coupon.label,
          discount: typeof body.discount === "number" ? body.discount : coupon.discount,
          active: typeof body.active === "boolean" ? body.active : coupon.active,
          expiresAt: typeof body.expiresAt === "string" ? body.expiresAt : coupon.expiresAt,
        }
      : coupon,
  );

  await saveCoupons(updated);
  return NextResponse.json(updated.find((coupon) => coupon.id === body.id));
}

export async function DELETE(request: Request) {
  const { isAdmin } = await resolveAdminAccess();
  if (!isAdmin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const body = (await request.json()) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const supabase = await createServerSupabaseClient({ serviceRole: true });
  const { error } = await supabase.from("coupons").delete().eq("id", body.id);
  if (error) {
    return NextResponse.json({ error: error.message ?? "No se pudo eliminar el cupón" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
