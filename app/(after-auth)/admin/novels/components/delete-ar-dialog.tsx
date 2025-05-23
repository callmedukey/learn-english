"use client";

import React, { useTransition } from "react";
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

import { deleteARAction } from "../actions/ar.admin-actions";

interface DeleteARDialogProps {
  arId: string;
  arLevel: string;
  novelCount: number;
  children: React.ReactNode;
}

const DeleteARDialog: React.FC<DeleteARDialogProps> = ({
  arId,
  arLevel,
  novelCount,
  children,
}) => {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteARAction(arId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`AR record '${arLevel}' deleted successfully!`);
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
            This action cannot be undone. This will permanently delete the AR
            record &quot;<strong>{arLevel}</strong>&quot;
            {novelCount > 0 && (
              <>
                {" "}
                and its <strong>{novelCount}</strong> associated novel
                {novelCount !== 1 ? "s" : ""}
              </>
            )}
            . Are you sure you want to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending || novelCount > 0}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? "Deleting..." : "Yes, delete AR record"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteARDialog;
