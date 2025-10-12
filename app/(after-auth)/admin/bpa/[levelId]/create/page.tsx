import { redirect } from "next/navigation";
import React from "react";

import { auth } from "@/auth";
import { Role } from "@/prisma/generated/prisma";

import CreateBPANovelForm from "./components/create-bpa-novel-form";

interface CreateNovelPageProps {
  params: Promise<{ levelId: string }>;
}

const CreateBPANovelPage = async ({ params }: CreateNovelPageProps) => {
  const { levelId } = await params;
  const session = await auth();

  // ADMIN and SUB_ADMIN can create novels
  if (
    !session ||
    (session.user.role !== Role.ADMIN && session.user.role !== Role.SUB_ADMIN)
  ) {
    redirect(`/admin/bpa/${levelId}`);
  }

  return (
    <div className="px-1 py-6">
      <h1 className="mb-6 text-center text-2xl font-bold">Create BPA Novel</h1>
      <CreateBPANovelForm levelId={levelId} />
    </div>
  );
};

export default CreateBPANovelPage;
