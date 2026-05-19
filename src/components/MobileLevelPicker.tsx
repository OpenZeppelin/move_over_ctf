"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import type { Level } from "@/data/levels";
import { LEVEL_SOLVED_EVENT, getSolvedIdsFromStorage } from "@/lib/progressStorage";

export function MobileLevelPicker({ levels }: { levels: Level[] }) {
  const params = useParams();
  const pathname = usePathname();
  const currentId = typeof params?.id === "string" ? Number(params.id) : Number.NaN;
  const isHowToPlayActive = pathname?.includes("/levels/how-to-play") ?? false;
  const isCompletionActive = pathname?.includes("/completion") ?? false;
  const { locale, t } = useLocale();
  const [solvedCount, setSolvedCount] = useState(0);
  const allSolved = solvedCount >= levels.length && levels.length > 0;

  useEffect(() => {
    const sync = () => setSolvedCount(getSolvedIdsFromStorage().size);
    sync();
    window.addEventListener(LEVEL_SOLVED_EVENT, sync);
    return () => window.removeEventListener(LEVEL_SOLVED_EVENT, sync);
  }, []);

  return (
    <div className="md:hidden shrink-0 border-b border-border bg-background px-3 py-2 overflow-x-auto">
      <div className="flex gap-1.5 min-w-max pb-1" role="tablist" aria-label={t("mobilePicker.selectLevelAriaLabel")}>
        <Link
          href={`/${locale}/levels/how-to-play`}
          className={`
            shrink-0 h-9 inline-flex items-center px-3 rounded-md text-sm font-medium transition-colors
            ${isHowToPlayActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}
          `}
          aria-current={isHowToPlayActive ? "page" : undefined}
        >
          {t("mobilePicker.howToPlay")}
        </Link>
        <Link
          href={`/${locale}/completion`}
          className={`
            shrink-0 h-9 inline-flex items-center gap-1.5 px-3 rounded-md text-sm font-medium transition-colors
            ${
              isCompletionActive
                ? "bg-muted text-foreground"
                : allSolved
                  ? "text-foreground hover:bg-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }
          `}
          aria-current={isCompletionActive ? "page" : undefined}
        >
          <span aria-hidden className={allSolved ? "text-success" : "text-muted-foreground"}>
            {allSolved ? "★" : "☆"}
          </span>
          {t("sidebar.completion")}
        </Link>
        {levels.map((level) => {
          const isActive = !isHowToPlayActive && level.id === currentId;
          return (
            <Link
              key={level.id}
              href={`/${locale}/levels/${level.id}`}
              className={`
                shrink-0 h-9 inline-flex items-center px-3 rounded-md text-sm font-medium transition-colors
                ${isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}
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
