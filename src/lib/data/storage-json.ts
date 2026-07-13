import { createServerSupabaseClient } from "@/lib/supabase/server";

const STORAGE_BUCKET = "productos";

async function getServiceSupabase() {
  return createServerSupabaseClient({ serviceRole: true });
}

export async function readStorageJson<T>(objectPath: string): Promise<T | null> {
  try {
    const supabase = await getServiceSupabase();
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(objectPath);
    if (error || !data) return null;
    const text = await data.text();
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function writeStorageJson(objectPath: string, value: unknown) {
  try {
    const supabase = await getServiceSupabase();
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(objectPath, JSON.stringify(value), {
      upsert: true,
      contentType: "application/json",
    });
    if (error) {
      console.error(`Unable to persist ${objectPath} to Supabase Storage`, error);
    }
  } catch (error) {
    console.error(`Unable to persist ${objectPath} to Supabase Storage`, error);
  }
}
