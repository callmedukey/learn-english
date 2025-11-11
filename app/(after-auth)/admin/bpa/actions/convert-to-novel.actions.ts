"use server";

import { revalidatePath } from "next/cache";

import { BPAChapter, Prisma } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

interface ConversionResult {
  success: boolean;
  message?: string;
  error?: string;
  novelId?: string;
}

/**
 * Converts a BPA novel to a regular AR novel
 * Flattens the unit structure and creates sequential chapters
 */
async function convertBPANovelToARLevel(
  bpaNovelId: string,
  targetARId: string
): Promise<ConversionResult> {
  try {
    // Fetch the source BPA novel with all nested data
    const sourceBPANovel = await prisma.bPANovel.findUnique({
      where: { id: bpaNovelId },
      include: {
        bpaLevel: true,
        units: {
          orderBy: { orderNumber: "asc" },
          include: {
            chapters: {
              orderBy: { orderNumber: "asc" },
              include: {
                questionSet: {
                  include: {
                    questions: {
                      orderBy: { orderNumber: "asc" },
                    },
                  },
                },
              },
            },
          },
        },
        // Also include legacy chapters without units
        chapters: {
          where: { unitId: null },
          orderBy: { orderNumber: "asc" },
          include: {
            questionSet: {
              include: {
                questions: {
                  orderBy: { orderNumber: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!sourceBPANovel) {
      return {
        success: false,
        error: "BPA novel not found",
      };
    }

    // Validate target AR level exists
    const targetAR = await prisma.aR.findUnique({
      where: { id: targetARId },
    });

    if (!targetAR) {
      return {
        success: false,
        error: "Target AR level not found",
      };
    }

    // Flatten chapters from all units
    const allChapters: (BPAChapter & {
      questionSet: {
        id: string;
        instructions: string;
        active: boolean;
        questions: {
          id: string;
          orderNumber: number;
          question: string;
          choices: string[];
          answer: string;
          explanation: string;
          score: number;
          timeLimit: number;
        }[];
      } | null;
    })[] = [];

    // Add chapters from units (ordered by unit order, then chapter order)
    for (const unit of sourceBPANovel.units) {
      allChapters.push(...unit.chapters);
    }

    // Add legacy chapters (without units)
    allChapters.push(...sourceBPANovel.chapters);

    // Sort chapters by orderNumber to ensure correct sequencing
    allChapters.sort((a, b) => a.orderNumber - b.orderNumber);

    // Create the new Novel with all nested data in a transaction
    const newNovel = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create the novel
      const novel = await tx.novel.create({
        data: {
          title: sourceBPANovel.title,
          description: sourceBPANovel.description,
          hidden: sourceBPANovel.hidden,
          comingSoon: sourceBPANovel.comingSoon,
          locked: sourceBPANovel.locked,
          ARId: targetARId,
        },
      });

      // Create all chapters with sequential ordering
      let chapterOrderNumber = 1;
      for (const sourceChapter of allChapters) {
        // Create the chapter
        const newChapter = await tx.novelChapter.create({
          data: {
            novelId: novel.id,
            orderNumber: chapterOrderNumber,
            title: sourceChapter.title,
            description: sourceChapter.description,
            isFree: sourceChapter.isFree,
          },
        });

        // Create question set if it exists
        if (sourceChapter.questionSet) {
          const newQuestionSet = await tx.novelQuestionSet.create({
            data: {
              novelChapterId: newChapter.id,
              instructions: sourceChapter.questionSet.instructions,
              active: sourceChapter.questionSet.active,
            },
          });

          // Create all questions
          for (const sourceQuestion of sourceChapter.questionSet.questions) {
            await tx.novelQuestion.create({
              data: {
                novelQuestionSetId: newQuestionSet.id,
                orderNumber: sourceQuestion.orderNumber,
                question: sourceQuestion.question,
                choices: sourceQuestion.choices,
                answer: sourceQuestion.answer,
                explanation: sourceQuestion.explanation,
                score: sourceQuestion.score,
                timeLimit: sourceQuestion.timeLimit,
              },
            });
          }
        }

        chapterOrderNumber++;
      }

      return novel;
    });

    return {
      success: true,
      message: `Successfully converted BPA novel "${sourceBPANovel.title}" to AR level`,
      novelId: newNovel.id,
    };
  } catch (error) {
    console.error("Error converting BPA novel to AR level:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Moves a BPA novel to a regular AR level
 * Converts the novel and deletes the source BPA novel
 */
export async function moveBPANovelToARLevel(
  bpaNovelId: string,
  targetARId: string
): Promise<ConversionResult> {
  try {
    // Get the BPA novel's current level for revalidation
    const sourceBPANovel = await prisma.bPANovel.findUnique({
      where: { id: bpaNovelId },
      select: { bpaLevelId: true },
    });

    if (!sourceBPANovel) {
      return {
        success: false,
        error: "BPA novel not found",
      };
    }

    // Convert the novel
    const conversionResult = await convertBPANovelToARLevel(
      bpaNovelId,
      targetARId
    );

    if (!conversionResult.success) {
      return conversionResult;
    }

    // Delete the source BPA novel (cascades to units and chapters)
    await prisma.bPANovel.delete({
      where: { id: bpaNovelId },
    });

    // Revalidate both source BPA level and target AR level pages
    revalidatePath(`/admin/bpa/${sourceBPANovel.bpaLevelId}`);
    revalidatePath(`/admin/novels/${targetARId}`);

    return {
      success: true,
      message: conversionResult.message,
      novelId: conversionResult.novelId,
    };
  } catch (error) {
    console.error("Error moving BPA novel to AR level:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Copies a BPA novel to a regular AR level
 * Converts the novel but keeps the source BPA novel
 */
export async function copyBPANovelToARLevel(
  bpaNovelId: string,
  targetARId: string
): Promise<ConversionResult> {
  try {
    // Get the BPA novel's current level for revalidation
    const sourceBPANovel = await prisma.bPANovel.findUnique({
      where: { id: bpaNovelId },
      select: { bpaLevelId: true },
    });

    if (!sourceBPANovel) {
      return {
        success: false,
        error: "BPA novel not found",
      };
    }

    // Convert the novel (source remains intact)
    const conversionResult = await convertBPANovelToARLevel(
      bpaNovelId,
      targetARId
    );

    if (!conversionResult.success) {
      return conversionResult;
    }

    // Revalidate target AR level page
    revalidatePath(`/admin/novels/${targetARId}`);

    return {
      success: true,
      message: conversionResult.message,
      novelId: conversionResult.novelId,
    };
  } catch (error) {
    console.error("Error copying BPA novel to AR level:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
