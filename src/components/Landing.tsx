"use client";

import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";

export function Landing() {
  const { t, locale } = useLocale();
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center max-w-2xl mx-auto">
      <h1 className="text-2xl sm:text-4xl font-bold text-move-text tracking-tight mb-4">
        A wargame for <span className="text-oz-violet">Move</span> on Sui
      </h1>
      <p className="text-move-muted text-base sm:text-lg leading-relaxed mb-6">
        {t("landing.description")}
      </p>
      <Link
        href={`/${locale}/levels/0`}
        className="group inline-flex items-center justify-center gap-2 min-h-[48px] px-6 sm:px-8 py-4 rounded-xl bg-oz-violet text-white text-base sm:text-lg font-semibold shadow-lg shadow-oz-violet/30 hover:shadow-oz-violet/50 active:scale-[0.98] transition-all duration-200"
      >
        {t("landing.cta")}
        <span className="opacity-80 group-hover:translate-x-1 transition-transform">
          →
        </span>
      </Link>
    </div>
  );
}
