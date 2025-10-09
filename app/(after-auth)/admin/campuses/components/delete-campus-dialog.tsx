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

import { deleteCampusAction } from "../actions/campuses.admin-actions";

interface DeleteCampusDialogProps {
  campusId: string;
  campusName: string;
  userCount: number;
  onCampusDeleted?: () => void;
  children: React.ReactNode;
}

const DeleteCampusDialog: React.FC<DeleteCampusDialogProps> = ({
  campusId,
  campusName,
  userCount,
  onCampusDeleted,
  children,
}) => {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteCampusAction(campusId);
      if (result.error) {
        toast.error(result.error);
      } else {
        if (onCampusDeleted) {
          onCampusDeleted();
        }
        toast.success(`Campus '${campusName}' deleted successfully!`);
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
            campus &quot;<strong>{campusName}</strong>&quot;.
            {userCount > 0 && (
              <span className="block mt-2 text-destructive font-semibold">
                Warning: This campus has {userCount} user(s) assigned. Deletion
                will be blocked.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? "Deleting..." : "Yes, delete campus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteCampusDialog;
