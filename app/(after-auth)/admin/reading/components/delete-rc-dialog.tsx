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

import { deleteRCLevelAction } from "../actions/rc.actions";

interface DeleteRCDialogProps {
  rcLevelId: string;
  rcLevel: string;
  keywordCount: number;
  children: React.ReactNode;
}

const DeleteRCDialog: React.FC<DeleteRCDialogProps> = ({
  rcLevelId,
  rcLevel,
  keywordCount,
  children,
}) => {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteRCLevelAction(rcLevelId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`RC level '${rcLevel}' deleted successfully!`);
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
            This action cannot be undone. This will permanently delete the RC
            level &quot;<strong>{rcLevel}</strong>&quot;
            {keywordCount > 0 && (
              <>
                {" "}
                and its <strong>{keywordCount}</strong> associated keyword
                {keywordCount !== 1 ? "s" : ""}
              </>
            )}
            . Are you sure you want to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending || keywordCount > 0}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? "Deleting..." : "Yes, delete RC level"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteRCDialog;
