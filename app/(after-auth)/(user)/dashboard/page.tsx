import { redirect } from "next/navigation";
import React from "react";

import { auth } from "@/auth";
import { ContinueLearning } from "@/components/continue-learning/continue-learning";
import { Leaderboard } from "@/components/leaderboard/leaderboard";
import { Role } from "@/prisma/generated/prisma";

const page = async () => {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === Role.ADMIN) {
    redirect("/admin");
  }

  return (
    <div className="py-16">
      <Leaderboard userId={session.user.id} />
      <ContinueLearning userId={session.user.id} />
    </div>
  );
};

export default page;
