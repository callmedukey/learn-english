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

import { toggleBPANovelsComingSoonStatus } from "../../actions/bpa-novel.actions";

interface BulkToggleComingSoonDialogProps {
  selectedNovelIds: string[];
  onSuccess: () => void;
}

export function BulkToggleComingSoonDialog({
  selectedNovelIds,
  onSuccess,
}: BulkToggleComingSoonDialogProps) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<"mark" | "unmark" | null>(null);
  const router = useRouter();

  const handleAction = async () => {
    if (!action) return;

    try {
      const result = await toggleBPANovelsComingSoonStatus(
        selectedNovelIds,
        action === "mark",
      );

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        onSuccess();
        router.refresh();
      } else {
        toast.error(result.message || "Failed to update novels");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while updating novels");
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
        Unmark Coming Soon
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === "mark" ? "Mark as Coming Soon" : "Unmark Coming Soon"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {action === "mark" ? "mark" : "unmark"}{" "}
              {selectedNovelIds.length} selected novel
              {selectedNovelIds.length !== 1 ? "s" : ""} as coming soon? This will
              affect how they appear to users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>
              {action === "mark" ? "Mark" : "Unmark"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
