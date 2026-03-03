import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Landing } from "@/components/Landing";
import { BASE_URL } from "@/config";
import { getTranslations } from "@/i18n";
import { VALID_LOCALES } from "@/i18n/locales";
import type { Locale } from "@/i18n/types";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const loc = VALID_LOCALES.includes(locale as Locale) ? (locale as Locale) : "en";
  const t = getTranslations(loc);
  const title = `${t("seo.siteName")}: Move Smart Contract Security CTF`;
  const description =
    "Practice Move smart contract security in a browser runtime. Inspect vulnerable contracts, write run() exploit paths, return the Flag object, and solve CTF levels.";
  const ogTitle = `${t("seo.siteName")} | Move Security Training`;
  const url = `${BASE_URL}/${loc}`;
  const languageAlternates = Object.fromEntries(
    VALID_LOCALES.map((localeCode) => [localeCode, `${BASE_URL}/${localeCode}`])
  );

  return {
    title,
    description,
    keywords: [
      "Move security",
      "browser runtime",
      "Move CTF",
      "smart contract security",
      "write run",
      "return Flag",
      "exploit training",
    ],
    alternates: {
      canonical: url,
      languages: {
        ...languageAlternates,
        "x-default": `${BASE_URL}/en`,
      },
    },
    openGraph: {
      title: ogTitle,
      description,
      url,
      siteName: t("seo.siteName"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
    },
  };
}

export default function LocaleHome() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <Landing />
    </div>
  );
}
