import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, TouchableOpacity, View } from "react-native";

export type BPAViewMode = "single" | "all";

interface BPAViewModeToggleProps {
  viewMode: BPAViewMode;
  onViewModeChange: (mode: BPAViewMode) => void;
}

export function BPAViewModeToggle({
  viewMode,
  onViewModeChange,
}: BPAViewModeToggleProps) {
  return (
    <View className="flex-row gap-2">
      <TouchableOpacity
        onPress={() => onViewModeChange("single")}
        className={`flex-row items-center gap-1.5 rounded-lg px-3 py-2 ${
          viewMode === "single" ? "bg-primary" : "border border-gray-300 bg-white"
        }`}
      >
        <Ionicons
          name="square-outline"
          size={16}
          color={viewMode === "single" ? "#F9F5F0" : "#5D3A29"}
        />
        <Text
          className={`text-sm font-medium ${
            viewMode === "single" ? "text-primary-foreground" : "text-primary"
          }`}
        >
          Current
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onViewModeChange("all")}
        className={`flex-row items-center gap-1.5 rounded-lg px-3 py-2 ${
          viewMode === "all" ? "bg-primary" : "border border-gray-300 bg-white"
        }`}
      >
        <Ionicons
          name="grid-outline"
          size={16}
          color={viewMode === "all" ? "#F9F5F0" : "#5D3A29"}
        />
        <Text
          className={`text-sm font-medium ${
            viewMode === "all" ? "text-primary-foreground" : "text-primary"
          }`}
        >
          All Semesters
        </Text>
      </TouchableOpacity>
    </View>
  );
}
