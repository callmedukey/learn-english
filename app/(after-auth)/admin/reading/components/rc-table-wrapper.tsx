import React from "react";

import { auth } from "@/auth";
import { Role } from "@/prisma/generated/prisma";

import RCTable from "./rc-table";
import { getRCLevels } from "../query/rc.query";

const RCTableWrapper = async () => {
  const [rcLevels, session] = await Promise.all([
    getRCLevels(),
    auth(),
  ]);
  const userRole = session?.user?.role as Role | undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Reading Comprehension Levels</h2>
        <span className="text-base text-gray-500">
          Total: {rcLevels.length} level{rcLevels.length !== 1 ? "s" : ""}
        </span>
      </div>
      <RCTable rcLevels={rcLevels} userRole={userRole} />
    </div>
  );
};

export default RCTableWrapper;
