import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "@/i18n";
import { VALID_LOCALES } from "@/i18n/locales";
import type { Locale } from "@/i18n/types";
import { LocaleProvider } from "@/contexts/LocaleContext";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://move-over.vercel.app";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const valid = VALID_LOCALES.includes(locale as Locale);
  const loc = valid ? (locale as Locale) : "en";
  const t = getTranslations(loc);

  const title = t("seo.defaultTitle");
  const description = t("seo.defaultDescription");
  const ogTitle = t("seo.ogTitle");
  const ogDescription = t("seo.ogDescription");
  const siteName = t("seo.siteName");
  const localeUrl = `${BASE_URL}/${loc}`;

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description,
    keywords: ["Move", "Sui", "CTF", "smart contract security", "wargame", "OpenZeppelin"],
    authors: [{ name: "OpenZeppelin" }],
    creator: "OpenZeppelin",
    openGraph: {
      type: "website",
      locale: loc === "en" ? "en_US" : loc.replace("-", "_"),
      title: ogTitle,
      description: ogDescription,
      url: localeUrl,
      siteName,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
    },
    alternates: { canonical: localeUrl },
    robots: { index: true, follow: true },
  };
}

export function generateStaticParams() {
  return VALID_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!VALID_LOCALES.includes(locale as Locale)) {
    redirect("/en");
  }

  return (
    <LocaleProvider defaultLocale={locale as Locale}>
      {children}
    </LocaleProvider>
  );
}
