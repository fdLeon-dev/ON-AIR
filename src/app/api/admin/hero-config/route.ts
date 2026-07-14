import { NextResponse } from "next/server";
import { resolveAdminAccess } from "@/lib/admin/auth";
import { saveHeroConfig } from "@/lib/data/persistence";

export async function PATCH(request: Request) {
  const { isAdmin } = await resolveAdminAccess();
  if (!isAdmin) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;

  try {
    const updated = await saveHeroConfig(body);
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error, Object.getOwnPropertyNames(error));
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
