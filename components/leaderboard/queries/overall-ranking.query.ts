"server only";

import { prisma } from "@/prisma/prisma-client";

export interface OverallRankingUser {
  id: string;
  nickname: string;
  grade: string;
  score: number;
  countryIcon?: string;
  rank: number;
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
      const highestGrade = user.ARScore.reduce((highest, score) => {
        const gradeNum = parseInt(score.AR.relevantGrade);
        const currentHighest = parseInt(highest);
        return gradeNum > currentHighest ? score.AR.relevantGrade : highest;
      }, "0");

      return {
        id: user.id,
        nickname: user.nickname || user.name || "Anonymous",
        grade: highestGrade,
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
      const highestGrade = user.RCScore.reduce((highest, score) => {
        const gradeNum = parseInt(score.RCLevel.relevantGrade);
        const currentHighest = parseInt(highest);
        return gradeNum > currentHighest
          ? score.RCLevel.relevantGrade
          : highest;
      }, "0");

      return {
        id: user.id,
        nickname: user.nickname || user.name || "Anonymous",
        grade: highestGrade,
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
