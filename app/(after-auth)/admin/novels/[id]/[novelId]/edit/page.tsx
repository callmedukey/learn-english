import { notFound } from "next/navigation";
import React from "react";

import { getNovelSettings } from "@/app/(after-auth)/admin/settings/queries/settings-queries";
import { LevelType } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";
import { getSingleNovelChallenges } from "@/server-queries/admin/content-challenges";
import { getCurrentKoreaYearMonth } from "@/server-queries/medals";

import NovelEditForm from "./components/novel-edit-form";

interface PageProps {
  params: Promise<{
    id: string;
    novelId: string;
  }>;
}

const NovelEditPage = async ({ params }: PageProps) => {
  const { id, novelId } = await params;

  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: {
      AR: true,
      novelChapters: {
        orderBy: { orderNumber: "asc" },
        include: {
          novelQuestionSet: {
            include: {
              novelQuestions: {
                orderBy: { orderNumber: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!novel || novel.ARId !== id) {
    notFound();
  }

  const arLevels = await prisma.aR.findMany({
    orderBy: { level: "asc" },
  });

  const novelSettings = await getNovelSettings();
  
  // Fetch challenge data
  const challenges = await getSingleNovelChallenges(novelId);
  
  // Check for current month challenge
  const { year, month } = getCurrentKoreaYearMonth();
  let currentMonthChallenge = null;
  
  // First check if novel is already in a current month challenge
  const currentChallenge = challenges.find(
    c => c.year === year && c.month === month && c.active
  );
  
  if (currentChallenge) {
    currentMonthChallenge = {
      ...currentChallenge,
      novelIds: [novelId], // We know this novel is included
    };
  } else if (novel.ARId) {
    // Check if there's a challenge for the AR level
    const levelChallenge = await prisma.monthlyChallenge.findUnique({
      where: {
        year_month_levelType_levelId: {
          year,
          month,
          levelType: LevelType.AR,
          levelId: novel.ARId,
        },
      },
    });
    
    if (levelChallenge) {
      currentMonthChallenge = {
        id: levelChallenge.id,
        year: levelChallenge.year,
        month: levelChallenge.month,
        active: levelChallenge.active,
        scheduledActive: levelChallenge.scheduledActive,
        novelIds: levelChallenge.novelIds,
      };
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <NovelEditForm
        novel={novel}
        arLevels={arLevels}
        novelSettings={novelSettings}
        challenges={challenges}
        currentMonthChallenge={currentMonthChallenge}
      />
    </div>
  );
};

export default NovelEditPage;
