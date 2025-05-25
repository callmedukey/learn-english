"server only";

import {
  Payment,
  PaymentStatus,
  Plan,
  UserSubscription,
} from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export interface UserPaymentWithDetails extends Payment {
  plan: Plan;
  subscription: UserSubscription | null;
}

export interface UserPaymentFilters {
  planId?: string | "ALL";
  dateRange?: "3months" | "1month" | "1year" | "5years" | "ALL";
  sortBy?: "latest" | "oldest";
}

export async function getUserPayments(
  userId: string,
  filters: UserPaymentFilters = {},
): Promise<UserPaymentWithDetails[]> {
  // Build where clause
  const where: any = {
    userId,
  };

  // Filter by plan
  if (filters.planId && filters.planId !== "ALL") {
    where.planId = filters.planId;
  }

  // Filter by date range
  if (filters.dateRange && filters.dateRange !== "ALL") {
    const now = new Date();
    let dateFrom: Date;

    switch (filters.dateRange) {
      case "1month":
        dateFrom = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          now.getDate(),
        );
        break;
      case "3months":
        dateFrom = new Date(
          now.getFullYear(),
          now.getMonth() - 3,
          now.getDate(),
        );
        break;
      case "1year":
        dateFrom = new Date(
          now.getFullYear() - 1,
          now.getMonth(),
          now.getDate(),
        );
        break;
      case "5years":
        dateFrom = new Date(
          now.getFullYear() - 5,
          now.getMonth(),
          now.getDate(),
        );
        break;
      default:
        dateFrom = new Date(0); // Beginning of time
    }

    where.requestedAt = {
      gte: dateFrom,
    };
  }

  // Determine sort order
  const orderBy = {
    requestedAt: filters.sortBy === "oldest" ? "asc" : "desc",
  } as const;

  return prisma.payment.findMany({
    where,
    include: {
      plan: true,
      subscription: true,
    },
    orderBy,
  });
}

export async function getPlansForUserFilter(): Promise<Plan[]> {
  return prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}
