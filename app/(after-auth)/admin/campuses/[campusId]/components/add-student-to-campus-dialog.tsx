"use client";

import { Loader2, Plus, Search, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

import { assignUserToCampusAction } from "../../actions/campuses.admin-actions";

interface SearchUser {
  id: string;
  name: string;
  email: string;
  currentCampus: string | null;
}

interface AddStudentToCampusDialogProps {
  campusId: string;
  campusName: string;
}

const AddStudentToCampusDialog: React.FC<AddStudentToCampusDialogProps> = ({
  campusId,
  campusName,
}) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/admin/users/search?q=${encodeURIComponent(debouncedSearch)}&excludeCampusId=${campusId}`
        );
        const data = await response.json();

        if (data.error) {
          toast.error(data.error);
          setSearchResults([]);
        } else {
          setSearchResults(data.users || []);
        }
      } catch {
        toast.error("Failed to search users");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    searchUsers();
  }, [debouncedSearch, campusId]);

  const handleAddUser = (user: SearchUser) => {
    setAddingUserId(user.id);
    startTransition(async () => {
      const result = await assignUserToCampusAction(user.id, campusId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${user.name} added to ${campusName} successfully!`);
        // Remove user from search results
        setSearchResults((prev) => prev.filter((u) => u.id !== user.id));
        router.refresh();
      }
      setAddingUserId(null);
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when closing
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Student to {campusName}</DialogTitle>
          <DialogDescription>
            Search for users by name, nickname, or email to add them to this
            campus.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search by name, nickname, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Search Results */}
          <div className="max-h-[300px] space-y-2 overflow-y-auto">
            {isSearching && (
              <div className="text-muted-foreground flex items-center justify-center py-4">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </div>
            )}

            {!isSearching &&
              debouncedSearch.length >= 2 &&
              searchResults.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No users found matching &quot;{debouncedSearch}&quot;
                </p>
              )}

            {!isSearching && searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{user.name}</p>
                      <p className="text-muted-foreground truncate text-sm">
                        {user.email}
                      </p>
                      {user.currentCampus && (
                        <p className="text-xs text-amber-600">
                          Currently in: {user.currentCampus}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddUser(user)}
                      disabled={isPending && addingUserId === user.id}
                      className="ml-2 shrink-0"
                    >
                      {isPending && addingUserId === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {!isSearching && debouncedSearch.length < 2 && (
              <p className="text-muted-foreground py-4 text-center text-sm">
                Type at least 2 characters to search
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddStudentToCampusDialog;
