"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import DOMPurify from "isomorphic-dompurify";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  History,
} from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ScoreLogResponse } from "@/lib/shared/types";

import { setDialogInteracting } from "./user-stats-popover";

async function fetchScoreLog(
  page: number,
  pageSize: number,
  source?: "RC" | "Novel" | "BPA"
): Promise<ScoreLogResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  if (source) {
    params.append("source", source);
  }

  const response = await fetch(`/api/user-stats/score-log?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch score log");
  }

  return response.json();
}

interface ScoreLogDialogProps {
  children?: React.ReactNode;
}

export function ScoreLogDialog({ children }: ScoreLogDialogProps) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<
    "RC" | "Novel" | "BPA" | undefined
  >(undefined);
  const pageSize = 20;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-score-log", page, sourceFilter],
    queryFn: () => fetchScoreLog(page, pageSize, sourceFilter),
    enabled: open, // Only fetch when dialog is open
  });

  // Handle dialog interaction flag for popover coordination
  useEffect(() => {
    if (open) {
      setDialogInteracting(true);
      const timeout = setTimeout(() => {
        setDialogInteracting(false);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  const handleSourceFilterChange = (
    source: "RC" | "Novel" | "BPA" | undefined
  ) => {
    setSourceFilter(source);
    setPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Set flag before closing to prevent popover from opening
      setDialogInteracting(true);
      setTimeout(() => {
        setDialogInteracting(false);
      }, 300);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-white hover:bg-white/20 hover:text-white"
          >
            <History className="h-3.5 w-3.5" />
            <span className="sr-only">View score history</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="max-h-[80vh] max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>My Score History</DialogTitle>
          <DialogDescription>
            Your activity history from RC, Novel, and BPA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={sourceFilter === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => handleSourceFilterChange(undefined)}
            >
              All
            </Button>
            <Button
              variant={sourceFilter === "RC" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSourceFilterChange("RC")}
            >
              RC
            </Button>
            <Button
              variant={sourceFilter === "Novel" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSourceFilterChange("Novel")}
            >
              Novel
            </Button>
            <Button
              variant={sourceFilter === "BPA" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSourceFilterChange("BPA")}
            >
              BPA
            </Button>
          </div>
          <div className="relative h-[500px]">
            <ScrollArea className="h-full">
              <div className="pr-4">
                {/* Full page states - only when no data exists */}
                {!data && isLoading && (
                  <div className="flex h-[500px] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                )}

                {!data && isError && (
                  <div className="flex h-[500px] items-center justify-center text-center text-base text-destructive">
                    Failed to load score log. Please try again.
                  </div>
                )}

                {data && data.logs.length === 0 && !isLoading && (
                  <div className="flex h-[500px] items-center justify-center text-center text-base text-muted-foreground">
                    No score history found.
                  </div>
                )}

                {/* Content with overlay loading state */}
                {data && data.logs.length > 0 && (
                  <div className="relative">
                    {/* Loading overlay - only during pagination */}
                    {isLoading && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-sm">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                      </div>
                    )}

                    {/* Content - with reduced opacity when loading */}
                    <div
                      className={`space-y-3 transition-opacity duration-200 ${isLoading ? "opacity-60" : "opacity-100"}`}
                    >
                      {data.logs.map((log) => {
                        const isExpanded = expandedLogId === log.id;
                        const isLegacyRecord = !log.selectedAnswer;

                        return (
                          <div
                            key={log.id}
                            className="rounded-lg border hover:bg-accent/50"
                          >
                            <div className="flex items-start justify-between gap-4 p-3">
                              <div className="flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`inline-flex rounded-full px-2 py-0.5 text-sm font-semibold ${
                                      log.source === "RC"
                                        ? "bg-blue-100 text-blue-800"
                                        : log.source === "Novel"
                                          ? "bg-purple-100 text-purple-800"
                                          : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {log.source}
                                  </span>
                                  <span className="text-base font-medium text-primary">
                                    +{log.score} points
                                  </span>

                                  {/* Legacy record indicator */}
                                  {isLegacyRecord && (
                                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-sm font-semibold text-gray-600">
                                      Legacy Record
                                    </span>
                                  )}

                                  {/* Status badges - only for non-legacy records or if we can infer status */}
                                  {!isLegacyRecord && log.isRetry && (
                                    <span className="inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-sm font-semibold text-orange-800">
                                      Retry
                                    </span>
                                  )}
                                  {!isLegacyRecord && log.isTimedOut && (
                                    <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-sm font-semibold text-red-800">
                                      Timed Out
                                    </span>
                                  )}
                                  {log.isCorrect && (
                                    <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-sm font-semibold text-green-800">
                                      {isLegacyRecord
                                        ? "Correct (inferred)"
                                        : "Correct"}
                                    </span>
                                  )}
                                  {!log.isCorrect &&
                                    !isLegacyRecord &&
                                    !log.isTimedOut && (
                                      <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-sm font-semibold text-red-800">
                                        Incorrect
                                      </span>
                                    )}
                                </div>
                                <p className="text-base text-muted-foreground">
                                  {log.sourceDetails}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(log.createdAt), "PPp")}
                                </p>
                              </div>

                              {/* Only show expand button for non-legacy records */}
                              {!isLegacyRecord && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setExpandedLogId(isExpanded ? null : log.id)
                                  }
                                  className="h-8 w-8 p-0"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>

                            {isExpanded && !isLegacyRecord && (
                              <div className="space-y-3 border-t bg-muted/30 p-3">
                                <div>
                                  <p className="mb-1 text-sm font-semibold text-muted-foreground">
                                    Question
                                  </p>
                                  <div
                                    className="whitespace-pre-wrap text-base"
                                    dangerouslySetInnerHTML={{
                                      __html: DOMPurify.sanitize(
                                        log.questionText
                                      ),
                                    }}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <p className="mb-1 text-sm font-semibold text-muted-foreground">
                                      Your Answer
                                    </p>
                                    {log.selectedAnswer ? (
                                      <div
                                        className={`whitespace-pre-wrap text-base ${
                                          log.isCorrect
                                            ? "font-medium text-green-700"
                                            : "font-medium text-red-700"
                                        }`}
                                        dangerouslySetInnerHTML={{
                                          __html: DOMPurify.sanitize(
                                            log.selectedAnswer
                                          ),
                                        }}
                                      />
                                    ) : (
                                      <p
                                        className={`text-base ${
                                          log.isCorrect
                                            ? "font-medium text-green-700"
                                            : "font-medium text-red-700"
                                        }`}
                                      >
                                        No answer
                                      </p>
                                    )}
                                  </div>

                                  {!log.isCorrect && (
                                    <div>
                                      <p className="mb-1 text-sm font-semibold text-muted-foreground">
                                        Correct Answer
                                      </p>
                                      <div
                                        className="whitespace-pre-wrap text-base font-medium text-green-700"
                                        dangerouslySetInnerHTML={{
                                          __html: DOMPurify.sanitize(
                                            log.correctAnswer
                                          ),
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <p className="mb-1 text-sm font-semibold text-muted-foreground">
                                    Explanation
                                  </p>
                                  <div
                                    className="whitespace-pre-wrap text-base text-muted-foreground"
                                    dangerouslySetInnerHTML={{
                                      __html: DOMPurify.sanitize(
                                        log.explanation
                                      ),
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-base text-muted-foreground">
                Page {data.page} of {data.totalPages} ({data.total} total
                entries)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === data.totalPages || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
