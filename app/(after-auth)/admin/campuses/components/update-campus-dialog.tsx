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

import UpdateCampusForm from "./update-campus-form";

type Campus = {
  id: string;
  name: string;
};

interface UpdateCampusDialogProps {
  campus: Campus;
  children: React.ReactNode;
}

const UpdateCampusDialog: React.FC<UpdateCampusDialogProps> = ({
  campus,
  children,
}) => {
  const [open, setOpen] = useState(false);

  const handleCampusUpdated = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Campus</DialogTitle>
          <DialogDescription>
            Edit the campus name below to update it.
          </DialogDescription>
        </DialogHeader>
        <UpdateCampusForm
          campus={campus}
          setShowForm={setOpen}
          onCampusUpdated={handleCampusUpdated}
        />
      </DialogContent>
    </Dialog>
  );
};

export default UpdateCampusDialog;
