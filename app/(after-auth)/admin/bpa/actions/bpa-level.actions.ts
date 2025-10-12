"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { canCreateBPALevel, canDeleteBPALevel } from "@/lib/utils/permissions";
import { Role } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export const createBPALevelAction = async (formData: FormData) => {
  const session = await auth();
  if (!canCreateBPALevel(session?.user?.role as Role | undefined)) {
    return { error: "You don't have permission to create BPA levels" };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const stars = parseInt(formData.get("stars") as string);
  const orderNumber = parseInt(formData.get("orderNumber") as string);
  const fontSize = formData.get("fontSize") as string;

  if (!name || isNaN(stars) || isNaN(orderNumber)) {
    return {
      error: "Name, stars, and order number are required",
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
    // Check if orderNumber is already taken
    const existingLevel = await prisma.bPALevel.findUnique({
      where: { orderNumber },
    });

    if (existingLevel) {
      return { error: `Order number ${orderNumber} is already in use` };
    }

    // Check if name is already taken
    const existingName = await prisma.bPALevel.findUnique({
      where: { name },
    });

    if (existingName) {
      return { error: `Level name "${name}" already exists` };
    }

    // Create BPA level with settings in a transaction
    const level = await prisma.$transaction(async (tx) => {
      const newLevel = await tx.bPALevel.create({
        data: {
          name,
          description,
          stars,
          orderNumber,
        },
      });

      // Create BPALevelSettings for this level
      await tx.bPALevelSettings.create({
        data: {
          bpaLevelId: newLevel.id,
          fontSize: fontSize as "BASE" | "LARGE" | "XLARGE",
        },
      });

      return newLevel;
    });

    revalidatePath("/admin/bpa");
    return { success: true, levelId: level.id };
  } catch (error) {
    console.error("Failed to create BPA level:", error);
    return { error: "Failed to create BPA level. Please try again." };
  }
};

export const updateBPALevelAction = async (formData: FormData) => {
  const session = await auth();
  if (!canCreateBPALevel(session?.user?.role as Role | undefined)) {
    return { error: "You don't have permission to update BPA levels" };
  }

  const levelId = formData.get("levelId") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const stars = parseInt(formData.get("stars") as string);
  const orderNumber = parseInt(formData.get("orderNumber") as string);
  const fontSize = formData.get("fontSize") as string;

  if (!levelId || !name || isNaN(stars) || isNaN(orderNumber)) {
    return {
      error: "Level ID, name, stars, and order number are required",
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
    const existingLevel = await prisma.bPALevel.findUnique({
      where: { id: levelId },
      include: { bpaLevelSettings: true },
    });

    if (!existingLevel) {
      return { error: "BPA level not found" };
    }

    // Check if orderNumber is already taken by a different level
    const orderNumberConflict = await prisma.bPALevel.findFirst({
      where: {
        orderNumber,
        id: { not: levelId },
      },
    });

    if (orderNumberConflict) {
      return { error: `Order number ${orderNumber} is already in use` };
    }

    // Check if name is already taken by a different level
    const nameConflict = await prisma.bPALevel.findFirst({
      where: {
        name,
        id: { not: levelId },
      },
    });

    if (nameConflict) {
      return { error: `Level name "${name}" already exists` };
    }

    // Update level and settings in a transaction
    const updatedLevel = await prisma.$transaction(async (tx) => {
      const level = await tx.bPALevel.update({
        where: { id: levelId },
        data: {
          name,
          description,
          stars,
          orderNumber,
        },
      });

      // Update or create BPALevelSettings
      if (fontSize) {
        if (existingLevel.bpaLevelSettings) {
          await tx.bPALevelSettings.update({
            where: { bpaLevelId: levelId },
            data: {
              fontSize: fontSize as "BASE" | "LARGE" | "XLARGE",
            },
          });
        } else {
          await tx.bPALevelSettings.create({
            data: {
              bpaLevelId: levelId,
              fontSize: fontSize as "BASE" | "LARGE" | "XLARGE",
            },
          });
        }
      }

      return level;
    });

    revalidatePath("/admin/bpa");
    return { success: true, level: updatedLevel };
  } catch (error) {
    console.error("Failed to update BPA level:", error);
    return { error: "Failed to update BPA level. Please try again." };
  }
};

export const deleteBPALevelAction = async (levelId: string) => {
  const session = await auth();
  if (!canDeleteBPALevel(session?.user?.role as Role | undefined)) {
    return { error: "You don't have permission to delete BPA levels" };
  }

  if (!levelId) {
    return { error: "Level ID is required" };
  }

  try {
    const existingLevel = await prisma.bPALevel.findUnique({
      where: { id: levelId },
      include: {
        _count: {
          select: {
            novels: true,
          },
        },
      },
    });

    if (!existingLevel) {
      return { error: "BPA level not found" };
    }

    if (existingLevel._count.novels > 0) {
      return {
        error: `Cannot delete level. It has ${existingLevel._count.novels} associated novel(s). Please remove the novels first.`,
      };
    }

    await prisma.bPALevel.delete({
      where: { id: levelId },
    });

    revalidatePath("/admin/bpa");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete BPA level:", error);
    return {
      error: "Failed to delete BPA level. Please try again.",
    };
  }
};
