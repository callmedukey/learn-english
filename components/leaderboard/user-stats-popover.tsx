"use client";

import { Suspense, useState, useRef } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

import { UserStatsContent } from "./user-stats-content";
import { UserStatsErrorBoundary } from "./user-stats-error-boundary";

interface UserStatsPopoverProps {
  userId: string;
  children: React.ReactNode;
}

// Global flag to prevent popover from opening during dialog interactions
let isDialogInteracting = false;

export function setDialogInteracting(value: boolean) {
  isDialogInteracting = value;
}

export function UserStatsPopover({ userId, children }: UserStatsPopoverProps) {
  const [open, setOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleOpenChange = (newOpen: boolean) => {
    // Clear any pending timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }

    if (newOpen && isDialogInteracting) {
      // Don't open if we're interacting with a dialog
      return;
    }

    if (!newOpen) {
      // Add a small delay when closing to prevent immediate re-opening
      closeTimeoutRef.current = setTimeout(() => {
        setOpen(false);
      }, 50);
    } else {
      setOpen(true);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer">{children}</div>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="center">
        <UserStatsErrorBoundary>
          <Suspense fallback={<UserStatsPopoverSkeleton />}>
            <UserStatsContent userId={userId} />
          </Suspense>
        </UserStatsErrorBoundary>
      </PopoverContent>
    </Popover>
  );
}

function UserStatsPopoverSkeleton() {
  return (
    <div className="p-4">
      <div className="mb-3">
        <Skeleton className="mb-1 h-5 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="space-y-3">
        <div>
          <div className="mb-1 text-xs font-semibold text-amber-900">
            NOVEL (Lexile)
          </div>
          <div className="space-y-1">
            {[1, 2].map((i) => (
              <div key={i} className="flex justify-between text-xs">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold text-amber-900">
            READING COMPREHENSION
          </div>
          <div className="space-y-1">
            {[1, 2].map((i) => (
              <div key={i} className="flex justify-between text-xs">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
