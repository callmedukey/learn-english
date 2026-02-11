// BPA Level Types
export interface BPALevel {
  id: string;
  name: string;
  description: string | null;
  stars: number;
  novelsAvailable: number;
  isAssigned: boolean; // User is assigned to this level for current semester
}

export interface BPALevelsResponse {
  bpaLevels: BPALevel[];
  hasCampusAccess: boolean;
}

// BPA Timeframe Types
export type BPASeason = "SPRING" | "SUMMER" | "FALL" | "WINTER";

export interface BPASemester {
  id: string;
  season: BPASeason;
  startDate: string;
  endDate: string;
  timeframeId: string;
}

export interface BPATimeframe {
  id: string;
  year: number;
  startDate: string;
  endDate: string;
  label: string;
  isActive: boolean;
  semesters: BPASemester[];
}

export interface BPATimeframesResponse {
  timeframes: BPATimeframe[];
}

// BPA Rankings Types
export interface BPARanking {
  id: string;
  rank: number;
  nickname: string;
  grade: string;
  score: number;
  campusId: string | null;
  campusName: string | null;
}

export interface BPARankingsResponse {
  rankings: BPARanking[];
}

// BPA Novel List Types
export interface BPALevelInfo {
  id: string;
  name: string;
  stars: number;
  description: string | null;
}

export interface BPANovelListItem {
  id: string;
  title: string;
  description: string | null;
  totalChapters: number;
  completedChapters: number;
  progress: number;
  isAccessible: boolean; // User can access this novel
  comingSoon: boolean;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  perPage: number;
}

export interface BPANovelsResponse {
  bpaLevel: BPALevelInfo;
  novels: BPANovelListItem[];
  pagination: PaginationInfo;
}

export interface BPANovelFilterParams {
  search?: string;
  sortBy?: "title" | "createdAt";
  sortOrder?: "asc" | "desc";
  status?: "all" | "completed" | "inProgress" | "notStarted";
  page?: number;
  perPage?: number;
}

// BPA Novel Details Types
export interface BPAChapterTryData {
  totalQuestions: number;
  correctAnswers: number;
  createdAt: string;
}

export interface BPAChapterDetails {
  id: string;
  title: string;
  description: string | null;
  orderNumber: number;
  isFree: boolean;
  totalQuestions: number;
  completedQuestions: number;
  isCompleted: boolean;
  hasQuiz: boolean;
  firstTryData: BPAChapterTryData | null;
  secondTryData: BPAChapterTryData | null;
}

export interface BPAUnit {
  id: string;
  name: string;
  description: string | null;
  orderNumber: number;
  chapters: BPAChapterDetails[];
}

export interface BPANovelDetails {
  id: string;
  title: string;
  description: string | null;
  bpaLevel: BPALevelInfo;
  units: BPAUnit[];
  chapters: BPAChapterDetails[]; // Flat list for backward compatibility
  totalChapters: number;
  completedChapters: number;
  freeChapters: number;
  progress: number;
}

// BPA Chapter Quiz Types
export type BPAChapterStatus = "start" | "continue" | "retry";

export interface BPAQuestion {
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

export interface BPAQuestionSet {
  id: string;
  instructions: string;
  active: boolean;
  questions: BPAQuestion[];
}

export interface BPANextChapter {
  id: string;
  title: string;
  orderNumber: number;
}

export interface BPAChapterQuizData {
  id: string;
  title: string;
  description: string | null;
  orderNumber: number;
  isFree: boolean;
  novel: {
    id: string;
    title: string;
    bpaLevelId: string;
  };
  nextChapter: BPANextChapter | null;
  questionSet: BPAQuestionSet | null;
  status: BPAChapterStatus;
}

// BPA Question Action Types
export interface BPAQuestionStartData {
  questionId: string;
  novelId: string;
  levelId: string;
}

export interface BPAQuestionCompleteData {
  questionId: string;
  selectedAnswer: string;
  isTimedOut: boolean;
  isRetry: boolean;
}

export interface BPAQuizCompleteData {
  questionSetId: string;
  chapterId: string;
  novelId: string;
  levelId: string;
  totalQuestions: number;
  correctAnswers: number;
}

export interface BPAQuestionCompletionResult {
  success: boolean;
  isCorrect?: boolean;
  pointsAwarded?: number;
  explanation?: string;
  error?: string;
}

export interface BPAQuizCompletionResult {
  success: boolean;
  tryNumber?: 1 | 2;
  error?: string;
}

// Campus Event Types
export type CampusEventColor =
  | "sky"
  | "amber"
  | "violet"
  | "rose"
  | "emerald"
  | "orange"
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "pink"
  | "indigo"
  | "cyan"
  | "teal"
  | "lime"
  | "fuchsia"
  | "slate";

export interface CampusEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startDate: string; // ISO string
  endDate: string;
  allDay: boolean;
  color: CampusEventColor;
}

export interface CampusEventsResponse {
  events: CampusEvent[];
  hasCampusAccess: boolean;
}
