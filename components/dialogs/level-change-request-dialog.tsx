"use client";

import { AlertCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { requestLevelChange } from "@/actions/level-locks";
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

interface LevelChangeRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  levelType: LevelType;
  currentLevelId: string;
  currentLevelName: string;
  targetLevelId: string;
  targetLevelName: string;
  contentName: string;
  contentType: "novel" | "keyword";
  hasPendingRequest?: boolean;
}

export function LevelChangeRequestDialog({
  open,
  onOpenChange,
  levelType,
  currentLevelId,
  currentLevelName,
  targetLevelId,
  targetLevelName,
  contentName,
  contentType,
  hasPendingRequest = false,
}: LevelChangeRequestDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  // const [errorMessage, setErrorMessage] = useState(""); // Can be used for error dialog if needed

  const handleRequestLevelChange = async () => {
    setIsLoading(true);
    try {
      await requestLevelChange(levelType, currentLevelId, targetLevelId);
      onOpenChange(false);
      setShowSuccessDialog(true);
      router.refresh();
    } catch (error) {
      onOpenChange(false);
      // setErrorMessage(error instanceof Error ? error.message : "Failed to submit level change request");
      console.error("Failed to submit level change request:", error);
      // You could show an error dialog here if needed
    } finally {
      setIsLoading(false);
    }
  };

  const currentMonth = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Level Change Required
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 pt-3">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold">{contentName}</span> is part
                  of <span className="font-semibold">{targetLevelName}</span>,
                  but you are currently enrolled in{" "}
                  <span className="font-semibold">{currentLevelName}</span> for{" "}
                  {currentMonth}.
                </div>
                <div className="flex items-center gap-2 rounded-md bg-muted p-3">
                  <span className="text-muted-foreground">Current:</span>
                  <span className="font-medium">{currentLevelName}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Requested:</span>
                  <span className="font-medium">{targetLevelName}</span>
                </div>
                {hasPendingRequest ? (
                  <div className="space-y-2">
                    <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                      You already have a pending level change request. Please wait for admin approval before submitting a new request.
                    </div>
                    <div className="text-muted-foreground">
                      Once your current request is processed, you&apos;ll be able to access content from your new level.
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-muted-foreground">
                      To access this {contentType}, you need to request a level
                      change. Level changes require admin approval and you can only
                      participate in one level per month.
                    </div>
                    <div className="text-sm font-semibold text-amber-600">
                      Warning: Changing levels will reset your monthly score to 0.
                    </div>
                  </>
                )}
              </div>
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
          {!hasPendingRequest && (
            <Button
              onClick={handleRequestLevelChange}
              className="w-full sm:w-auto"
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Submit Request"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    {/* Success Dialog */}
    <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Submitted</DialogTitle>
          <DialogDescription>
            Your level change request has been submitted for admin approval. 
            You&apos;ll be notified once it&apos;s been reviewed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setShowSuccessDialog(false)}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}