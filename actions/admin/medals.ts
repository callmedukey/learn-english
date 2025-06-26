"use server";

import path from "path";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { LevelType, MedalType } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";
import {
  getCurrentKoreaYearMonth,
  getMonthBoundariesInUTC,
} from "@/server-queries/medals";

async function checkAdminAuth() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createMonthlyChallenge({
  year,
  month,
  levelType,
  levelId,
  novelIds = [],
  keywordIds = [],
  scheduledActive = false,
}: {
  year: number;
  month: number;
  levelType: LevelType;
  levelId: string;
  novelIds?: string[];
  keywordIds?: string[];
  scheduledActive?: boolean;
}) {
  await checkAdminAuth();

  try {
    // Check if challenge already exists
    const existing = await prisma.monthlyChallenge.findUnique({
      where: {
        year_month_levelType_levelId: {
          year,
          month,
          levelType,
          levelId,
        },
      },
    });

    if (existing) {
      throw new Error("Challenge already exists for this month and level");
    }

    // Get month boundaries in UTC based on Korea timezone
    const { startDate, endDate } = getMonthBoundariesInUTC(year, month);

    // Determine if this is a future challenge
    const { year: currentYear, month: currentMonth } = getCurrentKoreaYearMonth();
    const isFuture = year > currentYear || (year === currentYear && month > currentMonth);
    
    const challenge = await prisma.monthlyChallenge.create({
      data: {
        year,
        month,
        levelType,
        levelId,
        novelIds: levelType === "AR" ? novelIds : [],
        keywordIds: levelType === "RC" ? keywordIds : [],
        startDate,
        endDate,
        active: isFuture ? false : true, // Future challenges start inactive
        scheduledActive: isFuture ? scheduledActive : false, // Only relevant for future challenges
      },
    });

    revalidatePath("/admin/challenges/challenges");
    revalidatePath("/challenges");

    return challenge;
  } catch (error) {
    console.error("Failed to create monthly challenge:", error);
    throw error;
  }
}

export async function updateChallenge({
  id,
  novelIds,
  keywordIds,
  active,
  scheduledActive,
  startDate,
  endDate,
}: {
  id: string;
  novelIds?: string[];
  keywordIds?: string[];
  active?: boolean;
  scheduledActive?: boolean;
  startDate?: Date;
  endDate?: Date;
}) {
  await checkAdminAuth();

  try {
    const challenge = await prisma.monthlyChallenge.update({
      where: { id },
      data: {
        ...(novelIds !== undefined && { novelIds }),
        ...(keywordIds !== undefined && { keywordIds }),
        ...(active !== undefined && { active }),
        ...(scheduledActive !== undefined && { scheduledActive }),
        ...(startDate !== undefined && { startDate }),
        ...(endDate !== undefined && { endDate }),
      },
    });

    revalidatePath("/admin/challenges/challenges");
    revalidatePath("/challenges");

    return challenge;
  } catch (error) {
    console.error("Failed to update challenge:", error);
    throw error;
  }
}

export async function uploadMedalImages({
  levelType,
  levelId,
  medalType,
  imageUrl,
  width,
  height,
}: {
  levelType: LevelType;
  levelId: string;
  medalType: MedalType;
  imageUrl: string;
  width: number;
  height: number;
}) {
  await checkAdminAuth();

  try {
    const medalImage = await prisma.medalImage.upsert({
      where: {
        levelType_levelId_medalType: {
          levelType,
          levelId,
          medalType,
        },
      },
      update: { imageUrl, width, height },
      create: {
        levelType,
        levelId,
        medalType,
        imageUrl,
        width,
        height,
      },
    });

    revalidatePath("/admin/challenges/images");

    return medalImage;
  } catch (error) {
    console.error("Failed to upload medal image:", error);
    throw error;
  }
}

export async function deleteMedalImage({
  levelType,
  levelId,
  medalType,
}: {
  levelType: LevelType;
  levelId: string;
  medalType: MedalType;
}) {
  await checkAdminAuth();

  try {
    // Find the medal image to get the file path
    const medalImage = await prisma.medalImage.findUnique({
      where: {
        levelType_levelId_medalType: {
          levelType,
          levelId,
          medalType,
        },
      },
    });

    if (!medalImage) {
      throw new Error("Medal image not found");
    }

    // Delete from database
    await prisma.medalImage.delete({
      where: {
        levelType_levelId_medalType: {
          levelType,
          levelId,
          medalType,
        },
      },
    });

    // Delete the file from filesystem
    if (medalImage.imageUrl) {
      const fileName = medalImage.imageUrl.split('/').pop();
      if (fileName) {
        const filePath = path.join(process.cwd(), "public", "uploads", "medals", fileName);
        try {
          const { unlink } = await import("fs/promises");
          await unlink(filePath);
          console.log(`Deleted medal image file: ${filePath}`);
        } catch (error) {
          console.error(`Failed to delete medal image file: ${filePath}`, error);
        }
      }
    }

    revalidatePath("/admin/challenges/images");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete medal image:", error);
    throw error;
  }
}

export async function checkAndActivateScheduledChallenges() {
  // Note: This function doesn't require admin auth since it can be called automatically
  try {
    const { year, month } = getCurrentKoreaYearMonth();
    
    // Find scheduled challenges for current month that are not yet active
    const toActivate = await prisma.monthlyChallenge.findMany({
      where: {
        year,
        month,
        scheduledActive: true,
        active: false
      }
    });
    
    // Activate them
    if (toActivate.length > 0) {
      await prisma.monthlyChallenge.updateMany({
        where: { 
          id: { in: toActivate.map(c => c.id) } 
        },
        data: { 
          active: true 
        }
      });
      
      console.log(`Activated ${toActivate.length} scheduled challenges for ${year}-${month}`);
      
      // Revalidate relevant paths
      revalidatePath("/admin/challenges/challenges");
      revalidatePath("/dashboard");
    }
    
    return toActivate.length;
  } catch (error) {
    console.error("Failed to check and activate scheduled challenges:", error);
    throw error;
  }
}

