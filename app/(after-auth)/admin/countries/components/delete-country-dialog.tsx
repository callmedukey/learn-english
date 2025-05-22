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

import { deleteCountryAction } from "../actions/countries.admin-actions";

interface DeleteCountryDialogProps {
  countryId: string;
  countryName: string;
  onCountryDeleted?: () => void;
  children: React.ReactNode;
}

const DeleteCountryDialog: React.FC<DeleteCountryDialogProps> = ({
  countryId,
  countryName,
  onCountryDeleted,
  children,
}) => {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteCountryAction(countryId);
      if (result.error) {
        toast.error(result.error);
      } else {
        if (onCountryDeleted) {
          onCountryDeleted();
        }
        toast.success(`Country '${countryName}' deleted successfully!`);
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
            country &quot;<strong>{countryName}</strong>&quot; and its
            associated icon. Are you sure you want to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? "Deleting..." : "Yes, delete country"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteCountryDialog;
