"use server";

import { prisma } from "@/prisma/prisma-client";

export async function getUserSettings(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      nickname: true,
      email: true,
      gender: true,
      accounts: {
        select: {
          provider: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check if user has OAuth accounts (not a credentials-only user)
  const hasOAuthAccounts = user.accounts.length > 0;

  // Check if gender can be edited (null or "Other")
  const canEditGender = user.gender === null || user.gender === "Other";

  return {
    nickname: user.nickname,
    email: user.email,
    gender: user.gender,
    isCredentialsUser: !hasOAuthAccounts,
    canEditGender,
  };
}
