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
    module: "genesis",
    typeName: "GenesisFlag",
    solutionModule: "level_0_solution",
  },
  1: {
    module: "lockbox",
    typeName: "LockboxFlag",
    solutionModule: "level_1_solution",
  },
  2: {
    module: "fallout",
    typeName: "FalloutFlag",
    solutionModule: "level_2_solution",
  },
  3: {
    module: "relay_gateway",
    typeName: "RelayFlag",
    solutionModule: "level_3_solution",
  },
  4: {
    module: "artifact",
    typeName: "ArtifactFlag",
    solutionModule: "level_4_solution",
  },
  5: {
    module: "coin_collector",
    typeName: "CoinCollectorFlag",
    solutionModule: "level_5_solution",
  },
  6: {
    module: "nested_vault",
    typeName: "NestedVaultFlag",
    solutionModule: "level_6_solution",
  },
  7: {
    module: "sticky_treasure",
    typeName: "StickyTreasureFlag",
    solutionModule: "level_7_solution",
  },
};

export const SUPPORTED_LEVEL_IDS = Object.keys(LEVEL_RUN_CONFIG).map(Number);
