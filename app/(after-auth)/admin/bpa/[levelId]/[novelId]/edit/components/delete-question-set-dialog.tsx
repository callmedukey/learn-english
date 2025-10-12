"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { deleteQuestionSetAction } from "../actions/chapter.actions";

interface DeleteQuestionSetDialogProps {
  questionSetId: string;
  onSuccess: () => void;
  children: React.ReactNode;
}

const DeleteQuestionSetDialog: React.FC<DeleteQuestionSetDialogProps> = ({
  questionSetId,
  onSuccess,
  children,
}) => {
  const [isPending, startTransition] = useTransition();
  const [confirmationText, setConfirmationText] = useState("");

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteQuestionSetAction(questionSetId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("BPA question set deleted successfully");
        onSuccess();
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmationText("");
    }
  };

  const canDelete = confirmationText.toLowerCase() === "delete";

  return (
    <AlertDialog onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this
            BPA question set and all of its questions.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 space-y-2">
          <Label htmlFor="confirmation" className="text-sm font-medium">
            Type <span className="font-semibold">delete</span> to confirm
          </Label>
          <Input
            id="confirmation"
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="Type 'delete' to confirm"
            disabled={isPending}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending || !canDelete}
            className="bg-red-600 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Deleting..." : "Delete question set"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteQuestionSetDialog;
