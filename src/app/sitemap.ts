import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://peak-sport.example",
      lastModified: new Date(),
    },
    {
      url: "https://peak-sport.example/catalog",
      lastModified: new Date(),
    },
    {
      url: "https://peak-sport.example/promotions",
      lastModified: new Date(),
    },
  ];
}
