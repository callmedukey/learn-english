"use client";

import Image from "next/image";
import React, { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Assuming you have an Input component
import { Label } from "@/components/ui/label"; // Assuming you have a Label component

import { createCountry } from "../actions/countries.admin-actions";

interface AddCountryFormProps {
  onCountryAdded?: () => void; // Optional: Callback for after country is added
  setShowForm?: (show: boolean) => void; // Optional: To hide form on success/cancel
}

const AddCountryForm: React.FC<AddCountryFormProps> = ({
  onCountryAdded,
  setShowForm,
}) => {
  const [isPending, startTransition] = useTransition();
  const [iconPreview, setIconPreview] = useState<string | null>(null);

  const handleIconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setIconPreview(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const form = event.currentTarget; // Store a reference to the form

    startTransition(async () => {
      const result = await createCountry(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(`Country '${result.country?.name}' added successfully!`);
        setIconPreview(null);
        if (onCountryAdded) {
          onCountryAdded();
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
        <Label htmlFor="countryName">Country Name</Label>
        <Input
          id="countryName"
          name="countryName"
          type="text"
          required
          disabled={isPending}
        />
      </div>
      <div>
        <Label htmlFor="iconFile">Country Icon</Label>
        <Input
          id="iconFile"
          name="iconFile"
          type="file"
          accept="image/*"
          required
          onChange={handleIconChange}
          disabled={isPending}
        />
        {iconPreview && (
          <div className="mt-2">
            <p className="text-sm text-gray-500">Icon Preview:</p>
            <Image
              src={iconPreview}
              alt="Icon Preview"
              className="mt-1 h-16 w-16 rounded border object-contain"
              width={64}
              height={64}
            />
          </div>
        )}
      </div>
      <div className="flex space-x-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Submitting..." : "Add Country"}
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

export default AddCountryForm;
