import { useCallback, useMemo, useState } from "react";
import { LEVEL_IDS } from "@/data/levels";
import type { LevelContractModule } from "@/data/levels/types";
import { parseModulePath } from "@/lib/contractCode";

type Input = {
  levelId: number;
  locale: string;
  contractCode: string;
  contractModules: LevelContractModule[];
  runModule?: string;
};

function getPreferredContractIndex(
  modules: LevelContractModule[],
  runModule?: string,
): number {
  if (!runModule) return 0;
  const idx = modules.findIndex((contract) => contract.module === runModule);
  return idx >= 0 ? idx : 0;
}

export function useLevelNavigation({
  levelId,
  locale,
  contractCode,
  contractModules,
  runModule,
}: Input) {
  const normalizedContractModules = useMemo(() => {
    if (Array.isArray(contractModules) && contractModules.length) {
      return contractModules.map((item) => ({
        module: String(item.module || "").trim(),
        contractCode: String(item.contractCode || ""),
      }));
    }
    const fallbackCode = String(contractCode || "");
    const parsedPath = parseModulePath(fallbackCode);
    const fallbackModule = parsedPath.includes("::")
      ? parsedPath.split("::").pop() || "contract"
      : parsedPath;
    return [
      {
        module: fallbackModule.replace(/[;{]+$/, ""),
        contractCode: fallbackCode,
      },
    ];
  }, [contractCode, contractModules]);

  const selectionKey = useMemo(
    () =>
      `${levelId}:${runModule || ""}:${normalizedContractModules
        .map((contract) => contract.module)
        .join("|")}`,
    [levelId, normalizedContractModules, runModule],
  );
  const [selection, setSelection] = useState(() => ({
    key: selectionKey,
    index: getPreferredContractIndex(normalizedContractModules, runModule),
  }));
  const preferredIndex = getPreferredContractIndex(normalizedContractModules, runModule);
  const activeContractIndex =
    selection.key === selectionKey
      ? Math.min(Math.max(selection.index, 0), Math.max(0, normalizedContractModules.length - 1))
      : preferredIndex;
  const setActiveContractIndex = useCallback(
    (nextIndex: number) => {
      const clamped = Math.min(
        Math.max(nextIndex, 0),
        Math.max(0, normalizedContractModules.length - 1),
      );
      setSelection({
        key: selectionKey,
        index: clamped,
      });
    },
    [selectionKey, normalizedContractModules.length],
  );

  const activeContract = normalizedContractModules[activeContractIndex] ?? normalizedContractModules[0];
  const activeContractCode = activeContract?.contractCode || contractCode;
  const modulePath = parseModulePath(activeContractCode);

  const levelIndex = LEVEL_IDS.indexOf(levelId);
  const prevLevelId = levelIndex > 0 ? LEVEL_IDS[levelIndex - 1] : undefined;
  const prevHref =
    levelIndex === 0
      ? `/${locale}/levels/how-to-play`
      : prevLevelId !== undefined
        ? `/${locale}/levels/${prevLevelId}`
        : undefined;
  const nextLevelId = levelIndex >= 0 ? LEVEL_IDS[levelIndex + 1] : undefined;

  return {
    contractModules: normalizedContractModules,
    activeContractIndex,
    setActiveContractIndex,
    activeContractCode,
    modulePath,
    prevLevelId,
    prevHref,
    nextLevelId,
  };
}
