import { NextResponse } from "next/server";

import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/prisma/prisma-client";

export interface MobileCampusEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startDate: string; // ISO string for mobile
  endDate: string;
  allDay: boolean;
  color: string;
}

export async function GET(request: Request) {
  const payload = await verifyMobileToken(request);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.sub;

  try {
    // Get user's campus
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { campusId: true },
    });

    if (!user?.campusId) {
      return NextResponse.json({
        events: [],
        hasCampusAccess: false,
      });
    }

    // Fetch campus events
    const events = await prisma.campusEvent.findMany({
      where: { campusId: user.campusId },
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

    // Transform to mobile-friendly format (ISO strings)
    const transformedEvents: MobileCampusEvent[] = events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      allDay: event.allDay,
      color: event.color,
    }));

    return NextResponse.json({
      events: transformedEvents,
      hasCampusAccess: true,
    });
  } catch (error) {
    console.error("Campus Events API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch campus events" },
      { status: 500 }
    );
  }
}
