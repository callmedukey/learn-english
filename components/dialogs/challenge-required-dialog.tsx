"use client";

import { AlertCircle, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { confirmChallengeParticipation } from "@/actions/challenge-confirmation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type LevelType = "AR" | "RC";

interface ChallengeRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  levelType: LevelType;
  levelId: string;
  levelName: string;
  contentName: string;
  contentType: "novel" | "keyword";
}

export function ChallengeRequiredDialog({
  open,
  onOpenChange,
  levelType,
  levelId,
  levelName,
  contentName,
  contentType,
}: ChallengeRequiredDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleJoinChallenge = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await confirmChallengeParticipation(levelType, levelId);

      if (result.success) {
        onOpenChange(false);
        router.refresh();
      } else {
        if (result.error === "locked_to_different_level") {
          setError(
            `You are already locked to a different ${levelType} level for this month. You can only participate in one level per month.`,
          );
        } else {
          setError("Failed to join the challenge. Please try again.");
        }
      }
    } catch (error) {
      console.error(error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentMonth = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Monthly Challenge Content
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 pt-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold">{contentName}</span> is part
                    of the {currentMonth} monthly challenge for{" "}
                    <span className="font-semibold">{levelName}</span>.
                  </div>
                  <div>
                    To access this {contentType}, you must join the monthly
                    challenge and lock in your level for this month.
                  </div>
                  <div className="text-muted-foreground">
                    Once you join, you&apos;ll compete with other students at this
                    level for medals based on your monthly scores.
                  </div>
                </div>
              </div>
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleJoinChallenge}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>Joining...</>
            ) : (
              <>
                <Trophy className="mr-2 h-4 w-4" />
                Join Monthly Challenge
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
