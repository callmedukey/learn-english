import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { Prisma, Role } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export async function GET(request: NextRequest) {
  const session = await auth();

  // Allow both ADMIN and SUB_ADMIN to search users
  if (
    !session?.user ||
    (session.user.role !== Role.ADMIN && session.user.role !== Role.SUB_ADMIN)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q")?.trim();
  const excludeCampusId = searchParams.get("excludeCampusId");

  if (!query || query.length < 2) {
    return NextResponse.json({ users: [] });
  }

  try {
    // Build where clause
    const whereClause: Prisma.UserWhereInput = {
      role: Role.USER, // Only search regular users, not admins
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { nickname: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    };

    // Exclude users already in the specified campus
    if (excludeCampusId) {
      whereClause.campusId = { not: excludeCampusId };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        campusId: true,
        campus: {
          select: { name: true },
        },
      },
      take: 20, // Limit results
      orderBy: { nickname: "asc" },
    });

    // Format the response - prefer nickname over name
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.nickname || user.name || user.email,
      email: user.email,
      currentCampus: user.campus?.name || null,
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error("[Admin User Search] Error:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
