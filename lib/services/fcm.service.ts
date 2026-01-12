"server only";

import admin from "firebase-admin";

import { prisma } from "@/prisma/prisma-client";

// Initialize Firebase Admin SDK (singleton)
function getFirebaseAdmin() {
  if (admin.apps.length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        "Firebase credentials not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables."
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
  return admin;
}

export interface SendPushOptions {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface SendResult {
  successCount: number;
  failureCount: number;
  responses: Array<{
    token: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * Send push notifications to multiple FCM tokens
 * Automatically deactivates invalid tokens
 */
export async function sendPushNotifications(
  options: SendPushOptions
): Promise<SendResult> {
  if (options.tokens.length === 0) {
    return {
      successCount: 0,
      failureCount: 0,
      responses: [],
    };
  }

  const firebase = getFirebaseAdmin();
  const messaging = firebase.messaging();

  const message: admin.messaging.MulticastMessage = {
    tokens: options.tokens,
    notification: {
      title: options.title,
      body: options.body,
      ...(options.imageUrl && { imageUrl: options.imageUrl }),
    },
    data: options.data || {},
    android: {
      notification: {
        icon: "ic_notification",
        color: "#4F46E5",
        sound: "default",
      },
      priority: "high",
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
          badge: 1,
        },
      },
    },
  };

  const response = await messaging.sendEachForMulticast(message);

  const results: SendResult = {
    successCount: response.successCount,
    failureCount: response.failureCount,
    responses: response.responses.map((res, idx) => ({
      token: options.tokens[idx],
      success: res.success,
      error: res.error?.message,
    })),
  };

  // Collect invalid tokens to deactivate
  const invalidTokens: string[] = [];
  for (const result of results.responses) {
    if (!result.success && result.error) {
      // These error messages indicate the token is no longer valid
      const isInvalidToken =
        result.error.includes("not registered") ||
        result.error.includes("invalid registration") ||
        result.error.includes("NotRegistered") ||
        result.error.includes("InvalidRegistration");

      if (isInvalidToken) {
        invalidTokens.push(result.token);
      }
    }
  }

  // Deactivate invalid tokens
  if (invalidTokens.length > 0) {
    await prisma.deviceToken.updateMany({
      where: { token: { in: invalidTokens } },
      data: { isActive: false },
    });
    console.log(`Deactivated ${invalidTokens.length} invalid FCM tokens`);
  }

  return results;
}

/**
 * Send push notifications in batches (FCM limit is 500 per request)
 */
export async function sendPushNotificationsInBatches(
  options: SendPushOptions
): Promise<SendResult> {
  const BATCH_SIZE = 500;
  const allResults: SendResult = {
    successCount: 0,
    failureCount: 0,
    responses: [],
  };

  for (let i = 0; i < options.tokens.length; i += BATCH_SIZE) {
    const batchTokens = options.tokens.slice(i, i + BATCH_SIZE);
    const batchResult = await sendPushNotifications({
      ...options,
      tokens: batchTokens,
    });

    allResults.successCount += batchResult.successCount;
    allResults.failureCount += batchResult.failureCount;
    allResults.responses.push(...batchResult.responses);
  }

  return allResults;
}
