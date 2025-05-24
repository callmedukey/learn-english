"server only";

import { prisma } from "@/prisma/prisma-client";

export interface GradeRankingUser {
  id: string;
  nickname: string;
  grade: string;
  score: number;
  countryIcon?: string;
  rank: number;
}

export async function getGradeRankings(
  type: "novel" | "rc",
  userId: string,
  userGrade?: string,
): Promise<GradeRankingUser[]> {
  // If no user grade is provided, try to determine it from their scores
  let targetGrade = userGrade;

  if (!targetGrade) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
      },
    });

    if (user) {
      if (type === "novel" && user.ARScore.length > 0) {
        targetGrade = user.ARScore.reduce((highest, score) => {
          const gradeNum = parseInt(score.AR.relevantGrade);
          const currentHighest = parseInt(highest);
          return gradeNum > currentHighest ? score.AR.relevantGrade : highest;
        }, "0");
      } else if (type === "rc" && user.RCScore.length > 0) {
        targetGrade = user.RCScore.reduce((highest, score) => {
          const gradeNum = parseInt(score.RCLevel.relevantGrade);
          const currentHighest = parseInt(highest);
          return gradeNum > currentHighest
            ? score.RCLevel.relevantGrade
            : highest;
        }, "0");
      }
    }
  }

  if (!targetGrade) {
    return [];
  }

  if (type === "novel") {
    // Get users with AR scores in the same grade
    const users = await prisma.user.findMany({
      include: {
        ARScore: {
          include: {
            AR: true,
          },
          where: {
            AR: {
              relevantGrade: targetGrade,
            },
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
          some: {
            AR: {
              relevantGrade: targetGrade,
            },
          },
        },
      },
    });

    // Calculate scores for the specific grade
    const userScores = users.map((user) => {
      const gradeScore = user.ARScore.filter(
        (score) => score.AR.relevantGrade === targetGrade,
      ).reduce((sum, score) => sum + score.score, 0);

      return {
        id: user.id,
        nickname: user.nickname || user.name || "Anonymous",
        grade: targetGrade,
        score: gradeScore,
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
    // Get users with RC scores in the same grade
    const users = await prisma.user.findMany({
      include: {
        RCScore: {
          include: {
            RCLevel: true,
          },
          where: {
            RCLevel: {
              relevantGrade: targetGrade,
            },
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
          some: {
            RCLevel: {
              relevantGrade: targetGrade,
            },
          },
        },
      },
    });

    // Calculate scores for the specific grade
    const userScores = users.map((user) => {
      const gradeScore = user.RCScore.filter(
        (score) => score.RCLevel.relevantGrade === targetGrade,
      ).reduce((sum, score) => sum + score.score, 0);

      return {
        id: user.id,
        nickname: user.nickname || user.name || "Anonymous",
        grade: targetGrade,
        score: gradeScore,
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
