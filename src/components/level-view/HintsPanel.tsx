import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";

type Props = {
  levelId: number;
  hints: string[];
  revealedHintCount: number;
  onRevealNextHint: () => void;
};

export function HintsPanel({ levelId, hints, revealedHintCount, onRevealNextHint }: Props) {
  if (!hints.length) return null;

  return (
    <section className="rounded-lg border border-move-border bg-move-panel/60 p-4" aria-label={`Hints for level ${levelId}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <Typography.H2 variant="unstyled" className="text-sm font-semibold text-move-text">
            Hints
          </Typography.H2>
          <Typography.P variant="smallMuted" className="mt-1">
            Reveal hints one by one to unblock yourself while solving the level.
          </Typography.P>
        </div>
        <Button
          onClick={onRevealNextHint}
          disabled={revealedHintCount >= hints.length}
          variant="accentSoft"
          size="sm"
          className="shrink-0"
          aria-label={
            revealedHintCount >= hints.length ? "All hints already revealed" : `Reveal hint ${revealedHintCount + 1}`
          }
        >
          {revealedHintCount >= hints.length ? "All hints shown" : "Reveal next hint"}
        </Button>
      </div>
      {revealedHintCount > 0 && (
        <ol className="mt-3 space-y-2 list-decimal pl-5 text-sm text-move-text">
          {hints.slice(0, revealedHintCount).map((hint, idx) => (
            <li key={`${levelId}-hint-${idx}`}>{hint}</li>
          ))}
        </ol>
      )}
    </section>
  );
}
