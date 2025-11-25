"server only";

import calculateBirthYearRangeForGrade from "@/lib/utils/calculate-birth-year-range";
import calculateGrade from "@/lib/utils/calculate-grade";
import { prisma } from "@/prisma/prisma-client";

export interface GradeRankingUser {
  id: string;
  nickname: string;
  grade: string;
  score: number;
  countryIcon?: string;
  rank: number;
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

export async function getGradeRankings(
  type: "novel" | "rc",
  userId: string,
  userGrade?: string,
): Promise<GradeRankingUser[]> {
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
    // Calculate birth year range for the target grade
    const birthYearRange = calculateBirthYearRangeForGrade(targetGrade);
    const whereClause: any = {
      OR: [
        {
          ARScore: {
            some: {},
          },
        },
        {
          bpaScores: {
            some: {},
          },
        },
      ],
    };

    if (birthYearRange) {
      whereClause.birthday = {
        gte: new Date(`${birthYearRange.minYear}-01-01`),
        lte: new Date(`${birthYearRange.maxYear}-12-31`),
      };
    }

    // Get users with AR + BPA scores filtered by grade at database level
    const users = await prisma.user.findMany({
      include: {
        ARScore: true,
        bpaScores: true,
        country: {
          include: {
            countryIcon: true,
          },
        },
        campus: true,
      },
      where: whereClause,
    });

    // Calculate AR + BPA scores for users (already filtered by grade)
    const userScores = users.map((user) => {
        const userGradeCalculated = calculateGrade(user.birthday);
        const arScore = user.ARScore.reduce(
          (sum, score) => sum + score.score,
          0,
        );
        const bpaScore = user.bpaScores.reduce(
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

    // Sort by score and return top 5
    return userScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
      }));
  } else {
    // Calculate birth year range for the target grade
    const birthYearRange = calculateBirthYearRangeForGrade(targetGrade);
    const whereClause: any = {
      RCScore: {
        some: {},
      },
    };
    
    if (birthYearRange) {
      whereClause.birthday = {
        gte: new Date(`${birthYearRange.minYear}-01-01`),
        lte: new Date(`${birthYearRange.maxYear}-12-31`),
      };
    }

    // Get users with RC scores filtered by grade at database level
    const users = await prisma.user.findMany({
      include: {
        RCScore: true,
        country: {
          include: {
            countryIcon: true,
          },
        },
        campus: true,
      },
      where: whereClause,
    });

    // Calculate scores for users (already filtered by grade)
    const userScores = users.map((user) => {
        const userGradeCalculated = calculateGrade(user.birthday);
        const totalScore = user.RCScore.reduce(
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

    // Sort by score and return top 5
    return userScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
      }));
  }
}

export async function getTotalGradeRankings(
  userId: string,
  userGrade?: string,
): Promise<GradeRankingUser[]> {
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

  // Calculate birth year range for the target grade
  const birthYearRange = calculateBirthYearRangeForGrade(targetGrade);
  const whereClause: any = {
    OR: [
      {
        ARScore: {
          some: {},
        },
      },
      {
        RCScore: {
          some: {},
        },
      },
      {
        bpaScores: {
          some: {},
        },
      },
    ],
  };

  if (birthYearRange) {
    whereClause.birthday = {
      gte: new Date(`${birthYearRange.minYear}-01-01`),
      lte: new Date(`${birthYearRange.maxYear}-12-31`),
    };
  }

  // Get users with either AR, RC, or BPA scores filtered by grade at database level
  const users = await prisma.user.findMany({
    include: {
      ARScore: true,
      RCScore: true,
      bpaScores: true,
      country: {
        include: {
          countryIcon: true,
        },
      },
      campus: true,
    },
    where: whereClause,
  });

  // Calculate combined scores for users (already filtered by grade)
  const userScores = users.map((user) => {
      const userGradeCalculated = calculateGrade(user.birthday);
      const arScore = user.ARScore.reduce(
        (sum, score) => sum + score.score,
        0,
      );
      const rcScore = user.RCScore.reduce(
        (sum, score) => sum + score.score,
        0,
      );
      const bpaScore = user.bpaScores.reduce(
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

  // Sort by total score and return top 10
  return userScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((user, index) => ({
      ...user,
      rank: index + 1,
    }));
}
