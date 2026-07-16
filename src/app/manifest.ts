import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RUNTIME®",
    short_name: "RUNTIME®",
    description: "RUNTIME® | Indumentaria deportiva premium para rendimiento y estilo urbano.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    lang: "es",
    icons: [
      {
        src: "/file.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
