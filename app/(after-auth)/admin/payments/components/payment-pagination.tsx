"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface PaymentPaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}

export default function PaymentPagination({
  pagination,
  onPageChange,
}: PaymentPaginationProps) {
  const { currentPage, totalPages, totalCount, hasNextPage, hasPreviousPage } =
    pagination;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between border-t bg-white px-6 py-4">
      <div className="flex items-center text-sm text-gray-500">
        <span>
          Showing page {currentPage} of {totalPages} ({totalCount} total
          payments)
        </span>
      </div>

      <div className="flex items-center space-x-2">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPreviousPage}
          className="flex items-center"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {/* First page if not in range */}
          {pageNumbers[0] > 1 && (
            <>
              <Button
                variant={1 === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(1)}
                className="w-10"
              >
                1
              </Button>
              {pageNumbers[0] > 2 && (
                <span className="px-2 text-gray-400">...</span>
              )}
            </>
          )}

          {/* Page number buttons */}
          {pageNumbers.map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className="w-10"
            >
              {page}
            </Button>
          ))}

          {/* Last page if not in range */}
          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <span className="px-2 text-gray-400">...</span>
              )}
              <Button
                variant={totalPages === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(totalPages)}
                className="w-10"
              >
                {totalPages}
              </Button>
            </>
          )}
        </div>

        {/* Next Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className="flex items-center"
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
