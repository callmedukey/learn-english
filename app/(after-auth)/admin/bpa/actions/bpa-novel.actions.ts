"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { canDeleteBPANovel, canLockBPANovel } from "@/lib/utils/permissions";
import { Role } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export async function toggleBPANovelsHiddenStatus(
  novelIds: string[],
  setHidden: boolean,
) {
  const session = await auth();
  if (!canDeleteBPANovel(session?.user?.role as Role | undefined)) {
    return { error: "You don't have permission to modify BPA novels" };
  }

  try {
    await prisma.bPANovel.updateMany({
      where: {
        id: {
          in: novelIds,
        },
      },
      data: {
        hidden: setHidden,
      },
    });

    revalidatePath("/admin/bpa");

    return {
      success: true,
      message: `Successfully ${setHidden ? "hidden" : "shown"} ${
        novelIds.length
      } novel${novelIds.length !== 1 ? "s" : ""}`,
    };
  } catch (error) {
    console.error("Error updating BPA novels:", error);
    return {
      success: false,
      message: "Failed to update novels",
    };
  }
}

export async function toggleBPANovelsComingSoonStatus(
  novelIds: string[],
  setComingSoon: boolean,
) {
  const session = await auth();
  if (!canDeleteBPANovel(session?.user?.role as Role | undefined)) {
    return { error: "You don't have permission to modify BPA novels" };
  }

  try {
    await prisma.bPANovel.updateMany({
      where: {
        id: {
          in: novelIds,
        },
      },
      data: {
        comingSoon: setComingSoon,
      },
    });

    revalidatePath("/admin/bpa");

    return {
      success: true,
      message: `Successfully ${setComingSoon ? "marked" : "unmarked"} ${
        novelIds.length
      } novel${novelIds.length !== 1 ? "s" : ""} as coming soon`,
    };
  } catch (error) {
    console.error("Error updating BPA novels:", error);
    return {
      success: false,
      message: "Failed to update novels",
    };
  }
}

export async function moveBPANovelToLevel(novelId: string, newLevelId: string) {
  const session = await auth();
  if (!canDeleteBPANovel(session?.user?.role as Role | undefined)) {
    return { error: "You don't have permission to move BPA novels" };
  }

  try {
    const currentNovel = await prisma.bPANovel.findUnique({
      where: {
        id: novelId,
      },
      select: {
        bpaLevelId: true,
      },
    });

    if (!currentNovel) {
      return { success: false, error: "Novel not found" };
    }

    const updatedNovel = await prisma.bPANovel.update({
      where: {
        id: novelId,
      },
      data: {
        bpaLevelId: newLevelId,
      },
      include: {
        bpaLevel: true,
      },
    });

    // Revalidate both the old and new level pages
    if (currentNovel.bpaLevelId) {
      revalidatePath(`/admin/bpa/${currentNovel.bpaLevelId}`);
    }
    revalidatePath(`/admin/bpa/${newLevelId}`);
    revalidatePath("/admin/bpa");

    return { success: true, novel: updatedNovel };
  } catch (error) {
    console.error("Failed to move BPA novel:", error);
    return { success: false, error: "Failed to move novel" };
  }
}

export async function toggleBPANovelLock(novelId: string) {
  const session = await auth();
  const userRole = session?.user?.role as Role | undefined;

  if (!canLockBPANovel(userRole)) {
    return { error: "You don't have permission to lock/unlock BPA novels" };
  }

  try {
    const novel = await prisma.bPANovel.findUnique({
      where: { id: novelId },
      select: { locked: true, bpaLevelId: true },
    });

    if (!novel) {
      return { error: "Novel not found" };
    }

    const updatedNovel = await prisma.bPANovel.update({
      where: { id: novelId },
      data: { locked: !novel.locked },
    });

    revalidatePath(`/admin/bpa`);
    if (novel.bpaLevelId) {
      revalidatePath(`/admin/bpa/${novel.bpaLevelId}`);
    }

    return {
      success: true,
      locked: updatedNovel.locked,
      message: updatedNovel.locked
        ? "Novel locked successfully"
        : "Novel unlocked successfully",
    };
  } catch (error) {
    console.error("Failed to toggle BPA novel lock:", error);
    return { error: "Failed to update novel lock status" };
  }
}

