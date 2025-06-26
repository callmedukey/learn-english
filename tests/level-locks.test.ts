import { describe, it, expect, jest } from "@jest/globals";

import { prisma } from "@/prisma/prisma-client";
import {
  checkLevelLockPermission,
  getUserLevelLock,
} from "@/server-queries/level-locks";

// Mock Prisma client
jest.mock("@/prisma/prisma-client", () => ({
  prisma: {
    userLevelLock: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock date-fns-tz
jest.mock("date-fns-tz", () => ({
  toZonedTime: jest.fn(() => new Date(2024, 0, 15)), // January 15, 2024
}));

describe("Level Lock System", () => {
  const mockUserId = "test-user-123";
  const mockArId = "ar-level-1";
  const mockRcId = "rc-level-1";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkLevelLockPermission", () => {
    it("should allow access when no lock exists", async () => {
      (prisma.userLevelLock.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await checkLevelLockPermission(mockUserId, "AR", mockArId);

      expect(result.allowed).toBe(true);
      expect(result.shouldCreateLock).toBe(true);
      expect(result.currentLevel).toBeNull();
    });

    it("should allow access to the locked level", async () => {
      (prisma.userLevelLock.findUnique as jest.Mock).mockResolvedValue({
        id: "lock-1",
        userId: mockUserId,
        levelType: "AR",
        levelId: mockArId,
        year: 2024,
        month: 1,
        changesUsed: 0,
      });

      const result = await checkLevelLockPermission(mockUserId, "AR", mockArId);

      expect(result.allowed).toBe(true);
      expect(result.shouldCreateLock).toBe(false);
      expect(result.currentLevel).toBe(mockArId);
    });

    it("should deny access to a different level when locked", async () => {
      (prisma.userLevelLock.findUnique as jest.Mock).mockResolvedValue({
        id: "lock-1",
        userId: mockUserId,
        levelType: "AR",
        levelId: "ar-level-2",
        year: 2024,
        month: 1,
        changesUsed: 0,
      });

      const result = await checkLevelLockPermission(mockUserId, "AR", mockArId);

      expect(result.allowed).toBe(false);
      expect(result.shouldCreateLock).toBe(false);
      expect(result.currentLevel).toBe("ar-level-2");
    });
  });

  describe("getUserLevelLock", () => {
    it("should return null when no lock exists", async () => {
      (prisma.userLevelLock.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getUserLevelLock(mockUserId, "RC");

      expect(result).toBeNull();
      expect(prisma.userLevelLock.findUnique).toHaveBeenCalledWith({
        where: {
          userId_levelType_year_month: {
            userId: mockUserId,
            levelType: "RC",
            year: 2024,
            month: 1,
          },
        },
      });
    });

    it("should return the lock when it exists", async () => {
      const mockLock = {
        id: "lock-1",
        userId: mockUserId,
        levelType: "RC",
        levelId: mockRcId,
        year: 2024,
        month: 1,
        changesUsed: 1,
      };

      (prisma.userLevelLock.findUnique as jest.Mock).mockResolvedValue(
        mockLock,
      );

      const result = await getUserLevelLock(mockUserId, "RC");

      expect(result).toEqual(mockLock);
    });
  });
});
