"use server";

import { revalidatePath } from "next/cache";

import { BPASeason } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export interface SemesterAssignmentResult {
  success: boolean;
  error?: string;
}

/**
 * Assign a novel to multiple semesters (timeframe + season combinations)
 */
export async function assignNovelToSemestersAction(
  novelId: string,
  levelId: string,
  assignments: Array<{ timeframeId: string; season: BPASeason }>,
  adminUserId?: string
): Promise<SemesterAssignmentResult> {
  try {
    if (!novelId || !levelId) {
      return { success: false, error: "Missing required fields" };
    }

    // Verify novel exists and belongs to the level
    const novel = await prisma.bPANovel.findUnique({
      where: { id: novelId },
      select: { bpaLevelId: true },
    });

    if (!novel) {
      return { success: false, error: "Novel not found" };
    }

    if (novel.bpaLevelId !== levelId) {
      return { success: false, error: "Novel does not belong to this level" };
    }

    // Delete existing assignments
    await prisma.bPANovelSemesterAssignment.deleteMany({
      where: { novelId },
    });

    // Create new assignments
    if (assignments.length > 0) {
      await prisma.bPANovelSemesterAssignment.createMany({
        data: assignments.map((assignment) => ({
          novelId,
          timeframeId: assignment.timeframeId,
          season: assignment.season,
          assignedBy: adminUserId,
        })),
      });
    }

    revalidatePath(`/admin/bpa/${levelId}/${novelId}/edit`);
    revalidatePath(`/admin/bpa/${levelId}`);
    revalidatePath(`/bpa/${levelId}`);
    revalidatePath(`/bpa/${levelId}/${novelId}`);

    return { success: true };
  } catch (error) {
    console.error("Error assigning novel to semesters:", error);
    return {
      success: false,
      error: "Failed to assign novel to semesters",
    };
  }
}

/**
 * Get all semester assignments for a novel
 */
export async function getNovelSemesterAssignments(novelId: string) {
  try {
    const assignments = await prisma.bPANovelSemesterAssignment.findMany({
      where: { novelId },
      include: {
        timeframe: {
          select: {
            id: true,
            year: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: [
        { timeframe: { startDate: "desc" } },
        { season: "asc" },
      ],
    });

    return assignments;
  } catch (error) {
    console.error("Error fetching semester assignments:", error);
    return [];
  }
}