export async function deleteBPANovel(novelId: string) {
  const session = await auth();
  if (!canDeleteBPANovel(session?.user?.role as Role | undefined)) {
    return { error: "You don't have permission to delete BPA novels" };
  }

  try {
    const novel = await prisma.bPANovel.findUnique({
      where: { id: novelId },
      select: { bpaLevelId: true },
    });

    if (!novel) {
      return { error: "Novel not found" };
    }

    await prisma.bPANovel.delete({
      where: { id: novelId },
    });

    revalidatePath(`/admin/bpa`);
    if (novel.bpaLevelId) {
      revalidatePath(`/admin/bpa/${novel.bpaLevelId}`);
    }

    return { success: true, message: "Novel deleted successfully" };
  } catch (error) {
    console.error("Failed to delete BPA novel:", error);
    return { error: "Failed to delete novel" };
  }
}

export async function copyBPANovelToLevel(novelId: string, newLevelId: string) {
  const session = await auth();
  if (!canDeleteBPANovel(session?.user?.role as Role | undefined)) {
    return { error: "You don't have permission to copy BPA novels" };
  }

  try {
    // Get the source novel with all its units, chapters, and question sets
    const sourceNovel = await prisma.bPANovel.findUnique({
      where: {
        id: novelId,
      },
      include: {
        units: {
          include: {
            chapters: {
              include: {
                questionSet: {
                  include: {
                    questions: true,
                  },
                },
              },
              orderBy: {
                orderNumber: "asc",
              },
            },
          },
          orderBy: {
            orderNumber: "asc",
          },
        },
        chapters: {
          where: {
            unitId: null, // Only get legacy chapters without units
          },
          include: {
            questionSet: {
              include: {
                questions: true,
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

    // Use a transaction to create the novel and all nested data
    const copiedNovel = await prisma.$transaction(async (tx) => {
      // First, create the novel
      const newNovel = await tx.bPANovel.create({
        data: {
          title: sourceNovel.title,
          description: sourceNovel.description,
          hidden: sourceNovel.hidden,
          comingSoon: sourceNovel.comingSoon,
          locked: sourceNovel.locked,
          bpaLevelId: newLevelId,
        },
        include: {
          bpaLevel: true,
        },
      });

      // Create units with their chapters
      for (const unit of sourceNovel.units) {
        const newUnit = await tx.bPAUnit.create({
          data: {
            name: unit.name,
            description: unit.description,
            orderNumber: unit.orderNumber,
            novelId: newNovel.id,
          },
        });

        // Create chapters for this unit
        for (const chapter of unit.chapters) {
          const newChapter = await tx.bPAChapter.create({
            data: {
              orderNumber: chapter.orderNumber,
              title: chapter.title,
              description: chapter.description,
              isFree: chapter.isFree,
              unitId: newUnit.id,
              novelId: newNovel.id,
            },
          });

          // Create question set if exists
          if (chapter.questionSet) {
            const newQuestionSet = await tx.bPAQuestionSet.create({
              data: {
                instructions: chapter.questionSet.instructions,
                active: chapter.questionSet.active,
                chapterId: newChapter.id,
              },
            });

            // Create questions
            for (const question of chapter.questionSet.questions) {
              await tx.bPAQuestion.create({
                data: {
                  orderNumber: question.orderNumber,
                  question: question.question,
                  choices: question.choices,
                  answer: question.answer,
                  explanation: question.explanation,
                  score: question.score,
                  timeLimit: question.timeLimit,
                  questionSetId: newQuestionSet.id,
                },
              });
            }
          }
        }
      }

      // Create legacy chapters without units
      for (const chapter of sourceNovel.chapters) {
        const newChapter = await tx.bPAChapter.create({
          data: {
            orderNumber: chapter.orderNumber,
            title: chapter.title,
            description: chapter.description,
            isFree: chapter.isFree,
            novelId: newNovel.id,
          },
        });

        // Create question set if exists
        if (chapter.questionSet) {
          const newQuestionSet = await tx.bPAQuestionSet.create({
            data: {
              instructions: chapter.questionSet.instructions,
              active: chapter.questionSet.active,
              chapterId: newChapter.id,
            },
          });

          // Create questions
          for (const question of chapter.questionSet.questions) {
            await tx.bPAQuestion.create({
              data: {
                orderNumber: question.orderNumber,
                question: question.question,
                choices: question.choices,
                answer: question.answer,
                explanation: question.explanation,
                score: question.score,
                timeLimit: question.timeLimit,
                questionSetId: newQuestionSet.id,
              },
            });
          }
        }
      }

      return newNovel;
    });

    // Revalidate the relevant pages
    if (sourceNovel.bpaLevelId) {
      revalidatePath(`/admin/bpa/${sourceNovel.bpaLevelId}`);
    }
    revalidatePath(`/admin/bpa/${newLevelId}`);
    revalidatePath("/admin/bpa");

    return { success: true, novel: copiedNovel };
  } catch (error) {
    console.error("Failed to copy BPA novel:", error);
    return { success: false, error: "Failed to copy novel" };
  }
}
