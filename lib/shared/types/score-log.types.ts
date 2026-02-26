export interface ScoreLogEntry {
  id: string;
  score: number;
  source: "RC" | "Novel" | "BPA";
  sourceDetails: string;
  createdAt: Date | string;
  // Question details
  questionText: string;
  selectedAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  isRetry: boolean;
  isTimedOut: boolean;
  explanation: string;
}

export interface ScoreLogResponse {
  logs: ScoreLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type ScoreSourceFilter = "RC" | "Novel" | "BPA" | undefined;
