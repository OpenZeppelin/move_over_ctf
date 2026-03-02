export type Difficulty = "easy" | "medium" | "hard";

export interface LevelContent {
  name: string;
  description: string;
  instructions: string;
}

export interface Level extends LevelContent {
  id: number;
  difficulty: Difficulty;
  contractCode: string;
  completed?: boolean;
}
