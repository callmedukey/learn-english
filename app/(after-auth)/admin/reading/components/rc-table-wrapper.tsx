import React from "react";

import RCTable from "./rc-table";
import { getRCLevels } from "../query/rc.query";

const RCTableWrapper = async () => {
  const rcLevels = await getRCLevels();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Reading Comprehension Levels</h2>
        <span className="text-sm text-gray-500">
          Total: {rcLevels.length} level{rcLevels.length !== 1 ? "s" : ""}
        </span>
      </div>
      <RCTable rcLevels={rcLevels} />
    </div>
  );
};

export default RCTableWrapper;
