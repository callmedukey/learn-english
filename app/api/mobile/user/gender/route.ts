import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/prisma/prisma-client";

const genderSchema = z.object({
  gender: z.enum(["Male", "Female", "Other"]),
});

export async function PATCH(request: Request) {
  const payload = await verifyMobileToken(request);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.sub;

  try {
    const body = await request.json();
    const { gender } = genderSchema.parse(body);

    // Get current user to check if they can update gender
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { gender: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Can only change gender if not set or if current value is "Other"
    if (user.gender && user.gender !== "Other") {
      return NextResponse.json(
        { error: "성별은 한 번 설정하면 변경할 수 없습니다" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { gender },
    });

    return NextResponse.json({ success: true, gender });
  } catch (error) {
    console.error("[Gender Update] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "유효하지 않은 성별입니다" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "성별 변경에 실패했습니다" },
      { status: 500 }
    );
  }
}
