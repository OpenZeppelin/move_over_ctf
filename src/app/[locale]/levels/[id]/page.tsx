import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { LevelSidebar } from "@/components/LevelSidebar";
import { LevelView } from "@/components/LevelView";
import { MobileLevelPicker } from "@/components/MobileLevelPicker";
import { getLevel, getLevels } from "@/data/levels";
import { getTranslations } from "@/i18n";
import { replaceTemplate } from "@/i18n/utils";
import { VALID_LOCALES } from "@/i18n/locales";
import { BASE_URL } from "@/config";
import type { Locale } from "@/i18n/types";

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
  const loc = VALID_LOCALES.includes(locale as Locale) ? (locale as Locale) : "en";
  const levels = getLevels(loc);
  const level = levels.find((l) => String(l.id) === id) ?? levels[0];
  const t = getTranslations(loc);
  const title = replaceTemplate(t("seo.levelTitle"), { id: level.id, name: level.name });
  const description = level.description;
  const url = `${BASE_URL}/${loc}/levels/${level.id}`;

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
    alternates: { canonical: url },
  };
}

export default async function LevelPage({ params }: Props) {
  const { locale, id } = await params;
  const loc = VALID_LOCALES.includes(locale as Locale) ? (locale as Locale) : "en";
  const numId = Number(id);
  const levels = getLevels(loc);
  const validId =
    Number.isFinite(numId) && numId >= 0 && numId < levels.length ? numId : 0;
  const currentLevel = getLevel(loc, validId) ?? levels[0];

  if (Number(id) !== validId) {
    redirect(`/${loc}/levels/0`);
  }

  return (
    <div className="h-screen flex flex-col min-h-0">
      <Header />
      <MobileLevelPicker levels={levels} />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <LevelSidebar levels={levels} />
        <LevelView level={currentLevel} />
      </div>
    </div>
  );
}
