import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { Prisma } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has payment access during maintenance
    const { hasPaymentAccessByEmail } = await import("@/lib/utils/payment-access");
    if (!hasPaymentAccessByEmail(session.user.email!)) {
      return NextResponse.json(
        { error: "Payment system is under maintenance" },
        { status: 503 }
      );
    }

    // Get user with country information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { country: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const isKoreanUser = user.country?.name === "South Korea";

    if (isKoreanUser) {
      // For Korean users, we can't just disable auto-renewal
      // They must cancel the entire subscription
      return NextResponse.json(
        { 
          error: "Korean subscriptions cannot disable auto-renewal. Please cancel your subscription instead.",
          code: "KOREAN_USER_MUST_CANCEL" 
        },
        { status: 400 }
      );
    }

    // For international users, just remove billing info (though they shouldn't have any)
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        billingKey: null,
        billingAuthKey: null,
        billingKeyIssuedAt: null,
        billingMethod: null,
        cardInfo: Prisma.JsonNull,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment method removed successfully",
    });
  } catch (error) {
    console.error("Remove billing key error:", error);
    return NextResponse.json(
      { error: "Failed to remove payment method" },
      { status: 500 }
    );
  }
}