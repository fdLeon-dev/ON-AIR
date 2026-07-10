import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { access_token, refresh_token } = body;

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const result = await supabase.auth.setSession({ access_token, refresh_token });

    if (result.error) {
      // Log server-side for debugging
      // eslint-disable-next-line no-console
      console.error('setSession failed:', result.error);
      return NextResponse.json({ error: result.error.message, details: result.error }, { status: 500 });
    }

    // eslint-disable-next-line no-console
    console.log('setSession success');
    return NextResponse.json({ ok: true, data: result.data });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
