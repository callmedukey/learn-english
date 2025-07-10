import { cleanupOldWebhooks, processFailedWebhooks } from "@/lib/utils/webhook-retry";

/**
 * Clean up old webhook logs and retry failed webhooks
 * This job should be run daily
 */
export async function webhookMaintenanceJob() {
  console.log("[Webhook Maintenance] Starting webhook maintenance job...");
  
  try {
    // First, retry any failed webhooks from the last 24 hours
    await processFailedWebhooks();
    
    // Then clean up old webhook logs (keep last 30 days)
    const deletedCount = await cleanupOldWebhooks(30);
    
    console.log(`[Webhook Maintenance] Job completed. Cleaned up ${deletedCount} old records.`);
  } catch (error) {
    console.error("[Webhook Maintenance] Error during maintenance job:", error);
    throw error;
  }
}

// If running as a standalone script
if (require.main === module) {
  webhookMaintenanceJob()
    .then(() => {
      console.log("Webhook maintenance job completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Webhook maintenance job failed:", error);
      process.exit(1);
    });
}