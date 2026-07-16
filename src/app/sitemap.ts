import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://runtime.example",
      lastModified: new Date(),
    },
    {
      url: "https://runtime.example/catalog",
      lastModified: new Date(),
    },
    {
      url: "https://runtime.example/promotions",
      lastModified: new Date(),
    },
  ];
}
