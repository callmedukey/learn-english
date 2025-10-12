import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/prisma/prisma-client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const levelId = searchParams.get("levelId");

    if (!levelId) {
      return NextResponse.json(
        { error: "levelId is required" },
        { status: 400 }
      );
    }

    // Fetch all units for novels in this BPA level
    const units = await prisma.bPAUnit.findMany({
      where: {
        novel: {
          bpaLevelId: levelId,
        },
      },
      select: {
        id: true,
        name: true,
        orderNumber: true,
      },
      orderBy: {
        orderNumber: "asc",
      },
      distinct: ["name"], // Get unique unit names across novels
    });

    return NextResponse.json({ units });
  } catch (error) {
    console.error("Error fetching BPA units:", error);
    return NextResponse.json(
      { error: "Failed to fetch units" },
      { status: 500 }
    );
  }
}
