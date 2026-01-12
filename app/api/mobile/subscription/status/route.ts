import { NextResponse } from "next/server";

import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/prisma/prisma-client";

interface SubscriptionStatusResponse {
  hasActiveSubscription: boolean;
  subscription: {
    id: string;
    status: string;
    planName: string;
    planDuration: number;
    startDate: string;
    endDate: string;
    daysRemaining: number;
    isTrialPeriod: boolean;
    autoRenew: boolean;
    paymentSource: string;
    storeProductId: string | null;
  } | null;
  availablePlans: {
    id: string;
    name: string;
    price: number;
    priceUSD: number | null;
    duration: number;
    description: string | null;
  }[];
}

export async function GET(request: Request): Promise<NextResponse<SubscriptionStatusResponse | { error: string }>> {
  const payload = await verifyMobileToken(request);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.sub;

  try {
    // Get active subscription for user
    const activeSubscription = await prisma.userSubscription.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        endDate: {
          gt: new Date(),
        },
      },
      include: {
        plan: true,
      },
      orderBy: {
        endDate: "desc",
      },
    });

    // Get available plans
    const availablePlans = await prisma.plan.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
      select: {
        id: true,
        name: true,
        price: true,
        priceUSD: true,
        duration: true,
        description: true,
      },
    });

    if (!activeSubscription) {
      return NextResponse.json({
        hasActiveSubscription: false,
        subscription: null,
        availablePlans,
      });
    }

    // Calculate days remaining
    const now = new Date();
    const endDate = new Date(activeSubscription.endDate);
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return NextResponse.json({
      hasActiveSubscription: true,
      subscription: {
        id: activeSubscription.id,
        status: activeSubscription.status,
        planName: activeSubscription.plan.name,
        planDuration: activeSubscription.plan.duration,
        startDate: activeSubscription.startDate.toISOString(),
        endDate: activeSubscription.endDate.toISOString(),
        daysRemaining,
        isTrialPeriod: activeSubscription.isTrialPeriod,
        autoRenew: activeSubscription.autoRenew,
        paymentSource: activeSubscription.paymentSource,
        storeProductId: activeSubscription.storeProductId,
      },
      availablePlans,
    });
  } catch (error) {
    console.error("[Subscription Status] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 }
    );
  }
}
