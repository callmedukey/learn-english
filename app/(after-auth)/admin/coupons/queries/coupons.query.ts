"server only";

import { DiscountCoupon, Prisma } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export interface CouponWithStats extends DiscountCoupon {
  _count: {
    payments: number;
  };
}

export interface CouponFilters {
  search?: string;
  active?: boolean | "ALL";
}

export interface CouponQueryOptions {
  page?: number;
  limit?: number;
  filters?: CouponFilters;
}

export async function getCoupons({
  page = 1,
  limit = 20,
  filters = {},
}: CouponQueryOptions = {}) {
  const skip = (page - 1) * limit;

  // Build where clause based on filters
  const where: Prisma.DiscountCouponWhereInput = {};

  if (filters.active !== undefined && filters.active !== "ALL") {
    where.active = filters.active;
  }

  if (filters.search) {
    where.code = {
      contains: filters.search,
      mode: "insensitive",
    };
  }

  const [coupons, totalCount] = await Promise.all([
    prisma.discountCoupon.findMany({
      where,
      include: {
        _count: {
          select: {
            payments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.discountCoupon.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    coupons: coupons as CouponWithStats[],
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getCouponStats() {
  const [totalCoupons, activeCoupons, usedCoupons] = await Promise.all([
    prisma.discountCoupon.count(),
    prisma.discountCoupon.count({ where: { active: true } }),
    prisma.discountCoupon.count({
      where: {
        payments: {
          some: {},
        },
      },
    }),
  ]);

  return {
    totalCoupons,
    activeCoupons,
    usedCoupons,
    unusedCoupons: totalCoupons - usedCoupons,
  };
}

export async function createCoupon(data: {
  code: string;
  discount: number;
  flatDiscount: number;
  active?: boolean;
  oneTimeUse?: boolean;
  deadline?: Date | null;
}) {
  return prisma.discountCoupon.create({
    data: {
      code: data.code.toUpperCase(),
      discount: data.discount,
      flatDiscount: data.flatDiscount,
      active: data.active ?? true,
      oneTimeUse: data.oneTimeUse ?? false,
      deadline: data.deadline,
    },
  });
}

export async function updateCoupon(
  id: string,
  data: {
    code?: string;
    discount?: number;
    flatDiscount?: number;
    active?: boolean;
    oneTimeUse?: boolean;
    deadline?: Date | null;
  },
) {
  return prisma.discountCoupon.update({
    where: { id },
    data: {
      ...(data.code && { code: data.code.toUpperCase() }),
      ...(data.discount !== undefined && { discount: data.discount }),
      ...(data.flatDiscount !== undefined && {
        flatDiscount: data.flatDiscount,
      }),
      ...(data.active !== undefined && { active: data.active }),
      ...(data.oneTimeUse !== undefined && { oneTimeUse: data.oneTimeUse }),
      ...(data.deadline !== undefined && { deadline: data.deadline }),
    },
  });
}

export async function deleteCoupon(id: string) {
  return prisma.discountCoupon.delete({
    where: { id },
  });
}

export async function getCouponById(id: string) {
  return prisma.discountCoupon.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          payments: true,
        },
      },
    },
  });
}

export async function checkCouponExists(code: string, excludeId?: string) {
  const where: Prisma.DiscountCouponWhereInput = {
    code: code.toUpperCase(),
  };

  if (excludeId) {
    where.id = {
      not: excludeId,
    };
  }

  const coupon = await prisma.discountCoupon.findFirst({
    where,
  });

  return !!coupon;
}
