"use client";

import Image from "next/image";
import React, { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateCountry } from "../actions/countries.admin-actions";

type Country = {
  id: string;
  name: string;
  countryIcon?: {
    id: string;
    iconUrl: string;
    width?: number | null;
    height?: number | null;
  } | null;
};

interface UpdateCountryFormProps {
  country: Country;
  onCountryUpdated?: () => void;
  setShowForm?: (show: boolean) => void;
}

const UpdateCountryForm: React.FC<UpdateCountryFormProps> = ({
  country,
  onCountryUpdated,
  setShowForm,
}) => {
  const [isPending, startTransition] = useTransition();
  const [iconPreview, setIconPreview] = useState<string | null>(
    country.countryIcon?.iconUrl || null,
  );
  const [countryName, setCountryName] = useState(country.name);

  useEffect(() => {
    setCountryName(country.name);
    setIconPreview(country.countryIcon?.iconUrl || null);
  }, [country]);

  const handleIconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.append("countryId", country.id);

    startTransition(async () => {
      const result = await updateCountry(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(
          `Country '${result.country?.name}' updated successfully!`,
        );
        if (result.country?.countryIcon?.iconUrl) {
          setIconPreview(result.country.countryIcon.iconUrl);
        }
        if (onCountryUpdated) {
          onCountryUpdated();
        }
        if (setShowForm) {
          setTimeout(() => setShowForm(false), 2000);
        }
      } else {
        toast.error("An unexpected error occurred during update");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto my-4 max-w-md space-y-4 rounded-md border bg-white p-4 shadow-sm"
    >
      <input type="hidden" name="countryId" value={country.id} />
      <div>
        <Label htmlFor="countryName">Country Name</Label>
        <Input
          id="countryName"
          name="countryName"
          type="text"
          required
          value={countryName}
          onChange={(e) => setCountryName(e.target.value)}
          disabled={isPending}
        />
      </div>
      <div>
        <Label htmlFor="iconFile">
          Country Icon (leave blank to keep current)
        </Label>
        <Input
          id="iconFile"
          name="iconFile"
          type="file"
          accept="image/*"
          onChange={handleIconChange}
          disabled={isPending}
        />
        {iconPreview && (
          <div className="mt-2">
            <p className="text-sm text-gray-500">Current/New Icon Preview:</p>
            <Image
              src={iconPreview}
              alt="Icon Preview"
              className="mt-1 h-16 w-16 rounded border object-contain"
              width={64}
              height={64}
              unoptimized
            />
          </div>
        )}
      </div>
      <div className="flex space-x-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Updating..." : "Update Country"}
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

export default UpdateCountryForm;
