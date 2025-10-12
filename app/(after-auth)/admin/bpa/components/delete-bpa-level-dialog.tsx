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

import { deleteBPALevelAction } from "../actions/bpa-level.actions";

interface DeleteBPALevelDialogProps {
  levelId: string;
  levelName: string;
  novelCount: number;
  children: React.ReactNode;
}

const DeleteBPALevelDialog: React.FC<DeleteBPALevelDialogProps> = ({
  levelId,
  levelName,
  novelCount,
  children,
}) => {
  const [isPending, startTransition] = useTransition();
  const [confirmationText, setConfirmationText] = useState("");

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteBPALevelAction(levelId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`BPA level '${levelName}' deleted successfully!`);
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmationText("");
    }
  };

  const canDelete =
    confirmationText.toLowerCase() === "delete" && novelCount === 0;

  return (
    <AlertDialog onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the BPA
            level &quot;<strong>{levelName}</strong>&quot;
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
            disabled={isPending || novelCount > 0}
          />
          {novelCount > 0 && (
            <p className="text-sm text-red-600">
              Cannot delete BPA level with associated novels
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending || !canDelete}
            className="bg-red-600 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Deleting..." : "Delete BPA level"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteBPALevelDialog;
