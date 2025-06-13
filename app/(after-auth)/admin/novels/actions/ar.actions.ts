"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/prisma/prisma-client";

export const updateARAction = async (formData: FormData) => {
  const arId = formData.get("arId") as string;
  const level = formData.get("level") as string;
  const score = formData.get("score") as string;
  const stars = parseInt(formData.get("stars") as string);
  const description = formData.get("description") as string;
  const relevantGrade = formData.get("relevantGrade") as string;
  const fontSize = formData.get("fontSize") as string;

  if (!arId || !level || !score || !description || isNaN(stars)) {
    return {
      error: "All fields are required and stars must be a valid number",
    };
  }

  if (stars < 1 || stars > 5) {
    return { error: "Stars must be between 1 and 5" };
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
  const stars = parseInt(formData.get("stars") as string);
  const description = formData.get("description") as string;
  const relevantGrade = formData.get("relevantGrade") as string;
  const fontSize = formData.get("fontSize") as string;

  if (!level || !score || isNaN(stars)) {
    return {
      error: "All fields are required and stars must be a valid number",
    };
  }

  if (stars < 1 || stars > 5) {
    return { error: "Stars must be between 1 and 5" };
  }

  // Validate fontSize enum value
  if (!["BASE", "LARGE", "XLARGE"].includes(fontSize)) {
    return { error: "Invalid font size selected" };
  }

  try {
    // Create AR record with ARSettings in a transaction
    await prisma.$transaction(async (tx) => {
      const ar = await tx.aR.create({
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
          ARId: ar.id,
          fontSize: fontSize as "BASE" | "LARGE" | "XLARGE",
        },
      });

      return ar;
    });

    revalidatePath("/admin/novels");

    return { success: true };
  } catch (error) {
    console.error("Failed to create AR record:", error);
    return { error: "Failed to create AR record. Please try again." };
  }
};
