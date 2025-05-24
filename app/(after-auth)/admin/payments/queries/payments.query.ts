"server only";

import {
  Payment,
  PaymentStatus,
  PaymentMethod,
  Plan,
  UserSubscription,
} from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export interface PaymentWithDetails extends Payment {
  user: {
    id: string;
    email: string;
    name: string | null;
    nickname: string | null;
  };
  plan: Plan;
  subscription: UserSubscription | null;
}

export interface PaymentFilters {
  status?: PaymentStatus | "ALL";
  method?: PaymentMethod | "ALL";
  dateFrom?: Date;
  dateTo?: Date;
  search?: string; // Search by user email, name, or order ID
  planId?: string | "ALL";
}

export interface PaymentQueryOptions {
  page?: number;
  limit?: number;
  filters?: PaymentFilters;
}

export async function getPayments({
  page = 1,
  limit = 20,
  filters = {},
}: PaymentQueryOptions = {}) {
  const skip = (page - 1) * limit;

  // Build where clause based on filters
  const where: any = {};

  if (filters.status && filters.status !== "ALL") {
    where.status = filters.status;
  }

  if (filters.method && filters.method !== "ALL") {
    where.method = filters.method;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.requestedAt = {};
    if (filters.dateFrom) {
      where.requestedAt.gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      where.requestedAt.lte = filters.dateTo;
    }
  }

  if (filters.planId && filters.planId !== "ALL") {
    where.planId = filters.planId;
  }

  if (filters.search) {
    where.OR = [
      {
        orderId: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        user: {
          email: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      },
      {
        user: {
          name: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      },
      {
        user: {
          nickname: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  const [payments, totalCount] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            nickname: true,
          },
        },
        plan: true,
        subscription: true,
      },
      orderBy: {
        requestedAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    payments: payments as PaymentWithDetails[],
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getPaymentStats() {
  const [
    totalRevenue,
    totalPayments,
    successfulPayments,
    pendingPayments,
    failedPayments,
    revenueByStatus,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
    prisma.payment.count(),
    prisma.payment.count({ where: { status: "PAID" } }),
    prisma.payment.count({ where: { status: "PENDING" } }),
    prisma.payment.count({ where: { status: "FAILED" } }),
    prisma.payment.groupBy({
      by: ["status"],
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  return {
    totalRevenue: totalRevenue._sum.amount || 0,
    totalPayments,
    successfulPayments,
    pendingPayments,
    failedPayments,
    successRate:
      totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
    revenueByStatus,
  };
}

export async function getPlansForFilter() {
  return prisma.plan.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      price: true,
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getPaymentById(id: string) {
  return prisma.payment.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          nickname: true,
        },
      },
      plan: true,
      subscription: true,
    },
  });
}
