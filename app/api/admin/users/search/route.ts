import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { Role } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ users: [] });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        role: Role.USER, // Only search regular users, not admins
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { nickname: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
      },
      take: 20, // Limit results
      orderBy: { nickname: "asc" },
    });

    // Format the response - prefer nickname over name
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.nickname || user.name || user.email,
      email: user.email,
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
