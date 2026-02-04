import { Platform } from "react-native";
import Constants from "expo-constants";

import { ALL_PRODUCT_IDS, getPlatform } from "./productIds";

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === "expo";

// Conditionally import react-native-iap (only works in dev builds)
let RNIap: any = null;
if (!isExpoGo) {
  try {
    RNIap = require("react-native-iap");
  } catch (e) {
    console.warn("[IAP] react-native-iap not available");
  }
}

export interface SubscriptionOfferDetails {
  offerId: string | null;
  offerToken: string;
  pricingPhases: {
    pricingPhaseList: Array<{
      formattedPrice: string;
      priceCurrencyCode: string;
      billingPeriod: string;
      billingCycleCount: number;
      recurrenceMode: number;
    }>;
  };
}

export interface IAPProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  localizedPrice: string;
  // Android-specific: Required for subscription purchases
  subscriptionOfferDetails?: SubscriptionOfferDetails[];
}

export interface IAPPurchase {
  productId: string;
  transactionId: string;
  transactionReceipt: string;
  purchaseToken?: string; // Android only
}

class IAPService {
  private isInitialized: boolean = false;
  private initPromise: Promise<boolean> | null = null;
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;

  /**
   * Check if IAP is supported (not in Expo Go)
   */
  isSupported(): boolean {
    return !isExpoGo && RNIap !== null;
  }

  /**
   * Initialize the IAP connection
   * Uses a singleton promise to prevent race conditions
   */
  async init(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn("[IAP] Not supported in Expo Go. Use a development build.");
      return false;
    }

    if (this.isInitialized) {
      return true;
    }

    // If initialization is already in progress, wait for it
    if (this.initPromise) {
      return this.initPromise;
    }

