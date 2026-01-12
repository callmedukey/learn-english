"use client";

import { Loader2, Search, X } from "lucide-react";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserSearchProps {
  selectedUsers: User[];
  onSelect: (user: User) => void;
  onRemove: (userId: string) => void;
}

export default function UserSearch({
  selectedUsers,
  onSelect,
  onRemove,
}: UserSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [isPending, startTransition] = useTransition();
  const [showResults, setShowResults] = useState(false);

  const handleSearch = () => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/admin/users/search?q=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        setResults(data.users || []);
        setShowResults(true);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      }
    });
  };

  const handleSelect = (user: User) => {
    onSelect(user);
    setResults([]);
    setQuery("");
    setShowResults(false);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
            onFocus={() => results.length > 0 && setShowResults(true)}
            className="pr-10"
          />
          {isPending && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleSearch}
          disabled={isPending || query.length < 2}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-md border bg-white shadow-lg">
          {results.map((user) => {
            const isSelected = selectedUsers.some((u) => u.id === user.id);
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => !isSelected && handleSelect(user)}
                disabled={isSelected}
                className={`flex w-full items-center justify-between px-4 py-2 text-left hover:bg-gray-50 ${
                  isSelected ? "cursor-not-allowed bg-gray-100 opacity-50" : ""
                }`}
              >
                <span className="font-medium">{user.name}</span>
                <span className="text-sm text-gray-500">{user.email}</span>
              </button>
            );
          })}
        </div>
      )}

      {showResults && results.length === 0 && query.length >= 2 && !isPending && (
        <div className="rounded-md border bg-gray-50 p-3 text-center text-sm text-gray-500">
          No users found matching &quot;{query}&quot;
        </div>
      )}

      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Selected Users ({selectedUsers.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <Badge
                key={user.id}
                variant="secondary"
                className="flex items-center gap-1 py-1 pl-3 pr-1"
              >
                <span>{user.name}</span>
                <button
                  type="button"
                  onClick={() => onRemove(user.id)}
                  className="rounded-full p-0.5 hover:bg-gray-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
