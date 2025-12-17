export function calculateDaysRemaining(endDate: Date): number {
  const now = new Date();
  const end = new Date(endDate);

  // Reset time to start of day for both dates to avoid time-based discrepancies
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  // Calculate difference in milliseconds
  const diffInMs = end.getTime() - now.getTime();

  // Convert to days and round down (not up)
  // This gives us full days remaining
  const daysRemaining = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // Return 0 if negative (already expired)
  return Math.max(0, daysRemaining);
}
