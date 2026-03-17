/**
 * Config for the browser level runner: module and return type per level.
 * Each level has its own solution module: move_over::level_N_solution.
 */

export interface LevelRunConfig {
  module: string;
  typeName: string;
  /** Solution module name (e.g. level_0_solution) for building/writing the solution file. */
  solutionModule: string;
  /** Cleanup function called inside browser verifier. Defaults to "delete". */
  cleanupFunction?: string;
}

export const LEVEL_RUN_CONFIG: Record<number, LevelRunConfig> = {
  0: {
    module: "artifact",
    typeName: "ArtifactFlag",
    solutionModule: "level_0_solution",
  },
  1: {
    module: "coin_collector",
    typeName: "CoinCollectorFlag",
    solutionModule: "level_1_solution",
  },
  3: {
    module: "sticky_treasure",
    typeName: "StickyTreasureFlag",
    solutionModule: "level_3_solution",
  },
  4: {
    module: "sticky_treasure_dof",
    typeName: "ObjectChestFlag",
    solutionModule: "level_4_solution",
  },
};
