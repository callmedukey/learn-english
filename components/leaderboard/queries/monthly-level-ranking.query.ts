"server only";

import { toZonedTime } from "date-fns-tz";

import { APP_TIMEZONE } from "@/lib/constants/timezone";
import calculateGrade from "@/lib/utils/calculate-grade";
import { prisma } from "@/prisma/prisma-client";
import { MedalType } from "@/prisma/generated/prisma";

export interface MonthlyLevelRankingUser {
  id: string;
  nickname: string;
  grade: string;
  score: number;
  countryIcon?: string;
  rank: number;
  medalImageUrl?: string;
}

// Helper function to extract just the number from grade
function formatGradeForDisplay(grade: string): string {
  if (grade.startsWith("Grade ")) {
    return grade.replace("Grade ", "");
  }
  if (grade === "Below Grade 1" || grade === "Kinder") {
    return "K";
  }
  return grade; // For "Adult" and "N/A"
}

export async function getMonthlyLevelRankings(
  levelType: "AR" | "RC",
  levelId: string,
  limit: number = 5
): Promise<MonthlyLevelRankingUser[]> {
  const now = new Date();
  const koreaTime = toZonedTime(now, APP_TIMEZONE);
  const year = koreaTime.getFullYear();
  const month = koreaTime.getMonth() + 1;

  // Get medal images for this level
  const medalImages = await prisma.medalImage.findMany({
    where: {
      levelType,
      levelId,
    },
  });

  const medalImageMap = new Map(
    medalImages.map((img) => [img.medalType, img.imageUrl])
  );

  if (levelType === "AR") {
    // Get top users for this specific AR level
    const scores = await prisma.monthlyARScore.findMany({
      where: {
        ARId: levelId,
        year,
        month,
        score: { gt: 0 },
      },
      orderBy: {
        score: "desc",
      },
      take: limit,
      include: {
        user: {
          include: {
            country: {
              include: {
                countryIcon: true,
              },
            },
          },
        },
      },
    });

    return scores.map((score, index) => {
      const rank = index + 1;
      const userGrade = calculateGrade(score.user.birthday);
      
      // Get medal image for top 3
      let medalImageUrl: string | undefined;
      if (rank === 1) medalImageUrl = medalImageMap.get(MedalType.GOLD);
      else if (rank === 2) medalImageUrl = medalImageMap.get(MedalType.SILVER);
      else if (rank === 3) medalImageUrl = medalImageMap.get(MedalType.BRONZE);
      
      return {
        id: score.userId,
        nickname: score.user.nickname || score.user.name || "Anonymous",
        grade: formatGradeForDisplay(userGrade),
        score: score.score,
        countryIcon: score.user.country?.countryIcon?.iconUrl,
        rank,
        medalImageUrl,
      };
    });
  } else {
    // Get top users for this specific RC level
    const scores = await prisma.monthlyRCScore.findMany({
      where: {
        RCLevelId: levelId,
        year,
        month,
        score: { gt: 0 },
      },
      orderBy: {
        score: "desc",
      },
      take: limit,
      include: {
        user: {
          include: {
            country: {
              include: {
                countryIcon: true,
              },
            },
          },
        },
      },
    });

    return scores.map((score, index) => {
      const rank = index + 1;
      const userGrade = calculateGrade(score.user.birthday);
      
      // Get medal image for top 3
      let medalImageUrl: string | undefined;
      if (rank === 1) medalImageUrl = medalImageMap.get(MedalType.GOLD);
      else if (rank === 2) medalImageUrl = medalImageMap.get(MedalType.SILVER);
      else if (rank === 3) medalImageUrl = medalImageMap.get(MedalType.BRONZE);
      
      return {
        id: score.userId,
        nickname: score.user.nickname || score.user.name || "Anonymous",
        grade: formatGradeForDisplay(userGrade),
        score: score.score,
        countryIcon: score.user.country?.countryIcon?.iconUrl,
        rank,
        medalImageUrl,
      };
    });
  }
}