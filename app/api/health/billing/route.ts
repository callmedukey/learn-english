import { NextResponse } from "next/server";

import { prisma } from "@/prisma/prisma-client";

/**
 * Health check endpoint for billing system monitoring
 * Can be used by uptime monitoring services to ensure billing is working
 */
export async function GET() {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Check for any subscriptions due for billing today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dueSubscriptions = await prisma.userSubscription.count({
      where: {
        recurringStatus: "ACTIVE",
        autoRenew: true,
        nextBillingDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
    
    // Check recent billing history for failures
    const recentFailures = await prisma.billingHistory.count({
      where: {
        status: "FAILED",
        processedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });
    
    // Get last successful billing
    const lastSuccess = await prisma.billingHistory.findFirst({
      where: {
        status: "SUCCESS",
      },
      orderBy: {
        processedAt: "desc",
      },
      select: {
        processedAt: true,
      },
    });
    
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      billing: {
        subscriptionsDueToday: dueSubscriptions,
        recentFailures: recentFailures,
        lastSuccessfulBilling: lastSuccess?.processedAt || null,
      },
      database: "connected",
    });
  } catch (error) {
    console.error("[Health Check] Billing system error:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}