import { BillingService } from "@/lib/services/billing.service";
import { PaymentLogger } from "@/lib/utils/payment-logger";

/**
 * Process recurring billing for active subscriptions
 * This job should be run daily, preferably during off-peak hours
 */
export async function processRecurringBilling() {
  console.log("[Billing Job] Starting recurring billing process...");
  
  const billingService = new BillingService();
  
  try {
    // Process subscriptions due for billing
    await billingService.processSubscriptionsDue();
    
    // Retry failed payments that are still in grace period
    await billingService.retryFailedPayments();
    
    console.log("[Billing Job] Recurring billing process completed successfully");
  } catch (error) {
    console.error("[Billing Job] Error during recurring billing process:", error);
    throw error;
  }
}

// If running as a standalone script
if (require.main === module) {
  processRecurringBilling()
    .then(() => {
      console.log("Billing job completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Billing job failed:", error);
      process.exit(1);
    });
}