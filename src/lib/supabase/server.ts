import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

interface CreateServerSupabaseClientOptions {
  serviceRole?: boolean;
}

export async function createServerSupabaseClient(options: CreateServerSupabaseClientOptions = {}) {
  const cookieStore = await cookies();
  const { serviceRole = false } = options;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRole ? process.env.SUPABASE_SERVICE_ROLE_KEY! : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              // Next.js cookies().set expects a single object with name/value/options
              cookieStore.set({ name, value, ...options });
            }
          } catch {
            // The `setAll` method can be called in a Server Component or Route Handler.
          }
        },
      },
    },
  );
}
