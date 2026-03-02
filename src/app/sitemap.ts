import type { MetadataRoute } from "next";
import { LEVEL_IDS } from "@/data/levels";
import { VALID_LOCALES } from "@/i18n/locales";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://move-over.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of VALID_LOCALES) {
    entries.push({
      url: `${BASE_URL}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    });
    for (const id of LEVEL_IDS) {
      entries.push({
        url: `${BASE_URL}/${locale}/levels/${id}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  return entries;
}
