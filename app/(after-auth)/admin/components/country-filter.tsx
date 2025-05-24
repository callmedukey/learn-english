"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CountryOption } from "../queries/leaderboard.query";

interface CountryFilterProps {
  countries: CountryOption[];
  selectedCountry: string | null;
  onCountryChange: (countryId: string | null) => void;
}

export default function CountryFilter({
  countries,
  selectedCountry,
  onCountryChange,
}: CountryFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="country-select" className="text-sm font-medium">
        Filter by Country:
      </label>
      <Select
        value={selectedCountry || "all"}
        onValueChange={(value) =>
          onCountryChange(value === "all" ? null : value)
        }
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Countries" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Countries</SelectItem>
          {countries.map((country) => (
            <SelectItem key={country.id} value={country.id}>
              {country.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
