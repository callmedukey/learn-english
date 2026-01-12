import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/prisma/prisma-client";

const unregisterTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export async function POST(request: Request) {
  const payload = await verifyMobileToken(request);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.sub;

  try {
    const body = await request.json();
    const parsed = unregisterTokenSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { token } = parsed.data;

    // Mark token as inactive (soft delete) - only for the authenticated user
    await prisma.deviceToken.updateMany({
      where: {
        userId,
        token,
      },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Push Unregister] Error:", error);
    return NextResponse.json(
      { error: "Failed to unregister push token" },
      { status: 500 }
    );
  }
}
