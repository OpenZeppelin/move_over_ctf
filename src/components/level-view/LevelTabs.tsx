import { Tabs, TabsList, TabsTrigger } from "@openzeppelin/ui-builder-ui";

export type LevelTab = "instructions" | "code";

type Props = {
  tab: LevelTab;
  onTabChange: (tab: LevelTab) => void;
  instructionsLabel: string;
  contractCodeLabel: string;
};

export function LevelTabs({ tab, onTabChange, instructionsLabel, contractCodeLabel }: Props) {
  return (
    <Tabs value={tab} onValueChange={(v) => onTabChange(v as LevelTab)} className="w-full">
      <TabsList
        className="flex h-auto w-full justify-start gap-0 rounded-none border-b border-move-border bg-move-panel/80 p-0 shadow-none"
        aria-label="Level content tabs"
      >
        <TabsTrigger
          value="instructions"
          id="tab-instructions"
          aria-controls="panel-instructions"
          className="min-h-[48px] shrink-0 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-move-muted transition-colors hover:text-move-text data-[state=active]:border-move-accent data-[state=active]:text-move-accent sm:px-6"
        >
          {instructionsLabel}
        </TabsTrigger>
        <TabsTrigger
          value="code"
          id="tab-code"
          aria-controls="panel-code"
          className="min-h-[48px] shrink-0 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-move-muted transition-colors hover:text-move-text data-[state=active]:border-move-accent data-[state=active]:text-move-accent sm:px-6"
        >
          {contractCodeLabel}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
