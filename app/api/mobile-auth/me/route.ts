import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

import { SubscriptionStatus } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

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

    return NextResponse.json({
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
        hasPaidSubscription: activeSubscriptions.length > 0,
      },
    });
  } catch (error) {
    console.error("Mobile auth me error:", error);
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}
