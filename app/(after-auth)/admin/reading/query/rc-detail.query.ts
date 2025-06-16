"server only";

import { RCKeyword } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

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
  return keywords;
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
