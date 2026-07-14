import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { access_token, refresh_token } = body as { access_token?: string; refresh_token?: string };

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const result = await supabase.auth.setSession({ access_token, refresh_token });

    if (result.error) {
      // eslint-disable-next-line no-console
      console.error("setSession failed:", result.error);
      return NextResponse.json({ error: result.error.message ?? "No se pudo establecer la sesión" }, { status: 401 });
    }

    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("session route error", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
