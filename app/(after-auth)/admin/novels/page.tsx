import React, { Suspense } from "react";

import ARTableWrapper from "./components/ar-table-wrapper";

const page = () => {
  return (
    <div className="space-y-6 px-1">
      <h1 className="text-center text-2xl font-bold">Novels</h1>

      <Suspense
        fallback={<div className="py-8 text-center">Loading AR records...</div>}
      >
        <ARTableWrapper />
      </Suspense>
    </div>
  );
};

export default page;
