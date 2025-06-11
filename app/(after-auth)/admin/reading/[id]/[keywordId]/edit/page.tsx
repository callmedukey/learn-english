import { notFound } from "next/navigation";
import React from "react";

import { getRCSettings } from "@/app/(after-auth)/admin/settings/queries/settings-queries";
import { prisma } from "@/prisma/prisma-client";

import KeywordEditForm from "./components/keyword-edit-form";

interface PageProps {
  params: Promise<{
    id: string;
    keywordId: string;
  }>;
}

const KeywordEditPage = async ({ params }: PageProps) => {
  const { id, keywordId } = await params;

  const keyword = await prisma.rCKeyword.findUnique({
    where: { id: keywordId },
    include: {
      RCLevel: true,
      RCQuestionSet: {
        include: {
          RCQuestion: {
            orderBy: { orderNumber: "asc" },
          },
        },
      },
    },
  });

  if (!keyword || keyword.rcLevelId !== id) {
    notFound();
  }

  const rcLevels = await prisma.rCLevel.findMany({
    orderBy: { level: "asc" },
  });

  const rcSettings = await getRCSettings();

  return (
    <div className="container mx-auto px-4 py-8">
      <KeywordEditForm
        keyword={keyword}
        rcLevels={rcLevels}
        rcSettings={rcSettings}
      />
    </div>
  );
};

export default KeywordEditPage;
