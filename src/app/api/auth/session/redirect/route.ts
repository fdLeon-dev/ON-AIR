import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  let access_token: string | null = null;
  let refresh_token: string | null = null;

  if (contentType.includes("application/json")) {
    const body = await request.json();
    access_token = body.access_token;
    refresh_token = body.refresh_token;
  } else {
    const formData = await request.formData();
    access_token = formData.get("access_token") as string | null;
    refresh_token = formData.get("refresh_token") as string | null;
  }

  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const result = await supabase.auth.setSession({ access_token, refresh_token });

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.redirect(new URL("/admin", request.url));
}
