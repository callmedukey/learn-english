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

import { updateBPALevelAction } from "../actions/bpa-level.actions";
import { BPALevelData } from "../queries/bpa-admin.query";

interface EditBPALevelFormProps {
  level: BPALevelData;
  onLevelUpdated: () => void;
}

const EditBPALevelForm: React.FC<EditBPALevelFormProps> = ({
  level,
  onLevelUpdated,
}) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await updateBPALevelAction(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("BPA level updated successfully!");
        router.refresh();
        onLevelUpdated();
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="levelId" value={level.id} />

      <div className="space-y-2">
        <Label htmlFor="name">Level Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={level.name}
          placeholder="e.g., Level 1, Level 2"
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="orderNumber">Order Number</Label>
        <Input
          id="orderNumber"
          name="orderNumber"
          type="number"
          defaultValue={level.orderNumber}
          placeholder="e.g., 1, 2, 3"
          required
          disabled={isPending}
          min={1}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="stars">Stars (0-5)</Label>
        <Select
          name="stars"
          defaultValue={level.stars.toString()}
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select stars" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">0 Stars</SelectItem>
            <SelectItem value="0.5">0.5 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
            <SelectItem value="1.5">1.5 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="2.5">2.5 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="3.5">3.5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="4.5">4.5 Stars</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fontSize">Font Size</Label>
        <Select
          name="fontSize"
          defaultValue={level.bpaLevelSettings?.fontSize || "BASE"}
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select font size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BASE">Base</SelectItem>
            <SelectItem value="LARGE">Large</SelectItem>
            <SelectItem value="XLARGE">Extra Large</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={level.description || ""}
          placeholder="Enter BPA level description..."
          rows={3}
          disabled={isPending}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Updating..." : "Update Level"}
        </Button>
      </div>
    </form>
  );
};

export default EditBPALevelForm;
