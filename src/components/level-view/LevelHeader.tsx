"use client";

import Link from "next/link";
import type { Level } from "@/data/levels";
import { DIFFICULTY_BADGE_CLASS } from "@/data/levels";
import { Typography } from "@/components/ui/Typography";
import { useLocale } from "@/contexts/LocaleContext";
import { replaceTemplate } from "@/i18n/utils";

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
    <div className="border-b border-border bg-background px-5 sm:px-8 py-5 sm:py-6">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Typography.Span
          className="font-mono text-[10px] sm:text-xs uppercase tracking-widest px-2.5 py-1 rounded border border-border bg-background text-muted-foreground"
          aria-label={replaceTemplate(t("level.levelAriaLabel"), { id: level.id })}
        >
          Level {level.id}
        </Typography.Span>
        <Typography.H1
          variant="level"
          className="bg-background/80 border border-border rounded px-3 py-1.5 inline-block"
        >
          {level.name}
        </Typography.H1>
        <div className="ml-auto inline-flex items-center gap-2">
          {prevHref !== undefined && (
            <Link
              href={prevHref}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={prevLevelId !== undefined ? replaceTemplate(t("level.goToLevel"), { id: prevLevelId }) : t("level.goToHowToPlay")}
              title={prevLevelId !== undefined ? replaceTemplate(t("level.prevLevel"), { id: prevLevelId }) : t("sidebar.howToPlay")}
            >
              ←
            </Link>
          )}
          {nextLevelId !== undefined && (
            <Link
              href={`/${locale}/levels/${nextLevelId}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={replaceTemplate(t("level.goToLevel"), { id: nextLevelId })}
              title={replaceTemplate(t("level.nextLevel"), { id: nextLevelId })}
            >
              →
            </Link>
          )}
        </div>
      </div>
      <Typography.P
        variant="unstyled"
        className="mt-2 flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground"
      >
        <Typography.Span
          className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${DIFFICULTY_BADGE_CLASS[level.difficulty]}`}
        >
          {level.difficulty}
        </Typography.Span>
        <Typography.Span className="text-muted-foreground/70" aria-hidden>
          ·
        </Typography.Span>
        <Typography.Span className="text-muted-foreground/80">{t("level.contractLabel")}</Typography.Span>
        <code className="text-selected">{modulePath}</code>
      </Typography.P>
      <Typography.P variant="smallMuted" className="mt-1">
        {level.description}
      </Typography.P>
      {level.author && (
        <Typography.P variant="smallMuted" className="mt-1">
          <Typography.Span className="text-muted-foreground/80">{t("level.authorLabel")}</Typography.Span>{" "}
          {level.author.github ? (
            <a
              href={level.author.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-selected hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              {level.author.name}
            </a>
          ) : (
            <Typography.Span className="text-foreground">{level.author.name}</Typography.Span>
          )}
        </Typography.P>
      )}
      {hasPassed && (
        <div className="mt-3 rounded-xl border-2 border-emerald-400/55 bg-emerald-500/12 px-3 py-2.5 shadow-[0_0_20px_rgba(16,185,129,0.18)]">
          <Typography.P
            variant="unstyled"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-foreground"
          >
            <Typography.Span aria-hidden>🏆</Typography.Span>
            {t("level.passedMessage")}
          </Typography.P>
        </div>
      )}
    </div>
  );
}
