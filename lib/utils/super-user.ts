/**
 * Super User utility for bypassing access controls during testing.
 * This account has full access to all content without restrictions.
 */

export const SUPER_USER_EMAIL = "super@readingchamp.com";

/**
 * Check if the given email belongs to the super user account.
 * Super users bypass all access restrictions including:
 * - Campus assignment requirements
 * - BPA level assignments
 * - Novel semester assignments
 * - Premium subscription requirements
 */
export function isSuperUser(email: string | null | undefined): boolean {
  return email === SUPER_USER_EMAIL;
}
