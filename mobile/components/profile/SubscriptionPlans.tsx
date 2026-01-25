import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";

import { PlanCard } from "./PlanCard";
import { useIAP, IAPProduct, SUBSCRIPTION_PRODUCT_IDS } from "@/services/iap";

interface SubscriptionPlansProps {
  onSubscriptionChange?: () => void;
  currentProductId?: string | null;
}

export function SubscriptionPlans({
  onSubscriptionChange,
  currentProductId,
}: SubscriptionPlansProps) {
  const { products, isLoading, isPurchasing, error, purchase, restore } =
    useIAP(onSubscriptionChange);

  // Sort products in desired order
  const sortedProducts = products.sort((a, b) => {
    const order: string[] = [
      SUBSCRIPTION_PRODUCT_IDS.MONTHLY,
      SUBSCRIPTION_PRODUCT_IDS.QUARTERLY,
      SUBSCRIPTION_PRODUCT_IDS.YEARLY,
    ];
    return order.indexOf(a.productId) - order.indexOf(b.productId);
  });

  if (isLoading && products.length === 0) {
    return (
      <View className="items-center justify-center py-8">
        <ActivityIndicator size="large" color="#5D3A29" />
        <Text className="mt-2 text-sm text-muted-foreground">
          Loading products...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="items-center justify-center py-8">
        <Text className="text-center text-sm text-red-500">{error}</Text>
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View className="items-center justify-center py-8">
        <Text className="text-center text-sm text-muted-foreground">
          No subscription products available.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      {/* Plan Cards */}
      {sortedProducts.map((product) => (
        <PlanCard
          key={product.productId}
          product={product}
          onPurchase={purchase}
          isPurchasing={isPurchasing}
          isCurrentPlan={currentProductId === product.productId}
        />
      ))}

      {/* Restore Button */}
      <TouchableOpacity
        className="flex-row items-center justify-center gap-2 py-3"
        onPress={restore}
        activeOpacity={0.7}
        disabled={isLoading}
      >
        <Text className="text-sm text-muted-foreground underline">
          Restore previous purchases
        </Text>
      </TouchableOpacity>

      {/* Terms */}
      <View className="mt-2">
        <Text className="text-center text-xs text-muted-foreground">
          Subscription will be charged upon confirmation and will automatically
          renew unless canceled at least 24 hours before the end of the current
          period. Subscriptions can be managed in your account settings after
          purchase.
        </Text>
      </View>
    </View>
  );
}
