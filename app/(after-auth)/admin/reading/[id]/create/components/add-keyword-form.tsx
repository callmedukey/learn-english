"use client";

import React, { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { createKeywordAction } from "../actions/keyword.actions";

interface AddKeywordFormProps {
  rcLevelId: string;
  onKeywordCreated?: (keywordId: string) => void;
  setShowForm?: (show: boolean) => void;
}

const AddKeywordForm: React.FC<AddKeywordFormProps> = ({
  rcLevelId,
  onKeywordCreated,
  setShowForm,
}) => {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.append("rcLevelId", rcLevelId);
    const form = event.currentTarget;

    startTransition(async () => {
      const result = await createKeywordAction(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success && result.keyword) {
        toast.success(`Keyword '${result.keyword.name}' created successfully!`);
        if (onKeywordCreated) {
          onKeywordCreated(result.keyword.id);
        }
        setShowForm?.(false);
      } else {
        toast.error("An unexpected error occurred");
      }
    });
    form.reset();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto my-4 max-w-md space-y-4 rounded-md border bg-white p-4 shadow-sm"
    >
      <div>
        <Label htmlFor="name">Keyword Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="e.g., Main Idea, Character Analysis"
          required
          disabled={isPending}
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe what this keyword focuses on..."
          disabled={isPending}
          rows={4}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="isFree" name="isFree" />
        <Label htmlFor="isFree">Free Access</Label>
      </div>

      <div className="flex space-x-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Keyword"}
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

export default AddKeywordForm;
