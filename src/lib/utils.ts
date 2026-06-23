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

/**
 * Title-cases a snake_case identifier for display.
 * Used as the ultimate fallback when no translation is available.
 * Special-cases known acronyms: SMS, WA, CV, QR, CMS.
 */
export function formatLabel(name: string): string {
    return name
        .split('_')
        .map(word => {
            const lowerWord = word.toLowerCase();
            if (lowerWord === 'sms') return 'SMS';
            if (lowerWord === 'wa') return 'WA';
            if (lowerWord === 'cv') return 'CV';
            if (lowerWord === 'qr') return 'QR';
            if (lowerWord === 'cms') return 'CMS';
            if (lowerWord === 'id') return 'ID';
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ')
        .replace(/\bSetting\b/g, 'Settings');
}
