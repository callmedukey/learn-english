import { redirect } from "next/navigation";
import React from "react";

import { getRCSettings } from "@/app/(after-auth)/admin/settings/queries/settings-queries";
import { auth } from "@/auth";
import { Role } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

import EnhancedKeywordCreationWorkflow from "./components/enhanced-keyword-creation-workflow";

interface CreateKeywordPageProps {
  params: Promise<{ id: string }>;
}

const CreateKeywordPage = async ({ params }: CreateKeywordPageProps) => {
  const { id } = await params;
  const session = await auth();
  
  // ADMIN and SUB_ADMIN can create keywords
  if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.SUB_ADMIN)) {
    redirect(`/admin/reading/${id}`);
  }

  // Fetch level-specific settings first
  const levelSettings = await prisma.rCLevelSettings.findUnique({
    where: { RCLevelId: id },
  });

  // If level-specific settings exist, use them; otherwise fall back to global settings
  let defaultTimer = 60;
  let defaultScore = 1;
  
  if (levelSettings) {
    defaultTimer = levelSettings.defaultTimer;
    defaultScore = levelSettings.defaultScore;
  } else {
    // Fall back to global RC settings
    const rcSettings = await getRCSettings();
    if (rcSettings) {
      defaultTimer = rcSettings.defaultTimer || 60;
      defaultScore = rcSettings.defaultScore || 1;
    }
  }
  
  return (
    <div className="px-1 py-6">
      <h1 className="mb-6 text-center text-2xl font-bold">Create Keyword</h1>
      <EnhancedKeywordCreationWorkflow 
        rcLevelId={id} 
        defaultTimer={defaultTimer}
        defaultScore={defaultScore}
      />
    </div>
  );
};

export default CreateKeywordPage;
