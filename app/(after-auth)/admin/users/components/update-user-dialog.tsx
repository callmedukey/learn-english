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
import { Country } from "@/prisma/generated/prisma";

import UpdateUserForm from "./update-user-form";
import { UserData } from "../query/users.query";

interface UpdateUserDialogProps {
  user: UserData;
  countries: Pick<Country, "id" | "name">[];
  children: React.ReactNode;
}

const UpdateUserDialog: React.FC<UpdateUserDialogProps> = ({
  user,
  countries,
  children,
}) => {
  const [open, setOpen] = useState(false);

  const handleUserUpdated = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update User: {user.nickname}</DialogTitle>
          <DialogDescription>
            Update the user&apos;s birthday and country information.
          </DialogDescription>
        </DialogHeader>
        <UpdateUserForm
          user={user}
          countries={countries}
          onUserUpdated={handleUserUpdated}
        />
      </DialogContent>
    </Dialog>
  );
};

export default UpdateUserDialog;