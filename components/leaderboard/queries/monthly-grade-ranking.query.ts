"server only";

import { toZonedTime } from "date-fns-tz";

import { APP_TIMEZONE } from "@/lib/constants/timezone";
import calculateGrade from "@/lib/utils/calculate-grade";
import { prisma } from "@/prisma/prisma-client";

export interface MonthlyGradeRankingUser {
  id: string;
  nickname: string;
  grade: string;
  score: number;
  countryIcon?: string;
  rank: number;
  medalImageUrl?: string;
  campusId?: string | null;
  campusName?: string;
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

export async function getMonthlyGradeRankings(
  type: "novel" | "rc",
  userId: string,
  userGrade?: string,
): Promise<MonthlyGradeRankingUser[]> {
  const now = new Date();
  const koreaTime = toZonedTime(now, APP_TIMEZONE);
  const year = koreaTime.getFullYear();
  const month = koreaTime.getMonth() + 1;

  // If no user grade is provided, calculate it from the user's birthday
  let targetGrade = userGrade;

  if (!targetGrade) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        birthday: true,
      },
    });

    if (user) {
      targetGrade = calculateGrade(user.birthday);
    }
  }

  if (!targetGrade || targetGrade === "N/A") {
    return [];
  }

  if (type === "novel") {
    // Get all users with monthly AR + BPA scores
    const users = await prisma.user.findMany({
      include: {
        monthlyARScores: {
          where: {
            year,
            month,
          },
        },
        monthlyBPAScores: {
          where: {
            year,
            month,
          },
        },
        country: {
          include: {
            countryIcon: true,
          },
        },
        campus: {
          select: {
            name: true,
          },
        },
      },
      where: {
        OR: [
          {
            monthlyARScores: {
              some: {
                year,
                month,
                score: { gt: 0 },
              },
            },
          },
          {
            monthlyBPAScores: {
              some: {
                year,
                month,
                score: { gt: 0 },
              },
            },
          },
        ],
      },
    });

    // Filter users by the same grade and calculate their AR + BPA scores
    const userScores = users
      .filter((user) => calculateGrade(user.birthday) === targetGrade)
      .map((user) => {
        const userGradeCalculated = calculateGrade(user.birthday);
        const arScore = user.monthlyARScores.reduce(
          (sum, score) => sum + score.score,
          0,
        );
        const bpaScore = user.monthlyBPAScores.reduce(
          (sum, score) => sum + score.score,
          0,
        );
        const totalScore = arScore + bpaScore;

        return {
          id: user.id,
          nickname: user.nickname || user.name || "Anonymous",
          grade: formatGradeForDisplay(userGradeCalculated),
          score: totalScore,
          countryIcon: user.country?.countryIcon?.iconUrl,
          campusId: user.campusId,
          campusName: user.campus?.name,
        };
      });

    // Sort by score and get top 5
    const rankings = userScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
      }));

    // Get medal images for top 3 (placeholder for now - would need to determine actual level)
    // This would need additional logic to determine which level's medal images to use
    const rankingsWithMedals = await Promise.all(
      rankings.map(async (ranking) => ({
        ...ranking,
        medalImageUrl: ranking.rank <= 3 ? undefined : undefined, // Placeholder
      }))
    );

    return rankingsWithMedals;
  } else {
    // Get all users with monthly RC scores
    const users = await prisma.user.findMany({
      include: {
        monthlyRCScores: {
          where: {
            year,
            month,
          },
        },
        country: {
          include: {
            countryIcon: true,
          },
        },
        campus: {
          select: {
            name: true,
          },
        },
      },
      where: {
        monthlyRCScores: {
          some: {
            year,
            month,
            score: { gt: 0 },
          },
        },
      },
    });

    // Filter users by the same grade and calculate their scores
    const userScores = users
      .filter((user) => calculateGrade(user.birthday) === targetGrade)
      .map((user) => {
        const userGradeCalculated = calculateGrade(user.birthday);
        const totalScore = user.monthlyRCScores.reduce(
          (sum, score) => sum + score.score,
          0,
        );

        return {
          id: user.id,
          nickname: user.nickname || user.name || "Anonymous",
          grade: formatGradeForDisplay(userGradeCalculated),
          score: totalScore,
          countryIcon: user.country?.countryIcon?.iconUrl,
          campusId: user.campusId,
          campusName: user.campus?.name,
        };
      });

    // Sort by score and get top 5
    const rankings = userScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
      }));

    // Get medal images for top 3 (placeholder for now - would need to determine actual level)
    const rankingsWithMedals = await Promise.all(
      rankings.map(async (ranking) => ({
        ...ranking,
        medalImageUrl: ranking.rank <= 3 ? undefined : undefined, // Placeholder
      }))
    );

    return rankingsWithMedals;
  }
}

