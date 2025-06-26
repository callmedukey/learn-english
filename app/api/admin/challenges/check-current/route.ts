import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma-client";
import { getCurrentKoreaYearMonth } from "@/server-queries/medals";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const levelType = searchParams.get("levelType");
    const levelId = searchParams.get("levelId");

    if (!levelType || !levelId) {
      return NextResponse.json(
        { error: "Missing levelType or levelId" },
        { status: 400 }
      );
    }

    const { year, month } = getCurrentKoreaYearMonth();

    const challenge = await prisma.monthlyChallenge.findUnique({
      where: {
        year_month_levelType_levelId: {
          year,
          month,
          levelType: levelType as "AR" | "RC",
          levelId,
        },
      },
      select: {
        id: true,
        novelIds: true,
        keywordIds: true,
        active: true,
      },
    });

    return NextResponse.json({
      exists: !!challenge,
      challenge: challenge || null,
    });
  } catch (error) {
    console.error("Failed to check current challenge:", error);
    return NextResponse.json(
      { error: "Failed to check current challenge" },
      { status: 500 }
    );
  }
}