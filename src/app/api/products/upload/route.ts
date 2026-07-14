import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((value): value is File => value instanceof File);

    if (!files.length) {
      return NextResponse.json({ error: "No se enviaron archivos" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient({ serviceRole: true });
    const urls: string[] = [];

    for (const file of files.slice(0, 4)) {
      const safeName = `products/${Date.now()}-${file.name.replace(/[^a-z0-9.\-]/gi, "_")}`;
      const { error } = await supabase.storage.from("productos").upload(safeName, file, { upsert: true, contentType: file.type || "application/octet-stream" });

      if (error) {
        console.error("Upload failed", error);
        continue;
      }

      const { data } = supabase.storage.from("productos").getPublicUrl(safeName);
      urls.push(data.publicUrl);
    }

    return NextResponse.json({ urls });
  } catch (error) {
    console.error("Failed to upload product images", error);
    return NextResponse.json({ error: "No se pudieron subir las imágenes" }, { status: 500 });
  }
}
