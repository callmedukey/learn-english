import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma-client";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { subscriptionId, autoRenew } = await request.json();

    if (!subscriptionId || typeof autoRenew !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Verify the subscription belongs to the user
    const subscription = await prisma.userSubscription.findFirst({
      where: {
        id: subscriptionId,
        userId: session.user.id,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Check if user has a billing key if enabling auto-renew
    if (autoRenew) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { billingKey: true },
      });

      if (!user?.billingKey) {
        return NextResponse.json(
          { error: "No payment method registered" },
          { status: 400 }
        );
      }
    }

    // Update subscription
    const updatedSubscription = await prisma.userSubscription.update({
      where: { id: subscriptionId },
      data: {
        autoRenew,
        recurringStatus: autoRenew ? "ACTIVE" : "INACTIVE",
        // Set next billing date if enabling
        nextBillingDate: autoRenew ? subscription.endDate : null,
      },
    });

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error("Auto-renew update error:", error);
    return NextResponse.json(
      { error: "Failed to update auto-renewal" },
      { status: 500 }
    );
  }
}