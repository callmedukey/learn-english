import { compare } from "bcryptjs";
import { SignJWT } from "jose";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { rateLimitLogin } from "@/lib/redis/rate-limiter";
import { signInSchema } from "@/lib/schemas/auth.schema";
import { SubscriptionStatus } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);

export async function POST(request: Request) {
  try {
    // Get IP for rate limiting
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

    // Check rate limit
    const rateLimitResult = await rateLimitLogin(ip);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many login attempts" },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.resetInSeconds.toString(),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const body = await request.json();
    const parsed = signInSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        subscriptions: { include: { plan: true } },
        country: true,
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    const passwordsMatch = await compare(password, user.password);

    if (!passwordsMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check subscription status
    const now = new Date();
    const activeSubscriptions = user.subscriptions.filter(
      (sub) => sub.status === SubscriptionStatus.ACTIVE && sub.endDate > now
    );
    const hasPaidSubscription = activeSubscriptions.length > 0;

    // Create JWT token (7 days expiry, same as NextAuth config)
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

    // Create refresh token (30 days)
    const refreshToken = await new SignJWT({
      sub: user.id,
      type: "refresh",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .sign(JWT_SECRET);

    return NextResponse.json({
      accessToken,
      refreshToken,
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
    console.error("Mobile auth login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
