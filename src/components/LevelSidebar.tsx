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
  const { t, locale } = useLocale();
  const [solvedIds, setSolvedIds] = useState<Set<number>>(() => new Set());

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
    <aside className="hidden md:flex w-64 shrink-0 border-r border-move-border bg-move-panel flex-col">
      <div className="p-4 border-b border-move-border">
        <Typography.H2 variant="sidebar">{t("sidebar.levels")}</Typography.H2>
      </div>
      <nav className="flex-1 overflow-y-auto p-2" aria-label="Level list">
        <Link
          href={`/${locale}/levels/how-to-play`}
          className={`
            w-full text-left px-3 py-2.5 rounded-lg mb-1 flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oz-violet/60
            transition-colors block
            ${
              isHowToPlayActive
                ? "bg-oz-violet/15 text-oz-violet border border-oz-violet/30"
                : "text-move-text hover:bg-white/5 border border-transparent"
            }
          `}
          aria-current={isHowToPlayActive ? "page" : undefined}
        >
          <Typography.Span className="text-move-muted font-mono text-sm w-6">?</Typography.Span>
          <Typography.Span className="flex-1 truncate font-medium">How to Play</Typography.Span>
        </Link>
        {levels.map((level) => {
          const isActive = !isHowToPlayActive && level.id === currentId;
          const dotCount = DIFFICULTY_DOTS[level.difficulty];
          return (
            <Link
              key={level.id}
              href={`/${locale}/levels/${level.id}`}
              className={`
                w-full text-left px-3 py-2.5 rounded-lg mb-0.5 flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oz-violet/60
                transition-colors block
                ${
                  isActive
                    ? "bg-oz-violet/15 text-oz-violet border border-oz-violet/30"
                    : "text-move-text hover:bg-white/5 border border-transparent"
                }
              `}
              aria-current={isActive ? "page" : undefined}
            >
              <Typography.Span className="text-move-muted font-mono text-sm w-6">
                {level.id}
              </Typography.Span>
              <Typography.Span className="flex-1 truncate font-medium">{level.name}</Typography.Span>
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
                <Typography.Span className="text-move-success text-sm" title="Completed">
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
