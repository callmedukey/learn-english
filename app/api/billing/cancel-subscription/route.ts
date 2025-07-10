import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma-client";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get active subscription
    const activeSubscription = await prisma.userSubscription.findFirst({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
      include: {
        user: {
          include: {
            country: true,
          },
        },
      },
    });

    if (!activeSubscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    const isKoreanUser = activeSubscription.user.country?.name === "South Korea";

    // Cancel the subscription
    const updatedSubscription = await prisma.userSubscription.update({
      where: { id: activeSubscription.id },
      data: {
        // Korean users can cancel but subscription remains active until end date
        recurringStatus: "CANCELLED",
        autoRenew: false,
        nextBillingDate: null,
        // Subscription remains active until the end date
        status: "ACTIVE",
      },
    });

    // Log the cancellation
    await prisma.billingHistory.create({
      data: {
        userId: session.user.id,
        subscriptionId: activeSubscription.id,
        billingKey: activeSubscription.user.billingKey || "",
        amount: 0,
        status: "CANCELLED",
        errorMessage: isKoreanUser 
          ? "Korean user cancelled subscription - will not renew" 
          : "International user cancelled subscription",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled successfully. You can continue using the service until " + 
        new Date(updatedSubscription.endDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long", 
          day: "numeric"
        }) + ". Auto-renewal has been disabled.",
      subscription: {
        endDate: updatedSubscription.endDate,
        status: updatedSubscription.status,
        recurringStatus: updatedSubscription.recurringStatus,
      },
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}