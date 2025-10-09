"use client";

import React, { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createCampusAction } from "../actions/campuses.admin-actions";

interface AddCampusFormProps {
  onCampusAdded?: () => void;
  setShowForm?: (show: boolean) => void;
}

const AddCampusForm: React.FC<AddCampusFormProps> = ({
  onCampusAdded,
  setShowForm,
}) => {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const form = event.currentTarget;

    startTransition(async () => {
      const result = await createCampusAction(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(`Campus '${result.campus?.name}' added successfully!`);
        if (onCampusAdded) {
          onCampusAdded();
        }
        setShowForm?.(false);
        form.reset();
      } else {
        toast.error("An unexpected error occurred");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto my-4 max-w-md space-y-4 rounded-md border bg-white p-4 shadow-sm"
    >
      <div>
        <Label htmlFor="campusName">Campus Name</Label>
        <Input
          id="campusName"
          name="campusName"
          type="text"
          required
          disabled={isPending}
          placeholder="Enter campus name"
        />
      </div>
      <div className="flex space-x-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Submitting..." : "Add Campus"}
        </Button>
        {setShowForm && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowForm(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

export default AddCampusForm;
