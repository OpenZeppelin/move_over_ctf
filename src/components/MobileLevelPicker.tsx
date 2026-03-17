"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import type { Level } from "@/data/levels";

export function MobileLevelPicker({ levels }: { levels: Level[] }) {
  const params = useParams();
  const pathname = usePathname();
  const currentId = typeof params?.id === "string" ? Number(params.id) : Number.NaN;
  const isHowToPlayActive = pathname?.includes("/levels/how-to-play") ?? false;
  const { locale, t } = useLocale();

  return (
    <div className="md:hidden shrink-0 border-b border-move-border bg-move-panel px-3 py-2 overflow-x-auto">
      <div className="flex gap-2 min-w-max pb-1" role="tablist" aria-label={t("mobilePicker.selectLevelAriaLabel")}>
        <Link
          href={`/${locale}/levels/how-to-play`}
          className={`
            shrink-0 min-h-[44px] inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oz-violet/60
            ${isHowToPlayActive ? "bg-oz-violet text-white" : "text-move-text bg-white/5 hover:bg-white/10"}
          `}
          aria-current={isHowToPlayActive ? "page" : undefined}
        >
          {t("mobilePicker.howToPlay")}
        </Link>
        {levels.map((level) => {
          const isActive = !isHowToPlayActive && level.id === currentId;
          return (
            <Link
              key={level.id}
              href={`/${locale}/levels/${level.id}`}
              className={`
                shrink-0 min-h-[44px] inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oz-violet/60
                ${isActive ? "bg-oz-violet text-white" : "text-move-text bg-white/5 hover:bg-white/10"}
              `}
              aria-current={isActive ? "page" : undefined}
            >
              {level.id}: {level.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
