"server only";

import { RCLevel, RCLevelSettings } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export interface RCLevelData extends RCLevel {
  keywordCount: number;
  questionCount: number;
  freeKeywordCount: number;
  RCLevelSettings: RCLevelSettings | null;
}

export const getRCLevels = async (): Promise<RCLevelData[]> => {
  const rcLevelsFromDb = await prisma.rCLevel.findMany({
    include: {
      _count: {
        select: {
          RCKeyword: true,
        },
      },
      RCLevelSettings: true,
      RCKeyword: {
        include: {
          RCQuestionSet: {
            include: {
              _count: {
                select: {
                  RCQuestion: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      stars: "asc",
    },
  });

  const rcLevelsWithCounts: RCLevelData[] = rcLevelsFromDb.map((rcLevel) => {
    const questionCount = rcLevel.RCKeyword.reduce((total, keyword) => {
      return total + (keyword.RCQuestionSet?._count.RCQuestion || 0);
    }, 0);

    const freeKeywordCount = rcLevel.RCKeyword.filter(
      (keyword) => keyword.isFree,
    ).length;

    return {
      ...rcLevel,
      keywordCount: rcLevel._count.RCKeyword,
      questionCount,
      freeKeywordCount,
      RCLevelSettings: rcLevel.RCLevelSettings,
    };
  });

  return rcLevelsWithCounts;
};
