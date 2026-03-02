/**
 * Config for the run-level API: module and return type per level.
 * Each level has its own solution module: move_over::level_N_solution (flat under sources/).
 */

export interface LevelRunConfig {
  module: string;
  typeName: string;
  testModule: string;
  /** Solution module name (e.g. level_0_solution) for building/writing the solution file. */
  solutionModule: string;
}

export const LEVEL_RUN_CONFIG: Record<number, LevelRunConfig> = {
  0: { module: "genesis", typeName: "Genesis", testModule: "level_0_test", solutionModule: "level_0_solution" },
  1: { module: "lockbox", typeName: "Lockbox", testModule: "level_1_test", solutionModule: "level_1_solution" },
  2: { module: "fallout", typeName: "Vault", testModule: "level_2_test", solutionModule: "level_2_solution" },
  3: { module: "blank_check", typeName: "Balance", testModule: "level_3_test", solutionModule: "level_3_solution" },
  4: { module: "open_door", typeName: "Config", testModule: "level_4_test", solutionModule: "level_4_solution" },
  5: { module: "double_entry", typeName: "Ledger", testModule: "level_5_test", solutionModule: "level_5_solution" },
  6: { module: "truncation", typeName: "TruncationState", testModule: "level_6_test", solutionModule: "level_6_solution" },
  7: { module: "split_ledger", typeName: "SplitLedgerState", testModule: "level_7_test", solutionModule: "level_7_solution" },
  8: { module: "jackpot", typeName: "Pool", testModule: "level_8_test", solutionModule: "level_8_solution" },
  9: { module: "permit", typeName: "Treasury", testModule: "level_9_test", solutionModule: "level_9_solution" },
  10: { module: "queue", typeName: "Queue", testModule: "level_10_test", solutionModule: "level_10_solution" },
  11: { module: "price_feed", typeName: "Pool", testModule: "level_11_test", solutionModule: "level_11_solution" },
  12: { module: "master_key", typeName: "Vault", testModule: "level_12_test", solutionModule: "level_12_solution" },
  13: { module: "wrapper", typeName: "Vault", testModule: "level_13_test", solutionModule: "level_13_solution" },
  14: { module: "ticket_stub", typeName: "Vault", testModule: "level_14_test", solutionModule: "level_14_solution" },
  15: { module: "pointer_reassignment", typeName: "Treasury", testModule: "level_15_test", solutionModule: "level_15_solution" },
  16: { module: "pool_mismatch", typeName: "Pool", testModule: "level_16_test", solutionModule: "level_16_solution" },
  17: { module: "open_gate", typeName: "Vault", testModule: "level_17_test", solutionModule: "level_17_solution" },
  18: { module: "wrong_repay", typeName: "Pool", testModule: "level_18_test", solutionModule: "level_18_solution" },
};

export const SUPPORTED_LEVEL_IDS = Object.keys(LEVEL_RUN_CONFIG).map(Number);
