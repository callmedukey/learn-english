import { NextResponse } from "next/server";

import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/prisma/prisma-client";

interface UserSettingsResponse {
  nickname: string;
  email: string;
  gender: string | null;
  birthday: string | null;
  hasCredentials: boolean;
}

export async function GET(request: Request): Promise<NextResponse<UserSettingsResponse | { error: string }>> {
  const payload = await verifyMobileToken(request);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.sub;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        nickname: true,
        email: true,
        gender: true,
        birthday: true,
        password: true, // Check if has credentials
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      nickname: user.nickname || "",
      email: user.email || "",
      gender: user.gender,
      birthday: user.birthday?.toISOString() || null,
      hasCredentials: !!user.password,
    });
  } catch (error) {
    console.error("[User Settings] Error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}
