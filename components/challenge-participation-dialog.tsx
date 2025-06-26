"use client";

import { Trophy, AlertCircle, ArrowRight } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChallengeParticipationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmJoin: () => Promise<void>;
  onContinueWithoutJoining: () => void;
  levelType: "AR" | "RC"; // Used in parent components for context
  levelName: string;
  contentType: string; // "novel" or "keyword"
  contentName: string;
  currentMonth: string;
  currentYear: number;
  totalChallengeContent: number;
  isLockedToDifferentLevel: boolean;
  currentLockedLevel?: string;
}

export function ChallengeParticipationDialog({
  isOpen,
  onClose,
  onConfirmJoin,
  onContinueWithoutJoining,
  levelName,
  contentType,
  contentName,
  currentMonth,
  currentYear,
  totalChallengeContent,
  isLockedToDifferentLevel,
  currentLockedLevel,
}: Omit<ChallengeParticipationDialogProps, 'levelType'>) {
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinChallenge = async () => {
    setIsLoading(true);
    try {
      await onConfirmJoin();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Monthly Challenge Content
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-4 pt-4">
              <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-950/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                  <div className="space-y-2">
                    <p className="font-semibold text-amber-900 dark:text-amber-100">
                      This {contentType} is part of the {currentMonth}{" "}
                      {currentYear} Medal Challenge!
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>{contentName}</strong> is one of{" "}
                      {totalChallengeContent} selected {contentType}s for the{" "}
                      {levelName} medal challenge.
                    </p>
                  </div>
                </div>
              </div>

              {isLockedToDifferentLevel ? (
                <div className="space-y-3">
                  <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950/20">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      You are currently locked to{" "}
                      <strong>{currentLockedLevel}</strong> for this month. You
                      can still attempt this {contentType}, but it won&apos;t
                      count toward your monthly medal challenge.
                    </p>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      • You&apos;ll earn regular points for completing this{" "}
                      {contentType}
                    </p>
                    <p>• These points won&apos;t count toward monthly medals</p>
                    <p>
                      • To change levels, use the &quot;Request Level
                      Change&quot; option on your current level page
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-medium">
                    Do you want to join the {levelName} challenge for{" "}
                    {currentMonth}?
                  </p>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <span>
                        Join the challenge to earn points toward monthly medals
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <span>
                        You&apos;ll be locked to {levelName} for the entire
                        month
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-amber-600">!</span>
                      <span>
                        You can request one level change per month if needed
                      </span>
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> You can still attempt this{" "}
                      {contentType} without joining the challenge. You&apos;ll
                      earn regular points but won&apos;t be eligible for monthly
                      medals. If you join the challenge later, previous scores
                      won&apos;t count toward medals.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {isLockedToDifferentLevel ? (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={onContinueWithoutJoining}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Continue Anyway
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={onContinueWithoutJoining}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Continue Without Joining
              </Button>
              <Button
                onClick={handleJoinChallenge}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  "Joining..."
                ) : (
                  <>
                    <Trophy className="mr-2 h-4 w-4" />
                    Join Challenge
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
