"use client";

import { useRouter } from "next/navigation";
import React, { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { createKeywordAction } from "../actions/keyword.actions";

interface CreateKeywordFormProps {
  rcLevelId: string;
}

const CreateKeywordForm: React.FC<CreateKeywordFormProps> = ({ rcLevelId }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createKeywordAction(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success("Keyword created successfully!");
        router.push(`/admin/reading/${rcLevelId}`);
      } else {
        toast.error("An unexpected error occurred");
      }
    });
  };

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        <input type="hidden" name="rcLevelId" value={rcLevelId} />

        <div>
          <Label htmlFor="name">Keyword Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="e.g., Main Idea, Character Analysis, Inference"
            required
            disabled={isPending}
          />
          <p className="mt-1 text-base text-gray-500">
            The name of the reading comprehension keyword or skill
          </p>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Describe what this keyword focuses on and what students will learn..."
            rows={4}
            disabled={isPending}
          />
          <p className="mt-1 text-base text-gray-500">
            Optional description of this keyword and its learning objectives
          </p>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/reading/${rcLevelId}`)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create Keyword"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateKeywordForm;
