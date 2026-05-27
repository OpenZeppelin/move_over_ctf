/**
 * Config for the browser level runner: module and return type per level.
 * Each level has its own solution module: move_over::<slug>_solution.
 */

export interface LevelRunConfig {
  module: string;
  typeName: string;
  /** Solution module name (e.g. artifact_solution) for building/writing the solution file. */
  solutionModule: string;
  /** Cleanup function called inside browser verifier. Defaults to "delete". */
  cleanupFunction?: string;
  /**
   * Additional sibling modules (besides `module`) that the solution scaffold
   * should `use move_over::<name>;` — required when a level ships more than one
   * in-scope module and the exploit reaches across them.
   */
  extraImports?: string[];
}

export const LEVEL_RUN_CONFIG: Record<string, LevelRunConfig> = {
  artifact: {
    module: "artifact",
    typeName: "ArtifactFlag",
    solutionModule: "artifact_solution",
  },
  coin_collector: {
    module: "coin_collector",
    typeName: "CoinCollectorFlag",
    solutionModule: "coin_collector_solution",
  },
  sticky_treasure: {
    module: "sticky_treasure",
    typeName: "StickyTreasureFlag",
    solutionModule: "sticky_treasure_solution",
  },
  flash_vault: {
    module: "flash_vault",
    typeName: "FlashVaultFlag",
    solutionModule: "flash_vault_solution",
  },
  pool_party: {
    module: "pool_party",
    typeName: "PoolPartyFlag",
    solutionModule: "pool_party_solution",
  },
  tick_tock: {
    module: "tick_tock",
    typeName: "TickTockFlag",
    solutionModule: "tick_tock_solution",
  },
  night_ledger: {
    module: "night_ledger",
    typeName: "NightLedgerFlag",
    solutionModule: "night_ledger_solution",
  },
  mailbox: {
    module: "mailbox",
    typeName: "MailboxFlag",
    solutionModule: "mailbox_solution",
    extraImports: ["mailbox_relay"],
  },
};
