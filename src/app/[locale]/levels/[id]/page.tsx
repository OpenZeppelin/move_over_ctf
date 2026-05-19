import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { LevelSidebar } from "@/components/LevelSidebar";
import { LevelView } from "@/components/LevelView";
import { MobileLevelPicker } from "@/components/MobileLevelPicker";
import { getLevel, getLevels } from "@/data/levels";
import { getTranslations } from "@/i18n";
import { replaceTemplate } from "@/i18n/utils";
import { BASE_URL } from "@/config";
import { DEFAULT_LOCALE, VALID_LOCALES, getSafeLocale } from "@/i18n/locales";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateStaticParams() {
  const ids = (await import("@/data/levels")).LEVEL_IDS;
  const params: { locale: string; id: string }[] = [];
  for (const locale of VALID_LOCALES) {
    for (const id of ids) {
      params.push({ locale, id: String(id) });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const loc = getSafeLocale(locale);
  const levels = getLevels(loc);
  const level = getLevel(loc, Number(id)) ?? levels[0];
  const t = getTranslations(loc);
  const title = replaceTemplate(t("seo.levelTitle"), { id: level.id, name: level.name });
  const description = level.description;
  const url = `${BASE_URL}/${loc}/levels/${level.id}`;
  const languageAlternates = Object.fromEntries(
    VALID_LOCALES.map((localeCode) => [
      localeCode,
      `${BASE_URL}/${localeCode}/levels/${level.id}`,
    ])
  );

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: t("seo.siteName"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: url,
      languages: {
        ...languageAlternates,
        "x-default": `${BASE_URL}/${DEFAULT_LOCALE}/levels/${level.id}`,
      },
    },
  };
}

export default async function LevelPage({ params }: Props) {
  const { locale, id } = await params;
  const loc = getSafeLocale(locale);
  const numericId = Number(id);
  const level = getLevel(loc, numericId);
  const levels = getLevels(loc);

  if (!level) {
    redirect(`/${loc}/levels/0`);
  }

  return (
    <div className="h-screen flex flex-col min-h-0">
      <Header />
      <MobileLevelPicker levels={levels} />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <LevelSidebar levels={levels} />
        <LevelView level={level} levelsTotal={levels.length} />
      </div>
    </div>
  );
}
