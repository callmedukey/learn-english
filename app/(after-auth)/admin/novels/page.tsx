import { Plus, Search } from "lucide-react";
import Link from "next/link";
import React, { Suspense } from "react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { canCreateARLevel } from "@/lib/utils/permissions";
import { Role } from "@/prisma/generated/prisma";

import ARTableWrapper from "./components/ar-table-wrapper";

const page = async () => {
  const session = await auth();
  const userRole = session?.user?.role as Role | undefined;
  return (
    <div className="space-y-6 px-1">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Novels</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/novels/search">
              <Search className="h-4 w-4" />
              Search Novels
            </Link>
          </Button>
          {canCreateARLevel(userRole) && (
            <Button asChild>
              <Link href="/admin/novels/create">
                <Plus className="h-4 w-4" />
                Create Lexile
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Suspense
        fallback={
          <div className="py-8 text-center">Loading Lexile records...</div>
        }
      >
        <ARTableWrapper />
      </Suspense>
    </div>
  );
};

export default page;
