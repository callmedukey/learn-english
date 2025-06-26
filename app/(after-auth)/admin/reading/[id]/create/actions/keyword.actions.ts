"use server";

import { revalidatePath } from "next/cache";

import { LevelType } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";
import { getCurrentKoreaYearMonth } from "@/server-queries/medals";

export const createKeywordAction = async (formData: FormData) => {
  const rcLevelId = formData.get("rcLevelId") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const isFree = formData.get("isFree") === "on";
  const hidden = formData.get("hidden") === "on";
  const comingSoon = formData.get("comingSoon") === "on";
  const includeInChallenge = formData.get("includeInChallenge") === "true";

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
        comingSoon,
      },
    });

    let addedToChallenge = false;

    // Add to current month's challenge if requested
    if (includeInChallenge) {
      try {
        const { year, month } = getCurrentKoreaYearMonth();
        
        // Find the current month's challenge for this RC level
        const currentChallenge = await prisma.monthlyChallenge.findUnique({
          where: {
            year_month_levelType_levelId: {
              year,
              month,
              levelType: LevelType.RC,
              levelId: rcLevelId,
            },
          },
        });

        if (currentChallenge) {
          // Add the keyword to the challenge
          await prisma.monthlyChallenge.update({
            where: { id: currentChallenge.id },
            data: {
              keywordIds: {
                push: keyword.id,
              },
            },
          });
          addedToChallenge = true;
        }
      } catch (error) {
        console.error("Failed to add keyword to challenge:", error);
      }
    }

    revalidatePath(`/admin/reading/${rcLevelId}`);
    revalidatePath("/admin/reading");
    revalidatePath("/challenges");

    return { success: true, keyword, addedToChallenge };
  } catch (error) {
    console.error("Failed to create keyword:", error);
    return {
      error: "Failed to create keyword. Please try again.",
    };
  }
};
