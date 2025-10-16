import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import React, { Suspense } from "react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Role } from "@/prisma/generated/prisma";

import { getARLevelsForSelection } from "../query/ar.query";
import { searchNovels } from "../query/novel.query";
import SearchNovelsTable from "./components/search-novels-table";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

const SearchNovelsPage = async ({ searchParams }: PageProps) => {
  const { q: searchQuery } = await searchParams;
  const session = await auth();
  const userRole = session?.user?.role as Role | undefined;

  // Fetch novels and AR levels
  const [novels, arLevels] = await Promise.all([
    searchQuery ? searchNovels(searchQuery) : Promise.resolve([]),
    getARLevelsForSelection(),
  ]);

  return (
    <div className="space-y-6 px-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/novels">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Novels
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Search Novels</h1>
            {searchQuery && (
              <p className="text-base text-gray-600">
                {novels.length} result{novels.length !== 1 ? "s" : ""} found
                {searchQuery && ` for "${searchQuery}"`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="rounded-lg border bg-card p-4">
        <form action="/admin/novels/search" method="get" className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              type="text"
              name="q"
              placeholder="Search by title or description..."
              defaultValue={searchQuery || ""}
              className="pl-10"
              autoFocus
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </div>

      {/* Results */}
      {searchQuery ? (
        <Suspense
          fallback={<div className="py-8 text-center">Searching novels...</div>}
        >
          <SearchNovelsTable
            novels={novels}
            arLevels={arLevels}
            userRole={userRole}
          />
        </Suspense>
      ) : (
        <div className="py-8 text-center">
          <p className="text-gray-500">
            Enter a search term to find novels by title or description
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchNovelsPage;
