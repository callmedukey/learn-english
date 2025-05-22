"use client";

import Image from "next/image";
import React, { useState, useTransition } from "react";

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
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
    setError(null);
    setSuccessMessage(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createCountry(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccessMessage(
          `Country '${result.country?.name}' added successfully!`,
        );
        event.currentTarget.reset(); // Reset the form
        setIconPreview(null); // Clear preview
        if (onCountryAdded) {
          onCountryAdded();
        }
        if (setShowForm) {
          // Optionally hide form after a delay
          setTimeout(() => setShowForm(false), 2000);
        }
      } else {
        setError("An unexpected error occurred");
      }
    });
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
      {error && <p className="text-sm text-red-600">{error}</p>}
      {successMessage && (
        <p className="text-sm text-green-600">{successMessage}</p>
      )}
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
