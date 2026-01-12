"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import {
  createAndSendCampaign,
  getEstimatedAudience,
  getCampaignHistory,
  TargetFilters,
} from "@/lib/services/push-campaign.service";
import { PushTargetType, Role } from "@/prisma/generated/prisma";
import { ActionResponse } from "@/types/actions";

const sendPushSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  body: z.string().min(1, "Message is required").max(500, "Message too long"),
  imageUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  targetType: z.nativeEnum(PushTargetType),
  grades: z.array(z.string()).optional(),
  campusIds: z.array(z.string()).optional(),
  countryIds: z.array(z.string()).optional(),
  hasActiveSubscription: z.boolean().optional(),
  userIds: z.array(z.string()).optional(),
});

export type SendPushInput = z.infer<typeof sendPushSchema>;

export async function sendPushNotificationAction(
  data: SendPushInput
): Promise<ActionResponse<SendPushInput>> {
  const session = await auth();

  if (!session?.user || session.user.role !== Role.ADMIN) {
    return { success: false, message: "Unauthorized" };
  }

  const parsed = sendPushSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid input",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const targetFilters: TargetFilters = {
      grades: parsed.data.grades,
      campusIds: parsed.data.campusIds,
      countryIds: parsed.data.countryIds,
      hasActiveSubscription: parsed.data.hasActiveSubscription,
    };

    const result = await createAndSendCampaign({
      title: parsed.data.title,
      body: parsed.data.body,
      imageUrl: parsed.data.imageUrl || undefined,
      targetType: parsed.data.targetType,
      targetFilters,
      targetUserIds: parsed.data.userIds,
      createdById: session.user.id,
    });

    revalidatePath("/admin/push-notifications");

    return {
      success: true,
      message: `Push notification sent to ${result.delivered} devices (${result.sent} attempted)`,
    };
  } catch (error) {
    console.error("Send push notification error:", error);
    return {
      success: false,
      message: "Failed to send push notification. Please try again.",
    };
  }
}

export async function getEstimatedAudienceAction(
  targetType: PushTargetType,
  filters: TargetFilters,
  userIds?: string[]
): Promise<{ deviceCount: number; userCount: number }> {
  const session = await auth();

  if (!session?.user || session.user.role !== Role.ADMIN) {
    return { deviceCount: 0, userCount: 0 };
  }

  try {
    return await getEstimatedAudience(targetType, filters, userIds);
  } catch (error) {
    console.error("Get estimated audience error:", error);
    return { deviceCount: 0, userCount: 0 };
  }
}

export async function getCampaignHistoryAction(
  page: number = 1,
  limit: number = 10
) {
  const session = await auth();

  if (!session?.user || session.user.role !== Role.ADMIN) {
    return { campaigns: [], total: 0 };
  }

  try {
    return await getCampaignHistory(page, limit);
  } catch (error) {
    console.error("Get campaign history error:", error);
    return { campaigns: [], total: 0 };
  }
}
