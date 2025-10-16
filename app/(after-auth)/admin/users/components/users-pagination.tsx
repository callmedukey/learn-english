"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import React, { Suspense } from "react";

import { Button } from "@/components/ui/button";

interface UsersPaginationProps {
  totalPages: number;
  currentPage: number;
  totalUsers: number;
  limit: number;
}

function PaginationComponent({
  totalPages,
  currentPage,
  totalUsers,
  limit,
}: UsersPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  if (totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalUsers);

  return (
    <div className="mt-6 flex flex-col items-center justify-between space-y-2 md:flex-row md:space-y-0">
      <div className="text-base text-muted-foreground">
        Showing <strong>{startItem}</strong>-<strong>{endItem}</strong> of{" "}
        <strong>{totalUsers}</strong> users
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          aria-label="Go to first page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-base">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Go to next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Go to last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Wrap with Suspense as useSearchParams() needs it
const UsersPagination: React.FC<
  Omit<UsersPaginationProps, "currentPage"> & { currentPage?: number }
> = ({ totalPages, totalUsers, limit, currentPage: initialCurrentPage }) => {
  const searchParams = useSearchParams();
  const currentPage =
    initialCurrentPage || parseInt(searchParams.get("page") || "1", 10);

  return (
    <Suspense fallback={<div>Loading pagination...</div>}>
      <PaginationComponent
        totalPages={totalPages}
        currentPage={currentPage}
        totalUsers={totalUsers}
        limit={limit}
      />
    </Suspense>
  );
};

export default UsersPagination;
