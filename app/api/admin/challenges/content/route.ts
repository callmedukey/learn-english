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
  const levelId = searchParams.get("levelId");

  if (!type || !levelId || !["AR", "RC"].includes(type)) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  try {
    if (type === "AR") {
      const novels = await prisma.novel.findMany({
        where: { ARId: levelId },
        orderBy: { title: "asc" },
        select: { id: true, title: true },
      });
      return NextResponse.json(novels);
    } else {
      const keywords = await prisma.rCKeyword.findMany({
        where: { rcLevelId: levelId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      });
      return NextResponse.json(keywords);
    }
  } catch (error) {
    console.error("Failed to fetch content:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}