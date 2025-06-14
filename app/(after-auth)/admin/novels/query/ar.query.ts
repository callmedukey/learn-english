"server only";

import { AR, ARSettings } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export interface ARData extends AR {
  novelCount: number;
  freeChapterCount: number;
  ARSettings: ARSettings | null;
}

export const getARs = async (): Promise<ARData[]> => {
  const arsFromDb = await prisma.aR.findMany({
    include: {
      _count: {
        select: {
          novels: true,
        },
      },
      ARSettings: true,
      novels: {
        include: {
          _count: {
            select: {
              novelChapters: {
                where: {
                  isFree: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      level: "asc",
    },
  });

  const arsWithNovelCount: ARData[] = arsFromDb.map((ar) => {
    const freeChapterCount = ar.novels.reduce((total, novel) => {
      return total + novel._count.novelChapters;
    }, 0);

    return {
      ...ar,
      novelCount: ar._count.novels,
      freeChapterCount,
      ARSettings: ar.ARSettings,
    };
  });

  return arsWithNovelCount;
};

// Simple query to get all AR levels for selection
export const getARLevelsForSelection = async () => {
  return await prisma.aR.findMany({
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
