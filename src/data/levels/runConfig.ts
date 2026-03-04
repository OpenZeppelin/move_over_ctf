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
};

export const SUPPORTED_LEVEL_IDS = Object.keys(LEVEL_RUN_CONFIG).map(Number);
