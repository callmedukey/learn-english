"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import AddCampusForm from "./add-campus-form";

const AddCampusDialog = () => {
  const [open, setOpen] = useState(false);

  const handleCampusAdded = () => {};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="absolute right-1">Add Campus</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Campus</DialogTitle>
          <DialogDescription>
            Fill in the campus name to add it to the collection.
          </DialogDescription>
        </DialogHeader>
        <AddCampusForm
          setShowForm={setOpen}
          onCampusAdded={handleCampusAdded}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddCampusDialog;
