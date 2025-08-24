import { auth } from "@/auth";

/**
 * Check if the current user has access to payment features
 * During maintenance, only test@readingchamp.com has access
 */
export async function hasPaymentAccess(): Promise<boolean> {
  const session = await auth();
  
  if (!session?.user?.email) {
    return false;
  }
  
  // Only allow test account during maintenance
  return session.user.email === "test@readingchamp.com";
}

/**
 * Check if a specific email has access to payment features
 */
export function hasPaymentAccessByEmail(email: string): boolean {
  return email === "test@readingchamp.com";
}

/**
 * Get maintenance message for payment system
 */
export function getPaymentMaintenanceMessage(): string {
  return "Payment system is currently under maintenance. Please check back later.";
}