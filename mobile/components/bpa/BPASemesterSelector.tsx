import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type { BPATimeframe } from "@/types/bpa";

interface BPASemesterSelectorProps {
  timeframes: BPATimeframe[];
  selectedTimeframeId: string | null;
  onSelect: (timeframeId: string) => void;
}

export function BPASemesterSelector({
  timeframes,
  selectedTimeframeId,
  onSelect,
}: BPASemesterSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedTimeframe = timeframes.find(
    (tf) => tf.id === selectedTimeframeId
  );

  const handleSelect = (timeframeId: string) => {
    onSelect(timeframeId);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="flex-row items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2"
      >
        <Ionicons name="calendar-outline" size={18} color="#5D3A29" />
        <Text className="flex-1 text-sm text-foreground" numberOfLines={1}>
          {selectedTimeframe?.label || "Select timeframe"}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#6B7280" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/50"
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            className="mx-4 w-full max-w-sm rounded-xl bg-white"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
              <Text className="text-lg font-semibold text-foreground">
                Select Timeframe
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Options */}
            <ScrollView className="max-h-80">
              {timeframes.map((timeframe) => (
                <TouchableOpacity
                  key={timeframe.id}
                  onPress={() => handleSelect(timeframe.id)}
                  className={`flex-row items-center justify-between border-b border-gray-100 px-4 py-3 ${
                    timeframe.id === selectedTimeframeId ? "bg-primary/5" : ""
                  }`}
                >
                  <View className="flex-1">
                    <Text
                      className={`font-medium ${
                        timeframe.id === selectedTimeframeId
                          ? "text-primary"
                          : "text-foreground"
                      }`}
                    >
                      {timeframe.label}
                    </Text>
                    {timeframe.isActive && (
                      <View className="mt-1 flex-row items-center gap-1">
                        <View className="h-2 w-2 rounded-full bg-green-500" />
                        <Text className="text-xs text-green-600">Active</Text>
                      </View>
                    )}
                  </View>
                  {timeframe.id === selectedTimeframeId && (
                    <Ionicons name="checkmark" size={20} color="#5D3A29" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
