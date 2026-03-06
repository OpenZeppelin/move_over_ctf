import { useCallback, useEffect, useState } from "react";
import {
  getRevealedHintCountForLevel,
  getSolutionForLevel,
  getSolvedIdsFromStorage,
  saveSolutionForLevel,
  setLastVisitedLevel,
  setRevealedHintCountForLevel,
} from "@/lib/progressStorage";

type Input = {
  levelId: number;
  hintsLength: number;
};

type PersistenceState = {
  levelId: number;
  solutionCode: string;
  isCompleted: boolean;
  revealedHintCount: number;
};

function getDefaultState(levelId: number, hintsLength: number): PersistenceState {
  return {
    levelId,
    solutionCode: "",
    isCompleted: false,
    revealedHintCount: 0,
  };
}

export function useLevelPersistence({ levelId, hintsLength }: Input) {
  const readStateForLevel = useCallback(
    (targetLevelId: number): PersistenceState => {
      if (typeof window === "undefined") return getDefaultState(targetLevelId, hintsLength);
      const persistedHints = getRevealedHintCountForLevel(targetLevelId);
      return {
        levelId: targetLevelId,
        solutionCode: getSolutionForLevel(targetLevelId),
        isCompleted: getSolvedIdsFromStorage().has(targetLevelId),
        revealedHintCount: Math.min(persistedHints, hintsLength),
      };
    },
    [hintsLength],
  );

  const [state, setState] = useState<PersistenceState>(() => getDefaultState(levelId, hintsLength));
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setState(readStateForLevel(levelId));
    setHasMounted(true);
  }, [levelId, readStateForLevel]);

  const currentState = state.levelId === levelId ? state : (hasMounted ? readStateForLevel(levelId) : getDefaultState(levelId, hintsLength));

  const handleSolutionChange = useCallback(
    (value: string) => {
      setState((prev) => {
        const base = prev.levelId === levelId ? prev : readStateForLevel(levelId);
        return {
          ...base,
          solutionCode: value,
        };
      });
      saveSolutionForLevel(levelId, value);
    },
    [levelId, readStateForLevel],
  );

  const handleRevealNextHint = useCallback(() => {
    if (!hintsLength) return;
    setState((prev) => {
      const base = prev.levelId === levelId ? prev : readStateForLevel(levelId);
      const next = Math.min(base.revealedHintCount + 1, hintsLength);
      if (next !== base.revealedHintCount) {
        setRevealedHintCountForLevel(levelId, next);
      }
      return {
        ...base,
        revealedHintCount: next,
      };
    });
  }, [hintsLength, levelId, readStateForLevel]);

  useEffect(() => {
    setLastVisitedLevel(levelId);
  }, [levelId]);

  const setIsCompleted = useCallback(
    (value: boolean) => {
      setState((prev) => {
        const base = prev.levelId === levelId ? prev : readStateForLevel(levelId);
        return {
          ...base,
          isCompleted: value,
        };
      });
    },
    [levelId, readStateForLevel],
  );

  return {
    solutionCode: currentState.solutionCode,
    isCompleted: currentState.isCompleted,
    setIsCompleted,
    revealedHintCount: currentState.revealedHintCount,
    handleSolutionChange,
    handleRevealNextHint,
  };
}
