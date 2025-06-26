"use client";

import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { approveLevelChange, rejectLevelChange } from "@/actions/level-locks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ActionButtons({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleApprove = () => {
    startTransition(async () => {
      try {
        await approveLevelChange(requestId);
        setShowApproveDialog(false);
        setSuccessMessage("Level change request has been approved. The user's monthly scores have been reset.");
        setShowSuccessDialog(true);
        router.refresh();
      } catch (error) {
        setShowApproveDialog(false);
        setErrorMessage("Failed to approve the level change request. Please try again.");
        setShowErrorDialog(true);
        console.error(error);
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      try {
        await rejectLevelChange(requestId);
        setShowRejectDialog(false);
        setSuccessMessage("Level change request has been rejected.");
        setShowSuccessDialog(true);
        router.refresh();
      } catch (error) {
        setShowRejectDialog(false);
        setErrorMessage("Failed to reject the level change request. Please try again.");
        setShowErrorDialog(true);
        console.error(error);
      }
    });
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="default"
          className="bg-green-600 hover:bg-green-700"
          onClick={() => setShowApproveDialog(true)}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <span className="ml-1">Approve</span>
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setShowRejectDialog(true)}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <span className="ml-1">Reject</span>
        </Button>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Level Change Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this level change request? This
              will update the user&apos;s level and reset their monthly scores.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Approve Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Level Change Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this level change request? The
              user will remain at their current level.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Success
            </DialogTitle>
            <DialogDescription>
              {successMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)}>
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
              <XCircle className="h-5 w-5 text-red-500" />
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
    </>
  );
}