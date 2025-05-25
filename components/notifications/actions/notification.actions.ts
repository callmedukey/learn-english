"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma-client";

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * Get user's notifications
 */
export async function getUserNotifications(
  userId: string,
): Promise<NotificationData[]> {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20, // Limit to last 20 notifications
    });

    return notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
): Promise<{ success: boolean }> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false };
    }

    await prisma.notification.update({
      where: {
        id: notificationId,
        userId: session.user.id, // Ensure user can only update their own notifications
      },
      data: { isRead: true },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  userId: string,
): Promise<{ success: boolean }> {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.id !== userId) {
      return { success: false };
    }

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false };
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(
  userId: string,
): Promise<number> {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return count;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    return 0;
  }
}

/**
 * Create a test notification (for development/testing purposes)
 */
export async function createTestNotification(
  userId: string,
): Promise<{ success: boolean }> {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.id !== userId) {
      return { success: false };
    }

    await prisma.notification.create({
      data: {
        userId,
        title: "🎉 Test Notification",
        message:
          "This is a test notification to verify the notification system is working correctly!",
        isRead: false,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error creating test notification:", error);
    return { success: false };
  }
}
