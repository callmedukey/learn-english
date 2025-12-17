import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, TouchableOpacity, View } from "react-native";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  const getPageNumbers = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust range to show at least 3 middle pages
      if (currentPage <= 3) {
        end = Math.min(totalPages - 1, 4);
      } else if (currentPage >= totalPages - 2) {
        start = Math.max(2, totalPages - 3);
      }

      // Add ellipsis before middle pages if needed
      if (start > 2) {
        pages.push("ellipsis");
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis after middle pages if needed
      if (end < totalPages - 1) {
        pages.push("ellipsis");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const canGoPrev = currentPage > 1 && !isLoading;
  const canGoNext = currentPage < totalPages && !isLoading;

  return (
    <View className="mt-6 items-center">
      {/* Page navigation */}
      <View className="flex-row items-center gap-1">
        {/* Previous button */}
        <TouchableOpacity
          className={`h-10 w-10 items-center justify-center rounded-lg ${
            canGoPrev ? "bg-muted" : "bg-muted/50"
          }`}
          onPress={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrev}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={canGoPrev ? "#374151" : "#9CA3AF"}
          />
        </TouchableOpacity>

        {/* Page numbers */}
        {getPageNumbers().map((page, index) =>
          page === "ellipsis" ? (
            <View
              key={`ellipsis-${index}`}
              className="h-10 w-8 items-center justify-center"
            >
              <Text className="text-muted-foreground">...</Text>
            </View>
          ) : (
            <TouchableOpacity
              key={page}
              className={`h-10 min-w-[40px] items-center justify-center rounded-lg px-2 ${
                page === currentPage
                  ? "bg-primary"
                  : isLoading
                    ? "bg-muted/50"
                    : "bg-muted"
              }`}
              onPress={() => onPageChange(page)}
              disabled={page === currentPage || isLoading}
            >
              <Text
                className={`font-medium ${
                  page === currentPage
                    ? "text-primary-foreground"
                    : isLoading
                      ? "text-muted-foreground"
                      : "text-foreground"
                }`}
              >
                {page}
              </Text>
            </TouchableOpacity>
          )
        )}

        {/* Next button */}
        <TouchableOpacity
          className={`h-10 w-10 items-center justify-center rounded-lg ${
            canGoNext ? "bg-muted" : "bg-muted/50"
          }`}
          onPress={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={canGoNext ? "#374151" : "#9CA3AF"}
          />
        </TouchableOpacity>
      </View>

      {/* Page indicator */}
      <Text className="mt-2 text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </Text>
    </View>
  );
}
