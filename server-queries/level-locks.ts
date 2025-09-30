import "server-only";
import { prisma } from "@/prisma/prisma-client";

/**
 * Get system configuration value
 */
export async function getSystemConfig(key: string) {
  const config = await prisma.systemConfig.findUnique({
    where: { key },
  });

  if (!config) {
    return null;
  }

  try {
    return JSON.parse(config.value);
  } catch {
    return config.value;
  }
}

/**
 * Get multiple system configuration values
 */
export async function getSystemConfigs(keys: string[]) {
  const configs = await prisma.systemConfig.findMany({
    where: {
      key: {
        in: keys,
      },
    },
  });

  const result: Record<string, any> = {};
  for (const config of configs) {
    try {
      result[config.key] = JSON.parse(config.value);
    } catch {
      result[config.key] = config.value;
    }
  }

  return result;
}

