"use client";

import { useRouter } from "next/navigation";
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

import { removeUserFromCampusAction } from "../../actions/campuses.admin-actions";

interface RemoveUserFromCampusDialogProps {
  userId: string;
  userName: string;
  children: React.ReactNode;
}

const RemoveUserFromCampusDialog: React.FC<RemoveUserFromCampusDialogProps> = ({
  userId,
  userName,
  children,
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRemove = async () => {
    startTransition(async () => {
      const result = await removeUserFromCampusAction(userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${userName} removed from campus successfully!`);
        router.refresh();
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove user from campus?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove <strong>{userName}</strong> from
            this campus? This will unassign them from the campus but will not
            delete their account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isPending ? "Removing..." : "Yes, remove from campus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RemoveUserFromCampusDialog;
