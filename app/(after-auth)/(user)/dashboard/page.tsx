import { redirect } from "next/navigation";
import React from "react";

import { auth } from "@/auth";
import { ContinueLearning } from "@/components/continue-learning/continue-learning";
import { Leaderboard } from "@/components/leaderboard/leaderboard";
import calculateGrade from "@/lib/utils/calculate-grade";
import { Role } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

const page = async () => {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === Role.ADMIN) {
    redirect("/admin");
  }

  // Get user's birthday to calculate grade
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { birthday: true },
  });

  const userGrade = calculateGrade(user?.birthday || null);

  return (
    <div className="py-16">
      <Leaderboard userId={session.user.id} userGrade={userGrade} />
      <ContinueLearning userId={session.user.id} />
    </div>
  );
};

export default page;
