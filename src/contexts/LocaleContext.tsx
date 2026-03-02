"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getTranslations, type Locale, type TranslationKey } from "@/i18n";
import { LOCALE_OPTIONS } from "@/i18n/locales";
import { LOCALE_COOKIE, LOCALE_STORAGE_KEY } from "@/config";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  defaultLocale = "en",
}: {
  children: ReactNode;
  defaultLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(defaultLocale);
  }, [defaultLocale]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCALE_STORAGE_KEY, next);
        document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
        document.documentElement.lang = next === "zh-Hans" ? "zh-Hans" : next === "zh-Hant" ? "zh-Hant" : next;
        document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!mounted || typeof document === "undefined") return;
    document.documentElement.lang = locale === "zh-Hans" ? "zh-Hans" : locale === "zh-Hant" ? "zh-Hant" : locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [mounted, locale]);

  const t = useMemo(
    () => getTranslations(locale),
    [locale],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}
