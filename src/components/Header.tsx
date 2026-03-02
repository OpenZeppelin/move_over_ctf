"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useLocale } from "@/contexts/LocaleContext";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function Header() {
  const { t, locale } = useLocale();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  return (
    <header className="shrink-0 min-h-14 border-b border-move-border bg-move-panel flex items-center px-3 sm:px-6 py-2 gap-2 flex-wrap">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <Link
          href={`/${locale}`}
          className="flex items-center shrink-0 gap-2 sm:gap-3 text-move-text hover:opacity-90 transition-opacity"
          aria-label={t("header.home")}
        >
          <Image
            src={isDark ? "/oz-logo.svg" : "/OZ-Logo-BlackBG.svg"}
            alt="OpenZeppelin"
            width={174}
            height={31}
            className="h-6 sm:h-8 w-auto max-w-[120px] sm:max-w-none"
            priority
          />
        </Link>
        <span className="text-move-muted font-medium hidden sm:inline">·</span>
        <Link
          href={`/${locale}`}
          className="text-lg sm:text-xl font-bold text-move-text tracking-tight hover:opacity-90 transition-opacity shrink-0"
        >
          Move<span className="text-oz-violet">-over</span>
        </Link>
        <a
          href="https://www.openzeppelin.com/careers"
          target="_blank"
          rel="noopener noreferrer"
          className="group hidden sm:inline-flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-oz-violet to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-oz-violet/25 hover:shadow-oz-violet/40 active:scale-[0.98] transition-all min-h-[44px]"
        >
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-white/20 text-xs">✨</span>
          {t("header.weAreHiring")}
          <span className="opacity-80 group-hover:translate-x-0.5 transition-transform">→</span>
        </a>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
