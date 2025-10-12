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

import EditARForm from "./edit-ar-form";
import { ARData } from "../query/ar.query";

interface EditARDialogProps {
  ar: ARData;
  children: React.ReactNode;
}

const EditARDialog: React.FC<EditARDialogProps> = ({ ar, children }) => {
  const [open, setOpen] = useState(false);

  const handleARUpdated = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit AR Record</DialogTitle>
          <DialogDescription>
            Update the AR record details below.
          </DialogDescription>
        </DialogHeader>
        <EditARForm ar={ar} onARUpdated={handleARUpdated} />
      </DialogContent>
    </Dialog>
  );
};

export default EditARDialog;
