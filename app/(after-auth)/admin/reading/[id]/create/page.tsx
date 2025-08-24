import { redirect } from "next/navigation";
import React from "react";

import { getRCSettings } from "@/app/(after-auth)/admin/settings/queries/settings-queries";
import { auth } from "@/auth";
import { Role } from "@/prisma/generated/prisma";

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

  // Fetch RC settings for default timer and score
  const rcSettings = await getRCSettings();
  
  return (
    <div className="px-1 py-6">
      <h1 className="mb-6 text-center text-2xl font-bold">Create Keyword</h1>
      <EnhancedKeywordCreationWorkflow 
        rcLevelId={id} 
        defaultTimer={rcSettings?.defaultTimer || 60}
        defaultScore={rcSettings?.defaultScore || 1}
      />
    </div>
  );
};

export default CreateKeywordPage;
