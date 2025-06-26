"use client";

import { Trophy, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { confirmChallengeParticipation } from "@/actions/challenge-confirmation";
import { requestLevelChange, cancelLevelChangeRequest } from "@/actions/level-locks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UserLevelLock } from "@/prisma/generated/prisma";

interface RCChallengeConfirmationButtonProps {
  rcLevelId: string;
  rcLevel: string;
  hasActiveChallenge: boolean;
  challengeKeywordCount?: number;
  currentMonth: string;
  currentYear: number;
  userLevelLock?: UserLevelLock | null;
  hasPendingRequest?: boolean;
  pendingRequestId?: string;
}

export function RCChallengeConfirmationButton({
  rcLevelId,
  rcLevel,
  hasActiveChallenge,
  challengeKeywordCount = 0,
  currentMonth,
  currentYear,
  userLevelLock,
  hasPendingRequest = false,
  pendingRequestId,
}: RCChallengeConfirmationButtonProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showLevelChangeDialog, setShowLevelChangeDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showLevelChangeSuccessDialog, setShowLevelChangeSuccessDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCancelSuccessDialog, setShowCancelSuccessDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const result = await confirmChallengeParticipation("RC", rcLevelId);
      
      if (result.success) {
        setIsDialogOpen(false);
        setShowSuccessDialog(true);
        router.refresh();
      } else {
        if (result.error === "ALREADY_LOCKED" && result.currentLockedLevel) {
          setIsDialogOpen(false);
          setShowLevelChangeDialog(true);
        } else {
          setIsDialogOpen(false);
          setErrorMessage(result.message || "Failed to confirm challenge participation");
          setShowErrorDialog(true);
        }
      }
    } catch {
      setIsDialogOpen(false);
      setErrorMessage("Failed to confirm challenge participation");
      setShowErrorDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLevelChangeRequest = async () => {
    if (!userLevelLock) return;
    
    setIsLoading(true);
    try {
      await requestLevelChange("RC", userLevelLock.levelId, rcLevelId);
      setShowLevelChangeDialog(false);
      setShowLevelChangeSuccessDialog(true);
      router.refresh();
    } catch (error) {
      setShowLevelChangeDialog(false);
      setErrorMessage(error instanceof Error ? error.message : "Failed to submit level change request");
      setShowErrorDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!pendingRequestId) return;
    
    setIsLoading(true);
    try {
      await cancelLevelChangeRequest(pendingRequestId);
      setShowCancelDialog(false);
      setShowCancelSuccessDialog(true);
      router.refresh();
    } catch (error) {
      setShowCancelDialog(false);
      setErrorMessage(error instanceof Error ? error.message : "Failed to cancel request");
      setShowErrorDialog(true);
    } finally {
      setIsLoading(false);
    }
  };


  // Determine button state
  const isAlreadyJoined = userLevelLock?.levelId === rcLevelId;
  const isDifferentLevel = !!(userLevelLock && userLevelLock.levelId !== rcLevelId);

  return (
    <>
      <Button
        onClick={() => {
          if (isDifferentLevel && hasPendingRequest) {
            setShowCancelDialog(true);
          } else if (isDifferentLevel) {
            setShowLevelChangeDialog(true);
          } else {
            setIsDialogOpen(true);
          }
        }}
        disabled={!!isAlreadyJoined}
        className="flex items-center gap-2"
        variant={!!isAlreadyJoined || (isDifferentLevel && hasPendingRequest) ? "secondary" : "default"}
      >
        <Trophy className="h-4 w-4" />
        {isAlreadyJoined 
          ? "Challenge Joined ✓" 
          : isDifferentLevel 
            ? hasPendingRequest ? "Level Change Pending" : "Request Level Change"
            : "Join Monthly Challenge"}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {hasActiveChallenge ? `Join ${currentMonth} Medal Challenge` : `Select Level for ${currentMonth}`}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3">
                {hasActiveChallenge ? (
                  <>
                    <p>
                      You&apos;re about to join the {currentMonth} {currentYear} medal challenge for {rcLevel}.
                    </p>
                    <p className="font-semibold">
                      This challenge includes {challengeKeywordCount} selected keywords.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Once confirmed, you&apos;ll be locked to this level for the entire month. 
                      You can still attempt keywords from other levels for practice, but only 
                      content from your selected level will count toward monthly medals.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You can request one level change per month if needed. If you join after 
                      completing content, previous scores won&apos;t count toward medals.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      You&apos;re about to select {rcLevel} as your level for {currentMonth} {currentYear}.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Note: There is currently no active medal challenge for this level this month. 
                      However, you can still lock in your level choice and earn points.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Once confirmed, you&apos;ll be locked to this level for the entire month. 
                      You can still attempt keywords from other levels for practice, but only 
                      content from your selected level will count toward monthly medals.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You can request one level change per month if needed. If you join after 
                      completing content, previous scores won&apos;t count toward medals.
                    </p>
                  </>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Confirming..." : "Confirm Level"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Level Confirmed!</DialogTitle>
            <DialogDescription>
              {hasActiveChallenge 
                ? `You've successfully joined the ${rcLevel} medal challenge for ${currentMonth} ${currentYear}. Good luck!`
                : `You've successfully locked in ${rcLevel} as your level for ${currentMonth} ${currentYear}.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLevelChangeDialog} onOpenChange={setShowLevelChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Request Level Change
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You are currently locked to {userLevelLock?.levelId ? `Level ${userLevelLock.levelId}` : "another level"} for {currentMonth} {currentYear}.
                </p>
                <p className="font-semibold text-destructive">
                  Warning: Changing levels will reset your monthly score to 0.
                </p>
                <p>
                  Your level change request will be sent to an admin for approval.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowLevelChangeDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleLevelChangeRequest}
              disabled={isLoading}
              variant="destructive"
            >
              {isLoading ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Level Change Success Dialog */}
      <Dialog open={showLevelChangeSuccessDialog} onOpenChange={setShowLevelChangeSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Submitted</DialogTitle>
            <DialogDescription>
              Your level change request has been submitted for admin approval. 
              You&apos;ll be notified once it&apos;s been reviewed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowLevelChangeSuccessDialog(false)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Error
            </DialogTitle>
            <DialogDescription>
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowErrorDialog(false)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Request Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Level Change Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your pending level change request? 
              You&apos;ll remain locked to your current level for this month.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCancelDialog(false)}
              disabled={isLoading}
            >
              Keep Request
            </Button>
            <Button 
              onClick={handleCancelRequest}
              disabled={isLoading}
              variant="destructive"
            >
              {isLoading ? "Cancelling..." : "Cancel Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Success Dialog */}
      <Dialog open={showCancelSuccessDialog} onOpenChange={setShowCancelSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Cancelled</DialogTitle>
            <DialogDescription>
              Your level change request has been cancelled. You&apos;ll remain locked to your current level for this month.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowCancelSuccessDialog(false)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}