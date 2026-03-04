import type { MetadataRoute } from "next";
import { BASE_URL } from "@/config";
import { LEVEL_IDS } from "@/data/levels";
import { VALID_LOCALES } from "@/i18n/locales";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const lastModified = new Date();

  for (const locale of VALID_LOCALES) {
    entries.push({
      url: `${BASE_URL}/${locale}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    });
    entries.push({
      url: `${BASE_URL}/${locale}/levels/how-to-play`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    });
    for (const id of LEVEL_IDS) {
      entries.push({
        url: `${BASE_URL}/${locale}/levels/${id}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  return entries;
}
