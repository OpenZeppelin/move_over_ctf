"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { DIFFICULTY_DOTS, DIFFICULTY_TEXT_CLASS, type Level } from "@/data/levels";
import { LEVEL_SOLVED_EVENT, getSolvedIdsFromStorage } from "@/lib/progressStorage";
import { Typography } from "@/components/ui/Typography";

export function LevelSidebar({ levels }: { levels: Level[] }) {
  const params = useParams();
  const pathname = usePathname();
  const currentId = typeof params?.id === "string" ? Number(params.id) : Number.NaN;
  const isHowToPlayActive = pathname?.includes("/levels/how-to-play") ?? false;
  const isCompletionActive = pathname?.includes("/completion") ?? false;
  const { t, locale } = useLocale();
  const [solvedIds, setSolvedIds] = useState<Set<number>>(() => new Set());
  const allSolved = solvedIds.size >= levels.length && levels.length > 0;

  useEffect(() => {
    const syncSolvedIds = () => setSolvedIds(getSolvedIdsFromStorage());
    const frame = window.requestAnimationFrame(syncSolvedIds);
    window.addEventListener(LEVEL_SOLVED_EVENT, syncSolvedIds);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener(LEVEL_SOLVED_EVENT, syncSolvedIds);
    };
  }, []);

  return (
    <aside className="hidden md:flex w-64 shrink-0 bg-sidebar flex-col">
      <div className="px-6 pt-6 pb-3">
        <Typography.H2 variant="sidebar">{t("sidebar.levels")}</Typography.H2>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-6" aria-label={t("sidebar.levelsListAriaLabel")}>
        <Link
          href={`/${locale}/levels/how-to-play`}
          className={`
            w-full text-left px-3 py-2 rounded-lg mb-0.5 flex items-center gap-3
            transition-colors block text-sm font-medium
            ${
              isHowToPlayActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }
          `}
          aria-current={isHowToPlayActive ? "page" : undefined}
        >
          <Typography.Span className="text-muted-foreground font-mono text-sm w-5">?</Typography.Span>
          <Typography.Span className="flex-1 truncate">{t("sidebar.howToPlay")}</Typography.Span>
        </Link>
        <Link
          href={`/${locale}/completion`}
          title={allSolved ? undefined : t("sidebar.completionLockedTooltip")}
          className={`
            w-full text-left px-3 py-2 rounded-lg mb-0.5 flex items-center gap-3
            transition-colors block text-sm font-medium
            ${
              isCompletionActive
                ? "bg-muted text-foreground"
                : allSolved
                  ? "text-foreground hover:bg-accent/40"
                  : "text-muted-foreground hover:text-foreground"
            }
          `}
          aria-current={isCompletionActive ? "page" : undefined}
        >
          <Typography.Span
            className={`font-mono text-sm w-5 ${allSolved ? "text-success" : "text-muted-foreground"}`}
            aria-hidden
          >
            {allSolved ? "★" : "☆"}
          </Typography.Span>
          <Typography.Span className="flex-1 truncate">{t("sidebar.completion")}</Typography.Span>
          {!allSolved && (
            <Typography.Span className="text-muted-foreground font-mono text-xs">
              {solvedIds.size}/{levels.length}
            </Typography.Span>
          )}
        </Link>
        {levels.map((level) => {
          const isActive = !isHowToPlayActive && level.id === currentId;
          const dotCount = DIFFICULTY_DOTS[level.difficulty];
          return (
            <Link
              key={level.id}
              href={`/${locale}/levels/${level.id}`}
              className={`
                w-full text-left px-3 py-2 rounded-lg mb-0.5 flex items-center gap-3
                transition-colors block text-sm font-medium
                ${
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }
              `}
              aria-current={isActive ? "page" : undefined}
            >
              <Typography.Span className="text-muted-foreground font-mono text-sm w-5">
                {level.position}
              </Typography.Span>
              <Typography.Span className="flex-1 truncate">{level.name}</Typography.Span>
              <Typography.Span
                className={`flex gap-0.5 ${DIFFICULTY_TEXT_CLASS[level.difficulty]}`}
                title={level.difficulty}
              >
                {Array.from({ length: dotCount }).map((_, i) => (
                  <Typography.Span key={i} className="text-xs">
                    ●
                  </Typography.Span>
                ))}
              </Typography.Span>
              {level.completed || solvedIds.has(level.id) ? (
                <Typography.Span className="text-success text-sm" title={t("sidebar.completed")}>
                  ✓
                </Typography.Span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
