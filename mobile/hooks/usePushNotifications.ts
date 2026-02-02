import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { router } from "expo-router";

import { useAuth } from "@/services/auth/context";
import {
  registerForPushNotifications,
  registerTokenWithServer,
  addTokenRefreshListener,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  getLastNotificationResponse,
} from "@/services/push/pushService";

/**
 * SECURITY: Whitelist of allowed deep link prefixes
 * Only these paths can be navigated to from push notifications
 * This prevents malicious notifications from redirecting to unintended URLs
 */
const ALLOWED_DEEP_LINK_PREFIXES = [
  "/(tabs)",
  "/novel/",
  "/rc/",
  "/bpa/",
  "/profile",
  "/subscription",
  "/settings",
];

/**
 * Validate and sanitize a deep link URL from push notification
 * Returns the URL if valid, null if potentially malicious
 */
function validateDeepLink(url: unknown): string | null {
  // Must be a string
  if (typeof url !== "string") {
    return null;
  }

  // Must start with / (relative path only - no external URLs)
  if (!url.startsWith("/")) {
    console.warn("[Push] Rejected deep link - must be relative path:", url);
    return null;
  }

  // Block any URL with protocol (prevents javascript:, http:, etc.)
  if (url.includes("://") || url.includes("javascript:")) {
    console.warn("[Push] Rejected deep link - contains protocol:", url);
    return null;
  }

  // Must match one of the allowed prefixes
  const isAllowed = ALLOWED_DEEP_LINK_PREFIXES.some((prefix) =>
    url.startsWith(prefix)
  );

  if (!isAllowed) {
    console.warn("[Push] Rejected deep link - not in whitelist:", url);
    return null;
  }

  return url;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<
    "granted" | "denied" | "pending"
  >("pending");
  const hasRegisteredRef = useRef(false);
  const currentTokenRef = useRef<string | null>(null);

  // Initialize push notifications when user logs in
  useEffect(() => {
    if (!user) {
      // User logged out - reset state
      hasRegisteredRef.current = false;
      currentTokenRef.current = null;
      return;
    }

    const initPushNotifications = async () => {
      // Avoid duplicate registration
      if (hasRegisteredRef.current) return;

      const { token, error } = await registerForPushNotifications();

      if (error) {
        console.warn("Push notification setup error:", error);
        setPermissionStatus("denied");
        return;
      }

      if (token) {
        setPushToken(token);
        currentTokenRef.current = token;
        setPermissionStatus("granted");
        hasRegisteredRef.current = true;

        try {
          await registerTokenWithServer(token);
          console.log("Push token registered successfully");
        } catch (e) {
          console.error("Failed to register push token with server:", e);
          // Don't reset hasRegisteredRef - we'll retry on app focus
        }
      }
    };

    initPushNotifications();

    // Re-register on app coming to foreground (in case token changed)
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "active" && user && !hasRegisteredRef.current) {
        initPushNotifications();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => subscription.remove();
  }, [user]);

  // Handle token refresh
  useEffect(() => {
    if (!user) return;

    const unsubscribe = addTokenRefreshListener(async (newToken) => {
      console.log("Push token refreshed");
      setPushToken(newToken);
      currentTokenRef.current = newToken;

      try {
        await registerTokenWithServer(newToken);
        console.log("Refreshed push token registered successfully");
      } catch (e) {
        console.error("Failed to register refreshed push token:", e);
      }
    });

    return unsubscribe;
  }, [user]);

  // Handle incoming notifications (foreground)
  useEffect(() => {
    const unsubscribeReceived = addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received in foreground:", notification.request.content.title);
        // Notification is shown automatically by the handler
      }
    );

    return unsubscribeReceived;
  }, []);

  // Handle notification taps
  useEffect(() => {
    const handleNotificationResponse = (
      response: { notification: { request: { content: { data?: Record<string, unknown> } } } }
    ) => {
      const data = response.notification.request.content.data;

      if (data?.actionUrl) {
        // SECURITY: Validate deep link before navigation
        const validatedUrl = validateDeepLink(data.actionUrl);
        if (validatedUrl) {
          router.push(validatedUrl as never);
        }
      }
    };

    const unsubscribeResponse =
      addNotificationResponseListener(handleNotificationResponse);

    // Check if app was opened from a notification
    const checkInitialNotification = async () => {
      const response = await getLastNotificationResponse();
      if (response) {
        handleNotificationResponse(response);
      }
    };

    checkInitialNotification();

    return unsubscribeResponse;
  }, []);

  return {
    pushToken,
    permissionStatus,
  };
}
