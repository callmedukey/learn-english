"use server";

import { revalidatePath } from "next/cache";

import { Prisma } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

import type { ConversionFormData, ConversionResult } from "../types/convert-to-bpa.types";

/**
 * Validates the conversion form data
 */
function validateConversionData(data: ConversionFormData): { valid: boolean; error?: string } {
  // Check if units are provided
  if (!data.units || data.units.length === 0) {
    return { valid: false, error: "At least one unit must be defined" };
  }

  // Check if all units have names
  for (const unit of data.units) {
    if (!unit.name || unit.name.trim() === "") {
      return { valid: false, error: "All units must have a name" };
    }
  }

  // Collect all chapter IDs from all units
  const allChapterIds = new Set<string>();
  for (const unit of data.units) {
    for (const chapterId of unit.chapterIds) {
      if (allChapterIds.has(chapterId)) {
        return { valid: false, error: "A chapter cannot be assigned to multiple units" };
      }
      allChapterIds.add(chapterId);
    }
  }

  if (allChapterIds.size === 0) {
    return { valid: false, error: "At least one chapter must be assigned to a unit" };
  }

  return { valid: true };
}

/**
 * Converts a Novel to a BPA Novel with unit structure
 * This is the core conversion logic
 */
async function convertNovelToBPALevel(
  formData: ConversionFormData
): Promise<ConversionResult> {
  try {
    // Validate input data
    const validation = validateConversionData(formData);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Fetch the source Novel with all chapters and nested data
    const sourceNovel = await prisma.novel.findUnique({
      where: { id: formData.sourceNovelId },
      include: {
        AR: true,
        novelChapters: {
          orderBy: { orderNumber: "asc" },
          include: {
            novelQuestionSet: {
              include: {
                novelQuestions: {
                  orderBy: { orderNumber: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!sourceNovel) {
      return {
        success: false,
        error: "Source novel not found",
      };
    }

    // Validate target BPA level exists
    const targetBPALevel = await prisma.bPALevel.findUnique({
      where: { id: formData.targetBPALevelId },
    });

    if (!targetBPALevel) {
      return {
        success: false,
        error: "Target BPA level not found",
      };
    }

    // Collect all chapter IDs that should be converted
    const allChapterIdsToConvert = new Set<string>();
    for (const unit of formData.units) {
      unit.chapterIds.forEach((id) => allChapterIdsToConvert.add(id));
    }

    // Verify all specified chapters exist in the source novel
    const sourceChapterIds = new Set(sourceNovel.novelChapters.map((ch) => ch.id));
    for (const chapterId of allChapterIdsToConvert) {
      if (!sourceChapterIds.has(chapterId)) {
        return {
          success: false,
          error: `Chapter with ID ${chapterId} not found in source novel`,
        };
      }
    }

    // Create a map of chapter ID to chapter data for quick lookup
    const chapterMap = new Map(
      sourceNovel.novelChapters.map((ch) => [ch.id, ch])
    );

    // Create the new BPA Novel with units and chapters in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create the BPA novel
      const bpaNovel = await tx.bPANovel.create({
        data: {
          title: sourceNovel.title,
          description: sourceNovel.description,
          hidden: sourceNovel.hidden,
          comingSoon: sourceNovel.comingSoon,
          locked: sourceNovel.locked,
          bpaLevelId: formData.targetBPALevelId,
        },
      });

      // Create units and their chapters
      for (const unitDef of formData.units) {
        // Create the unit
        const bpaUnit = await tx.bPAUnit.create({
          data: {
            novelId: bpaNovel.id,
            name: unitDef.name,
            description: unitDef.description,
            orderNumber: unitDef.orderNumber,
          },
        });

        // Create chapters for this unit
        // Maintain the original order of chapters within the unit
        const chaptersForUnit = unitDef.chapterIds
          .map((chapterId) => chapterMap.get(chapterId))
          .filter((ch) => ch !== undefined);

        // Sort chapters by their original order number to maintain sequence
        chaptersForUnit.sort((a, b) => a.orderNumber - b.orderNumber);

        let chapterOrderInUnit = 1;
        for (const sourceChapter of chaptersForUnit) {
          // Create the BPA chapter
          const bpaChapter = await tx.bPAChapter.create({
            data: {
              novelId: bpaNovel.id,
              unitId: bpaUnit.id,
              orderNumber: chapterOrderInUnit,
              title: `Chapter ${sourceChapter.orderNumber}: ${sourceChapter.title}`,
              description: sourceChapter.description,
              isFree: sourceChapter.isFree,
            },
          });

          // Copy question set if it exists
          if (sourceChapter.novelQuestionSet) {
            const bpaQuestionSet = await tx.bPAQuestionSet.create({
              data: {
                chapterId: bpaChapter.id,
                instructions: sourceChapter.novelQuestionSet.instructions,
                active: sourceChapter.novelQuestionSet.active,
              },
            });

            // Copy all questions
            for (const sourceQuestion of sourceChapter.novelQuestionSet.novelQuestions) {
              await tx.bPAQuestion.create({
                data: {
                  questionSetId: bpaQuestionSet.id,
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

          chapterOrderInUnit++;
        }
      }

      return {
        bpaNovelId: bpaNovel.id,
        bpaLevelId: formData.targetBPALevelId,
      };
    });

    return {
      success: true,
      message: `Successfully converted novel "${sourceNovel.title}" to BPA level`,
      bpaNovelId: result.bpaNovelId,
      bpaLevelId: result.bpaLevelId,
    };
  } catch (error) {
    console.error("Error converting Novel to BPA level:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Moves a Novel to a BPA level
 * Converts the novel and deletes the source Novel
 */
export async function moveNovelToBPALevel(
  formData: ConversionFormData
): Promise<ConversionResult> {
  try {
    // Get the Novel's current AR level for revalidation
    const sourceNovel = await prisma.novel.findUnique({
      where: { id: formData.sourceNovelId },
      select: { ARId: true },
    });

    if (!sourceNovel) {
      return {
        success: false,
        error: "Source novel not found",
      };
    }

    // Convert the novel
    const conversionResult = await convertNovelToBPALevel(formData);

    if (!conversionResult.success) {
      return conversionResult;
    }

    // Delete the source Novel (cascades to chapters and question sets)
    await prisma.novel.delete({
      where: { id: formData.sourceNovelId },
    });

    // Revalidate both source Novel level and target BPA level pages
    if (sourceNovel.ARId) {
      revalidatePath(`/admin/novels/${sourceNovel.ARId}`);
    }
    revalidatePath(`/admin/bpa/${formData.targetBPALevelId}`);

    return {
      success: true,
      message: conversionResult.message,
      bpaNovelId: conversionResult.bpaNovelId,
      bpaLevelId: conversionResult.bpaLevelId,
    };
  } catch (error) {
    console.error("Error moving Novel to BPA level:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Copies a Novel to a BPA level
 * Converts the novel but keeps the source Novel
 */
export async function copyNovelToBPALevel(
  formData: ConversionFormData
): Promise<ConversionResult> {
  try {
    // Convert the novel (source remains intact)
    const conversionResult = await convertNovelToBPALevel(formData);

    if (!conversionResult.success) {
      return conversionResult;
    }

    // Revalidate target BPA level page
    revalidatePath(`/admin/bpa/${formData.targetBPALevelId}`);

    return {
      success: true,
      message: conversionResult.message,
      bpaNovelId: conversionResult.bpaNovelId,
      bpaLevelId: conversionResult.bpaLevelId,
    };
  } catch (error) {
    console.error("Error copying Novel to BPA level:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
