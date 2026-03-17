import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { LevelSidebar } from "@/components/LevelSidebar";
import { MobileLevelPicker } from "@/components/MobileLevelPicker";
import { Typography } from "@/components/ui/Typography";
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
  const pageTitle = `${t("howToPlay.title")} | ${t("seo.siteName")}`;
  const pageDescription = t("seo.howToPlayDescription");
  const url = `${BASE_URL}/${loc}/levels/how-to-play`;
  const languageAlternates = Object.fromEntries(
    VALID_LOCALES.map((localeCode) => [
      localeCode,
      `${BASE_URL}/${localeCode}/levels/how-to-play`,
    ])
  );

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: url,
      languages: {
        ...languageAlternates,
        "x-default": `${BASE_URL}/${DEFAULT_LOCALE}/levels/how-to-play`,
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

export default async function HowToPlayPage({ params }: Props) {
  const { locale } = await params;
  const loc = getSafeLocale(locale);

  if (loc !== locale) {
    redirect(`/${loc}/levels/how-to-play`);
  }

  const t = getTranslations(loc);
  const levels = getLevels(loc);

  return (
    <div className="h-screen flex flex-col min-h-0">
      <Header />
      <MobileLevelPicker levels={levels} />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <LevelSidebar levels={levels} />
        <main className="flex-1 overflow-auto p-4 sm:p-6 bg-move-dark">
          <div className="mx-auto max-w-3xl rounded-lg border border-move-border bg-move-panel p-5 sm:p-6">
            <Typography.H1 variant="page">{t("howToPlay.title")}</Typography.H1>
            <Typography.P variant="muted" className="mt-3">
              {t("howToPlay.welcome")}
            </Typography.P>

            <ol className="mt-5 space-y-3 text-sm sm:text-base text-move-text list-decimal list-inside">
              <li>{t("howToPlay.step1")}</li>
              <li>{t("howToPlay.step2")}</li>
              <li>{t("howToPlay.step3")}</li>
              <li>{t("howToPlay.step4")}</li>
            </ol>
            <section className="mt-6 rounded-lg border border-move-border bg-move-dark/40 p-4">
              <Typography.H2 variant="compact">{t("howToPlay.addLevelTitle")}</Typography.H2>
              <Typography.P className="mt-2">
                {t("howToPlay.addLevelBody")}
              </Typography.P>
              <a
                href="https://github.com/OpenZeppelin/move_over_ctf/blob/main/ADD_LEVEL_README.md"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center text-sm font-medium text-oz-violet hover:underline"
              >
                {t("howToPlay.addLevelLink")}
              </a>
            </section>

            <div className="mt-6">
              <Link
                href={`/${loc}/levels/0`}
                className="inline-flex items-center rounded-lg border border-oz-violet/40 bg-oz-violet/20 px-4 py-2 text-sm font-medium text-oz-violet hover:bg-oz-violet/30 transition-colors"
              >
                {t("howToPlay.startLevel0")}
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

