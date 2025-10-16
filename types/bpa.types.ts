export interface BPASemester {
  id: string;
  year: number;
  semester: "Spring" | "Summer" | "Fall" | "Winter";
  startDate: string;
  endDate: string;
  label: string; // e.g., "2025 Spring (05/01 ~ 01/01)"
  isActive: boolean;
}

export interface BPARanking {
  id: string;
  rank: number;
  nickname: string;
  grade: string;
  score: number;
  campusId?: string | null;
  campusName?: string;
}

export type BPALevel = "lv2" | "lv3" | "lv4" | "lv5" | "lv6" | "lv7plus";

export interface BPARankingData {
  semesterId: string;
  level: BPALevel;
  rankings: BPARanking[];
}

export interface BPAUnit {
  id: string;
  novelId: string;
  name: string;
  description?: string | null;
  orderNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BPAChapter {
  id: string;
  unitId?: string | null;
  novelId: string;
  orderNumber: number;
  title: string;
  description?: string | null;
  isFree: boolean;
  questionSetId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BPAUnitWithChapters extends BPAUnit {
  chapters: BPAChapter[];
}
