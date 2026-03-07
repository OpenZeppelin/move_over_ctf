export type Difficulty = "easy" | "medium" | "hard";

export interface LevelContractModule {
  module: string;
  contractCode: string;
}

export interface LevelAuthor {
  name: string;
  github: string;
}

export interface LevelContent {
  name: string;
  description: string;
  instructions: string;
  /** Shown after the level is completed; explains the nature/lesson of the level. Translatable per locale. */
  explanation?: string;
  author?: LevelAuthor;
  hints?: string[];
}

export interface Level extends LevelContent {
  id: number;
  difficulty: Difficulty;
  contractModules: LevelContractModule[];
  contractCode: string;
  completed?: boolean;
}
