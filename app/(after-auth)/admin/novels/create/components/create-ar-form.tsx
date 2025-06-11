"use client";

import { useRouter } from "next/navigation";
import React, { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { createARAction } from "../../actions/ar.actions";

const CreateARForm = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createARAction(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success("AR record created successfully!");
        router.push("/admin/novels");
      } else {
        toast.error("An unexpected error occurred");
      }
    });
  };

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="level">AR Level</Label>
            <Input
              id="level"
              name="level"
              type="text"
              placeholder="AR Level 9"
              required
              disabled={isPending}
            />
            <p className="mt-1 text-sm text-gray-500">
              The reading level (e.g., AR Level 9)
            </p>
          </div>

          <div>
            <Label htmlFor="score">AR Score</Label>
            <Input
              id="score"
              name="score"
              type="text"
              placeholder="0.0 ~ 2.0"
              required
              disabled={isPending}
            />
            <p className="mt-1 text-sm text-gray-500">AR Score Range</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="relevantGrade">Relevant Grades</Label>
            <Input
              id="relevantGrade"
              name="relevantGrade"
              type="text"
              placeholder="Grades 1~2, Grades 3~4, Grades 5~6, Grades 7~8, Grades 9~10"
              required
              disabled={isPending}
            />
            <p className="mt-1 text-sm text-gray-500">
              Target grades for this AR level
            </p>
          </div>

          <div>
            <Label htmlFor="stars">Stars (1-5)</Label>
            <Input
              id="stars"
              name="stars"
              type="number"
              min="1"
              max="5"
              placeholder="5"
              required
              disabled={isPending}
            />
            <p className="mt-1 text-sm text-gray-500">
              Difficulty rating (1 = easiest, 5 = hardest)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="fontSize">Font Size</Label>
            <Select name="fontSize" defaultValue="BASE" disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Select font size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BASE">Base</SelectItem>
                <SelectItem value="LARGE">Large</SelectItem>
                <SelectItem value="XLARGE">Extra Large</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1 text-sm text-gray-500">
              Default font size for this AR level
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Describe this AR level and what types of books it includes..."
            rows={4}
            disabled={isPending}
          />
          <p className="mt-1 text-sm text-gray-500">
            Optional description of this AR level
          </p>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/novels")}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create AR Record"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateARForm;
