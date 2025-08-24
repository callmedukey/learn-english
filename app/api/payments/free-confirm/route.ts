import { NextRequest, NextResponse } from "next/server";

import { hasPaymentAccess } from "@/lib/utils/payment-access";
import { prisma } from "@/prisma/prisma-client";

export async function GET(request: NextRequest) {
  try {
    // Check if user has payment access during maintenance
    const hasAccess = await hasPaymentAccess();
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Payment system is under maintenance" },
        { status: 503 },
      );
    }
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get("orderId");
    const userId = searchParams.get("userId");

    if (!orderId || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 },
      );
    }

    // Find the payment record
    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: {
        plan: true,
        subscription: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 },
      );
    }

    // Verify the payment belongs to the user
    if (payment.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    // Verify this was a free subscription
    if (payment.amount !== 0 || payment.method !== "COUPON") {
      return NextResponse.json(
        { success: false, error: "Invalid free subscription" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      payment: {
        orderId: payment.orderId,
        planName: payment.plan.name,
        couponCode: payment.couponCode || "UNKNOWN",
        originalAmount: payment.originalAmount || 0,
        discountAmount: payment.discountAmount || 0,
        endDate: payment.subscription?.endDate || new Date(),
      },
    });
  } catch (error) {
    console.error("Free payment confirmation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}