import { User, Plan } from "@/prisma/generated/prisma";

interface PaymentConfig {
  currency: string;
  amount: number;
  supportsBillingKey: boolean;
  supportsAutoRenewal: boolean;
  supportedMethods: string[];
  renewalMessage: string;
}

export function getPaymentConfig(
  user: User & { country?: { name: string } | null },
  plan: Plan
): PaymentConfig {
  const isKorean = user.country?.name === "South Korea";
  
  return {
    // Different currencies based on user location
    currency: isKorean ? "KRW" : "USD",
    amount: isKorean ? plan.price : Math.round((plan.priceUSD || plan.price / 1300) * 100), // Convert to cents for USD
    
    // Billing key support - only for Korean users
    supportsBillingKey: isKorean,
    supportsAutoRenewal: isKorean,
    
    // Payment methods available
    supportedMethods: isKorean 
      ? ["CARD", "TRANSFER", "MOBILE"] 
      : ["CARD"], // International users can only use cards
      
    // UI messaging
    renewalMessage: isKorean
      ? "자동 갱신을 활성화하여 끊김 없는 서비스를 이용하세요"
      : "Note: International cards require manual renewal. We'll send you a reminder email before your subscription expires."
  };
}

export function shouldOfferBillingKeyRegistration(
  user: User & { country?: { name: string } | null }
): boolean {
  // Only offer billing key registration to Korean users
  return user.country?.name === "South Korea";
}

export function formatCurrency(amount: number, currency: string): string {
  if (currency === "KRW") {
    return `₩${amount.toLocaleString("ko-KR")}`;
  } else if (currency === "USD") {
    // Amount is in cents, convert to dollars
    return `$${(amount / 100).toFixed(2)}`;
  }
  return `${currency} ${amount}`;
}