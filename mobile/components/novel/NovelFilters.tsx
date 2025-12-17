import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

import type { NovelFilterParams } from "@/types/novel";

interface NovelFiltersProps {
  filters: NovelFilterParams;
  onFiltersChange: (filters: NovelFilterParams) => void;
}

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "In Progress", value: "inProgress" },
  { label: "Not Started", value: "notStarted" },
] as const;

export function NovelFilters({ filters, onFiltersChange }: NovelFiltersProps) {
  const [searchText, setSearchText] = useState(filters.search || "");

  const handleSearchSubmit = () => {
    onFiltersChange({ ...filters, search: searchText || undefined, page: 1 });
  };

  const handleStatusChange = (status: NovelFilterParams["status"]) => {
    onFiltersChange({ ...filters, status, page: 1 });
  };

  return (
    <View className="mb-4 gap-3">
      {/* Search Input */}
      <View className="flex-row gap-2">
        <TextInput
          className="flex-1 rounded-lg border border-border bg-white px-4 py-3 text-foreground"
          placeholder="Search novels..."
          placeholderTextColor="#9CA3AF"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            className="items-center justify-center rounded-lg bg-muted px-4"
            onPress={() => {
              setSearchText("");
              onFiltersChange({ ...filters, search: undefined, page: 1 });
            }}
          >
            <Text className="text-muted-foreground">Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filters */}
      <View className="flex-row flex-wrap gap-2">
        {statusOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            className={`rounded-full px-4 py-2 ${
              (filters.status || "all") === option.value
                ? "bg-primary"
                : "bg-muted"
            }`}
            onPress={() => handleStatusChange(option.value)}
          >
            <Text
              className={`text-sm font-medium ${
                (filters.status || "all") === option.value
                  ? "text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
