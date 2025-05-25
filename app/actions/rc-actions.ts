"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma-client";

export async function submitRCAnswer(
  questionId: string,
  answer: string,
  keywordId: string,
  rcLevelId: string,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    if (!questionId || !answer || !keywordId || !rcLevelId) {
      throw new Error("Missing required fields");
    }

    // Get the question details
    const question = await prisma.rCQuestion.findUnique({
      where: { id: questionId },
      include: {
        RCQuestionSet: {
          include: {
            RCKeyword: {
              include: {
                RCLevel: true,
              },
            },
          },
        },
      },
    });

    if (!question) {
      throw new Error("Question not found");
    }

    // Verify the question belongs to the correct keyword and level
    if (
      question.RCQuestionSet?.RCKeyword?.id !== keywordId ||
      question.RCQuestionSet?.RCKeyword?.rcLevelId !== rcLevelId
    ) {
      throw new Error("Invalid question context");
    }

    // Check if user already completed this question
    const existingCompletion = await prisma.rCQuestionCompleted.findFirst({
      where: {
        RCQuestionId: questionId,
        userId: session.user.id,
      },
    });

    if (existingCompletion) {
      throw new Error("Question already completed");
    }

    // Calculate score
    const isCorrect = answer === question.answer;
    const score = isCorrect ? question.score : 0;

    // Create completion record
    await prisma.rCQuestionCompleted.create({
      data: {
        RCQuestionId: questionId,
        userId: session.user.id,
        score: score,
      },
    });

    // Update or create RC score for this level
    const existingRCScore = await prisma.rCScore.findFirst({
      where: {
        userId: session.user.id,
        RCLevelId: rcLevelId,
      },
    });

    if (existingRCScore) {
      await prisma.rCScore.update({
        where: { id: existingRCScore.id },
        data: {
          score: {
            increment: score,
          },
        },
      });
    } else {
      await prisma.rCScore.create({
        data: {
          userId: session.user.id,
          RCLevelId: rcLevelId,
          score: score,
        },
      });
    }

    // Update total score
    const existingTotalScore = await prisma.totalScore.findUnique({
      where: { userId: session.user.id },
    });

    if (existingTotalScore) {
      await prisma.totalScore.update({
        where: { userId: session.user.id },
        data: {
          score: {
            increment: score,
          },
        },
      });
    } else {
      await prisma.totalScore.create({
        data: {
          userId: session.user.id,
          score: score,
        },
      });
    }

    // Revalidate the current page to update the UI
    revalidatePath(`/rc/${rcLevelId}/${keywordId}`);

    return {
      success: true,
      isCorrect,
      score,
      explanation: question.explanation,
    };
  } catch (error) {
    console.error("Error submitting RC answer:", error);
    throw error;
  }
}
