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
          <h2 className="text-sm font-semibold text-move-text">Hints</h2>
          <p className="mt-1 text-xs sm:text-sm text-move-muted">
            Reveal hints one by one to unblock yourself while solving the level.
          </p>
        </div>
        <button
          type="button"
          onClick={onRevealNextHint}
          disabled={revealedHintCount >= hints.length}
          className="inline-flex shrink-0 items-center rounded-md border border-oz-violet/40 bg-oz-violet/15 px-3 py-1.5 text-xs sm:text-sm font-medium text-oz-violet hover:bg-oz-violet/25 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={
            revealedHintCount >= hints.length ? "All hints already revealed" : `Reveal hint ${revealedHintCount + 1}`
          }
        >
          {revealedHintCount >= hints.length ? "All hints shown" : "Reveal next hint"}
        </button>
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
