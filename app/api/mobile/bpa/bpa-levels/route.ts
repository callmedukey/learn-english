import { NextResponse } from "next/server";

import { getCurrentBPAContext } from "@/actions/bpa/get-current-bpa-context";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/prisma/prisma-client";

export async function GET(request: Request) {
  const payload = await verifyMobileToken(request);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.sub;

  try {
    // Check if user has an assigned campus
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { campusId: true },
    });

    // If no campus is assigned, return access denied
    if (!user?.campusId) {
      return NextResponse.json({
        bpaLevels: [],
        hasCampusAccess: false,
      });
    }

    // Get current semester context
    const currentSemester = await getCurrentBPAContext();

    // Fetch user's level assignments for the current timeframe
    let userAssignedLevelIds: string[] = [];
    if (currentSemester.timeframeId && currentSemester.season) {
      const assignments = await prisma.bPAUserLevelAssignment.findMany({
        where: {
          userId: userId,
          timeframeId: currentSemester.timeframeId,
          season: currentSemester.season,
        },
        select: {
          bpaLevelId: true,
        },
      });
      userAssignedLevelIds = assignments.map((a) => a.bpaLevelId);
    }

    // Fetch all BPA levels
    const bpaLevels = await prisma.bPALevel.findMany({
      orderBy: {
        orderNumber: "asc",
      },
      select: {
        id: true,
        name: true,
        description: true,
        stars: true,
        orderNumber: true,
        _count: {
          select: {
            novels: {
              where: {
                hidden: false,
              },
            },
          },
        },
      },
    });

    // Transform levels with assignment status
    const transformedLevels = bpaLevels.map((level) => ({
      id: level.id,
      name: level.name,
      description: level.description,
      stars: level.stars,
      novelsAvailable: level._count.novels,
      isAssigned: userAssignedLevelIds.includes(level.id),
    }));

    return NextResponse.json({
      bpaLevels: transformedLevels,
      hasCampusAccess: true,
    });
  } catch (error) {
    console.error("BPA Levels API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch BPA levels" },
      { status: 500 }
    );
  }
}
