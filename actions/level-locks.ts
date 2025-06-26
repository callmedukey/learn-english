"use server";

import { toZonedTime } from "date-fns-tz";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { APP_TIMEZONE } from "@/lib/constants/timezone";
import { LevelType } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";
import { getSystemConfig } from "@/server-queries/level-locks";
import { createLevelChangeNotification } from "@/lib/services/notification.service";

/**
 * Get the current Korea year and month
 */
function getCurrentKoreaYearMonth() {
  const now = new Date();
  const koreaTime = toZonedTime(now, APP_TIMEZONE);
  return {
    year: koreaTime.getFullYear(),
    month: koreaTime.getMonth() + 1,
  };
}

/**
 * Create a level lock for a user
 */
export async function createUserLevelLock(
  userId: string,
  levelType: LevelType,
  levelId: string
) {
  const { year, month } = getCurrentKoreaYearMonth();

  const levelLock = await prisma.userLevelLock.create({
    data: {
      userId,
      levelType,
      levelId,
      year,
      month,
    },
  });

  return levelLock;
}

/**
 * Request a level change
 */
export async function requestLevelChange(
  levelType: LevelType,
  fromLevelId: string,
  toLevelId: string,
  reason?: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const { year, month } = getCurrentKoreaYearMonth();

  // Check if user has a level lock
  const levelLock = await prisma.userLevelLock.findUnique({
    where: {
      userId_levelType_year_month: {
        userId: session.user.id,
        levelType,
        year,
        month,
      },
    },
  });

  if (!levelLock || levelLock.levelId !== fromLevelId) {
    throw new Error("Invalid level change request");
  }

  // Check if user has exceeded change limit
  const maxChanges = (await getSystemConfig("medal.levelChangesPerMonth")) || 1;
  if (levelLock.changesUsed >= maxChanges) {
    throw new Error(
      `You have already used your ${maxChanges} level change(s) for this month`
    );
  }

  // Create the request
  const request = await prisma.levelChangeRequest.create({
    data: {
      userId: session.user.id,
      levelType,
      fromLevelId,
      toLevelId,
      year,
      month,
      reason,
      status: "PENDING",
    },
  });

  // Always set status to PENDING - removed auto-approval logic

  revalidatePath("/dashboard");
  return request;
}

/**
 * Approve a level change request (admin only)
 */
export async function approveLevelChange(
  requestId: string
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const request = await prisma.levelChangeRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.status !== "PENDING") {
    throw new Error("Invalid request");
  }
  
  // Fetch level names for notification
  let fromLevelName = "";
  let toLevelName = "";
  
  if (request.levelType === "AR") {
    const [fromLevel, toLevel] = await Promise.all([
      prisma.aR.findUnique({ where: { id: request.fromLevelId }, select: { level: true } }),
      prisma.aR.findUnique({ where: { id: request.toLevelId }, select: { level: true } })
    ]);
    fromLevelName = fromLevel?.level || "";
    toLevelName = toLevel?.level || "";
  } else {
    const [fromLevel, toLevel] = await Promise.all([
      prisma.rCLevel.findUnique({ where: { id: request.fromLevelId }, select: { level: true } }),
      prisma.rCLevel.findUnique({ where: { id: request.toLevelId }, select: { level: true } })
    ]);
    fromLevelName = fromLevel?.level || "";
    toLevelName = toLevel?.level || "";
  }

  // Update both the request and the user's level lock
  await prisma.$transaction([
    prisma.levelChangeRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    }),
    prisma.userLevelLock.update({
      where: {
        userId_levelType_year_month: {
          userId: request.userId,
          levelType: request.levelType,
          year: request.year,
          month: request.month,
        },
      },
      data: {
        levelId: request.toLevelId,
        changesUsed: {
          increment: 1,
        },
        lastChangeAt: new Date(),
      },
    }),
    // Delete monthly scores when level changes
    ...(request.levelType === "AR"
      ? [
          prisma.monthlyARScore.deleteMany({
            where: {
              userId: request.userId,
              year: request.year,
              month: request.month,
            },
          }),
        ]
      : [
          prisma.monthlyRCScore.deleteMany({
            where: {
              userId: request.userId,
              year: request.year,
              month: request.month,
            },
          }),
        ]),
  ]);

  // Send notification to user
  await createLevelChangeNotification(
    request.userId,
    request.levelType,
    fromLevelName,
    toLevelName,
    true // isApproved
  );

  revalidatePath("/admin/challenges/level-changes");
  
  // Revalidate user-facing pages
  revalidatePath("/dashboard");
  revalidatePath("/novel");
  revalidatePath("/rc");
  
  // Revalidate specific level pages
  if (request.levelType === "AR") {
    revalidatePath(`/novel/${request.fromLevelId}`);
    revalidatePath(`/novel/${request.toLevelId}`);
  } else if (request.levelType === "RC") {
    revalidatePath(`/rc/${request.fromLevelId}`);
    revalidatePath(`/rc/${request.toLevelId}`);
  }
  
  return { success: true };
}

