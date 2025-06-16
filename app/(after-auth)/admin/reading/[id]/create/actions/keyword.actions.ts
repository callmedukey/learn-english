"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/prisma/prisma-client";

export const createKeywordAction = async (formData: FormData) => {
  const rcLevelId = formData.get("rcLevelId") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const isFree = formData.get("isFree") === "on";
  const hidden = formData.get("hidden") === "on";

  if (!rcLevelId || !name) {
    return {
      error: "RC Level ID and keyword name are required",
    };
  }

  try {
    // Check if RC level exists
    const rcLevel = await prisma.rCLevel.findUnique({
      where: { id: rcLevelId },
    });

    if (!rcLevel) {
      return { error: "RC level not found" };
    }

    // Check if keyword with same name already exists for this level
    const existingKeyword = await prisma.rCKeyword.findFirst({
      where: {
        rcLevelId,
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existingKeyword) {
      return {
        error: "A keyword with this name already exists for this level",
      };
    }

    // Create the keyword
    const keyword = await prisma.rCKeyword.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        rcLevelId,
        isFree,
        hidden,
      },
    });

    revalidatePath(`/admin/reading/${rcLevelId}`);
    revalidatePath("/admin/reading");

    return { success: true, keyword };
  } catch (error) {
    console.error("Failed to create keyword:", error);
    return {
      error: "Failed to create keyword. Please try again.",
    };
  }
};
