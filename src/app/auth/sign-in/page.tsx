"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSignIn = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      return;
    }

    // Persist session on server for all users so server-side requests are authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setMessage('No se pudo obtener la sesión del navegador.');
      return;
    }

    try {
      const persistRes = await fetch('/api/auth/session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token }),
      });

      const persistBody = await persistRes.json().catch(() => ({}));
      if (!persistRes.ok) {
        setMessage(persistBody.error ?? 'No se pudo persistir la sesión en el servidor.');
        return;
      }
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Error de red al persistir la sesión.');
      return;
    }

    // Allow server to set cookies, then check admin flag and redirect
    await new Promise((resolve) => setTimeout(resolve, 250));

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      const normalizedEmail = user.email.toLowerCase();
      const isConfiguredAdmin = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean)
        .includes(normalizedEmail);

      if (isConfiguredAdmin) {
        window.location.assign('/admin');
        return;
      }
    }

    window.location.assign('/account');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-zinc-950/80 p-8 shadow-2xl">
        <h1 className="text-3xl font-semibold">Ingresar</h1>
        <p className="mt-3 text-sm text-zinc-400">Accede con tu cuenta o regístrate si todavía no tienes una.</p>

        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@email.com"
          className="mt-6 w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contraseña"
          className="mt-4 w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
        />
        <button
          onClick={handleSignIn}
          className="mt-6 w-full rounded-full bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
        >
          Entrar
        </button>

        <div className="mt-6 flex justify-start text-sm text-zinc-400">
          <Link href="/auth/register" className="text-white underline">Registrarse</Link>
        </div>

        {message ? <p className="mt-4 text-sm text-zinc-400">{message}</p> : null}
      </div>
    </div>
  );
}
