import { Plus } from "lucide-react";
import Link from "next/link";
import React, { Suspense } from "react";

import { Button } from "@/components/ui/button";

import ARTableWrapper from "./components/ar-table-wrapper";

const page = () => {
  return (
    <div className="space-y-6 px-1">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Novels</h1>
        <Button asChild>
          <Link href="/admin/novels/create">
            <Plus className="h-4 w-4" />
            Create AR
          </Link>
        </Button>
      </div>

      <Suspense
        fallback={<div className="py-8 text-center">Loading AR records...</div>}
      >
        <ARTableWrapper />
      </Suspense>
    </div>
  );
};

export default page;
