/**
 * BPA Semester Utilities
 *
 * Utility functions for determining current BPA semester based on dates.
 *
 * OVERLAP BEHAVIOR:
 * Semester date ranges may overlap (e.g., 2025 Winter ending Jan 30 and 2026 Spring
 * starting Jan 15). During overlap periods:
 * - Access control (server-side) allows content from ALL active semesters
 * - UI functions like getCurrentSemester() return the FIRST match for display purposes
 * - Users retain access to content from any semester they're assigned to
 *
 * The access-control.ts module (lib/bpa/access-control.ts) is the authoritative
 * source for access decisions.
 */

export type BPASeason = "SPRING" | "SUMMER" | "FALL" | "WINTER";

export interface SemesterWithDates {
  id: string;
  season: BPASeason;
  startDate: Date | string;
  endDate: Date | string;
  timeframeId: string;
}

/**
 * Checks if a semester is currently active based on today's date
 */
export function isSemesterActive(semester: SemesterWithDates): boolean {
  const today = new Date();
  const startDate = new Date(semester.startDate);
  const endDate = new Date(semester.endDate);

  // Set time to start/end of day for accurate comparison
  today.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return today >= startDate && today <= endDate;
}

/**
 * Finds the current active semester from an array of semesters for UI display.
 * Returns the FIRST active match found. Falls back to the most recent past semester
 * if none is currently active.
 *
 * NOTE: This is for UI context only (displaying current semester in navigation, etc.).
 * When semesters overlap, this returns a single semester for display purposes.
 * For ACCESS CONTROL decisions, use lib/bpa/access-control.ts which grants access
 * to content from ALL active semesters during overlap periods.
 */
export function getCurrentSemester(
  semesters: SemesterWithDates[]
): SemesterWithDates | null {
  if (!semesters || semesters.length === 0) {
    return null;
  }

  // First, try to find an active semester
  const activeSemester = semesters.find((semester) => isSemesterActive(semester));
  if (activeSemester) {
    return activeSemester;
  }

  // If no active semester, find the most recent past semester
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pastSemesters = semesters
    .filter((semester) => new Date(semester.endDate) < today)
    .sort((a, b) => {
      const dateA = new Date(a.endDate);
      const dateB = new Date(b.endDate);
      return dateB.getTime() - dateA.getTime(); // Most recent first
    });

  return pastSemesters[0] || semesters[0]; // Fallback to first semester if no past semester
}

/**
 * Gets the season order for sorting
 */
export function getSeasonOrder(season: BPASeason): number {
  const order: Record<BPASeason, number> = {
    SPRING: 0,
    SUMMER: 1,
    FALL: 2,
    WINTER: 3,
  };
  return order[season];
}

/**
 * Sorts semesters by their season order (Spring -> Summer -> Fall -> Winter)
 */
export function sortSemestersBySeason(
  semesters: SemesterWithDates[]
): SemesterWithDates[] {
  return [...semesters].sort((a, b) => {
    return getSeasonOrder(a.season) - getSeasonOrder(b.season);
  });
}

/**
 * Checks if a BPA level assignment is currently active based on today's date.
 * Uses semester dates if available, otherwise falls back to timeframe dates.
 */
export function isAssignmentActive(assignment: {
  semester?: { startDate: Date | string; endDate: Date | string } | null;
  timeframe: { startDate: Date | string; endDate: Date | string };
}): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Use semester dates if available, otherwise use timeframe dates
  const startDate = new Date(
    assignment.semester?.startDate ?? assignment.timeframe.startDate
  );
  const endDate = new Date(
    assignment.semester?.endDate ?? assignment.timeframe.endDate
  );

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return today >= startDate && today <= endDate;
}
