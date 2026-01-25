import { useState, useEffect, useCallback } from "react";
import { Alert, Linking, Platform } from "react-native";

import { iapService, IAPProduct, IAPPurchase } from "./iapService";
import { getSubscriptionManagementUrl, getPlatform } from "./productIds";
import { apiClient } from "../api/client";

interface UseIAPResult {
  products: IAPProduct[];
  isLoading: boolean;
  isPurchasing: boolean;
  error: string | null;
  purchase: (productId: string) => Promise<boolean>;
  restore: () => Promise<boolean>;
  openSubscriptionManagement: () => void;
}

interface ValidationResponse {
  success: boolean;
  subscription: {
    id: string;
    status: string;
    planName: string;
    startDate: string;
    endDate: string;
    isTrialPeriod: boolean;
    autoRenew: boolean;
    paymentSource: string;
  } | null;
  error?: string;
}

interface RestoreResponse {
  success: boolean;
  restoredCount: number;
  subscription: any | null;
  error?: string;
}

export function useIAP(onSubscriptionChange?: () => void): UseIAPResult {
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize and load products
  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const available = await iapService.isAvailable();
        if (!available) {
          setError("In-app purchases are not available");
          return;
        }

        const subs = await iapService.getSubscriptions();
        if (mounted) {
          setProducts(subs);
        }
      } catch (err: any) {
        console.error("[useIAP] Error loading products:", err);
        console.error("[useIAP] Error details:", {
          code: err?.code,
          message: err?.message,
          userInfo: err?.userInfo,
          nativeStackIOS: err?.nativeStackIOS,
        });
        if (mounted) {
          // Provide more specific error messages based on error type
          let errorMessage = "Failed to load product information";
          if (err?.code === "E_SERVICE_ERROR") {
            errorMessage = "App Store service unavailable. Please try again later.";
          } else if (err?.code === "E_UNKNOWN") {
            errorMessage = "Products may not be configured in App Store Connect.";
          } else if (err?.message?.includes("sandbox")) {
            errorMessage = "Sandbox account not configured. Sign in via Settings > App Store.";
          }
          setError(errorMessage);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      mounted = false;
      iapService.endConnection();
    };
  }, []);

  // Validate purchase with server
  const validatePurchase = useCallback(
    async (purchase: IAPPurchase): Promise<boolean> => {
      try {
        const platform = getPlatform();

        const response = await apiClient.post<ValidationResponse>(
          "/api/mobile/iap/validate",
          {
            platform,
            productId: purchase.productId,
            transactionId: purchase.transactionId,
            receipt: purchase.transactionReceipt,
            purchaseToken: purchase.purchaseToken,
          }
        );

        if (response.data.success) {
          // Finish the transaction
          await iapService.finishTransaction(purchase.transactionId);

          // Notify parent of subscription change
          if (onSubscriptionChange) {
            onSubscriptionChange();
          }

          return true;
        } else {
          console.error("[useIAP] Validation failed:", response.data.error);
          setError(response.data.error || "Purchase validation failed");
          return false;
        }
      } catch (err: any) {
        console.error("[useIAP] Validation error:", err);
        setError("An error occurred during purchase validation");
        return false;
      }
    },
    [onSubscriptionChange]
  );

  // Purchase timeout in milliseconds (2 minutes)
  const PURCHASE_TIMEOUT = 120000;

  // Purchase a subscription
  const purchase = useCallback(
    async (productId: string): Promise<boolean> => {
      if (isPurchasing) {
        return false;
      }

      try {
        setIsPurchasing(true);
        setError(null);

        // For Android, get the offerToken from the product
        const product = products.find((p) => p.productId === productId);
        const offerToken = product?.subscriptionOfferDetails?.[0]?.offerToken;

        let purchaseSuccess = false;
        let purchaseCompleted = false;

        // Create a promise that resolves when purchase completes or rejects on timeout
        const purchasePromise = new Promise<boolean>((resolve, reject) => {
          // Set up timeout
          const timeoutId = setTimeout(() => {
            if (!purchaseCompleted) {
              reject(new Error("Purchase timed out"));
            }
          }, PURCHASE_TIMEOUT);

          iapService.purchaseSubscription(
            productId,
            offerToken, // Pass offerToken for Android
            async (purchaseData) => {
              clearTimeout(timeoutId);
              purchaseCompleted = true;
              // Purchase completed, validate with server
              const validated = await validatePurchase(purchaseData);
              purchaseSuccess = validated;

              if (validated) {
                Alert.alert(
                  "Subscription Complete",
                  "Your subscription has been activated successfully!",
                  [{ text: "OK" }]
                );
              }
              resolve(purchaseSuccess);
            },
            (purchaseError) => {
              clearTimeout(timeoutId);
              purchaseCompleted = true;
              console.error("[useIAP] Purchase error:", purchaseError);

              if (purchaseError.code !== "E_USER_CANCELLED") {
                setError("An error occurred during purchase");
                Alert.alert(
                  "Purchase Failed",
                  "An error occurred while processing your purchase. Please try again.",
                  [{ text: "OK" }]
                );
              }
              resolve(false);
            }
          ).catch((err) => {
            clearTimeout(timeoutId);
            purchaseCompleted = true;
            reject(err);
          });
        });

        return await purchasePromise;
      } catch (err: any) {
        console.error("[useIAP] Purchase failed:", err);

        if (err.message === "Purchase cancelled") {
          // User cancelled, no error
          return false;
        }

        if (err.message === "Purchase timed out") {
          setError("Purchase timed out. Please try again.");
          Alert.alert(
            "Timeout",
            "The purchase process timed out. Please try again.",
            [{ text: "OK" }]
          );
          return false;
        }

        setError("An error occurred during purchase");
        return false;
      } finally {
        setIsPurchasing(false);
      }
    },
    [isPurchasing, validatePurchase, products]
  );

  // Restore purchases
  const restore = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const purchases = await iapService.restorePurchases();

      if (purchases.length === 0) {
        Alert.alert(
          "No Purchases to Restore",
          "No previous purchases were found to restore.",
          [{ text: "OK" }]
        );
        return false;
      }

      // Send to server for validation
      const platform = getPlatform();
      const purchasesData = purchases.map((p) => ({
        transactionId: p.transactionId,
        productId: p.productId,
        purchaseToken: p.purchaseToken,
      }));

      const response = await apiClient.post<RestoreResponse>(
        "/api/mobile/subscription/restore",
        {
          platform,
          purchases: purchasesData,
        }
      );

      if (response.data.success && response.data.restoredCount > 0) {
        // Finish transactions
        for (const purchase of purchases) {
          await iapService.finishTransaction(purchase.transactionId);
        }

        if (onSubscriptionChange) {
          onSubscriptionChange();
        }

        Alert.alert(
          "Restore Complete",
          `${response.data.restoredCount} subscription(s) have been restored.`,
          [{ text: "OK" }]
        );
        return true;
      } else {
        Alert.alert(
          "No Purchases to Restore",
          "No valid subscriptions were found.",
          [{ text: "OK" }]
        );
        return false;
      }
    } catch (err: any) {
      console.error("[useIAP] Restore failed:", err);
      setError("Failed to restore purchases");
      Alert.alert(
        "Restore Failed",
        "An error occurred while restoring purchases.",
        [{ text: "OK" }]
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [onSubscriptionChange]);

  // Open subscription management (App Store / Play Store)
  const openSubscriptionManagement = useCallback(() => {
    const url = getSubscriptionManagementUrl();
    Linking.openURL(url).catch((err) => {
      console.error("[useIAP] Failed to open subscription management:", err);
      Alert.alert(
        "Error",
        Platform.OS === "ios"
          ? "Could not open App Store settings."
          : "Could not open Google Play settings.",
        [{ text: "OK" }]
      );
    });
  }, []);

  return {
    products,
    isLoading,
    isPurchasing,
    error,
    purchase,
    restore,
    openSubscriptionManagement,
  };
}
