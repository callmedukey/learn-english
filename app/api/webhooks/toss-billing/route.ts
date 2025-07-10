import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { 
  verifyTossWebhookSignature, 
  parseTossWebhookEvent,
  TOSS_WEBHOOK_EVENTS 
} from "@/lib/utils/toss-webhook";
import { prisma } from "@/prisma/prisma-client";

interface TossWebhookEvent {
  eventType: string;
  timestamp: string;
  data: {
    paymentKey: string;
    orderId: string;
    status: string;
    amount: number;
    method?: string;
    approvedAt?: string;
    billingKey?: string;
    customerKey?: string;
    card?: {
      number: string;
      company: string;
      cardType: string;
    };
    failure?: {
      code: string;
      message: string;
    };
  };
}


async function handlePaymentDone(data: TossWebhookEvent["data"]) {
  console.log("[Webhook] Payment done:", data.orderId);
  
  // Update payment status if not already updated
  const payment = await prisma.payment.findUnique({
    where: { orderId: data.orderId },
  });

  if (payment && payment.status !== "PAID") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        paymentKey: data.paymentKey,
        method: data.method || "CARD",
        approvedAt: data.approvedAt ? new Date(data.approvedAt) : new Date(),
        tossResponse: data as any,
      },
    });
  }
}

async function handlePaymentFailed(data: TossWebhookEvent["data"]) {
  console.log("[Webhook] Payment failed:", data.orderId);
  
  const payment = await prisma.payment.findUnique({
    where: { orderId: data.orderId },
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        failureCode: data.failure?.code,
        failureReason: data.failure?.message,
        tossResponse: data as any,
      },
    });

    // If this was a recurring payment, update billing history
    if (payment.paymentType === "RECURRING" && payment.billingKey) {
      await prisma.billingHistory.create({
        data: {
          userId: payment.userId,
          subscriptionId: payment.id, // This should be the subscription ID in a real scenario
          billingKey: payment.billingKey,
          amount: payment.amount,
          status: "FAILED",
          errorCode: data.failure?.code,
          errorMessage: data.failure?.message,
        },
      });
    }
  }
}

async function handleBillingKeyIssued(data: TossWebhookEvent["data"]) {
  console.log("[Webhook] Billing key issued:", data.customerKey);
  
  if (!data.customerKey || !data.billingKey) {
    console.error("Missing customer key or billing key");
    return;
  }

  try {
    // Encrypt the billing key
    const BILLING_KEY_ENCRYPTION_KEY = process.env.BILLING_KEY_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(BILLING_KEY_ENCRYPTION_KEY, 'hex');
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data.billingKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    const encryptedBillingKey = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;

    // Update user's billing key
    await prisma.user.update({
      where: { id: data.customerKey },
      data: {
        billingKey: encryptedBillingKey,
        billingKeyIssuedAt: new Date(),
        billingMethod: data.method || "CARD",
        cardInfo: data.card ? {
          last4: data.card.number?.slice(-4) || "",
          issuer: data.card.company || "",
          cardType: data.card.cardType || "",
        } : undefined,
      },
    });

    // Update active subscriptions to enable recurring
    await prisma.userSubscription.updateMany({
      where: {
        userId: data.customerKey,
        status: "ACTIVE",
        autoRenew: false,
      },
      data: {
        autoRenew: true,
        recurringStatus: "ACTIVE",
        billingKey: encryptedBillingKey,
      },
    });

    console.log(`Billing key stored for user ${data.customerKey}`);
  } catch (error) {
    console.error("Failed to store billing key:", error);
  }
}

async function handleBillingKeyUpdated(data: TossWebhookEvent["data"]) {
  console.log("[Webhook] Billing key updated:", data.customerKey);
  
  // Log the update for monitoring
  if (data.customerKey) {
    console.log(`Billing key updated for user ${data.customerKey}`);
  }
}

async function handleBillingKeyRemoved(data: TossWebhookEvent["data"]) {
  console.log("[Webhook] Billing key removed:", data.customerKey);
  
  if (!data.customerKey) {
    console.error("Missing customer key");
    return;
  }

  // Remove billing key from user
  const user = await prisma.user.findUnique({
    where: { id: data.customerKey },
  });

  if (user && user.billingKey) {
    await prisma.$transaction([
      // Remove billing key
      prisma.user.update({
        where: { id: data.customerKey },
        data: {
          billingKey: null,
          billingAuthKey: null,
          billingKeyIssuedAt: null,
          billingMethod: null,
          cardInfo: undefined,
        },
      }),
      // Disable auto-renewal for all subscriptions
      prisma.userSubscription.updateMany({
        where: {
          userId: data.customerKey,
          autoRenew: true,
        },
        data: {
          autoRenew: false,
          recurringStatus: "INACTIVE",
          nextBillingDate: null,
        },
      }),
    ]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("TossPayments-Signature");
    const body = await request.text();
    
    // Verify webhook signature
    if (!verifyTossWebhookSignature(body, signature)) {
      console.error("[Webhook] Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" }, 
        { status: 401 }
      );
    }
    
    const event: TossWebhookEvent = parseTossWebhookEvent(body);
    console.log(`[Webhook] Received event: ${event.eventType}`);
    
    // Process event based on type
    switch (event.eventType) {
      case TOSS_WEBHOOK_EVENTS.PAYMENT_DONE:
        await handlePaymentDone(event.data);
        break;
        
      case TOSS_WEBHOOK_EVENTS.PAYMENT_FAILED:
        await handlePaymentFailed(event.data);
        break;
        
      case TOSS_WEBHOOK_EVENTS.BILLING_KEY_ISSUED:
        await handleBillingKeyIssued(event.data);
        break;
        
      case TOSS_WEBHOOK_EVENTS.BILLING_KEY_UPDATED:
        await handleBillingKeyUpdated(event.data);
        break;
        
      case TOSS_WEBHOOK_EVENTS.BILLING_KEY_REMOVED:
        await handleBillingKeyRemoved(event.data);
        break;
        
      default:
        console.log(`[Webhook] Unhandled event type: ${event.eventType}`);
    }
    
    // Store webhook event for auditing
    await prisma.paymentWebhook.create({
      data: {
        eventType: event.eventType,
        paymentKey: event.data.paymentKey,
        orderId: event.data.orderId,
        data: event as any,
        processed: true,
      },
    });
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}