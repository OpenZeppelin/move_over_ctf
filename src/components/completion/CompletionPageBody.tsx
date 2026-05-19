"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Typography } from "@/components/ui/Typography";
import { useLocale } from "@/contexts/LocaleContext";
import {
  LEVEL_SOLVED_EVENT,
  PROGRESS_UPDATED_EVENT,
  getSolvedIdsFromStorage,
} from "@/lib/progressStorage";
import { replaceTemplate } from "@/i18n/utils";
import { CompletionShare } from "./CompletionShare";

type Props = {
  levelsTotal: number;
};

export function CompletionPageBody({ levelsTotal }: Props) {
  const { t, locale } = useLocale();
  const [solvedCount, setSolvedCount] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => setSolvedCount(getSolvedIdsFromStorage().size);
    sync();
    window.addEventListener(LEVEL_SOLVED_EVENT, sync);
    window.addEventListener(PROGRESS_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener(LEVEL_SOLVED_EVENT, sync);
      window.removeEventListener(PROGRESS_UPDATED_EVENT, sync);
    };
  }, []);

  // Pre-hydration: render the "in progress" shell so SSR matches CSR.
  if (solvedCount === null || solvedCount < levelsTotal) {
    const safeCount = solvedCount ?? 0;
    const progressLabel = replaceTemplate(t("completion.progressLabel"), {
      solved: safeCount,
      total: levelsTotal,
    });
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-6 sm:p-8">
        <Typography.H1 variant="page">
          {t("completion.lockedTitle")}
        </Typography.H1>
        <Typography.P variant="muted" className="mt-3">
          {t("completion.lockedBody")}
        </Typography.P>
        <Typography.P className="mt-4 font-mono text-sm">
          {progressLabel}
        </Typography.P>
        <div className="mt-6">
          <Link
            href={`/${locale}/levels/0`}
            className="inline-flex h-10 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background hover:bg-foreground/90 transition-colors"
          >
            {t("completion.continueCta")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-border bg-card p-6 sm:p-8">
      <Typography.H1 variant="page">{t("completion.unlockedTitle")}</Typography.H1>
      <Typography.P variant="muted" className="mt-3">
        {t("completion.unlockedBody")}
      </Typography.P>
      <div className="mt-6">
        <CompletionShare levelsTotal={levelsTotal} />
      </div>
    </div>
  );
}
