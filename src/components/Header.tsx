"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useLocale } from "@/contexts/LocaleContext";
import { LEVEL_PROGRESS_META } from "@/data/levels/progressMeta";
import {
  LEVEL_SOLVED_EVENT,
  PROGRESS_UPDATED_EVENT,
  getSolvedIdsFromStorage,
} from "@/lib/progressStorage";
import { Typography } from "@/components/ui/Typography";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { Progress, Tooltip, TooltipContent, TooltipTrigger } from "@openzeppelin/ui-components";
import { replaceTemplate } from "@/i18n/utils";

const EMPTY_SUBSCRIBE = () => () => {};

export function Header() {
  const { t, locale } = useLocale();
  const { resolvedTheme } = useTheme();
  const hasHydrated = useSyncExternalStore(EMPTY_SUBSCRIBE, () => true, () => false);
  const isDark = hasHydrated ? resolvedTheme !== "light" : false;
  const [solvedIds, setSolvedIds] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    const syncSolved = () => setSolvedIds(getSolvedIdsFromStorage());
    syncSolved();
    window.addEventListener(LEVEL_SOLVED_EVENT, syncSolved);
    window.addEventListener(PROGRESS_UPDATED_EVENT, syncSolved);
    return () => {
      window.removeEventListener(LEVEL_SOLVED_EVENT, syncSolved);
      window.removeEventListener(PROGRESS_UPDATED_EVENT, syncSolved);
    };
  }, []);

  const solvedCount = useMemo(
    () => LEVEL_PROGRESS_META.reduce((acc, level) => acc + (solvedIds.has(level.id) ? 1 : 0), 0),
    [solvedIds],
  );
  const totalCount = LEVEL_PROGRESS_META.length;
  const progressPct = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

  return (
    <header className="shrink-0 border-b border-border bg-background">
      <div className="flex h-14 items-center px-4 sm:px-6 md:px-10">
        {/* Left: logo + app name inline */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity"
          aria-label={t("header.home")}
        >
          <Image
            src={isDark ? "/oz-logo.svg" : "/OZ-Logo-BlackBG.svg"}
            alt="OpenZeppelin"
            width={174}
            height={31}
            className="h-6 w-auto"
            priority
          />
          <Typography.Span className="text-sm text-muted-foreground">
            Move-over
          </Typography.Span>
        </Link>

        {/* Spacer */}
        <div className="flex-1 min-w-0" />

        {/* Right: progress, locale, theme */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0" dir="ltr">
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="hidden sm:inline-flex cursor-default items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5"
                aria-label={t("header.progressAriaLabel")}
              >
                <Typography.Span className="text-xs text-muted-foreground tabular-nums">
                  {solvedCount}/{totalCount}
                </Typography.Span>
                <Progress
                  value={progressPct}
                  className="h-1 w-16 overflow-hidden rounded-full bg-muted [&>div]:bg-selected"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progressPct}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent className="border-border bg-popover text-popover-foreground">
              <p className="text-xs">
                {replaceTemplate(t("header.progressTooltip"), {
                  solvedCount,
                  totalCount,
                  progressPct,
                })}
              </p>
            </TooltipContent>
          </Tooltip>
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
