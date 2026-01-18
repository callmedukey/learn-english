import { NextRequest, NextResponse } from "next/server";

import { getStudentAssignmentHistory } from "@/app/(after-auth)/admin/campuses/[campusId]/queries/assignment-history.query";
import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campusId: string; studentId: string }> }
) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUB_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId } = await params;

    // Fetch history from database
    const history = await getStudentAssignmentHistory(studentId);

    return NextResponse.json({ history }, { status: 200 });
  } catch (error) {
    console.error("Error fetching student assignment history:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignment history" },
      { status: 500 }
    );
  }
}
