export interface UnitDefinition {
  id: string; // Temporary ID for UI state management
  name: string;
  description?: string;
  orderNumber: number;
  chapterIds: string[]; // Novel chapter IDs to include in this unit
}

export interface ConversionFormData {
  sourceNovelId: string;
  targetBPALevelId: string;
  operationType: "move" | "copy";
  units: UnitDefinition[];
  newTitle?: string;
}

export interface ConversionResult {
  success: boolean;
  bpaNovelId?: string;
  bpaLevelId?: string;
  error?: string;
  message?: string;
}

export interface ConversionState {
  success: boolean;
  error?: string;
  bpaNovelId?: string;
}

// For the multi-step dialog
export type ConversionStep = "config" | "units" | "chapters" | "preview";

export interface DialogState {
  step: ConversionStep;
  operationType: "move" | "copy";
  targetBPALevelId: string;
  units: UnitDefinition[];
}
