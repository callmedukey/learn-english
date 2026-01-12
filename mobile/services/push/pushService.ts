import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { apiClient } from "../api/client";

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationResult {
  token: string | null;
  error: string | null;
}

/**
 * Request notification permissions and get FCM token
 */
export async function registerForPushNotifications(): Promise<PushNotificationResult> {
  let token: string | null = null;
  let error: string | null = null;

  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    error = "Push notifications require a physical device";
    return { token, error };
  }

  try {
    // Check existing permissions
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      error = "Push notification permission not granted";
      return { token, error };
    }

    // Get device push token (FCM token on Android, APNs token on iOS)
    const devicePushToken = await Notifications.getDevicePushTokenAsync();
    token = devicePushToken.data;

    // Configure Android notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#4F46E5",
        sound: "default",
      });
    }

    return { token, error };
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to get push token";
    return { token, error };
  }
}

/**
 * Register the push token with the server
 */
export async function registerTokenWithServer(token: string): Promise<void> {
  await apiClient.post("/api/mobile/push/register", {
    token,
    platform: Platform.OS === "ios" ? "IOS" : "ANDROID",
    deviceModel: Device.modelName,
    osVersion: Device.osVersion,
    appVersion: "1.0.0", // TODO: Get from app.json or Constants
  });
}

/**
 * Unregister the push token from the server (on logout)
 */
export async function unregisterTokenFromServer(token: string): Promise<void> {
  try {
    await apiClient.post("/api/mobile/push/unregister", { token });
  } catch (error) {
    // Don't throw on unregister failure - user is logging out anyway
    console.warn("Failed to unregister push token:", error);
  }
}

/**
 * Add listener for push token refresh
 */
export function addTokenRefreshListener(
  callback: (token: string) => void
): () => void {
  const subscription = Notifications.addPushTokenListener((tokenData) => {
    callback(tokenData.data);
  });
  return () => subscription.remove();
}

/**
 * Add listener for incoming notifications (foreground)
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): () => void {
  const subscription =
    Notifications.addNotificationReceivedListener(callback);
  return () => subscription.remove();
}

/**
 * Add listener for notification responses (user tapped notification)
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): () => void {
  const subscription =
    Notifications.addNotificationResponseReceivedListener(callback);
  return () => subscription.remove();
}

/**
 * Get the last notification response (for app opened from notification)
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return await Notifications.getLastNotificationResponseAsync();
}
