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

import { deleteQuestionAction } from "../actions/question-set.actions";

interface DeleteRCQuestionDialogProps {
  questionId: string;
  questionNumber: number;
  onSuccess: () => void;
  children: React.ReactNode;
}

const DeleteRCQuestionDialog: React.FC<DeleteRCQuestionDialogProps> = ({
  questionId,
  questionNumber,
  onSuccess,
  children,
}) => {
  const [isPending, startTransition] = useTransition();
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteQuestionAction(questionId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Question deleted successfully");
        onSuccess();
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete question{" "}
            <strong>Q{questionNumber}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="confirm-delete" className="text-base font-medium">
            Type &quot;delete&quot; to confirm
          </Label>
          <Input
            id="confirm-delete"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type 'delete' to confirm"
            className="mt-2"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending || confirmText !== "delete"}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? "Deleting..." : "Yes, delete question"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteRCQuestionDialog;
