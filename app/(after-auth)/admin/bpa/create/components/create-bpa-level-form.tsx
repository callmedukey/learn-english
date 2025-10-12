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

import { createBPALevelAction } from "../../actions/bpa-level.actions";

const CreateBPALevelForm = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createBPALevelAction(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success("BPA Level created successfully!");
        router.push("/admin/bpa");
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
            <Label htmlFor="name">Level Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Level 2"
              required
              disabled={isPending}
            />
            <p className="mt-1 text-sm text-gray-500">
              The level name (e.g., Level 2, Level 3)
            </p>
          </div>

          <div>
            <Label htmlFor="orderNumber">Order Number</Label>
            <Input
              id="orderNumber"
              name="orderNumber"
              type="number"
              min="1"
              placeholder="1"
              required
              disabled={isPending}
            />
            <p className="mt-1 text-sm text-gray-500">
              Display order (lower numbers appear first)
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="stars">Stars (1-5)</Label>
          <Input
            id="stars"
            name="stars"
            type="number"
            min="1"
            max="5"
            placeholder="3"
            required
            disabled={isPending}
            className="max-w-xs"
          />
          <p className="mt-1 text-sm text-gray-500">
            Difficulty rating (1 = easiest, 5 = hardest)
          </p>
        </div>

        <div>
          <Label htmlFor="fontSize">Font Size</Label>
          <Select name="fontSize" defaultValue="BASE" disabled={isPending}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Select font size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BASE">Base</SelectItem>
              <SelectItem value="LARGE">Large</SelectItem>
              <SelectItem value="XLARGE">Extra Large</SelectItem>
            </SelectContent>
          </Select>
          <p className="mt-1 text-sm text-gray-500">
            Default font size for this BPA level
          </p>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Describe this BPA level..."
            rows={4}
            disabled={isPending}
          />
          <p className="mt-1 text-sm text-gray-500">
            Optional description of this BPA level
          </p>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/bpa")}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create BPA Level"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateBPALevelForm;
