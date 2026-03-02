"use client";

import { useRef, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { LOCALE_OPTIONS } from "@/i18n/locales";
import type { Locale } from "@/i18n/types";

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const currentLabel = LOCALE_OPTIONS.find((o) => o.code === locale)?.label ?? "English";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-move-border bg-move-panel px-3 py-2 text-sm font-medium text-move-text hover:bg-move-border/30 active:scale-[0.98] transition-colors touch-manipulation"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("header.language")}
      >
        <span className="max-w-[120px] truncate sm:max-w-[140px]" dir="auto">
          {currentLabel}
        </span>
        <svg
          className="size-4 shrink-0 text-move-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-50 mt-1 max-h-[70vh] min-w-[180px] overflow-auto rounded-lg border border-move-border bg-move-panel py-1 shadow-lg"
          aria-label={t("header.language")}
        >
          {LOCALE_OPTIONS.map((option) => (
            <li key={option.code} role="option" aria-selected={locale === option.code}>
              <button
                type="button"
                onClick={() => {
                  const newLocale = option.code as Locale;
                  setLocale(newLocale);
                  setOpen(false);
                  const pathWithoutLocale = pathname.replace(/^\/[^/]+/, "") || "/";
                  router.push(`/${newLocale}${pathWithoutLocale}`);
                }}
                className={`w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-move-border/50 ${
                  locale === option.code ? "bg-oz-violet/15 text-oz-violet font-medium" : "text-move-text"
                }`}
                dir="auto"
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
