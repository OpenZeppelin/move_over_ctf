import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { LevelSidebar } from "@/components/LevelSidebar";
import { MobileLevelPicker } from "@/components/MobileLevelPicker";
import { CompletionPageBody } from "@/components/completion/CompletionPageBody";
import { BASE_URL } from "@/config";
import { getLevels } from "@/data/levels";
import { getTranslations } from "@/i18n";
import { DEFAULT_LOCALE, VALID_LOCALES, getSafeLocale } from "@/i18n/locales";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const loc = getSafeLocale(locale);
  const t = getTranslations(loc);
  const pageTitle = `${t("completion.pageTitle")} | ${t("seo.siteName")}`;
  const pageDescription = t("completion.pageDescription");
  const url = `${BASE_URL}/${loc}/completion`;
  const languageAlternates = Object.fromEntries(
    VALID_LOCALES.map((localeCode) => [
      localeCode,
      `${BASE_URL}/${localeCode}/completion`,
    ]),
  );

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: url,
      languages: {
        ...languageAlternates,
        "x-default": `${BASE_URL}/${DEFAULT_LOCALE}/completion`,
      },
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url,
      siteName: t("seo.siteName"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
    },
  };
}

export function generateStaticParams() {
  return VALID_LOCALES.map((locale) => ({ locale }));
}

export default async function CompletionPage({ params }: Props) {
  const { locale } = await params;
  const loc = getSafeLocale(locale);

  if (loc !== locale) {
    redirect(`/${loc}/completion`);
  }

  const levels = getLevels(loc);

  return (
    <div className="h-screen flex flex-col min-h-0">
      <Header />
      <MobileLevelPicker levels={levels} />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <LevelSidebar levels={levels} />
        <main className="flex-1 overflow-auto p-5 sm:p-8 bg-background">
          <CompletionPageBody levelsTotal={levels.length} />
        </main>
      </div>
    </div>
  );
}
