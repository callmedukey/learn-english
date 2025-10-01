"server only";

import { RCKeyword } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";
import { getKeywordChallenges } from "@/server-queries/admin/content-challenges";

export interface RCKeywordData extends RCKeyword {
  RCQuestionSet: {
    id: string;
    title: string;
    passage: string;
    RCQuestion: {
      id: string;
      question: string;
      orderNumber: number;
    }[];
  } | null;
  challenges?: {
    id: string;
    year: number;
    month: number;
    active: boolean;
    scheduledActive: boolean;
    _count?: {
      medals: number;
    };
  }[];
}

export const getRCKeywordsByLevel = async (
  id: string,
): Promise<RCKeywordData[]> => {
  const keywords = await prisma.rCKeyword.findMany({
    where: {
      rcLevelId: id,
    },
    include: {
      RCQuestionSet: {
        include: {
          RCQuestion: {
            select: {
              id: true,
              question: true,
              orderNumber: true,
            },
            orderBy: {
              orderNumber: "asc",
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get challenges for all keywords, filtered by their RC level
  const keywordIds = keywords.map(k => k.id);
  const keywordToLevelMap = new Map(keywords.map(k => [k.id, k.rcLevelId]));
  const challengeMap = await getKeywordChallenges(keywordIds, keywordToLevelMap);

  // Add challenge data to each keyword
  const keywordsWithChallenges = keywords.map(keyword => ({
    ...keyword,
    challenges: challengeMap.get(keyword.id) || [],
  }));

  return keywordsWithChallenges;
};

export const getRCLevelById = async (id: string) => {
  return await prisma.rCLevel.findFirst({
    where: {
      id,
    },
  });
};

// Simple query to get all RC levels for selection
export const getRCLevelsForSelection = async () => {
  return await prisma.rCLevel.findMany({
    select: {
      id: true,
      level: true,
      description: true,
      stars: true,
    },
    orderBy: {
      level: "asc",
    },
  });
};
