"server only";

import { prisma } from "@/prisma/prisma-client";

export interface PlanFilters {
  search?: string;
  active?: boolean;
}

export interface PlanQueryOptions {
  filters?: PlanFilters;
}

export interface PlanStats {
  totalPlans: number;
  activePlans: number;
  inactivePlans: number;
  totalRevenue: number;
}

export async function getPlans({ filters = {} }: PlanQueryOptions = {}) {
  // Build where clause based on filters
  const where: any = {};

  if (filters.search) {
    where.OR = [
      {
        name: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (filters.active !== undefined) {
    where.isActive = filters.active;
  }

  const plans = await prisma.plan.findMany({
    where,
    include: {
      _count: {
        select: {
          payments: true,
          subscriptions: true,
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return { plans };
}

export async function getPlanStats(): Promise<PlanStats> {
  const [totalPlans, activePlans, inactivePlans, revenueResult] =
    await Promise.all([
      prisma.plan.count(),
      prisma.plan.count({ where: { isActive: true } }),
      prisma.plan.count({ where: { isActive: false } }),
      prisma.payment.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
      }),
    ]);

  return {
    totalPlans,
    activePlans,
    inactivePlans,
    totalRevenue: revenueResult._sum.amount || 0,
  };
}

export async function getPlanById(id: string) {
  return prisma.plan.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          payments: true,
          subscriptions: true,
        },
      },
    },
  });
}
