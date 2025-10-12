import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";

import CampusStudentsTable from "./components/campus-students-table";
import {
  getBPALevelsForAssignment,
  getCampusWithStudents,
  getTimeframesForAssignment,
} from "./queries/campus-details.query";

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
  if (!session?.user || session.user.role !== "ADMIN") {
    return notFound();
  }

  const { campusId } = await params;
  const { timeframeId, season } = await searchParams;

  // Fetch campus data with students
  const campusData = await getCampusWithStudents(campusId);

  if (!campusData) {
    return notFound();
  }

  // Fetch BPA levels and timeframes for assignment
  const [bpaLevels, timeframes] = await Promise.all([
    getBPALevelsForAssignment(),
    getTimeframesForAssignment(),
  ]);

  return (
    <div className="container mx-auto p-6 space-y-6">
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
              {campusData.campus.studentCount} students • Manage BPA Level Assignments
            </p>
          </div>
        </div>
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
