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

import EditRCForm from "./edit-rc-form";
import { RCLevelData } from "../query/rc.query";

interface EditRCDialogProps {
  rcLevel: RCLevelData;
  children: React.ReactNode;
}

const EditRCDialog: React.FC<EditRCDialogProps> = ({ rcLevel, children }) => {
  const [open, setOpen] = useState(false);

  const handleRCUpdated = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit RC Level</DialogTitle>
          <DialogDescription>
            Update the reading comprehension level details below.
          </DialogDescription>
        </DialogHeader>
        <EditRCForm rcLevel={rcLevel} onRCUpdated={handleRCUpdated} />
      </DialogContent>
    </Dialog>
  );
};

export default EditRCDialog;
