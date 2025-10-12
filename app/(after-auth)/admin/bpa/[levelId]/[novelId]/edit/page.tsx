import { notFound, redirect } from "next/navigation";
import React from "react";

import { getNovelSettings } from "@/app/(after-auth)/admin/settings/queries/settings-queries";
import { auth } from "@/auth";
import { canEditNovel } from "@/lib/utils/permissions";
import { Role } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

import { getNovelSemesterAssignments } from "./actions/semester-assignment.actions";
import NovelEditForm from "./components/novel-edit-form";

interface PageProps {
  params: Promise<{
    levelId: string;
    novelId: string;
  }>;
}

const BPANovelEditPage = async ({ params }: PageProps) => {
  const { levelId, novelId } = await params;
  const session = await auth();
  const userRole = session?.user?.role as Role | undefined;

  const novel = await prisma.bPANovel.findUnique({
    where: { id: novelId },
    include: {
      bpaLevel: true,
      units: {
        orderBy: { orderNumber: "asc" },
        include: {
          chapters: {
            orderBy: { orderNumber: "asc" },
            include: {
              questionSet: {
                include: {
                  questions: {
                    orderBy: { orderNumber: "asc" },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!novel || novel.bpaLevelId !== levelId) {
    notFound();
  }

  // Check if user can edit this novel
  if (!session || !canEditNovel(userRole, novel.locked)) {
    redirect(`/admin/bpa/${levelId}`);
  }

  const bpaLevels = await prisma.bPALevel.findMany({
    orderBy: { orderNumber: "asc" },
  });

  // Use global novel settings for BPA (no level-specific settings yet)
  const novelSettings = await getNovelSettings();

  // Fetch all timeframes for semester assignment
  const timeframes = await prisma.bPATimeframe.findMany({
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      year: true,
      startDate: true,
      endDate: true,
    },
  });

  // Fetch current semester assignments for this novel
  const semesterAssignments = await getNovelSemesterAssignments(novelId);

  return (
    <div className="container mx-auto px-4 py-8">
      <NovelEditForm
        novel={novel}
        bpaLevels={bpaLevels}
        novelSettings={novelSettings}
        timeframes={timeframes}
        semesterAssignments={semesterAssignments}
        userRole={userRole}
      />
    </div>
  );
};

export default BPANovelEditPage;
