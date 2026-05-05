"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      captionLayout="dropdown"
      fromYear={1900}
      toYear={new Date().getFullYear() + 20}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4 relative",
        month_caption: "flex justify-center pt-1 relative items-center h-10",
        caption_label: "text-sm font-semibold flex items-center gap-1",
        nav: "flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-white p-0 opacity-100 hover:bg-gray-50 border-gray-200 shadow-sm rounded-full absolute left-1 top-1 z-10 transition-all active:scale-95"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-white p-0 opacity-100 hover:bg-gray-50 border-gray-200 shadow-sm rounded-full absolute right-1 top-1 z-10 transition-all active:scale-95"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday:
          "text-muted-foreground rounded-md w-9 font-medium text-[0.8rem] text-center py-2",
        week: "flex w-full mt-1",
        day: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-primary/10 hover:text-primary transition-colors rounded-lg"
        ),
        range_start: "day-range-start",
        range_end: "day-range-end",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-bold shadow-md shadow-primary/20",
        today: "bg-accent text-accent-foreground font-bold",
        outside:
          "day-outside text-muted-foreground/30 aria-selected:bg-accent/50 aria-selected:text-muted-foreground/30",
        disabled: "text-muted-foreground opacity-50",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        dropdown_root: "relative inline-flex items-center h-8 px-1 hover:bg-accent rounded-md transition-colors",
        dropdown: "absolute inset-0 opacity-0 cursor-pointer z-20 w-full",
        dropdown_icon: "hidden",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight
          return <Icon className="h-4 w-4 text-gray-500" />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
