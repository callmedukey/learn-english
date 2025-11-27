"server only";

import { prisma } from "@/prisma/prisma-client";

export interface CampusEventData {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  color: string;
}

/**
 * Get all events for a student's campus
 */
export async function getCampusEventsForStudent(
  campusId: string
): Promise<CampusEventData[]> {
  try {
    const events = await prisma.campusEvent.findMany({
      where: { campusId },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        startDate: true,
        endDate: true,
        allDay: true,
        color: true,
      },
      orderBy: { startDate: "asc" },
    });

    return events;
  } catch (error) {
    console.error("Error fetching campus events for student:", error);
    return [];
  }
}
