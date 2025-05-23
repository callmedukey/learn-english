"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { createChapter } from "../actions/chapters.admin-actions";

interface AddChapterFormProps {
  novelId: string;
  onChapterCreated?: (chapterId: string) => void;
  onFinish?: () => void;
}

const AddChapterForm: React.FC<AddChapterFormProps> = ({
  novelId,
  onChapterCreated,
  onFinish,
}) => {
  const [isPending, startTransition] = useTransition();
  const [chapters, setChapters] = useState<string[]>([]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.append("novelId", novelId);
    const form = event.currentTarget;

    startTransition(async () => {
      const result = await createChapter(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success && result.chapter) {
        toast.success(
          `Chapter '${result.chapter.title}' created successfully!`,
        );
        setChapters((prev) => [...prev, result.chapter!.id]);
        if (onChapterCreated) {
          onChapterCreated(result.chapter.id);
        }
        form.reset();
      } else {
        toast.error("An unexpected error occurred");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Add Chapters</h2>
        <p className="text-gray-600">
          {chapters.length > 0
            ? `${chapters.length} chapter${chapters.length > 1 ? "s" : ""} created`
            : "Create chapters for your novel"}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-md space-y-4 rounded-md border bg-white p-4 shadow-sm"
      >
        <div>
          <Label htmlFor="orderNumber">Chapter Order</Label>
          <Input
            id="orderNumber"
            name="orderNumber"
            type="number"
            min="1"
            defaultValue={chapters.length + 1}
            required
            disabled={isPending}
          />
        </div>

        <div>
          <Label htmlFor="title">Chapter Title</Label>
          <Input
            id="title"
            name="title"
            type="text"
            required
            disabled={isPending}
          />
        </div>

        <div>
          <Label htmlFor="description">Chapter Description</Label>
          <Textarea
            id="description"
            name="description"
            disabled={isPending}
            rows={4}
          />
        </div>

        <div className="flex space-x-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Add Chapter"}
          </Button>
          {chapters.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={onFinish}
              disabled={isPending}
            >
              Finish
            </Button>
          )}
        </div>
      </form>

      {chapters.length > 0 && (
        <div className="mx-auto max-w-md">
          <h3 className="mb-2 font-medium text-gray-700">Created Chapters:</h3>
          <ul className="space-y-1 text-sm text-gray-600">
            {chapters.map((chapterId, index) => (
              <li key={chapterId} className="flex items-center">
                <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs text-green-600">
                  ✓
                </span>
                Chapter {index + 1}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AddChapterForm;
