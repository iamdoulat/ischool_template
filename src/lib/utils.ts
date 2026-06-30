import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO, isValid } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(time: string | Date | undefined | null, timeFormat: "12" | "24" = "24") {
  if (!time) return "";

  let h: number, m: number, s: number;

  if (typeof time === "string") {
    const parts = time.split(":");
    h = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
    s = parts[2] ? parseInt(parts[2], 10) : 0;
  } else {
    h = time.getHours();
    m = time.getMinutes();
    s = time.getSeconds();
  }

  if (isNaN(h) || isNaN(m)) return String(time);

  if (timeFormat === "12") {
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    const mm = m.toString().padStart(2, "0");
    return `${h12}:${mm} ${period}`;
  }

  const hh = h.toString().padStart(2, "0");
  const mm = m.toString().padStart(2, "0");
  const ss = s > 0 ? `:${s.toString().padStart(2, "0")}` : "";
  return `${hh}:${mm}${ss}`;
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
