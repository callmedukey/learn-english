"use client";

import React, { useState, useTransition } from "react";

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

import { deleteCountryAction } from "../actions/countries.admin-actions"; // This action will be created/updated

interface DeleteCountryDialogProps {
  countryId: string;
  countryName: string;
  onCountryDeleted?: () => void; // Optional callback
  children: React.ReactNode; // To use a button as a trigger
}

const DeleteCountryDialog: React.FC<DeleteCountryDialogProps> = ({
  countryId,
  countryName,
  onCountryDeleted,
  children,
}) => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // No success message state needed as dialog closes on success

  const handleDelete = async () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteCountryAction(countryId);
      if (result.error) {
        setError(result.error);
      } else {
        // On success, the dialog will be closed by AlertDialog's default behavior or manually if needed
        if (onCountryDeleted) {
          onCountryDeleted();
        }
        // Potentially add a toast notification here for better UX
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
        {error && (
          <p className="text-sm font-medium text-red-600">Error: {error}</p>
        )}
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
