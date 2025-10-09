"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { rejectCampusRequestAction } from "../actions/campus-requests.action";

interface RejectRequestButtonProps {
  requestId: string;
}

const RejectRequestButton = ({ requestId }: RejectRequestButtonProps) => {
  const [isPending, startTransition] = useTransition();

  const handleReject = () => {
    startTransition(async () => {
      const result = await rejectCampusRequestAction(requestId);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error || "Failed to reject request");
      }
    });
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleReject}
      disabled={isPending}
    >
      {isPending ? "Rejecting..." : "Reject"}
    </Button>
  );
};

export default RejectRequestButton;
