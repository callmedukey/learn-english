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

  const handleCountryAdded = () => {};

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
