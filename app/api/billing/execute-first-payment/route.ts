import * as crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma-client";

const TOSS_CLIENT_SECRET = process.env.TOSS_CLIENT_SECRET;
const BILLING_KEY_ENCRYPTION_KEY = process.env.BILLING_KEY_ENCRYPTION_KEY;

if (!TOSS_CLIENT_SECRET || !BILLING_KEY_ENCRYPTION_KEY) {
  throw new Error("Missing required environment variables");
}

// Decryption setup
const algorithm = "aes-256-gcm";
const key = Buffer.from(BILLING_KEY_ENCRYPTION_KEY, "hex");

function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 },
      );
    }

    // Get the pending payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        plan: true,
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
            billingKey: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json(
        { error: "Payment already processed" },
        { status: 400 },
      );
    }

    if (!payment.user.billingKey) {
      return NextResponse.json(
        { error: "No billing key found" },
        { status: 400 },
      );
    }

    // Decrypt billing key
    const billingKey = decrypt(payment.user.billingKey);

    // Execute payment using billing key
    const response = await fetch(
      `https://api.tosspayments.com/v1/billing/${billingKey}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(TOSS_CLIENT_SECRET + ":").toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerKey: payment.user.id,
          amount: payment.amount,
          orderId: payment.orderId,
          orderName: payment.orderName,
          customerEmail: payment.user.email,
          customerName:
            payment.user.nickname || payment.user.email.split("@")[0],
        }),
      },
    );

    const paymentResult = await response.json();

    if (!response.ok) {
      console.error("Toss payment error:", paymentResult);
      return NextResponse.json(
        { error: paymentResult.message || "Payment failed" },
        { status: 400 },
      );
    }

    // Update payment record
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "PAID",
        paymentKey: paymentResult.paymentKey,
        method: paymentResult.method || "CARD",
        approvedAt: new Date(paymentResult.approvedAt),
        tossResponse: paymentResult,
        billingKey: payment.user.billingKey,
        paymentType: "INITIAL_SUBSCRIPTION",
      },
    });

    // Create subscription
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + payment.plan.duration);

    const nextBillingDate = new Date(endDate);

    const subscription = await prisma.userSubscription.create({
      data: {
        userId: payment.userId,
        planId: payment.planId,
        paymentId: payment.id,
        startDate: new Date(),
        endDate,
        autoRenew: true, // Korean users always have auto-renew
        status: "ACTIVE",
        recurringStatus: "ACTIVE",
        nextBillingDate,
        billingKey: payment.user.billingKey,
      },
    });

    // Log billing history
    await prisma.billingHistory.create({
      data: {
        userId: payment.userId,
        subscriptionId: subscription.id,
        billingKey: payment.user.billingKey,
        amount: payment.amount,
        status: "SUCCESS",
      },
    });

    return NextResponse.json({
      success: true,
      orderId: payment.orderId,
      paymentKey: paymentResult.paymentKey,
    });
  } catch (error) {
    console.error("Execute first payment error:", error);
    return NextResponse.json(
      { error: "Failed to execute payment" },
      { status: 500 },
    );
  }
}
