import redisClient from "./redis-client";

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Simple sliding window rate limiter using Redis
 * @param key - Unique identifier (e.g., IP address, user ID)
 * @param limit - Maximum number of requests allowed
 * @param windowSeconds - Time window in seconds
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const redisKey = `rate_limit:${key}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  // Remove old entries outside the window
  await redisClient.zRemRangeByScore(redisKey, 0, windowStart);

  // Count current requests in window
  const currentCount = await redisClient.zCard(redisKey);

  if (currentCount >= limit) {
    // Get the oldest entry to calculate reset time
    const oldestEntries = await redisClient.zRange(redisKey, 0, 0);
    const oldestTimestamp = oldestEntries.length > 0 ? parseInt(oldestEntries[0]) : now;
    const resetInSeconds = Math.ceil((oldestTimestamp + windowSeconds * 1000 - now) / 1000);

    return {
      success: false,
      remaining: 0,
      resetInSeconds: Math.max(resetInSeconds, 1),
    };
  }

  // Add current request
  await redisClient.zAdd(redisKey, { score: now, value: now.toString() });

  // Set expiry on the key
  await redisClient.expire(redisKey, windowSeconds);

  return {
    success: true,
    remaining: limit - currentCount - 1,
    resetInSeconds: windowSeconds,
  };
}

/**
 * Rate limit for login attempts - stricter limits
 * 5 attempts per 15 minutes per IP
 */
export async function rateLimitLogin(ip: string): Promise<RateLimitResult> {
  return rateLimit(`login:${ip}`, 5, 15 * 60);
}
