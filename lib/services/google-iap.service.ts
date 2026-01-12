import { google } from "googleapis";

// Environment variables
const GOOGLE_PACKAGE_NAME = process.env.GOOGLE_PACKAGE_NAME!;
const GOOGLE_SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

interface GoogleSubscriptionPurchase {
  kind: string;
  startTimeMillis: string;
  expiryTimeMillis: string;
  autoRenewing: boolean;
  priceCurrencyCode: string;
  priceAmountMicros: string;
  countryCode: string;
  developerPayload: string;
  paymentState: number;
  cancelReason?: number;
  userCancellationTimeMillis?: string;
  orderId: string;
  linkedPurchaseToken?: string;
  purchaseType?: number;
  acknowledgementState: number;
  externalAccountId?: string;
}

export interface GoogleSubscriptionStatus {
  isValid: boolean;
  isActive: boolean;
  isTrialPeriod: boolean;
  productId: string | null;
  purchaseToken: string | null;
  orderId: string | null;
  purchaseDate: Date | null;
  expiresDate: Date | null;
  autoRenewStatus: boolean;
  paymentState: number;
  cancelReason?: number;
  isAcknowledged: boolean;
  error?: string;
}

export interface GoogleValidationResult {
  success: boolean;
  subscription: GoogleSubscriptionStatus | null;
  error?: string;
}

export class GoogleIAPService {
  private androidPublisher: any;
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the Google API client with service account credentials
   */
  private async initialize() {
    if (this.isInitialized) return;

    try {
      if (!GOOGLE_SERVICE_ACCOUNT_KEY) {
        console.warn("[GoogleIAP] Service account key not configured");
        return;
      }

      // Parse the service account key from environment variable
      const serviceAccountKey = JSON.parse(GOOGLE_SERVICE_ACCOUNT_KEY);

      const auth = new google.auth.GoogleAuth({
        credentials: serviceAccountKey,
        scopes: ["https://www.googleapis.com/auth/androidpublisher"],
      });

      this.androidPublisher = google.androidpublisher({
        version: "v3",
        auth,
      });

      this.isInitialized = true;
      console.log("[GoogleIAP] Initialized successfully");
    } catch (error) {
      console.error("[GoogleIAP] Failed to initialize:", error);
    }
  }

  /**
   * Validate a subscription purchase
   */
  async validateSubscription(
    productId: string,
    purchaseToken: string
  ): Promise<GoogleValidationResult> {
    try {
      await this.initialize();

      if (!this.androidPublisher) {
        return {
          success: false,
          subscription: null,
          error: "Google API not initialized",
        };
      }

      const response = await this.androidPublisher.purchases.subscriptions.get({
        packageName: GOOGLE_PACKAGE_NAME,
        subscriptionId: productId,
        token: purchaseToken,
      });

      const purchase: GoogleSubscriptionPurchase = response.data;
      return this.parseSubscriptionPurchase(purchase, productId, purchaseToken);
    } catch (error: any) {
      console.error("[GoogleIAP] Validation error:", error);

      // Handle specific Google API errors
      if (error.code === 410) {
        return {
          success: false,
          subscription: null,
          error: "Purchase expired or was refunded",
        };
      }

      if (error.code === 404) {
        return {
          success: false,
          subscription: null,
          error: "Purchase not found",
        };
      }

      return {
        success: false,
        subscription: null,
        error: error.message || "Unknown error",
      };
    }
  }

