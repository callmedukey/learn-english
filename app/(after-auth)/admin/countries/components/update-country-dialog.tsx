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

import UpdateCountryForm from "./update-country-form";
type Country = {
  id: string;
  name: string;
  countryIcon?: {
    id: string;
    iconUrl: string;
    width?: number | null;
    height?: number | null;
  } | null;
};

interface UpdateCountryDialogProps {
  country: Country;
  children: React.ReactNode;
}

const UpdateCountryDialog: React.FC<UpdateCountryDialogProps> = ({
  country,
  children,
}) => {
  const [open, setOpen] = useState(false);

  const handleCountryUpdated = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Country</DialogTitle>
          <DialogDescription>
            Edit the details below to update the country.
          </DialogDescription>
        </DialogHeader>
        <UpdateCountryForm
          country={country}
          setShowForm={setOpen}
          onCountryUpdated={handleCountryUpdated}
        />
      </DialogContent>
    </Dialog>
  );
};

export default UpdateCountryDialog;