export async function getTotalMonthlyGradeRankings(
  userId: string,
  userGrade?: string,
): Promise<MonthlyGradeRankingUser[]> {
  const now = new Date();
  const koreaTime = toZonedTime(now, APP_TIMEZONE);
  const year = koreaTime.getFullYear();
  const month = koreaTime.getMonth() + 1;

  // If no user grade is provided, calculate it from the user's birthday
  let targetGrade = userGrade;

  if (!targetGrade) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        birthday: true,
      },
    });

    if (user) {
      targetGrade = calculateGrade(user.birthday);
    }
  }

  if (!targetGrade || targetGrade === "N/A") {
    return [];
  }

  // Get all users with either monthly AR, RC, or BPA scores
  const users = await prisma.user.findMany({
    include: {
      monthlyARScores: {
        where: {
          year,
          month,
        },
      },
      monthlyRCScores: {
        where: {
          year,
          month,
        },
      },
      monthlyBPAScores: {
        where: {
          year,
          month,
        },
      },
      country: {
        include: {
          countryIcon: true,
        },
      },
      campus: {
        select: {
          name: true,
        },
      },
    },
    where: {
      OR: [
        {
          monthlyARScores: {
            some: {
              year,
              month,
              score: { gt: 0 },
            },
          },
        },
        {
          monthlyRCScores: {
            some: {
              year,
              month,
              score: { gt: 0 },
            },
          },
        },
        {
          monthlyBPAScores: {
            some: {
              year,
              month,
              score: { gt: 0 },
            },
          },
        },
      ],
    },
  });

  // Filter users by the same grade and calculate their combined AR + RC + BPA scores
  const userScores = users
    .filter((user) => calculateGrade(user.birthday) === targetGrade)
    .map((user) => {
      const userGradeCalculated = calculateGrade(user.birthday);
      const arScore = user.monthlyARScores.reduce(
        (sum, score) => sum + score.score,
        0,
      );
      const rcScore = user.monthlyRCScores.reduce(
        (sum, score) => sum + score.score,
        0,
      );
      const bpaScore = user.monthlyBPAScores.reduce(
        (sum, score) => sum + score.score,
        0,
      );
      const totalScore = arScore + rcScore + bpaScore;

      return {
        id: user.id,
        nickname: user.nickname || user.name || "Anonymous",
        grade: formatGradeForDisplay(userGradeCalculated),
        score: totalScore,
        countryIcon: user.country?.countryIcon?.iconUrl,
        campusId: user.campusId,
        campusName: user.campus?.name,
      };
    })
    .filter((user) => user.score > 0); // Only include users with scores

  // Sort by total score and get top 5
  const rankings = userScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((user, index) => ({
      ...user,
      rank: index + 1,
    }));

  // Get medal images for top 3 (placeholder for now)
  const rankingsWithMedals = await Promise.all(
    rankings.map(async (ranking) => ({
      ...ranking,
      medalImageUrl: ranking.rank <= 3 ? undefined : undefined, // Placeholder
    }))
  );

  return rankingsWithMedals;
}