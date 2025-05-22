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

import AddCountryForm from "./add-country-form";

const AddCountryDialog = () => {
  const [open, setOpen] = useState(false);

  const handleCountryAdded = () => {
    // The form will show a success message.
    // The dialog can be closed after a delay by the form, or immediately here.
    // For now, let the form handle its state and potential timed close.
    // Revalidation should refresh the table, so the dialog can close.
    // setOpen(false); // Or let the form's setShowForm prop (passed as setOpen) handle it
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="absolute right-1">Add Country</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Country</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new country to the collection.
          </DialogDescription>
        </DialogHeader>
        <AddCountryForm
          setShowForm={setOpen}
          onCountryAdded={handleCountryAdded}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddCountryDialog;
