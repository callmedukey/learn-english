import { toZonedTime } from "date-fns-tz";
import { NextResponse } from "next/server";

import { APP_TIMEZONE } from "@/lib/constants/timezone";
import { verifyMobileToken } from "@/lib/mobile-auth";
import calculateBirthYearRangeForGrade from "@/lib/utils/calculate-birth-year-range";
import calculateGrade from "@/lib/utils/calculate-grade";
import { prisma } from "@/prisma/prisma-client";

// Helper function to format grade for display
function formatGradeForDisplay(grade: string): string {
  if (grade.startsWith("Grade ")) {
    return grade.replace("Grade ", "");
  }
  if (grade === "Below Grade 1" || grade === "Kinder") {
    return "K";
  }
  return grade;
}

// Types for the response
interface UserRankingData {
  rank: number;
  total: number;
  percentile: number;
}

interface MedalCounts {
  gold: number;
  silver: number;
  bronze: number;
}

export async function GET(request: Request) {
  const payload = await verifyMobileToken(request);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.sub;

  try {
    // Get user data for grade calculation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        birthday: true,
        nickname: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userGrade = calculateGrade(user.birthday);
    const formattedGrade = formatGradeForDisplay(userGrade);

    // Fetch all data in parallel
    const [
      continueLearningData,
      allTimeStatsData,
      monthlyStatsData,
      leaderboardsData,
      medalsData,
    ] = await Promise.all([
      getContinueLearningData(userId),
      getAllTimeStats(userId, userGrade),
      getMonthlyStats(userId, userGrade),
      getLeaderboards(userId, userGrade),
      getMedalCounts(userId),
    ]);

    return NextResponse.json({
      user: {
        nickname: user.nickname || user.name || "Anonymous",
        grade: formattedGrade,
      },
      continueLearning: continueLearningData,
      allTimeStats: {
        ...allTimeStatsData,
        medals: medalsData,
      },
      monthlyStats: monthlyStatsData,
      leaderboards: leaderboardsData,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

// Continue Learning Data
async function getContinueLearningData(userId: string) {
  // Get the most recent novel progress
  const latestNovelProgress = await prisma.novelQuestionCompleted.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      novelQuestion: {
        include: {
          novelQuestionSet: {
            include: {
              novelChapter: {
                include: {
                  novel: {
                    include: {
                      AR: true,
                      novelChapters: {
                        select: { id: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  let novelProgress = null;

  if (
    latestNovelProgress?.novelQuestion.novelQuestionSet?.novelChapter?.novel
  ) {
    const novel =
      latestNovelProgress.novelQuestion.novelQuestionSet.novelChapter.novel;

    // Get all completed chapters for this novel by this user
    const completedChapters = await prisma.novelQuestionCompleted.findMany({
      where: {
        userId,
        novelQuestion: {
          novelQuestionSet: {
            novelChapter: {
              novelId: novel.id,
            },
          },
        },
      },
      include: {
        novelQuestion: {
          include: {
            novelQuestionSet: {
              select: { novelChapterId: true },
            },
          },
        },
      },
    });

    const uniqueCompletedChapterIds = new Set(
      completedChapters
        .map((c) => c.novelQuestion.novelQuestionSet?.novelChapterId)
        .filter(Boolean)
    );

    const totalChapters = novel.novelChapters.length;
    const completedChaptersCount = uniqueCompletedChapterIds.size;
    const progressPercentage =
      totalChapters > 0
        ? Math.round((completedChaptersCount / totalChapters) * 100)
        : 0;

    novelProgress = {
      id: novel.id,
      title: novel.title,
      arLevel: novel.AR?.level || null,
      completedChapters: completedChaptersCount,
      totalChapters,
      progress: progressPercentage,
      lastUpdated: latestNovelProgress.updatedAt,
    };
  }

  // Get the most recent RC progress
  const latestRCProgress = await prisma.rCQuestionCompleted.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      RCQuestion: {
        include: {
          RCQuestionSet: {
            include: {
              RCKeyword: {
                include: {
                  RCLevel: true,
                },
              },
            },
          },
        },
      },
    },
  });

  let rcProgress = null;

  if (latestRCProgress?.RCQuestion.RCQuestionSet?.RCKeyword) {
    const keyword = latestRCProgress.RCQuestion.RCQuestionSet.RCKeyword;

    rcProgress = {
      keywordId: keyword.id,
      keyword: keyword.name,
      rcLevelId: keyword.RCLevel.id,
      rcLevel: keyword.RCLevel.level,
      lastPracticed: latestRCProgress.updatedAt,
    };
  }

  return { novel: novelProgress, rc: rcProgress };
}

// All-Time Stats
async function getAllTimeStats(userId: string, userGrade: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      ARScore: true,
      RCScore: true,
      bpaScores: true,
    },
  });

  if (!user) {
    return {
      novelScore: 0,
      rcScore: 0,
      totalScore: 0,
      overallRank: { rank: 0, total: 0, percentile: 0 },
      gradeRank: { rank: 0, total: 0, percentile: 0, grade: userGrade },
    };
  }

  const novelScore =
    user.ARScore.reduce((sum, s) => sum + s.score, 0) +
    user.bpaScores.reduce((sum, s) => sum + s.score, 0);
  const rcScore = user.RCScore.reduce((sum, s) => sum + s.score, 0);
  const totalScore = novelScore + rcScore;

  // Get rankings
  const rankingData = await getUserRankingData(userId, userGrade);

  return {
    novelScore,
    rcScore,
    totalScore,
    overallRank: rankingData.overall,
    gradeRank: { ...rankingData.grade, grade: formatGradeForDisplay(userGrade) },
  };
}

// Monthly Stats
async function getMonthlyStats(userId: string, userGrade: string) {
  const now = new Date();
  const koreaTime = toZonedTime(now, APP_TIMEZONE);
  const year = koreaTime.getFullYear();
  const month = koreaTime.getMonth() + 1;

  const [arScores, rcScores, bpaScores] = await Promise.all([
    prisma.monthlyARScore.aggregate({
      where: { userId, year, month },
      _sum: { score: true },
    }),
    prisma.monthlyRCScore.aggregate({
      where: { userId, year, month },
      _sum: { score: true },
    }),
    prisma.monthlyBPAScore.aggregate({
      where: { userId, year, month },
      _sum: { score: true },
    }),
  ]);

  const novelScore =
    (arScores._sum.score || 0) + (bpaScores._sum.score || 0);
  const rcScore = rcScores._sum.score || 0;
  const totalScore = novelScore + rcScore;

  // Get monthly rankings
  const rankingData = await getMonthlyUserRankingData(userId, userGrade);

  return {
    novelScore,
    rcScore,
    totalScore,
    overallRank: rankingData.overall,
    gradeRank: { ...rankingData.grade, grade: formatGradeForDisplay(userGrade) },
  };
}

// User Ranking Helper
async function getUserRankingData(
  userId: string,
  userGrade: string
): Promise<{
  overall: UserRankingData;
  grade: UserRankingData;
}> {
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      birthday: true,
      ARScore: { select: { score: true } },
      RCScore: { select: { score: true } },
      bpaScores: { select: { score: true } },
    },
  });

  const userScores = allUsers.map((u) => {
    const totalScore =
      u.ARScore.reduce((sum, s) => sum + s.score, 0) +
      u.RCScore.reduce((sum, s) => sum + s.score, 0) +
      u.bpaScores.reduce((sum, s) => sum + s.score, 0);
    return {
      id: u.id,
      score: totalScore,
      grade: calculateGrade(u.birthday),
    };
  });

  const activeUsers = userScores.filter((u) => u.score > 0);
  activeUsers.sort((a, b) => b.score - a.score);

  const userRank = activeUsers.findIndex((u) => u.id === userId) + 1;
  const totalUsers = activeUsers.length;

  // Calculate overall percentile
  let overallPercentile = 0;
  if (totalUsers > 0 && userRank > 0) {
    if (totalUsers === 1) {
      overallPercentile = 1;
    } else {
      const usersBelowYou = totalUsers - userRank;
      const percentageBelowYou = (usersBelowYou / (totalUsers - 1)) * 100;
      overallPercentile = Math.max(1, Math.ceil(100 - percentageBelowYou));
    }
  }

  // Grade ranking
  const activeUsersInGrade = activeUsers.filter((u) => u.grade === userGrade);
  const userRankInGrade =
    activeUsersInGrade.findIndex((u) => u.id === userId) + 1;
  const usersInGrade = activeUsersInGrade.length;

  let gradePercentile = 0;
  if (usersInGrade > 0 && userRankInGrade > 0) {
    if (usersInGrade === 1) {
      gradePercentile = 1;
    } else {
      const usersBelowYouInGrade = usersInGrade - userRankInGrade;
      const percentageBelowYouInGrade =
        (usersBelowYouInGrade / (usersInGrade - 1)) * 100;
      gradePercentile = Math.max(1, Math.ceil(100 - percentageBelowYouInGrade));
    }
  }

  return {
    overall: { rank: userRank, total: totalUsers, percentile: overallPercentile },
    grade: { rank: userRankInGrade, total: usersInGrade, percentile: gradePercentile },
  };
}

// Monthly User Ranking Helper
async function getMonthlyUserRankingData(
  userId: string,
  userGrade: string
): Promise<{
  overall: UserRankingData;
  grade: UserRankingData;
}> {
  const now = new Date();
  const koreaTime = toZonedTime(now, APP_TIMEZONE);
  const year = koreaTime.getFullYear();
  const month = koreaTime.getMonth() + 1;

  const [allARScores, allRCScores, allBPAScores] = await Promise.all([
    prisma.monthlyARScore.groupBy({
      by: ["userId"],
      where: { year, month },
      _sum: { score: true },
    }),
    prisma.monthlyRCScore.groupBy({
      by: ["userId"],
      where: { year, month },
      _sum: { score: true },
    }),
    prisma.monthlyBPAScore.groupBy({
      by: ["userId"],
      where: { year, month },
      _sum: { score: true },
    }),
  ]);

  const arScoreMap = new Map(
    allARScores.map((s) => [s.userId, s._sum.score || 0])
  );
  const rcScoreMap = new Map(
    allRCScores.map((s) => [s.userId, s._sum.score || 0])
  );
  const bpaScoreMap = new Map(
    allBPAScores.map((s) => [s.userId, s._sum.score || 0])
  );

  const allUserIds = Array.from(
    new Set([
      ...allARScores.map((s) => s.userId),
      ...allRCScores.map((s) => s.userId),
      ...allBPAScores.map((s) => s.userId),
    ])
  );

  const allUsers = await prisma.user.findMany({
    where: { id: { in: allUserIds } },
    select: { id: true, birthday: true },
  });

  const userScores = allUsers.map((u) => {
    const totalScore =
      (arScoreMap.get(u.id) || 0) +
      (rcScoreMap.get(u.id) || 0) +
      (bpaScoreMap.get(u.id) || 0);
    return {
      id: u.id,
      score: totalScore,
      grade: calculateGrade(u.birthday),
    };
  });

  const activeUsers = userScores.filter((u) => u.score > 0);
  activeUsers.sort((a, b) => b.score - a.score);

  const userRank = activeUsers.findIndex((u) => u.id === userId) + 1;
  const totalUsers = activeUsers.length;

  let overallPercentile = 0;
  if (totalUsers > 0 && userRank > 0) {
    if (totalUsers === 1) {
      overallPercentile = 1;
    } else {
      const usersBelowYou = totalUsers - userRank;
      const percentageBelowYou = (usersBelowYou / (totalUsers - 1)) * 100;
      overallPercentile = Math.max(1, Math.ceil(100 - percentageBelowYou));
    }
  }

  const activeUsersInGrade = activeUsers.filter((u) => u.grade === userGrade);
  const userRankInGrade =
    activeUsersInGrade.findIndex((u) => u.id === userId) + 1;
  const usersInGrade = activeUsersInGrade.length;

  let gradePercentile = 0;
  if (usersInGrade > 0 && userRankInGrade > 0) {
    if (usersInGrade === 1) {
      gradePercentile = 1;
    } else {
      const usersBelowYouInGrade = usersInGrade - userRankInGrade;
      const percentageBelowYouInGrade =
        (usersBelowYouInGrade / (usersInGrade - 1)) * 100;
      gradePercentile = Math.max(1, Math.ceil(100 - percentageBelowYouInGrade));
    }
  }

  return {
    overall: { rank: userRank, total: totalUsers, percentile: overallPercentile },
    grade: { rank: userRankInGrade, total: usersInGrade, percentile: gradePercentile },
  };
}

// Medal Counts
async function getMedalCounts(userId: string): Promise<MedalCounts> {
  const medals = await prisma.medal.groupBy({
    by: ["medalType"],
    where: { userId },
    _count: { medalType: true },
  });

  const counts: MedalCounts = { gold: 0, silver: 0, bronze: 0 };

  medals.forEach((medal) => {
    switch (medal.medalType) {
      case "GOLD":
        counts.gold = medal._count.medalType;
        break;
      case "SILVER":
        counts.silver = medal._count.medalType;
        break;
      case "BRONZE":
        counts.bronze = medal._count.medalType;
        break;
    }
  });

  return counts;
}

// Leaderboards
async function getLeaderboards(userId: string, userGrade: string) {
  const [
    allTimeOverall,
    allTimeGrade,
    monthlyOverall,
    monthlyGrade,
  ] = await Promise.all([
    getAllTimeOverallRankings(),
    getAllTimeGradeRankings(userId, userGrade),
    getMonthlyOverallRankings(),
    getMonthlyGradeRankings(userId, userGrade),
  ]);

  return {
    allTime: {
      overall: allTimeOverall,
      grade: allTimeGrade,
    },
    monthly: {
      overall: monthlyOverall,
      grade: monthlyGrade,
    },
  };
}

// All-Time Overall Rankings (Total, Novel, RC)
async function getAllTimeOverallRankings() {
  const users = await prisma.user.findMany({
    include: {
      ARScore: true,
      RCScore: true,
      bpaScores: true,
      country: { include: { countryIcon: true } },
      campus: { select: { name: true } },
    },
    where: {
      OR: [
        { ARScore: { some: {} } },
        { RCScore: { some: {} } },
        { bpaScores: { some: {} } },
      ],
    },
  });

  const userScores = users.map((user) => {
    const arScore = user.ARScore.reduce((sum, s) => sum + s.score, 0);
    const bpaScore = user.bpaScores.reduce((sum, s) => sum + s.score, 0);
    const rcScore = user.RCScore.reduce((sum, s) => sum + s.score, 0);
    const novelScore = arScore + bpaScore;
    const totalScore = novelScore + rcScore;
    const grade = calculateGrade(user.birthday);

    return {
      id: user.id,
      nickname: user.nickname || user.name || "Anonymous",
      grade: formatGradeForDisplay(grade),
      novelScore,
      rcScore,
      totalScore,
      countryIcon: user.country?.countryIcon?.iconUrl,
      campusId: user.campusId,
      campusName: user.campus?.name,
    };
  });

  // Total rankings
  const totalRankings = userScores
    .filter((u) => u.totalScore > 0)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10)
    .map((u, i) => ({
      id: u.id,
      nickname: u.nickname,
      grade: u.grade,
      score: u.totalScore,
      countryIcon: u.countryIcon,
      rank: i + 1,
      campusId: u.campusId,
      campusName: u.campusName,
    }));

  // Novel rankings
  const novelRankings = userScores
    .filter((u) => u.novelScore > 0)
    .sort((a, b) => b.novelScore - a.novelScore)
    .slice(0, 10)
    .map((u, i) => ({
      id: u.id,
      nickname: u.nickname,
      grade: u.grade,
      score: u.novelScore,
      countryIcon: u.countryIcon,
      rank: i + 1,
      campusId: u.campusId,
      campusName: u.campusName,
    }));

  // RC rankings
  const rcRankings = userScores
    .filter((u) => u.rcScore > 0)
    .sort((a, b) => b.rcScore - a.rcScore)
    .slice(0, 10)
    .map((u, i) => ({
      id: u.id,
      nickname: u.nickname,
      grade: u.grade,
      score: u.rcScore,
      countryIcon: u.countryIcon,
      rank: i + 1,
      campusId: u.campusId,
      campusName: u.campusName,
    }));

  return { total: totalRankings, novel: novelRankings, rc: rcRankings };
}

// All-Time Grade Rankings
async function getAllTimeGradeRankings(userId: string, userGrade: string) {
  if (!userGrade || userGrade === "N/A") {
    return { total: [], novel: [], rc: [] };
  }

  const birthYearRange = calculateBirthYearRangeForGrade(userGrade);
  const whereClause: any = {
    OR: [
      { ARScore: { some: {} } },
      { RCScore: { some: {} } },
      { bpaScores: { some: {} } },
    ],
  };

  if (birthYearRange) {
    whereClause.birthday = {
      gte: new Date(`${birthYearRange.minYear}-01-01`),
      lte: new Date(`${birthYearRange.maxYear}-12-31`),
    };
  }

  const users = await prisma.user.findMany({
    include: {
      ARScore: true,
      RCScore: true,
      bpaScores: true,
      country: { include: { countryIcon: true } },
      campus: { select: { name: true } },
    },
    where: whereClause,
  });

  const userScores = users.map((user) => {
    const arScore = user.ARScore.reduce((sum, s) => sum + s.score, 0);
    const bpaScore = user.bpaScores.reduce((sum, s) => sum + s.score, 0);
    const rcScore = user.RCScore.reduce((sum, s) => sum + s.score, 0);
    const novelScore = arScore + bpaScore;
    const totalScore = novelScore + rcScore;
    const grade = calculateGrade(user.birthday);

    return {
      id: user.id,
      nickname: user.nickname || user.name || "Anonymous",
      grade: formatGradeForDisplay(grade),
      novelScore,
      rcScore,
      totalScore,
      countryIcon: user.country?.countryIcon?.iconUrl,
      campusId: user.campusId,
      campusName: user.campus?.name,
    };
  });

  const totalRankings = userScores
    .filter((u) => u.totalScore > 0)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10)
    .map((u, i) => ({
      id: u.id,
      nickname: u.nickname,
      grade: u.grade,
      score: u.totalScore,
      countryIcon: u.countryIcon,
      rank: i + 1,
      campusId: u.campusId,
      campusName: u.campusName,
    }));

  const novelRankings = userScores
    .filter((u) => u.novelScore > 0)
    .sort((a, b) => b.novelScore - a.novelScore)
    .slice(0, 10)
    .map((u, i) => ({
      id: u.id,
      nickname: u.nickname,
      grade: u.grade,
      score: u.novelScore,
      countryIcon: u.countryIcon,
      rank: i + 1,
      campusId: u.campusId,
      campusName: u.campusName,
    }));

  const rcRankings = userScores
    .filter((u) => u.rcScore > 0)
    .sort((a, b) => b.rcScore - a.rcScore)
    .slice(0, 10)
    .map((u, i) => ({
      id: u.id,
      nickname: u.nickname,
      grade: u.grade,
      score: u.rcScore,
      countryIcon: u.countryIcon,
      rank: i + 1,
      campusId: u.campusId,
      campusName: u.campusName,
    }));

  return { total: totalRankings, novel: novelRankings, rc: rcRankings };
}

// Monthly Overall Rankings
async function getMonthlyOverallRankings() {
  const now = new Date();
  const koreaTime = toZonedTime(now, APP_TIMEZONE);
  const year = koreaTime.getFullYear();
  const month = koreaTime.getMonth() + 1;

  const [arScores, rcScores, bpaScores] = await Promise.all([
    prisma.monthlyARScore.groupBy({
      by: ["userId"],
      where: { year, month },
      _sum: { score: true },
    }),
    prisma.monthlyRCScore.groupBy({
      by: ["userId"],
      where: { year, month },
      _sum: { score: true },
    }),
    prisma.monthlyBPAScore.groupBy({
      by: ["userId"],
      where: { year, month },
      _sum: { score: true },
    }),
  ]);

  const arScoreMap = new Map(arScores.map((s) => [s.userId, s._sum.score || 0]));
  const rcScoreMap = new Map(rcScores.map((s) => [s.userId, s._sum.score || 0]));
  const bpaScoreMap = new Map(bpaScores.map((s) => [s.userId, s._sum.score || 0]));

  const allUserIds = Array.from(
    new Set([
      ...arScores.map((s) => s.userId),
      ...rcScores.map((s) => s.userId),
      ...bpaScores.map((s) => s.userId),
    ])
  );

  const users = await prisma.user.findMany({
    where: { id: { in: allUserIds } },
    include: {
      country: { include: { countryIcon: true } },
      campus: { select: { name: true } },
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  const userScores = allUserIds.map((userId) => {
    const user = userMap.get(userId);
    const arScore = arScoreMap.get(userId) || 0;
    const bpaScore = bpaScoreMap.get(userId) || 0;
    const rcScore = rcScoreMap.get(userId) || 0;
    const novelScore = arScore + bpaScore;
    const totalScore = novelScore + rcScore;
    const grade = user ? calculateGrade(user.birthday) : "N/A";

    return {
      id: userId,
      nickname: user?.nickname || user?.name || "Anonymous",
      grade: formatGradeForDisplay(grade),
      novelScore,
      rcScore,
      totalScore,
      countryIcon: user?.country?.countryIcon?.iconUrl,
      campusId: user?.campusId,
      campusName: user?.campus?.name,
    };
  });

  const totalRankings = userScores
    .filter((u) => u.totalScore > 0)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10)
    .map((u, i) => ({
      id: u.id,
      nickname: u.nickname,
      grade: u.grade,
      score: u.totalScore,
      countryIcon: u.countryIcon,
      rank: i + 1,
      campusId: u.campusId,
      campusName: u.campusName,
    }));

  const novelRankings = userScores
    .filter((u) => u.novelScore > 0)
    .sort((a, b) => b.novelScore - a.novelScore)
    .slice(0, 10)
    .map((u, i) => ({
      id: u.id,
      nickname: u.nickname,
      grade: u.grade,
      score: u.novelScore,
      countryIcon: u.countryIcon,
      rank: i + 1,
      campusId: u.campusId,
      campusName: u.campusName,
    }));

  const rcRankings = userScores
    .filter((u) => u.rcScore > 0)
    .sort((a, b) => b.rcScore - a.rcScore)
    .slice(0, 10)
    .map((u, i) => ({
      id: u.id,
      nickname: u.nickname,
      grade: u.grade,
      score: u.rcScore,
      countryIcon: u.countryIcon,
      rank: i + 1,
      campusId: u.campusId,
      campusName: u.campusName,
    }));

  return { total: totalRankings, novel: novelRankings, rc: rcRankings };
}

// Monthly Grade Rankings
async function getMonthlyGradeRankings(userId: string, userGrade: string) {
  if (!userGrade || userGrade === "N/A") {
    return { total: [], novel: [], rc: [] };
  }

  const now = new Date();
  const koreaTime = toZonedTime(now, APP_TIMEZONE);
  const year = koreaTime.getFullYear();
  const month = koreaTime.getMonth() + 1;

  const users = await prisma.user.findMany({
    include: {
      monthlyARScores: { where: { year, month } },
      monthlyRCScores: { where: { year, month } },
      monthlyBPAScores: { where: { year, month } },
      country: { include: { countryIcon: true } },
      campus: { select: { name: true } },
    },
    where: {
      OR: [
        { monthlyARScores: { some: { year, month, score: { gt: 0 } } } },
        { monthlyRCScores: { some: { year, month, score: { gt: 0 } } } },
        { monthlyBPAScores: { some: { year, month, score: { gt: 0 } } } },
      ],
    },
  });

  // Filter by grade
  const usersInGrade = users.filter(
    (user) => calculateGrade(user.birthday) === userGrade
  );

  const userScores = usersInGrade.map((user) => {
    const arScore = user.monthlyARScores.reduce((sum, s) => sum + s.score, 0);
    const bpaScore = user.monthlyBPAScores.reduce((sum, s) => sum + s.score, 0);
    const rcScore = user.monthlyRCScores.reduce((sum, s) => sum + s.score, 0);
    const novelScore = arScore + bpaScore;
    const totalScore = novelScore + rcScore;
    const grade = calculateGrade(user.birthday);

    return {
      id: user.id,
      nickname: user.nickname || user.name || "Anonymous",
      grade: formatGradeForDisplay(grade),
      novelScore,
      rcScore,
      totalScore,
      countryIcon: user.country?.countryIcon?.iconUrl,
      campusId: user.campusId,
      campusName: user.campus?.name,
    };
  });

  const totalRankings = userScores
    .filter((u) => u.totalScore > 0)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10)
    .map((u, i) => ({
      id: u.id,
      nickname: u.nickname,
      grade: u.grade,
      score: u.totalScore,
      countryIcon: u.countryIcon,
      rank: i + 1,
      campusId: u.campusId,
      campusName: u.campusName,
    }));

  const novelRankings = userScores
    .filter((u) => u.novelScore > 0)
    .sort((a, b) => b.novelScore - a.novelScore)
    .slice(0, 10)
    .map((u, i) => ({
      id: u.id,
      nickname: u.nickname,
      grade: u.grade,
      score: u.novelScore,
      countryIcon: u.countryIcon,
      rank: i + 1,
      campusId: u.campusId,
      campusName: u.campusName,
    }));

  const rcRankings = userScores
    .filter((u) => u.rcScore > 0)
    .sort((a, b) => b.rcScore - a.rcScore)
    .slice(0, 10)
    .map((u, i) => ({
      id: u.id,
      nickname: u.nickname,
      grade: u.grade,
      score: u.rcScore,
      countryIcon: u.countryIcon,
      rank: i + 1,
      campusId: u.campusId,
      campusName: u.campusName,
    }));

  return { total: totalRankings, novel: novelRankings, rc: rcRankings };
}
