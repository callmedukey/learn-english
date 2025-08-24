import React from "react";

import { auth } from "@/auth";
import { Role } from "@/prisma/generated/prisma";

import ARTable from "./ar-table";
import { getARs } from "../query/ar.query";

const ARTableWrapper = async () => {
  const [ars, session] = await Promise.all([
    getARs(),
    auth(),
  ]);
  const userRole = session?.user?.role as Role | undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Lexile Records</h2>
        <span className="text-sm text-gray-500">
          Total: {ars.length} record{ars.length !== 1 ? "s" : ""}
        </span>
      </div>
      <ARTable ars={ars} userRole={userRole} />
    </div>
  );
};

export default ARTableWrapper;
