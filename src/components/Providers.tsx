"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { LocaleProvider } from "@/contexts/LocaleContext";
import type { Locale } from "@/i18n/types";

export function Providers({
  children,
  initialLocale = "en",
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  return (
    <ThemeProvider>
      <LocaleProvider defaultLocale={initialLocale}>
        {children}
      </LocaleProvider>
    </ThemeProvider>
  );
}
