"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { canDeleteChapter } from "@/lib/utils/permissions";
import { Role } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

// Chapter Actions
export const createChapterAction = async (formData: FormData) => {
  const novelId = formData.get("novelId") as string;
  const unitId = formData.get("unitId") as string | null;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const orderNumber = parseInt(formData.get("orderNumber") as string);
  const isFree = formData.get("isFree") === "on";

  if (!novelId || !title || isNaN(orderNumber)) {
    return {
      error: "Novel ID, title, and order number are required",
    };
  }

  try {
    const novel = await prisma.bPANovel.findUnique({
      where: { id: novelId },
      include: { bpaLevel: true },
    });

    if (!novel) {
      return { error: "Novel not found" };
    }

    // Check order number conflict within the same unit (if unitId provided) or novel
    const existingChapter = await prisma.bPAChapter.findFirst({
      where: {
        novelId: novelId,
        ...(unitId ? { unitId } : {}),
        orderNumber,
      },
    });

    if (existingChapter) {
      return {
        error: `Chapter with order number ${orderNumber} already exists${unitId ? " in this unit" : ""}`,
      };
    }

    const newChapter = await prisma.bPAChapter.create({
      data: {
        novelId: novelId,
        unitId: unitId || null,
        title,
        description: description || null,
        orderNumber,
        isFree,
      },
    });

    revalidatePath(`/admin/bpa/${novel.bpaLevelId}/${novelId}/edit`);
    return { success: true, chapter: newChapter };
  } catch (error) {
    console.error("Failed to create BPA chapter:", error);
    return {
      error: "Failed to create BPA chapter. Please try again.",
    };
  }
};

