"use client";

import { Calendar, CalendarOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { toggleKeywordsComingSoonStatus } from "../actions";

interface BulkToggleComingSoonDialogProps {
  selectedKeywordIds: string[];
  onSuccess: () => void;
}

export function BulkToggleComingSoonDialog({
  selectedKeywordIds,
  onSuccess,
}: BulkToggleComingSoonDialogProps) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<"mark" | "unmark" | null>(null);
  const router = useRouter();

  const handleAction = async () => {
    if (!action) return;

    try {
      const result = await toggleKeywordsComingSoonStatus(
        selectedKeywordIds,
        action === "mark",
      );

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        onSuccess();
        router.refresh();
      } else {
        toast.error(result.message || "Failed to update keywords");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while updating keywords");
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setAction("mark");
          setOpen(true);
        }}
      >
        <Calendar className="mr-2 h-4 w-4" />
        Mark as Coming Soon
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setAction("unmark");
          setOpen(true);
        }}
      >
        <CalendarOff className="mr-2 h-4 w-4" />
        Remove Coming Soon
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === "mark"
                ? "Mark Keywords as Coming Soon"
                : "Remove Coming Soon Status"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              {action === "mark"
                ? "mark"
                : "remove the coming soon status from"}{" "}
              {selectedKeywordIds.length} selected keyword
              {selectedKeywordIds.length !== 1 ? "s" : ""}
              {action === "mark" ? " as coming soon" : ""}? This will{" "}
              {action === "mark"
                ? "display them with a 'Coming Next Month' badge"
                : "remove the 'Coming Next Month' badge"}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>
              {action === "mark" ? "Mark as Coming Soon" : "Remove Coming Soon"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}