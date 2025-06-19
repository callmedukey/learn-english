"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import React, { Suspense } from "react";

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
import { Country, Gender } from "@/prisma/generated/prisma";

interface UsersFilterProps {
  countries: Pick<Country, "id" | "name">[];
}

const gradeOptions = [
  "Kinder",
  ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`),
  "Adult",
];

const ALL_ITEMS_SELECT_VALUE = "__ALL_ITEMS__";

function FiltersComponent({ countries }: UsersFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [nickname, setNickname] = React.useState(
    searchParams.get("nickname") || "",
  );
  const [email, setEmail] = React.useState(searchParams.get("email") || "");
  const [country, setCountry] = React.useState(
    searchParams.get("country") || "",
  );
  const [gender, setGender] = React.useState(searchParams.get("gender") || "");
  const [grade, setGrade] = React.useState(searchParams.get("grade") || "");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (nickname) params.set("nickname", nickname);
    else params.delete("nickname");
    if (email) params.set("email", email);
    else params.delete("email");
    if (country) params.set("country", country);
    else params.delete("country");
    if (gender) params.set("gender", gender);
    else params.delete("gender");
    if (grade) params.set("grade", grade);
    else params.delete("grade");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleReset = () => {
    setNickname("");
    setEmail("");
    setCountry("");
    setGender("");
    setGrade("");
    router.push(`${pathname}?page=1`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 space-y-4 rounded-lg border bg-card p-4"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label htmlFor="nickname">Nickname</Label>
          <Input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Search nickname..."
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Search email..."
          />
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Select
            value={country}
            onValueChange={(selectedValue) =>
              setCountry(
                selectedValue === ALL_ITEMS_SELECT_VALUE ? "" : selectedValue,
              )
            }
          >
            <SelectTrigger id="country">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ITEMS_SELECT_VALUE}>
                All Countries
              </SelectItem>
              {countries.map((country) => (
                <SelectItem key={country.id} value={country.id}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={gender}
            onValueChange={(selectedValue) =>
              setGender(
                selectedValue === ALL_ITEMS_SELECT_VALUE ? "" : selectedValue,
              )
            }
          >
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ITEMS_SELECT_VALUE}>
                All Genders
              </SelectItem>
              {Object.values(Gender).map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="grade">Grade</Label>
          <Select
            value={grade}
            onValueChange={(selectedValue) =>
              setGrade(
                selectedValue === ALL_ITEMS_SELECT_VALUE ? "" : selectedValue,
              )
            }
          >
            <SelectTrigger id="grade">
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ITEMS_SELECT_VALUE}>All Grades</SelectItem>
              {gradeOptions.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={handleReset}>
          Reset Filters
        </Button>
        <Button type="submit">Apply Filters</Button>
      </div>
    </form>
  );
}

const UsersFilter = ({ countries }: UsersFilterProps) => {
  return (
    <Suspense fallback={<div>Loading filters...</div>}>
      <FiltersComponent countries={countries} />
    </Suspense>
  );
};

export default UsersFilter;
