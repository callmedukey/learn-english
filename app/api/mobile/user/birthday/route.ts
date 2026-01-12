import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/prisma/prisma-client";

const birthdaySchema = z.object({
  birthday: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "유효하지 않은 날짜 형식입니다",
  }),
});

export async function PATCH(request: Request) {
  const payload = await verifyMobileToken(request);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.sub;

  try {
    const body = await request.json();
    const { birthday } = birthdaySchema.parse(body);

    // Get current user to check if birthday is already set
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { birthday: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Can only set birthday once
    if (user.birthday) {
      return NextResponse.json(
        { error: "생년월일은 한 번 설정하면 변경할 수 없습니다" },
        { status: 400 }
      );
    }

    const birthdayDate = new Date(birthday);

    // Validate the date is reasonable (not in the future, not too old)
    const now = new Date();
    const minDate = new Date(1950, 0, 1);

    if (birthdayDate > now) {
      return NextResponse.json(
        { error: "생년월일은 미래 날짜일 수 없습니다" },
        { status: 400 }
      );
    }

    if (birthdayDate < minDate) {
      return NextResponse.json(
        { error: "유효하지 않은 생년월일입니다" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { birthday: birthdayDate },
    });

    return NextResponse.json({
      success: true,
      birthday: birthdayDate.toISOString(),
    });
  } catch (error) {
    console.error("[Birthday Update] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "생년월일 설정에 실패했습니다" },
      { status: 500 }
    );
  }
}
