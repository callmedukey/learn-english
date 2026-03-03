"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { NotificationType, Role } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";
import { ActionResponse } from "@/types/actions";

const createNotificationSchema = z.object({
  type: z.nativeEnum(NotificationType),
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  message: z.string().min(1, "Message is required"),
});

export type CreateNotificationType = z.infer<typeof createNotificationSchema>;

export async function createNotificationForAllUsersAction(
  _: ActionResponse<CreateNotificationType>,
  formData: FormData,
): Promise<ActionResponse<CreateNotificationType>> {
  const inputs = Object.fromEntries(
    formData.entries(),
  ) as unknown as CreateNotificationType;

  const parsed = createNotificationSchema.safeParse(inputs);

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid notification data",
      inputs,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { type, title, message } = parsed.data;

  try {
    // Get all user IDs
    const users = await prisma.user.findMany({
      where: {
        role: Role.USER,
      },
      select: { id: true },
    });

    if (users.length === 0) {
      return {
        success: false,
        message: "No users found to send notifications to",
        inputs,
      };
    }

    // Create notifications for all users in batches to avoid PostgreSQL parameter limits
    // (65,535 limit / 4 fields per notification ≈ 16,000 max, using 5,000 for safety)
    const BATCH_SIZE = 5000;
    let totalCreated = 0;

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      const result = await prisma.notification.createMany({
        data: batch.map((user) => ({
          userId: user.id,
          type,
          title,
          message,
        })),
      });
      totalCreated += result.count;
    }

    console.log(`Created ${totalCreated} notifications for ${users.length} users`);

    revalidatePath("/admin/notifications");

    return {
      success: true,
      message: `Notification sent to ${users.length} users successfully`,
    };
  } catch (error) {
    console.error("Error creating notifications:", error);
    return {
      success: false,
      message: "Failed to send notifications",
      inputs,
    };
  }
}
