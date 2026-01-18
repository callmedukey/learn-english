"use server";

import { revalidatePath } from "next/cache";

import { requireAdminOrSubAdminAccess } from "@/lib/utils/admin-route-protection";
import { BPAAssignmentAction, BPASeason } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export interface AssignmentResult {
  success: boolean;
  error?: string;
  assignedCount?: number;
  updatedCount?: number;
  skippedCount?: number;
  message?: string;
}

/**
 * Assign a single student to a BPA level for a specific semester
 */
export async function assignStudentToBPALevel(
  userId: string,
  campusId: string,
  timeframeId: string,
  season: BPASeason,
  bpaLevelId: string,
  adminUserId: string
): Promise<AssignmentResult> {
  try {
    await requireAdminOrSubAdminAccess();
    // Verify student belongs to campus
    const student = await prisma.user.findUnique({
      where: { id: userId },
      select: { campusId: true, role: true },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    if (student.campusId !== campusId) {
      return { success: false, error: "Student does not belong to this campus" };
    }

    if (student.role !== "USER") {
      return { success: false, error: "Cannot assign levels to admin users" };
    }

    // Verify timeframe, semester, and level exist
    const [timeframe, semester, level] = await Promise.all([
      prisma.bPATimeframe.findUnique({ where: { id: timeframeId } }),
      prisma.bPASemester.findUnique({
        where: {
          timeframeId_season: {
            timeframeId,
            season,
          },
        },
      }),
      prisma.bPALevel.findUnique({ where: { id: bpaLevelId } }),
    ]);

    if (!timeframe) {
      return { success: false, error: "Timeframe not found" };
    }

    if (!semester) {
      return { success: false, error: "Semester not found for this timeframe and season" };
    }

    if (!level) {
      return { success: false, error: "BPA level not found" };
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.bPAUserLevelAssignment.findUnique({
      where: {
        userId_timeframeId_season: {
          userId,
          timeframeId,
          season,
        },
      },
    });

    // Create history record for existing assignment before updating
    if (existingAssignment) {
      await prisma.bPAUserLevelAssignmentHistory.create({
        data: {
          userId,
          semesterId: semester.id,
          timeframeId,
          season,
          bpaLevelId: existingAssignment.bpaLevelId,
          action: BPAAssignmentAction.UPDATED,
          assignedBy: adminUserId,
        },
      });
    }

    // Upsert assignment (replace if exists)
    await prisma.bPAUserLevelAssignment.upsert({
      where: {
        userId_timeframeId_season: {
          userId,
          timeframeId,
          season,
        },
      },
      update: {
        bpaLevelId,
        semesterId: semester.id,
        assignedBy: adminUserId,
        updatedAt: new Date(),
      },
      create: {
        userId,
        semesterId: semester.id,
        timeframeId,
        season,
        bpaLevelId,
        assignedBy: adminUserId,
      },
    });

    // Create history record for new assignment
    await prisma.bPAUserLevelAssignmentHistory.create({
      data: {
        userId,
        semesterId: semester.id,
        timeframeId,
        season,
        bpaLevelId,
        action: existingAssignment
          ? BPAAssignmentAction.UPDATED
          : BPAAssignmentAction.CREATED,
        assignedBy: adminUserId,
      },
    });

    revalidatePath(`/admin/campuses/${campusId}`);
    return { success: true, assignedCount: 1 };
  } catch (error) {
    console.error("Error assigning student to BPA level:", error);
    return { success: false, error: "Failed to assign student to level" };
  }
}

/**
 * Bulk assign multiple students to a BPA level for a specific semester
 */
export async function bulkAssignStudentsToBPALevel(
  userIds: string[],
  campusId: string,
  timeframeId: string,
  season: BPASeason,
  bpaLevelId: string,
  adminUserId: string
): Promise<AssignmentResult> {
  try {
    await requireAdminOrSubAdminAccess();
    if (userIds.length === 0) {
      return { success: false, error: "No students selected" };
    }

    // Verify all students belong to campus
    const students = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        campusId,
        role: "USER",
      },
      select: { id: true },
    });

    if (students.length !== userIds.length) {
      return {
        success: false,
        error: "Some students do not belong to this campus or are not regular users",
      };
    }

    // Verify timeframe, semester, and level exist
    const [timeframe, semester, level] = await Promise.all([
      prisma.bPATimeframe.findUnique({ where: { id: timeframeId } }),
      prisma.bPASemester.findUnique({
        where: {
          timeframeId_season: {
            timeframeId,
            season,
          },
        },
      }),
      prisma.bPALevel.findUnique({ where: { id: bpaLevelId } }),
    ]);

    if (!timeframe) {
      return { success: false, error: "Timeframe not found" };
    }

    if (!semester) {
      return { success: false, error: "Semester not found for this timeframe and season" };
    }

    if (!level) {
      return { success: false, error: "BPA level not found" };
    }

    // Check for existing assignments first
    const existingAssignments = await prisma.bPAUserLevelAssignment.findMany({
      where: {
        userId: { in: userIds },
        timeframeId,
        season,
      },
      select: {
        userId: true,
        bpaLevelId: true,
      },
    });

    // Separate students into groups
    const existingUserIds = new Set(existingAssignments.map(a => a.userId));
    const newUserIds = userIds.filter(id => !existingUserIds.has(id));
    const updateUserIds = userIds.filter(id => existingUserIds.has(id));

    // Check if any existing assignments are for the same level (no change needed)
    const sameLevel = existingAssignments.filter(a => a.bpaLevelId === bpaLevelId);
    const sameLevelUserIds = new Set(sameLevel.map(a => a.userId));
    const actualUpdateUserIds = updateUserIds.filter(id => !sameLevelUserIds.has(id));

    let assignedCount = 0;
    let updatedCount = 0;
    const skippedCount = sameLevelUserIds.size;

    // Process new assignments
    for (const userId of newUserIds) {
      await prisma.bPAUserLevelAssignment.create({
        data: {
          userId,
          semesterId: semester.id,
          timeframeId,
          season,
          bpaLevelId,
          assignedBy: adminUserId,
        },
      });

      // Create history record
      await prisma.bPAUserLevelAssignmentHistory.create({
        data: {
          userId,
          semesterId: semester.id,
          timeframeId,
          season,
          bpaLevelId,
          action: BPAAssignmentAction.CREATED,
          assignedBy: adminUserId,
        },
      });

      assignedCount++;
    }

    // Process updates
    for (const userId of actualUpdateUserIds) {
      const existingAssignment = existingAssignments.find(a => a.userId === userId);

      if (existingAssignment) {
        // Create history record for old assignment
        await prisma.bPAUserLevelAssignmentHistory.create({
          data: {
            userId,
            semesterId: semester.id,
            timeframeId,
            season,
            bpaLevelId: existingAssignment.bpaLevelId,
            action: BPAAssignmentAction.UPDATED,
            assignedBy: adminUserId,
          },
        });
      }

      // Update assignment
      await prisma.bPAUserLevelAssignment.update({
        where: {
          userId_timeframeId_season: {
            userId,
            timeframeId,
            season,
          },
        },
        data: {
          bpaLevelId,
          semesterId: semester.id,
          assignedBy: adminUserId,
          updatedAt: new Date(),
        },
      });

      // Create history record for new assignment
      await prisma.bPAUserLevelAssignmentHistory.create({
        data: {
          userId,
          semesterId: semester.id,
          timeframeId,
          season,
          bpaLevelId,
          action: BPAAssignmentAction.UPDATED,
          assignedBy: adminUserId,
        },
      });

      updatedCount++;
    }

    revalidatePath(`/admin/campuses/${campusId}`);

    // Generate detailed message
    let message = "";
    if (assignedCount > 0) message += `${assignedCount} new assignment${assignedCount !== 1 ? "s" : ""}`;
    if (updatedCount > 0) {
      if (message) message += ", ";
      message += `${updatedCount} updated`;
    }
    if (skippedCount > 0) {
      if (message) message += ", ";
      message += `${skippedCount} skipped (already assigned to same level)`;
    }

    return {
      success: true,
      assignedCount,
      updatedCount,
      skippedCount,
      message
    };
  } catch (error) {
    console.error("Error bulk assigning students to BPA level:", error);
    return { success: false, error: "Failed to assign students to level" };
  }
}

