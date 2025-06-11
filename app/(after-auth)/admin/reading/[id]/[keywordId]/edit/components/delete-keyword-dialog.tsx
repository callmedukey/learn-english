"use client";

import { useRouter } from "next/navigation";
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

import { deleteKeywordAction } from "../actions/keyword-edit.actions";

interface DeleteKeywordDialogProps {
  keywordId: string;
  keywordName: string;
  rcLevelId: string;
  children: React.ReactNode;
}

const DeleteKeywordDialog: React.FC<DeleteKeywordDialogProps> = ({
  keywordId,
  keywordName,
  rcLevelId,
  children,
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteKeywordAction(keywordId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Keyword deleted successfully");
        router.push(`/admin/reading/${rcLevelId}`);
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
            This action cannot be undone. This will permanently delete the
            keyword &quot;<strong>{keywordName}</strong>&quot; and all of its
            question sets and questions.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="confirm-delete" className="text-sm font-medium">
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
            {isPending ? "Deleting..." : "Yes, delete keyword"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteKeywordDialog;
