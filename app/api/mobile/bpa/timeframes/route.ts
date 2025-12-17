import { NextResponse } from "next/server";

import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/prisma/prisma-client";

/**
 * GET /api/mobile/bpa/timeframes
 * Fetch all BPA timeframes with their semesters ordered by start date (most recent first)
 */
export async function GET(request: Request) {
  try {
    // Verify mobile auth
    const payload = await verifyMobileToken(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const timeframes = await prisma.bPATimeframe.findMany({
      orderBy: {
        startDate: "desc",
      },
      include: {
        semesters: {
          orderBy: {
            startDate: "asc",
          },
        },
      },
    });

    const formattedTimeframes = timeframes.map((timeframe) => ({
      id: timeframe.id,
      year: timeframe.year,
      startDate: timeframe.startDate.toISOString().split("T")[0],
      endDate: timeframe.endDate.toISOString().split("T")[0],
      label: `${timeframe.startDate.toISOString().split("T")[0]} ~ ${timeframe.endDate.toISOString().split("T")[0]}`,
      isActive: timeframe.isActive,
      semesters: timeframe.semesters.map((semester) => ({
        id: semester.id,
        season: semester.season,
        startDate: semester.startDate.toISOString().split("T")[0],
        endDate: semester.endDate.toISOString().split("T")[0],
        timeframeId: semester.timeframeId,
      })),
    }));

    return NextResponse.json({ timeframes: formattedTimeframes });
  } catch (error) {
    console.error("Error fetching BPA timeframes:", error);
    return NextResponse.json(
      { error: "Failed to fetch BPA timeframes" },
      { status: 500 }
    );
  }
}
