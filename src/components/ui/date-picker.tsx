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
  value?: string; // YYYY-MM-DD
  onChange?: (date: string) => void; // YYYY-MM-DD
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({ value, onChange, placeholder = "DD/MM/YYYY", className, disabled }: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(() => {
    if (!value) return undefined;
    const d = parseISO(value);
    return isValid(d) ? d : undefined;
  });

  // Sync internal date state with value prop
  React.useEffect(() => {
    if (value) {
      const parsedDate = parseISO(value);
      if (isValid(parsedDate)) {
        setDate(parsedDate);
      } else {
        setDate(undefined);
      }
    } else {
      setDate(undefined);
    }
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
          variant={"outline"}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-11 border-gray-200 rounded-lg group relative",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-indigo-500" />
          {date ? format(date, "dd/MM/yyyy") : <span>{placeholder}</span>}
          
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
