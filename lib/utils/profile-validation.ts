import { User } from "@/prisma/generated/prisma";

/**
 * Check if a user's profile is complete (has required fields)
 */
export function isProfileComplete(user: Partial<User> | null): boolean {
  if (!user) return false;
  
  // Required fields for a complete profile
  return !!(user.nickname && user.birthday);
}

/**
 * Get the redirect URL for incomplete profiles
 */
export function getIncompleteProfileRedirect(email: string): string {
  return `/signup/social?email=${encodeURIComponent(email)}`;
}