    // Start initialization and store the promise
    this.initPromise = this.doInit();
    return this.initPromise;
  }

  private async doInit(): Promise<boolean> {
    try {
      await RNIap.initConnection();
      this.isInitialized = true;
      console.log("[IAP] Connection initialized");
      return true;
    } catch (error) {
      console.error("[IAP] Failed to initialize:", error);
      this.initPromise = null; // Allow retry on failure
      return false;
    }
  }

  /**
   * End IAP connection (call on unmount)
   */
  async endConnection(): Promise<void> {
    if (!this.isSupported()) return;

    try {
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
      }
      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
        this.purchaseErrorSubscription = null;
      }
      await RNIap.endConnection();
      this.isInitialized = false;
      this.initPromise = null; // Reset promise so init can be called again
      console.log("[IAP] Connection ended");
    } catch (error) {
      console.error("[IAP] Error ending connection:", error);
    }
  }

  /**
   * Get available subscription products
   */
  async getSubscriptions(): Promise<IAPProduct[]> {
    if (!this.isSupported()) {
      console.warn("[IAP] Returning mock products for Expo Go");
      return this.getMockProducts();
    }

    try {
      await this.init();

      console.log("[IAP] Fetching products with IDs:", ALL_PRODUCT_IDS);

      const products = await RNIap.fetchProducts({
        skus: ALL_PRODUCT_IDS,
        type: "subs",
      });

      console.log("[IAP] Fetched products count:", products?.length ?? 0);
      console.log("[IAP] Raw products response:", JSON.stringify(products, null, 2));

      if (!products || products.length === 0) {
        console.warn("[IAP] No products returned from StoreKit. Possible causes:");
        console.warn("  1. Products not yet approved in App Store Connect (must be 'Ready to Submit')");
        console.warn("  2. Product IDs don't match App Store Connect configuration");
        console.warn("  3. App not signed with correct provisioning profile");
        console.warn("  4. Sandbox account not configured on device");
        console.warn("  Product IDs requested:", ALL_PRODUCT_IDS);
        return [];
      }

      // Filter out any undefined/null products
      // Note: react-native-iap v14 uses 'id' instead of 'productId'
      const validProducts = products.filter((p: any) => p && (p.id || p.productId));

      if (validProducts.length === 0) {
        console.warn("[IAP] Products returned but all are invalid/undefined");
        console.warn("[IAP] This may indicate a StoreKit configuration issue");
        return [];
      }

      console.log("[IAP] Products fetched successfully:", validProducts.map((p: any) => p.id || p.productId));

      return validProducts.map((product: any) => ({
        // v14 uses 'id', fallback to 'productId' for backwards compatibility
        productId: product.id || product.productId,
        title: product.title || product.displayName || product.name || "",
        description: product.description || "",
        // v14 returns price as number, convert to string for consistency
        price: product.price != null
          ? String(product.price)
          : (product.displayPrice || product.localizedPrice || "")
              .replace(/[^0-9]/g, "") || "",
        currency: product.currency || "",
        // v14 uses 'displayPrice' for localized price
        localizedPrice: product.displayPrice || product.localizedPrice || product.price || "",
        // Android: Include subscription offer details for offerToken
        // Note: react-native-iap v14 uses 'subscriptionOfferDetailsAndroid'
        subscriptionOfferDetails: Platform.OS === "android"
          ? product.subscriptionOfferDetailsAndroid
          : undefined,
      }));
    } catch (error: any) {
      console.error("[IAP] Failed to get subscriptions:", error);
      console.error("[IAP] StoreKit error details:", {
        code: error?.code,
        message: error?.message,
        userInfo: error?.userInfo,
      });
      throw error; // Re-throw to let useIAP handle with specific error messages
    }
  }

  /**
   * Get mock products for Expo Go development
   */
  private getMockProducts(): IAPProduct[] {
    return [
      {
        productId: "reading_champ_1month",
        title: "1 Month Subscription",
        description: "Monthly access to all content",
        price: "9900",
        currency: "KRW",
        localizedPrice: "₩9,900",
      },
      {
        productId: "reading_champ_3months",
        title: "3 Month Subscription",
        description: "Quarterly access to all content",
        price: "26900",
        currency: "KRW",
        localizedPrice: "₩26,900",
      },
      {
        productId: "reading_champ_6months",
        title: "6 Month Subscription",
        description: "Semi-annual access to all content",
        price: "49900",
        currency: "KRW",
        localizedPrice: "₩49,900",
      },
      {
        productId: "reading_champ_12months",
        title: "12 Month Subscription",
        description: "Annual access to all content",
        price: "99000",
        currency: "KRW",
        localizedPrice: "₩99,000",
      },
    ];
  }

  /**
   * Clean up existing purchase listeners to prevent duplicates
   */
  private cleanupPurchaseListeners(): void {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
      this.purchaseUpdateSubscription = null;
    }
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
      this.purchaseErrorSubscription = null;
    }
  }

  /**
   * Purchase a subscription
   * @param productId - The product ID to purchase
   * @param offerToken - Android only: The offer token from subscriptionOfferDetails
   * @param onPurchaseUpdate - Callback when purchase is updated
   * @param onPurchaseError - Callback when purchase fails
   */
  async purchaseSubscription(
    productId: string,
    offerToken?: string,
    onPurchaseUpdate?: (purchase: IAPPurchase) => void,
    onPurchaseError?: (error: any) => void
  ): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("In-app purchases are not available in Expo Go. Please use a development build.");
    }

    try {
      await this.init();

      // Clean up any existing listeners before setting new ones
      // This prevents duplicate callbacks on rapid clicks
      this.cleanupPurchaseListeners();

      // Set up purchase listeners
      this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
        async (purchase: any) => {
          console.log("[IAP] Purchase updated:", purchase);

          const iapPurchase: IAPPurchase = {
            productId: purchase.productId,
            // v14 uses 'id' as the primary transaction identifier
            transactionId: purchase.id || purchase.transactionId || "",
            // v14 uses 'purchaseToken' as unified receipt (iOS JWS, Android purchaseToken)
            transactionReceipt: purchase.purchaseToken || "",
            purchaseToken:
              Platform.OS === "android"
                ? purchase.purchaseToken
                : undefined,
          };

          if (onPurchaseUpdate) {
            onPurchaseUpdate(iapPurchase);
          }
        }
      );

      this.purchaseErrorSubscription = RNIap.purchaseErrorListener(
        (error: any) => {
          console.error("[IAP] Purchase error:", error);
          if (onPurchaseError) {
            onPurchaseError(error);
          }
        }
      );

      // Request the subscription purchase using v14 API
      if (Platform.OS === "ios") {
        await RNIap.requestPurchase({
          request: {
            ios: {
              sku: productId,
            },
          },
          type: "subs",
        });
      } else {
        // Android requires offerToken from subscriptionOfferDetails
        if (!offerToken) {
          throw new Error("offerToken is required for Android subscription purchases");
        }
        await RNIap.requestPurchase({
          request: {
            android: {
              skus: [productId],
              subscriptionOffers: [
                {
                  sku: productId,
                  offerToken,
                },
              ],
            },
          },
          type: "subs",
        });
      }
    } catch (error: any) {
      // Handle user cancellation gracefully
      const isCancelled =
        error.code === "E_USER_CANCELLED" ||
        error.code === "user-cancelled" ||
        error.message?.toLowerCase().includes("cancel");

      if (isCancelled) {
        console.log("[IAP] User cancelled purchase");
        throw new Error("Purchase cancelled");
      }

      console.error("[IAP] Purchase request failed:", error);
      throw error;
    }
  }

  /**
   * Finish a transaction (call after validating on server)
   */
  async finishTransaction(
    transactionId: string,
    isConsumable: boolean = false
  ): Promise<void> {
    if (!this.isSupported()) return;

    try {
      if (Platform.OS === "ios") {
        await RNIap.finishTransaction({
          purchase: { transactionId } as any,
          isConsumable,
        });
      } else {
        // Android handles acknowledgement differently
        // The server should acknowledge via Google Play API
      }
      console.log("[IAP] Transaction finished:", transactionId);
    } catch (error) {
      console.error("[IAP] Failed to finish transaction:", error);
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<IAPPurchase[]> {
    if (!this.isSupported()) {
      throw new Error("In-app purchases are not available in Expo Go. Please use a development build.");
    }

    try {
      await this.init();

      console.log("[IAP] Fetching available purchases...");
      const purchases = await RNIap.getAvailablePurchases();
      console.log("[IAP] Available purchases count:", purchases?.length ?? 0);
      console.log("[IAP] Available purchases:", JSON.stringify(purchases, null, 2));

      if (!purchases || purchases.length === 0) {
        console.log("[IAP] No purchases found. Note: Sandbox subscriptions expire quickly.");
        return [];
      }

      return purchases.map((purchase: any) => ({
        productId: purchase.productId,
        // v14 uses 'id' as the primary transaction identifier
        transactionId: purchase.id || purchase.transactionId || "",
        // v14 uses 'purchaseToken' as unified receipt (iOS JWS, Android purchaseToken)
        transactionReceipt: purchase.purchaseToken || "",
        purchaseToken:
          Platform.OS === "android"
            ? purchase.purchaseToken
            : undefined,
      }));
    } catch (error) {
      console.error("[IAP] Failed to restore purchases:", error);
      return [];
    }
  }

  /**
   * Check if IAP is available on this device
   */
  async isAvailable(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      await this.init();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const iapService = new IAPService();
