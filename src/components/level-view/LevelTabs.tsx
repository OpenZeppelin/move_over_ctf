"use client";

import { Tabs, TabsList, TabsTrigger } from "@openzeppelin/ui-components";
import { useLocale } from "@/contexts/LocaleContext";

export type LevelTab = "instructions" | "code";

type Props = {
  tab: LevelTab;
  onTabChange: (tab: LevelTab) => void;
  instructionsLabel: string;
  contractCodeLabel: string;
};

export function LevelTabs({ tab, onTabChange, instructionsLabel, contractCodeLabel }: Props) {
  const { t } = useLocale();
  return (
    <Tabs value={tab} onValueChange={(v) => onTabChange(v as LevelTab)} className="w-full">
      <TabsList
        className="flex h-11 w-full items-center justify-start gap-1 rounded-none border-b border-border bg-card px-4 sm:px-6"
        aria-label={t("level.tabsAriaLabel")}
      >
        <TabsTrigger
          value="instructions"
          id="tab-instructions"
          aria-controls="panel-instructions"
          className="inline-flex cursor-pointer items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-sm"
        >
          {instructionsLabel}
        </TabsTrigger>
        <TabsTrigger
          value="code"
          id="tab-code"
          aria-controls="panel-code"
          className="inline-flex cursor-pointer items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-sm"
        >
          {contractCodeLabel}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
