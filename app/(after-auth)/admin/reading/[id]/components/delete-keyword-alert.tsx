"use client";

import { Trash2 } from "lucide-react";
import React, { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { deleteKeyword } from "../actions/delete-keyword.action";

interface DeleteKeywordAlertProps {
  keywordId: string;
  name: string;
}

const DeleteKeywordAlert = ({ keywordId, name }: DeleteKeywordAlertProps) => {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700"
          disabled={isPending}
          onClick={() => {
            setIsOpen(true);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            keyword &ldquo;{name}&rdquo; and all of its associated question sets
            and questions.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-red-600 hover:bg-red-700" asChild>
            <Button
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const result = await deleteKeyword(keywordId);
                  if (result.error) {
                    toast.error(result.error);
                  } else {
                    toast.success("Keyword deleted successfully");
                    setIsOpen(false);
                  }
                });
              }}
            >
              {isPending ? "Deleting..." : "Delete Keyword"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteKeywordAlert;
