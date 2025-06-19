"server only";

import calculateGrade from "@/lib/utils/calculate-grade";
import { prisma } from "@/prisma/prisma-client";

export interface GradeRankingUser {
  id: string;
  nickname: string;
  grade: string;
  score: number;
  countryIcon?: string;
  rank: number;
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
    // Get all users with AR scores
    const users = await prisma.user.findMany({
      include: {
        ARScore: true,
        country: {
          include: {
            countryIcon: true,
          },
        },
      },
      where: {
        ARScore: {
          some: {},
        },
      },
    });

    // Filter users by the same grade and calculate their scores
    const userScores = users
      .filter((user) => calculateGrade(user.birthday) === targetGrade)
      .map((user) => {
        const userGradeCalculated = calculateGrade(user.birthday);
        const totalScore = user.ARScore.reduce(
          (sum, score) => sum + score.score,
          0,
        );

        return {
          id: user.id,
          nickname: user.nickname || user.name || "Anonymous",
          grade: formatGradeForDisplay(userGradeCalculated),
          score: totalScore,
          countryIcon: user.country?.countryIcon?.iconUrl,
        };
      });

    // Sort by score and return top 5
    return userScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
      }));
  } else {
    // Get all users with RC scores
    const users = await prisma.user.findMany({
      include: {
        RCScore: true,
        country: {
          include: {
            countryIcon: true,
          },
        },
      },
      where: {
        RCScore: {
          some: {},
        },
      },
    });

    // Filter users by the same grade and calculate their scores
    const userScores = users
      .filter((user) => calculateGrade(user.birthday) === targetGrade)
      .map((user) => {
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
        };
      });

    // Sort by score and return top 5
    return userScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
      }));
  }
}
