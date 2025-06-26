import { LevelType } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

interface ContentChallenge {
  id: string;
  year: number;
  month: number;
  active: boolean;
  scheduledActive: boolean;
  _count?: {
    medals: number;
  };
}

/**
 * Get challenges for multiple novels
 * Returns a map of novelId -> challenges[]
 */
export async function getNovelChallenges(
  novelIds: string[]
): Promise<Map<string, ContentChallenge[]>> {
  if (!novelIds.length) return new Map();

  try {
    // Get all challenges that include any of the specified novels
    const challenges = await prisma.monthlyChallenge.findMany({
      where: {
        levelType: LevelType.AR,
        novelIds: {
          hasSome: novelIds,
        },
      },
      select: {
        id: true,
        year: true,
        month: true,
        active: true,
        scheduledActive: true,
        novelIds: true,
        _count: {
          select: {
            medals: true,
          },
        },
      },
    });

    // Create a map of novelId -> challenges
    const novelChallengeMap = new Map<string, ContentChallenge[]>();
    
    // Initialize map with empty arrays for all novels
    novelIds.forEach(novelId => {
      novelChallengeMap.set(novelId, []);
    });

    // Populate the map
    challenges.forEach(challenge => {
      // For each novel in this challenge
      challenge.novelIds.forEach(novelId => {
        if (novelIds.includes(novelId)) {
          const existingChallenges = novelChallengeMap.get(novelId) || [];
          existingChallenges.push({
            id: challenge.id,
            year: challenge.year,
            month: challenge.month,
            active: challenge.active,
            scheduledActive: challenge.scheduledActive,
            _count: challenge._count,
          });
          novelChallengeMap.set(novelId, existingChallenges);
        }
      });
    });

    return novelChallengeMap;
  } catch (error) {
    console.error("Error fetching novel challenges:", error);
    return new Map();
  }
}

/**
 * Get challenges for multiple keywords
 * Returns a map of keywordId -> challenges[]
 */
export async function getKeywordChallenges(
  keywordIds: string[]
): Promise<Map<string, ContentChallenge[]>> {
  if (!keywordIds.length) return new Map();

  try {
    // Get all challenges that include any of the specified keywords
    const challenges = await prisma.monthlyChallenge.findMany({
      where: {
        levelType: LevelType.RC,
        keywordIds: {
          hasSome: keywordIds,
        },
      },
      select: {
        id: true,
        year: true,
        month: true,
        active: true,
        scheduledActive: true,
        keywordIds: true,
        _count: {
          select: {
            medals: true,
          },
        },
      },
    });

    // Create a map of keywordId -> challenges
    const keywordChallengeMap = new Map<string, ContentChallenge[]>();
    
    // Initialize map with empty arrays for all keywords
    keywordIds.forEach(keywordId => {
      keywordChallengeMap.set(keywordId, []);
    });

    // Populate the map
    challenges.forEach(challenge => {
      // For each keyword in this challenge
      challenge.keywordIds.forEach(keywordId => {
        if (keywordIds.includes(keywordId)) {
          const existingChallenges = keywordChallengeMap.get(keywordId) || [];
          existingChallenges.push({
            id: challenge.id,
            year: challenge.year,
            month: challenge.month,
            active: challenge.active,
            scheduledActive: challenge.scheduledActive,
            _count: challenge._count,
          });
          keywordChallengeMap.set(keywordId, existingChallenges);
        }
      });
    });

    return keywordChallengeMap;
  } catch (error) {
    console.error("Error fetching keyword challenges:", error);
    return new Map();
  }
}

/**
 * Get a single novel's challenges
 */
export async function getSingleNovelChallenges(
  novelId: string
): Promise<ContentChallenge[]> {
  const challengeMap = await getNovelChallenges([novelId]);
  return challengeMap.get(novelId) || [];
}

/**
 * Get a single keyword's challenges
 */
export async function getSingleKeywordChallenges(
  keywordId: string
): Promise<ContentChallenge[]> {
  const challengeMap = await getKeywordChallenges([keywordId]);
  return challengeMap.get(keywordId) || [];
}