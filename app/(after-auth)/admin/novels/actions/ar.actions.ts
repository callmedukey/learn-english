"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/prisma/prisma-client";

export const updateARAction = async (formData: FormData) => {
  const arId = formData.get("arId") as string;
  const level = formData.get("level") as string;
  const score = formData.get("score") as string;
  const stars = parseInt(formData.get("stars") as string);
  const description = formData.get("description") as string;

  if (!arId || !level || !score || !description || isNaN(stars)) {
    return {
      error: "All fields are required and stars must be a valid number",
    };
  }

  if (stars < 1 || stars > 5) {
    return { error: "Stars must be between 1 and 5" };
  }

  try {
    const existingAR = await prisma.aR.findUnique({
      where: { id: arId },
    });

    if (!existingAR) {
      return { error: "AR record not found" };
    }

    const updatedAR = await prisma.aR.update({
      where: { id: arId },
      data: {
        level,
        score,
        stars,
        description,
      },
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

  if (!level || !score || isNaN(stars)) {
    return {
      error: "All fields are required and stars must be a valid number",
    };
  }

  if (stars < 1 || stars > 5) {
    return { error: "Stars must be between 1 and 5" };
  }

  try {
    await prisma.aR.create({
      data: {
        level,
        score,
        stars,
        description,
      },
    });

    revalidatePath("/admin/novels");

    return { success: true };
  } catch (error) {
    console.error("Failed to create AR record:", error);
    return { error: "Failed to create AR record. Please try again." };
  }
};
