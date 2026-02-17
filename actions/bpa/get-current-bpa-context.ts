"use server";

import { toZonedTime } from "date-fns-tz";

import { APP_TIMEZONE } from "@/lib/constants/timezone";
import { BPASeason } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

interface BPAContext {
  timeframeId: string | null;
  season: BPASeason | null;
}

/**
 * Determine the current active BPA timeframe and season for UI display purposes.
 *
 * Season calculation is based on admin-configured semester date ranges in the database,
 * not hardcoded month ranges. Admins can configure custom start/end dates for each season
 * via the BPA timeframe admin UI.
 *
 * NOTE: This function returns a SINGLE semester for UI context (dashboard display,
 * semester selectors, etc.). When semesters overlap, it returns the most recently
 * started semester (orderBy: startDate desc).
 *
 * For ACCESS CONTROL decisions (can user access a novel?), use the functions in
 * lib/bpa/access-control.ts which handle overlapping semesters by granting access
 * to content from ALL active semesters.
 */
export async function getCurrentBPAContext(): Promise<BPAContext> {
  try {
    const now = new Date();
    const koreaTime = toZonedTime(now, APP_TIMEZONE);

    // Find the active timeframe (current date falls within startDate and endDate)
    const activeTimeframe = await prisma.bPATimeframe.findFirst({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    if (!activeTimeframe) {
      console.warn("No active BPA timeframe found for current date");
      return {
        timeframeId: null,
        season: null,
      };
    }

    // Find the current semester based on admin-configured date ranges
    // Use desc ordering to prefer most recently started semester when ranges overlap
    const currentSemester = await prisma.bPASemester.findFirst({
      where: {
        timeframeId: activeTimeframe.id,
        startDate: { lte: koreaTime },
        endDate: { gte: koreaTime },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    if (!currentSemester) {
      console.warn(
        `No semester found for current date in timeframe ${activeTimeframe.id}. ` +
        `Current date: ${koreaTime.toISOString()}`
      );
      return {
        timeframeId: activeTimeframe.id,
        season: null,
      };
    }

    return {
      timeframeId: activeTimeframe.id,
      season: currentSemester.season,
    };
  } catch (error) {
    console.error("Error getting current BPA context:", error);
    return {
      timeframeId: null,
      season: null,
    };
  }
}
