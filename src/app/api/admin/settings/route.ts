import { NextResponse } from "next/server";
import { resolveAdminAccess } from "@/lib/admin/auth";
import { loadStoreSettings, saveStoreSettings } from "@/lib/data/store-settings";

export async function GET() {
  const { isAdmin } = await resolveAdminAccess();
  if (!isAdmin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  return NextResponse.json(await loadStoreSettings());
}

export async function POST(request: Request) {
  const { isAdmin } = await resolveAdminAccess();
  if (!isAdmin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const body = await request.json();
  const settings = await saveStoreSettings(body);
  return NextResponse.json(settings);
}
