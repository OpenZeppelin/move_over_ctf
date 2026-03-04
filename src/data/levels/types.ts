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
