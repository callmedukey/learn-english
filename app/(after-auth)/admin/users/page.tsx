import React, { Suspense } from "react";

import { prisma } from "@/prisma/prisma-client";

import UsersFilter from "./components/users-filter";
import UsersPagination from "./components/users-pagination";
import UsersTable from "./components/users-table";
import { getUsers } from "./query/users.query";

interface AdminUsersPageProps {
  searchParams: Promise<{
    grade?: string;
    gender?: string;
    country?: string;
    nickname?: string;
    email?: string;
    page?: string;
    limit?: string;
  }>;
}

const ITEMS_PER_PAGE = 100;

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const resolvedSearchParams = await searchParams;

  const currentPage = parseInt(resolvedSearchParams.page || "1", 10);
  const limit = parseInt(
    resolvedSearchParams.limit || ITEMS_PER_PAGE.toString(),
    10,
  );

  const { users, totalUsers, totalPages } = await getUsers({
    grade: resolvedSearchParams.grade,
    gender: resolvedSearchParams.gender,
    country: resolvedSearchParams.country,
    nickname: resolvedSearchParams.nickname,
    email: resolvedSearchParams.email,
    page: currentPage,
    limit: limit,
  });

  const countries = await prisma.country.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <h1 className="mb-6 text-center text-3xl font-bold">User Management</h1>

      <Suspense
        fallback={
          <div className="mb-6 space-y-4 rounded-lg border bg-card p-4">
            <div className="h-10 w-1/3 rounded bg-muted"></div>
            <div className="h-10 w-1/2 rounded bg-muted"></div>
          </div>
        }
      >
        <UsersFilter countries={countries} />
      </Suspense>

      <Suspense
        fallback={
          <div className="py-10 text-center text-gray-500">
            Loading users...
          </div>
        }
      >
        <UsersTable users={users} />
      </Suspense>

      {totalPages > 1 && (
        <Suspense
          fallback={<div className="mt-6 h-10 w-full rounded bg-muted"></div>}
        >
          <UsersPagination
            totalPages={totalPages}
            totalUsers={totalUsers}
            limit={limit}
            currentPage={currentPage}
          />
        </Suspense>
      )}
    </div>
  );
}
