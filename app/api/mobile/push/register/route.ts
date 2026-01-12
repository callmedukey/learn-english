import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyMobileToken } from "@/lib/mobile-auth";
import { DevicePlatform } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

const registerTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
  platform: z.enum(["IOS", "ANDROID"]),
  deviceModel: z.string().optional(),
  osVersion: z.string().optional(),
  appVersion: z.string().optional(),
});

export async function POST(request: Request) {
  const payload = await verifyMobileToken(request);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.sub;

  try {
    const body = await request.json();
    const parsed = registerTokenSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { token, platform, deviceModel, osVersion, appVersion } = parsed.data;

    // Upsert device token - update if exists, create if not
    await prisma.deviceToken.upsert({
      where: { token },
      update: {
        userId,
        platform: platform as DevicePlatform,
        deviceModel,
        osVersion,
        appVersion,
        isActive: true,
        lastUsedAt: new Date(),
      },
      create: {
        userId,
        token,
        platform: platform as DevicePlatform,
        deviceModel,
        osVersion,
        appVersion,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Push Register] Error:", error);
    return NextResponse.json(
      { error: "Failed to register push token" },
      { status: 500 }
    );
  }
}
