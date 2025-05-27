"use client";

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

import { updateARAction } from "../actions/ar.actions";
import { ARData } from "../query/ar.query";

interface EditARFormProps {
  ar: ARData;
  onARUpdated: () => void;
}

const EditARForm: React.FC<EditARFormProps> = ({ ar, onARUpdated }) => {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await updateARAction(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("AR record updated successfully!");
        onARUpdated();
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="arId" value={ar.id} />

      <div className="space-y-2">
        <Label htmlFor="level">Level</Label>
        <Input
          id="level"
          name="level"
          defaultValue={ar.level}
          placeholder="e.g., Beginner, Intermediate, Advanced"
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="score">Score</Label>
        <Input
          id="score"
          name="score"
          defaultValue={ar.score}
          placeholder="e.g., 85-90, 90-95"
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="stars">Stars (1-5)</Label>
        <Select
          name="stars"
          defaultValue={ar.stars.toString()}
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select stars" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 Star</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={ar.description || ""}
          placeholder="Enter AR description..."
          rows={3}
          required
          disabled={isPending}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Updating..." : "Update AR"}
        </Button>
      </div>
    </form>
  );
};

export default EditARForm;
