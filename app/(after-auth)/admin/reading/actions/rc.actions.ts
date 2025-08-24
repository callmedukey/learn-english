"use server";

import { revalidatePath } from "next/cache";

import { createMonthlyChallenge } from "@/actions/admin/medals";
import { auth } from "@/auth";
import { canDeleteRCLevel } from "@/lib/utils/permissions";
import { LevelType, Role } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export const updateRCLevelAction = async (formData: FormData) => {
  const rcLevelId = formData.get("rcLevelId") as string;
  const level = formData.get("level") as string;
  const relevantGrade = formData.get("relevantGrade") as string;
  const stars = parseInt(formData.get("stars") as string);
  const numberOfQuestions = parseInt(
    formData.get("numberOfQuestions") as string,
  );
  const description = formData.get("description") as string;
  const fontSize = formData.get("fontSize") as string;

  if (
    !rcLevelId ||
    !level ||
    !relevantGrade ||
    isNaN(stars) ||
    isNaN(numberOfQuestions)
  ) {
    return {
      error: "All required fields must be provided and numbers must be valid",
    };
  }

  if (stars < 1 || stars > 5) {
    return { error: "Stars must be between 1 and 5" };
  }

  if (numberOfQuestions < 1) {
    return { error: "Number of questions must be at least 1" };
  }

  // Validate fontSize enum value
  if (fontSize && !["BASE", "LARGE", "XLARGE"].includes(fontSize)) {
    return { error: "Invalid font size selected" };
  }

  try {
    const existingRCLevel = await prisma.rCLevel.findUnique({
      where: { id: rcLevelId },
      include: { RCLevelSettings: true },
    });

    if (!existingRCLevel) {
      return { error: "RC level not found" };
    }

    // Update RCLevel and RCLevelSettings in a transaction
    const updatedRCLevel = await prisma.$transaction(async (tx) => {
      const rcLevel = await tx.rCLevel.update({
        where: { id: rcLevelId },
        data: {
          level,
          relevantGrade,
          stars,
          numberOfQuestions,
          description: description || null,
        },
      });

      // Update or create RCLevelSettings
      if (fontSize) {
        if (existingRCLevel.RCLevelSettings) {
          await tx.rCLevelSettings.update({
            where: { RCLevelId: rcLevelId },
            data: {
              fontSize: fontSize as "BASE" | "LARGE" | "XLARGE",
            },
          });
        } else {
          await tx.rCLevelSettings.create({
            data: {
              RCLevelId: rcLevelId,
              fontSize: fontSize as "BASE" | "LARGE" | "XLARGE",
            },
          });
        }
      }

      return rcLevel;
    });

    revalidatePath("/admin/reading");
    return { success: true, rcLevel: updatedRCLevel };
  } catch (error) {
    console.error("Failed to update RC level:", error);
    return {
      error: "Failed to update RC level. Please try again.",
    };
  }
};

export const deleteRCLevelAction = async (rcLevelId: string) => {
  if (!rcLevelId) {
    return { error: "RC level ID is required" };
  }

  // Check permissions
  const session = await auth();
  if (!canDeleteRCLevel(session?.user?.role as Role | undefined)) {
    return { error: "You don't have permission to delete RC levels" };
  }

  try {
    const existingRCLevel = await prisma.rCLevel.findUnique({
      where: { id: rcLevelId },
      include: {
        _count: {
          select: {
            RCKeyword: true,
          },
        },
      },
    });

    if (!existingRCLevel) {
      return { error: "RC level not found" };
    }

    if (existingRCLevel._count.RCKeyword > 0) {
      return {
        error: `Cannot delete RC level. It has ${existingRCLevel._count.RCKeyword} associated keyword(s). Please remove the keywords first.`,
      };
    }

    await prisma.rCLevel.delete({
      where: { id: rcLevelId },
    });

    revalidatePath("/admin/reading");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete RC level:", error);
    return {
      error: "Failed to delete RC level. Please try again.",
    };
  }
};

export const createRCLevelAction = async (formData: FormData) => {
  const level = formData.get("level") as string;
  const relevantGrade = formData.get("relevantGrade") as string;
  const stars = parseInt(formData.get("stars") as string);
  const numberOfQuestions = parseInt(
    formData.get("numberOfQuestions") as string,
  );
  const description = formData.get("description") as string;
  const fontSize = formData.get("fontSize") as string;

  // Challenge settings
  const createChallenge = formData.get("createChallenge") === "true";
  const challengeYear = parseInt(formData.get("challengeYear") as string);
  const challengeMonth = parseInt(formData.get("challengeMonth") as string);
  const challengeScheduledActive = formData.get("challengeScheduledActive") === "true";

  if (!level || !relevantGrade || isNaN(stars) || isNaN(numberOfQuestions)) {
    return {
      error: "All required fields must be provided and numbers must be valid",
    };
  }

  if (stars < 1 || stars > 5) {
    return { error: "Stars must be between 1 and 5" };
  }

  if (numberOfQuestions < 1) {
    return { error: "Number of questions must be at least 1" };
  }

  // Validate fontSize enum value
  if (!["BASE", "LARGE", "XLARGE"].includes(fontSize)) {
    return { error: "Invalid font size selected" };
  }

  try {
    // Create RCLevel with RCLevelSettings in a transaction
    const rcLevel = await prisma.$transaction(async (tx) => {
      const newRCLevel = await tx.rCLevel.create({
        data: {
          level,
          relevantGrade,
          stars,
          numberOfQuestions,
          description: description || null,
        },
      });

      // Create RCLevelSettings for this RCLevel
      await tx.rCLevelSettings.create({
        data: {
          RCLevelId: newRCLevel.id,
          fontSize: fontSize as "BASE" | "LARGE" | "XLARGE",
        },
      });

      return newRCLevel;
    });

    let challengeCreated = false;

    // Create monthly challenge if requested
    if (createChallenge && !isNaN(challengeYear) && !isNaN(challengeMonth)) {
      try {
        await createMonthlyChallenge({
          year: challengeYear,
          month: challengeMonth,
          levelType: LevelType.RC,
          levelId: rcLevel.id,
          keywordIds: [], // Start with empty keywords, they'll be added later
          scheduledActive: challengeScheduledActive,
        });
        challengeCreated = true;
      } catch (error) {
        console.error("Failed to create monthly challenge:", error);
        // Don't fail the whole operation if challenge creation fails
      }
    }

    revalidatePath("/admin/reading");

    return { success: true, challengeCreated, rcLevelId: rcLevel.id };
  } catch (error) {
    console.error("Failed to create RC level:", error);
    return { error: "Failed to create RC level. Please try again." };
  }
};

export const getRCChallenges = async (rcLevelId: string) => {
  try {
    const challenges = await prisma.monthlyChallenge.findMany({
      where: {
        levelType: LevelType.RC,
        levelId: rcLevelId,
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
    console.error("Failed to fetch RC challenges:", error);
    return [];
  }
};
