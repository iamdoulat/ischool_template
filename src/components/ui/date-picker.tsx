"use client"

import * as React from "react"
import { format, isValid, parseISO } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string; // YYYY-MM-DD or other valid date string
  onChange?: (date: string) => void; // YYYY-MM-DD
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function parseDateSafely(val?: string): Date | undefined {
  if (!val || typeof val !== "string" || !val.trim()) return undefined;
  const trimmed = val.trim();
  let d = parseISO(trimmed);
  if (isValid(d)) return d;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const parts = trimmed.split('/');
    d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    if (isValid(d)) return d;
  }
  d = new Date(trimmed);
  return isValid(d) ? d : undefined;
}

export function DatePicker({ value, onChange, placeholder = "DD/MM/YYYY", className, disabled }: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(() => parseDateSafely(value));

  // Sync internal date state with value prop
  React.useEffect(() => {
    setDate(parseDateSafely(value));
  }, [value]);

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (onChange) {
      if (selectedDate) {
        // Format to YYYY-MM-DD for backend consistency
        onChange(format(selectedDate, "yyyy-MM-dd"))
      } else {
        onChange("")
      }
    }
  }

  const clearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleSelect(undefined);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={"outline"}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-medium text-xs h-11 border-gray-200 bg-gray-50/40 dark:bg-gray-800/40 rounded-lg group relative focus-visible:bg-white dark:focus-visible:bg-gray-800 focus-visible:ring-indigo-500",
            !date ? "text-gray-400" : "text-gray-900 dark:text-gray-100 font-semibold",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-indigo-500" />
          {date ? format(date, "dd/MM/yyyy") : <span className="text-gray-400">{placeholder}</span>}
          
          {date && !disabled && (
            <div
              role="button"
              onClick={clearDate}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 rounded-md cursor-pointer z-10"
            >
              <X className="h-3 w-3 text-gray-400" />
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-xl shadow-xl border-gray-100" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
        />
        <div className="p-2 border-t border-gray-100 flex items-center justify-between gap-2 bg-gray-50/50 rounded-b-xl">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
            onClick={() => handleSelect(new Date())}
          >
            Today
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-gray-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => handleSelect(undefined)}
          >
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
