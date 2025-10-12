"server only";

import { BPAAssignmentAction, BPASeason } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export interface AssignmentHistoryRecord {
  id: string;
  action: BPAAssignmentAction;
  bpaLevel: {
    id: string;
    name: string;
    stars: number;
  };
  semester: {
    id: string;
    startDate: Date;
    endDate: Date;
  } | null;
  timeframe: {
    id: string;
    year: number;
    startDate: Date;
    endDate: Date;
  };
  season: BPASeason;
  assignedBy: string | null;
  assignedByUser: {
    name: string | null;
    email: string;
  } | null;
  createdAt: Date;
}

/**
 * Get assignment history for a specific student
 * Returns all historical assignment records sorted by date (newest first)
 */
export async function getStudentAssignmentHistory(
  userId: string
): Promise<AssignmentHistoryRecord[]> {
  try {
    const history = await prisma.bPAUserLevelAssignmentHistory.findMany({
      where: {
        userId,
      },
      include: {
        semester: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
          },
        },
        bpaLevel: {
          select: {
            id: true,
            name: true,
            stars: true,
          },
        },
        timeframe: {
          select: {
            id: true,
            year: true,
            startDate: true,
            endDate: true,
          },
        },
        assignedByUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return history.map((record) => ({
      id: record.id,
      action: record.action,
      bpaLevel: record.bpaLevel,
      semester: record.semester,
      timeframe: record.timeframe,
      season: record.season,
      assignedBy: record.assignedBy,
      assignedByUser: record.assignedByUser,
      createdAt: record.createdAt,
    }));
  } catch (error) {
    console.error("Error fetching student assignment history:", error);
    return [];
  }
}

/**
 * Get recent assignment history for a specific student (last N records)
 */
export async function getRecentAssignmentHistory(
  userId: string,
  limit = 5
): Promise<AssignmentHistoryRecord[]> {
  try {
    const history = await prisma.bPAUserLevelAssignmentHistory.findMany({
      where: {
        userId,
      },
      include: {
        semester: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
          },
        },
        bpaLevel: {
          select: {
            id: true,
            name: true,
            stars: true,
          },
        },
        timeframe: {
          select: {
            id: true,
            year: true,
            startDate: true,
            endDate: true,
          },
        },
        assignedByUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return history.map((record) => ({
      id: record.id,
      action: record.action,
      bpaLevel: record.bpaLevel,
      semester: record.semester,
      timeframe: record.timeframe,
      season: record.season,
      assignedBy: record.assignedBy,
      assignedByUser: record.assignedByUser,
      createdAt: record.createdAt,
    }));
  } catch (error) {
    console.error("Error fetching recent assignment history:", error);
    return [];
  }
}
