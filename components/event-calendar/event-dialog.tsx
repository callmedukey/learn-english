"use client";

import { RiCalendarLine, RiDeleteBinLine } from "@remixicon/react";
import { format, isBefore } from "date-fns";
import { CalendarIcon, ClockIcon, MapPinIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  DefaultEndHour,
  DefaultStartHour,
  EndHour,
  StartHour,
} from "@/components/event-calendar/constants";
import type { CalendarEvent, EventColor } from "@/components/event-calendar/types";
import { getEventColorClasses } from "@/components/event-calendar/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface EventDialogProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  readOnly?: boolean;
}

export function EventDialog({
  event,
  isOpen,
  onClose,
  onSave,
  onDelete,
  readOnly = false,
}: EventDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState(`${DefaultStartHour}:00`);
  const [endTime, setEndTime] = useState(`${DefaultEndHour}:00`);
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [color, setColor] = useState<EventColor>("sky");
  const [error, setError] = useState<string | null>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Debug log to check what event is being passed
  useEffect(() => {
    console.log("EventDialog received event:", event);
  }, [event]);

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setStartDate(new Date());
    setEndDate(new Date());
    setStartTime(`${DefaultStartHour}:00`);
    setEndTime(`${DefaultEndHour}:00`);
    setAllDay(false);
    setLocation("");
    setColor("sky");
    setError(null);
  }, []);

  const formatTimeForInput = useCallback((date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = Math.floor(date.getMinutes() / 15) * 15;
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    if (event) {
      setTitle(event.title || "");
      setDescription(event.description || "");

      const start = new Date(event.start);
      const end = new Date(event.end);

      setStartDate(start);
      setEndDate(end);
      setStartTime(formatTimeForInput(start));
      setEndTime(formatTimeForInput(end));
      setAllDay(event.allDay || false);
      setLocation(event.location || "");
      setColor((event.color as EventColor) || "sky");
      setError(null); // Reset error when opening dialog
    } else {
      resetForm();
    }
  }, [event, formatTimeForInput, resetForm]);

  // Memoize time options so they're only calculated once
  const timeOptions = useMemo(() => {
    const options = [];
    for (let hour = StartHour; hour <= EndHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, "0");
        const formattedMinute = minute.toString().padStart(2, "0");
        const value = `${formattedHour}:${formattedMinute}`;
        // Use a fixed date to avoid unnecessary date object creations
        const date = new Date(2000, 0, 1, hour, minute);
        const label = format(date, "h:mm a");
        options.push({ label, value });
      }
    }
    return options;
  }, []); // Empty dependency array ensures this only runs once

  const handleSave = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!allDay) {
      const [startHours = 0, startMinutes = 0] = startTime
        .split(":")
        .map(Number);
      const [endHours = 0, endMinutes = 0] = endTime.split(":").map(Number);

      if (
        startHours < StartHour ||
        startHours > EndHour ||
        endHours < StartHour ||
        endHours > EndHour
      ) {
        setError(
          `Selected time must be between ${StartHour}:00 and ${EndHour}:00`,
        );
        return;
      }

      start.setHours(startHours, startMinutes, 0);
      end.setHours(endHours, endMinutes, 0);
    } else {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    // Validate that end date is not before start date
    if (isBefore(end, start)) {
      setError("End date cannot be before start date");
      return;
    }

    // Use generic title if empty
    const eventTitle = title.trim() ? title : "(no title)";

    onSave({
      allDay,
      color,
      description,
      end,
      id: event?.id || "",
      location,
      start,
      title: eventTitle,
    });
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (event?.id) {
      onDelete(event.id);
      setShowDeleteConfirm(false);
    }
  };

  // Format event time for read-only view
  const formatReadOnlyEventTime = useCallback(() => {
    if (!event) return "";
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    if (event.allDay) {
      const startDateStr = format(eventStart, "MMM d, yyyy");
      const endDateStr = format(eventEnd, "MMM d, yyyy");
      if (startDateStr === endDateStr) {
        return startDateStr;
      }
      return `${startDateStr} - ${endDateStr}`;
    }

    const startDateStr = format(eventStart, "MMM d, yyyy");
    const endDateStr = format(eventEnd, "MMM d, yyyy");
    const startTimeStr = format(eventStart, "h:mm a");
    const endTimeStr = format(eventEnd, "h:mm a");

    if (startDateStr === endDateStr) {
      return `${startDateStr}, ${startTimeStr} - ${endTimeStr}`;
    }
    return `${startDateStr} ${startTimeStr} - ${endDateStr} ${endTimeStr}`;
  }, [event]);

  // Color options for event picker
  const colorOptions: Array<{
    value: EventColor;
    label: string;
    bgClass: string;
    borderClass: string;
  }> = [
    {
      bgClass: "bg-sky-400 data-[state=checked]:bg-sky-400",
      borderClass: "border-sky-400 data-[state=checked]:border-sky-400",
      label: "Sky",
      value: "sky",
    },
    {
      bgClass: "bg-blue-400 data-[state=checked]:bg-blue-400",
      borderClass: "border-blue-400 data-[state=checked]:border-blue-400",
      label: "Blue",
      value: "blue",
    },
    {
      bgClass: "bg-indigo-400 data-[state=checked]:bg-indigo-400",
      borderClass: "border-indigo-400 data-[state=checked]:border-indigo-400",
      label: "Indigo",
      value: "indigo",
    },
    {
      bgClass: "bg-violet-400 data-[state=checked]:bg-violet-400",
      borderClass: "border-violet-400 data-[state=checked]:border-violet-400",
      label: "Violet",
      value: "violet",
    },
    {
      bgClass: "bg-fuchsia-400 data-[state=checked]:bg-fuchsia-400",
      borderClass: "border-fuchsia-400 data-[state=checked]:border-fuchsia-400",
      label: "Fuchsia",
      value: "fuchsia",
    },
    {
      bgClass: "bg-pink-400 data-[state=checked]:bg-pink-400",
      borderClass: "border-pink-400 data-[state=checked]:border-pink-400",
      label: "Pink",
      value: "pink",
    },
    {
      bgClass: "bg-rose-400 data-[state=checked]:bg-rose-400",
      borderClass: "border-rose-400 data-[state=checked]:border-rose-400",
      label: "Rose",
      value: "rose",
    },
    {
      bgClass: "bg-red-400 data-[state=checked]:bg-red-400",
      borderClass: "border-red-400 data-[state=checked]:border-red-400",
      label: "Red",
      value: "red",
    },
    {
      bgClass: "bg-orange-400 data-[state=checked]:bg-orange-400",
      borderClass: "border-orange-400 data-[state=checked]:border-orange-400",
      label: "Orange",
      value: "orange",
    },
    {
      bgClass: "bg-amber-400 data-[state=checked]:bg-amber-400",
      borderClass: "border-amber-400 data-[state=checked]:border-amber-400",
      label: "Amber",
      value: "amber",
    },
    {
      bgClass: "bg-yellow-400 data-[state=checked]:bg-yellow-400",
      borderClass: "border-yellow-400 data-[state=checked]:border-yellow-400",
      label: "Yellow",
      value: "yellow",
    },
    {
      bgClass: "bg-lime-400 data-[state=checked]:bg-lime-400",
      borderClass: "border-lime-400 data-[state=checked]:border-lime-400",
      label: "Lime",
      value: "lime",
    },
    {
      bgClass: "bg-green-400 data-[state=checked]:bg-green-400",
      borderClass: "border-green-400 data-[state=checked]:border-green-400",
      label: "Green",
      value: "green",
    },
    {
      bgClass: "bg-emerald-400 data-[state=checked]:bg-emerald-400",
      borderClass: "border-emerald-400 data-[state=checked]:border-emerald-400",
      label: "Emerald",
      value: "emerald",
    },
    {
      bgClass: "bg-teal-400 data-[state=checked]:bg-teal-400",
      borderClass: "border-teal-400 data-[state=checked]:border-teal-400",
      label: "Teal",
      value: "teal",
    },
    {
      bgClass: "bg-cyan-400 data-[state=checked]:bg-cyan-400",
      borderClass: "border-cyan-400 data-[state=checked]:border-cyan-400",
      label: "Cyan",
      value: "cyan",
    },
    {
      bgClass: "bg-slate-400 data-[state=checked]:bg-slate-400",
      borderClass: "border-slate-400 data-[state=checked]:border-slate-400",
      label: "Slate",
      value: "slate",
    },
  ];

  // Read-only view for students
  if (readOnly && event) {
    return (
      <Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {event.color && (
                <div
                  className={cn(
                    "h-4 w-4 shrink-0 rounded-full",
                    getEventColorClasses(event.color).replace(
                      /hover:[^\s]+/g,
                      ""
                    )
                  )}
                />
              )}
              <DialogTitle className="text-xl">{event.title}</DialogTitle>
            </div>
            {event.description && (
              <DialogDescription className="mt-2 text-left">
                {event.description}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Date/Time */}
            <div className="flex items-start gap-3 text-sm">
              {event.allDay ? (
                <CalendarIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span>
                {formatReadOnlyEventTime()}
                {event.allDay && (
                  <span className="ml-2 text-xs text-muted-foreground">(All day)</span>
                )}
              </span>
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-start gap-3 text-sm">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{event?.id ? "Edit Event" : "Create Event"}</DialogTitle>
          <DialogDescription className="sr-only">
            {event?.id
              ? "Edit the details of this event"
              : "Add a new event to your calendar"}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="rounded-md bg-destructive/15 px-3 py-2 text-destructive text-sm">
            {error}
          </div>
        )}
        <div className="grid gap-4 py-4">
          <div className="*:not-first:mt-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              onChange={(e) => setTitle(e.target.value)}
              value={title}
            />
          </div>

          <div className="*:not-first:mt-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              value={description}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1 *:not-first:mt-1.5">
              <Label htmlFor="start-date">Start Date</Label>
              <Popover onOpenChange={setStartDateOpen} open={startDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    className={cn(
                      "group w-full justify-between border-input bg-background px-3 font-normal outline-none outline-offset-0 hover:bg-background focus-visible:outline-[3px]",
                      !startDate && "text-muted-foreground",
                    )}
                    id="start-date"
                    variant={"outline"}
                  >
                    <span
                      className={cn(
                        "truncate",
                        !startDate && "text-muted-foreground",
                      )}
                    >
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </span>
                    <RiCalendarLine
                      aria-hidden="true"
                      className="shrink-0 text-muted-foreground/80"
                      size={16}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-2">
                  <Calendar
                    defaultMonth={startDate}
                    mode="single"
                    onSelect={(date) => {
                      if (date) {
                        setStartDate(date);
                        // If end date is before the new start date, update it to match the start date
                        if (isBefore(endDate, date)) {
                          setEndDate(date);
                        }
                        setError(null);
                        setStartDateOpen(false);
                      }
                    }}
                    selected={startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {!allDay && (
              <div className="min-w-28 *:not-first:mt-1.5">
                <Label htmlFor="start-time">Start Time</Label>
                <Select onValueChange={setStartTime} value={startTime}>
                  <SelectTrigger id="start-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex-1 *:not-first:mt-1.5">
              <Label htmlFor="end-date">End Date</Label>
              <Popover onOpenChange={setEndDateOpen} open={endDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    className={cn(
                      "group w-full justify-between border-input bg-background px-3 font-normal outline-none outline-offset-0 hover:bg-background focus-visible:outline-[3px]",
                      !endDate && "text-muted-foreground",
                    )}
                    id="end-date"
                    variant={"outline"}
                  >
                    <span
                      className={cn(
                        "truncate",
                        !endDate && "text-muted-foreground",
                      )}
                    >
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </span>
                    <RiCalendarLine
                      aria-hidden="true"
                      className="shrink-0 text-muted-foreground/80"
                      size={16}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-2">
                  <Calendar
                    defaultMonth={endDate}
                    disabled={{ before: startDate }}
                    mode="single"
                    onSelect={(date) => {
                      if (date) {
                        setEndDate(date);
                        setError(null);
                        setEndDateOpen(false);
                      }
                    }}
                    selected={endDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {!allDay && (
              <div className="min-w-28 *:not-first:mt-1.5">
                <Label htmlFor="end-time">End Time</Label>
                <Select onValueChange={setEndTime} value={endTime}>
                  <SelectTrigger id="end-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={allDay}
              id="all-day"
              onCheckedChange={(checked) => setAllDay(checked === true)}
            />
            <Label htmlFor="all-day">All day</Label>
          </div>

          <div className="*:not-first:mt-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              onChange={(e) => setLocation(e.target.value)}
              value={location}
            />
          </div>
          <fieldset className="space-y-4">
            <legend className="font-medium text-foreground text-sm leading-none">
              Color
            </legend>
            <RadioGroup
              className="flex flex-wrap gap-1.5"
              defaultValue={colorOptions[0]?.value}
              onValueChange={(value: EventColor) => setColor(value)}
              value={color}
            >
              {colorOptions.map((colorOption) => (
                <RadioGroupItem
                  aria-label={colorOption.label}
                  className={cn(
                    "size-6 shadow-none",
                    colorOption.bgClass,
                    colorOption.borderClass,
                  )}
                  id={`color-${colorOption.value}`}
                  key={colorOption.value}
                  value={colorOption.value}
                />
              ))}
            </RadioGroup>
          </fieldset>
        </div>
        <DialogFooter className="flex-row sm:justify-between">
          {event?.id && (
            <Button
              aria-label="Delete event"
              onClick={handleDeleteClick}
              size="icon"
              variant="outline"
            >
              <RiDeleteBinLine aria-hidden="true" size={16} />
            </Button>
          )}
          <div className="flex flex-1 justify-end gap-2">
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{event?.title || "this event"}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
