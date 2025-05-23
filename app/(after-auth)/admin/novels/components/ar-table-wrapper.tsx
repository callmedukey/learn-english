import React from "react";

import ARTable from "./ar-table";
import { getARs } from "../query/ar.query";

const ARTableWrapper = async () => {
  const ars = await getARs();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">AR Records</h2>
        <span className="text-sm text-gray-500">
          Total: {ars.length} record{ars.length !== 1 ? "s" : ""}
        </span>
      </div>
      <ARTable ars={ars} />
    </div>
  );
};

export default ARTableWrapper;
