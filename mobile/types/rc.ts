// RC Level Types
export interface MedalImage {
  medalType: string;
  imageUrl: string;
}

export interface RCLevel {
  id: string;
  level: string;
  relevantGrade: string;
  stars: number;
  description: string | null;
  keywordCount: number;
  keywordsAttempted: number;
  firstTryTotal: number;
  firstTryCorrect: number;
  medalImages: MedalImage[];
}

export interface RCLevelsResponse {
  rcLevels: RCLevel[];
}

// RC Keyword Types
export interface TryData {
  totalQuestions: number;
  correctAnswers: number;
}

export interface RCKeyword {
  id: string;
  name: string;
  description: string | null;
  comingSoon: boolean;
  isFree: boolean;
  questionCount: number;
  completedQuestions: number;
  progress: number;
  isMonthlyChallenge: boolean;
  firstTryData: TryData | null;
  secondTryData: TryData | null;
}

export interface RCLevelInfo {
  id: string;
  level: string;
  relevantGrade: string;
  stars: number;
  description: string | null;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  perPage: number;
}

export interface RCKeywordsResponse {
  rcLevel: RCLevelInfo;
  keywords: RCKeyword[];
  pagination: PaginationInfo;
}

export interface RCFilterParams {
  search?: string;
  sortBy?: "name" | "createdAt";
  sortOrder?: "asc" | "desc";
  status?: "all" | "completed" | "inProgress" | "notStarted";
  page?: number;
  perPage?: number;
}

// RC Quiz Types
export type RCQuizStatus = "start" | "continue" | "retry";

export interface RCQuestion {
  id: string;
  orderNumber: number;
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
  score: number;
  timeLimit: number;
  isCompleted: boolean;
}

export interface RCQuestionSet {
  id: string;
  title: string;
  passage: string;
  timeLimit: number;
  active: boolean;
  questions: RCQuestion[];
}

export interface RCQuizData {
  id: string;
  keyword: {
    id: string;
    name: string;
  };
  rcLevel: {
    id: string;
    level: string;
  };
  isFree: boolean;
  questionSet: RCQuestionSet | null;
  status: RCQuizStatus;
}

// Action Types
export interface QuestionStartData {
  questionId: string;
  keywordId: string;
  rcLevelId: string;
}

export interface QuestionCompleteData {
  questionId: string;
  selectedAnswer: string;
  isTimedOut: boolean;
  isRetry: boolean;
}

export interface QuizCompleteData {
  questionSetId: string;
  keywordId: string;
  rcLevelId: string;
  totalQuestions: number;
  correctAnswers: number;
}

export interface QuestionCompletionResult {
  success: boolean;
  isCorrect: boolean;
  pointsAwarded: number;
  explanation: string;
}

export interface QuizCompletionResult {
  success: boolean;
  tryNumber: 1 | 2;
}
