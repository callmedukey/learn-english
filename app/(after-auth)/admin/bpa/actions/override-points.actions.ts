"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/prisma/prisma-client";

interface OverridePointsInput {
  bpaLevelId: string;
  points: number;
}

interface OverridePointsResult {
  success?: boolean;
  updatedCount?: number;
  error?: string;
}

export async function overrideAllBPAQuestionPointsAction(
  input: OverridePointsInput
): Promise<OverridePointsResult> {
  try {
    const { bpaLevelId, points } = input;

    // Validate input
    if (!bpaLevelId || !points || points <= 0) {
      return {
        error: "Invalid input: BPA Level ID and positive points required",
      };
    }

    // Verify the BPA level exists
    const bpaLevel = await prisma.bPALevel.findUnique({
      where: { id: bpaLevelId },
      include: {
        novels: {
          include: {
            chapters: {
              include: {
                questionSet: {
                  include: {
                    questions: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!bpaLevel) {
      return { error: "BPA Level not found" };
    }

    // Collect all question IDs for this BPA level
    const questionIds: string[] = [];
    for (const novel of bpaLevel.novels) {
      for (const chapter of novel.chapters) {
        if (chapter.questionSet) {
          for (const question of chapter.questionSet.questions) {
            questionIds.push(question.id);
          }
        }
      }
    }

    if (questionIds.length === 0) {
      return { error: "No questions found for this level" };
    }

    // Update all questions with the new point value
    const result = await prisma.bPAQuestion.updateMany({
      where: {
        id: {
          in: questionIds,
        },
      },
      data: {
        score: points,
      },
    });

    // Revalidate the admin BPA page to show updated data
    revalidatePath("/admin/bpa");

    return {
      success: true,
      updatedCount: result.count,
    };
  } catch (error) {
    console.error("Error overriding BPA question points:", error);
    return {
      error: "Failed to override question points. Please try again.",
    };
  }
}
