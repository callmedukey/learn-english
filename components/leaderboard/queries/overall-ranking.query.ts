"server only";

import calculateGrade from "@/lib/utils/calculate-grade";
import { prisma } from "@/prisma/prisma-client";

export interface OverallRankingUser {
  id: string;
  nickname: string;
  grade: string;
  score: number;
  countryIcon?: string;
  rank: number;
  campusId?: string | null;
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

export async function getOverallRankings(
  type: "novel" | "rc",
): Promise<OverallRankingUser[]> {
  if (type === "novel") {
    // Get top users by AR (novel) scores
    const users = await prisma.user.findMany({
      include: {
        ARScore: {
          include: {
            AR: true,
          },
        },
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

    // Calculate total AR scores for each user
    const userScores = users.map((user) => {
      const totalScore = user.ARScore.reduce(
        (sum, score) => sum + score.score,
        0,
      );
      const grade = calculateGrade(user.birthday);

      return {
        id: user.id,
        nickname: user.nickname || user.name || "Anonymous",
        grade: formatGradeForDisplay(grade),
        score: totalScore,
        countryIcon: user.country?.countryIcon?.iconUrl,
        campusId: user.campusId,
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
    // Get top users by RC scores
    const users = await prisma.user.findMany({
      include: {
        RCScore: {
          include: {
            RCLevel: true,
          },
        },
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

    // Calculate total RC scores for each user
    const userScores = users.map((user) => {
      const totalScore = user.RCScore.reduce(
        (sum, score) => sum + score.score,
        0,
      );
      const grade = calculateGrade(user.birthday);

      return {
        id: user.id,
        nickname: user.nickname || user.name || "Anonymous",
        grade: formatGradeForDisplay(grade),
        score: totalScore,
        countryIcon: user.country?.countryIcon?.iconUrl,
        campusId: user.campusId,
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

export async function getTotalOverallRankings(): Promise<OverallRankingUser[]> {
  // Get all users with either AR, RC, or BPA scores
  const users = await prisma.user.findMany({
    include: {
      ARScore: {
        include: {
          AR: true,
        },
      },
      RCScore: {
        include: {
          RCLevel: true,
        },
      },
      bpaScores: true,
      country: {
        include: {
          countryIcon: true,
        },
      },
    },
    where: {
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
    },
  });

  // Calculate combined scores for each user
  const userScores = users.map((user) => {
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
    const grade = calculateGrade(user.birthday);

    return {
      id: user.id,
      nickname: user.nickname || user.name || "Anonymous",
      grade: formatGradeForDisplay(grade),
      score: totalScore,
      countryIcon: user.country?.countryIcon?.iconUrl,
      campusId: user.campusId,
    };
  });

  // Sort by total score and return top 10
  return userScores
    .filter((user) => user.score > 0) // Only include users with scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((user, index) => ({
      ...user,
      rank: index + 1,
    }));
}
