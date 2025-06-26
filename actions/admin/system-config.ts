"use server";

import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma-client";
import { revalidatePath } from "next/cache";

/**
 * Initialize default system configurations
 */
export async function initializeSystemConfigs() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const defaultConfigs = [
    {
      key: "medal.levelChangesPerMonth",
      value: "1",
      description: "Maximum number of level changes allowed per month",
    },
    {
      key: "medal.requireApprovalForLevelChange",
      value: "false",
      description: "Whether level changes require admin approval",
    },
  ];

  for (const config of defaultConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      create: {
        ...config,
        updatedBy: session.user.id,
      },
      update: {}, // Don't update if already exists
    });
  }

  revalidatePath("/admin/challenges/config");
  return { success: true };
}