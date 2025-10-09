"use client";

import React, { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateCampusAction } from "../actions/campuses.admin-actions";

type Campus = {
  id: string;
  name: string;
};

interface UpdateCampusFormProps {
  campus: Campus;
  onCampusUpdated?: () => void;
  setShowForm?: (show: boolean) => void;
}

const UpdateCampusForm: React.FC<UpdateCampusFormProps> = ({
  campus,
  onCampusUpdated,
  setShowForm,
}) => {
  const [isPending, startTransition] = useTransition();
  const [campusName, setCampusName] = useState(campus.name);

  useEffect(() => {
    setCampusName(campus.name);
  }, [campus]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.append("campusId", campus.id);

    startTransition(async () => {
      const result = await updateCampusAction(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(
          `Campus '${result.campus?.name}' updated successfully!`,
        );
        if (onCampusUpdated) {
          onCampusUpdated();
        }
        if (setShowForm) {
          setTimeout(() => setShowForm(false), 1000);
        }
      } else {
        toast.error("An unexpected error occurred during update");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto my-4 max-w-md space-y-4 rounded-md border bg-white p-4 shadow-sm"
    >
      <input type="hidden" name="campusId" value={campus.id} />
      <div>
        <Label htmlFor="campusName">Campus Name</Label>
        <Input
          id="campusName"
          name="campusName"
          type="text"
          required
          value={campusName}
          onChange={(e) => setCampusName(e.target.value)}
          disabled={isPending}
        />
      </div>
      <div className="flex space-x-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Updating..." : "Update Campus"}
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

export default UpdateCampusForm;