/**
 * Remove a student's BPA level assignment for a specific semester
 */
export async function removeStudentBPALevelAssignment(
  userId: string,
  campusId: string,
  timeframeId: string,
  season: BPASeason
): Promise<AssignmentResult> {
  try {
    await requireAdminOrSubAdminAccess();
    // Verify assignment exists
    const assignment = await prisma.bPAUserLevelAssignment.findUnique({
      where: {
        userId_timeframeId_season: {
          userId,
          timeframeId,
          season,
        },
      },
      include: {
        user: {
          select: { campusId: true },
        },
        semester: {
          select: { id: true },
        },
      },
    });

    if (!assignment) {
      return { success: false, error: "Assignment not found" };
    }

    if (assignment.user.campusId !== campusId) {
      return { success: false, error: "Student does not belong to this campus" };
    }

    // Create history record before deletion
    await prisma.bPAUserLevelAssignmentHistory.create({
      data: {
        userId,
        semesterId: assignment.semester?.id,
        timeframeId,
        season,
        bpaLevelId: assignment.bpaLevelId,
        action: BPAAssignmentAction.DELETED,
        assignedBy: assignment.assignedBy,
      },
    });

    // Delete assignment
    await prisma.bPAUserLevelAssignment.delete({
      where: {
        userId_timeframeId_season: {
          userId,
          timeframeId,
          season,
        },
      },
    });

    revalidatePath(`/admin/campuses/${campusId}`);
    return { success: true };
  } catch (error) {
    console.error("Error removing BPA level assignment:", error);
    return { success: false, error: "Failed to remove assignment" };
  }
}
