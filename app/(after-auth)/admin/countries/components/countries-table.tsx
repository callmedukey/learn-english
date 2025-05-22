import Image from "next/image";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { prisma } from "@/prisma/prisma-client";

import DeleteCountryDialog from "./delete-country-dialog";
import UpdateCountryDialog from "./update-country-dialog";

const CountriesTable = async () => {
  const countries = await prisma.country.findMany({
    include: {
      countryIcon: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  if (!countries || countries.length === 0) {
    return <p className="text-center text-gray-500">No countries found.</p>;
  }

  return (
    <Table className="mx-auto max-w-screen-md">
      <TableHeader>
        <TableRow>
          <TableHead
            scope="col"
            className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase"
          >
            No.
          </TableHead>
          <TableHead
            scope="col"
            className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase"
          >
            Icon
          </TableHead>
          <TableHead
            scope="col"
            className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase"
          >
            Country Name
          </TableHead>
          <TableHead
            scope="col"
            className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase"
          >
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {countries.map((country, index) => (
          <TableRow key={country.id}>
            <TableCell className="px-6 py-4 text-center text-sm font-medium whitespace-nowrap text-gray-900">
              {index + 1}
            </TableCell>
            <TableCell className="px-6 py-4 text-center text-sm whitespace-nowrap text-gray-500">
              {country.countryIcon?.iconUrl ? (
                <Image
                  src={country.countryIcon.iconUrl}
                  alt={country.name}
                  width={country.countryIcon.width || 32}
                  height={country.countryIcon.height || 32}
                  unoptimized
                  className="mx-auto size-8 rounded"
                />
              ) : (
                <span className="text-xs text-gray-400">No icon</span>
              )}
            </TableCell>
            <TableCell className="px-6 py-4 text-center text-sm whitespace-nowrap text-gray-900">
              {country.name}
            </TableCell>
            <TableCell className="flex items-center justify-center space-x-2 py-4 text-sm font-medium whitespace-nowrap">
              <UpdateCountryDialog country={country}>
                <Button variant="outline" size="sm">
                  Update
                </Button>
              </UpdateCountryDialog>
              <DeleteCountryDialog
                countryId={country.id}
                countryName={country.name}
              >
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              </DeleteCountryDialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default CountriesTable;
