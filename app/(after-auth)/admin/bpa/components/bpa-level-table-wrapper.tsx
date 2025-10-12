import React from "react";

import { auth } from "@/auth";
import { Role } from "@/prisma/generated/prisma";

import BPALevelTable from "./bpa-level-table";
import { getBPALevels } from "../queries/bpa-admin.query";

const BPALevelTableWrapper = async () => {
  const [levels, session] = await Promise.all([getBPALevels(), auth()]);
  const userRole = session?.user?.role as Role | undefined;

  return <BPALevelTable levels={levels} userRole={userRole} />;
};

export default BPALevelTableWrapper;
