"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useId } from "react";
import { DropdownNavProps, DropdownProps } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DayPickerProps {
  id?: string;
  label: string;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder: string;
  error?: string;
}

export default function DayPicker({
  id: propId,
  label,
  date,
  setDate,
  placeholder,
  error,
}: DayPickerProps) {
  const generatedId = useId();
  const finalId = propId || generatedId;
  const handleCalendarChange = (
    _value: string | number,
    _e: React.ChangeEventHandler<HTMLSelectElement>,
  ) => {
    const _event = {
      target: {
        value: String(_value),
      },
    } as React.ChangeEvent<HTMLSelectElement>;
    _e(_event);
  };

  return (
    <div className="*:not-first:mt-2">
      <Label htmlFor={finalId} className="text-base leading-6 text-gray-500">
        {label}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={finalId}
            variant={"outline"}
            className={cn(
              "group w-full justify-between border-input bg-background px-3 text-base font-normal outline-offset-0 outline-none hover:bg-background focus-visible:outline-[3px]",
              !date && "text-muted-foreground",
            )}
          >
            <span
              className={cn("truncate", !date && "text-muted-foreground/70")}
            >
              {date ? format(date, "yyyy-MM-dd") : placeholder}
            </span>
            <CalendarIcon
              size={16}
              className="shrink-0 text-muted-foreground/80 transition-colors group-hover:text-foreground"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border p-2"
            classNames={{
              month_caption: "mx-0",
            }}
            captionLayout="dropdown"
            defaultMonth={new Date()}
            startMonth={new Date(1940, 6)}
            hideNavigation
            components={{
              DropdownNav: (props: DropdownNavProps) => {
                return (
                  <div className="flex w-full items-center gap-2">
                    {props.children}
                  </div>
                );
              },
              Dropdown: (props: DropdownProps) => {
                return (
                  <Select
                    value={String(props.value)}
                    onValueChange={(value) => {
                      if (props.onChange) {
                        handleCalendarChange(value, props.onChange);
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 w-fit font-medium first:grow">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[min(26rem,var(--radix-select-content-available-height))]">
                      {props.options?.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={String(option.value)}
                          disabled={option.disabled}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              },
            }}
          />
        </PopoverContent>
      </Popover>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
