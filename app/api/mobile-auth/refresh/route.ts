import { jwtVerify, SignJWT } from "jose";
import { NextResponse } from "next/server";

import { SubscriptionStatus } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);

export async function POST(request: Request) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token required" },
        { status: 400 }
      );
    }

    const { payload } = await jwtVerify(refreshToken, JWT_SECRET);

    if (payload.type !== "refresh") {
      return NextResponse.json(
        { error: "Invalid token type" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub as string },
      include: {
        subscriptions: { include: { plan: true } },
        country: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    const now = new Date();
    const activeSubscriptions = user.subscriptions.filter(
      (sub) => sub.status === SubscriptionStatus.ACTIVE && sub.endDate > now
    );
    const hasPaidSubscription = activeSubscriptions.length > 0;

    const accessToken = await new SignJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
      nickname: user.nickname,
      hasPaidSubscription,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    return NextResponse.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        role: user.role,
        gender: user.gender,
        birthday: user.birthday,
        country: user.country?.name || user.countryId,
        campusId: user.campusId,
        hasPaidSubscription,
      },
    });
  } catch (error) {
    console.error("Mobile auth refresh error:", error);
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}
