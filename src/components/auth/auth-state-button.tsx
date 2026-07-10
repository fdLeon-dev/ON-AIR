"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthStateButton() {
  const [session, setSession] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    void supabase.auth.getUser().then(({ data }) => {
      setSession(Boolean(data.user));
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(Boolean(currentSession));
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return null;
  }

  if (session) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/account" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10">
          Mi cuenta
        </Link>
        <button
          type="button"
          onClick={async () => {
            const supabase = createClient();
            await supabase?.auth.signOut();
            window.localStorage.removeItem("peak-sport-admin");
            window.location.href = "/";
          }}
          className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <Link href="/auth/sign-in" className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200">
      Entrar a mi cuenta
    </Link>
  );
}
