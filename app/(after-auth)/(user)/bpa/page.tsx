import { redirect } from "next/navigation";
import React from "react";

import { auth } from "@/auth";
import { BPAPageContent } from "@/components/bpa/bpa-page-content";
import { prisma } from "@/prisma/prisma-client";

import { getCampusEventsForStudent } from "./queries/campus-events.query";

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

  // If no campus is assigned, show access denied message (super users bypass this)
  if (!user?.campusId && !session.user.isSuperUser) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center px-4">
        <div className="max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
            <svg
              className="h-10 w-10 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-gray-900">
              접속 권한이 없습니다
            </h1>
            <p className="text-lg text-gray-600">관리자에게 문의해주세요</p>
          </div>

          <div className="pt-4">
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
            >
              대시보드로 돌아가기
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Fetch user's level assignments for ALL timeframes
  const assignments = await prisma.bPAUserLevelAssignment.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      timeframeId: true,
      season: true,
      bpaLevelId: true,
    },
  });

  // Convert to a mapping of timeframeId -> season -> bpaLevelId
  const userLevelAssignments: Record<string, Record<string, string>> = {};

  assignments.forEach((assignment) => {
    if (!userLevelAssignments[assignment.timeframeId]) {
      userLevelAssignments[assignment.timeframeId] = {};
    }

    // Convert SPRING -> Spring, SUMMER -> Summer, etc.
    const seasonKey =
      assignment.season.charAt(0).toUpperCase() +
      assignment.season.slice(1).toLowerCase();

    userLevelAssignments[assignment.timeframeId][seasonKey] =
      assignment.bpaLevelId;
  });

  // Fetch global BPA settings as fallback for defaultScore
  const globalBPASettings = await prisma.bPASettings.findFirst({
    select: { defaultScore: true },
  });

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
      bpaLevelSettings: {
        select: { defaultScore: true },
      },
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

  // Transform levels to include novel count and resolved defaultScore
  const levelsWithCount = bpaLevels.map((level) => ({
    id: level.id,
    name: level.name,
    description: level.description,
    stars: level.stars,
    novelsAvailable: level._count.novels,
    defaultScore: level.bpaLevelSettings?.defaultScore ?? globalBPASettings?.defaultScore ?? 0,
  }));

  // Fetch campus events for the student (only if they have a campus)
  const campusEvents = user?.campusId
    ? await getCampusEventsForStudent(user.campusId)
    : [];

  return (
    <BPAPageContent
      userLevelAssignments={userLevelAssignments}
      bpaLevels={levelsWithCount}
      campusEvents={campusEvents}
    />
  );
};

export default BPAPage;
