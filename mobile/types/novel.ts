// AR Level Types
export interface MedalImage {
  medalType: string;
  imageUrl: string;
}

export interface ARLevel {
  id: string;
  level: string;
  score: string;
  stars: number;
  description: string | null;
  novelCount: number;
  chaptersAttempted: number;
  firstTryTotal: number;
  firstTryCorrect: number;
  medalImages: MedalImage[];
}

export interface ARLevelsResponse {
  arLevels: ARLevel[];
}

// Novel List Types
export interface ARInfo {
  id: string;
  level: string;
  score: string;
  stars: number;
  description: string | null;
}

export interface NovelListItem {
  id: string;
  title: string;
  description: string | null;
  comingSoon: boolean;
  totalChapters: number;
  completedChapters: number;
  freeChapters: number;
  progress: number;
  isMonthlyChallenge: boolean;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  perPage: number;
}

export interface NovelsResponse {
  ar: ARInfo;
  novels: NovelListItem[];
  pagination: PaginationInfo;
}

export interface NovelFilterParams {
  search?: string;
  sortBy?: "title" | "createdAt" | "chapterCount";
  sortOrder?: "asc" | "desc";
  status?: "all" | "completed" | "inProgress" | "notStarted";
  page?: number;
  perPage?: number;
}

// Novel Details Types
export interface ChapterTryData {
  totalQuestions: number;
  correctAnswers: number;
  createdAt: string;
}

export interface ChapterDetails {
  id: string;
  title: string;
  description: string | null;
  orderNumber: number;
  isFree: boolean;
  totalQuestions: number;
  completedQuestions: number;
  isCompleted: boolean;
  hasQuiz: boolean;
  isQuizActive: boolean;
  firstTryData: ChapterTryData | null;
  secondTryData: ChapterTryData | null;
}

export interface NovelDetails {
  id: string;
  title: string;
  description: string | null;
  ar: ARInfo | null;
  chapters: ChapterDetails[];
  totalChapters: number;
  completedChapters: number;
  freeChapters: number;
  progress: number;
}

// Chapter Quiz Types
export type ChapterStatus = "start" | "continue" | "retry";

export interface Question {
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

export interface QuestionSet {
  id: string;
  instructions: string;
  active: boolean;
  questions: Question[];
}

export interface NextChapter {
  id: string;
  title: string;
  orderNumber: number;
}

export interface ChapterQuizData {
  id: string;
  title: string;
  description: string | null;
  orderNumber: number;
  isFree: boolean;
  novel: {
    id: string;
    title: string;
    arLevel: string | undefined;
  };
  nextChapter: NextChapter | null;
  questionSet: QuestionSet | null;
  status: ChapterStatus;
}

// Question Action Types
export interface QuestionStartData {
  questionId: string;
  novelId: string;
  arId: string;
}

export interface QuestionCompleteData {
  questionId: string;
  selectedAnswer: string;
  isTimedOut: boolean;
  isRetry: boolean;
}

export interface QuizCompleteData {
  questionSetId: string;
  chapterId: string;
  novelId: string;
  arId: string;
  totalQuestions: number;
  correctAnswers: number;
}

export interface QuestionCompletionResult {
  success: boolean;
  isCorrect?: boolean;
  pointsAwarded?: number;
  explanation?: string;
  error?: string;
}

export interface QuizCompletionResult {
  success: boolean;
  tryNumber?: 1 | 2;
  error?: string;
}
