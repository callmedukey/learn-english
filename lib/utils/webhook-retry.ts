import { prisma } from "@/prisma/prisma-client";

/**
 * Process failed webhook events that haven't been processed
 */
export async function processFailedWebhooks() {
  const failedWebhooks = await prisma.paymentWebhook.findMany({
    where: {
      processed: false,
      createdAt: {
        // Only retry webhooks from the last 24 hours
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 100, // Process in batches
  });

  console.log(`[Webhook Retry] Found ${failedWebhooks.length} failed webhooks to process`);

  for (const webhook of failedWebhooks) {
    try {
      // Re-process the webhook event
      await reprocessWebhook(webhook);
      
      // Mark as processed
      await prisma.paymentWebhook.update({
        where: { id: webhook.id },
        data: { processed: true },
      });
      
      console.log(`[Webhook Retry] Successfully processed webhook ${webhook.id}`);
    } catch (error) {
      console.error(`[Webhook Retry] Failed to process webhook ${webhook.id}:`, error);
    }
  }
}

async function reprocessWebhook(webhook: any) {
  const eventData = webhook.data as any;
  
  switch (webhook.eventType) {
    case "PAYMENT.DONE":
      // Check if payment was already marked as paid
      const payment = await prisma.payment.findUnique({
        where: { orderId: eventData.data.orderId },
      });
      
      if (payment && payment.status !== "PAID") {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "PAID",
            paymentKey: eventData.data.paymentKey,
            method: eventData.data.method || "CARD",
            approvedAt: new Date(eventData.data.approvedAt),
            tossResponse: eventData.data,
          },
        });
      }
      break;
      
    case "PAYMENT.FAILED":
      // Update payment status to failed
      const failedPayment = await prisma.payment.findUnique({
        where: { orderId: eventData.data.orderId },
      });
      
      if (failedPayment && failedPayment.status !== "FAILED") {
        await prisma.payment.update({
          where: { id: failedPayment.id },
          data: {
            status: "FAILED",
            failureCode: eventData.data.failure?.code,
            failureReason: eventData.data.failure?.message,
            tossResponse: eventData.data,
          },
        });
      }
      break;
      
    default:
      console.log(`[Webhook Retry] Unhandled event type: ${webhook.eventType}`);
  }
}

/**
 * Clean up old webhook logs
 */
export async function cleanupOldWebhooks(daysToKeep: number = 30) {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
  
  const result = await prisma.paymentWebhook.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
      processed: true,
    },
  });
  
  console.log(`[Webhook Cleanup] Deleted ${result.count} old webhook records`);
  return result.count;
}