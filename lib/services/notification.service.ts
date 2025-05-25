"server only";

import calculateGrade from "@/lib/utils/calculate-grade";
import { NotificationType } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

/**
 * Check if user has achieved a new ranking and create notification if needed
 */
export async function checkAndCreateRankingNotification(
  userId: string,
  type: "novel" | "rc",
): Promise<void> {
  try {
    const notificationType =
      type === "novel" ? NotificationType.NOVEL : NotificationType.RC;

    // Check for recent notification of the same type
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentNotification = await prisma.notification.findFirst({
      where: {
        userId,
        type: notificationType,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (recentNotification) {
      console.log(
        `Notification of type ${type} already sent to user ${userId} within the last hour.`,
      );
      return; // Don't send another notification
    }

    // Fetch user with potentially ARScore or RCScore based on type
    // The query in the original file was slightly different here, let's ensure we get the specific scores needed.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ARScore: type === "novel" ? { select: { score: true } } : false,
        RCScore: type === "rc" ? { select: { score: true } } : false,
        // birthday is needed for calculateGrade, ensure it's always fetched if not already part of User model by default
        // Assuming birthday is part of the base User model from context
      },
    });

    if (!user) {
      console.error(`User not found: ${userId}`);
      return;
    }

    const userGrade = calculateGrade(user.birthday);
    let currentUserScore = 0;
    if (type === "novel" && user.ARScore) {
      currentUserScore = user.ARScore.reduce(
        (sum: number, score: { score: number }) => sum + score.score,
        0,
      );
    } else if (type === "rc" && user.RCScore) {
      currentUserScore = user.RCScore.reduce(
        (sum: number, score: { score: number }) => sum + score.score,
        0,
      );
    }

    // Check overall ranking
    await checkOverallRanking(userId, type, currentUserScore, notificationType);

    // Check grade ranking if user has a valid grade
    if (userGrade && userGrade !== "N/A") {
      await checkGradeRanking(
        userId,
        type,
        currentUserScore,
        userGrade,
        notificationType,
      );
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
  currentUserScore: number,
  notificationType: NotificationType,
): Promise<void> {
  const rankLimit = 5; // Notify if in top 5, aligning with leaderboard queries

  const allUsersWithScores = await prisma.user.findMany({
    select: {
      id: true,
      ARScore: { select: { score: true } }, // Select both, let logic decide
      RCScore: { select: { score: true } }, // Select both, let logic decide
    },
    // No WHERE clause here to get all users, then filter/calculate scores
  });

  const userScores = allUsersWithScores
    .map((u) => {
      let totalScore = 0;
      if (type === "novel" && u.ARScore) {
        totalScore = u.ARScore.reduce(
          (sum: number, score: { score: number }) => sum + score.score,
          0,
        );
      } else if (type === "rc" && u.RCScore) {
        totalScore = u.RCScore.reduce(
          (sum: number, score: { score: number }) => sum + score.score,
          0,
        );
      }
      return {
        id: u.id,
        score: totalScore,
      };
    })
    .sort((a, b) => b.score - a.score);

  const userRank = userScores.findIndex((u) => u.id === userId) + 1;

  if (userRank > 0 && userRank <= rankLimit) {
    const title = `Top ${userRank} Overall ${type === "novel" ? "Novel" : "RC"} Ranking`;
    const message = `Congratulations! You've reached Top ${userRank} in Overall ${
      type === "novel" ? "Novel" : "RC"
    } ranking with ${currentUserScore} points.`;

    const existingNotificationForRank = await prisma.notification.findFirst({
      where: {
        userId,
        type: notificationType,
        title: title,
      },
    });

    if (!existingNotificationForRank) {
      await createNotification(userId, title, message, notificationType);
    } else {
      console.log(
        `Notification for ${title} already exists for user ${userId}.`,
      );
    }
  }
}

/**
 * Check grade ranking and create notification if user is in top 3
 */
async function checkGradeRanking(
  userId: string,
  type: "novel" | "rc",
  currentUserScore: number,
  grade: string,
  notificationType: NotificationType,
): Promise<void> {
  const rankLimit = 5; // Notify if in top 5

  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      birthday: true,
      ARScore: { select: { score: true } }, // Select both
      RCScore: { select: { score: true } }, // Select both
    },
    // No WHERE clause here to get all users, then filter
  });

  const usersInGradeWithScores = allUsers
    .filter((u) => calculateGrade(u.birthday) === grade)
    .map((u) => {
      let totalScore = 0;
      if (type === "novel" && u.ARScore) {
        totalScore = u.ARScore.reduce(
          (sum: number, score: { score: number }) => sum + score.score,
          0,
        );
      } else if (type === "rc" && u.RCScore) {
        totalScore = u.RCScore.reduce(
          (sum: number, score: { score: number }) => sum + score.score,
          0,
        );
      }
      return {
        id: u.id,
        score: totalScore,
      };
    })
    .sort((a, b) => b.score - a.score);

  const userRankInGrade =
    usersInGradeWithScores.findIndex((u) => u.id === userId) + 1;

  if (userRankInGrade > 0 && userRankInGrade <= rankLimit) {
    const title = `Top ${userRankInGrade} ${grade} ${type === "novel" ? "Novel" : "RC"} Ranking`;
    const message = `Congratulations! You've reached Top ${userRankInGrade} in ${grade} ${
      type === "novel" ? "Novel" : "RC"
    } ranking with ${currentUserScore} points.`;

    const existingNotificationForRank = await prisma.notification.findFirst({
      where: {
        userId,
        type: notificationType,
        title: title,
      },
    });

    if (!existingNotificationForRank) {
      await createNotification(userId, title, message, notificationType);
    } else {
      console.log(
        `Notification for ${title} already exists for user ${userId}.`,
      );
    }
  }
}

/**
 * Create a ranking notification
 */
async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
) {
  await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
    },
  });
}
