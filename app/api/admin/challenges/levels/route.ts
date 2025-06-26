import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma-client";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");

  if (!type || !["AR", "RC"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  try {
    if (type === "AR") {
      const levels = await prisma.aR.findMany({
        orderBy: { stars: "asc" },
      });
      return NextResponse.json(levels);
    } else {
      const levels = await prisma.rCLevel.findMany({
        orderBy: { stars: "asc" },
      });
      return NextResponse.json(levels);
    }
  } catch (error) {
    console.error("Failed to fetch levels:", error);
    return NextResponse.json(
      { error: "Failed to fetch levels" },
      { status: 500 }
    );
  }
}