import { NextRequest, NextResponse } from "next/server";

import { processRecurringBilling } from "@/jobs/subscription-billing.job";

// This route should be protected by a cron secret
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret if provided
    if (CRON_SECRET) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    // Log the start of the billing process
    console.log(`[Cron] Starting billing process at ${new Date().toISOString()}`);

    // Process recurring billing
    await processRecurringBilling();

    return NextResponse.json({
      success: true,
      message: "Billing process completed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Billing process error:", error);
    return NextResponse.json(
      { 
        error: "Billing process failed",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}