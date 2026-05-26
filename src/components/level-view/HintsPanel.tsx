"use client";

import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { useLocale } from "@/contexts/LocaleContext";
import { replaceTemplate } from "@/i18n/utils";

type Props = {
  levelId: string;
  hints: string[];
  revealedHintCount: number;
  onRevealNextHint: () => void;
};

export function HintsPanel({ levelId, hints, revealedHintCount, onRevealNextHint }: Props) {
  const { t } = useLocale();
  if (!hints.length) return null;

  const allRevealed = revealedHintCount >= hints.length;
  const sectionAriaLabel = replaceTemplate(t("level.hintsSectionAriaLabel"), { id: levelId });
  const buttonAriaLabel = allRevealed
    ? t("level.hintsAllRevealedAriaLabel")
    : replaceTemplate(t("level.hintsRevealHintAriaLabel"), { n: revealedHintCount + 1 });

  return (
    <section className="rounded-xl border border-border bg-card p-5" aria-label={sectionAriaLabel}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <Typography.H2 variant="unstyled" className="text-sm font-semibold text-foreground">
            {t("level.hintsTitle")}
          </Typography.H2>
          <Typography.P variant="smallMuted" className="mt-1">
            {t("level.hintsDescription")}
          </Typography.P>
        </div>
        <Button
          onClick={onRevealNextHint}
          disabled={allRevealed}
          variant="accentSoft"
          size="sm"
          className="shrink-0"
          aria-label={buttonAriaLabel}
        >
          {allRevealed ? t("level.hintsAllShown") : t("level.hintsRevealNext")}
        </Button>
      </div>
      {revealedHintCount > 0 && (
        <ol className="mt-3 space-y-2 list-decimal pl-5 text-sm text-foreground">
          {hints.slice(0, revealedHintCount).map((hint, idx) => (
            <li key={`${levelId}-hint-${idx}`}>{hint}</li>
          ))}
        </ol>
      )}
    </section>
  );
}
