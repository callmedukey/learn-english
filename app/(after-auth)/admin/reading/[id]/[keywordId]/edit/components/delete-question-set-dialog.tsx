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

import { deleteQuestionSetAction } from "../actions/question-set.actions";

interface DeleteQuestionSetDialogProps {
  questionSetId: string;
  questionCount: number;
  onSuccess: () => void;
  children: React.ReactNode;
}

const DeleteQuestionSetDialog: React.FC<DeleteQuestionSetDialogProps> = ({
  questionSetId,
  questionCount,
  onSuccess,
  children,
}) => {
  const [isPending, startTransition] = useTransition();
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteQuestionSetAction(questionSetId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Question set deleted successfully");
        onSuccess();
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Reading Passage?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            reading passage and all <strong>{questionCount}</strong> question
            {questionCount !== 1 ? "s" : ""}.
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
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteQuestionSetDialog;
