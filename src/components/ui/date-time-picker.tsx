"use client";

import * as React from "react";
import { format, isValid, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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

interface DateTimePickerProps {
  value?: string; // YYYY-MM-DDTHH:mm or YYYY-MM-DD HH:mm:ss
  onChange?: (val: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function parseDateTimeSafely(val?: string): Date | undefined {
  if (!val || typeof val !== "string" || !val.trim()) return undefined;
  const trimmed = val.trim();
  
  // Try ISO parse
  let d = parseISO(trimmed.replace(" ", "T"));
  if (isValid(d)) return d;

  // Try DD/MM/YYYY format
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(trimmed)) {
    const [datePart, timePart, meridiem] = trimmed.split(" ");
    const parts = datePart.split("/");
    let hours = 0;
    let minutes = 0;
    if (timePart) {
      const [h, m] = timePart.split(":");
      hours = parseInt(h, 10) || 0;
      minutes = parseInt(m, 10) || 0;
      if (meridiem?.toUpperCase() === "PM" && hours < 12) hours += 12;
      if (meridiem?.toUpperCase() === "AM" && hours === 12) hours = 0;
    }
    d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10), hours, minutes);
    if (isValid(d)) return d;
  }

  d = new Date(trimmed);
  return isValid(d) ? d : undefined;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "DD/MM/YYYY HH:MM",
  className,
  disabled,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(() => parseDateTimeSafely(value));

  React.useEffect(() => {
    setSelectedDate(parseDateTimeSafely(value));
  }, [value]);

  const updateDateTime = (newDate?: Date) => {
    setSelectedDate(newDate);
    if (onChange) {
      if (newDate && isValid(newDate)) {
        onChange(format(newDate, "yyyy-MM-dd'T'HH:mm"));
      } else {
        onChange("");
      }
    }
  };

  const handleDateSelect = (date?: Date) => {
    if (!date) {
      updateDateTime(undefined);
      return;
    }
    const current = selectedDate || new Date();
    const updated = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      current.getHours(),
      current.getMinutes(),
      0
    );
    updateDateTime(updated);
  };

  const handleTimeChange = (type: "hours" | "minutes" | "ampm", val: string) => {
    const current = selectedDate ? new Date(selectedDate) : new Date();
    let hours = current.getHours();
    let minutes = current.getMinutes();

    if (type === "hours") {
      const h12 = parseInt(val, 10);
      const isPM = hours >= 12;
      hours = isPM ? (h12 % 12) + 12 : h12 % 12;
    } else if (type === "minutes") {
      minutes = parseInt(val, 10);
    } else if (type === "ampm") {
      const isCurrentlyPM = hours >= 12;
      if (val === "AM" && isCurrentlyPM) {
        hours -= 12;
      } else if (val === "PM" && !isCurrentlyPM) {
        hours += 12;
      }
    }

    current.setHours(hours);
    current.setMinutes(minutes);
    current.setSeconds(0);
    updateDateTime(current);
  };

  const currentHour12 = selectedDate
    ? (selectedDate.getHours() % 12 || 12).toString().padStart(2, "0")
    : "12";
  const currentMinute = selectedDate
    ? selectedDate.getMinutes().toString().padStart(2, "0")
    : "00";
  const currentAMPM = selectedDate && selectedDate.getHours() >= 12 ? "PM" : "AM";

  const clearDateTime = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateDateTime(undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-10 border-gray-200 bg-gray-50/30 rounded-lg text-xs group relative shadow-none hover:bg-gray-50",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-indigo-500 shrink-0" />
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            {selectedDate && isValid(selectedDate) ? (
              format(selectedDate, "dd/MM/yyyy hh:mm a")
            ) : (
              <span className="text-gray-400 font-normal">{placeholder}</span>
            )}
          </span>

          {selectedDate && !disabled && (
            <div
              role="button"
              onClick={clearDateTime}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md cursor-pointer z-10"
            >
              <X className="h-3 w-3 text-gray-400" />
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900" align="start">
        <div className="p-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] rounded-t-2xl">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Select Date & Time (DD/MM/YYYY)</p>
          <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 mt-0.5">
            {selectedDate && isValid(selectedDate)
              ? format(selectedDate, "dd/MM/yyyy hh:mm a")
              : "No date selected"}
          </p>
        </div>

        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          initialFocus
        />

        {/* Time Selector */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 dark:text-gray-400">
            <Clock className="h-3.5 w-3.5 text-indigo-500" />
            <span>Time</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Hours */}
            <Select value={currentHour12} onValueChange={(val) => handleTimeChange("hours", val)}>
              <SelectTrigger className="h-8 text-xs font-bold w-[65px] bg-white dark:bg-gray-800">
                <SelectValue placeholder="12" />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0")).map((h) => (
                  <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-gray-400 font-bold">:</span>

            {/* Minutes */}
            <Select value={currentMinute} onValueChange={(val) => handleTimeChange("minutes", val)}>
              <SelectTrigger className="h-8 text-xs font-bold w-[65px] bg-white dark:bg-gray-800">
                <SelectValue placeholder="00" />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0")).map((m) => (
                  <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* AM/PM */}
            <Select value={currentAMPM} onValueChange={(val) => handleTimeChange("ampm", val)}>
              <SelectTrigger className="h-8 text-xs font-bold w-[65px] bg-white dark:bg-gray-800">
                <SelectValue placeholder="AM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AM" className="text-xs font-bold">AM</SelectItem>
                <SelectItem value="PM" className="text-xs font-bold">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 bg-gray-50/90 dark:bg-gray-900 rounded-b-2xl">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold"
            onClick={() => updateDateTime(new Date())}
          >
            Now
          </Button>
          <div className="flex gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-gray-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => updateDateTime(undefined)}
            >
              Clear
            </Button>
            <Button
              type="button"
              size="sm"
              className="btn-gradient text-white text-xs font-bold h-7 px-3 rounded-md"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
