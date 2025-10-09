"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/prisma/prisma-client";

interface OverridePointsInput {
  rcLevelId: string;
  points: number;
}

interface OverridePointsResult {
  success?: boolean;
  updatedCount?: number;
  error?: string;
}

export async function overrideAllQuestionPointsAction(
  input: OverridePointsInput
): Promise<OverridePointsResult> {
  try {
    const { rcLevelId, points } = input;

    // Validate input
    if (!rcLevelId || !points || points <= 0) {
      return { error: "Invalid input: RC Level ID and positive points required" };
    }

    // Verify the RC level exists
    const rcLevel = await prisma.rCLevel.findUnique({
      where: { id: rcLevelId },
      include: {
        RCKeyword: {
          include: {
            RCQuestionSet: {
              include: {
                RCQuestion: true,
              },
            },
          },
        },
      },
    });

    if (!rcLevel) {
      return { error: "RC Level not found" };
    }

    // Collect all question IDs for this level
    const questionIds: string[] = [];
    for (const keyword of rcLevel.RCKeyword) {
      if (keyword.RCQuestionSet) {
        for (const question of keyword.RCQuestionSet.RCQuestion) {
          questionIds.push(question.id);
        }
      }
    }

    if (questionIds.length === 0) {
      return { error: "No questions found for this level" };
    }

    // Update all questions with the new point value
    const result = await prisma.rCQuestion.updateMany({
      where: {
        id: {
          in: questionIds,
        },
      },
      data: {
        score: points,
      },
    });

    // Revalidate the admin reading page to show updated data
    revalidatePath("/admin/reading");

    return {
      success: true,
      updatedCount: result.count,
    };
  } catch (error) {
    console.error("Error overriding question points:", error);
    return { error: "Failed to override question points. Please try again." };
  }
}
