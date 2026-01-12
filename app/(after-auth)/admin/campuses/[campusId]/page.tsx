import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { isFullAdmin } from "@/lib/utils/admin-route-protection";
import { Role } from "@/prisma/generated/prisma";

import CampusEventCalendar from "./components/campus-event-calendar";
import CampusStudentsTable from "./components/campus-students-table";
import {
  getBPALevelsForAssignment,
  getCampusWithStudents,
  getTimeframesForAssignment,
} from "./queries/campus-details.query";
import { getCampusEvents } from "./queries/campus-events.query";

interface CampusDetailsPageProps {
  params: Promise<{
    campusId: string;
  }>;
  searchParams: Promise<{
    timeframeId?: string;
    season?: string;
  }>;
}

const CampusDetailsPage = async ({
  params,
  searchParams,
}: CampusDetailsPageProps) => {
  const session = await auth();

  // Allow both ADMIN and SUB_ADMIN
  if (
    !session?.user ||
    (session.user.role !== Role.ADMIN && session.user.role !== Role.SUB_ADMIN)
  ) {
    return notFound();
  }

  const userIsFullAdmin = isFullAdmin(session.user.role);
  const { campusId } = await params;
  const { timeframeId, season } = await searchParams;

  // Fetch campus data with students (only for full admins)
  const campusData = userIsFullAdmin
    ? await getCampusWithStudents(campusId)
    : null;

  // For sub-admins, just verify the campus exists
  if (!userIsFullAdmin) {
    const { prisma } = await import("@/prisma/prisma-client");
    const campus = await prisma.campus.findUnique({
      where: { id: campusId },
      select: { id: true, name: true },
    });
    if (!campus) {
      return notFound();
    }

    // Sub-admin view: Only calendar events
    const campusEvents = await getCampusEvents(campusId);

    return (
      <div className="container mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin/campuses">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Campuses
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{campus.name}</h1>
              <p className="text-gray-600">Manage Campus Calendar</p>
            </div>
          </div>
        </div>

        {/* Campus Calendar - Only section available to sub-admins */}
        <div className="rounded-lg border p-4">
          <h2 className="mb-4 text-xl font-semibold">Campus Calendar</h2>
          <CampusEventCalendar campusId={campusId} events={campusEvents} />
        </div>
      </div>
    );
  }

  // Full admin view
  if (!campusData) {
    return notFound();
  }

  // Fetch BPA levels, timeframes, and campus events
  const [bpaLevels, timeframes, campusEvents] = await Promise.all([
    getBPALevelsForAssignment(),
    getTimeframesForAssignment(),
    getCampusEvents(campusId),
  ]);

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/campuses">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Campuses
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{campusData.campus.name}</h1>
            <p className="text-gray-600">
              {campusData.campus.studentCount} students • Manage BPA Level
              Assignments
            </p>
          </div>
        </div>
      </div>

      {/* Campus Calendar */}
      <div className="rounded-lg border p-4">
        <h2 className="mb-4 text-xl font-semibold">Campus Calendar</h2>
        <CampusEventCalendar campusId={campusId} events={campusEvents} />
      </div>

      {/* Campus Students Table */}
      <CampusStudentsTable
        campusId={campusId}
        students={campusData.students}
        bpaLevels={bpaLevels}
        timeframes={timeframes}
        currentTimeframeId={timeframeId}
        currentSeason={season as any}
        adminUserId={session.user.id}
      />
    </div>
  );
};

export default CampusDetailsPage;
