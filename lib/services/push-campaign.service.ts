"server only";

import calculateGrade from "@/lib/utils/calculate-grade";
import {
  Prisma,
  PushCampaignStatus,
  PushTargetType,
  SubscriptionStatus,
} from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

import { sendPushNotificationsInBatches } from "./fcm.service";

export interface TargetFilters {
  grades?: string[];
  campusIds?: string[];
  countryIds?: string[];
  hasActiveSubscription?: boolean;
}

export interface CreateCampaignInput {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  targetType: PushTargetType;
  targetFilters?: TargetFilters;
  targetUserIds?: string[];
  createdById: string;
}

interface TokenWithUser {
  id: string;
  token: string;
  userId: string;
}

/**
 * Get device tokens based on targeting filters
 */
export async function getTokensByFilters(
  targetType: PushTargetType,
  filters?: TargetFilters,
  userIds?: string[]
): Promise<TokenWithUser[]> {
  // Build the base query for active tokens
  const baseWhere: {
    isActive: boolean;
    userId?: { in: string[] };
    user?: Record<string, unknown>;
  } = {
    isActive: true,
  };

  // Handle individual targeting
  if (targetType === PushTargetType.INDIVIDUAL && userIds?.length) {
    baseWhere.userId = { in: userIds };
    return prisma.deviceToken.findMany({
      where: baseWhere,
      select: { id: true, token: true, userId: true },
    });
  }

  // For ALL_USERS, just return all active tokens
  if (targetType === PushTargetType.ALL_USERS) {
    return prisma.deviceToken.findMany({
      where: baseWhere,
      select: { id: true, token: true, userId: true },
    });
  }

  // For other targeting types, we need to filter users first
  const userWhere: Record<string, unknown> = {};

  // Campus filtering
  if (targetType === PushTargetType.BY_CAMPUS && filters?.campusIds?.length) {
    userWhere.campusId = { in: filters.campusIds };
  }

  // Country filtering
  if (targetType === PushTargetType.BY_COUNTRY && filters?.countryIds?.length) {
    userWhere.countryId = { in: filters.countryIds };
  }

  // Subscription filtering
  if (targetType === PushTargetType.BY_SUBSCRIPTION && filters?.hasActiveSubscription !== undefined) {
    if (filters.hasActiveSubscription) {
      // Users with at least one active subscription
      userWhere.subscriptions = {
        some: {
          status: SubscriptionStatus.ACTIVE,
          endDate: { gte: new Date() },
        },
      };
    } else {
      // Users without any active subscription
      userWhere.OR = [
        { subscriptions: { none: {} } },
        {
          subscriptions: {
            every: {
              OR: [
                { status: { not: SubscriptionStatus.ACTIVE } },
                { endDate: { lt: new Date() } },
              ],
            },
          },
        },
      ];
    }
  }

  // Grade filtering - requires fetching users and filtering by calculated grade
  if (targetType === PushTargetType.BY_GRADE && filters?.grades?.length) {
    // Get all users with birthdays and device tokens
    const usersWithTokens = await prisma.user.findMany({
      where: {
        birthday: { not: null },
        deviceTokens: { some: { isActive: true } },
      },
      select: {
        id: true,
        birthday: true,
        deviceTokens: {
          where: { isActive: true },
          select: { id: true, token: true, userId: true },
        },
      },
    });

    // Filter users by calculated grade
    const matchingTokens: TokenWithUser[] = [];
    for (const user of usersWithTokens) {
      const userGrade = calculateGrade(user.birthday);
      if (filters.grades.includes(userGrade)) {
        matchingTokens.push(...user.deviceTokens);
      }
    }

    return matchingTokens;
  }

  // Apply user filters if any
  if (Object.keys(userWhere).length > 0) {
    baseWhere.user = userWhere;
  }

  return prisma.deviceToken.findMany({
    where: baseWhere,
    select: { id: true, token: true, userId: true },
  });
}

/**
 * Get estimated audience count for preview
 */
export async function getEstimatedAudience(
  targetType: PushTargetType,
  filters?: TargetFilters,
  userIds?: string[]
): Promise<{ deviceCount: number; userCount: number }> {
  const tokens = await getTokensByFilters(targetType, filters, userIds);

  // Get unique user count
  const uniqueUserIds = new Set(tokens.map((t) => t.userId));

  return {
    deviceCount: tokens.length,
    userCount: uniqueUserIds.size,
  };
}

/**
 * Create and send a push notification campaign
 */
export async function createAndSendCampaign(
  input: CreateCampaignInput
): Promise<{ campaign: { id: string }; sent: number; delivered: number }> {
  // Create campaign in PENDING state
  const campaign = await prisma.pushCampaign.create({
    data: {
      title: input.title,
      body: input.body,
      data: input.data || {},
      imageUrl: input.imageUrl,
      targetType: input.targetType,
      targetFilters: input.targetFilters
        ? (input.targetFilters as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      targetUserIds: input.targetUserIds || [],
      createdById: input.createdById,
      status: PushCampaignStatus.PENDING,
    },
  });

  try {
    // Update to SENDING
    await prisma.pushCampaign.update({
      where: { id: campaign.id },
      data: { status: PushCampaignStatus.SENDING, sentAt: new Date() },
    });

    // Get target tokens
    const tokens = await getTokensByFilters(
      input.targetType,
      input.targetFilters,
      input.targetUserIds
    );

    if (tokens.length === 0) {
      await prisma.pushCampaign.update({
        where: { id: campaign.id },
        data: {
          status: PushCampaignStatus.COMPLETED,
          completedAt: new Date(),
          totalTargeted: 0,
          totalSent: 0,
        },
      });
      return { campaign: { id: campaign.id }, sent: 0, delivered: 0 };
    }

    // Send notifications
    const tokenStrings = tokens.map((t) => t.token);
    const result = await sendPushNotificationsInBatches({
      tokens: tokenStrings,
      title: input.title,
      body: input.body,
      data: input.data,
      imageUrl: input.imageUrl,
    });

    // Store individual results for tracking
    const sendResults = result.responses.map((r, idx) => ({
      campaignId: campaign.id,
      deviceTokenId: tokens[idx].id,
      userId: tokens[idx].userId,
      success: r.success,
      errorCode: r.success ? null : "SEND_FAILED",
      errorMessage: r.error || null,
    }));

    // Batch insert send results
    if (sendResults.length > 0) {
      await prisma.pushSendResult.createMany({
        data: sendResults,
      });
    }

    // Update campaign with final stats
    await prisma.pushCampaign.update({
      where: { id: campaign.id },
      data: {
        status: PushCampaignStatus.COMPLETED,
        completedAt: new Date(),
        totalTargeted: new Set(tokens.map((t) => t.userId)).size,
        totalSent: tokens.length,
        totalDelivered: result.successCount,
        totalFailed: result.failureCount,
      },
    });

    return {
      campaign: { id: campaign.id },
      sent: tokens.length,
      delivered: result.successCount,
    };
  } catch (error) {
    console.error("Campaign send error:", error);
    await prisma.pushCampaign.update({
      where: { id: campaign.id },
      data: { status: PushCampaignStatus.FAILED },
    });
    throw error;
  }
}

/**
 * Get campaign history with pagination
 */
export async function getCampaignHistory(page: number = 1, limit: number = 20) {
  const [campaigns, total] = await Promise.all([
    prisma.pushCampaign.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        createdBy: { select: { name: true, email: true, nickname: true } },
      },
    }),
    prisma.pushCampaign.count(),
  ]);

  return { campaigns, total };
}
