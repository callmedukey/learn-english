"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { approveCampusRequestAction } from "../actions/campus-requests.action";

interface ApproveRequestButtonProps {
  requestId: string;
}

const ApproveRequestButton = ({ requestId }: ApproveRequestButtonProps) => {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveCampusRequestAction(requestId);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error || "Failed to approve request");
      }
    });
  };

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleApprove}
      disabled={isPending}
    >
      {isPending ? "Approving..." : "Approve"}
    </Button>
  );
};

export default ApproveRequestButton;
