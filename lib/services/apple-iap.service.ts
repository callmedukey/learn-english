import * as jose from "jose";

// Apple App Store Server API URLs
const APPLE_PRODUCTION_URL = "https://api.storekit.itunes.apple.com";
const APPLE_SANDBOX_URL = "https://api.storekit-sandbox.itunes.apple.com";

// Apple's public key JWKS URL for verifying signed data
const APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys";

// Environment variables
const APPLE_KEY_ID = process.env.APPLE_KEY_ID!;
const APPLE_ISSUER_ID = process.env.APPLE_ISSUER_ID!;
// Handle escaped newlines in env var (common in PM2/Docker)
const APPLE_PRIVATE_KEY = (process.env.APPLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const APPLE_BUNDLE_ID = process.env.APPLE_BUNDLE_ID!;
// Use APPLE_USE_SANDBOX=true to force sandbox API (for testing)
// Otherwise, uses production API when NODE_ENV=production
const USE_SANDBOX = process.env.APPLE_USE_SANDBOX === "true";
const IS_PRODUCTION = process.env.NODE_ENV === "production" && !USE_SANDBOX;

// Cache for Apple's JWKS
let cachedJWKS: jose.JWTVerifyGetKey | null = null;
let jwksCacheTime: number = 0;
const JWKS_CACHE_TTL = 60 * 60 * 1000; // 1 hour cache

interface AppleTransactionInfo {
  transactionId: string;
  originalTransactionId: string;
  productId: string;
  purchaseDate: number;
  expiresDate: number;
  type: string;
  inAppOwnershipType: string;
  signedDate: number;
  environment: string;
  bundleId: string;
  appAccountToken?: string;
}

interface AppleRenewalInfo {
  autoRenewProductId: string;
  autoRenewStatus: number;
  expirationIntent?: number;
  gracePeriodExpiresDate?: number;
  isInBillingRetryPeriod?: boolean;
  offerIdentifier?: string;
  offerType?: number;
  originalTransactionId: string;
  priceIncreaseStatus?: number;
  productId: string;
  signedDate: number;
}

export interface AppleSubscriptionStatus {
  isValid: boolean;
  isActive: boolean;
  isTrialPeriod: boolean;
  productId: string | null;
  originalTransactionId: string | null;
  transactionId: string | null;
  purchaseDate: Date | null;
  expiresDate: Date | null;
  autoRenewStatus: boolean;
  environment: string;
  error?: string;
}

export interface AppleValidationResult {
  success: boolean;
  subscription: AppleSubscriptionStatus | null;
  error?: string;
}

export class AppleIAPService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = IS_PRODUCTION ? APPLE_PRODUCTION_URL : APPLE_SANDBOX_URL;
  }

  /**
   * Get Apple's JWKS for verifying signed data
   * Caches the result for 1 hour
   */
  private async getAppleJWKS(): Promise<jose.JWTVerifyGetKey> {
    const now = Date.now();
    if (cachedJWKS && now - jwksCacheTime < JWKS_CACHE_TTL) {
      return cachedJWKS;
    }

    cachedJWKS = jose.createRemoteJWKSet(new URL(APPLE_JWKS_URL));
    jwksCacheTime = now;
    return cachedJWKS;
  }

  /**
   * Verify and decode a JWS from Apple
   * SECURITY: Always verify signatures - never decode without verification
   */
  private async verifyAndDecodeJWS<T>(jws: string, description: string): Promise<T | null> {
    try {
      const jwks = await this.getAppleJWKS();

      // Verify the JWS signature using Apple's public keys
      const { payload } = await jose.jwtVerify(jws, jwks, {
        algorithms: ["ES256"],
      });

      return payload as T;
    } catch (verifyError) {
      // SECURITY: Never fall back to unverified decode - always reject invalid signatures
      console.error(`[AppleIAP] JWS verification failed for ${description}:`, verifyError);
      return null;
    }
  }

  /**
   * Generate JWT token for Apple App Store Server API authentication
   */
  private async generateToken(): Promise<string> {
    if (!APPLE_PRIVATE_KEY || !APPLE_PRIVATE_KEY.includes("-----BEGIN PRIVATE KEY-----")) {
      console.error("[AppleIAP] Invalid APPLE_PRIVATE_KEY format. Expected PKCS#8 with BEGIN/END headers.");
      console.error("[AppleIAP] Key starts with:", APPLE_PRIVATE_KEY?.substring(0, 50));
      throw new Error("APPLE_PRIVATE_KEY is not properly configured");
    }

    const privateKey = await jose.importPKCS8(APPLE_PRIVATE_KEY, "ES256");

    const jwt = await new jose.SignJWT({ bid: APPLE_BUNDLE_ID })
      .setProtectedHeader({ alg: "ES256", kid: APPLE_KEY_ID, typ: "JWT" })
      .setIssuer(APPLE_ISSUER_ID)
      .setIssuedAt()
      .setExpirationTime("1h")
      .setAudience("appstoreconnect-v1")
      .sign(privateKey);

    return jwt;
  }

  /**
   * Decode and verify a signed transaction from Apple
   */
  private async decodeSignedTransaction(
    signedTransaction: string
  ): Promise<AppleTransactionInfo | null> {
    return this.verifyAndDecodeJWS<AppleTransactionInfo>(
      signedTransaction,
      "signed transaction"
    );
  }

  /**
   * Decode and verify renewal info from Apple
   */
  private async decodeSignedRenewalInfo(
    signedRenewalInfo: string
  ): Promise<AppleRenewalInfo | null> {
    return this.verifyAndDecodeJWS<AppleRenewalInfo>(
      signedRenewalInfo,
      "signed renewal info"
    );
  }

  /**
   * Get subscription status from Apple using transaction ID
   */
  async getSubscriptionStatus(
    transactionId: string
  ): Promise<AppleValidationResult> {
    try {
      const token = await this.generateToken();

      const response = await fetch(
        `${this.baseUrl}/inApps/v1/subscriptions/${transactionId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[AppleIAP] Failed to get subscription status: ${response.status} - ${errorText}`
        );
        return {
          success: false,
          subscription: null,
          error: `Apple API error: ${response.status}`,
        };
      }

      const data = await response.json();
      return this.parseSubscriptionResponse(data);
    } catch (error) {
      console.error("[AppleIAP] Error getting subscription status:", error);
      return {
        success: false,
        subscription: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Validate a receipt (App Store receipt data)
   * This is used when the mobile app sends the receipt after purchase
   */
  async validateReceipt(
    receiptData: string,
    transactionId: string
  ): Promise<AppleValidationResult> {
    try {
      // For App Store Server API, we use the transaction ID to get status
      // The receipt-based validation is deprecated
      return await this.getSubscriptionStatus(transactionId);
    } catch (error) {
      console.error("[AppleIAP] Receipt validation error:", error);
      return {
        success: false,
        subscription: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get transaction history for a user
   */
  async getTransactionHistory(
    transactionId: string
  ): Promise<AppleTransactionInfo[]> {
    try {
      const token = await this.generateToken();

      const response = await fetch(
        `${this.baseUrl}/inApps/v1/history/${transactionId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(
          `[AppleIAP] Failed to get transaction history: ${response.status}`
        );
        return [];
      }

      const data = await response.json();
      const transactions: AppleTransactionInfo[] = [];

      for (const signedTransaction of data.signedTransactions || []) {
        const decoded = await this.decodeSignedTransaction(signedTransaction);
        if (decoded) {
          transactions.push(decoded);
        }
      }

      return transactions;
    } catch (error) {
      console.error("[AppleIAP] Error getting transaction history:", error);
      return [];
    }
  }

  /**
   * Parse subscription response from Apple API
   */
  private async parseSubscriptionResponse(
    data: any
  ): Promise<AppleValidationResult> {
    try {
      const subscriptionGroupIdentifierItem = data.data?.[0];
      if (!subscriptionGroupIdentifierItem) {
        return {
          success: false,
          subscription: null,
          error: "No subscription data found",
        };
      }

      const lastTransactionsItem =
        subscriptionGroupIdentifierItem.lastTransactions?.[0];
      if (!lastTransactionsItem) {
        return {
          success: false,
          subscription: null,
          error: "No transaction data found",
        };
      }

      const transactionInfo = await this.decodeSignedTransaction(
        lastTransactionsItem.signedTransactionInfo
      );
      const renewalInfo = lastTransactionsItem.signedRenewalInfo
        ? await this.decodeSignedRenewalInfo(
            lastTransactionsItem.signedRenewalInfo
          )
        : null;

      if (!transactionInfo) {
        return {
          success: false,
          subscription: null,
          error: "Failed to decode transaction info",
        };
      }

      // Validate environment - reject sandbox receipts in production
      if (IS_PRODUCTION && transactionInfo.environment === "Sandbox") {
        console.error(`[SECURITY] Sandbox receipt rejected in production environment - transactionId: ${transactionInfo.transactionId}, productId: ${transactionInfo.productId}`);
        return {
          success: false,
          subscription: null,
          error: "Sandbox receipt not allowed in production",
        };
      }

      const now = Date.now();
      const expiresDate = transactionInfo.expiresDate;
      const isActive = expiresDate > now;
      const status = lastTransactionsItem.status;

      // Status codes: 1 = Active, 2 = Expired, 3 = Billing Retry, 4 = Grace Period, 5 = Revoked
      const isTrialPeriod = transactionInfo.type === "Auto-Renewable Subscription" &&
        transactionInfo.inAppOwnershipType === "PURCHASED" &&
        (status === 1 || status === 4);

      return {
        success: true,
        subscription: {
          isValid: true,
          isActive,
          isTrialPeriod,
          productId: transactionInfo.productId,
          originalTransactionId: transactionInfo.originalTransactionId,
          transactionId: transactionInfo.transactionId,
          purchaseDate: new Date(transactionInfo.purchaseDate),
          expiresDate: new Date(expiresDate),
          autoRenewStatus: renewalInfo?.autoRenewStatus === 1,
          environment: transactionInfo.environment,
        },
      };
    } catch (error) {
      console.error("[AppleIAP] Error parsing subscription response:", error);
      return {
        success: false,
        subscription: null,
        error: error instanceof Error ? error.message : "Parse error",
      };
    }
  }

  /**
   * Verify webhook notification from Apple (App Store Server Notifications V2)
   * Uses Apple's public JWKS to verify the signature
   * SECURITY: Always verify signatures - never decode without verification
   */
  async verifyNotification(signedPayload: string): Promise<{
    isValid: boolean;
    notification: any | null;
    error?: string;
  }> {
    try {
      const parts = signedPayload.split(".");
      if (parts.length !== 3) {
        return {
          isValid: false,
          notification: null,
          error: "Invalid signed payload format",
        };
      }

      // Verify the JWS signature using Apple's public keys
      const jwks = await this.getAppleJWKS();

      const { payload } = await jose.jwtVerify(signedPayload, jwks, {
        algorithms: ["ES256"],
      });

      return {
        isValid: true,
        notification: payload,
      };
    } catch (error) {
      // SECURITY: Never fall back to unverified decode - always reject invalid signatures
      console.error("[AppleIAP] Webhook signature verification failed:", error);
      return {
        isValid: false,
        notification: null,
        error: error instanceof Error ? error.message : "Signature verification failed",
      };
    }
  }

  /**
   * Map Apple product ID to plan duration in days
   */
  static getProductDuration(productId: string): number {
    const durations: Record<string, number> = {
      reading_champ_1month: 30,
      reading_champ_3months: 90,
      reading_champ_6months: 180,
      reading_champ_12months: 365,
    };
    return durations[productId] || 30;
  }

  /**
   * Map Apple product ID to plan ID in database
   * This should match your Plan records
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
export const appleIAPService = new AppleIAPService();
