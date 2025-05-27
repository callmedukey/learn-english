"use client";

import React, { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { createNovel } from "../actions/novels.admin-actions";

interface AddNovelFormProps {
  levelId: string;
  onNovelCreated?: (novelId: string) => void;
  setShowForm?: (show: boolean) => void;
}

const AddNovelForm: React.FC<AddNovelFormProps> = ({
  levelId,
  onNovelCreated,
  setShowForm,
}) => {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.append("level", levelId);
    const form = event.currentTarget;

    startTransition(async () => {
      const result = await createNovel(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success && result.novel) {
        toast.success(`Novel '${result.novel.title}' created successfully!`);
        if (onNovelCreated) {
          onNovelCreated(result.novel.id);
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
        <Label htmlFor="title">Novel Title</Label>
        <Input
          id="title"
          name="title"
          type="text"
          required
          disabled={isPending}
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          disabled={isPending}
          rows={4}
        />
      </div>

      <div className="flex space-x-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Novel"}
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

export default AddNovelForm;