/**
 * Reject a level change request (admin only)
 */
export async function rejectLevelChange(
  requestId: string
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const request = await prisma.levelChangeRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.status !== "PENDING") {
    throw new Error("Invalid request");
  }
  
  // Fetch level name for notification (only need fromLevel for rejection)
  let fromLevelName = "";
  
  if (request.levelType === "AR") {
    const fromLevel = await prisma.aR.findUnique({ 
      where: { id: request.fromLevelId }, 
      select: { level: true } 
    });
    fromLevelName = fromLevel?.level || "";
  } else {
    const fromLevel = await prisma.rCLevel.findUnique({ 
      where: { id: request.fromLevelId }, 
      select: { level: true } 
    });
    fromLevelName = fromLevel?.level || "";
  }

  await prisma.levelChangeRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
    },
  });

  // Send notification to user
  await createLevelChangeNotification(
    request.userId,
    request.levelType,
    fromLevelName,
    "", // toLevel not needed for rejection
    false // isApproved
  );

  revalidatePath("/admin/challenges/level-changes");
  
  // Revalidate user-facing pages
  revalidatePath("/dashboard");
  revalidatePath("/novel");
  revalidatePath("/rc");
  
  // Revalidate specific level pages
  if (request.levelType === "AR") {
    revalidatePath(`/novel/${request.fromLevelId}`);
    revalidatePath(`/novel/${request.toLevelId}`);
  } else if (request.levelType === "RC") {
    revalidatePath(`/rc/${request.fromLevelId}`);
    revalidatePath(`/rc/${request.toLevelId}`);
  }
  
  return { success: true };
}

/**
 * Cancel a pending level change request
 */
export async function cancelLevelChangeRequest(requestId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const request = await prisma.levelChangeRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new Error("Request not found");
  }

  if (request.userId !== session.user.id) {
    throw new Error("You can only cancel your own requests");
  }

  if (request.status !== "PENDING") {
    throw new Error("Only pending requests can be cancelled");
  }

  await prisma.levelChangeRequest.delete({
    where: { id: requestId },
  });

  // Revalidate all relevant paths
  revalidatePath("/dashboard");
  revalidatePath("/novel");
  revalidatePath("/rc");
  
  // Also revalidate the specific level pages
  if (request.levelType === "AR") {
    revalidatePath(`/novel/${request.fromLevelId}`);
    revalidatePath(`/novel/${request.toLevelId}`);
  } else if (request.levelType === "RC") {
    revalidatePath(`/rc/${request.fromLevelId}`);
    revalidatePath(`/rc/${request.toLevelId}`);
  }
  
  return { success: true };
}

/**
 * Update system configuration (admin only)
 */
export async function updateSystemConfig(
  key: string,
  value: any,
  description?: string
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const stringValue = JSON.stringify(value);

  await prisma.systemConfig.upsert({
    where: { key },
    create: {
      key,
      value: stringValue,
      description,
      updatedBy: session.user.id,
    },
    update: {
      value: stringValue,
      description,
      updatedBy: session.user.id,
    },
  });

  revalidatePath("/admin/challenges/config");
  return { success: true };
}