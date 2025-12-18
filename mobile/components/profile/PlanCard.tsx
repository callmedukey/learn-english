import { Ionicons } from "@expo/vector-icons";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";

import { IAPProduct, PRODUCT_METADATA } from "@/services/iap";

interface PlanCardProps {
  product: IAPProduct;
  onPurchase: (productId: string) => void;
  isPurchasing: boolean;
  isCurrentPlan?: boolean;
}

export function PlanCard({
  product,
  onPurchase,
  isPurchasing,
  isCurrentPlan,
}: PlanCardProps) {
  const metadata = PRODUCT_METADATA[product.productId];
  const badge = metadata?.badge;
  const trialDays = metadata?.trialDays || 7;

  return (
    <View
      className={`rounded-2xl bg-white p-4 shadow-sm ${
        badge ? "border-2 border-primary" : ""
      } ${isCurrentPlan ? "opacity-50" : ""}`}
    >
      {/* Badge */}
      {badge && (
        <View className="absolute -top-3 left-4">
          <View className="rounded-full bg-primary px-3 py-1">
            <Text className="text-xs font-semibold text-white">{badge}</Text>
          </View>
        </View>
      )}

      {/* Header */}
      <View className="mb-3 mt-1">
        <Text className="text-lg font-semibold text-foreground">
          {metadata?.name || product.title}
        </Text>
        <Text className="text-sm text-muted-foreground">
          {metadata?.durationLabel || product.description}
        </Text>
      </View>

      {/* Price */}
      <View className="mb-4">
        <Text className="text-2xl font-bold text-primary">
          {product.localizedPrice}
        </Text>
        {metadata && (
          <Text className="text-xs text-muted-foreground">
            월{" "}
            {Math.round(
              parseInt(product.price.replace(/[^0-9]/g, ""), 10) /
                (metadata.duration / 30)
            ).toLocaleString()}
            원
          </Text>
        )}
      </View>

      {/* Trial Info */}
      <View className="mb-4 flex-row items-center gap-2 rounded-lg bg-blue-50 p-3">
        <Ionicons name="gift-outline" size={18} color="#2563EB" />
        <Text className="text-sm text-blue-700">
          {trialDays}일 무료 체험 포함
        </Text>
      </View>

      {/* Features */}
      <View className="mb-4 gap-2">
        <View className="flex-row items-center gap-2">
          <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
          <Text className="text-sm text-foreground">모든 소설 무제한 이용</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
          <Text className="text-sm text-foreground">RC 연습 무제한</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
          <Text className="text-sm text-foreground">월간 리더보드 참여</Text>
        </View>
      </View>

      {/* Purchase Button */}
      <TouchableOpacity
        className={`flex-row items-center justify-center gap-2 rounded-lg py-3 ${
          isCurrentPlan ? "bg-gray-200" : "bg-primary"
        }`}
        onPress={() => !isCurrentPlan && !isPurchasing && onPurchase(product.productId)}
        activeOpacity={isCurrentPlan ? 1 : 0.7}
        disabled={isCurrentPlan || isPurchasing}
      >
        {isPurchasing ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Text
              className={`font-semibold ${
                isCurrentPlan ? "text-gray-500" : "text-white"
              }`}
            >
              {isCurrentPlan ? "현재 구독 중" : "무료 체험 시작"}
            </Text>
            {!isCurrentPlan && (
              <Ionicons name="arrow-forward" size={18} color="white" />
            )}
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}
