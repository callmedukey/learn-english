"server only";

import { Novel } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export interface NovelData extends Novel {
  AR: {
    id: string;
    level: string;
  } | null;
  image: {
    imageUrl: string;
    width: number;
    height: number;
  } | null;
  novelChapters: {
    id: string;
    title: string;
    description?: string | null;
    orderNumber: number;
    isFree: boolean;
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
      image: {
        select: {
          imageUrl: true,
          width: true,
          height: true,
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
  return novels;
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
