"use server";

import { revalidatePath } from "next/cache";

import { createMonthlyChallenge } from "@/actions/admin/medals";
import { auth } from "@/auth";
import { canDeleteARLevel } from "@/lib/utils/permissions";
import { LevelType, Role } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export const updateARAction = async (formData: FormData) => {
  const arId = formData.get("arId") as string;
  const level = formData.get("level") as string;
  const score = formData.get("score") as string;
  const stars = parseFloat(formData.get("stars") as string);
  const description = formData.get("description") as string;
  const relevantGrade = formData.get("relevantGrade") as string;
  const fontSize = formData.get("fontSize") as string;

  if (!arId || !level || !score || !description || isNaN(stars)) {
    return {
      error: "All fields are required and stars must be a valid number",
    };
  }

  if (stars < 0 || stars > 5 || (stars * 2) % 1 !== 0) {
    return { error: "Stars must be between 0 and 5 in 0.5 increments" };
  }

  // Validate fontSize enum value
  if (fontSize && !["BASE", "LARGE", "XLARGE"].includes(fontSize)) {
    return { error: "Invalid font size selected" };
  }

  try {
    const existingAR = await prisma.aR.findUnique({
      where: { id: arId },
      include: { ARSettings: true },
    });

    if (!existingAR) {
      return { error: "AR record not found" };
    }

    // Update AR and ARSettings in a transaction
    const updatedAR = await prisma.$transaction(async (tx) => {
      const ar = await tx.aR.update({
        where: { id: arId },
        data: {
          level,
          score,
          stars,
          description,
          relevantGrade,
        },
      });

      // Update or create ARSettings
      if (fontSize) {
        if (existingAR.ARSettings) {
          await tx.aRSettings.update({
            where: { ARId: arId },
            data: {
              fontSize: fontSize as "BASE" | "LARGE" | "XLARGE",
            },
          });
        } else {
          await tx.aRSettings.create({
            data: {
              ARId: arId,
              fontSize: fontSize as "BASE" | "LARGE" | "XLARGE",
            },
          });
        }
      }

      return ar;
    });

    revalidatePath("/admin/novels");
    return { success: true, ar: updatedAR };
  } catch (error) {
    console.error("Failed to update AR record:", error);
    return {
      error: "Failed to update AR record. Please try again.",
    };
  }
};

export const deleteARAction = async (arId: string) => {
  if (!arId) {
    return { error: "AR ID is required" };
  }

  // Check permissions
  const session = await auth();
  if (!canDeleteARLevel(session?.user?.role as Role | undefined)) {
    return { error: "You don't have permission to delete AR levels" };
  }

  try {
    const existingAR = await prisma.aR.findUnique({
      where: { id: arId },
      include: {
        _count: {
          select: {
            novels: true,
          },
        },
      },
    });

    if (!existingAR) {
      return { error: "AR record not found" };
    }

    if (existingAR._count.novels > 0) {
      return {
        error: `Cannot delete AR record. It has ${existingAR._count.novels} associated novel(s). Please remove the novels first.`,
      };
    }

    await prisma.aR.delete({
      where: { id: arId },
    });

    revalidatePath("/admin/novels");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete AR record:", error);
    return {
      error: "Failed to delete AR record. Please try again.",
    };
  }
};

export const createARAction = async (formData: FormData) => {
  const level = formData.get("level") as string;
  const score = formData.get("score") as string;
  const stars = parseFloat(formData.get("stars") as string);
  const description = formData.get("description") as string;
  const relevantGrade = formData.get("relevantGrade") as string;
  const fontSize = formData.get("fontSize") as string;

  // Challenge settings
  const createChallenge = formData.get("createChallenge") === "true";
  const challengeYear = parseInt(formData.get("challengeYear") as string);
  const challengeMonth = parseInt(formData.get("challengeMonth") as string);
  const challengeScheduledActive = formData.get("challengeScheduledActive") === "true";

  if (!level || !score || isNaN(stars)) {
    return {
      error: "All fields are required and stars must be a valid number",
    };
  }

  if (stars < 0 || stars > 5 || (stars * 2) % 1 !== 0) {
    return { error: "Stars must be between 0 and 5 in 0.5 increments" };
  }

  // Validate fontSize enum value
  if (!["BASE", "LARGE", "XLARGE"].includes(fontSize)) {
    return { error: "Invalid font size selected" };
  }

  try {
    // Create AR record with ARSettings in a transaction
    const ar = await prisma.$transaction(async (tx) => {
      const newAR = await tx.aR.create({
        data: {
          level,
          score,
          stars,
          description,
          relevantGrade,
        },
      });

      // Create ARSettings for this AR
      await tx.aRSettings.create({
        data: {
          ARId: newAR.id,
          fontSize: fontSize as "BASE" | "LARGE" | "XLARGE",
        },
      });

      return newAR;
    });

    let challengeCreated = false;

    // Create monthly challenge if requested
    if (createChallenge && !isNaN(challengeYear) && !isNaN(challengeMonth)) {
      try {
        await createMonthlyChallenge({
          year: challengeYear,
          month: challengeMonth,
          levelType: LevelType.AR,
          levelId: ar.id,
          novelIds: [], // Start with empty novels, they'll be added later
          scheduledActive: challengeScheduledActive,
        });
        challengeCreated = true;
      } catch (error) {
        console.error("Failed to create monthly challenge:", error);
        // Don't fail the whole operation if challenge creation fails
      }
    }

    revalidatePath("/admin/novels");

    return { success: true, challengeCreated, arId: ar.id };
  } catch (error) {
    console.error("Failed to create AR record:", error);
    return { error: "Failed to create AR record. Please try again." };
  }
};

export const getARChallenges = async (arId: string) => {
  try {
    const challenges = await prisma.monthlyChallenge.findMany({
      where: {
        levelType: LevelType.AR,
        levelId: arId,
      },
      orderBy: [
        { year: "desc" },
        { month: "desc" },
      ],
      include: {
        _count: {
          select: {
            medals: true,
          },
        },
      },
    });

    return challenges;
  } catch (error) {
    console.error("Failed to fetch AR challenges:", error);
    return [];
  }
};
