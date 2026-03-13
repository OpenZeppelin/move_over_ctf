"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useLocale } from "@/contexts/LocaleContext";
import { LEVEL_RUN_CONFIG, type Level } from "@/data/levels";
import { codeStyleDark, codeStyleLight } from "@/lib/codeHighlight";
import { markLevelSolved, saveSolutionForLevel } from "@/lib/progressStorage";
import { LevelHeader } from "@/components/level-view/LevelHeader";
import { ContractCodeCard } from "@/components/level-view/ContractCodeCard";
import { LevelTabs, type LevelTab } from "@/components/level-view/LevelTabs";
import { InstructionsTabContent } from "@/components/level-view/InstructionsTabContent";
import { SolutionEditorCard } from "@/components/level-view/SolutionEditorCard";
import { Typography } from "@/components/ui/Typography";
import { useLevelNavigation } from "@/components/level-view/hooks/useLevelNavigation";
import { useLevelPersistence } from "@/components/level-view/hooks/useLevelPersistence";
import { useLevelRunner } from "@/components/level-view/hooks/useLevelRunner";
import { useAutoResizeCodeEditor } from "@/components/level-view/hooks/useAutoResizeCodeEditor";

export function LevelView({ level }: { level: Level }) {
  const [tab, setTab] = useState<LevelTab>("instructions");
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const solutionHighlightRef = useRef<HTMLDivElement>(null);
  const solutionWrapperRef = useRef<HTMLDivElement>(null);
  const solutionTextareaRef = useRef<HTMLTextAreaElement>(null);

  const { resolvedTheme } = useTheme();
  const { t, locale } = useLocale();
  const codeStyle = resolvedTheme !== "light" ? codeStyleDark : codeStyleLight;

  const runConfig = LEVEL_RUN_CONFIG[level.id];
  const hasRunner = runConfig != null;

  const hints = useMemo(
    () =>
      Array.isArray(level.hints)
        ? level.hints.map((hint) => String(hint).trim()).filter((hint) => hint.length > 0)
        : [],
    [level.hints],
  );

  const {
    contractModules,
    activeContractIndex,
    setActiveContractIndex,
    activeContractCode,
    modulePath,
    prevLevelId,
    prevHref,
    nextLevelId,
  } = useLevelNavigation({
    levelId: level.id,
    locale,
    contractCode: level.contractCode,
    contractModules: level.contractModules,
    runModule: runConfig?.module,
  });

  const {
    solutionCode,
    isCompleted,
    setIsCompleted,
    revealedHintCount,
    handleSolutionChange,
    handleRevealNextHint,
  } = useLevelPersistence({
    levelId: level.id,
    hintsLength: hints.length,
  });

  const handleSolved = useCallback(() => {
    setIsCompleted(true);
    markLevelSolved(level.id);
    saveSolutionForLevel(level.id, solutionCode);
  }, [level.id, setIsCompleted, solutionCode]);

  const { runResult, runLoading, handleRun } = useLevelRunner({
    levelId: level.id,
    contractCode: level.contractCode,
    contractModules,
    runConfig,
    solutionCode,
    contentScrollRef,
    solutionTextareaRef,
    solutionHighlightRef,
    onSolved: handleSolved,
  });

  useAutoResizeCodeEditor({
    solutionCode,
    solutionWrapperRef,
    solutionTextareaRef,
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const hasPassed = mounted && (isCompleted || runResult?.success === true);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <LevelHeader
        level={level}
        modulePath={modulePath}
        hasPassed={hasPassed}
        prevHref={prevHref}
        prevLevelId={prevLevelId}
        nextLevelId={nextLevelId}
        locale={locale}
      />

      <LevelTabs
        tab={tab}
        onTabChange={setTab}
        instructionsLabel={t("level.instructions")}
        contractCodeLabel={t("level.contractCode")}
      />

      <div ref={contentScrollRef} className="flex-1 overflow-auto p-4 sm:p-6 bg-move-dark">
        {tab === "instructions" ? (
          <InstructionsTabContent
            levelId={level.id}
            instructions={level.instructions}
            hints={hints}
            revealedHintCount={revealedHintCount}
            onRevealNextHint={handleRevealNextHint}
          />
        ) : (
          <div id="panel-code" role="tabpanel" aria-labelledby="tab-code" className="flex flex-col gap-4">
            <ContractCodeCard
              modulePath={modulePath}
              contractModules={contractModules}
              activeContractIndex={activeContractIndex}
              onSelectContract={setActiveContractIndex}
              activeContractCode={activeContractCode}
              codeStyle={codeStyle}
            />

            {hasRunner && runConfig && (
              <>
                <SolutionEditorCard
                  levelId={level.id}
                  runConfig={runConfig}
                  hasPassed={hasPassed}
                  runLoading={runLoading}
                  codeStyle={codeStyle}
                  solutionCode={solutionCode}
                  runLabel={t("level.run")}
                  runSuccessLabel={t("level.runSuccess")}
                  runErrorLabel={t("level.runError")}
                  solutionPlaceholder={t("level.solutionPlaceholder")}
                  runResult={runResult}
                  onRun={handleRun}
                  onSolutionChange={handleSolutionChange}
                  solutionWrapperRef={solutionWrapperRef}
                  solutionHighlightRef={solutionHighlightRef}
                  solutionTextareaRef={solutionTextareaRef}
                />
                {hasPassed && level.explanation && (
                  <div className="rounded-xl border border-move-border bg-move-dark/60 px-3 py-2.5">
                    <Typography.P
                      variant="unstyled"
                      className="text-xs font-semibold text-move-muted uppercase tracking-wider mb-1.5"
                    >
                      {t("level.explanationTitle")}
                    </Typography.P>
                    <Typography.P variant="unstyled" className="text-sm text-move-text whitespace-pre-wrap">
                      {level.explanation}
                    </Typography.P>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
