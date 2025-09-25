import { auth } from "@/auth";

/**
 * Check if the current user has access to payment features
 * All authenticated users now have access to payments
 */
export async function hasPaymentAccess(): Promise<boolean> {
  const session = await auth();

  if (!session?.user?.email) {
    return false;
  }

  // All authenticated users have payment access
  return true;
}

/**
 * Check if a specific email has access to payment features
 * All emails now have access to payments
 */
export function hasPaymentAccessByEmail(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
  _email: string,
): boolean {
  return true;
}

/**
 * Get maintenance message for payment system
 * Currently not used since payments are available to all users
 */
export function getPaymentMaintenanceMessage(): string {
  return "Payment system is currently under maintenance. Please check back later.";
}