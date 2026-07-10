import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email y contraseña son obligatorios." },
        { status: 400 },
      );
    }

    const authSupabase = await createServerSupabaseClient();
    const { data: signUpData, error: signUpError } = await authSupabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (!signUpError && signUpData?.user) {
      return NextResponse.json({
        ok: true,
        requires_confirmation: true,
        user: signUpData.user,
        message: "Cuenta creada. Revisa tu correo para confirmar la cuenta.",
      });
    }

    console.error("Supabase signup failed, falling back to service-role creation", {
      error: signUpError,
      user: signUpData?.user,
    });

    const serviceSupabase = await createServerSupabaseClient({ serviceRole: true });
    const { data: createdUser, error: createError } = await serviceSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name: name },
    });

    if (createError || !createdUser?.user) {
      return NextResponse.json(
        {
          ok: false,
          error: createError?.message ?? "No se pudo crear la cuenta.",
          details: createError ?? signUpError,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      requires_confirmation: true,
      user: createdUser.user,
      message: "La cuenta se creó correctamente, pero el correo de confirmación depende de la configuración de email de Supabase.",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error inesperado" },
      { status: 500 },
    );
  }
}
