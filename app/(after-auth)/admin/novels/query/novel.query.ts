"server only";

import { Novel } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";
import { getNovelChallenges } from "@/server-queries/admin/content-challenges";

export interface NovelData extends Novel {
  AR: {
    id: string;
    level: string;
  } | null;
  novelChapters: {
    id: string;
    title: string;
    description?: string | null;
    orderNumber: number;
    isFree: boolean;
  }[];
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

export const getNovelsByARLevel = async (id: string): Promise<NovelData[]> => {
  const novels = await prisma.novel.findMany({
    where: {
      AR: {
        id,
      },
    },
    include: {
      AR: {
        select: {
          id: true,
          level: true,
        },
      },
      novelChapters: {
        select: {
          id: true,
          title: true,
          description: true,
          orderNumber: true,
          isFree: true,
        },
        orderBy: {
          orderNumber: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get challenges for all novels
  const novelIds = novels.map(n => n.id);
  const challengeMap = await getNovelChallenges(novelIds);

  // Add challenge data to each novel
  const novelsWithChallenges = novels.map(novel => ({
    ...novel,
    challenges: challengeMap.get(novel.id) || [],
  }));

  return novelsWithChallenges;
};

export const getARByLevel = async (id: string) => {
  return await prisma.aR.findFirst({
    where: {
      id,
    },
    orderBy: {
      level: "asc",
    },
  });
};

export const searchNovels = async (searchTerm: string): Promise<NovelData[]> => {
  const novels = await prisma.novel.findMany({
    where: {
      OR: [
        {
          title: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      ],
    },
    include: {
      AR: {
        select: {
          id: true,
          level: true,
        },
      },
      novelChapters: {
        select: {
          id: true,
          title: true,
          description: true,
          orderNumber: true,
          isFree: true,
        },
        orderBy: {
          orderNumber: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get challenges for all novels
  const novelIds = novels.map(n => n.id);
  const challengeMap = await getNovelChallenges(novelIds);

  // Add challenge data to each novel
  const novelsWithChallenges = novels.map(novel => ({
    ...novel,
    challenges: challengeMap.get(novel.id) || [],
  }));

  return novelsWithChallenges;
};
