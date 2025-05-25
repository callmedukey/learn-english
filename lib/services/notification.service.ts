"server only";

import calculateGrade from "@/lib/utils/calculate-grade";
import { prisma } from "@/prisma/prisma-client";

export interface RankingNotificationData {
  userId: string;
  type: "novel" | "rc";
  rankType: "overall" | "grade";
  rank: number;
  totalUsers: number;
  score: number;
  grade?: string;
}

/**
 * Check if user has achieved a new ranking and create notification if needed
 */
export async function checkAndCreateRankingNotification(
  userId: string,
  type: "novel" | "rc",
): Promise<void> {
  try {
    // Get user's current scores and grade
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ARScore: true,
        RCScore: true,
      },
    });

    if (!user) return;

    const userGrade = calculateGrade(user.birthday);

    // Calculate user's score for the specific type
    const userScore =
      type === "novel"
        ? user.ARScore.reduce((sum, score) => sum + score.score, 0)
        : user.RCScore.reduce((sum, score) => sum + score.score, 0);

    // Check overall ranking
    await checkOverallRanking(userId, type, userScore);

    // Check grade ranking if user has a valid grade
    if (userGrade && userGrade !== "N/A") {
      await checkGradeRanking(userId, type, userScore, userGrade);
    }
  } catch (error) {
    console.error("Error checking ranking notifications:", error);
  }
}

/**
 * Check overall ranking and create notification if user is in top 5
 */
async function checkOverallRanking(
  userId: string,
  type: "novel" | "rc",
  userScore: number,
): Promise<void> {
  // Get all users with scores for this type
  const users = await prisma.user.findMany({
    include: {
      ARScore: type === "novel",
      RCScore: type === "rc",
    },
    where:
      type === "novel" ? { ARScore: { some: {} } } : { RCScore: { some: {} } },
  });

  // Calculate scores and sort
  const userScores = users
    .map((user) => {
      const totalScore =
        type === "novel"
          ? (user.ARScore || []).reduce((sum, score) => sum + score.score, 0)
          : (user.RCScore || []).reduce((sum, score) => sum + score.score, 0);

      return {
        id: user.id,
        score: totalScore,
      };
    })
    .sort((a, b) => b.score - a.score);

  // Find user's rank
  const userRank = userScores.findIndex((u) => u.id === userId) + 1;

  // Only notify if user is in top 5
  if (userRank > 0 && userRank <= 5) {
    await createRankingNotification({
      userId,
      type,
      rankType: "overall",
      rank: userRank,
      totalUsers: userScores.length,
      score: userScore,
    });
  }
}

/**
 * Check grade ranking and create notification if user is in top 3
 */
async function checkGradeRanking(
  userId: string,
  type: "novel" | "rc",
  userScore: number,
  userGrade: string,
): Promise<void> {
  // Get all users with the same grade and scores for this type
  const users = await prisma.user.findMany({
    include: {
      ARScore: type === "novel",
      RCScore: type === "rc",
    },
    where:
      type === "novel" ? { ARScore: { some: {} } } : { RCScore: { some: {} } },
  });

  // Filter by grade and calculate scores
  const gradeUsers = users
    .filter((user) => calculateGrade(user.birthday) === userGrade)
    .map((user) => {
      const totalScore =
        type === "novel"
          ? (user.ARScore || []).reduce((sum, score) => sum + score.score, 0)
          : (user.RCScore || []).reduce((sum, score) => sum + score.score, 0);

      return {
        id: user.id,
        score: totalScore,
      };
    })
    .sort((a, b) => b.score - a.score);

  // Find user's rank within their grade
  const userRank = gradeUsers.findIndex((u) => u.id === userId) + 1;

  // Only notify if user is in top 3 of their grade
  if (userRank > 0 && userRank <= 3) {
    await createRankingNotification({
      userId,
      type,
      rankType: "grade",
      rank: userRank,
      totalUsers: gradeUsers.length,
      score: userScore,
      grade: userGrade,
    });
  }
}

/**
 * Create a ranking notification
 */
async function createRankingNotification(
  data: RankingNotificationData,
): Promise<void> {
  const { userId, type, rankType, rank, score, grade } = data;

  // Check if we already sent this notification recently (within last 24 hours)
  const recentNotification = await prisma.notification.findFirst({
    where: {
      userId,
      title: {
        contains: rankType === "overall" ? "Overall Ranking" : "Grade Ranking",
      },
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      },
    },
  });

  if (recentNotification) {
    return; // Don't spam notifications
  }

  // Create notification title and message
  const typeLabel = type === "novel" ? "Novel" : "Reading Comprehension";
  const rankEmoji =
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "🏆";

  let title: string;
  let message: string;

  if (rankType === "overall") {
    title = `${rankEmoji} Overall Ranking Achievement!`;
    message = `Congratulations! You've reached #${rank} in the overall ${typeLabel} leaderboard with ${score.toLocaleString()} points!`;
  } else {
    title = `${rankEmoji} Grade Ranking Achievement!`;
    message = `Amazing! You're #${rank} in ${grade} grade for ${typeLabel} with ${score.toLocaleString()} points!`;
  }

  // Create the notification
  await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      isRead: false,
    },
  });
}
