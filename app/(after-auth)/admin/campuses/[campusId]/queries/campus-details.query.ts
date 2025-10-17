"server only";

import { BPASeason } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export interface CampusStudent {
  id: string;
  name: string | null;
  studentName: string | null;
  email: string;
  nickname: string | null;
  role: string;
  createdAt: Date;
  allAssignments: Array<{
    id: string;
    bpaLevelId: string;
    semesterId: string | null;
    timeframeId: string;
    season: BPASeason;
    semester: {
      id: string;
      startDate: Date;
      endDate: Date;
    } | null;
    bpaLevel: {
      id: string;
      name: string;
      stars: number;
    };
    timeframe: {
      id: string;
      year: number;
      startDate: Date;
      endDate: Date;
    };
    assignedAt: Date;
    assignedBy: string | null;
  }>;
}

export interface CampusDetailsData {
  campus: {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    studentCount: number;
  };
  students: CampusStudent[];
}

/**
 * Get campus details with students and ALL their BPA level assignments
 */
export async function getCampusWithStudents(
  campusId: string
): Promise<CampusDetailsData | null> {
  try {
    // Get campus info
    const campus = await prisma.campus.findUnique({
      where: { id: campusId },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!campus) {
      return null;
    }

    // Get all students in this campus with ALL their assignments
    const students = await prisma.user.findMany({
      where: {
        campusId,
        role: "USER", // Only regular users, not admins
      },
      select: {
        id: true,
        name: true,
        studentName: true,
        email: true,
        nickname: true,
        role: true,
        createdAt: true,
        bpaLevelAssignments: {
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
          },
          orderBy: [
            { timeframe: { year: "desc" } },
            { season: "asc" },
          ],
        },
      },
      orderBy: [
        { name: "asc" },
        { email: "asc" },
      ],
    });

    // Transform students data
    const transformedStudents: CampusStudent[] = students.map((student) => ({
      id: student.id,
      name: student.name,
      studentName: student.studentName,
      email: student.email,
      nickname: student.nickname,
      role: student.role,
      createdAt: student.createdAt,
      allAssignments: student.bpaLevelAssignments.map((assignment) => ({
        id: assignment.id,
        bpaLevelId: assignment.bpaLevelId,
        semesterId: assignment.semesterId,
        timeframeId: assignment.timeframeId,
        season: assignment.season,
        semester: assignment.semester,
        bpaLevel: assignment.bpaLevel,
        timeframe: assignment.timeframe,
        assignedAt: assignment.assignedAt,
        assignedBy: assignment.assignedBy,
      })),
    }));

    return {
      campus: {
        id: campus.id,
        name: campus.name,
        createdAt: campus.createdAt,
        updatedAt: campus.updatedAt,
        studentCount: campus._count.users,
      },
      students: transformedStudents,
    };
  } catch (error) {
    console.error("Error fetching campus with students:", error);
    return null;
  }
}

/**
 * Get all BPA levels for selection
 */
export async function getBPALevelsForAssignment() {
  return await prisma.bPALevel.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      stars: true,
      orderNumber: true,
    },
    orderBy: {
      orderNumber: "asc",
    },
  });
}

/**
 * Get all timeframes for selection
 */
export async function getTimeframesForAssignment() {
  return await prisma.bPATimeframe.findMany({
    select: {
      id: true,
      year: true,
      startDate: true,
      endDate: true,
    },
    orderBy: {
      startDate: "desc",
    },
  });
}
