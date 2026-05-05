import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO, isValid } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | undefined, formatStr: string = "dd/MM/yyyy") {
  if (!date) return ""
  
  const d = typeof date === "string" ? parseISO(date) : date
  
  if (!isValid(d)) return typeof date === "string" ? date : ""
  
  return format(d, formatStr)
}
