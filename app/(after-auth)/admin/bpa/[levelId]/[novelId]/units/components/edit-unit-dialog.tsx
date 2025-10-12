"use client";

import { Edit } from "lucide-react";
import React, { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { updateBPAUnit } from "../actions/unit.actions";

interface EditUnitDialogProps {
  unit: {
    id: string;
    name: string;
    description: string | null;
  };
  onSuccess?: () => void;
}

export function EditUnitDialog({ unit, onSuccess }: EditUnitDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(unit.name);
  const [description, setDescription] = useState(unit.description || "");

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Unit name is required");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("unitId", unit.id);
      formData.append("name", name.trim());
      formData.append("description", description.trim());

      const result = await updateBPAUnit(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Unit updated successfully");
        setOpen(false);
        onSuccess?.();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Unit</DialogTitle>
          <DialogDescription>
            Update the unit name and description.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Unit Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Unit 1: Introduction"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description for this unit"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
