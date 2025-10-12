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
 * Determine the current active BPA timeframe and season based on the current date.
 *
 * Season calculation:
 * - SPRING: March 1 - May 31 (months 3-5)
 * - SUMMER: June 1 - August 31 (months 6-8)
 * - FALL: September 1 - November 30 (months 9-11)
 * - WINTER: December 1 - February 28/29 (months 12, 1, 2)
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

    // Determine current season based on Korea timezone month
    const month = koreaTime.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
    let season: BPASeason;

    if (month >= 3 && month <= 5) {
      season = BPASeason.SPRING;
    } else if (month >= 6 && month <= 8) {
      season = BPASeason.SUMMER;
    } else if (month >= 9 && month <= 11) {
      season = BPASeason.FALL;
    } else {
      // December (12), January (1), February (2)
      season = BPASeason.WINTER;
    }

    return {
      timeframeId: activeTimeframe.id,
      season,
    };
  } catch (error) {
    console.error("Error getting current BPA context:", error);
    return {
      timeframeId: null,
      season: null,
    };
  }
}
