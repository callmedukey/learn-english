import Ionicons from "@expo/vector-icons/Ionicons";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { Calendar } from "react-native-big-calendar";

import type { CampusEvent, CampusEventColor } from "@/types/bpa";

// Map event colors to hex values
const EVENT_COLOR_MAP: Record<CampusEventColor, string> = {
  sky: "#0EA5E9",
  amber: "#F59E0B",
  violet: "#8B5CF6",
  rose: "#F43F5E",
  emerald: "#10B981",
  orange: "#F97316",
  red: "#EF4444",
  blue: "#3B82F6",
  green: "#22C55E",
  yellow: "#EAB308",
  pink: "#EC4899",
  indigo: "#6366F1",
  cyan: "#06B6D4",
  teal: "#14B8A6",
  lime: "#84CC16",
  fuchsia: "#D946EF",
  slate: "#64748B",
};

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  description?: string;
  location?: string;
  allDay: boolean;
}

interface BPACampusCalendarProps {
  events: CampusEvent[];
  isLoading?: boolean;
}

export function BPACampusCalendar({ events, isLoading }: BPACampusCalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Transform API events to calendar format
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return events.map((event) => ({
      id: event.id,
      title: event.title,
      start: new Date(event.startDate),
      end: new Date(event.endDate),
      color: EVENT_COLOR_MAP[event.color] || "#5D3A29",
      description: event.description || undefined,
      location: event.location || undefined,
      allDay: event.allDay,
    }));
  }, [events]);

  // Navigation handlers
  const handlePrevMonth = useCallback(() => {
    setCurrentDate((prev) => dayjs(prev).subtract(1, "month").toDate());
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate((prev) => dayjs(prev).add(1, "month").toDate());
  }, []);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Handle event press
  const handlePressEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
  }, []);

  // Event cell style based on event color (with centered text)
  const eventCellStyle = useCallback((event: CalendarEvent) => {
    return {
      backgroundColor: event.color,
      borderRadius: 4,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      paddingHorizontal: 4,
    };
  }, []);

  
  // Format current month/year title
  const monthTitle = useMemo(() => {
    return dayjs(currentDate).format("MMMM YYYY");
  }, [currentDate]);

  // Check if current view is showing today's month
  const isCurrentMonth = useMemo(() => {
    return dayjs(currentDate).isSame(dayjs(), "month");
  }, [currentDate]);

  // Format time for display
  const formatTime = (date: Date, allDay: boolean) => {
    if (allDay) return "All day";
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format date range for display
  const formatDateRange = (start: Date, end: Date, allDay: boolean) => {
    if (allDay) {
      if (start.toDateString() === end.toDateString()) {
        return "All day";
      }
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    }

    if (start.toDateString() === end.toDateString()) {
      return `${formatTime(start, false)} - ${formatTime(end, false)}`;
    }

    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${formatTime(start, false)} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${formatTime(end, false)}`;
  };

  if (isLoading) {
    return (
      <View className="items-center justify-center rounded-xl bg-white p-8">
        <ActivityIndicator size="large" color="#5D3A29" />
        <Text className="mt-2 text-muted-foreground">Loading calendar...</Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      {/* Calendar Header */}
      <View className="flex-row items-center gap-2">
        <Ionicons name="calendar" size={20} color="#5D3A29" />
        <Text className="text-xl font-bold text-amber-900">Campus Calendar</Text>
      </View>

      {/* Calendar Container */}
      <View className="overflow-hidden rounded-xl bg-white">
        {/* Navigation Header */}
        <View className="flex-row items-center justify-between border-b border-gray-200 px-3 py-2">
          {/* Left: Today button + Navigation */}
          <View className="flex-row items-center gap-1">
            {/* Today Button */}
            <Pressable
              onPress={handleToday}
              className={`rounded-lg border px-3 py-1.5 ${
                isCurrentMonth
                  ? "border-gray-200 bg-gray-100"
                  : "border-gray-300 bg-white"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  isCurrentMonth ? "text-gray-400" : "text-gray-700"
                }`}
              >
                Today
              </Text>
            </Pressable>

            {/* Prev/Next Arrows */}
            <View className="flex-row items-center">
              <Pressable
                onPress={handlePrevMonth}
                className="p-2 active:bg-gray-100 rounded-lg"
              >
                <Ionicons name="chevron-back" size={20} color="#5D3A29" />
              </Pressable>
              <Pressable
                onPress={handleNextMonth}
                className="p-2 active:bg-gray-100 rounded-lg"
              >
                <Ionicons name="chevron-forward" size={20} color="#5D3A29" />
              </Pressable>
            </View>
          </View>

          {/* Center: Month Title */}
          <Text className="text-base font-semibold text-gray-800">
            {monthTitle}
          </Text>

          {/* Right: Placeholder for view selector (if needed later) */}
          <View className="w-16" />
        </View>

        {/* Calendar Grid */}
        <Calendar
          events={calendarEvents}
          height={380}
          mode="month"
          date={currentDate}
          onPressEvent={handlePressEvent}
          eventCellStyle={eventCellStyle}
          eventCellTextColor="#FFFFFF"
          swipeEnabled={true}
          onSwipeEnd={(date) => setCurrentDate(date)}
          showAdjacentMonths={true}
          sortedMonthView={true}
          weekStartsOn={0}
          locale="en"
          theme={{
            palette: {
              primary: {
                main: "#5D3A29",
                contrastText: "#F9F5F0",
              },
              gray: {
                "100": "#F5F5F5",
                "200": "#E5E5E5",
                "300": "#D1D5DB",
                "500": "#737373",
                "800": "#4A5568",
              },
            },
            typography: {
              fontFamily: "NotoSans_400Regular",
              sm: { fontSize: 12 },
              xl: { fontSize: 14 },
            },
          }}
        />
      </View>

      {/* Empty state if no events */}
      {events.length === 0 && (
        <View className="items-center rounded-xl bg-white p-6">
          <Ionicons name="calendar-outline" size={40} color="#9CA3AF" />
          <Text className="mt-2 text-center font-medium text-foreground">
            No upcoming events
          </Text>
          <Text className="mt-1 text-center text-sm text-muted-foreground">
            Campus events will appear here when scheduled
          </Text>
        </View>
      )}

      {/* Event Detail Modal */}
      <Modal
        visible={selectedEvent !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedEvent(null)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/50"
          onPress={() => setSelectedEvent(null)}
        >
          <Pressable
            className="mx-4 w-full max-w-sm rounded-xl bg-white p-5"
            onPress={(e) => e.stopPropagation()}
          >
            {selectedEvent && (
              <>
                {/* Color bar and title */}
                <View className="flex-row items-start gap-3">
                  <View
                    className="mt-1 h-4 w-4 rounded"
                    style={{ backgroundColor: selectedEvent.color }}
                  />
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-foreground">
                      {selectedEvent.title}
                    </Text>
                  </View>
                </View>

                {/* Date/Time */}
                <View className="mt-4 flex-row items-center gap-2">
                  <Ionicons name="time-outline" size={16} color="#737373" />
                  <Text className="text-muted-foreground">
                    {formatDateRange(selectedEvent.start, selectedEvent.end, selectedEvent.allDay)}
                  </Text>
                </View>

                {/* Location */}
                {selectedEvent.location && (
                  <View className="mt-2 flex-row items-center gap-2">
                    <Ionicons name="location-outline" size={16} color="#737373" />
                    <Text className="text-muted-foreground">{selectedEvent.location}</Text>
                  </View>
                )}

                {/* Description */}
                {selectedEvent.description && (
                  <View className="mt-4">
                    <Text className="text-foreground">{selectedEvent.description}</Text>
                  </View>
                )}

                {/* Close button */}
                <Pressable
                  className="mt-6 items-center rounded-lg bg-primary py-3"
                  onPress={() => setSelectedEvent(null)}
                >
                  <Text className="font-semibold text-primary-foreground">Close</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
