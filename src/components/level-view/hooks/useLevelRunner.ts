import { useCallback, useState, type RefObject } from "react";
import type { LevelRunConfig } from "@/data/levels";
import type { LevelContractModule } from "@/data/levels/types";
import { runLevelInBrowser } from "@/lib/browserRunLevel";

type RunResult = { success: boolean; output: string } | null;

type ScrollSnapshot = {
  panelTop: number | null;
  editorTop: number | null;
  editorLeft: number | null;
};

type Input = {
  levelId: number;
  contractCode: string;
  contractModules: LevelContractModule[];
  runConfig: LevelRunConfig | null | undefined;
  solutionCode: string;
  contentScrollRef: RefObject<HTMLDivElement | null>;
  solutionTextareaRef: RefObject<HTMLTextAreaElement | null>;
  solutionHighlightRef: RefObject<HTMLDivElement | null>;
  onSolved?: () => void;
};

type RunnerState = {
  levelId: number;
  runResult: RunResult;
  runLoading: boolean;
};

export function useLevelRunner({
  levelId,
  contractCode,
  contractModules,
  runConfig,
  solutionCode,
  contentScrollRef,
  solutionTextareaRef,
  solutionHighlightRef,
  onSolved,
}: Input) {
  const [state, setState] = useState<RunnerState>({
    levelId,
    runResult: null,
    runLoading: false,
  });
  const currentState =
    state.levelId === levelId
      ? state
      : {
          levelId,
          runResult: null,
          runLoading: false,
        };

  const captureScrollSnapshot = useCallback((): ScrollSnapshot => {
    const panel = contentScrollRef.current;
    const editor = solutionTextareaRef.current;
    return {
      panelTop: panel ? panel.scrollTop : null,
      editorTop: editor ? editor.scrollTop : null,
      editorLeft: editor ? editor.scrollLeft : null,
    };
  }, [contentScrollRef, solutionTextareaRef]);

  const restoreScrollSnapshot = useCallback(
    (snapshot: ScrollSnapshot) => {
      requestAnimationFrame(() => {
        if (snapshot.panelTop !== null) {
          const panel = contentScrollRef.current;
          if (panel) {
            const max = Math.max(0, panel.scrollHeight - panel.clientHeight);
            panel.scrollTop = Math.min(snapshot.panelTop, max);
          }
        }

        if (snapshot.editorTop !== null || snapshot.editorLeft !== null) {
          const editor = solutionTextareaRef.current;
          if (editor) {
            if (snapshot.editorTop !== null) editor.scrollTop = snapshot.editorTop;
            if (snapshot.editorLeft !== null) editor.scrollLeft = snapshot.editorLeft;
          }

          const highlight = solutionHighlightRef.current;
          if (highlight) {
            if (snapshot.editorTop !== null) highlight.scrollTop = snapshot.editorTop;
            if (snapshot.editorLeft !== null) highlight.scrollLeft = snapshot.editorLeft;
          }
        }
      });
    },
    [contentScrollRef, solutionHighlightRef, solutionTextareaRef],
  );

  const handleRun = useCallback(async () => {
    if (!runConfig) {
      setState({
        levelId,
        runLoading: false,
        runResult: {
          success: false,
          output: "Run configuration is missing for this level.",
        },
      });
      return;
    }

    const scrollSnapshot = captureScrollSnapshot();
    setState((prev) => {
      const base =
        prev.levelId === levelId
          ? prev
          : {
              levelId,
              runResult: null,
              runLoading: false,
            };
      return {
        ...base,
        runLoading: true,
      };
    });
    restoreScrollSnapshot(scrollSnapshot);
    try {
      const result = await runLevelInBrowser({
        levelId,
        contractCode,
        contractModules: contractModules.map((contract) => ({
          module: contract.module,
          contractCode: contract.contractCode,
        })),
        module: runConfig.module,
        typeName: runConfig.typeName,
        solutionModule: runConfig.solutionModule,
        solutionBody: solutionCode,
        verifierModule: `level_${levelId}_verifier`,
        cleanupFunction: runConfig.cleanupFunction,
      });
      setState({
        levelId,
        runLoading: false,
        runResult: result,
      });
      restoreScrollSnapshot(scrollSnapshot);
      if (result.success) {
        onSolved?.();
      }
    } catch (e) {
      setState({
        levelId,
        runLoading: false,
        runResult: {
          success: false,
          output: e instanceof Error ? e.message : "Network error",
        },
      });
      restoreScrollSnapshot(scrollSnapshot);
    } finally {
      setState((prev) => {
        if (prev.levelId !== levelId) {
          return prev;
        }
        if (!prev.runLoading) {
          return prev;
        }
        return {
          ...prev,
          runLoading: false,
        };
      });
      restoreScrollSnapshot(scrollSnapshot);
    }
  }, [
    runConfig,
    captureScrollSnapshot,
    restoreScrollSnapshot,
    levelId,
    contractCode,
    contractModules,
    solutionCode,
    onSolved,
  ]);

  return {
    runResult: currentState.runResult,
    runLoading: currentState.runLoading,
    handleRun,
  };
}
