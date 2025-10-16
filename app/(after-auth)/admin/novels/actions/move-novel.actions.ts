"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/prisma/prisma-client";

export async function moveNovelToARLevel(novelId: string, newARId: string) {
  try {
    // Get the current novel with its AR level
    const currentNovel = await prisma.novel.findUnique({
      where: {
        id: novelId,
      },
      select: {
        ARId: true,
      },
    });

    if (!currentNovel) {
      return { success: false, error: "Novel not found" };
    }

    // Update the novel's AR level
    const updatedNovel = await prisma.novel.update({
      where: {
        id: novelId,
      },
      data: {
        ARId: newARId,
      },
      include: {
        AR: true,
      },
    });

    // Revalidate both the old and new AR level pages
    if (currentNovel.ARId) {
      revalidatePath(`/admin/novels/${currentNovel.ARId}`);
    }
    revalidatePath(`/admin/novels/${newARId}`);
    revalidatePath("/admin/novels");

    return { success: true, novel: updatedNovel };
  } catch (error) {
    console.error("Failed to move novel:", error);
    return { success: false, error: "Failed to move novel" };
  }
}

export async function copyNovelToARLevel(novelId: string, newARId: string) {
  try {
    // Get the source novel with all its chapters and question sets
    const sourceNovel = await prisma.novel.findUnique({
      where: {
        id: novelId,
      },
      include: {
        novelChapters: {
          include: {
            novelQuestionSet: {
              include: {
                novelQuestions: true,
              },
            },
          },
          orderBy: {
            orderNumber: "asc",
          },
        },
      },
    });

    if (!sourceNovel) {
      return { success: false, error: "Novel not found" };
    }

    // Create a copy of the novel with all nested data
    const copiedNovel = await prisma.novel.create({
      data: {
        title: sourceNovel.title,
        description: sourceNovel.description,
        hidden: sourceNovel.hidden,
        comingSoon: sourceNovel.comingSoon,
        locked: sourceNovel.locked,
        ARId: newARId,
        novelChapters: {
          create: sourceNovel.novelChapters.map((chapter) => ({
            orderNumber: chapter.orderNumber,
            title: chapter.title,
            description: chapter.description,
            isFree: chapter.isFree,
            novelQuestionSet: chapter.novelQuestionSet
              ? {
                  create: {
                    instructions: chapter.novelQuestionSet.instructions,
                    active: chapter.novelQuestionSet.active,
                    novelQuestions: {
                      create: chapter.novelQuestionSet.novelQuestions.map(
                        (question) => ({
                          orderNumber: question.orderNumber,
                          question: question.question,
                          choices: question.choices,
                          answer: question.answer,
                          explanation: question.explanation,
                          score: question.score,
                          timeLimit: question.timeLimit,
                        })
                      ),
                    },
                  },
                }
              : undefined,
          })),
        },
      },
      include: {
        AR: true,
      },
    });

    // Revalidate the relevant pages
    if (sourceNovel.ARId) {
      revalidatePath(`/admin/novels/${sourceNovel.ARId}`);
    }
    revalidatePath(`/admin/novels/${newARId}`);
    revalidatePath("/admin/novels");

    return { success: true, novel: copiedNovel };
  } catch (error) {
    console.error("Failed to copy novel:", error);
    return { success: false, error: "Failed to copy novel" };
  }
}