export const updateChapterAction = async (formData: FormData) => {
  const chapterId = formData.get("chapterId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const orderNumber = parseInt(formData.get("orderNumber") as string);
  const isFree = formData.get("isFree") === "on";

  if (!chapterId || !title || isNaN(orderNumber)) {
    return {
      error: "Chapter ID, title, and order number are required",
    };
  }

  try {
    const existingChapter = await prisma.bPAChapter.findUnique({
      where: { id: chapterId },
      include: { novel: { include: { bpaLevel: true } } },
    });

    if (!existingChapter) {
      return { error: "Chapter not found" };
    }

    const conflictingChapter = await prisma.bPAChapter.findFirst({
      where: {
        novelId: existingChapter.novelId,
        orderNumber,
        id: { not: chapterId },
      },
    });

    if (conflictingChapter) {
      return {
        error: `Chapter with order number ${orderNumber} already exists`,
      };
    }

    const updatedChapter = await prisma.bPAChapter.update({
      where: { id: chapterId },
      data: {
        title,
        description: description,
        orderNumber,
        isFree,
      },
    });

    revalidatePath(
      `/admin/bpa/${existingChapter.novel.bpaLevelId}/${existingChapter.novelId}/edit`,
    );
    return { success: true, chapter: updatedChapter };
  } catch (error) {
    console.error("Failed to update BPA chapter:", error);
    return {
      error: "Failed to update BPA chapter. Please try again.",
    };
  }
};

export const deleteChapterAction = async (chapterId: string) => {
  if (!chapterId) {
    return { error: "Chapter ID is required for deletion" };
  }

  // Check permissions
  const session = await auth();
  if (!canDeleteChapter(session?.user?.role as Role | undefined)) {
    return { error: "You don't have permission to delete chapters" };
  }

  try {
    const chapterToDelete = await prisma.bPAChapter.findUnique({
      where: { id: chapterId },
      include: { novel: { include: { bpaLevel: true } } },
    });

    if (!chapterToDelete) {
      return { error: "Chapter not found. Cannot delete." };
    }

    await prisma.bPAChapter.delete({
      where: { id: chapterId },
    });

    revalidatePath(
      `/admin/bpa/${chapterToDelete.novel.bpaLevelId}/${chapterToDelete.novelId}/edit`,
    );
    return { success: true };
  } catch (error) {
    console.error("Failed to delete BPA chapter:", error);
    return {
      error: "Failed to delete BPA chapter. Please try again.",
    };
  }
};

// Question Set Actions
export const createQuestionSetAction = async (formData: FormData) => {
  const chapterId = formData.get("chapterId") as string;
  const instructions = formData.get("instructions") as string;
  const active = formData.get("active") === "true";

  if (!chapterId || !instructions) {
    return {
      error: "Chapter ID and instructions are required",
    };
  }

  try {
    // Check if chapter exists
    const chapter = await prisma.bPAChapter.findUnique({
      where: { id: chapterId },
      include: {
        novel: { include: { bpaLevel: true } },
        questionSet: true,
      },
    });

    if (!chapter) {
      return { error: "Chapter not found" };
    }

    // Check if question set already exists for this chapter
    if (chapter.questionSet) {
      return { error: "Question set already exists for this chapter" };
    }

    const newQuestionSet = await prisma.bPAQuestionSet.create({
      data: {
        instructions,
        chapterId: chapterId,
        active,
      },
    });

    revalidatePath(
      `/admin/bpa/${chapter.novel.bpaLevelId}/${chapter.novelId}/edit`,
    );
    return { success: true, questionSet: newQuestionSet };
  } catch (error) {
    console.error("Failed to create BPA question set:", error);
    return {
      error: "Failed to create BPA question set. Please try again.",
    };
  }
};

export const updateQuestionSetAction = async (formData: FormData) => {
  const questionSetId = formData.get("questionSetId") as string;
  const instructions = formData.get("instructions") as string;
  const active = formData.get("active") === "true";

  if (!questionSetId || !instructions) {
    return {
      error: "Question set ID and instructions are required",
    };
  }

  try {
    const existingQuestionSet = await prisma.bPAQuestionSet.findUnique({
      where: { id: questionSetId },
      include: {
        chapter: {
          include: { novel: { include: { bpaLevel: true } } },
        },
      },
    });

    if (!existingQuestionSet) {
      return { error: "Question set not found" };
    }

    const updatedQuestionSet = await prisma.bPAQuestionSet.update({
      where: { id: questionSetId },
      data: {
        instructions,
        active,
      },
    });

    revalidatePath(
      `/admin/bpa/${existingQuestionSet.chapter?.novel.bpaLevelId}/${existingQuestionSet.chapter?.novelId}/edit`,
    );
    return { success: true, questionSet: updatedQuestionSet };
  } catch (error) {
    console.error("Failed to update BPA question set:", error);
    return {
      error: "Failed to update BPA question set. Please try again.",
    };
  }
};

export const deleteQuestionSetAction = async (questionSetId: string) => {
  if (!questionSetId) {
    return { error: "Question set ID is required for deletion" };
  }

  try {
    const questionSetToDelete = await prisma.bPAQuestionSet.findUnique({
      where: { id: questionSetId },
      include: {
        chapter: {
          include: { novel: { include: { bpaLevel: true } } },
        },
      },
    });

    if (!questionSetToDelete) {
      return { error: "Question set not found. Cannot delete." };
    }

    await prisma.bPAQuestionSet.delete({
      where: { id: questionSetId },
    });

    revalidatePath(
      `/admin/bpa/${questionSetToDelete.chapter?.novel.bpaLevelId}/${questionSetToDelete.chapter?.novelId}/edit`,
    );
    return { success: true };
  } catch (error) {
    console.error("Failed to delete BPA question set:", error);
    return {
      error: "Failed to delete BPA question set. Please try again.",
    };
  }
};

// Question Actions
export const createQuestionAction = async (formData: FormData) => {
  const questionSetId = formData.get("questionSetId") as string;
  const question = formData.get("question") as string;
  const choicesStr = formData.get("choices") as string;
  const answer = formData.get("answer") as string;
  const explanation = formData.get("explanation") as string;
  const score = parseInt(formData.get("score") as string);
  const timeLimit = parseInt(formData.get("timeLimit") as string);
  const orderNumber = parseInt(formData.get("orderNumber") as string);

  if (
    !questionSetId ||
    !question ||
    !choicesStr ||
    !answer ||
    !explanation ||
    isNaN(score) ||
    isNaN(timeLimit) ||
    isNaN(orderNumber)
  ) {
    return {
      error: "All fields are required and must be valid",
    };
  }

  try {
    const choices = JSON.parse(choicesStr);

    if (!Array.isArray(choices) || choices.length !== 4) {
      return { error: "Exactly 4 answer choices are required" };
    }

    // Validate that the answer matches one of the choices exactly
    if (!choices.includes(answer)) {
      return {
        error:
          "The correct answer must exactly match one of the provided choices",
      };
    }

    // Check if question set exists
    const questionSet = await prisma.bPAQuestionSet.findUnique({
      where: { id: questionSetId },
      include: {
        chapter: {
          include: { novel: { include: { bpaLevel: true } } },
        },
      },
    });

    if (!questionSet) {
      return { error: "Question set not found" };
    }

    // Check if order number already exists for this question set
    const existingQuestion = await prisma.bPAQuestion.findFirst({
      where: {
        questionSetId: questionSetId,
        orderNumber,
      },
    });

    if (existingQuestion) {
      return {
        error: `Question with order number ${orderNumber} already exists`,
      };
    }

    const newQuestion = await prisma.bPAQuestion.create({
      data: {
        questionSetId: questionSetId,
        question,
        choices,
        answer,
        explanation,
        score,
        timeLimit,
        orderNumber,
      },
    });

    revalidatePath(
      `/admin/bpa/${questionSet.chapter?.novel.bpaLevelId}/${questionSet.chapter?.novelId}/edit`,
    );
    return { success: true, question: newQuestion };
  } catch (error) {
    console.error("Failed to create BPA question:", error);
    return {
      error: "Failed to create BPA question. Please try again.",
    };
  }
};

export const updateQuestionAction = async (formData: FormData) => {
  const questionId = formData.get("questionId") as string;
  const question = formData.get("question") as string;
  const choicesStr = formData.get("choices") as string;
  const answer = formData.get("answer") as string;
  const explanation = formData.get("explanation") as string;
  const score = parseInt(formData.get("score") as string);
  const timeLimit = parseInt(formData.get("timeLimit") as string);
  const orderNumber = parseInt(formData.get("orderNumber") as string);

  if (
    !questionId ||
    !question ||
    !choicesStr ||
    !answer ||
    !explanation ||
    isNaN(score) ||
    isNaN(timeLimit) ||
    isNaN(orderNumber)
  ) {
    return {
      error: "All fields are required and must be valid",
    };
  }

  try {
    const choices = JSON.parse(choicesStr);

    if (!Array.isArray(choices) || choices.length !== 4) {
      return { error: "Exactly 4 answer choices are required" };
    }

    // Validate that the answer matches one of the choices exactly
    if (!choices.includes(answer)) {
      return {
        error:
          "The correct answer must exactly match one of the provided choices",
      };
    }

    const existingQuestion = await prisma.bPAQuestion.findUnique({
      where: { id: questionId },
      include: {
        questionSet: {
          include: {
            chapter: {
              include: { novel: { include: { bpaLevel: true } } },
            },
          },
        },
      },
    });

    if (!existingQuestion) {
      return { error: "Question not found" };
    }

    // Check if order number conflicts with another question in the same question set
    const conflictingQuestion = await prisma.bPAQuestion.findFirst({
      where: {
        questionSetId: existingQuestion.questionSetId,
        orderNumber,
        id: { not: questionId },
      },
    });

    if (conflictingQuestion) {
      return {
        error: `Question with order number ${orderNumber} already exists`,
      };
    }

    const updatedQuestion = await prisma.bPAQuestion.update({
      where: { id: questionId },
      data: {
        question,
        choices,
        answer,
        explanation,
        score,
        timeLimit,
        orderNumber,
      },
    });

    revalidatePath(
      `/admin/bpa/${existingQuestion.questionSet.chapter?.novel.bpaLevelId}/${existingQuestion.questionSet.chapter?.novelId}/edit`,
    );
    return { success: true, question: updatedQuestion };
  } catch (error) {
    console.error("Failed to update BPA question:", error);
    return {
      error: "Failed to update BPA question. Please try again.",
    };
  }
};

export const deleteQuestionAction = async (questionId: string) => {
  if (!questionId) {
    return { error: "Question ID is required for deletion" };
  }

  try {
    const questionToDelete = await prisma.bPAQuestion.findUnique({
      where: { id: questionId },
      include: {
        questionSet: {
          include: {
            chapter: {
              include: { novel: { include: { bpaLevel: true } } },
            },
          },
        },
      },
    });

    if (!questionToDelete) {
      return { error: "Question not found. Cannot delete." };
    }

    await prisma.bPAQuestion.delete({
      where: { id: questionId },
    });

    revalidatePath(
      `/admin/bpa/${questionToDelete.questionSet.chapter?.novel.bpaLevelId}/${questionToDelete.questionSet.chapter?.novelId}/edit`,
    );
    return { success: true };
  } catch (error) {
    console.error("Failed to delete BPA question:", error);
    return {
      error: "Failed to delete BPA question. Please try again.",
    };
  }
};
