import { toZonedTime } from "date-fns-tz";

import { APP_TIMEZONE } from "@/lib/constants/timezone";
import { SubscriptionStatus } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

/**
 * Main job function that handles subscription expiration
 * Should be run daily at midnight Korean time
 */
export async function runSubscriptionExpirationJob() {
  console.log("=== Starting Subscription Expiration Job ===");
  console.log(`Job started at: ${new Date().toISOString()}`);
  
  const koreaTime = toZonedTime(new Date(), APP_TIMEZONE);
  console.log(`Korea Time: ${koreaTime.toISOString()}`);

  try {
    // 1. Update expired subscriptions
    const expiredResults = await updateExpiredSubscriptions();
    console.log(`Updated ${expiredResults.count} expired subscriptions`);

    // 2. Send expiration notifications (if implemented)
    const notificationResults = await sendExpirationNotifications();
    console.log(`Sent ${notificationResults.expiredCount} expiration notifications`);
    console.log(`Sent ${notificationResults.expiringCount} expiring soon notifications`);

    // 3. Clean up old expired subscriptions (optional, keeps last 6 months)
    const cleanupResults = await cleanupOldExpiredSubscriptions();
    console.log(`Cleaned up ${cleanupResults.count} old expired subscriptions`);

    console.log("=== Subscription Expiration Job Completed Successfully ===");
    return {
      success: true,
      expiredSubscriptions: expiredResults.count,
      notificationsSent: notificationResults.expiredCount + notificationResults.expiringCount,
      cleanedUp: cleanupResults.count,
    };
  } catch (error) {
    console.error("Subscription Expiration Job failed:", error);
    throw error;
  }
}

/**
 * Update all active subscriptions that have passed their end date to EXPIRED status
 */
async function updateExpiredSubscriptions() {
  const now = new Date();
  
  console.log("Checking for expired subscriptions...");
  
  // First, get count of subscriptions to update for logging
  const toExpire = await prisma.userSubscription.count({
    where: {
      status: SubscriptionStatus.ACTIVE,
      endDate: {
        lt: now,
      },
    },
  });

  if (toExpire === 0) {
    console.log("No subscriptions to expire");
    return { count: 0 };
  }

  // Update all expired subscriptions in bulk
  const result = await prisma.userSubscription.updateMany({
    where: {
      status: SubscriptionStatus.ACTIVE,
      endDate: {
        lt: now,
      },
    },
    data: {
      status: SubscriptionStatus.EXPIRED,
      updatedAt: now,
    },
  });

  console.log(`Expired ${result.count} subscriptions`);
  return result;
}

/**
 * Send notifications for expired and expiring subscriptions
 */
async function sendExpirationNotifications() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  // Create date range for "today"
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  // Get subscriptions that expired today
  const expiredToday = await prisma.userSubscription.findMany({
    where: {
      status: SubscriptionStatus.EXPIRED,
      endDate: {
        gte: todayStart,
        lt: todayEnd,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          nickname: true,
        },
      },
      plan: {
        select: {
          name: true,
        },
      },
    },
  });

  // Get subscriptions expiring in the next 3 days
  const expiringSoon = await prisma.userSubscription.findMany({
    where: {
      status: SubscriptionStatus.ACTIVE,
      endDate: {
        gte: tomorrow,
        lt: threeDaysFromNow,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          nickname: true,
        },
      },
      plan: {
        select: {
          name: true,
        },
      },
    },
  });

  // Filter out users who already received notification today
  const usersWithRecentNotifications = await prisma.notification.findMany({
    where: {
      userId: {
        in: expiringSoon.map(sub => sub.userId),
      },
      type: "SUBSCRIPTION_EXPIRING",
      createdAt: {
        gte: todayStart,
      },
    },
    select: {
      userId: true,
    },
  });

  const notifiedUserIds = new Set(usersWithRecentNotifications.map(n => n.userId));
  const filteredExpiringSoon = expiringSoon.filter(sub => !notifiedUserIds.has(sub.userId));

  // Create notifications for expired subscriptions
  if (expiredToday.length > 0) {
    await prisma.notification.createMany({
      data: expiredToday.map((sub) => ({
        userId: sub.userId,
        type: "SUBSCRIPTION_EXPIRED",
        title: "Your subscription has expired",
        message: `Your ${sub.plan.name} subscription has expired. Visit your profile to renew and continue learning!`,
        actionUrl: "/profile",
      })),
    });
  }

  // Create notifications for expiring subscriptions
  if (filteredExpiringSoon.length > 0) {
    await prisma.notification.createMany({
      data: filteredExpiringSoon.map((sub) => {
        const daysLeft = Math.ceil(
          (sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          userId: sub.userId,
          type: "SUBSCRIPTION_EXPIRING",
          title: "Your subscription is expiring soon",
          message: `Your ${sub.plan.name} subscription will expire in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Renew now to continue your learning journey!`,
          actionUrl: "/profile",
        };
      }),
    });
  }

  console.log(`Created ${expiredToday.length} expiration notifications`);
  console.log(`Created ${filteredExpiringSoon.length} expiring soon notifications`);

  return {
    expiredCount: expiredToday.length,
    expiringCount: filteredExpiringSoon.length,
  };
}

/**
 * Clean up old expired subscriptions (optional - keeps last 6 months for history)
 */
async function cleanupOldExpiredSubscriptions() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Count before deletion for logging
  const toDelete = await prisma.userSubscription.count({
    where: {
      status: SubscriptionStatus.EXPIRED,
      endDate: {
        lt: sixMonthsAgo,
      },
    },
  });

  if (toDelete === 0) {
    console.log("No old subscriptions to clean up");
    return { count: 0 };
  }

  // Note: This is commented out by default. Uncomment if you want to delete old records
  // const result = await prisma.userSubscription.deleteMany({
  //   where: {
  //     status: SubscriptionStatus.EXPIRED,
  //     endDate: {
  //       lt: sixMonthsAgo,
  //     },
  //   },
  // });

  console.log(`Found ${toDelete} old expired subscriptions (cleanup disabled by default)`);
  return { count: 0 }; // Return 0 since we're not actually deleting
}