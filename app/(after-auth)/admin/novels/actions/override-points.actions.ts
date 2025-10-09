"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/prisma/prisma-client";

interface OverridePointsInput {
  arId: string;
  points: number;
}

interface OverridePointsResult {
  success?: boolean;
  updatedCount?: number;
  error?: string;
}

export async function overrideAllNovelQuestionPointsAction(
  input: OverridePointsInput
): Promise<OverridePointsResult> {
  try {
    const { arId, points } = input;

    // Validate input
    if (!arId || !points || points <= 0) {
      return { error: "Invalid input: AR ID and positive points required" };
    }

    // Verify the AR level exists
    const arLevel = await prisma.aR.findUnique({
      where: { id: arId },
      include: {
        novels: {
          include: {
            novelChapters: {
              include: {
                novelQuestionSet: {
                  include: {
                    novelQuestions: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!arLevel) {
      return { error: "AR Level not found" };
    }

    // Collect all question IDs for this AR level
    const questionIds: string[] = [];
    for (const novel of arLevel.novels) {
      for (const chapter of novel.novelChapters) {
        if (chapter.novelQuestionSet) {
          for (const question of chapter.novelQuestionSet.novelQuestions) {
            questionIds.push(question.id);
          }
        }
      }
    }

    if (questionIds.length === 0) {
      return { error: "No questions found for this level" };
    }

    // Update all questions with the new point value
    const result = await prisma.novelQuestion.updateMany({
      where: {
        id: {
          in: questionIds,
        },
      },
      data: {
        score: points,
      },
    });

    // Revalidate the admin novels page to show updated data
    revalidatePath("/admin/novels");

    return {
      success: true,
      updatedCount: result.count,
    };
  } catch (error) {
    console.error("Error overriding novel question points:", error);
    return {
      error: "Failed to override question points. Please try again.",
    };
  }
}
