import { notFound } from "next/navigation";
import React from "react";

import { getRCSettings } from "@/app/(after-auth)/admin/settings/queries/settings-queries";
import { LevelType } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";
import { getSingleKeywordChallenges } from "@/server-queries/admin/content-challenges";
import { getCurrentKoreaYearMonth } from "@/server-queries/medals";

import KeywordEditForm from "./components/keyword-edit-form";

interface PageProps {
  params: Promise<{
    id: string;
    keywordId: string;
  }>;
}

const KeywordEditPage = async ({ params }: PageProps) => {
  const { id, keywordId } = await params;

  const keyword = await prisma.rCKeyword.findUnique({
    where: { id: keywordId },
    include: {
      RCLevel: true,
      RCQuestionSet: {
        include: {
          RCQuestion: {
            orderBy: { orderNumber: "asc" },
          },
        },
      },
    },
  });

  if (!keyword || keyword.rcLevelId !== id) {
    notFound();
  }

  const rcLevels = await prisma.rCLevel.findMany({
    orderBy: { level: "asc" },
  });

  const rcSettings = await getRCSettings();
  
  // Fetch challenge data
  const challenges = await getSingleKeywordChallenges(keywordId);
  
  // Check for current month challenge
  const { year, month } = getCurrentKoreaYearMonth();
  let currentMonthChallenge = null;
  
  // First check if keyword is already in a current month challenge
  const currentChallenge = challenges.find(
    c => c.year === year && c.month === month && c.active
  );
  
  if (currentChallenge) {
    currentMonthChallenge = {
      ...currentChallenge,
      keywordIds: [keywordId], // We know this keyword is included
    };
  } else {
    // Check if there's a challenge for the RC level
    const levelChallenge = await prisma.monthlyChallenge.findUnique({
      where: {
        year_month_levelType_levelId: {
          year,
          month,
          levelType: LevelType.RC,
          levelId: keyword.rcLevelId,
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
        keywordIds: levelChallenge.keywordIds,
      };
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <KeywordEditForm
        keyword={keyword}
        rcLevels={rcLevels}
        rcSettings={rcSettings}
        challenges={challenges}
        currentMonthChallenge={currentMonthChallenge}
      />
    </div>
  );
};

export default KeywordEditPage;
