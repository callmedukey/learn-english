import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { processFailedWebhooks } from "@/lib/utils/webhook-retry";

// Admin-only endpoint to retry failed webhooks
export async function POST() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // TODO: Add admin role check
    // if (session.user.role !== "ADMIN") {
    //   return NextResponse.json(
    //     { error: "Admin access required" },
    //     { status: 403 }
    //   );
    // }

    // Process failed webhooks
    await processFailedWebhooks();

    return NextResponse.json({
      success: true,
      message: "Webhook retry process completed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Admin] Webhook retry error:", error);
    return NextResponse.json(
      { 
        error: "Failed to process webhooks",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}