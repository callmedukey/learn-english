import { redirect } from "next/navigation";
import React from "react";

import { auth } from "@/auth";
import { BPAPageContent } from "@/components/bpa/bpa-page-content";
import { prisma } from "@/prisma/prisma-client";

export const dynamic = "force-dynamic";

const BPAPage = async () => {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Check if user has an assigned campus
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { campusId: true },
  });

  // If no campus is assigned, redirect to dashboard
  if (!user?.campusId) {
    redirect("/dashboard");
  }

  // Fetch the latest timeframe to get user's level assignments
  const latestTimeframe = await prisma.bPATimeframe.findFirst({
    orderBy: { startDate: "desc" },
    select: { id: true },
  });

  // Fetch user's level assignments for the latest timeframe
  let userLevelAssignments: Record<string, string> = {};

  if (latestTimeframe) {
    const assignments = await prisma.bPAUserLevelAssignment.findMany({
      where: {
        userId: session.user.id,
        timeframeId: latestTimeframe.id,
      },
      select: {
        season: true,
        bpaLevelId: true,
      },
    });

    // Convert to a mapping of season -> bpaLevelId
    userLevelAssignments = assignments.reduce(
      (acc, assignment) => {
        // Convert SPRING -> Spring, SUMMER -> Summer, etc.
        const seasonKey =
          assignment.season.charAt(0).toUpperCase() +
          assignment.season.slice(1).toLowerCase();
        acc[seasonKey] = assignment.bpaLevelId;
        return acc;
      },
      {} as Record<string, string>
    );
  }

  // Fetch BPA levels from database
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

  // Transform levels to include novel count
  const levelsWithCount = bpaLevels.map((level) => ({
    id: level.id,
    name: level.name,
    description: level.description,
    stars: level.stars,
    novelsAvailable: level._count.novels,
  }));

  return (
    <BPAPageContent
      userLevelAssignments={userLevelAssignments}
      bpaLevels={levelsWithCount}
    />
  );
};

export default BPAPage;
