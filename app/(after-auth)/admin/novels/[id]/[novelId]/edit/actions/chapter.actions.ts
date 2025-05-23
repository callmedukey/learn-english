"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/prisma/prisma-client";

// Chapter Actions
export const createChapterAction = async (formData: FormData) => {
  const novelId = formData.get("novelId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const orderNumber = parseInt(formData.get("orderNumber") as string);

  if (!novelId || !title || isNaN(orderNumber)) {
    return {
      error: "Novel ID, title, and order number are required",
    };
  }

  try {
    const novel = await prisma.novel.findUnique({
      where: { id: novelId },
      include: { AR: true },
    });

    if (!novel) {
      return { error: "Novel not found" };
    }

    const existingChapter = await prisma.novelChapter.findFirst({
      where: {
        novelId,
        orderNumber,
      },
    });

    if (existingChapter) {
      return {
        error: `Chapter with order number ${orderNumber} already exists`,
      };
    }

    const newChapter = await prisma.novelChapter.create({
      data: {
        novelId,
        title,
        description: description || null,
        orderNumber,
      },
    });

    revalidatePath(`/admin/novels/${novel.ARId}/${novelId}/edit`);
    return { success: true, chapter: newChapter };
  } catch (error) {
    console.error("Failed to create chapter:", error);
    return {
      error: "Failed to create chapter. Please try again.",
    };
  }
};

export const updateChapterAction = async (formData: FormData) => {
  const chapterId = formData.get("chapterId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const orderNumber = parseInt(formData.get("orderNumber") as string);

  if (!chapterId || !title || isNaN(orderNumber)) {
    return {
      error: "Chapter ID, title, and order number are required",
    };
  }

  try {
    const existingChapter = await prisma.novelChapter.findUnique({
      where: { id: chapterId },
      include: { novel: { include: { AR: true } } },
    });

    if (!existingChapter) {
      return { error: "Chapter not found" };
    }

    const conflictingChapter = await prisma.novelChapter.findFirst({
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

    const updatedChapter = await prisma.novelChapter.update({
      where: { id: chapterId },
      data: {
        title,
        description: description,
        orderNumber,
      },
    });

    revalidatePath(
      `/admin/novels/${existingChapter.novel.ARId}/${existingChapter.novelId}/edit`,
    );
    return { success: true, chapter: updatedChapter };
  } catch (error) {
    console.error("Failed to update chapter:", error);
    return {
      error: "Failed to update chapter. Please try again.",
    };
  }
};

export const deleteChapterAction = async (chapterId: string) => {
  if (!chapterId) {
    return { error: "Chapter ID is required for deletion" };
  }

  try {
    const chapterToDelete = await prisma.novelChapter.findUnique({
      where: { id: chapterId },
      include: { novel: { include: { AR: true } } },
    });

    if (!chapterToDelete) {
      return { error: "Chapter not found. Cannot delete." };
    }

    await prisma.novelChapter.delete({
      where: { id: chapterId },
    });

    revalidatePath(
      `/admin/novels/${chapterToDelete.novel.ARId}/${chapterToDelete.novelId}/edit`,
    );
    return { success: true };
  } catch (error) {
    console.error("Failed to delete chapter:", error);
    return {
      error: "Failed to delete chapter. Please try again.",
    };
  }
};

// Question Set Actions
export const createQuestionSetAction = async (formData: FormData) => {
  const chapterId = formData.get("chapterId") as string;
  const instructions = formData.get("instructions") as string;

  if (!chapterId || !instructions) {
    return {
      error: "Chapter ID and instructions are required",
    };
  }

  try {
    // Check if chapter exists
    const chapter = await prisma.novelChapter.findUnique({
      where: { id: chapterId },
      include: {
        novel: { include: { AR: true } },
        novelQuestionSet: true,
      },
    });

    if (!chapter) {
      return { error: "Chapter not found" };
    }

    // Check if question set already exists for this chapter
    if (chapter.novelQuestionSet) {
      return { error: "Question set already exists for this chapter" };
    }

    const newQuestionSet = await prisma.novelQuestionSet.create({
      data: {
        instructions,
        novelChapterId: chapterId,
      },
    });

    revalidatePath(
      `/admin/novels/${chapter.novel.ARId}/${chapter.novelId}/edit`,
    );
    return { success: true, questionSet: newQuestionSet };
  } catch (error) {
    console.error("Failed to create question set:", error);
    return {
      error: "Failed to create question set. Please try again.",
    };
  }
};

export const updateQuestionSetAction = async (formData: FormData) => {
  const questionSetId = formData.get("questionSetId") as string;
  const instructions = formData.get("instructions") as string;

  if (!questionSetId || !instructions) {
    return {
      error: "Question set ID and instructions are required",
    };
  }

  try {
    const existingQuestionSet = await prisma.novelQuestionSet.findUnique({
      where: { id: questionSetId },
      include: {
        novelChapter: {
          include: { novel: { include: { AR: true } } },
        },
      },
    });

    if (!existingQuestionSet) {
      return { error: "Question set not found" };
    }

    const updatedQuestionSet = await prisma.novelQuestionSet.update({
      where: { id: questionSetId },
      data: { instructions },
    });

    revalidatePath(
      `/admin/novels/${existingQuestionSet.novelChapter?.novel.ARId}/${existingQuestionSet.novelChapter?.novelId}/edit`,
    );
    return { success: true, questionSet: updatedQuestionSet };
  } catch (error) {
    console.error("Failed to update question set:", error);
    return {
      error: "Failed to update question set. Please try again.",
    };
  }
};

export const deleteQuestionSetAction = async (questionSetId: string) => {
  if (!questionSetId) {
    return { error: "Question set ID is required for deletion" };
  }

  try {
    const questionSetToDelete = await prisma.novelQuestionSet.findUnique({
      where: { id: questionSetId },
      include: {
        novelChapter: {
          include: { novel: { include: { AR: true } } },
        },
      },
    });

    if (!questionSetToDelete) {
      return { error: "Question set not found. Cannot delete." };
    }

    await prisma.novelQuestionSet.delete({
      where: { id: questionSetId },
    });

    revalidatePath(
      `/admin/novels/${questionSetToDelete.novelChapter?.novel.ARId}/${questionSetToDelete.novelChapter?.novelId}/edit`,
    );
    return { success: true };
  } catch (error) {
    console.error("Failed to delete question set:", error);
    return {
      error: "Failed to delete question set. Please try again.",
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

    if (!Array.isArray(choices) || choices.length === 0) {
      return { error: "At least one choice is required" };
    }

    // Validate that the answer matches one of the choices exactly
    if (!choices.includes(answer)) {
      return {
        error:
          "The correct answer must exactly match one of the provided choices",
      };
    }

    // Check if question set exists
    const questionSet = await prisma.novelQuestionSet.findUnique({
      where: { id: questionSetId },
      include: {
        novelChapter: {
          include: { novel: { include: { AR: true } } },
        },
      },
    });

    if (!questionSet) {
      return { error: "Question set not found" };
    }

    // Check if order number already exists for this question set
    const existingQuestion = await prisma.novelQuestion.findFirst({
      where: {
        novelQuestionSetId: questionSetId,
        orderNumber,
      },
    });

    if (existingQuestion) {
      return {
        error: `Question with order number ${orderNumber} already exists`,
      };
    }

    const newQuestion = await prisma.novelQuestion.create({
      data: {
        novelQuestionSetId: questionSetId,
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
      `/admin/novels/${questionSet.novelChapter?.novel.ARId}/${questionSet.novelChapter?.novelId}/edit`,
    );
    return { success: true, question: newQuestion };
  } catch (error) {
    console.error("Failed to create question:", error);
    return {
      error: "Failed to create question. Please try again.",
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

    if (!Array.isArray(choices) || choices.length === 0) {
      return { error: "At least one choice is required" };
    }

    // Validate that the answer matches one of the choices exactly
    if (!choices.includes(answer)) {
      return {
        error:
          "The correct answer must exactly match one of the provided choices",
      };
    }

    const existingQuestion = await prisma.novelQuestion.findUnique({
      where: { id: questionId },
      include: {
        novelQuestionSet: {
          include: {
            novelChapter: {
              include: { novel: { include: { AR: true } } },
            },
          },
        },
      },
    });

    if (!existingQuestion) {
      return { error: "Question not found" };
    }

    // Check if order number conflicts with another question in the same question set
    const conflictingQuestion = await prisma.novelQuestion.findFirst({
      where: {
        novelQuestionSetId: existingQuestion.novelQuestionSetId,
        orderNumber,
        id: { not: questionId },
      },
    });

    if (conflictingQuestion) {
      return {
        error: `Question with order number ${orderNumber} already exists`,
      };
    }

    const updatedQuestion = await prisma.novelQuestion.update({
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
      `/admin/novels/${existingQuestion.novelQuestionSet.novelChapter?.novel.ARId}/${existingQuestion.novelQuestionSet.novelChapter?.novelId}/edit`,
    );
    return { success: true, question: updatedQuestion };
  } catch (error) {
    console.error("Failed to update question:", error);
    return {
      error: "Failed to update question. Please try again.",
    };
  }
};

export const deleteQuestionAction = async (questionId: string) => {
  if (!questionId) {
    return { error: "Question ID is required for deletion" };
  }

  try {
    const questionToDelete = await prisma.novelQuestion.findUnique({
      where: { id: questionId },
      include: {
        novelQuestionSet: {
          include: {
            novelChapter: {
              include: { novel: { include: { AR: true } } },
            },
          },
        },
      },
    });

    if (!questionToDelete) {
      return { error: "Question not found. Cannot delete." };
    }

    await prisma.novelQuestion.delete({
      where: { id: questionId },
    });

    revalidatePath(
      `/admin/novels/${questionToDelete.novelQuestionSet.novelChapter?.novel.ARId}/${questionToDelete.novelQuestionSet.novelChapter?.novelId}/edit`,
    );
    return { success: true };
  } catch (error) {
    console.error("Failed to delete question:", error);
    return {
      error: "Failed to delete question. Please try again.",
    };
  }
};
