import { redirect } from "next/navigation";
import React from "react";

import { getNovelSettings } from "@/app/(after-auth)/admin/settings/queries/settings-queries";
import { auth } from "@/auth";
import { Role } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

import EnhancedChapterCreationWorkflow from "./components/enhanced-chapter-creation-workflow";

interface CreateNovelPageProps {
  params: Promise<{ id: string }>;
}

const CreateNovelPage = async ({ params }: CreateNovelPageProps) => {
  const { id } = await params;
  const session = await auth();
  
  // ADMIN and SUB_ADMIN can create novels
  if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.SUB_ADMIN)) {
    redirect(`/admin/novels/${id}`);
  }

  // Fetch level-specific settings first
  const levelSettings = await prisma.aRSettings.findUnique({
    where: { ARId: id },
  });

  // If level-specific settings exist, use them; otherwise fall back to global settings
  let defaultTimer = 60;
  let defaultScore = 1;
  
  if (levelSettings) {
    defaultTimer = levelSettings.defaultTimer;
    defaultScore = levelSettings.defaultScore;
  } else {
    // Fall back to global Novel settings
    const novelSettings = await getNovelSettings();
    if (novelSettings) {
      defaultTimer = novelSettings.defaultTimer || 60;
      defaultScore = novelSettings.defaultScore || 1;
    }
  }
  
  return (
    <div className="px-1 py-6">
      <h1 className="mb-6 text-center text-2xl font-bold">Create Novel</h1>
      <EnhancedChapterCreationWorkflow 
        levelId={id} 
        defaultTimer={defaultTimer}
        defaultScore={defaultScore}
      />
    </div>
  );
};

export default CreateNovelPage;
