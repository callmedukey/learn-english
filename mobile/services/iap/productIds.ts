import { Platform } from "react-native";

// Product IDs must match App Store Connect / Google Play Console
export const SUBSCRIPTION_PRODUCT_IDS = {
  MONTHLY: "reading_champ_1month",
  QUARTERLY: "reading_champ_3months",
  SEMIANNUAL: "reading_champ_6months",
  YEARLY: "reading_champ_12months",
} as const;

export const ALL_PRODUCT_IDS = Object.values(SUBSCRIPTION_PRODUCT_IDS);

// Product metadata for display
export const PRODUCT_METADATA: Record<
  string,
  {
    name: string;
    duration: number; // in days
    durationLabel: string;
    badge?: string;
    trialDays: number;
  }
> = {
  [SUBSCRIPTION_PRODUCT_IDS.MONTHLY]: {
    name: "1개월 구독",
    duration: 30,
    durationLabel: "1개월",
    trialDays: 7,
  },
  [SUBSCRIPTION_PRODUCT_IDS.QUARTERLY]: {
    name: "3개월 구독",
    duration: 90,
    durationLabel: "3개월",
    trialDays: 7,
  },
  [SUBSCRIPTION_PRODUCT_IDS.SEMIANNUAL]: {
    name: "6개월 구독",
    duration: 180,
    durationLabel: "6개월",
    badge: "인기",
    trialDays: 7,
  },
  [SUBSCRIPTION_PRODUCT_IDS.YEARLY]: {
    name: "12개월 구독",
    duration: 365,
    durationLabel: "12개월",
    badge: "최고 혜택",
    trialDays: 7,
  },
};

// Get platform-specific info
export const getPlatform = (): "ios" | "android" => {
  return Platform.OS as "ios" | "android";
};

// App Store / Play Store subscription management URLs
export const getSubscriptionManagementUrl = (): string => {
  if (Platform.OS === "ios") {
    return "itms-apps://apps.apple.com/account/subscriptions";
  }
  return "https://play.google.com/store/account/subscriptions";
};
