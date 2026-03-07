"use client";

import Link from "next/link";
import type { Level } from "@/data/levels";
import { DIFFICULTY_BADGE_CLASS } from "@/data/levels";
import { Typography } from "@/components/ui/Typography";
import { useLocale } from "@/contexts/LocaleContext";

type Props = {
  level: Level;
  modulePath: string;
  hasPassed: boolean;
  prevHref?: string;
  prevLevelId?: number;
  nextLevelId?: number;
  locale: string;
};

export function LevelHeader({
  level,
  modulePath,
  hasPassed,
  prevHref,
  prevLevelId,
  nextLevelId,
  locale,
}: Props) {
  const { t } = useLocale();
  return (
    <div className="border-b border-move-border bg-move-panel px-4 sm:px-6 py-4 sm:py-5">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Typography.Span
          className="font-mono text-[10px] sm:text-xs uppercase tracking-widest px-2.5 py-1 rounded border border-move-border bg-move-dark text-move-muted"
          aria-label={`Level ${level.id}`}
        >
          Level {level.id}
        </Typography.Span>
        <Typography.H1
          variant="level"
          className="bg-move-dark/80 border border-move-border rounded px-3 py-1.5 inline-block"
        >
          {level.name}
        </Typography.H1>
        <div className="ml-auto inline-flex items-center gap-2">
          {prevHref !== undefined && (
            <Link
              href={prevHref}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-move-border bg-move-dark text-move-text hover:bg-move-panel transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oz-violet/60"
              aria-label={prevLevelId !== undefined ? `Go to level ${prevLevelId}` : "Go to How to Play"}
              title={prevLevelId !== undefined ? `Previous level (${prevLevelId})` : "How to Play"}
            >
              ←
            </Link>
          )}
          {nextLevelId !== undefined && (
            <Link
              href={`/${locale}/levels/${nextLevelId}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-move-border bg-move-dark text-move-text hover:bg-move-panel transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oz-violet/60"
              aria-label={`Go to level ${nextLevelId}`}
              title={`Next level (${nextLevelId})`}
            >
              →
            </Link>
          )}
        </div>
      </div>
      <Typography.P
        variant="unstyled"
        className="mt-2 flex flex-wrap items-center gap-2 font-mono text-xs text-move-muted"
      >
        <Typography.Span
          className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${DIFFICULTY_BADGE_CLASS[level.difficulty]}`}
        >
          {level.difficulty}
        </Typography.Span>
        <Typography.Span className="text-move-muted/70" aria-hidden>
          ·
        </Typography.Span>
        <Typography.Span className="text-move-muted/80">Contract:</Typography.Span>
        <code className="text-move-accent">{modulePath}</code>
      </Typography.P>
      <Typography.P variant="smallMuted" className="mt-1">
        {level.description}
      </Typography.P>
      {level.author && (
        <Typography.P variant="smallMuted" className="mt-1">
          <Typography.Span className="text-move-muted/80">Author:</Typography.Span>{" "}
          {level.author.github ? (
            <a
              href={level.author.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-oz-violet hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oz-violet/60 rounded"
            >
              {level.author.name}
            </a>
          ) : (
            <Typography.Span className="text-move-text">{level.author.name}</Typography.Span>
          )}
        </Typography.P>
      )}
      {hasPassed && (
        <div className="mt-3 rounded-xl border-2 border-emerald-400/55 bg-emerald-500/12 px-3 py-2.5 shadow-[0_0_20px_rgba(16,185,129,0.18)]">
          <Typography.P
            variant="unstyled"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-move-text"
          >
            <Typography.Span aria-hidden>🏆</Typography.Span>
            {t("level.passedMessage")}
          </Typography.P>
        </div>
      )}
    </div>
  );
}
