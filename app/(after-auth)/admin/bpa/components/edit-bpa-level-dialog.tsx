"use client";

import React, { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import EditBPALevelForm from "./edit-bpa-level-form";
import { BPALevelData } from "../queries/bpa-admin.query";

interface EditBPALevelDialogProps {
  level: BPALevelData;
  children: React.ReactNode;
}

const EditBPALevelDialog: React.FC<EditBPALevelDialogProps> = ({
  level,
  children,
}) => {
  const [open, setOpen] = useState(false);

  const handleLevelUpdated = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit BPA Level</DialogTitle>
          <DialogDescription>
            Update the BPA level details below.
          </DialogDescription>
        </DialogHeader>
        <EditBPALevelForm level={level} onLevelUpdated={handleLevelUpdated} />
      </DialogContent>
    </Dialog>
  );
};

export default EditBPALevelDialog;
