"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/prisma/prisma-client";

// Question Set Actions
export const createQuestionSetAction = async (formData: FormData) => {
  const keywordId = formData.get("keywordId") as string;
  const title = formData.get("title") as string;
  const passage = formData.get("passage") as string;

  if (!keywordId || !title || !passage) {
    return {
      error: "Keyword ID, title, and passage are required",
    };
  }

  try {
    // Check if keyword exists
    const keyword = await prisma.rCKeyword.findUnique({
      where: { id: keywordId },
      include: { RCQuestionSet: true },
    });

    if (!keyword) {
      return { error: "Keyword not found" };
    }

    if (keyword.RCQuestionSet) {
      return { error: "This keyword already has a question set" };
    }

    // Create the question set
    const questionSet = await prisma.rCQuestionSet.create({
      data: {
        title: title.trim(),
        passage: passage.trim(),
        RCKeywordId: keywordId,
      },
    });

    revalidatePath(`/admin/reading/${keyword.rcLevelId}`);
    return { success: true, questionSet };
  } catch (error) {
    console.error("Failed to create question set:", error);
    return {
      error: "Failed to create question set. Please try again.",
    };
  }
};

export const updateQuestionSetAction = async (formData: FormData) => {
  const questionSetId = formData.get("questionSetId") as string;
  const title = formData.get("title") as string;
  const passage = formData.get("passage") as string;

  if (!questionSetId || !title || !passage) {
    return {
      error: "Question set ID, title, and passage are required",
    };
  }

  try {
    const questionSet = await prisma.rCQuestionSet.findUnique({
      where: { id: questionSetId },
      include: { RCKeyword: true },
    });

    if (!questionSet) {
      return { error: "Question set not found" };
    }

    const updatedQuestionSet = await prisma.rCQuestionSet.update({
      where: { id: questionSetId },
      data: {
        title: title.trim(),
        passage: passage.trim(),
      },
    });

    revalidatePath(`/admin/reading/${questionSet.RCKeyword?.rcLevelId}`);
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
    return { error: "Question set ID is required" };
  }

  try {
    const questionSet = await prisma.rCQuestionSet.findUnique({
      where: { id: questionSetId },
      include: {
        RCKeyword: true,
        _count: { select: { RCQuestion: true } },
      },
    });

    if (!questionSet) {
      return { error: "Question set not found" };
    }

    // Delete the question set (this will cascade delete all questions)
    await prisma.rCQuestionSet.delete({
      where: { id: questionSetId },
    });

    revalidatePath(`/admin/reading/${questionSet.RCKeyword?.rcLevelId}`);
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
  const choicesJson = formData.get("choices") as string;
  const answer = formData.get("answer") as string;
  const explanation = formData.get("explanation") as string;
  const score = parseInt(formData.get("score") as string);
  const timeLimit = parseInt(formData.get("timeLimit") as string);

  if (!questionSetId || !question || !choicesJson || !answer || !explanation) {
    return {
      error: "All question fields are required",
    };
  }

  if (isNaN(score) || isNaN(timeLimit)) {
    return {
      error: "Score and time limit must be valid numbers",
    };
  }

  try {
    const choices = JSON.parse(choicesJson);

    if (!Array.isArray(choices) || choices.length < 2) {
      return { error: "At least 2 answer choices are required" };
    }

    // Check if the answer matches one of the choices
    if (!choices.includes(answer)) {
      return {
        error: "The correct answer must match one of the provided choices",
      };
    }

    // Get the next order number
    const lastQuestion = await prisma.rCQuestion.findFirst({
      where: { RCQuestionSetId: questionSetId },
      orderBy: { orderNumber: "desc" },
    });

    const orderNumber = (lastQuestion?.orderNumber || 0) + 1;

    // Create the question
    const newQuestion = await prisma.rCQuestion.create({
      data: {
        RCQuestionSetId: questionSetId,
        orderNumber,
        question: question.trim(),
        choices,
        answer: answer.trim(),
        explanation: explanation.trim(),
        score,
        timeLimit,
      },
    });

    // Get the keyword for revalidation
    const questionSet = await prisma.rCQuestionSet.findUnique({
      where: { id: questionSetId },
      include: { RCKeyword: true },
    });

    revalidatePath(`/admin/reading/${questionSet?.RCKeyword?.rcLevelId}`);
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
  const choicesJson = formData.get("choices") as string;
  const answer = formData.get("answer") as string;
  const explanation = formData.get("explanation") as string;
  const score = parseInt(formData.get("score") as string);
  const timeLimit = parseInt(formData.get("timeLimit") as string);

  if (!questionId || !question || !choicesJson || !answer || !explanation) {
    return {
      error: "All question fields are required",
    };
  }

  if (isNaN(score) || isNaN(timeLimit)) {
    return {
      error: "Score and time limit must be valid numbers",
    };
  }

  try {
    const choices = JSON.parse(choicesJson);

    if (!Array.isArray(choices) || choices.length < 2) {
      return { error: "At least 2 answer choices are required" };
    }

    if (!choices.includes(answer)) {
      return {
        error: "The correct answer must match one of the provided choices",
      };
    }

    const existingQuestion = await prisma.rCQuestion.findUnique({
      where: { id: questionId },
      include: {
        RCQuestionSet: {
          include: { RCKeyword: true },
        },
      },
    });

    if (!existingQuestion) {
      return { error: "Question not found" };
    }

    const updatedQuestion = await prisma.rCQuestion.update({
      where: { id: questionId },
      data: {
        question: question.trim(),
        choices,
        answer: answer.trim(),
        explanation: explanation.trim(),
        score,
        timeLimit,
      },
    });

    revalidatePath(
      `/admin/reading/${existingQuestion.RCQuestionSet.RCKeyword?.rcLevelId}`,
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
    return { error: "Question ID is required" };
  }

  try {
    const question = await prisma.rCQuestion.findUnique({
      where: { id: questionId },
      include: {
        RCQuestionSet: {
          include: { RCKeyword: true },
        },
      },
    });

    if (!question) {
      return { error: "Question not found" };
    }

    await prisma.rCQuestion.delete({
      where: { id: questionId },
    });

    revalidatePath(
      `/admin/reading/${question.RCQuestionSet.RCKeyword?.rcLevelId}`,
    );
    return { success: true };
  } catch (error) {
    console.error("Failed to delete question:", error);
    return {
      error: "Failed to delete question. Please try again.",
    };
  }
};
