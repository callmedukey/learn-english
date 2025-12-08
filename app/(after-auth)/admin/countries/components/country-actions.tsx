"use client";

import React from "react";

import { Button } from "@/components/ui/button";

import DeleteCountryDialog from "./delete-country-dialog";
import UpdateCountryDialog from "./update-country-dialog";

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

interface CountryActionsProps {
  country: Country;
}

const CountryActions: React.FC<CountryActionsProps> = ({ country }) => {
  return (
    <>
      <UpdateCountryDialog country={country}>
        <Button variant="outline" size="sm">
          Update
        </Button>
      </UpdateCountryDialog>
      <DeleteCountryDialog countryId={country.id} countryName={country.name}>
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      </DeleteCountryDialog>
    </>
  );
};

export default CountryActions;
