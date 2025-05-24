import { Plus } from "lucide-react";
import Link from "next/link";
import React, { Suspense } from "react";

import { Button } from "@/components/ui/button";

import RCTableWrapper from "./components/rc-table-wrapper";

const page = () => {
  return (
    <div className="space-y-6 px-1">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reading Comprehension</h1>
        <Button asChild>
          <Link href="/admin/reading/create">
            <Plus className="h-4 w-4" />
            Create RC Level
          </Link>
        </Button>
      </div>

      <Suspense
        fallback={<div className="py-8 text-center">Loading RC levels...</div>}
      >
        <RCTableWrapper />
      </Suspense>
    </div>
  );
};

export default page;
