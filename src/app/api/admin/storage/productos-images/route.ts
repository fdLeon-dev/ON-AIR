import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveAdminAccess } from "@/lib/admin/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const STORAGE_BUCKET = "productos";
const IMAGE_EXTENSION_REGEX = /\.(png|jpe?g|webp|gif|avif|svg)$/i;

type StorageEntry = {
  name: string;
  id?: string | null;
  metadata?: Record<string, unknown> | null;
};

async function listBucketImages(supabase: SupabaseClient, folderPath = ""): Promise<string[]> {
  const collected: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).list(folderPath, {
      limit: 100,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      break;
    }

    for (const item of data as StorageEntry[]) {
      const fullPath = folderPath ? `${folderPath}/${item.name}` : item.name;
      const isFolder = !item.metadata;

      if (isFolder) {
        const nested = await listBucketImages(supabase, fullPath);
        collected.push(...nested);
        continue;
      }

      if (IMAGE_EXTENSION_REGEX.test(item.name)) {
        collected.push(fullPath);
      }
    }

    offset += data.length;
  }

  return collected;
}

export async function GET() {
  const { isAdmin } = await resolveAdminAccess();
  if (!isAdmin) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  try {
    const supabase = await createServerSupabaseClient({ serviceRole: true });
    const paths = await listBucketImages(supabase);

    const images = paths.map((path) => {
      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      return {
        path,
        name: path.split("/").pop() ?? path,
        publicUrl: data.publicUrl,
      };
    });

    return NextResponse.json({ images });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo listar el bucket de imagenes.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
