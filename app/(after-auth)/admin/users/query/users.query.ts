"server only";

import calculateGrade from "@/lib/utils/calculate-grade";
import { User as PrismaUser, Gender, Role } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

interface UserWithReferrer extends PrismaUser {
  referrer: {
    nickname: string | null;
  } | null;
}

export interface UserData
  extends Omit<UserWithReferrer, "referrer" | "birthday" | "gender"> {
  id: string;
  nickname: string | null;
  email: string;
  birthday: string | null;
  grade: string;
  gender: string | null;
  country: string | null;
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
}

export const getUsers = async ({
  grade: gradeFilter,
  gender: genderFilter,
  country,
  nickname,
  email,
  page = 1,
  limit = 10,
}: Partial<{
  grade: string;
  gender: string;
  country: string;
  nickname: string;
  email: string;
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

  const skip = (page - 1) * limit;

  const usersFromDb: UserWithReferrer[] = (await prisma.user.findMany({
    where: whereClause,
    include: {
      referrer: {
        select: {
          nickname: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })) as UserWithReferrer[];

  const usersWithGradeAndDetails: UserData[] = usersFromDb.map((user) => ({
    ...user,
    id: user.id,
    nickname: user.nickname,
    email: user.email,
    birthday: user.birthday ? user.birthday.toISOString().split("T")[0] : null,
    grade: calculateGrade(user.birthday),
    gender: user.gender as string | null,
    country: user.countryId,
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
  }));

  let filteredUsers = usersWithGradeAndDetails;
  if (gradeFilter) {
    filteredUsers = usersWithGradeAndDetails.filter((user) => {
      const gradeToMatch = gradeFilter.toLowerCase();
      const userGrade = user.grade.toLowerCase();

      if (gradeToMatch === "adult") return userGrade === "adult";
      if (gradeToMatch === "below grade 1")
        return userGrade === "below grade 1";

      const gradeNumMatch = gradeToMatch.match(/^grade\\s*(\\d+)$/);
      if (gradeNumMatch && gradeNumMatch[1]) {
        const gradeNum = parseInt(gradeNumMatch[1], 10);
        const userGradeNumMatch = userGrade.match(/^grade\\s*(\\d+)$/);
        if (userGradeNumMatch && userGradeNumMatch[1]) {
          return parseInt(userGradeNumMatch[1], 10) === gradeNum;
        }
      }
      return false;
    });
  }

  const totalFilteredUsers = filteredUsers.length;
  const paginatedUsers = filteredUsers.slice(skip, skip + limit);

  let countForPagination = totalFilteredUsers;
  if (!gradeFilter) {
    countForPagination = await prisma.user.count({ where: whereClause });
  }

  return {
    users: paginatedUsers,
    totalUsers: countForPagination,
    totalPages: Math.ceil(countForPagination / limit),
  };
};