  /**
   * Acknowledge a subscription purchase
   * Must be called within 3 days of purchase or it will be refunded
   */
  async acknowledgeSubscription(
    productId: string,
    purchaseToken: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.initialize();

      if (!this.androidPublisher) {
        console.error("[GoogleIAP] API not initialized for acknowledgment");
        return { success: false, error: "Google Play API not initialized" };
      }

      await this.androidPublisher.purchases.subscriptions.acknowledge({
        packageName: GOOGLE_PACKAGE_NAME,
        subscriptionId: productId,
        token: purchaseToken,
      });

      console.log(`[GoogleIAP] Acknowledged subscription: ${productId}`);
      return { success: true };
    } catch (error) {
      console.error("[GoogleIAP] Failed to acknowledge subscription:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Acknowledgement failed"
      };
    }
  }

  /**
   * Parse subscription purchase response
   */
  private parseSubscriptionPurchase(
    purchase: GoogleSubscriptionPurchase,
    productId: string,
    purchaseToken: string
  ): GoogleValidationResult {
    const now = Date.now();
    const expiryTimeMillis = parseInt(purchase.expiryTimeMillis, 10);
    const startTimeMillis = parseInt(purchase.startTimeMillis, 10);

    // Payment states: 0 = Payment pending, 1 = Payment received, 2 = Free trial, 3 = Pending deferred upgrade/downgrade
    const paymentState = purchase.paymentState ?? 0;
    const isTrialPeriod = paymentState === 2;
    const isActive = expiryTimeMillis > now && paymentState !== 0;

    // Cancel reasons: 0 = User cancelled, 1 = System cancelled, 2 = Replaced with new subscription, 3 = Developer cancelled
    const cancelReason = purchase.cancelReason;

    return {
      success: true,
      subscription: {
        isValid: true,
        isActive,
        isTrialPeriod,
        productId,
        purchaseToken,
        orderId: purchase.orderId || null,
        purchaseDate: new Date(startTimeMillis),
        expiresDate: new Date(expiryTimeMillis),
        autoRenewStatus: purchase.autoRenewing,
        paymentState,
        cancelReason,
        isAcknowledged: purchase.acknowledgementState === 1,
      },
    };
  }

  /**
   * Get subscription purchase details (for restore purchases)
   */
  async getSubscriptionPurchase(
    productId: string,
    purchaseToken: string
  ): Promise<GoogleValidationResult> {
    return this.validateSubscription(productId, purchaseToken);
  }

  /**
   * Revoke a subscription (for refunds)
   */
  async revokeSubscription(
    productId: string,
    purchaseToken: string
  ): Promise<boolean> {
    try {
      await this.initialize();

      if (!this.androidPublisher) {
        return false;
      }

      await this.androidPublisher.purchases.subscriptions.revoke({
        packageName: GOOGLE_PACKAGE_NAME,
        subscriptionId: productId,
        token: purchaseToken,
      });

      console.log(`[GoogleIAP] Revoked subscription: ${productId}`);
      return true;
    } catch (error) {
      console.error("[GoogleIAP] Failed to revoke subscription:", error);
      return false;
    }
  }

  /**
   * Parse Real-time Developer Notification (RTDN) from Cloud Pub/Sub
   */
  parseRealtimeNotification(messageData: string): {
    notificationType: string;
    subscriptionNotification?: {
      version: string;
      notificationType: number;
      purchaseToken: string;
      subscriptionId: string;
    };
    oneTimeProductNotification?: {
      version: string;
      notificationType: number;
      purchaseToken: string;
      sku: string;
    };
    testNotification?: {
      version: string;
    };
  } | null {
    try {
      const decoded = Buffer.from(messageData, "base64").toString("utf8");
      const notification = JSON.parse(decoded);
      return notification;
    } catch (error) {
      console.error("[GoogleIAP] Failed to parse RTDN:", error);
      return null;
    }
  }

  /**
   * Map notification type number to readable string
   * Subscription notification types:
   * 1 = SUBSCRIPTION_RECOVERED
   * 2 = SUBSCRIPTION_RENEWED
   * 3 = SUBSCRIPTION_CANCELED
   * 4 = SUBSCRIPTION_PURCHASED
   * 5 = SUBSCRIPTION_ON_HOLD
   * 6 = SUBSCRIPTION_IN_GRACE_PERIOD
   * 7 = SUBSCRIPTION_RESTARTED
   * 8 = SUBSCRIPTION_PRICE_CHANGE_CONFIRMED
   * 9 = SUBSCRIPTION_DEFERRED
   * 10 = SUBSCRIPTION_PAUSED
   * 11 = SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED
   * 12 = SUBSCRIPTION_REVOKED
   * 13 = SUBSCRIPTION_EXPIRED
   */
  static getNotificationTypeName(typeNumber: number): string {
    const types: Record<number, string> = {
      1: "SUBSCRIPTION_RECOVERED",
      2: "SUBSCRIPTION_RENEWED",
      3: "SUBSCRIPTION_CANCELED",
      4: "SUBSCRIPTION_PURCHASED",
      5: "SUBSCRIPTION_ON_HOLD",
      6: "SUBSCRIPTION_IN_GRACE_PERIOD",
      7: "SUBSCRIPTION_RESTARTED",
      8: "SUBSCRIPTION_PRICE_CHANGE_CONFIRMED",
      9: "SUBSCRIPTION_DEFERRED",
      10: "SUBSCRIPTION_PAUSED",
      11: "SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED",
      12: "SUBSCRIPTION_REVOKED",
      13: "SUBSCRIPTION_EXPIRED",
    };
    return types[typeNumber] || `UNKNOWN_${typeNumber}`;
  }

  /**
   * Map Google product ID to plan duration in days
   */
  static getProductDuration(productId: string): number {
    const durations: Record<string, number> = {
      reading_camp_1month: 30,
      reading_camp_3months: 90,
      reading_camp_12months: 365,
    };
    return durations[productId] || 30;
  }

  /**
   * Map Google product ID to plan ID in database
   */
  static async getMatchingPlanId(productId: string): Promise<string | null> {
    const { prisma } = await import("@/prisma/prisma-client");

    const duration = this.getProductDuration(productId);

    const plan = await prisma.plan.findFirst({
      where: {
        duration,
        isActive: true,
      },
    });

    return plan?.id || null;
  }
}

// Export singleton instance
export const googleIAPService = new GoogleIAPService();
