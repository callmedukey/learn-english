"use client";

import { Trash2 } from "lucide-react";
import React, { useState, useTransition } from "react";
import { toast } from "sonner";

import ButtonWithLoading from "@/components/custom-ui/button-with-loading";
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

import { deleteNovel } from "../actions/delete-novels.action";

interface DeleteNovelAlertProps {
  novelId: string;
  title: string;
}

const DeleteNovelAlert = ({ novelId, title }: DeleteNovelAlertProps) => {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <ButtonWithLoading
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700"
          isLoading={isPending}
          disabled={isPending}
          onClick={() => {
            setIsOpen(true);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </ButtonWithLoading>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the novel
            &ldquo;{title}&rdquo; and all of its chapters.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-red-600 hover:bg-red-700" asChild>
            <ButtonWithLoading
              isLoading={isPending}
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const result = await deleteNovel(novelId);
                  if (result.error) {
                    toast.error(result.error);
                  } else {
                    toast.success("Novel deleted successfully");
                    setIsOpen(false);
                  }
                });
              }}
            >
              Delete Novel
            </ButtonWithLoading>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteNovelAlert;
