import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "@/i18n";
import { DEFAULT_LOCALE, VALID_LOCALES, getSafeLocale, isValidLocale } from "@/i18n/locales";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { BASE_URL } from "@/config";

const SOCIAL_PROFILES = [
  "https://x.com/openzeppelin",
  "https://www.linkedin.com/company/openzeppelin/",
  "https://www.youtube.com/@OpenZeppelin",
  "https://www.facebook.com/openzeppelin/",
  "https://www.instagram.com/openzeppelin/",
];

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const loc = getSafeLocale(locale);
  const t = getTranslations(loc);

  const title = t("seo.defaultTitle");
  const description = t("seo.defaultDescription");
  const ogTitle = t("seo.ogTitle");
  const ogDescription = t("seo.ogDescription");
  const siteName = t("seo.siteName");
  const localeUrl = `${BASE_URL}/${loc}`;
  const languageAlternates = Object.fromEntries(
    VALID_LOCALES.map((localeCode) => [localeCode, `${BASE_URL}/${localeCode}`])
  );

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
      images: [
        {
          url: "/card-preview.png",
          width: 1200,
          height: 671,
          alt: ogTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: ["/card-preview.png"],
    },
    alternates: {
      canonical: localeUrl,
      languages: {
        ...languageAlternates,
        "x-default": `${BASE_URL}/${DEFAULT_LOCALE}`,
      },
    },
    robots: { index: true, follow: true },
  };
}

export function generateStaticParams() {
  return VALID_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    redirect(`/${DEFAULT_LOCALE}`);
  }
  const loc = locale;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}#organization`,
    name: "Move-over",
    url: BASE_URL,
    logo: `${BASE_URL}/oz-logo.svg`,
    sameAs: SOCIAL_PROFILES,
  };

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}#website`,
    url: BASE_URL,
    name: "Move-over",
    inLanguage: loc,
    publisher: { "@id": `${BASE_URL}#organization` },
  };

  return (
    <>
      <LocaleProvider defaultLocale={loc}>{children}</LocaleProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
    </>
  );
}
