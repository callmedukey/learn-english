import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/prisma/prisma-client";

const nicknameSchema = z.object({
  nickname: z
    .string()
    .min(3, "닉네임은 최소 3자 이상이어야 합니다")
    .max(8, "닉네임은 최대 8자까지 가능합니다")
    .regex(/^[a-z0-9]+$/, "닉네임은 영문 소문자와 숫자만 사용 가능합니다"),
});

export async function PATCH(request: Request) {
  const payload = await verifyMobileToken(request);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.sub;

  try {
    const body = await request.json();
    const { nickname } = nicknameSchema.parse(body);

    // Check if nickname is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        nickname,
        id: { not: userId },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "이미 사용 중인 닉네임입니다" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { nickname },
    });

    return NextResponse.json({ success: true, nickname });
  } catch (error) {
    console.error("[Nickname Update] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "닉네임 변경에 실패했습니다" },
      { status: 500 }
    );
  }
}
