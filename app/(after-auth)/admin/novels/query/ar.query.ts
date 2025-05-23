"server only";

import { AR } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export interface ARData extends AR {
  novelCount: number;
}

export const getARs = async (): Promise<ARData[]> => {
  const arsFromDb = await prisma.aR.findMany({
    include: {
      _count: {
        select: {
          novels: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const arsWithNovelCount: ARData[] = arsFromDb.map((ar) => ({
    ...ar,
    novelCount: ar._count.novels,
  }));

  return arsWithNovelCount;
};
