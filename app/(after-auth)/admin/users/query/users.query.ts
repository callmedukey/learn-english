"server only";

import calculateBirthYearRangeForGrade from "@/lib/utils/calculate-birth-year-range";
import calculateGrade from "@/lib/utils/calculate-grade";
import {
  User as PrismaUser,
  Gender,
  Role,
  SubscriptionStatus,
} from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

interface UserWithReferrerAndCountryAndSubscription extends PrismaUser {
  referrer: {
    nickname: string | null;
  } | null;
  country: {
    id: string;
    name: string;
  } | null;
  subscriptions: {
    id: string;
    status: SubscriptionStatus;
    startDate: Date;
    endDate: Date;
    plan: {
      name: string;
      price: number;
    };
  }[];
}

export interface UserData
  extends Omit<
    UserWithReferrerAndCountryAndSubscription,
    "referrer" | "birthday" | "gender" | "country" | "subscriptions"
  > {
  id: string;
  nickname: string | null;
  email: string;
  birthday: string | null;
  grade: string;
  gender: string | null;
  country: {
    id: string;
    name: string;
  } | null;
  referrerNickname?: string | null;
  name: string | null;
  username: string | null;
  isReferred: boolean;
  referrerCount: number;
  emailVerified: Date | null;
  image: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  // Subscription information
  hasActiveSubscription: boolean;
  activeSubscription: {
    id: string;
    status: SubscriptionStatus;
    startDate: Date;
    endDate: Date;
    planName: string;
    planPrice: number;
  } | null;
}

export const getUsers = async ({
  grade: gradeFilter,
  gender: genderFilter,
  country,
  nickname,
  email,
  role: roleFilter,
  page = 1,
  limit = 10,
}: Partial<{
  grade: string;
  gender: string;
  country: string;
  nickname: string;
  email: string;
  role: string;
  page: number;
  limit: number;
}>): Promise<{ users: UserData[]; totalUsers: number; totalPages: number }> => {
  const whereClause: any = {};

  if (genderFilter) {
    // Ensure genderFilter matches one of the enum values if directly assigning
    if (Object.values(Gender).includes(genderFilter as Gender)) {
      whereClause.gender = genderFilter as Gender;
    } else {
      // Handle invalid gender filter string, perhaps log or ignore
      console.warn(`Invalid gender filter: ${genderFilter}`);
    }
  }
  if (country) {
    whereClause.countryId = country;
  }
  if (nickname) {
    whereClause.nickname = { contains: nickname, mode: "insensitive" };
  }
  if (email) {
    whereClause.email = { contains: email, mode: "insensitive" };
  }

  // Role filter
  if (roleFilter) {
    if (Object.values(Role).includes(roleFilter as Role)) {
      whereClause.role = roleFilter as Role;
    } else {
      console.warn(`Invalid role filter: ${roleFilter}`);
    }
  }

  // Add birthday filter for grade
  if (gradeFilter) {
    const birthYearRange = calculateBirthYearRangeForGrade(gradeFilter);
    if (birthYearRange) {
      whereClause.birthday = {
        gte: new Date(`${birthYearRange.minYear}-01-01`),
        lte: new Date(`${birthYearRange.maxYear}-12-31`),
      };
    }
  }

  const skip = (page - 1) * limit;

  const usersFromDb: UserWithReferrerAndCountryAndSubscription[] =
    (await prisma.user.findMany({
      where: whereClause,
      include: {
        referrer: {
          select: {
            nickname: true,
          },
        },
        country: {
          select: {
            id: true,
            name: true,
          },
        },
        subscriptions: {
          include: {
            plan: {
              select: {
                name: true,
                price: true,
              },
            },
          },
          orderBy: {
            endDate: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: gradeFilter ? undefined : skip,
      take: gradeFilter ? undefined : limit,
    })) as UserWithReferrerAndCountryAndSubscription[];

  const usersWithGradeAndDetails: UserData[] = usersFromDb.map((user) => {
    // Find active subscription (status is ACTIVE and endDate is in the future)
    const activeSubscription = user.subscriptions.find(
      (sub) => sub.status === "ACTIVE" && new Date(sub.endDate) > new Date(),
    );

    return {
      ...user,
      id: user.id,
      nickname: user.nickname,
      email: user.email,
      birthday: user.birthday
        ? user.birthday.toISOString().split("T")[0]
        : null,
      grade: calculateGrade(user.birthday),
      gender: user.gender as string | null,
      country: user.country,
      referrerNickname: user.referrer?.nickname,
      name: user.name,
      username: user.username,
      isReferred: user.isReferred,
      referrerCount: user.referrerCount,
      emailVerified: user.emailVerified,
      image: user.image,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      hasActiveSubscription: !!activeSubscription,
      activeSubscription: activeSubscription
        ? {
            id: activeSubscription.id,
            status: activeSubscription.status,
            startDate: activeSubscription.startDate,
            endDate: activeSubscription.endDate,
            planName: activeSubscription.plan.name,
            planPrice: activeSubscription.plan.price,
          }
        : null,
    };
  });

  // Since we're now filtering at database level, we need to handle pagination properly
  let paginatedUsers = usersWithGradeAndDetails;
  let totalUsers = usersWithGradeAndDetails.length;

  if (gradeFilter) {
    // When filtering by grade, we need to paginate the already filtered results
    totalUsers = usersWithGradeAndDetails.length;
    paginatedUsers = usersWithGradeAndDetails.slice(skip, skip + limit);
  } else {
    // When not filtering by grade, the results are already paginated by the database
    totalUsers = await prisma.user.count({ where: whereClause });
  }

  return {
    users: paginatedUsers,
    totalUsers: totalUsers,
    totalPages: Math.ceil(totalUsers / limit),
  };
};
