"use client";

import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        setMessage(payload?.error ?? "No se pudo crear la cuenta.");
        return;
      }

      setMessage(payload?.message ?? "Cuenta creada. Revisa tu correo para confirmar la cuenta.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear la cuenta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-zinc-950/80 p-8 shadow-2xl">
        <h1 className="text-3xl font-semibold">Registro</h1>
        <p className="mt-3 text-sm text-zinc-400">Crea una cuenta para comprar, guardar favoritos y ver tus pedidos.</p>

        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre completo"
          className="mt-6 w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
        />
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@email.com"
          className="mt-4 w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contraseña"
          className="mt-4 w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
        />
        <button
          onClick={handleRegister}
          disabled={isSubmitting}
          className="mt-6 w-full rounded-full bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Creando cuenta..." : "Registrarse"}
        </button>

        <div className="mt-6 text-sm text-zinc-400">
          <Link href="/auth/sign-in" className="text-white underline">Ya tengo cuenta</Link>
        </div>

        {message ? <p className="mt-4 text-sm text-zinc-400">{message}</p> : null}
      </div>
    </div>
  );
}
