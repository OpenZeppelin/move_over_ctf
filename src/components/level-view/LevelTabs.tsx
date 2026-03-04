export type LevelTab = "instructions" | "code";

type Props = {
  tab: LevelTab;
  onTabChange: (tab: LevelTab) => void;
  instructionsLabel: string;
  contractCodeLabel: string;
};

export function LevelTabs({ tab, onTabChange, instructionsLabel, contractCodeLabel }: Props) {
  return (
    <div
      className="flex border-b border-move-border bg-move-panel/80 overflow-x-auto"
      role="tablist"
      aria-label="Level content tabs"
    >
      <button
        type="button"
        onClick={() => onTabChange("instructions")}
        id="tab-instructions"
        role="tab"
        aria-selected={tab === "instructions"}
        aria-controls="panel-instructions"
        className={`shrink-0 min-h-[48px] px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors touch-manipulation ${
          tab === "instructions"
            ? "border-move-accent text-move-accent"
            : "border-transparent text-move-muted hover:text-move-text"
        }`}
      >
        {instructionsLabel}
      </button>
      <button
        type="button"
        onClick={() => onTabChange("code")}
        id="tab-code"
        role="tab"
        aria-selected={tab === "code"}
        aria-controls="panel-code"
        className={`shrink-0 min-h-[48px] px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors touch-manipulation ${
          tab === "code"
            ? "border-move-accent text-move-accent"
            : "border-transparent text-move-muted hover:text-move-text"
        }`}
      >
        {contractCodeLabel}
      </button>
    </div>
  );
}
