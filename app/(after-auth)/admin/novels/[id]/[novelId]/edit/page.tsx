import { notFound } from "next/navigation";
import React from "react";

import { prisma } from "@/prisma/prisma-client";

import NovelEditForm from "./components/novel-edit-form";

interface PageProps {
  params: Promise<{
    id: string;
    novelId: string;
  }>;
}

const NovelEditPage = async ({ params }: PageProps) => {
  const { id, novelId } = await params;

  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    include: {
      AR: true,
      novelChapters: {
        orderBy: { orderNumber: "asc" },
        include: {
          novelQuestionSet: {
            include: {
              novelQuestions: {
                orderBy: { orderNumber: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!novel || novel.ARId !== id) {
    notFound();
  }

  const arLevels = await prisma.aR.findMany({
    orderBy: { level: "asc" },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <NovelEditForm novel={novel} arLevels={arLevels} />
    </div>
  );
};

export default NovelEditPage;
