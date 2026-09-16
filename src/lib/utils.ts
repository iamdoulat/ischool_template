import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO, isValid } from "date-fns"
import { tokenManager } from "@/lib/token-manager"

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
 * Localizes numeric digits in a string/number based on the active language code.
 * Supports Bengali ('bn'), Arabic ('ar'), Hindi ('hi'), with standard fallback.
 */
export function toLocaleNumber(
  value: string | number | undefined | null,
  langCode: string = "en"
): string {
  if (value === null || value === undefined || value === "") return "";
  const str = String(value);

  if (langCode === "bn") {
    const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return str.replace(/[0-9]/g, (d) => bnDigits[Number(d)]);
  }
  if (langCode === "ar") {
    const arDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    return str.replace(/[0-9]/g, (d) => arDigits[Number(d)]);
  }
  if (langCode === "hi") {
    const hiDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
    return str.replace(/[0-9]/g, (d) => hiDigits[Number(d)]);
  }

  return str;
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

/**
 * Safe LocalStorage wrapper to prevent SecurityError / DOMExceptions
 * on Android Incognito, Private browsing, or restricted WebViews.
 */
export const safeStorage = {
  getItem: (key: string): string | null => {
    if (key === 'auth_token') {
      return tokenManager.getToken() || (typeof window !== 'undefined' ? window.localStorage?.getItem(key) : null);
    }
    if (key === 'admin_auth_token') {
      return tokenManager.getAdminToken() || (typeof window !== 'undefined' ? window.localStorage?.getItem(key) : null);
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Storage unavailable or access denied
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (key === 'auth_token') {
      tokenManager.setToken(value);
      return;
    }
    if (key === 'admin_auth_token') {
      tokenManager.setAdminToken(value);
      return;
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Storage unavailable or access denied
    }
  },
  removeItem: (key: string): void => {
    if (key === 'auth_token') {
      tokenManager.clearToken();
      return;
    }
    if (key === 'admin_auth_token') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      return;
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Storage unavailable or access denied
    }
  }
};

/**
 * Translates and formats academic class names based on the active language code.
 * Supports Bengali ('bn'), Arabic ('ar'), Hindi ('hi'), and English ('en').
 */
export function translateClassName(name?: string | null, langCode: string = "en"): string {
  if (!name) return "";
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    const bnMap: Record<string, string> = {
      "class 1": "১ম শ্রেণি",
      "class 1st": "১ম শ্রেণি",
      "class-1": "১ম শ্রেণি",
      "class 2": "২য় শ্রেণি",
      "class 2nd": "২য় শ্রেণি",
      "class-2": "২য় শ্রেণি",
      "class 3": "৩য় শ্রেণি",
      "class 3rd": "৩য় শ্রেণি",
      "class-3": "৩য় শ্রেণি",
      "class 4": "৪র্থ শ্রেণি",
      "class 4th": "৪র্থ শ্রেণি",
      "class-4": "৪র্থ শ্রেণি",
      "class 5": "৫ম শ্রেণি",
      "class 5th": "৫ম শ্রেণি",
      "class-5": "৫ম শ্রেণি",
      "class 6": "৬ষ্ঠ শ্রেণি",
      "class 6th": "৬ষ্ঠ শ্রেণি",
      "class-6": "৬ষ্ঠ শ্রেণি",
      "class 7": "৭ম শ্রেণি",
      "class 7th": "৭ম শ্রেণি",
      "class-7": "৭ম শ্রেণি",
      "class 8": "৮ম শ্রেণি",
      "class 8th": "৮ম শ্রেণি",
      "class-8": "৮ম শ্রেণি",
      "class 9": "৯ম শ্রেণি",
      "class 9th": "৯ম শ্রেণি",
      "class-9": "৯ম শ্রেণি",
      "class 10": "১০ম শ্রেণি",
      "class 10th": "১০ম শ্রেণি",
      "class-10": "১০ম শ্রেণি",
      "class 11": "১১শ শ্রেণি",
      "class 11th": "১১শ শ্রেণি",
      "class-11": "১১শ শ্রেণি",
      "class 12": "১২শ শ্রেণি",
      "class 12th": "১২শ শ্রেণি",
      "class-12": "১২শ শ্রেণি",
      "play": "প্লে",
      "playgroup": "প্লে-গ্রুপ",
      "nursery": "নার্সারি",
      "kg": "কেজি",
      "kindergarten": "কিন্ডারগার্টেন",
    };
    if (bnMap[lower]) return bnMap[lower];

    const match = lower.match(/^class\s*[-_]?\s*(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      const ordinals: Record<number, string> = {
        1: "১ম শ্রেণি",
        2: "২য় শ্রেণি",
        3: "৩য় শ্রেণি",
        4: "৪র্থ শ্রেণি",
        5: "৫ম শ্রেণি",
        6: "৬ষ্ঠ শ্রেণি",
        7: "৭ম শ্রেণি",
        8: "৮ম শ্রেণি",
        9: "৯ম শ্রেণি",
        10: "১০ম শ্রেণি",
        11: "১১শ শ্রেণি",
        12: "১২শ শ্রেণি"
      };
      if (ordinals[num]) return ordinals[num];
      return `শ্রেণি ${toLocaleNumber(num, "bn")}`;
    }
    return toLocaleNumber(trimmed, "bn");
  }

  if (langCode === "ar") {
    const arMap: Record<string, string> = {
      "class 1": "الصف الأول",
      "class 1st": "الصف الأول",
      "class-1": "الصف الأول",
      "class 2": "الصف الثاني",
      "class 2nd": "الصف الثاني",
      "class-2": "الصف الثاني",
      "class 3": "الصف الثالث",
      "class 3rd": "الصف الثالث",
      "class-3": "الصف الثالث",
      "class 4": "الصف الرابع",
      "class 4th": "الصف الرابع",
      "class-4": "الصف الرابع",
      "class 5": "الصف الخامس",
      "class 5th": "الصف الخامس",
      "class-5": "الصف الخامس",
      "class 6": "الصف السادس",
      "class 6th": "الصف السادس",
      "class-6": "الصف السادس",
      "class 7": "الصف السابع",
      "class 7th": "الصف السابع",
      "class-7": "الصف السابع",
      "class 8": "الصف الثامن",
      "class 8th": "الصف الثامن",
      "class-8": "الصف الثامن",
      "class 9": "الصف التاسع",
      "class 9th": "الصف التاسع",
      "class-9": "الصف التاسع",
      "class 10": "الصف العاشر",
      "class 10th": "الصف العاشر",
      "class-10": "الصف العاشر",
      "class 11": "الصف الحادي عشر",
      "class 11th": "الصف الحادي عشر",
      "class-11": "الصف الحادي عشر",
      "class 12": "الصف الثاني عشر",
      "class 12th": "الصف الثاني عشر",
      "class-12": "الصف الثاني عشر",
      "play": "الروضة",
      "playgroup": "مجموعة اللعب",
      "nursery": "الحضانة",
      "kg": "تمهيدي",
      "kindergarten": "رياض الأطفال",
    };
    if (arMap[lower]) return arMap[lower];

    const match = lower.match(/^class\s*[-_]?\s*(\d+)/i);
    if (match) {
      return `الصف ${match[1]}`;
    }
    return trimmed;
  }

  if (langCode === "hi") {
    const hiMap: Record<string, string> = {
      "class 1": "कक्षा 1",
      "class 1st": "कक्षा 1",
      "class-1": "कक्षा 1",
      "class 2": "कक्षा 2",
      "class 2nd": "कक्षा 2",
      "class-2": "कक्षा 2",
      "class 3": "कक्षा 3",
      "class 3rd": "कक्षा 3",
      "class-3": "कक्षा 3",
      "class 4": "कक्षा 4",
      "class 4th": "कक्षा 4",
      "class-4": "कक्षा 4",
      "class 5": "कक्षा 5",
      "class 5th": "कक्षा 5",
      "class-5": "कक्षा 5",
      "class 6": "कक्षा 6",
      "class 6th": "कक्षा 6",
      "class-6": "कक्षा 6",
      "class 7": "कक्षा 7",
      "class 7th": "कक्षा 7",
      "class-7": "कक्षा 7",
      "class 8": "कक्षा 8",
      "class 8th": "कक्षा 8",
      "class-8": "कक्षा 8",
      "class 9": "कक्षा 9",
      "class 9th": "कक्षा 9",
      "class-9": "कक्षा 9",
      "class 10": "कक्षा 10",
      "class 10th": "कक्षा 10",
      "class-10": "कक्षा 10",
      "class 11": "कक्षा 11",
      "class 11th": "कक्षा 11",
      "class-11": "कक्षा 11",
      "class 12": "कक्षा 12",
      "class 12th": "कक्षा 12",
      "class-12": "कक्षा 12",
      "play": "प्ले",
      "playgroup": "प्ले-ग्रुप",
      "nursery": "नर्सरी",
      "kg": "केजी",
      "kindergarten": "किंडरगार्टन",
    };
    if (hiMap[lower]) return hiMap[lower];

    const match = lower.match(/^class\s*[-_]?\s*(\d+)/i);
    if (match) {
      return `कक्षा ${match[1]}`;
    }
  }

  return trimmed;
}

/**
 * Translates section names (A, B, Section A, Rose, Lotus, etc.) based on the language code.
 */
export function translateSectionName(name?: string | null, langCode: string = "en"): string {
  if (!name) return "";
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    const bnSectionMap: Record<string, string> = {
      "a": "শাখা ক",
      "b": "শাখা খ",
      "c": "শাখা গ",
      "d": "শাখা ঘ",
      "e": "শাখা ঙ",
      "section a": "শাখা ক",
      "section b": "শাখা খ",
      "section c": "শাখা গ",
      "section d": "শাখা ঘ",
      "section-a": "শাখা ক",
      "section-b": "শাখা খ",
      "section-c": "শাখা গ",
      "section-d": "শাখা ঘ",
      "sec a": "শাখা ক",
      "sec b": "শাখা খ",
      "sec c": "শাখা গ",
      "sec d": "শাখা ঘ",
      "rose": "গোলাপ",
      "lotus": "পদ্ম",
      "lily": "শাপলা",
      "tulip": "টিউলিপ",
      "jasmine": "বেলী",
      "sunflower": "সূর্যমুখী",
      "red": "লাল",
      "green": "সবুজ",
      "blue": "নীল",
      "yellow": "হলুদ",
    };
    if (bnSectionMap[lower]) return bnSectionMap[lower];
    return trimmed;
  }

  if (langCode === "ar") {
    const arSectionMap: Record<string, string> = {
      "a": "القسم أ",
      "b": "القسم ب",
      "c": "القسم ج",
      "d": "القسم د",
      "e": "القسم هـ",
      "section a": "القسم أ",
      "section b": "القسم ب",
      "section c": "القسم ج",
      "section d": "القسم د",
      "section-a": "القسم أ",
      "section-b": "القسم ب",
      "section-c": "القسم ج",
      "section-d": "القسم د",
      "sec a": "القسم أ",
      "sec b": "القسم ب",
      "sec c": "القسم ج",
      "sec d": "القسم د",
      "rose": "وردة",
      "lotus": "لوتس",
      "lily": "زنبق",
      "tulip": "توليب",
      "jasmine": "ياسمين",
      "sunflower": "دوار الشمس",
      "red": "أحمر",
      "green": "أخضر",
      "blue": "أزرق",
      "yellow": "أصفر",
    };
    if (arSectionMap[lower]) return arSectionMap[lower];
    return trimmed;
  }

  if (langCode === "hi") {
    const hiSectionMap: Record<string, string> = {
      "a": "सेक्शन ए",
      "b": "सेक्शन बी",
      "c": "सेक्शन सी",
      "d": "सेक्शन डी",
      "e": "सेक्शन ई",
      "section a": "सेक्शन ए",
      "section b": "सेक्शन बी",
      "section c": "सेक्शन सी",
      "section d": "सेक्शन डी",
      "section-a": "सेक्शन ए",
      "section-b": "सेक्शन बी",
      "section-c": "सेक्शन सी",
      "section-d": "सेक्शन डी",
      "sec a": "सेक्शन ए",
      "sec b": "सेक्शन बी",
      "sec c": "सेक्शन सी",
      "sec d": "सेक्शन डी",
      "rose": "गुलाब",
      "lotus": "कमल",
      "lily": "लिली",
      "tulip": "ट्यूलिप",
      "jasmine": "चमेली",
      "sunflower": "सूरजमुखी",
      "red": "लाल",
      "green": "हरा",
      "blue": "नीला",
      "yellow": "पीला",
    };
    if (hiSectionMap[lower]) return hiSectionMap[lower];
    return trimmed;
  }

  return trimmed;
}

/**
 * Translates compound Class-Section strings like "Class 1(A)", "Class 1 - A", "Class 1 (2026) - A", "Class 1 (2026-27)".
 */
export function translateClassSection(classSection?: string | null, langCode: string = "en"): string {
  if (!classSection) return "";
  const trimmed = classSection.trim();

  // Pattern: "Class 1 (2026) - A" or "Class 1 (2026-27) - A"
  const fullMatch = trimmed.match(/^([^(]+?)(?:\s*\(([^)]+)\))?\s*[-–—]\s*([^-–—]+)$/);
  if (fullMatch && fullMatch[2]) {
    const clsPart = fullMatch[1].trim();
    const sessionPart = fullMatch[2].trim();
    const secPart = fullMatch[3].trim();
    const transCls = translateClassName(clsPart, langCode);
    const transSec = translateSectionName(secPart, langCode);
    const transSession = ` (${toLocaleNumber(sessionPart, langCode)})`;
    return `${transCls}${transSession} - ${transSec}`;
  }

  // Pattern: "Class 1 (A)" or "Class 1 (2026)"
  const parenMatch = trimmed.match(/^([^(]+?)\s*\(([^)]+)\)$/);
  if (parenMatch) {
    const clsPart = parenMatch[1].trim();
    const inside = parenMatch[2].trim();
    if (/^\d{4}/.test(inside)) {
      // It's a year or session like "2026" or "2026-27"
      const transCls = translateClassName(clsPart, langCode);
      return `${transCls} (${toLocaleNumber(inside, langCode)})`;
    }
    const transCls = translateClassName(clsPart, langCode);
    const transSec = translateSectionName(inside, langCode);
    return `${transCls} (${transSec})`;
  }

  // Pattern: "Class 1 - A"
  const hyphenMatch = trimmed.match(/^([^-–—]+?)\s*[-–—]\s*([^-–—]+)$/);
  if (hyphenMatch) {
    const clsPart = hyphenMatch[1].trim();
    const secPart = hyphenMatch[2].trim();
    const transCls = translateClassName(clsPart, langCode);
    const transSec = translateSectionName(secPart, langCode);
    return `${transCls} - ${transSec}`;
  }

  return translateClassName(trimmed, langCode);
}

/**
 * Translates a month name (e.g. "April", "May") to the target language (bn, ar, hi, en).
 */
export function translateMonthName(monthName?: string | null, langCode: string = "en"): string {
  if (!monthName) return "";
  const lower = monthName.trim().toLowerCase();

  const bnMonths: Record<string, string> = {
    january: "জানুয়ারি",
    february: "ফেব্রুয়ারি",
    march: "মার্চ",
    april: "এপ্রিল",
    may: "মে",
    june: "জুন",
    july: "জুলাই",
    august: "আগস্ট",
    september: "সেপ্টেম্বর",
    october: "অক্টোবর",
    november: "নভেম্বর",
    december: "ডিসেম্বর",
  };

  const arMonths: Record<string, string> = {
    january: "يناير",
    february: "فبراير",
    march: "مارس",
    april: "أبريل",
    may: "مايو",
    june: "يونيو",
    july: "يوليو",
    august: "أغسطس",
    september: "سبتمبر",
    october: "أكتوبر",
    november: "نوفمبر",
    december: "ديسمبر",
  };

  const hiMonths: Record<string, string> = {
    january: "जनवरी",
    february: "फरवरी",
    march: "मार्च",
    april: "अप्रैल",
    may: "मई",
    june: "जून",
    july: "जुलाई",
    august: "अगस्त",
    september: "सितंबर",
    october: "अक्टूबर",
    november: "नवंबर",
    december: "दिसंबर",
  };

  if (langCode === "bn" && bnMonths[lower]) return bnMonths[lower];
  if (langCode === "ar" && arMonths[lower]) return arMonths[lower];
  if (langCode === "hi" && hiMonths[lower]) return hiMonths[lower];

  return monthName;
}

/**
 * Translates academic subject names based on the active language code (bn, ar, hi, en).
 */
export function translateSubjectName(name?: string | null, langCode: string = "en"): string {
  if (!name) return "";
  const trimmed = name.trim();

  // Handle compound subject + code like "Bangla (101)", "English (210)", "Mathematics (110)"
  const codeMatch = trimmed.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (codeMatch) {
    const baseSubj = codeMatch[1].trim();
    const code = codeMatch[2].trim();
    const transBase = translateSubjectName(baseSubj, langCode);
    const transCode = toLocaleNumber(code, langCode);
    return `${transBase} (${transCode})`;
  }

  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    const bnMap: Record<string, string> = {
      "bangla": "বাংলা",
      "bengali": "বাংলা",
      "bangla 1st": "বাংলা ১ম পত্র",
      "bangla 1st paper": "বাংলা ১ম পত্র",
      "bangla 2nd": "বাংলা ২য় পত্র",
      "bangla 2nd paper": "বাংলা ২য় পত্র",
      "english": "ইংরেজি",
      "english 1st": "ইংরেজি ১ম পত্র",
      "english 1st paper": "ইংরেজি ১ম পত্র",
      "english 2nd": "ইংরেজি ২য় পত্র",
      "english 2nd paper": "ইংরেজি ২য় পত্র",
      "mathematics": "গণিত",
      "math": "গণিত",
      "maths": "গণিত",
      "general math": "সাধারণ গণিত",
      "higher math": "উচ্চতর গণিত",
      "higher mathematics": "উচ্চতর গণিত",
      "science": "বিজ্ঞান",
      "general science": "সাধারণ বিজ্ঞান",
      "social science": "সমাজ বিজ্ঞান",
      "social studies": "সমাজ বিজ্ঞান",
      "bangladesh and global studies": "বাংলাদেশ ও বিশ্বপরিচয়",
      "bgs": "বাংলাদেশ ও বিশ্বপরিচয়",
      "religion": "ধর্ম",
      "islamic studies": "ইসলাম শিক্ষা",
      "islam": "ইসলাম ও নৈতিক শিক্ষা",
      "islam and moral education": "ইসলাম ও নৈতিক শিক্ষা",
      "hindu religion": "হিন্দুধর্ম শিক্ষা",
      "hinduism": "হিন্দুধর্ম শিক্ষা",
      "hindu and moral education": "হিন্দুধর্ম ও নৈতিক শিক্ষা",
      "christianity": "খ্রিস্টধর্ম ও নৈতিক শিক্ষা",
      "buddhism": "বৌদ্ধধর্ম ও নৈতিক শিক্ষা",
      "ict": "তথ্য ও যোগাযোগ প্রযুক্তি",
      "information and communication technology": "তথ্য ও যোগাযোগ প্রযুক্তি",
      "computer": "কম্পিউটার",
      "physics": "পদার্থবিজ্ঞান",
      "chemistry": "রসায়ন",
      "biology": "জীববিজ্ঞান",
      "history": "ইতিহাস",
      "geography": "ভূগোল",
      "economics": "অর্থনীতি",
      "accounting": "হিসাববিজ্ঞান",
      "finance": "অর্থায়ন ও ব্যাংকিং",
      "finance and banking": "ফিন্যান্স ও ব্যাংকিং",
      "business studies": "ব্যবসায় শিক্ষা",
      "business entrepreneurship": "ব্যবসায় উদ্যোগ",
      "agricultural studies": "কৃষি শিক্ষা",
      "agriculture": "কৃষি শিক্ষা",
      "home science": "গার্হস্থ্য বিজ্ঞান",
      "physical education": "শারীরিক শিক্ষা",
      "arts and crafts": "চারু ও কারুকলা",
      "drawing": "অঙ্কন",
      "art": "চারুকলা",
      "music": "সঙ্গীত",
      "arabic": "আরবি",
      "english book": "ইংরেজি বই",
      "bangla book": "বাংলা বই",
      "general knowledge": "সাধারণ জ্ঞান",
      "gk": "সাধারণ জ্ঞান",
    };
    if (bnMap[lower]) return bnMap[lower];
  }

  if (langCode === "ar") {
    const arMap: Record<string, string> = {
      "bangla": "البنغالية",
      "bengali": "البنغالية",
      "english": "الإنجليزية",
      "mathematics": "الرياضيات",
      "math": "الرياضيات",
      "maths": "الرياضيات",
      "general math": "الرياضيات العامة",
      "higher math": "الرياضيات المتقدمة",
      "higher mathematics": "الرياضيات المتقدمة",
      "science": "العلوم",
      "general science": "العلوم العامة",
      "social science": "العلوم الاجتماعية",
      "social studies": "الدراسات الاجتماعية",
      "religion": "التربية الدينية",
      "islamic studies": "الدراسات الإسلامية",
      "islam": "التربية الإسلامية",
      "ict": "تكنولوجيا المعلومات",
      "computer": "الحاسوب",
      "physics": "الفيزياء",
      "chemistry": "الكيمياء",
      "biology": "الأحياء",
      "history": "التاريخ",
      "geography": "الجغرافيا",
      "economics": "الاقتصاد",
      "accounting": "المحاسبة",
      "business studies": "دراسات إدارة الأعمال",
      "physical education": "التربية البدنية",
      "art": "التربية الفنية",
      "arabic": "اللغة العربية",
      "english book": "كتاب اللغة الإنجليزية",
      "bangla book": "كتاب اللغة البنغالية",
    };
    if (arMap[lower]) return arMap[lower];
  }

  if (langCode === "hi") {
    const hiMap: Record<string, string> = {
      "bangla": "बंगाली",
      "bengali": "बंगाली",
      "english": "अंग्रेजी",
      "english book": "अंग्रेजी पुस्तक",
      "bangla book": "बंगाली पुस्तक",
      "mathematics": "गणित",
      "math": "गणित",
      "maths": "गणित",
      "general math": "सामान्य गणित",
      "higher math": "उच्च गणित",
      "higher mathematics": "उच्च गणित",
      "science": "विज्ञान",
      "general science": "सामान्य विज्ञान",
      "social science": "सामाजिक विज्ञान",
      "social studies": "सामाजिक अध्ययन",
      "religion": "धर्म",
      "islamic studies": "इस्लामिक अध्ययन",
      "ict": "सूचना प्रौद्योगिकी",
      "computer": "कंप्यूटर",
      "physics": "भौतिकी",
      "chemistry": "रसायन विज्ञान",
      "biology": "जीव विज्ञान",
      "history": "इतिहास",
      "geography": "भूगोल",
      "economics": "अर्थशास्त्र",
      "accounting": "लेखाशास्त्र",
      "business studies": "व्यावसायिक अध्ययन",
      "physical education": "शारीरिक शिक्षा",
      "art": "कला",
      "hindi": "हिंदी",
      "sanskrit": "संस्कृत",
    };
    if (hiMap[lower]) return hiMap[lower];
  }

  return toLocaleNumber(trimmed, langCode);
}

/**
 * Translates visitor purposes (Staff Meeting, Parent Meeting, Admission, etc.)
 */
export function translateVisitorPurpose(purpose?: string | null, langCode: string = "en"): string {
  if (!purpose) return "";
  const trimmed = purpose.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    const bnMap: Record<string, string> = {
      "staff meeting": "স্টাফ মিটিং",
      "meeting": "মিটিং",
      "parent teacher meeting": "অভিভাবক-শিক্ষক সভা",
      "parent meeting": "অভিভাবক সভা",
      "admission inquiry": "ভর্তি অনুসন্ধান",
      "admission": "ভর্তি সংক্রান্ত",
      "marketing": "মার্কেটিং",
      "official work": "দাপ্তরিক কাজ",
      "official": "দাপ্তরিক",
      "general visit": "সাধারণ পরিদর্শন",
      "visit": "পরিদর্শন",
      "fees payment": "ফি প্রদান",
      "interview": "সাক্ষাৎকার",
      "other": "অন্যান্য",
    };
    if (bnMap[lower]) return bnMap[lower];
  }

  if (langCode === "ar") {
    const arMap: Record<string, string> = {
      "staff meeting": "اجتماع الموظفين",
      "meeting": "اجتماع",
      "parent teacher meeting": "اجتماع أولياء الأمور والمعلمين",
      "parent meeting": "اجتماع أولياء الأمور",
      "admission inquiry": "استفسار عن القبول",
      "admission": "القبول",
      "marketing": "التسويق",
      "official work": "عمل رسمي",
      "official": "رسمي",
      "general visit": "زيارة عامة",
      "visit": "زيارة",
      "fees payment": "دفع الرسوم",
      "interview": "مقابلة",
      "other": "أخرى",
    };
    if (arMap[lower]) return arMap[lower];
  }

  if (langCode === "hi") {
    const hiMap: Record<string, string> = {
      "staff meeting": "स्टाफ मीटिंग",
      "meeting": "बैठक",
      "parent teacher meeting": "अभिभावक-शिक्षक बैठक",
      "parent meeting": "अभिभावक बैठक",
      "admission inquiry": "प्रवेश पूछताछ",
      "admission": "प्रवेश",
      "marketing": "मार्केटिंग",
      "official work": "आधिकारिक कार्य",
      "official": "आधिकारिक",
      "general visit": "सामान्य यात्रा",
      "visit": "यात्रा",
      "fees payment": "शुल्क भुगतान",
      "interview": "साक्षात्कार",
      "other": "अन्य",
    };
    if (hiMap[lower]) return hiMap[lower];
  }

  return trimmed;
}

/**
 * Translates common assignment / homework / attendance status badges
 */
export function translateStatusBadge(status?: string | null, langCode: string = "en"): string {
  if (!status) return "";
  const trimmed = status.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    const bnMap: Record<string, string> = {
      "pending": "মুলতুবি",
      "submitted": "জমা দেওয়া হয়েছে",
      "evaluated": "মূল্যায়িত",
      "completed": "সম্পন্ন",
      "active": "সক্রিয়",
      "inactive": "নিষ্ক্রিয়",
      "approved": "অনুমোদিত",
      "rejected": "প্রত্যাখ্যাত",
      "present": "উপস্থিত",
      "absent": "অনুপস্থিত",
      "late": "দেরি",
      "half day": "অর্ধদিবস",
    };
    if (bnMap[lower]) return bnMap[lower];
  }

  if (langCode === "ar") {
    const arMap: Record<string, string> = {
      "pending": "قيد الانتظار",
      "submitted": "تم التقديم",
      "evaluated": "تم التقييم",
      "completed": "مكتمل",
      "active": "نشط",
      "inactive": "غير نشط",
      "approved": "معتمد",
      "rejected": "مرفوض",
      "present": "حاضر",
      "absent": "غائب",
      "late": "متأخر",
      "half day": "نصف يوم",
    };
    if (arMap[lower]) return arMap[lower];
  }

  if (langCode === "hi") {
    const hiMap: Record<string, string> = {
      "pending": "लंबित",
      "submitted": "जमा किया गया",
      "evaluated": "मूल्यांकित",
      "completed": "पूर्ण",
      "active": "सक्रिय",
      "inactive": "निष्क्रिय",
      "approved": "स्वीकृत",
      "rejected": "अस्वीकृत",
      "present": "उपस्थित",
      "absent": "अनुपस्थित",
      "late": "देरी",
      "half day": "आधा दिन",
    };
    if (hiMap[lower]) return hiMap[lower];
  }

  return trimmed;
}

/**
 * Translates academic subject group names based on active language code.
 */
export function translateSubjectGroupName(group?: string | null, langCode: string = "en"): string {
  if (!group) return "";
  if (langCode === "en") return group;
  const trimmed = group.trim();
  const lower = trimmed.toLowerCase();

  if (lower === "all") {
    return langCode === "bn" ? "সকল" : langCode === "ar" ? "الكل" : "सभी";
  }

  const classMatch = lower.match(/class\s*(\d+)/i);
  if (classMatch) {
    const num = classMatch[1];
    const numLoc = toLocaleNumber(num, langCode);
    if (lower.includes("science")) {
      return langCode === "bn"
        ? `${numLoc}ম শ্রেণির বিজ্ঞান গ্রুপ`
        : langCode === "ar"
        ? `مجموعة علوم الصف ${numLoc}`
        : `कक्षा ${numLoc} विज्ञान समूह`;
    }
    if (lower.includes("humanities") || lower.includes("arts")) {
      return langCode === "bn"
        ? `${numLoc}ম শ্রেণির মানবিক গ্রুপ`
        : langCode === "ar"
        ? `مجموعة العلوم الإنسانية الصف ${numLoc}`
        : `कक्षा ${numLoc} मानविकी समूह`;
    }
    if (lower.includes("commerce") || lower.includes("business")) {
      return langCode === "bn"
        ? `${numLoc}ম শ্রেণির বাণিজ্য গ্রুপ`
        : langCode === "ar"
        ? `مجموعة التجارة الصف ${numLoc}`
        : `कक्षा ${numLoc} वाणिज्य समूह`;
    }
    return langCode === "bn"
      ? `${numLoc}ম শ্রেণির বিষয় গ্রুপ`
      : langCode === "ar"
      ? `مجموعة مواد الصف ${numLoc}`
      : `कक्षा ${numLoc} विषय समूह`;
  }

  return trimmed;
}


/**
 * Translates academic exam titles and groups based on active language code.
 */
export function translateExamName(name?: string | null, langCode: string = "en"): string {
  if (!name) return "";
  if (langCode === "en") return name;

  let result = name;
  if (langCode === "bn") {
    result = result
      .replace(/Online Exam/gi, "অনলাইন পরীক্ষা")
      .replace(/General Exam/gi, "সাধারণ পরীক্ষা")
      .replace(/Month Test|Monthly Test/gi, "মাসিক পরীক্ষা")
      .replace(/First Term Exam|1st Term Exam/gi, "১ম সাময়িক পরীক্ষা")
      .replace(/Second Term Exam|2nd Term Exam/gi, "২য় সাময়িক পরীক্ষা")
      .replace(/Final Exam|Annual Exam/gi, "বার্ষিক পরীক্ষা")
      .replace(/Pass\s*\/\s*Fail/gi, "পাস / ফেল")
      .replace(/Pass/gi, "পাস")
      .replace(/Fail/gi, "ফেল");
  } else if (langCode === "ar") {
    result = result
      .replace(/Online Exam/gi, "امتحان عبر الإنترنت")
      .replace(/General Exam/gi, "امتحان عام")
      .replace(/Month Test|Monthly Test/gi, "اختبار شهري")
      .replace(/First Term Exam|1st Term Exam/gi, "امتحان الفصل الأول")
      .replace(/Second Term Exam|2nd Term Exam/gi, "امتحان الفصل الثاني")
      .replace(/Final Exam|Annual Exam/gi, "الامتحان النهائي")
      .replace(/Pass\s*\/\s*Fail/gi, "ناجح / راسب")
      .replace(/Pass/gi, "ناجح")
      .replace(/Fail/gi, "راسب");
  } else if (langCode === "hi") {
    result = result
      .replace(/Online Exam/gi, "ऑनलाइन परीक्षा")
      .replace(/General Exam/gi, "सामान्य परीक्षा")
      .replace(/Month Test|Monthly Test/gi, "मासिक परीक्षा")
      .replace(/First Term Exam|1st Term Exam/gi, "प्रथम सत्र परीक्षा")
      .replace(/Second Term Exam|2nd Term Exam/gi, "द्वितीय सत्र परीक्षा")
      .replace(/Final Exam|Annual Exam/gi, "वार्षिक परीक्षा")
      .replace(/Pass\s*\/\s*Fail/gi, "पास / फेल")
      .replace(/Pass/gi, "पास")
      .replace(/Fail/gi, "फेल");
  }

  // Also replace month names inside the title
  const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  for (const m of months) {
    const reg = new RegExp(`\\b${m}\\b`, "gi");
    if (reg.test(result)) {
      result = result.replace(reg, translateMonthName(m, langCode));
    }
  }

  // Also convert any 4-digit or other years/digits
  return result.replace(/\d+/g, (digitStr) => toLocaleNumber(digitStr, langCode));
}


/**
 * Translates Fee Group and Fee Type names (including Month-based fee names like "December Month Fees").
 */
export function translateFeeItemName(name?: string | null, langCode: string = "en"): string {
  if (!name) return "";
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  // 1. Month-based fee names: "December Month Fees", "December Fee", "January Month", etc.
  const monthMatch = lower.match(/^(january|february|march|april|may|june|july|august|september|october|november|december)\s*(?:month)?\s*(?:fees|fee)?$/i);
  if (monthMatch) {
    const month = monthMatch[1].toLowerCase();
    if (langCode === "bn") {
      const bnMonths: Record<string, string> = {
        january: "জানুয়ারি",
        february: "ফেব্রুয়ারি",
        march: "মার্চ",
        april: "এপ্রিল",
        may: "মে",
        june: "জুন",
        july: "জুলাই",
        august: "আগস্ট",
        september: "সেপ্টেম্বর",
        october: "অক্টোবর",
        november: "নভেম্বর",
        december: "ডিসেম্বর",
      };
      return `${bnMonths[month]} মাসের ফি`;
    }
    if (langCode === "ar") {
      const arMonths: Record<string, string> = {
        january: "يناير",
        february: "فبراير",
        march: "مارس",
        april: "أبريل",
        may: "مايو",
        june: "يونيو",
        july: "يوليو",
        august: "أغسطس",
        september: "سبتمبر",
        october: "أكتوبر",
        november: "نوفمبر",
        december: "ديسمبر",
      };
      return `رسوم شهر ${arMonths[month]}`;
    }
    if (langCode === "hi") {
      const hiMonths: Record<string, string> = {
        january: "जनवरी",
        february: "फरवरी",
        march: "मार्च",
        april: "अप्रैल",
        may: "मई",
        june: "जून",
        july: "जुलाई",
        august: "अगस्त",
        september: "सितंबर",
        october: "अक्टूबर",
        november: "नवंबर",
        december: "दिसंबर",
      };
      return `${hiMonths[month]} माह का शुल्क`;
    }
  }

  // 2. Common general fee categories
  if (langCode === "bn") {
    const bnFeeMap: Record<string, string> = {
      "admission fees": "ভর্তি ফি",
      "admission fee": "ভর্তি ফি",
      "tuition fees": "টিউশন ফি",
      "tuition fee": "টিউশন ফি",
      "monthly fees": "মাসিক ফি",
      "monthly fee": "মাসিক ফি",
      "exam fees": "পরীক্ষার ফি",
      "exam fee": "পরীক্ষার ফি",
      "examination fees": "পরীক্ষার ফি",
      "library fees": "লাইব্রেরি ফি",
      "library fee": "লাইব্রেরি ফি",
      "transport fees": "পরিবহন ফি",
      "transport fee": "পরিবহন ফি",
      "hostel fees": "হোস্টেল ফি",
      "hostel fee": "হোস্টেল ফি",
      "sports fees": "খেলাধুলা ফি",
      "sports fee": "খেলাধুলা ফি",
      "laboratory fees": "ল্যাবরেটরি ফি",
      "lab fees": "ল্যাবরেটরি ফি",
      "lab fee": "ল্যাবরেটরি ফি",
      "development fees": "উন্নয়ন ফি",
      "development fee": "উন্নয়ন ফি",
      "annual fees": "বার্ষিক ফি",
      "annual fee": "বার্ষিক ফি",
      "registration fees": "নিবন্ধন ফি",
      "registration fee": "নিবন্ধন ফি",
      "general payment": "সাধারণ ফি",
    };
    if (bnFeeMap[lower]) return bnFeeMap[lower];
  }

  if (langCode === "ar") {
    const arFeeMap: Record<string, string> = {
      "admission fees": "رسوم القبول",
      "admission fee": "رسوم القبول",
      "tuition fees": "الرسوم الدراسية",
      "tuition fee": "الرسوم الدراسية",
      "monthly fees": "الرسوم الشهرية",
      "monthly fee": "الرسوم الشهرية",
      "exam fees": "رسوم الامتحان",
      "exam fee": "رسوم الامتحان",
      "examination fees": "رسوم الامتحان",
      "library fees": "رسوم المكتبة",
      "library fee": "رسوم المكتبة",
      "transport fees": "رسوم النقل",
      "transport fee": "رسوم النقل",
      "hostel fees": "رسوم السكن",
      "hostel fee": "رسوم السكن",
      "sports fees": "رسوم الأنشطة الرياضية",
      "sports fee": "رسوم الأنشطة الرياضية",
      "laboratory fees": "رسوم المختبر",
      "lab fees": "رسوم المختبر",
      "lab fee": "رسوم المختبر",
      "development fees": "رسوم التطوير",
      "development fee": "رسوم التطوير",
      "annual fees": "الرسوم السنوية",
      "annual fee": "الرسوم السنوية",
      "registration fees": "رسوم التسجيل",
      "registration fee": "رسوم التسجيل",
      "general payment": "دفع عام",
    };
    if (arFeeMap[lower]) return arFeeMap[lower];
  }

  if (langCode === "hi") {
    const hiFeeMap: Record<string, string> = {
      "admission fees": "प्रवेश शुल्क",
      "admission fee": "प्रवेश शुल्क",
      "tuition fees": "शिक्षण शुल्क",
      "tuition fee": "शिक्षण शुल्क",
      "monthly fees": "मासिक शुल्क",
      "monthly fee": "मासिक शुल्क",
      "exam fees": "परीक्षा शुल्क",
      "exam fee": "परीक्षा शुल्क",
      "examination fees": "परीक्षा शुल्क",
      "library fees": "पुस्तकालय शुल्क",
      "library fee": "पुस्तकालय शुल्क",
      "transport fees": "परिवहन शुल्क",
      "transport fee": "परिवहन शुल्क",
      "hostel fees": "छात्रावास शुल्क",
      "hostel fee": "छात्रावास शुल्क",
      "sports fees": "खेल शुल्क",
      "sports fee": "खेल शुल्क",
      "laboratory fees": "प्रयोगशाला शुल्क",
      "lab fees": "प्रयोगशाला शुल्क",
      "lab fee": "प्रयोगशाला शुल्क",
      "development fees": "विकास शुल्क",
      "development fee": "विकास शुल्क",
      "annual fees": "वार्षिक शुल्क",
      "annual fee": "वार्षिक शुल्क",
      "registration fees": "पंजीकरण शुल्क",
      "registration fee": "पंजीकरण शुल्क",
      "general payment": "सामान्य भुगतान",
    };
    if (hiFeeMap[lower]) return hiFeeMap[lower];
  }

  return trimmed;
}

/**
 * Translates notification event names into Bengali ('bn'), Arabic ('ar'), Hindi ('hi'), or English ('en').
 */
export function translateNotificationEvent(name?: string | null, langCode: string = "en"): string {
  if (!name) return "";
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    const bnEventMap: Record<string, string> = {
      "salary generated": "বেতন তৈরি",
      "salary paid": "বেতন পরিশোধ",
      "online admission fees submission": "অনলাইন ভর্তি ফি জমা",
      "online admission fees processing": "অনলাইন ভর্তি ফি প্রক্রিয়াধীন",
      "online admission form submission": "অনলাইন ভর্তি ফর্ম জমা",
      "student admission": "শিক্ষার্থী ভর্তি",
      "behaviour incident assigned": "আচরণ সংক্রান্ত ঘটনা বরাদ্দ",
      "cbse exam result": "সিবিএসই পরীক্ষার ফলাফল",
      "cbse exam marksheet pdf": "সিবিএসই পরীক্ষার নম্বরপত্র পিডিএফ",
      "email pdf exam marksheet": "ইমেইলে পরীক্ষার নম্বরপত্র পিডিএফ",
      "exam result published": "পরীক্ষার ফলাফল প্রকাশিত",
      "online course guest user sign up": "অনলাইন কোর্সে অতিথি ব্যবহারকারী সাইন আপ",
      "online course purchase for guest user": "অতিথি ব্যবহারকারীর অনলাইন কোর্স ক্রয়",
      "online course purchase": "অনলাইন কোর্স ক্রয়",
      "online course publish": "অনলাইন কোর্স প্রকাশ",
      "student apply leave": "শিক্ষার্থীর ছুটির আবেদন",
      "student leave approved": "শিক্ষার্থীর ছুটি অনুমোদিত",
      "student leave rejected": "শিক্ষার্থীর ছুটি বাতিল",
      "fee processing": "ফি প্রক্রিয়াধীন",
      "fee submission": "ফি জমা",
      "fees reminder": "ফি রিমাইন্ডার",
      "staff login credential": "কর্মচারীর লগইন তথ্য",
      "student login credential": "শিক্ষার্থীর লগইন তথ্য",
      "forgot password": "পাসওয়ার্ড ভুলে গেছেন",
      "student present attendance": "শিক্ষার্থী উপস্থিতির নোটিফিকেশন",
      "student absent attendance": "শিক্ষার্থী অনুপস্থিতির নোটিফিকেশন",
      "staff present attendance": "কর্মচারী উপস্থিতির নোটিফিকেশন",
      "staff absent attendance": "কর্মচারী অনুপস্থিতির নোটিফিকেশন",
      "homework created": "হোমওয়ার্ক তৈরি হয়েছে",
      "homework evaluation": "হোমওয়ার্ক মূল্যায়ন",
      "gmeet live meeting": "জিমিট লাইভ মিটিং",
      "gmeet live meeting start": "জিমিট লাইভ মিটিং শুরু",
      "gmeet live classes": "জিমিট লাইভ ক্লাস",
      "gmeet live classes start": "জিমিট লাইভ ক্লাস শুরু",
      "zoom live meeting": "জুম লাইভ মিটিং",
      "zoom live meeting start": "জুম লাইভ মিটিং শুরু",
      "zoom live classes": "জুম লাইভ ক্লাস",
      "zoom live classes start": "জুম লাইভ ক্লাস শুরু",
      "online examination publish exam": "অনলাইন পরীক্ষা প্রকাশ",
      "online examination publish result": "অনলাইন পরীক্ষার ফলাফল প্রকাশ",
      "book issued": "বই প্রদান (ইস্যু)",
      "book returned": "বই ফেরত",
    };
    if (bnEventMap[lower]) return bnEventMap[lower];
  }

  if (langCode === "ar") {
    const arEventMap: Record<string, string> = {
      "salary generated": "إنشاء الراتب",
      "salary paid": "دفع الراتب",
      "online admission fees submission": "تقديم رسوم القبول عبر الإنترنت",
      "online admission fees processing": "معالجة رسوم القبول عبر الإنترنت",
      "online admission form submission": "تقديم استمارة القبول عبر الإنترنت",
      "student admission": "قبول الطالب",
      "behaviour incident assigned": "تعيين حادثة سلوكية",
      "cbse exam result": "نتيجة اختبار CBSE",
      "cbse exam marksheet pdf": "كشف درجات اختبار CBSE بصيغة PDF",
      "email pdf exam marksheet": "إرسال كشف الدرجات PDF عبر البريد",
      "exam result published": "نشر نتائج الامتحان",
      "online course guest user sign up": "تسجيل مستخدم ضيف في دورة عبر الإنترنت",
      "online course purchase for guest user": "شراء دورة عبر الإنترنت للمستخدم الضيف",
      "online course purchase": "شراء دورة عبر الإنترنت",
      "online course publish": "نشر دورة عبر الإنترنت",
      "student apply leave": "طلب إجازة طالب",
      "student leave approved": "الموافقة على إجازة الطالب",
      "student leave rejected": "رفض إجازة الطالب",
      "fee processing": "معالجة الرسوم",
      "fee submission": "سداد الرسوم",
      "fees reminder": "تذكير بالرسوم",
      "staff login credential": "بيانات تسجيل دخول الموظف",
      "student login credential": "بيانات تسجيل دخول الطالب",
      "forgot password": "نسيت كلمة المرور",
      "student present attendance": "إشعار حضور الطالب",
      "student absent attendance": "إشعار غياب الطالب",
      "staff present attendance": "إشعار حضور الموظف",
      "staff absent attendance": "إشعار غياب الموظف",
      "homework created": "تم إنشاء واجب منزلي",
      "homework evaluation": "تقييم الواجب المنزلي",
      "gmeet live meeting": "اجتماع مباشر عبر Gmeet",
      "gmeet live meeting start": "بدء اجتماع مباشر عبر Gmeet",
      "gmeet live classes": "حصص مباشرة عبر Gmeet",
      "gmeet live classes start": "بدء حصة مباشرة عبر Gmeet",
      "zoom live meeting": "اجتماع مباشر عبر Zoom",
      "zoom live meeting start": "بدء اجتماع مباشر عبر Zoom",
      "zoom live classes": "حصص مباشرة عبر Zoom",
      "zoom live classes start": "بدء حصة مباشرة عبر Zoom",
      "online examination publish exam": "نشر امتحان عبر الإنترنت",
      "online examination publish result": "نشر نتائج الامتحان عبر الإنترنت",
      "book issued": "إعارة كتاب",
      "book returned": "إرجاع كتاب",
    };
    if (arEventMap[lower]) return arEventMap[lower];
  }

  if (langCode === "hi") {
    const hiEventMap: Record<string, string> = {
      "salary generated": "वेतन उत्पन्न",
      "salary paid": "वेतन भुगतान",
      "online admission fees submission": "ऑनलाइन प्रवेश शुल्क जमा",
      "online admission fees processing": "ऑनलाइन प्रवेश शुल्क प्रसंस्करण",
      "online admission form submission": "ऑनलाइन प्रवेश फॉर्म जमा",
      "student admission": "छात्र प्रवेश",
      "behaviour incident assigned": "व्यवहार घटना आवंटित",
      "cbse exam result": "सीबीएसई परीक्षा परिणाम",
      "cbse exam marksheet pdf": "सीबीएसई परीक्षा अंकतालिका पीडीएफ",
      "email pdf exam marksheet": "ईमेल पीडीएफ परीक्षा अंकतालिका",
      "exam result published": "परीक्षा परिणाम प्रकाशित",
      "online course guest user sign up": "ऑनलाइन कोर्स अतिथि उपयोगकर्ता साइन अप",
      "online course purchase for guest user": "अतिथि उपयोगकर्ता के लिए ऑनलाइन कोर्स खरीद",
      "online course purchase": "ऑनलाइन कोर्स खरीद",
      "online course publish": "ऑनलाइन कोर्स प्रकाशित",
      "student apply leave": "छात्र द्वारा छुट्टी का आवेदन",
      "student leave approved": "छात्र की छुट्टी स्वीकृत",
      "student leave rejected": "छात्र की छुट्टी अस्वीकृत",
      "fee processing": "शुल्क प्रसंस्करण",
      "fee submission": "शुल्क जमा",
      "fees reminder": "शुल्क अनुस्मारक",
      "staff login credential": "कर्मचारी लॉगिन क्रेडेंशियल",
      "student login credential": "छात्र लॉगिन क्रेडेंशियल",
      "forgot password": "पासवर्ड भूल गए",
      "student present attendance": "छात्र उपस्थिति",
      "student absent attendance": "छात्र अनुपस्थिति",
      "staff present attendance": "कर्मचारी उपस्थिति",
      "staff absent attendance": "कर्मचारी अनुपस्थिति",
      "homework created": "गृहकार्य बनाया गया",
      "homework evaluation": "गृहकार्य मूल्यांकन",
      "gmeet live meeting": "जीमीट लाइव मीटिंग",
      "gmeet live meeting start": "जीमीट लाइव मीटिंग प्रारंभ",
      "gmeet live classes": "जीमीট लाइव कक्षाएं",
      "gmeet live classes start": "जीमीट लाइव कक्षाएं प्रारंभ",
      "zoom live meeting": "ज़ूम लाइव मीटिंग",
      "zoom live meeting start": "ज़ूम लाइव मीटिंग प्रारंभ",
      "zoom live classes": "ज़ूम लाइव कक्षाएं",
      "zoom live classes start": "ज़ूम लाइव कक्षाएं प्रारंभ",
      "online examination publish exam": "ऑनलाइन परीक्षा प्रकाशित",
      "online examination publish result": "ऑनलाइन परीक्षा परिणाम प्रकाशित",
      "book issued": "पुस्तक जारी की गई",
      "book returned": "पुस्तक वापस की गई",
    };
    if (hiEventMap[lower]) return hiEventMap[lower];
  }

  return trimmed;
}

/**
 * Translates system roles (Super Admin, Admin, Teacher, Accountant, Librarian, Receptionist, etc.)
 */
export function translateRoleName(role: string, langCode?: string): string {
  if (!role) return "";
  const trimmed = role.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    const bnMap: Record<string, string> = {
      "super admin": "সুপার অ্যাডমিন",
      "admin": "অ্যাডমিন",
      "branch admin": "শাখা অ্যাডমিন",
      "branch manager": "শাখা ব্যবস্থাপক",
      "teacher": "শিক্ষক",
      "assistant teacher": "সহকারী শিক্ষক",
      "principal": "অধ্যক্ষ",
      "vice principal": "উপাধ্যক্ষ",
      "headmaster": "প্রধান শিক্ষক",
      "accountant": "হিসাবরক্ষক",
      "librarian": "গ্রন্থাগারিক",
      "receptionist": "অভ্যর্থনাকারী",
      "student": "শিক্ষার্থী",
      "parent": "অভিভাবক",
      "guardian": "অভিভাবক",
      "staff": "কর্মী / স্টাফ",
      "driver": "চালক",
      "peon": "পিয়ন",
      "security guard": "নিরাপত্তা প্রহরী",
      "cleaner": "পরিচ্ছন্নতাকর্মী",
      "clerk": "করণিক",
      "manager": "ব্যবস্থাপক",
      "coordinator": "সমন্বয়ক",
      "guest": "অতিথি",
    };
    if (bnMap[lower]) return bnMap[lower];
  }

  if (langCode === "ar") {
    const arMap: Record<string, string> = {
      "super admin": "المسؤول العام",
      "admin": "المسؤول",
      "branch admin": "مسؤول الفرع",
      "branch manager": "مدير الفرع",
      "teacher": "المعلم",
      "assistant teacher": "معلم مساعد",
      "principal": "المدير",
      "vice principal": "نائب المدير",
      "headmaster": "ناظر المدرسة",
      "accountant": "المحاسب",
      "librarian": "أمين المكتبة",
      "receptionist": "موظف الاستقبال",
      "student": "طالب",
      "parent": "ولي الأمر",
      "guardian": "ولي الأمر",
      "staff": "الموظفون",
      "driver": "سائق",
      "peon": "مستخدم",
      "security guard": "حارس أمن",
      "cleaner": "عامل نظافة",
      "clerk": "كاتب",
      "manager": "مدير",
      "coordinator": "منسق",
      "guest": "ضيف",
    };
    if (arMap[lower]) return arMap[lower];
  }

  if (langCode === "hi") {
    const hiMap: Record<string, string> = {
      "super admin": "सुपर एडमिन",
      "admin": "व्यवस्थापक (एडमिन)",
      "branch admin": "शाखा व्यवस्थापक",
      "branch manager": "शाखा प्रबंधक",
      "teacher": "शिक्षक",
      "assistant teacher": "सहायक शिक्षक",
      "principal": "प्रधानाचार्य",
      "vice principal": "उप-प्रधानाचार्य",
      "headmaster": "प्रधानाध्यापक",
      "accountant": "लेखाकार",
      "librarian": "पुस्तकालय अध्यक्ष",
      "receptionist": "रिसेप्शनिस्ट",
      "student": "छात्र",
      "parent": "अभिभावक",
      "guardian": "अभिभावक",
      "staff": "कर्मचारी",
      "driver": "चालक",
      "peon": "चपरासी",
      "security guard": "सुरक्षा गार्ड",
      "cleaner": "सफाई कर्मचारी",
      "clerk": "लिपिक (क्लर्क)",
      "manager": "प्रबंधक",
      "coordinator": "समन्वयक",
      "guest": "अतिथि",
    };
    if (hiMap[lower]) return hiMap[lower];
  }

  return trimmed;
}

/**
 * Translates standard language names (English, Bengali, Arabic, Hindi, etc.) based on active language code.
 */

/**
 * Translates academic and school department names across supported languages.
 */
export function translateDepartmentName(name?: string | null, langCode: string = "en"): string {
  if (!name) return "";
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    const bnMap: Record<string, string> = {
      "management": "ব্যবস্থাপনা",
      "academic": "একাডেমিক",
      "academics": "একাডেমিক",
      "sports": "খেলাধুলা ও শরীরচর্চা",
      "library": "গ্রন্থাগার",
      "finance": "অর্থ ও হিসাব",
      "accounts": "হিসাব বিভাগ",
      "accounts & finance": "হিসাব ও অর্থ",
      "commerce": "বাণিজ্য",
      "arts": "মানবিক",
      "science": "বিজ্ঞান",
      "admin": "প্রশাসন",
      "administration": "প্রশাসন",
      "it": "তথ্য প্রযুক্তি",
      "it & technical": "আইটি ও কারিগরি",
      "technical": "কারিগরি",
      "operations & maintenance": "অপারেশন ও রক্ষণাবেক্ষণ",
      "support staff": "সহায়ক কর্মী",
      "human resource": "মানব সম্পদ",
      "hr": "মানব সম্পদ",
      "transport": "পরিবহন",
      "security": "নিরাপত্তা"
    };
    if (bnMap[lower]) return bnMap[lower];
  }

  if (langCode === "ar") {
    const arMap: Record<string, string> = {
      "management": "الإدارة",
      "academic": "الشؤون الأكاديمية",
      "academics": "الشؤون الأكاديمية",
      "sports": "التربية الرياضية",
      "library": "المكتبة",
      "finance": "الشؤون المالية",
      "accounts": "الحسابات",
      "accounts & finance": "الحسابات والمالية",
      "commerce": "التجارة",
      "arts": "الآداب والعلوم الإنسانية",
      "science": "العلوم",
      "admin": "الإدارة العامة",
      "administration": "الإدارة العامة",
      "it": "تقنية المعلومات",
      "it & technical": "تقنية المعلومات والجانب التقني",
      "technical": "القسم التقني",
      "operations & maintenance": "العمليات والصيانة",
      "support staff": "طاقم الدعم المساند",
      "human resource": "الموارد البشرية",
      "hr": "الموارد البشرية",
      "transport": "النقل والمواصلات",
      "security": "الأمن والسلامة"
    };
    if (arMap[lower]) return arMap[lower];
  }

  if (langCode === "hi") {
    const hiMap: Record<string, string> = {
      "management": "प्रबंधन",
      "academic": "अकादमिक",
      "academics": "अकादमिक",
      "sports": "खेलकूद",
      "library": "पुस्तकालय",
      "finance": "वित्त",
      "accounts": "लेखा विभाग",
      "accounts & finance": "लेखा और वित्त",
      "commerce": "वाणिज्य",
      "arts": "कला (मानविकी)",
      "science": "विज्ञान",
      "admin": "प्रशासन",
      "administration": "प्रशासन",
      "it": "सूचना प्रौद्योगिकी (आईटी)",
      "it & technical": "आईटी और तकनीकी",
      "technical": "तकनीकी विभाग",
      "operations & maintenance": "संचालन और रखरखाव",
      "support staff": "सहायक कर्मचारी",
      "human resource": "मानव संसाधन",
      "hr": "मानव संसाधन",
      "transport": "परिवहन",
      "security": "सुरक्षा"
    };
    if (hiMap[lower]) return hiMap[lower];
  }

  return trimmed;
}

/**
 * Translates staff designation titles across supported languages.
 */
export function translateDesignationName(name?: string | null, langCode: string = "en"): string {
  if (!name) return "";
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    const bnMap: Record<string, string> = {
      "faculty": "অনুষদ / শিক্ষক মণ্ডলী",
      "accountant": "হিসাবরক্ষক",
      "admin": "অ্যাডমিন",
      "administrator": "প্রশাসক",
      "receptionist": "অভ্যর্থনাকারী",
      "principal": "অধ্যক্ষ",
      "vice principal": "উপাধ্যক্ষ",
      "director": "পরিচালক",
      "librarian": "গ্রন্থাগারিক",
      "technical head": "কারিগরি প্রধান",
      "headmaster": "প্রধান শিক্ষক",
      "assistant teacher": "সহকারী শিক্ষক",
      "senior teacher": "সিনিয়র শিক্ষক",
      "lecturer": "প্রভাষক",
      "subject teacher": "বিষয় শিক্ষক",
      "driver": "চালক",
      "security guard": "নিরাপত্তা প্রহরী",
      "cleaner": "পরিচ্ছন্নতাকর্মী",
      "peon": "পিয়ন / অফিস সহায়ক",
      "office assistant": "অফিস সহকারী",
      "lab assistant": "ল্যাব সহকারী"
    };
    if (bnMap[lower]) return bnMap[lower];
  }

  if (langCode === "ar") {
    const arMap: Record<string, string> = {
      "faculty": "عضو هيئة تدريس",
      "accountant": "محاسب",
      "admin": "مسؤول",
      "administrator": "مسؤول إداري",
      "receptionist": "موظف استقبال",
      "principal": "المدير العام",
      "vice principal": "نائب المدير",
      "director": "مدير تنفيذي",
      "librarian": "أمين مكتبة",
      "technical head": "رئيس القسم التقني",
      "headmaster": "ناظر المدرسة",
      "assistant teacher": "معلم مساعد",
      "senior teacher": "معلم أول",
      "lecturer": "محاضر",
      "subject teacher": "معلم مادة",
      "driver": "سائق",
      "security guard": "حارس أمن",
      "cleaner": "عامل نظافة",
      "peon": "مستخدم",
      "office assistant": "مساعد إداري",
      "lab assistant": "فني مختبر"
    };
    if (arMap[lower]) return arMap[lower];
  }

  if (langCode === "hi") {
    const hiMap: Record<string, string> = {
      "faculty": "संकाय (शिक्षक)",
      "accountant": "लेखाकार",
      "admin": "व्यवस्थापक",
      "administrator": "प्रशासक",
      "receptionist": "रिसेप्शनिस्ट",
      "principal": "प्रधानाचार्य",
      "vice principal": "उप-प्रधानाचार्य",
      "director": "निदेशक",
      "librarian": "पुस्तकालय अध्यक्ष",
      "technical head": "तकनीकी प्रमुख",
      "headmaster": "प्रधानाध्यापक",
      "assistant teacher": "सहायक शिक्षक",
      "senior teacher": "वरिष्ठ शिक्षक",
      "lecturer": "व्याख्याता",
      "subject teacher": "विषय शिक्षक",
      "driver": "चालक",
      "security guard": "सुरक्षा गार्ड",
      "cleaner": "सफाई कर्मचारी",
      "peon": "चपरासी",
      "office assistant": "कार्यालय सहायक",
      "lab assistant": "प्रयोगशाला सहायक"
    };
    if (hiMap[lower]) return hiMap[lower];
  }

  return trimmed;
}

/**
 * Translates leave type names across supported languages.
 */
export function translateLeaveTypeName(name?: string | null, langCode: string = "en"): string {
  if (!name) return "";
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    const bnMap: Record<string, string> = {
      "sick leave": "অসুস্থতাজনিত ছুটি",
      "medical leave": "চিকিৎসাজনিত ছুটি",
      "casual leave": "নৈমিত্তিক ছুটি",
      "maternity leave": "মাতৃত্বকালীন ছুটি",
      "paternity leave": "পিতৃত্বকালীন ছুটি",
      "earned leave": "অর্জিত ছুটি",
      "annual leave": "বার্ষিক ছুটি",
      "unpaid leave": "অবৈতনিক ছুটি",
      "leave without pay": "বিনা বেতনে ছুটি",
      "half day": "অর্ধ দিবস ছুটি",
      "half day leave": "অর্ধ দিবস ছুটি"
    };
    if (bnMap[lower]) return bnMap[lower];
  }

  if (langCode === "ar") {
    const arMap: Record<string, string> = {
      "sick leave": "إجازة مرضية",
      "medical leave": "إجازة طبية",
      "casual leave": "إجازة عارضة",
      "maternity leave": "إجازة أمومة",
      "paternity leave": "إجازة أبوة",
      "earned leave": "إجازة مكتسبة",
      "annual leave": "إجازة سنوية",
      "unpaid leave": "إجازة بدون راتب",
      "leave without pay": "إجازة غير مدفوعة",
      "half day": "إجازة نصف يوم",
      "half day leave": "إجازة نصف يوم"
    };
    if (arMap[lower]) return arMap[lower];
  }

  if (langCode === "hi") {
    const hiMap: Record<string, string> = {
      "sick leave": "बीमारी की छुट्टी",
      "medical leave": "चिकित्सा अवकाश",
      "casual leave": "आकस्मिक अवकाश",
      "maternity leave": "मातृत्व अवकाश",
      "paternity leave": "पितृत्व अवकाश",
      "earned leave": "अर्जित अवकाश",
      "annual leave": "वार्षिक अवकाश",
      "unpaid leave": "अवैतनिक अवकाश",
      "leave without pay": "बिना वेतन अवकाश",
      "half day": "आधे दिन की छुट्टी",
      "half day leave": "आधे दिन का अवकाश"
    };
    if (hiMap[lower]) return hiMap[lower];
  }

  return trimmed;
}

/**
 * Translates half day options ("First Half", "Second Half", etc.) across supported languages.
 */
export function translateHalfDay(val?: string | null, langCode: string = "en"): string {
  if (!val) return "";
  const trimmed = val.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    if (lower === "first half" || lower === "first_half") return "অর্ধদিবস (প্রথম ভাগ)";
    if (lower === "second half" || lower === "second_half") return "অর্ধদিবস (দ্বিতীয় ভাগ)";
    if (lower === "no") return "না";
    if (lower === "yes") return "হ্যাঁ";
  }

  if (langCode === "ar") {
    if (lower === "first half" || lower === "first_half") return "نصف يوم (النصف الأول)";
    if (lower === "second half" || lower === "second_half") return "نصف يوم (النصف الثاني)";
    if (lower === "no") return "لا";
    if (lower === "yes") return "نعم";
  }

  if (langCode === "hi") {
    if (lower === "first half" || lower === "first_half") return "आधा दिन (पहला भाग)";
    if (lower === "second half" || lower === "second_half") return "आधा दिन (दूसरा भाग)";
    if (lower === "no") return "नहीं";
    if (lower === "yes") return "हाँ";
  }

  if (lower === "first half" || lower === "first_half") return "Half Day First Half";
  if (lower === "second half" || lower === "second_half") return "Half Day Second Half";
  return trimmed;
}

/**
 * Translates leave request status across supported languages.
 */
export function translateLeaveStatus(status?: string | null, langCode: string = "en"): string {
  if (!status) return "";
  const trimmed = status.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    if (lower === "pending") return "বিবেচনাধীন";
    if (lower === "approved") return "অনুমোদিত";
    if (lower === "disapproved" || lower === "rejected") return "প্রত্যাখ্যাত";
  }

  if (langCode === "ar") {
    if (lower === "pending") return "قيد الانتظار";
    if (lower === "approved") return "معتمد";
    if (lower === "disapproved" || lower === "rejected") return "مرفوض";
  }

  if (langCode === "hi") {
    if (lower === "pending") return "लंबित";
    if (lower === "approved") return "स्वीकृत";
    if (lower === "disapproved" || lower === "rejected") return "अस्वीकृत";
  }

  if (lower === "pending") return "Pending";
  if (lower === "approved") return "Approved";
  if (lower === "disapproved" || lower === "rejected") return "Disapproved";
  return trimmed;
}

export function translateLanguageName(name?: string | null, langCode: string = "en"): string {
  if (!name) return "";
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    const bnMap: Record<string, string> = {
      "english": "ইংরেজি",
      "bengali": "বাংলা",
      "bangla": "বাংলা",
      "arabic": "আরবি",
      "hindi": "হিন্দি",
      "urdu": "উর্দু",
      "spanish": "স্প্যানিশ",
      "french": "ফরাসি",
      "german": "জার্মান",
      "chinese": "চীনা",
      "mandarin": "ম্যান্ডারিন",
      "japanese": "জাপানি",
      "russian": "রাশিয়ান",
      "turkish": "তুর্কি",
      "portuguese": "পর্তুগিজ",
      "italian": "ইতালীয়",
      "persian": "ফার্সি",
      "farsi": "ফার্সি",
    };
    if (bnMap[lower]) return bnMap[lower];
  }

  if (langCode === "ar") {
    const arMap: Record<string, string> = {
      "english": "الإنجليزية",
      "bengali": "البنغالية",
      "bangla": "البنغالية",
      "arabic": "العربية",
      "hindi": "الهندية",
      "urdu": "الأردية",
      "spanish": "الإسبانية",
      "french": "الفرنسية",
      "german": "الألمانية",
      "chinese": "الصينية",
      "mandarin": "الماندرين",
      "japanese": "اليابانية",
      "russian": "الروسية",
      "turkish": "التركية",
      "portuguese": "البرتغالية",
      "italian": "الإيطالية",
      "persian": "الفارسية",
      "farsi": "الفارسية",
    };
    if (arMap[lower]) return arMap[lower];
  }

  if (langCode === "hi") {
    const hiMap: Record<string, string> = {
      "english": "अंग्रेज़ी",
      "bengali": "बंगाली",
      "bangla": "बंगाली",
      "arabic": "अरबी",
      "hindi": "हिन्दी",
      "urdu": "उर्दू",
      "spanish": "स्पैनिश",
      "french": "फ्रेंच",
      "german": "जर्मन",
      "chinese": "चीनी",
      "mandarin": "मंदारिन",
      "japanese": "जापानी",
      "russian": "रूसी",
      "turkish": "तुर्की",
      "portuguese": "पुर्तगाली",
      "italian": "इतालवी",
      "persian": "फ़ारसी",
      "farsi": "फ़ारसी",
    };
    if (hiMap[lower]) return hiMap[lower];
  }

  return trimmed;
}

/**
 * Translates staff designations (Admin, Principal, Teacher, Lecturer, Management, etc.)
 */
export function translateDesignation(designation?: string | null, langCode?: string): string {
  if (!designation) return "";
  const trimmed = designation.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    const bnMap: Record<string, string> = {
      "admin": "অ্যাডমিন",
      "administrator": "প্রশাসক",
      "super admin": "সুপার অ্যাডমিন",
      "branch admin": "শাখা অ্যাডমিন",
      "principal": "অধ্যক্ষ",
      "vice principal": "উপাধ্যক্ষ",
      "headmaster": "প্রধান শিক্ষক",
      "head master": "প্রধান শিক্ষক",
      "assistant headmaster": "সহকারী প্রধান শিক্ষক",
      "teacher": "শিক্ষক",
      "senior teacher": "সিনিয়র শিক্ষক",
      "assistant teacher": "সহকারী শিক্ষক",
      "lecturer": "প্রভাষক",
      "professor": "অধ্যাপক",
      "assistant professor": "সহকারী অধ্যাপক",
      "accountant": "হিসাবরক্ষক",
      "senior accountant": "সিনিয়র হিসাবরক্ষক",
      "librarian": "গ্রন্থাগারিক",
      "assistant librarian": "সহকারী গ্রন্থাগারিক",
      "clerk": "করণিক",
      "office assistant": "অফিস সহকারী",
      "receptionist": "অভ্যর্থনাকারী",
      "driver": "চালক",
      "peon": "পিয়ন",
      "guard": "নিরাপত্তা প্রহরী",
      "security guard": "নিরাপত্তা প্রহরী",
      "cleaner": "পরিচ্ছন্নতাকর্মী",
      "maid": "আয়া / পরিচ্ছন্নতাকর্মী",
      "lab assistant": "ল্যাব সহকারী",
      "it officer": "আইটি কর্মকর্তা",
      "it support": "আইটি সাপোর্ট",
      "management": "ব্যবস্থাপনা",
      "manager": "ব্যবস্থাপক",
      "coordinator": "সমন্বয়ক",
    };
    if (bnMap[lower]) return bnMap[lower];
  }

  if (langCode === "ar") {
    const arMap: Record<string, string> = {
      "admin": "المسؤول",
      "administrator": "المدير الإداري",
      "super admin": "المسؤول العام",
      "branch admin": "مسؤول الفرع",
      "principal": "المدير",
      "vice principal": "نائب المدير",
      "headmaster": "নাظر المدرسة",
      "head master": "ناظر المدرسة",
      "assistant headmaster": "مساعد ناظر المدرسة",
      "teacher": "معلم",
      "senior teacher": "معلم أول",
      "assistant teacher": "معلم مساعد",
      "lecturer": "محاضر",
      "professor": "أستاذ",
      "assistant professor": "أستاذ مساعد",
      "accountant": "محاسب",
      "senior accountant": "محاسب أول",
      "librarian": "أمين مكتبة",
      "assistant librarian": "مساعد أمين مكتبة",
      "clerk": "كاتب",
      "office assistant": "مساعد مكتب",
      "receptionist": "موظف استقبال",
      "driver": "سائق",
      "peon": "مستخدم",
      "guard": "حارس أمن",
      "security guard": "حارس أمن",
      "cleaner": "عامل نظافة",
      "maid": "عاملة نظافة",
      "lab assistant": "مساعد مختبر",
      "it officer": "مسؤول تكنولوجيا المعلومات",
      "it support": "دعم تكنولوجيا المعلومات",
      "management": "الإدارة",
      "manager": "مدير",
      "coordinator": "منسق",
    };
    if (arMap[lower]) return arMap[lower];
  }

  if (langCode === "hi") {
    const hiMap: Record<string, string> = {
      "admin": "व्यवस्थापक (एडमिन)",
      "administrator": "प्रशासक",
      "super admin": "सुपर एडमिन",
      "branch admin": "शाखा व्यवस्थापक",
      "principal": "प्रधानाचार्य",
      "vice principal": "उप-प्रधानाचार्य",
      "headmaster": "प्रधानाध्यापक",
      "head master": "प्रधानाध्यापक",
      "assistant headmaster": "सहायक प्रधानाध्यापक",
      "teacher": "शिक्षक",
      "senior teacher": "वरिष्ठ शिक्षक",
      "assistant teacher": "सहायक शिक्षक",
      "lecturer": "व्याख्याता",
      "professor": "प्रोफ़ेसर",
      "assistant professor": "सहायक प्रोफ़ेसर",
      "accountant": "लेखाकार",
      "senior accountant": "वरिष्ठ लेखाकार",
      "librarian": "पुस्तकालय अध्यक्ष",
      "assistant librarian": "सहायक पुस्तकालय अध्यक्ष",
      "clerk": "लिपिक (क्लर्क)",
      "office assistant": "कार्यालय सहायक",
      "receptionist": "रिसेप्शनिस्ट",
      "driver": "चालक",
      "peon": "चपरासी",
      "guard": "सुरक्षा गार्ड",
      "security guard": "सुरक्षा गार्ड",
      "cleaner": "सफाई कर्मचारी",
      "maid": "आया / सफाई कर्मचारी",
      "lab assistant": "प्रयोगशाला सहायक",
      "it officer": "आईटी अधिकारी",
      "it support": "आईटी सहायता",
      "management": "प्रबंधन",
      "manager": "प्रबंधक",
      "coordinator": "समन्वयक",
    };
    if (hiMap[lower]) return hiMap[lower];
  }

  return trimmed;
}

/**
 * Translates staff departments (Management, Academic, Administration, Science, etc.)
 */
export function translateDepartment(department?: string | null, langCode?: string): string {
  if (!department) return "";
  const trimmed = department.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    const bnMap: Record<string, string> = {
      "management": "ব্যবস্থাপনা",
      "admin": "প্রশাসন",
      "administration": "প্রশাসন",
      "academic": "একাডেমিক",
      "academics": "একাডেমিক",
      "accounts": "হিসাব শাখা",
      "finance": "অর্থ ও হিসাব",
      "science": "বিজ্ঞান",
      "arts": "মানবিক",
      "commerce": "ব্যবসায় শিক্ষা",
      "business studies": "ব্যবসায় শিক্ষা",
      "it": "তথ্য প্রযুক্তি (আইটি)",
      "ict": "আইসিটি",
      "library": "গ্রন্থাগার",
      "sports": "শারীরিক শিক্ষা ও ক্রীড়া",
      "transport": "পরিবহন",
      "transportation": "পরিবহন",
      "security": "নিরাপত্তা",
      "maintenance": "রক্ষণাবেক্ষণ",
      "examination": "পরীক্ষা নিয়ন্ত্রক শাখা",
      "exam": "পরীক্ষা শাখা",
    };
    if (bnMap[lower]) return bnMap[lower];
  }

  if (langCode === "ar") {
    const arMap: Record<string, string> = {
      "management": "الإدارة",
      "admin": "الإدارة",
      "administration": "الشؤون الإدارية",
      "academic": "الشؤون الأكاديمية",
      "academics": "الشؤون الأكاديمية",
      "accounts": "الحسابات",
      "finance": "المالية والحسابات",
      "science": "العلوم",
      "arts": "الآداب",
      "commerce": "التجارة",
      "business studies": "دراسات الأعمال",
      "it": "تكنولوجيا المعلومات",
      "ict": "تكنولوجيا المعلومات والاتصالات",
      "library": "المكتبة",
      "sports": "التربية البدنية والرياضة",
      "transport": "النقل والمواصلات",
      "transportation": "النقل والمواصلات",
      "security": "الأمن",
      "maintenance": "الصيانة",
      "examination": "الامتحانات",
      "exam": "شعبة الامتحانات",
    };
    if (arMap[lower]) return arMap[lower];
  }

  if (langCode === "hi") {
    const hiMap: Record<string, string> = {
      "management": "प्रबंधन",
      "admin": "प्रशासन",
      "administration": "प्रशासन",
      "academic": "अकादमिक",
      "academics": "अकादमिक",
      "accounts": "लेखा विभाग",
      "finance": "वित्त और लेखा",
      "science": "विज्ञान",
      "arts": "कला (मानविकी)",
      "commerce": "वाणिज्य",
      "business studies": "व्यावसायिक अध्ययन",
      "it": "सूचना प्रौद्योगिकी (आईटी)",
      "ict": "आईसीटी",
      "library": "पुस्तकालय",
      "sports": "खेल और शारीरिक शिक्षा",
      "transport": "परिवहन",
      "transportation": "परिवहन",
      "security": "सुरक्षा",
      "maintenance": "रखरखाव",
      "examination": "परीक्षा विभाग",
      "exam": "परीक्षा विभाग",
    };
    if (hiMap[lower]) return hiMap[lower];
  }

  return trimmed;
}

/**
 * Translates download content types (Syllabus, Assignment, Study Material, Other Downloads, etc.)
 */
export function translateContentType(type?: string | null, langCode?: string): string {
  if (!type) return "";
  const trimmed = type.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    const bnMap: Record<string, string> = {
      "syllabus": "সিলেবাস",
      "annual syllabus": "বার্ষিক সিলেবাস",
      "assignment": "অ্যাসাইনমেন্ট",
      "assignments": "অ্যাসাইনমেন্টসমূহ",
      "study material": "অধ্যয়ন সামগ্রী",
      "study materials": "অধ্যয়ন সামগ্রী",
      "exam material": "পরীক্ষার উপকরণ",
      "exam materials": "পরীক্ষার উপকরণসমূহ",
      "other download": "অন্যান্য ডাউনলোড",
      "other downloads": "অন্যান্য ডাউনলোডসমূহ",
      "question paper": "প্রশ্নপত্র",
      "routine": "রুটিন",
      "exam routine": "পরীক্ষার রুটিন",
      "notice": "বিজ্ঞপ্তি",
    };
    if (bnMap[lower]) return bnMap[lower];
  }

  if (langCode === "ar") {
    const arMap: Record<string, string> = {
      "syllabus": "المنهج الدراسي",
      "annual syllabus": "المنهج السنوي",
      "assignment": "الواجبات",
      "assignments": "الواجبات المدرسية",
      "study material": "المواد الدراسية",
      "study materials": "المواد الدراسية",
      "exam material": "مواد الامتحان",
      "exam materials": "مواد الامتحانات",
      "other download": "تنزيلات أخرى",
      "other downloads": "تنزيلات أخرى",
      "question paper": "أوراق الامتحانات",
      "routine": "الجدول الزمني",
      "exam routine": "جدول الامتحانات",
      "notice": "إشعار",
    };
    if (arMap[lower]) return arMap[lower];
  }

  if (langCode === "hi") {
    const hiMap: Record<string, string> = {
      "syllabus": "पाठ्यक्रम (सिलेबस)",
      "annual syllabus": "वार्षिक पाठ्यक्रम",
      "assignment": "असाइनमेंट",
      "assignments": "असाइनमेंट्स",
      "study material": "अध्ययन सामग्री",
      "study materials": "अध्ययन सामग्री",
      "exam material": "परीक्षा सामग्री",
      "exam materials": "परीक्षा सामग्री",
      "other download": "अन्य डाउनलोड",
      "other downloads": "अन्य डाउनलोड्स",
      "question paper": "प्रश्न पत्र",
      "routine": "समय सारणी",
      "exam routine": "परीक्षा समय सारणी",
      "notice": "सूचना",
    };
    if (hiMap[lower]) return hiMap[lower];
  }

  return trimmed;
}

/**
 * Translates recipient targets (All Students, All Teachers, Parents, Roles, Classes, etc.)
 */
export function translateSendTo(sendTo?: string | null, langCode?: string): string {
  if (!sendTo) return "";
  const parts = sendTo.split(",").map((p) => p.trim());
  const translatedParts = parts.map((part) => {
    const lower = part.toLowerCase();
    if (langCode === "bn") {
      if (lower === "all students" || lower === "students") return "সকল শিক্ষার্থী";
      if (lower === "all teachers" || lower === "teachers") return "সকল শিক্ষক";
      if (lower === "all staff" || lower === "staff") return "সকল স্টাফ";
      if (lower === "all parents" || lower === "parents" || lower === "guardians") return "সকল অভিভাবক";
    }
    if (langCode === "ar") {
      if (lower === "all students" || lower === "students") return "جميع الطلاب";
      if (lower === "all teachers" || lower === "teachers") return "جميع المعلمين";
      if (lower === "all staff" || lower === "staff") return "جميع الموظفين";
      if (lower === "all parents" || lower === "parents" || lower === "guardians") return "جميع أولياء الأمور";
    }
    if (langCode === "hi") {
      if (lower === "all students" || lower === "students") return "सभी छात्र";
      if (lower === "all teachers" || lower === "teachers") return "सभी शिक्षक";
      if (lower === "all staff" || lower === "staff") return "सभी कर्मचारी";
      if (lower === "all parents" || lower === "parents" || lower === "guardians") return "सभी अभिभावक";
    }
    const roleTranslated = translateRoleName(part, langCode);
    if (roleTranslated !== part) return roleTranslated;
    const classTranslated = translateClassName(part, langCode);
    if (classTranslated !== part) return classTranslated;
    return part;
  });
  return translatedParts.join(", ");
}

/**
 * Translates days of the week (Monday, Tuesday, etc.)
 */
export function translateDayName(day: string, langCode?: string): string {
  if (!day) return "";
  const trimmed = day.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    const bnMap: Record<string, string> = {
      "monday": "সোমবার",
      "tuesday": "মঙ্গলবার",
      "wednesday": "বুধবার",
      "thursday": "বৃহস্পতিবার",
      "friday": "শুক্রবার",
      "saturday": "শনিবার",
      "sunday": "রবিবার",
    };
    if (bnMap[lower]) return bnMap[lower];
  }

  if (langCode === "ar") {
    const arMap: Record<string, string> = {
      "monday": "الإثنين",
      "tuesday": "الثلاثاء",
      "wednesday": "الأربعاء",
      "thursday": "الخميس",
      "friday": "الجمعة",
      "saturday": "السبت",
      "sunday": "الأحد",
    };
    if (arMap[lower]) return arMap[lower];
  }

  if (langCode === "hi") {
    const hiMap: Record<string, string> = {
      "monday": "सोमवार",
      "tuesday": "मंगलवार",
      "wednesday": "बुधवार",
      "thursday": "गुरुवार",
      "friday": "शुक्रवार",
      "saturday": "शनिवार",
      "sunday": "रविवार",
    };
    if (hiMap[lower]) return hiMap[lower];
  }

  return trimmed;
}

/**
 * Translates short 3-letter day names (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
 */
export function translateDayShortName(day: string, langCode?: string): string {
  if (!day) return "";
  const trimmed = day.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    const bnShortMap: Record<string, string> = {
      "mon": "সোম",
      "monday": "সোম",
      "tue": "মঙ্গল",
      "tuesday": "মঙ্গল",
      "wed": "বুধ",
      "wednesday": "বুধ",
      "thu": "বৃহঃ",
      "thursday": "বৃহঃ",
      "fri": "শুক্র",
      "friday": "শুক্র",
      "sat": "শনি",
      "saturday": "শনি",
      "sun": "রবি",
      "sunday": "রবি",
    };
    if (bnShortMap[lower]) return bnShortMap[lower];
  }

  if (langCode === "ar") {
    const arShortMap: Record<string, string> = {
      "mon": "الإثنين",
      "monday": "الإثنين",
      "tue": "الثلاثاء",
      "tuesday": "الثلاثاء",
      "wed": "الأربعاء",
      "wednesday": "الأربعاء",
      "thu": "الخميس",
      "thursday": "الخميس",
      "fri": "الجمعة",
      "friday": "الجمعة",
      "sat": "السبت",
      "saturday": "السبت",
      "sun": "الأحد",
      "sunday": "الأحد",
    };
    if (arShortMap[lower]) return arShortMap[lower];
  }

  if (langCode === "hi") {
    const hiShortMap: Record<string, string> = {
      "mon": "सोम",
      "monday": "सोम",
      "tue": "मंगल",
      "tuesday": "मंगल",
      "wed": "बुध",
      "wednesday": "बुध",
      "thu": "गुरु",
      "thursday": "गुरु",
      "fri": "शुक्र",
      "friday": "शुक्र",
      "sat": "शनि",
      "saturday": "शनि",
      "sun": "रवि",
      "sunday": "रवि",
    };
    if (hiShortMap[lower]) return hiShortMap[lower];
  }

  return trimmed;
}

/**
 * Translates attendance type strings like Present (P), Late (L), Half Day (F), Half Day (Second Half) (SH)
 */
export function translateAttendanceType(type: string, langCode?: string): string {
  if (!type) return "";
  const trimmed = type.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    const bnMap: Record<string, string> = {
      "present (p)": "উপস্থিত (P)",
      "late (l)": "দেরি (L)",
      "half day (f)": "অর্ধদিবস (F)",
      "half day (second half) (sh)": "অর্ধদিবস (দ্বিতীয়ার্ধ) (SH)",
      "absent (a)": "অনুপস্থিত (A)",
      "holiday (h)": "ছুটি (H)",
    };
    if (bnMap[lower]) return bnMap[lower];
  }

  if (langCode === "ar") {
    const arMap: Record<string, string> = {
      "present (p)": "حاضر (P)",
      "late (l)": "متأخر (L)",
      "half day (f)": "نصف يوم (F)",
      "half day (second half) (sh)": "نصف يوم (النصف الثاني) (SH)",
      "absent (a)": "غائب (A)",
      "holiday (h)": "عطلة (H)",
    };
    if (arMap[lower]) return arMap[lower];
  }

  if (langCode === "hi") {
    const hiMap: Record<string, string> = {
      "present (p)": "उपस्थित (P)",
      "late (l)": "देरी (L)",
      "half day (f)": "आधा दिन (F)",
      "half day (second half) (sh)": "आधा दिन (दूसरा भाग) (SH)",
      "absent (a)": "अनुपस्थित (A)",
      "holiday (h)": "अवकाश (H)",
    };
    if (hiMap[lower]) return hiMap[lower];
  }

  return trimmed;
}

/**
 * Translates academic holiday and event types (e.g., "Holiday", "Activity", "School Events", "Vacation").
 */
export function translateHolidayTypeName(name?: string | null, langCode: string = "en"): string {
  if (!name) return "";
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    const bnMap: Record<string, string> = {
      holiday: "ছুটি",
      holidays: "ছুটি",
      "public holiday": "সরকারি ছুটি",
      "public holidays": "সরকারি ছুটি",
      activity: "কার্যক্রম",
      activities: "কার্যক্রম",
      "school event": "বিদ্যালয়ের ইভেন্ট",
      "school events": "বিদ্যালয়ের ইভেন্ট",
      event: "ইভেন্ট",
      events: "ইভেন্ট",
      vacation: "অবকাশকালীন ছুটি",
      vacations: "অবকাশকালীন ছুটি",
      "weekly holiday": "সাপ্তাহিক ছুটি",
      "weekly holidays": "সাপ্তাহিক ছুটি",
      exam: "পরীক্ষা",
      examination: "পরীক্ষা",
      national: "জাতীয় ছুটি",
      regional: "আঞ্চলিক ছুটি",
      festival: "উৎসবের ছুটি",
    };
    if (bnMap[lower]) return bnMap[lower];
  }

  if (langCode === "ar") {
    const arMap: Record<string, string> = {
      holiday: "عطلة",
      holidays: "عطلات",
      "public holiday": "عطلة رسمية",
      "public holidays": "العطل الرسمية",
      activity: "نشاط",
      activities: "أنشطة",
      "school event": "فعالية مدرسية",
      "school events": "فعاليات المدرسة",
      event: "فعالية",
      events: "فعاليات",
      vacation: "إجازة",
      vacations: "إجازات",
      "weekly holiday": "عطلة أسبوعية",
      "weekly holidays": "العطل الأسبوعية",
      exam: "امتحان",
      examination: "امتحان",
      national: "عطلة وطنية",
      regional: "عطلة إقليمية",
      festival: "عطلة عيد",
    };
    if (arMap[lower]) return arMap[lower];
  }

  if (langCode === "hi") {
    const hiMap: Record<string, string> = {
      holiday: "छुट्टी",
      holidays: "छुट्टियां",
      "public holiday": "सार्वजनिक अवकाश",
      "public holidays": "सार्वजनिक छुट्टियां",
      activity: "गतिविधि",
      activities: "गतिविधियां",
      "school event": "स्कूल कार्यक्रम",
      "school events": "स्कूल के कार्यक्रम",
      event: "कार्यक्रम",
      events: "कार्यक्रम",
      vacation: "अवकाश",
      vacations: "छुट्टियां",
      "weekly holiday": "साप्ताहिक अवकाश",
      "weekly holidays": "साप्ताहिक अवकाश",
      exam: "परीक्षा",
      examination: "परीक्षा",
      national: "राष्ट्रीय अवकाश",
      regional: "क्षेत्रीय अवकाश",
      festival: "त्योहार अवकाश",
    };
    if (hiMap[lower]) return hiMap[lower];
  }

  return trimmed;
}

/**
 * Translates course categories (e.g., "Business Marketing", "Lifestyle Course", "Language", "Sports").
 */
export function translateCourseCategory(category?: string | null, langCode: string = "en"): string {
  if (!category) return "";
  const trimmed = category.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    const bnMap: Record<string, string> = {
      "business marketing": "বিজনেস মার্কেটিং",
      "lifestyle course": "লাইফস্টাইল কোর্স",
      "lifestyle": "লাইফস্টাইল",
      "language": "ভাষা শিক্ষা",
      "languages": "ভাষা শিক্ষা",
      "sports": "খেলাধুলা",
      "sport": "খেলাধুলা",
      "science": "বিজ্ঞান",
      "technology": "প্রযুক্তি",
      "arts": "চারুকলা",
      "art": "চারুকলা",
      "mathematics": "গণিত",
      "math": "গণিত",
      "programming": "প্রোগ্রামিং",
      "music": "সঙ্গীত",
      "design": "ডিজাইন",
    };
    if (bnMap[lower]) return bnMap[lower];
  }

  if (langCode === "ar") {
    const arMap: Record<string, string> = {
      "business marketing": "التسويق التجاري",
      "lifestyle course": "دورة نمط الحياة",
      "lifestyle": "نمط الحياة",
      "language": "اللغات",
      "languages": "اللغات",
      "sports": "الرياضة",
      "sport": "الرياضة",
      "science": "العلوم",
      "technology": "التكنولوجيا",
      "arts": "الفنون",
      "art": "الفنون",
      "mathematics": "الرياضيات",
      "math": "الرياضيات",
      "programming": "البرمجة",
      "music": "الموسيقى",
      "design": "التصميم",
    };
    if (arMap[lower]) return arMap[lower];
  }

  if (langCode === "hi") {
    const hiMap: Record<string, string> = {
      "business marketing": "बिजनेस मार्केटिंग",
      "lifestyle course": "लाइफस्टाइल कोर्स",
      "lifestyle": "लाइफस्टाइल",
      "language": "भाषा",
      "languages": "भाषाएं",
      "sports": "खेल",
      "sport": "खेल",
      "science": "विज्ञान",
      "technology": "प्रौद्योगिकी",
      "arts": "कला",
      "art": "कला",
      "mathematics": "गणित",
      "math": "गणित",
      "programming": "प्रोग्रामिंग",
      "music": "संगीत",
      "design": "डिज़ाइन",
    };
    if (hiMap[lower]) return hiMap[lower];
  }

  return trimmed;
}

/**
 * Translates student gender values based on language code.
 */
export function translateGender(gender?: string | null, langCode: string = "en"): string {
  if (!gender) return "";
  const lower = gender.trim().toLowerCase();
  if (langCode === "bn") {
    if (lower === "male" || lower === "m") return "পুরুষ";
    if (lower === "female" || lower === "f") return "মহিলা";
    if (lower === "other" || lower === "others") return "অন্যান্য";
  }
  if (langCode === "ar") {
    if (lower === "male" || lower === "m") return "ذكر";
    if (lower === "female" || lower === "f") return "أنثى";
    if (lower === "other" || lower === "others") return "آخر";
  }
  if (langCode === "hi") {
    if (lower === "male" || lower === "m") return "पुरुष";
    if (lower === "female" || lower === "f") return "महिला";
    if (lower === "other" || lower === "others") return "अन्य";
  }
  return gender;
}

/**
 * Translates student category names based on language code.
 */
export function translateStudentCategory(category?: string | null, langCode: string = "en"): string {
  if (!category) return "";
  const lower = category.trim().toLowerCase();
  if (langCode === "bn") {
    const map: Record<string, string> = {
      "general": "সাধারণ",
      "obc": "ওবিসি",
      "sc": "এসসি",
      "st": "এসটি",
      "special": "বিশেষ",
      "special needs / quota": "বিশেষ চাহিদা / কোটা",
      "scholarship": "মেধাবৃত্তি",
      "scholarship / merit": "বৃত্তি / মেধা",
      "regular": "নিয়মিত",
      "staff ward / child": "স্টাফ সন্তান / পোষ্য",
      "foreign student": "বিদেশি শিক্ষার্থী",
    };
    if (map[lower]) return map[lower];
  }
  if (langCode === "ar") {
    const map: Record<string, string> = {
      "general": "عام",
      "obc": "فئة أخرى",
      "sc": "فئة خاصة",
      "st": "قبائل خاصة",
      "special": "خاص",
      "special needs / quota": "احتياجات خاصة / حصة",
      "scholarship": "منحة دراسية",
      "scholarship / merit": "منحة دراسية / جدارة",
      "regular": "منتظم",
      "staff ward / child": "أبناء العاملين",
      "foreign student": "طالب أجنبي",
    };
    if (map[lower]) return map[lower];
  }
  if (langCode === "hi") {
    const map: Record<string, string> = {
      "general": "सामान्य",
      "obc": "ओबीसी",
      "sc": "एससी",
      "st": "एसटी",
      "special": "विशेष",
      "special needs / quota": "विशेष आवश्यकताएं / कोटा",
      "scholarship": "छात्रवृत्ति",
      "scholarship / merit": "छात्रवृत्ति / योग्यता",
      "regular": "नियमित",
      "staff ward / child": "कर्मचारी वार्ड / बच्चा",
      "foreign student": "विदेशी छात्र",
    };
    if (map[lower]) return map[lower];
  }
  return category;
}

/**
 * Translates student house names based on language code.
 */
export function translateStudentHouse(houseName?: string | null, langCode: string = "en"): string {
  if (!houseName) return "";
  const trimmed = houseName.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    const map: Record<string, string> = {
      "padma": "পদ্মা",
      "padma house": "পদ্মা হাউস",
      "meghna": "মেঘনা",
      "meghna house": "মেঘনা হাউস",
      "jamuna": "যমুনা",
      "jamuna house": "যমুনা হাউস",
      "surma": "সুরমা",
      "surma house": "সুরমা হাউস",
      "red": "রেড (লাল)",
      "red house": "রেড হাউস (লাল)",
      "blue": "ব্লু (নীল)",
      "blue house": "ব্লু হাউস (নীল)",
      "green": "গ্রিন (সবুজ)",
      "green house": "গ্রিন হাউস (সবুজ)",
      "yellow": "ইয়েলো (হলুদ)",
      "yellow house": "ইয়েলো হাউস (হলুদ)",
    };
    if (map[lower]) return map[lower];
    // Strip trailing parenthetical Bengali note if already there, e.g. "Red House (লাল)"
    for (const [key, val] of Object.entries(map)) {
      if (lower.startsWith(key)) return val;
    }
  }

  if (langCode === "ar") {
    const map: Record<string, string> = {
      "padma": "بادما",
      "padma house": "بيت بادما",
      "meghna": "ميغنا",
      "meghna house": "بيت ميغنا",
      "jamuna": "جامونا",
      "jamuna house": "بيت جامونا",
      "surma": "سورما",
      "surma house": "بيت سورما",
      "red": "أحمر",
      "red house": "البيت الأحمر",
      "blue": "أزرق",
      "blue house": "البيت الأزرق",
      "green": "أخضر",
      "green house": "البيت الأخضر",
      "yellow": "أصفر",
      "yellow house": "البيت الأصفر",
    };
    if (map[lower]) return map[lower];
    for (const [key, val] of Object.entries(map)) {
      if (lower.startsWith(key)) return val;
    }
  }

  if (langCode === "hi") {
    const map: Record<string, string> = {
      "padma": "पद्मा",
      "padma house": "पद्मा हाउस",
      "meghna": "मेघना",
      "meghna house": "मेघना हाउस",
      "jamuna": "यमुना",
      "jamuna house": "यमुना हाउस",
      "surma": "सुरमा",
      "surma house": "सुरमा हाउस",
      "red": "रेड (लाल)",
      "red house": "रेड हाउस (लाल)",
      "blue": "ब्लू (नीला)",
      "blue house": "ब्लू हाउस (नीला)",
      "green": "ग्रीन (हरा)",
      "green house": "ग्रीन हाउस (हरा)",
      "yellow": "येलो (पीला)",
      "yellow house": "येलो हाउस (पीला)",
    };
    if (map[lower]) return map[lower];
    for (const [key, val] of Object.entries(map)) {
      if (lower.startsWith(key)) return val;
    }
  }

  return trimmed;
}

/**
 * Translates disable / dropout reason names based on language code.
 */
export function translateDisableReason(reason?: string | null, langCode: string = "en"): string {
  if (!reason) return "";
  const trimmed = reason.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    const map: Record<string, string> = {
      "absent": "অনুপস্থিত",
      "long absent": "দীর্ঘ অনুপস্থিতি",
      "long absent / irregular": "দীর্ঘ অনুপস্থিতি / অনিয়মিত",
      "transferred to another school": "অন্য স্কুলে স্থানান্তর",
      "transfer": "স্থানান্তর",
      "financial hardship / non-payment": "আর্থিক সমস্যা / ফি অনাদায়ী",
      "financial hardship": "আর্থিক সমস্যা",
      "disciplinary action": "শৃঙ্খলাজনিত ব্যবস্থা",
      "disciplinary": "শৃঙ্খলাজনিত",
      "health / medical condition": "শারীরিক / চিকিৎসা কারণ",
      "medical": "চিকিৎসা সংক্রান্ত",
      "health": "শারীরিক অসুস্থতা",
      "family relocation": "পরিবার স্থানান্তর",
      "location": "কর্মস্থল / অবস্থান",
      "graduated / course completed": "কোর্স সম্পন্ন / পাস",
      "graduated": "উত্তীর্ণ",
      "parent / guardian request": "অভিভাবকের অনুরোধ",
      "parent request": "অভিভাবকের অনুরোধ",
    };
    if (map[lower]) return map[lower];
    for (const [key, val] of Object.entries(map)) {
      if (lower.startsWith(key)) return val;
    }
  }

  if (langCode === "ar") {
    const map: Record<string, string> = {
      "absent": "غائب",
      "long absent": "غياب طويل",
      "long absent / irregular": "غياب طويل / غير منتظم",
      "transferred to another school": "انتقال إلى مدرسة أخرى",
      "transfer": "انتقال",
      "financial hardship / non-payment": "صعوبات مالية / عدم السداد",
      "financial hardship": "صعوبات مالية",
      "disciplinary action": "إجراء تأديبي",
      "disciplinary": "تأديبي",
      "health / medical condition": "حالة صحية / مرضية",
      "medical": "حالة صحية",
      "health": "صحي",
      "family relocation": "انتقال العائلة",
      "location": "الموقع / السكن",
      "graduated / course completed": "تخرج / إتمام المرحلة",
      "graduated": "متخرج",
      "parent / guardian request": "طلب ولي الأمر",
      "parent request": "طلب ولي الأمر",
    };
    if (map[lower]) return map[lower];
    for (const [key, val] of Object.entries(map)) {
      if (lower.startsWith(key)) return val;
    }
  }

  if (langCode === "hi") {
    const map: Record<string, string> = {
      "absent": "अनुपस्थित",
      "long absent": "लंबी अनुपस्थिति",
      "long absent / irregular": "लंबी अनुपस्थिति / अनियमित",
      "transferred to another school": "दूसरे स्कूल में स्थानांतरण",
      "transfer": "स्थानांतरण",
      "financial hardship / non-payment": "वित्तीय कठिनाई / गैर-भुगतान",
      "financial hardship": "वित्तीय कठिनाई",
      "disciplinary action": "अनुशासनात्मक कार्रवाई",
      "disciplinary": "अनुशासनात्मक",
      "health / medical condition": "स्वास्थ्य / चिकित्सीय स्थिति",
      "medical": "चिकित्सीय स्थिति",
      "health": "स्वास्थ्य कारण",
      "family relocation": "पारिवारिक स्थानांतरण",
      "location": "स्थान / निवास",
      "graduated / course completed": "उत्तीर्ण / पाठ्यक्रम पूर्ण",
      "graduated": "उत्तीर्ण",
      "parent / guardian request": "अभिभावक का अनुरोध",
      "parent request": "अभिभावक का अनुरोध",
    };
    if (map[lower]) return map[lower];
    for (const [key, val] of Object.entries(map)) {
      if (lower.startsWith(key)) return val;
    }
  }

  return trimmed;
}

/**
 * Translates common certificate template names based on language code.
 */
export function translateCertificateTemplateName(name?: string | null, langCode: string = "en"): string {
  if (!name) return "";
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    const map: Record<string, string> = {
      "transfer certificate": "স্থানান্তর সনদপত্র (TC)",
      "certificate of appreciation": "প্রশংসাপত্র (Appreciation)",
      "character certificate": "চারিত্রিক সনদপত্র",
      "school leaving certificate": "বিদ্যালয় পরিত্যাগের সনদপত্র",
      "academic excellence award": "শিক্ষাগত উৎকর্ষ পুরস্কার",
      "sports achievement award": "ক্রীড়া কৃতিত্ব পুরস্কার",
      "royal maroon & gold - appreciation": "রয়্যাল মেরুন ও গোল্ড - প্রশংসাপত্র",
      "kids vibrant purple - distinction": "কিডস ভাইব্রেন্ট পার্পল - কৃতিত্ব সনদ",
      "classic luxury burgundy - excellence": "ক্লাসিক লাক্সারি বারগান্ডি - শ্রেষ্ঠত্ব সনদ",
      "school letterhead template (general purpose)": "বিদ্যালয় লেটারহেড টেমপ্লেট (সাধারণ উদ্দেশ্য)",
      "standard school certificate": "স্ট্যান্ডার্ড স্কুল সনদপত্র",
      "modern minimalist indigo (horizontal)": "মডার্ন মিনিমালিস্ট ইন্ডিগো (অনুভূমিক)",
      "modern minimalist indigo": "মডার্ন মিনিমালিস্ট ইন্ডিগো",
      "executive slate & gold (vertical)": "এক্সিকিউটিভ স্লেট ও গোল্ড (উল্লম্ব)",
      "executive slate & gold": "এক্সিকিউটিভ স্লেট ও গোল্ড",
      "bright future golden crest (horizontal)": "ব্রাইট ফিউচার গোল্ডেন ক্রেস্ট (অনুভূমিক)",
      "bright future golden crest": "ব্রাইট ফিউচার গোল্ডেন ক্রেস্ট",
      "liberty collegiate maroon (vertical)": "লিবার্টি কলেজিয়েট মেরুন (উল্লম্ব)",
      "liberty collegiate maroon": "লিবার্টি কলেজিয়েট মেরুন",
      "royal blue & gold circle (vertical)": "রয়্যাল ব্লু ও গোল্ড সার্কেল (উল্লম্ব)",
      "royal blue & gold circle": "রয়্যাল ব্লু ও গোল্ড সার্কেল",
      "little flower vibrant curved (vertical)": "লিটল ফ্লাওয়ার ভাইব্রেন্ট কার্ভড (উল্লম্ব)",
      "little flower vibrant curved": "লিটল ফ্লাওয়ার ভাইব্রেন্ট কার্ভড",
      "vikas national bilingual (vertical)": "বিকাশ ন্যাশনাল দ্বিভাষিক (উল্লম্ব)",
      "vikas national bilingual": "বিকাশ ন্যাশনাল দ্বিভাষিক",
      "tech sapphire digital id (horizontal)": "টেক স্যাফায়ার ডিজিটাল আইডি (অনুভূমিক)",
      "tech sapphire digital id": "টেক স্যাফায়ার ডিজিটাল আইডি",
      "bright future modern wave (vertical)": "ব্রাইট ফিউচার মডার্ন ওয়েভ (উল্লম্ব)",
      "bright future modern wave": "ব্রাইট ফিউচার মডার্ন ওয়েভ",
      "green field international crest (vertical)": "গ্রিন ফিল্ড ইন্টারন্যাশনাল ক্রেস্ট (উল্লম্ব)",
      "green field international crest": "গ্রিন ফিল্ড ইন্টারন্যাশনাল ক্রেস্ট",
      "faculty indigo professional (horizontal)": "ফ্যাকাল্টি ইন্ডিগো প্রফেশনাল (অনুভূমিক)",
      "faculty indigo professional": "ফ্যাকাল্টি ইন্ডিগো প্রফেশনাল",
      "executive staff slate & gold (vertical)": "এক্সিকিউটিভ স্টাফ স্লেট ও গোল্ড (উল্লম্ব)",
      "executive staff slate & gold": "এক্সিকিউটিভ স্টাফ স্লেট ও গোল্ড",
      "bright future golden crest staff (horizontal)": "ব্রাইট ফিউচার গোল্ডেন ক্রেস্ট স্টাফ (অনুভূমিক)",
      "bright future golden crest staff": "ব্রাইট ফিউচার গোল্ডেন ক্রেস্ট স্টাফ",
      "liberty collegiate maroon faculty (vertical)": "লিবার্টি কলেজিয়েট মেরুন ফ্যাকাল্টি (উল্লম্ব)",
      "liberty collegiate maroon faculty": "লিবার্টি কলেজিয়েট মেরুন ফ্যাকাল্টি",
      "royal blue & gold circle staff (vertical)": "রয়্যাল ব্লু ও গোল্ড সার্কেল স্টাফ (উল্লম্ব)",
      "royal blue & gold circle staff": "রয়্যাল ব্লু ও গোল্ড সার্কেল স্টাফ",
      "little flower vibrant curved staff (vertical)": "লিটল ফ্লাওয়ার ভাইব্রেন্ট কার্ভড স্টাফ (উল্লম্ব)",
      "little flower vibrant curved staff": "লিটল ফ্লাওয়ার ভাইব্রেন্ট কার্ভড স্টাফ",
      "vikas national bilingual staff (vertical)": "বিকাশ ন্যাশনাল দ্বিভাষিক স্টাফ (উল্লম্ব)",
      "vikas national bilingual staff": "বিকাশ ন্যাশনাল দ্বিভাষিক স্টাফ",
      "tech staff sapphire high-tech (horizontal)": "টেক স্টাফ স্যাফায়ার হাই-টেক (অনুভূমিক)",
      "tech staff sapphire high-tech": "টেক স্টাফ স্যাফায়ার হাই-টেক",
      "bright future modern wave staff (vertical)": "ব্রাইট ফিউচার মডার্ন ওয়েভ স্টাফ (উল্লম্ব)",
      "bright future modern wave staff": "ব্রাইট ফিউচার মডার্ন ওয়েভ স্টাফ",
      "green field international staff (vertical)": "গ্রিন ফিল্ড ইন্টারন্যাশনাল স্টাফ (উল্লম্ব)",
      "green field international staff": "গ্রিন ফিল্ড ইন্টারন্যাশনাল স্টাফ",
    };
    if (map[lower]) return map[lower];

    // Check base name if ending with (Horizontal) or (Vertical)
    if (lower.endsWith("(horizontal)")) {
      const base = lower.replace(/\s*\(horizontal\)$/i, "").trim();
      if (map[base]) return `${map[base]} (অনুভূমিক)`;
    }
    if (lower.endsWith("(vertical)")) {
      const base = lower.replace(/\s*\(vertical\)$/i, "").trim();
      if (map[base]) return `${map[base]} (উল্লম্ব)`;
    }
  }

  if (langCode === "ar") {
    const map: Record<string, string> = {
      "transfer certificate": "شهادة انتقال (TC)",
      "certificate of appreciation": "شهادة تقدير",
      "character certificate": "شهادة حسن سير وسلوك",
      "school leaving certificate": "شهادة مغادرة المدرسة",
      "academic excellence award": "جائزة التميز الأكاديمي",
      "sports achievement award": "جائزة الإنجاز الرياضي",
      "royal maroon & gold - appreciation": "مارون ملكي وذهبي - تقدير",
      "kids vibrant purple - distinction": "بنفسجي حيوي للأطفال - تميز",
      "classic luxury burgundy - excellence": "كلاسيك عنابي فاخر - تفوق",
      "school letterhead template (general purpose)": "نموذج ترويسة المدرسة (أغراض عامة)",
      "standard school certificate": "شهادة المدرسة القياسية",
      "modern minimalist indigo (horizontal)": "نيلي بسيط حديث (أفقي)",
      "modern minimalist indigo": "نيلي بسيط حديث",
      "executive slate & gold (vertical)": "إكسكيوتيف رمادي وذهبي (عمودي)",
      "executive slate & gold": "إكسكيوتيف رمادي وذهبي",
      "bright future golden crest (horizontal)": "برايت فيوتشر الشعار الذهبي (أفقي)",
      "bright future golden crest": "برايت فيوتشر الشعار الذهبي",
      "liberty collegiate maroon (vertical)": "ليبرتي كوليجيت كستنائي (عمودي)",
      "liberty collegiate maroon": "ليبرتي كوليجيت كستنائي",
      "royal blue & gold circle (vertical)": "أزرق ملكي ودائرة ذهبية (عمودي)",
      "royal blue & gold circle": "أزرق ملكي ودائرة ذهبية",
      "little flower vibrant curved (vertical)": "ليتل فلاور المنحني الحيوي (عمودي)",
      "little flower vibrant curved": "ليتل فلاور المنحني الحيوي",
      "vikas national bilingual (vertical)": "فيكاس الوطني ثنائي اللغة (عمودي)",
      "vikas national bilingual": "فيكاس الوطني ثنائي اللغة",
      "tech sapphire digital id (horizontal)": "تك سافاير بطاقة رقمية (أفقي)",
      "tech sapphire digital id": "تك سافاير بطاقة رقمية",
      "bright future modern wave (vertical)": "برايت فيوتشر الموجة الحديثة (عمودي)",
      "bright future modern wave": "برايت فيوتشر الموجة الحديثة",
      "green field international crest (vertical)": "جرين فيلد الدولي شعار (عمودي)",
      "green field international crest": "جرين فيلد الدولي شعار",
      "faculty indigo professional (horizontal)": "هيئة التدريس نيلي احترافي (أفقي)",
      "faculty indigo professional": "هيئة التدريس نيلي احترافي",
      "executive staff slate & gold (vertical)": "إكسكيوتيف الموظفين رمادي وذهبي (عمودي)",
      "executive staff slate & gold": "إكسكيوتيف الموظفين رمادي وذهبي",
      "bright future golden crest staff (horizontal)": "برايت فيوتشر الشعار الذهبي للموظفين (أفقي)",
      "bright future golden crest staff": "برايت فيوتشر الشعار الذهبي للموظفين",
      "liberty collegiate maroon faculty (vertical)": "ليبرتي كوليجيت كستنائي أعضاء التدريس (عمودي)",
      "liberty collegiate maroon faculty": "ليبرتي كوليجيت كستنائي أعضاء التدريس",
      "royal blue & gold circle staff (vertical)": "أزرق ملكي ودائرة ذهبية للموظفين (عمودي)",
      "royal blue & gold circle staff": "أزرق ملكي ودائرة ذهبية للموظفين",
      "little flower vibrant curved staff (vertical)": "ليتل فلاور المنحني الحيوي للموظفين (عمودي)",
      "little flower vibrant curved staff": "ليتل فلاور المنحني الحيوي للموظفين",
      "vikas national bilingual staff (vertical)": "فيكاس الوطني ثنائي اللغة للموظفين (عمودي)",
      "vikas national bilingual staff": "فيكاس الوطني ثنائي اللغة للموظفين",
      "tech staff sapphire high-tech (horizontal)": "تك للموظفين سافاير عالي التقنية (أفقي)",
      "tech staff sapphire high-tech": "تك للموظفين سافاير عالي التقنية",
      "bright future modern wave staff (vertical)": "برايت فيوتشر الموجة الحديثة للموظفين (عمودي)",
      "bright future modern wave staff": "برايت فيوتشر الموجة الحديثة للموظفين",
      "green field international staff (vertical)": "جرين فيلد الدولي للموظفين (عمودي)",
      "green field international staff": "جرين فيلد الدولي للموظفين",
    };
    if (map[lower]) return map[lower];

    if (lower.endsWith("(horizontal)")) {
      const base = lower.replace(/\s*\(horizontal\)$/i, "").trim();
      if (map[base]) return `${map[base]} (أفقي)`;
    }
    if (lower.endsWith("(vertical)")) {
      const base = lower.replace(/\s*\(vertical\)$/i, "").trim();
      if (map[base]) return `${map[base]} (عمودي)`;
    }
  }

  if (langCode === "hi") {
    const map: Record<string, string> = {
      "transfer certificate": "स्थानांतरण प्रमाणपत्र (TC)",
      "certificate of appreciation": "प्रशंसा प्रमाणपत्र",
      "character certificate": "चरित्र प्रमाणपत्र",
      "school leaving certificate": "स्कूल छोड़ने का प्रमाणपत्र",
      "academic excellence award": "शैक्षणिक उत्कृष्टता पुरस्कार",
      "sports achievement award": "खेल उपलब्धि पुरस्कार",
      "royal maroon & gold - appreciation": "रॉयल मैरून और गोल्ड - प्रशंसा",
      "kids vibrant purple - distinction": "किड्स वाइब्रेंट पर्पल - विशिष्टता",
      "classic luxury burgundy - excellence": "क्लासिक लक्जरी बरगंडी - उत्कृष्टता",
      "school letterhead template (general purpose)": "स्कूल लेटरहेड टेम्पलेट (सामान्य उद्देश्य)",
      "standard school certificate": "मानक स्कूल प्रमाणपत्र",
      "modern minimalist indigo (horizontal)": "आधुनिक मिनिमलिस्ट इंडिगो (क्षैतिज)",
      "modern minimalist indigo": "आधुनिक मिनिमलिस्ट इंडिगो",
      "executive slate & gold (vertical)": "कार्यकारी स्लेट और गोल्ड (लंबवत)",
      "executive slate & gold": "कार्यकारी स्लेट और गोल्ड",
      "bright future golden crest (horizontal)": "ब्राइट फ्यूचर गोल्डन क्रेस्ट (क्षैतिज)",
      "bright future golden crest": "ब्राइट फ्यूचर गोल्डन क्रेस्ट",
      "liberty collegiate maroon (vertical)": "लिबर्टी कॉलेजिएट मैरून (लंबवत)",
      "liberty collegiate maroon": "लिबर्टी कॉलेजिएट मैरून",
      "royal blue & gold circle (vertical)": "रॉयल ब्लू और गोल्ड सर्कल (लंबवत)",
      "royal blue & gold circle": "रॉयल ब्लू और गोल्ड सर्कल",
      "little flower vibrant curved (vertical)": "लिटिल फ्लावर वाइब्रेंट कर्व्ड (लंबवत)",
      "little flower vibrant curved": "लिटिल फ्लावर वाइब्रेंट कर्व्ड",
      "vikas national bilingual (vertical)": "विकास नेशनल द्विभाषी (लंबवत)",
      "vikas national bilingual": "विकास नेशनल द्विभाषी",
      "tech sapphire digital id (horizontal)": "टेक नीलमणि डिजिटल आईडी (क्षैतिज)",
      "tech sapphire digital id": "टेक नीलमणि डिजिटल आईडी",
      "bright future modern wave (vertical)": "ब्राइट फ्यूचर मॉडर्न वेव (लंबवत)",
      "bright future modern wave": "ब्राइट फ्यूचर मॉडर्न वेव",
      "green field international crest (vertical)": "ग्रीन फील्ड इंटरनेशनल क्रेस्ट (लंबवत)",
      "green field international crest": "ग्रीन फील्ड इंटरनेशनल क्रेस्ट",
      "faculty indigo professional (horizontal)": "फैकल्टी इंडिगो प्रोफेशनल (क्षैतिज)",
      "faculty indigo professional": "फैकल्टी इंडिगो प्रोफेशनल",
      "executive staff slate & gold (vertical)": "कार्यकारी स्टाफ स्लेट और गोल्ड (लंबवत)",
      "executive staff slate & gold": "कार्यकारी स्टाफ स्लेट और गोल्ड",
      "bright future golden crest staff (horizontal)": "ब्राइट फ्यूचर गोल्डन क्रेस्ट स्टाफ (क्षैतिज)",
      "bright future golden crest staff": "ब्राइट फ्यूचर गोल्डन क्रेस्ट स्टाफ",
      "liberty collegiate maroon faculty (vertical)": "लिबर्टी कॉलेजिएट मैरून फैकल्टी (लंबवत)",
      "liberty collegiate maroon faculty": "लिबर्टी कॉलेजिएट मैरून फैकल्टी",
      "royal blue & gold circle staff (vertical)": "रॉयल ब्लू और गोल्ड सर्कल स्टाफ (लंबवत)",
      "royal blue & gold circle staff": "रॉयल ब्लू और गोल्ड सर्कल स्टाफ",
      "little flower vibrant curved staff (vertical)": "लिटिल फ्लावर वाइब्रेंट कर्व्ड स्टाफ (लंबवत)",
      "little flower vibrant curved staff": "लिटिल फ्लावर वाइब्रेंट कर्व्ड स्टाफ",
      "vikas national bilingual staff (vertical)": "विकास नेशनल द्विभाषी स्टाफ (लंबवत)",
      "vikas national bilingual staff": "विकास नेशनल द्विभाषी स्टाफ",
      "tech staff sapphire high-tech (horizontal)": "टेक स्टाफ नीलमणि हाई-टेक (क्षैतिज)",
      "tech staff sapphire high-tech": "टेक स्टाफ नीलमणि हाई-टेक",
      "bright future modern wave staff (vertical)": "ब्राइट फ्यूचर मॉडर्न वेव स्टाफ (लंबवत)",
      "bright future modern wave staff": "ब्राइट फ्यूचर मॉडर्न वेव स्टाफ",
      "green field international staff (vertical)": "ग्रीन फील्ड इंटरनेशनल स्टाफ (लंबवत)",
      "green field international staff": "ग्रीन फील्ड इंटरनेशनल स्टाफ",
    };
    if (map[lower]) return map[lower];

    if (lower.endsWith("(horizontal)")) {
      const base = lower.replace(/\s*\(horizontal\)$/i, "").trim();
      if (map[base]) return `${map[base]} (क्षैतिज)`;
    }
    if (lower.endsWith("(vertical)")) {
      const base = lower.replace(/\s*\(vertical\)$/i, "").trim();
      if (map[base]) return `${map[base]} (लंबवत)`;
    }
  }

  return trimmed;
}

/**
 * Translates division/rank result (First, Second, Third, Distinction, Pass, Fail).
 */
export function translateDivision(division?: string | null, langCode: string = "en"): string {
  if (!division) return "-";
  const lower = division.trim().toLowerCase();
  if (langCode === "bn") {
    const map: Record<string, string> = {
      first: "প্রথম",
      second: "দ্বিতীয়",
      third: "তৃতীয়",
      distinction: "বিশেষ কৃতিত্ব",
      pass: "উত্তীর্ণ",
      fail: "অনুত্তীর্ণ",
    };
    return map[lower] || division;
  }
  if (langCode === "ar") {
    const map: Record<string, string> = {
      first: "الأول",
      second: "الثاني",
      third: "الثالث",
      distinction: "امتياز",
      pass: "ناجح",
      fail: "راسب",
    };
    return map[lower] || division;
  }
  if (langCode === "hi") {
    const map: Record<string, string> = {
      first: "प्रथम",
      second: "द्वितीय",
      third: "तृतीय",
      distinction: "विशिष्टता",
      pass: "उत्तीर्ण",
      fail: "अनुत्तीर्ण",
    };
    return map[lower] || division;
  }
  return division;
}

/**
 * Translates exam titles like "Month Test (January -2026)".
 */
export function translateExamTitle(title?: string | null, langCode: string = "en"): string {
  if (!title) return "";
  const trimmed = title.trim();

  // Helper to translate the base exam type
  const getTransExam = (name: string) => {
    const lower = name.toLowerCase().trim();
    if (lower === "month test" || lower === "monthly test") {
      if (langCode === "bn") return "মাসিক পরীক্ষা";
      if (langCode === "ar") return "اختبار شهري";
      if (langCode === "hi") return "मासिक परीक्षा";
    } else if (lower === "first term" || lower === "1st term" || lower === "first term exam") {
      if (langCode === "bn") return "১ম সাময়িক পরীক্ষা";
      if (langCode === "ar") return "اختبار الفصل الأول";
      if (langCode === "hi") return "प्रथम सत्र परीक्षा";
    } else if (lower === "second term" || lower === "2nd term" || lower === "second term exam") {
      if (langCode === "bn") return "২য় সাময়িক পরীক্ষা";
      if (langCode === "ar") return "اختبار الفصل الثاني";
      if (langCode === "hi") return "द्वितीय सत्र परीक्षा";
    } else if (lower === "final exam" || lower === "final examination" || lower === "annual exam") {
      if (langCode === "bn") return "বার্ষিক পরীক্ষা";
      if (langCode === "ar") return "الامتحان النهائي";
      if (langCode === "hi") return "वार्षिक परीक्षा";
    }
    return name;
  };

  // Pattern 1: Parentheses like "Month Test (January -2026)" or "Month Test (January 2026)"
  const matchParen = trimmed.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (matchParen) {
    const examName = matchParen[1].trim();
    const inside = matchParen[2].trim();
    const transExam = getTransExam(examName);

    // Inside might be "January -2026" or "January 2026" or "January-2026"
    const monthYearMatch = inside.match(/^([a-zA-Z]+)\s*[-–—]?\s*(\d{4})$/);
    if (monthYearMatch) {
      const transMonth = translateMonthName(monthYearMatch[1], langCode);
      const transYear = toLocaleNumber(monthYearMatch[2], langCode);
      return `${transExam} (${transMonth} -${transYear})`;
    }

    return `${transExam} (${toLocaleNumber(inside, langCode)})`;
  }

  // Pattern 2: Without parentheses like "Monthly Test August - 2026" or "Monthly Test August 2026"
  const matchNoParen = trimmed.match(/^(Month Test|Monthly Test|First Term|1st Term|Second Term|2nd Term|Final Exam|Annual Exam)\s+([a-zA-Z]+)\s*[-–—]?\s*(\d{4})$/i);
  if (matchNoParen) {
    const examName = matchNoParen[1].trim();
    const monthName = matchNoParen[2].trim();
    const yearStr = matchNoParen[3].trim();
    const transExam = getTransExam(examName);
    const transMonth = translateMonthName(monthName, langCode);
    const transYear = toLocaleNumber(yearStr, langCode);
    return `${transExam} (${transMonth} - ${transYear})`;
  }

  // Generic translation fallback
  return translateExamName(trimmed, langCode);
}

/**
 * Translates student timeline entries like "Admitted to Class 1 (A)" or "Fee Payment of $10.00 received".
 */
export function translateTimelineTitle(title?: string | null, langCode: string = "en", currencySymbol?: string): string {
  if (!title) return "";
  const trimmed = title.trim();

  // Pattern: "Admitted to Class 1 (A)" or "Admitted to Class 1"
  const admitMatch = trimmed.match(/^Admitted to\s+(.+)$/i);
  if (admitMatch) {
    const classStr = admitMatch[1].trim();
    const transClass = translateClassSection(classStr, langCode);
    if (langCode === "bn") return `${transClass}-এ ভর্তি করা হয়েছে`;
    if (langCode === "ar") return `تم القبول في ${transClass}`;
    if (langCode === "hi") return `${transClass} में प्रवेश लिया`;
    return `Admitted to ${transClass}`;
  }

  // Pattern: "Fee Payment of $10.00 received" or "Fee Payment of 500 received"
  const feeMatch = trimmed.match(/^Fee Payment of\s*([^\s]+)\s*received$/i);
  if (feeMatch) {
    let amtStr = feeMatch[1].trim();
    if (currencySymbol) {
      amtStr = amtStr.replace(/^\$/, currencySymbol);
    }
    const localizedAmt = amtStr.replace(/[\d,.]+/g, (m) => toLocaleNumber(m, langCode));
    if (langCode === "bn") return `${localizedAmt} ফি পরিশোধ গৃহীত হয়েছে`;
    if (langCode === "ar") return `تم استلام دفعة رسوم قدرها ${localizedAmt}`;
    if (langCode === "hi") return `${localizedAmt} का शुल्क भुगतान प्राप्त हुआ`;
    return `Fee Payment of ${localizedAmt} received`;
  }

  return trimmed;
}

/**
 * Translates common student registration / admission document titles.
 */
export function translateDocumentTitle(title?: string | null, langCode: string = "en"): string {
  if (!title) return "";
  const trimmed = title.trim();
  const lower = trimmed.toLowerCase();

  const docMaps: Record<string, { bn: string; ar: string; hi: string }> = {
    "caste certificate of the child seeking admission (if any)": {
      bn: "ভর্তিচ্ছু শিশুর জাতিগত সনদ (যদি থাকে)",
      ar: "شهادة انتماء الطفل الراغب في القبول (إن وجدت)",
      hi: "प्रवेश चाहने वाले बच्चे का जाति प्रमाण पत्र (यदि कोई हो)",
    },
    "photocopy of birth certificate (attested)": {
      bn: "জন্ম সনদের সত্যায়িত ফটোকপি",
      ar: "نسخة مصدقة من شهادة الميلاد",
      hi: "जन्म प्रमाण पत्र की सत्यापित छायाप्रति",
    },
    "one latest passport size photograph of mother": {
      bn: "মাতার ১ কপি সাম্প্রতিক পাসপোর্ট সাইজের ছবি",
      ar: "صورة شمسية حديثة للأم بحجم جواز السفر",
      hi: "माता की एक नवीनतम पासपोर्ट आकार की तस्वीर",
    },
    "transfer certificate (original)": {
      bn: "ছাড়পত্র / ট্রান্সফার সার্টিফিকেট (মূল)",
      ar: "شهادة انتقال (أصلية)",
      hi: "स्थानांतरण प्रमाण पत्र (मूल)",
    },
    "three latest passport size photographs of student": {
      bn: "শিক্ষার্থীর ৩ কপি সাম্প্রতিক পাসপোর্ট সাইজের ছবি",
      ar: "ثلاث صور حديثة للطالب بحجم جواز السفر",
      hi: "छात्र की तीन नवीनतम पासपोर्ट आकार की तस्वीरें",
    },
    "one latest passport size photograph of father": {
      bn: "পিতার ১ কপি সাম্প্রতিক পাসপোর্ট সাইজের ছবি",
      ar: "صورة شمسية حديثة للأب بحجم جواز السفر",
      hi: "पिता की एक नवीनतम पासपोर्ट आकार की तस्वीर",
    },
    "photocopy of progress card (of previous academic year)": {
      bn: "প্রগ্রেস কার্ডের ফটোকপি (পূর্ববর্তী শিক্ষাবর্ষের)",
      ar: "نسخة من بطاقة التقدم (للعام الدراسي السابق)",
      hi: "प्रगति पत्र की छायाप्रति (पिछले शैक्षणिक वर्ष की)",
    },
  };

  if (docMaps[lower]) {
    if (langCode === "bn") return docMaps[lower].bn;
    if (langCode === "ar") return docMaps[lower].ar;
    if (langCode === "hi") return docMaps[lower].hi;
  }
  return trimmed;
}

/**
 * Translates document file names, preserving extension.
 */
export function translateDocumentFileName(fileName?: string | null, langCode: string = "en"): string {
  if (!fileName) return "";
  const trimmed = fileName.trim();
  const pdfMatch = trimmed.match(/^(.+?)(\.[a-zA-Z0-9]+)$/);
  if (pdfMatch) {
    const base = pdfMatch[1];
    const ext = pdfMatch[2];
    const transBase = translateDocumentTitle(base, langCode);
    return `${transBase}${ext}`;
  }
  return translateDocumentTitle(trimmed, langCode);
}

/**
 * Translates incident titles in student behavior records.
 */
export function translateIncidentTitle(title?: string | null, langCode: string = "en"): string {
  if (!title) return "";
  const trimmed = title.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "incident") {
    if (langCode === "bn") return "ঘটনা";
    if (langCode === "ar") return "حادثة";
    if (langCode === "hi") return "घटना";
  }
  return trimmed;
}

/**
 * Translates fee payment modes (Cash, Online, Bank, Cheque, Card).
 */
export function translatePaymentMode(mode?: string | null, langCode: string = "en"): string {
  if (!mode) return "";
  const lower = mode.trim().toLowerCase();
  if (langCode === "bn") {
    const map: Record<string, string> = { cash: "নগদ", online: "অনলাইন", bank: "ব্যাংক", cheque: "চেক", card: "কার্ড" };
    return map[lower] || mode;
  }
  if (langCode === "ar") {
    const map: Record<string, string> = { cash: "نقداً", online: "عبر الإنترنت", bank: "تحويل بنكي", cheque: "شيك", card: "بطاقة" };
    return map[lower] || mode;
  }
  if (langCode === "hi") {
    const map: Record<string, string> = { cash: "नकद", online: "ऑनलाइन", bank: "बैंक", cheque: "चेक", card: "कार्ड" };
    return map[lower] || mode;
  }
  return mode;
}

/**
 * Translates boolean or yes/no values based on language code.
 */
export function translateYesNo(val?: string | boolean | null, langCode: string = "en"): string {
  if (val === null || val === undefined) return "";
  const str = String(val).trim().toLowerCase();
  if (str === "yes" || str === "true" || str === "1") {
    if (langCode === "bn") return "হ্যাঁ";
    if (langCode === "ar") return "نعم";
    if (langCode === "hi") return "हाँ";
    return "Yes";
  }
  if (str === "no" || str === "false" || str === "0") {
    if (langCode === "bn") return "না";
    if (langCode === "ar") return "لا";
    if (langCode === "hi") return "नहीं";
    return "No";
  }
  return String(val);
}

/**
 * Translates standard school fee names (e.g. "January Month Fees", "Admission Fee", etc.).
 */
export function translateFeeName(name?: string | null, langCode: string = "en"): string {
  if (!name) return "";
  const trimmed = name.trim();

  // Pattern with parentheses: "Fee Name (Code)"
  const parenMatch = trimmed.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (parenMatch) {
    const feePart = parenMatch[1].trim();
    const codePart = parenMatch[2].trim();
    return `${translateFeeName(feePart, langCode)} (${toLocaleNumber(codePart, langCode)})`;
  }

  const lower = trimmed.toLowerCase();

  // Pattern: "<Month> Month Fees" or "<Month> Month Fee" or "<Month> Fees" or "<Month> Fee"
  const monthMatch = trimmed.match(/^([A-Za-z]+)(?:\s+Month)?\s+Fees?$/i);
  if (monthMatch) {
    const month = monthMatch[1];
    const transMonth = translateMonthName(month, langCode);
    if (transMonth && transMonth.toLowerCase() !== month.toLowerCase()) {
      if (langCode === "bn") return `${transMonth} মাসের ফি`;
      if (langCode === "ar") return `رسوم شهر ${transMonth}`;
      if (langCode === "hi") return `${transMonth} महीने का शुल्क`;
      return `${month} Month Fees`;
    }
  }

  // Pattern with dash: "<Month>-Month-Fees" or "<Month>-Month-Fee"
  const dashMatch = trimmed.match(/^([A-Za-z]+)-Month-Fees?$/i);
  if (dashMatch) {
    const month = dashMatch[1];
    const transMonth = translateMonthName(month, langCode);
    if (transMonth && transMonth.toLowerCase() !== month.toLowerCase()) {
      if (langCode === "bn") return `${transMonth}-মাসের-ফি`;
      if (langCode === "ar") return `رسوم-شهر-${transMonth}`;
      if (langCode === "hi") return `${transMonth}-महीने-का-शुल्क`;
      return `${month}-Month-Fees`;
    }
  }

  if (langCode === "bn") {
    const map: Record<string, string> = {
      "admission fee": "ভর্তি ফি",
      "admission fees": "ভর্তি ফি",
      "tuition fee": "টিউশন ফি",
      "tuition fees": "টিউশন ফি",
      "exam fee": "পরীক্ষার ফি",
      "exam fees": "পরীক্ষার ফি",
      "transport fee": "পরিবহন ফি",
      "transport fees": "পরিবহন ফি",
      "library fee": "লাইব্রেরি ফি",
      "library fees": "লাইব্রেরি ফি",
      "hostel fee": "হোস্টেল ফি",
      "hostel fees": "হোস্টেল ফি",
      "lab fee": "ল্যাব ফি",
      "lab fees": "ল্যাব ফি",
      "laboratory fee": "ল্যাবরেটরি ফি",
      "sports fee": "খেলাধুলা ফি",
      "development fee": "উন্নয়ন ফি",
      "annual fee": "বার্ষিক ফি",
      "annual fees": "বার্ষিক ফি",
      "registration fee": "নিবন্ধন ফি",
      "registration fees": "নিবন্ধন ফি",
      "session fee": "সেশন ফি",
      "session fees": "সেশন ফি",
      "computer fee": "কম্পিউটার ফি",
      "computer fees": "কম্পিউটার ফি",
    };
    if (map[lower]) return map[lower];
  }

  if (langCode === "ar") {
    const map: Record<string, string> = {
      "admission fee": "رسوم القبول",
      "admission fees": "رسوم القبول",
      "tuition fee": "الرسوم الدراسية",
      "tuition fees": "الرسوم الدراسية",
      "exam fee": "رسوم الامتحان",
      "exam fees": "رسوم الامتحان",
      "transport fee": "رسوم النقل",
      "transport fees": "رسوم النقل",
      "library fee": "رسوم المكتبة",
      "library fees": "رسوم المكتبة",
      "hostel fee": "رسوم السكن",
      "hostel fees": "رسوم السكن",
      "lab fee": "رسوم المختبر",
      "lab fees": "رسوم المختبر",
      "laboratory fee": "رسوم المختبر",
      "sports fee": "الرسوم الرياضية",
      "development fee": "رسوم التطوير",
      "annual fee": "الرسوم السنوية",
      "annual fees": "الرسوم السنوية",
      "registration fee": "رسوم التسجيل",
      "registration fees": "رسوم التسجيل",
      "session fee": "رسوم الفصل الدراسي",
      "session fees": "رسوم الفصل الدراسي",
      "computer fee": "رسوم الحاسوب",
      "computer fees": "رسوم الحاسوب",
    };
    if (map[lower]) return map[lower];
  }

  if (langCode === "hi") {
    const map: Record<string, string> = {
      "admission fee": "प्रवेश शुल्क",
      "admission fees": "प्रवेश शुल्क",
      "tuition fee": "ट्यूशन शुल्क",
      "tuition fees": "ट्यूशन शुल्क",
      "exam fee": "परीक्षा शुल्क",
      "exam fees": "परीक्षा शुल्क",
      "transport fee": "परिवहन शुल्क",
      "transport fees": "परिवहन शुल्क",
      "library fee": "पुस्तकालय शुल्क",
      "library fees": "पुस्तकालय शुल्क",
      "hostel fee": "छात्रावास शुल्क",
      "hostel fees": "छात्रावास शुल्क",
      "lab fee": "प्रयोगशाला शुल्क",
      "lab fees": "प्रयोगशाला शुल्क",
      "laboratory fee": "प्रयोगशाला शुल्क",
      "sports fee": "खेल शुल्क",
      "development fee": "विकास शुल्क",
      "annual fee": "वार्षिक शुल्क",
      "annual fees": "वार्षिक शुल्क",
      "registration fee": "पंजीकरण शुल्क",
      "registration fees": "पंजीकरण शुल्क",
      "session fee": "सत्र शुल्क",
      "session fees": "सत्र शुल्क",
      "computer fee": "कंप्यूटर शुल्क",
      "computer fees": "कंप्यूटर शुल्क",
    };
    if (map[lower]) return map[lower];
  }

  return trimmed;
}

/**
 * Translates fee payment status (Paid, Unpaid, Partial, Pending).
 */
export function translateFeeStatus(status?: string | null, langCode: string = "en"): string {
  if (!status) return "";
  const trimmed = status.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    if (lower === "paid") return "পরিশোধিত";
    if (lower === "unpaid") return "অপরিশোধিত";
    if (lower === "partial") return "আংশিক";
    if (lower === "pending") return "মুলতুবি";
  }

  if (langCode === "ar") {
    if (lower === "paid") return "مدفوع";
    if (lower === "unpaid") return "غير مدفوع";
    if (lower === "partial") return "جزئي";
    if (lower === "pending") return "قيد الانتظار";
  }

  if (langCode === "hi") {
    if (lower === "paid") return "भुगतान किया गया";
    if (lower === "unpaid") return "अदत्त";
    if (lower === "partial") return "आंशिक";
    if (lower === "pending") return "लंबित";
  }

  return trimmed.toUpperCase();
}

/**
 * Translates leave type names (Casual Leave, Medical Leave, Sick Leave, Maternity Leave, etc.)
 */
export function translateLeaveType(name?: string | null, langCode: string = "en"): string {
  if (!name) return "";
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    const bnMap: Record<string, string> = {
      "casual leave": "নৈমিত্তিক ছুটি",
      "medical leave": "চিকিৎসা ছুটি",
      "sick leave": "অসুস্থতাজনিত ছুটি",
      "maternity leave": "মাতৃত্বকালীন ছুটি",
      "earned leave": "অর্জিত ছুটি",
      "study leave": "অধ্যয়ন ছুটি",
      "special leave": "বিশেষ ছুটি",
      "half day leave": "অর্ধদিবস ছুটি",
    };
    if (bnMap[lower]) return bnMap[lower];
  }

  if (langCode === "ar") {
    const arMap: Record<string, string> = {
      "casual leave": "إجازة عارضة",
      "medical leave": "إجازة مرضية",
      "sick leave": "إجازة مرضية",
      "maternity leave": "إجازة أمومة",
      "earned leave": "إجازة مستحقة",
      "study leave": "إجازة دراسية",
      "special leave": "إجازة خاصة",
      "half day leave": "إجازة نصف يوم",
    };
    if (arMap[lower]) return arMap[lower];
  }

  if (langCode === "hi") {
    const hiMap: Record<string, string> = {
      "casual leave": "आकस्मिक अवकाश",
      "medical leave": "चिकित्सा अवकाश",
      "sick leave": "बीमारी का अवकाश",
      "maternity leave": "मातृत्व अवकाश",
      "earned leave": "अर्जित अवकाश",
      "study leave": "अध्ययन अवकाश",
      "special leave": "विशेष अवकाश",
      "half day leave": "आधे दिन का अवकाश",
    };
    if (hiMap[lower]) return hiMap[lower];
  }

  return trimmed;
}

/**
 * Translates time strings like "10:09 AM" or "AM 10:09" or "10:09:00" with localized AM/PM and digits.
 */
export function translateExamTimeString(timeStr?: string | null, langCode: string = "en"): string {
  if (!timeStr) return "";
  const trimmed = timeStr.trim();

  const isPM = /PM/i.test(trimmed);
  const isAM = /AM/i.test(trimmed);

  // Strip AM/PM
  const timeOnly = trimmed.replace(/\s*(AM|PM)\s*/gi, "").trim();
  const localizedDigits = toLocaleNumber(timeOnly, langCode);

  if (isAM) {
    if (langCode === "ar") return `${localizedDigits} ص`;
    if (langCode === "bn") return `সকাল ${localizedDigits}`;
    if (langCode === "hi") return `पूर्वाह्न ${localizedDigits}`;
    return `${localizedDigits} AM`;
  }

  if (isPM) {
    if (langCode === "ar") return `${localizedDigits} م`;
    if (langCode === "bn") return `বিকাল ${localizedDigits}`;
    if (langCode === "hi") return `अपराह्न ${localizedDigits}`;
    return `${localizedDigits} PM`;
  }

  return localizedDigits;
}

/**
 * Formats and translates duration like "60 MIN" -> "60 دقيقة" / "৬০ মিনিট" / "60 मिनट".
 */
export function translateDurationMinutes(minutes: number | string | undefined | null, langCode: string = "en"): string {
  if (minutes === undefined || minutes === null || minutes === "") return "";
  const localizedNum = toLocaleNumber(minutes, langCode);

  if (langCode === "ar") return `${localizedNum} دقيقة`;
  if (langCode === "bn") return `${localizedNum} মিনিট`;
  if (langCode === "hi") return `${localizedNum} मिनट`;
  return `${localizedNum} MIN`;
}

/**
 * Formats a date string (ISO / YYYY-MM-DD / Date) into localized month name, day, and year.
 * e.g., "2026-07-11" -> "Jul 11, 2026" / "١١ يوليو ٢٠٢٦" / "১১ জুলাই, ২০২৬" / "11 जुलाई, 2026".
 */
export function formatLocalizedDate(
  dateInput?: string | Date | null,
  langCode: string = "en"
): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return typeof dateInput === "string" ? dateInput : "";

  const monthNamesEn = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
  ];

  const monthName = translateMonthName(monthNamesEn[d.getMonth()], langCode);
  const day = toLocaleNumber(d.getDate(), langCode);
  const year = toLocaleNumber(d.getFullYear(), langCode);

  if (langCode === "ar") {
    return `${day} ${monthName} ${year}`;
  }
  if (langCode === "bn") {
    return `${day} ${monthName}, ${year}`;
  }
  if (langCode === "hi") {
    return `${day} ${monthName}, ${year}`;
  }

  const shortMonth = d.toLocaleDateString("en-US", { month: "short" });
  return `${shortMonth} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * Translates class routine schedule strings like:
 * "Monday (09:00 AM To 09:45 AM)" or "Monday (09:00 AM - 09:45 AM)"
 */
export function translateClassScheduleTime(scheduleStr?: string | null, langCode: string = "en"): string {
  if (!scheduleStr) return "";
  const trimmed = scheduleStr.trim();

  // Pattern: Day (Start_Time To/ - End_Time)
  const match = trimmed.match(/^([a-zA-Z]+)\s*\(([^)]+)\)$/);
  if (!match) {
    return toLocaleNumber(trimmed, langCode);
  }

  const dayStr = match[1].trim();
  const timeRange = match[2].trim();

  const daysOfWeekMap: Record<string, Record<string, string>> = {
    bn: {
      monday: "সোমবার",
      tuesday: "মঙ্গলবার",
      wednesday: "বুধবার",
      thursday: "বৃহস্পতিবার",
      friday: "শুক্রবার",
      saturday: "শনিবার",
      sunday: "রবিবার",
    },
    ar: {
      monday: "الإثنين",
      tuesday: "الثلاثاء",
      wednesday: "الأربعاء",
      thursday: "الخميس",
      friday: "الجمعة",
      saturday: "السبت",
      sunday: "الأحد",
    },
    hi: {
      monday: "सोमवार",
      tuesday: "मंगलवार",
      wednesday: "बुधवार",
      thursday: "गुरुवार",
      friday: "शुक्रवार",
      saturday: "शनिवार",
      sunday: "रविवार",
    },
  };

  const dayLower = dayStr.toLowerCase();
  const transDay = daysOfWeekMap[langCode]?.[dayLower] || dayStr;

  // Split time range by "To" or "-"
  const timeParts = timeRange.split(/\s+(?:to|-|–)\s+/i);
  if (timeParts.length === 2) {
    const t1 = translateExamTimeString(timeParts[0], langCode);
    const t2 = translateExamTimeString(timeParts[1], langCode);

    if (langCode === "ar") {
      return `${transDay} (${t1} إلى ${t2})`;
    }
    if (langCode === "bn") {
      return `${transDay} (${t1} হতে ${t2})`;
    }
    if (langCode === "hi") {
      return `${transDay} (${t1} से ${t2})`;
    }
    return `${transDay} (${t1} To ${t2})`;
  }

  return `${transDay} (${toLocaleNumber(timeRange, langCode)})`;
}

/**
 * Translates teacher/staff names with codes, e.g. "Alice Teacher (STF454408823)"
 */
export function translateTeacherStaffName(name?: string | null, langCode: string = "en"): string {
  if (!name) return "";
  const trimmed = name.trim();

  // Pattern: Name (CODE123)
  const match = trimmed.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (match) {
    const baseName = match[1].trim();
    const code = match[2].trim();
    const transCode = toLocaleNumber(code, langCode);
    return `${baseName} (${transCode})`;
  }

  return trimmed;
}

/**
 * Translates room numbers/labels (e.g. "101", "Room 101", "Room-101").
 */
export function translateRoomNumber(room?: string | number | null, langCode: string = "en"): string {
  if (room === undefined || room === null || room === "") return "";
  const str = String(room).trim();

  // Pattern: "Room 101" / "Room-101" / "Room #101"
  const match = str.match(/^Room\s*[-#:]?\s*(\d+)$/i);
  if (match) {
    const num = toLocaleNumber(match[1], langCode);
    if (langCode === "ar") return `قاعة ${num}`;
    if (langCode === "bn") return `কক্ষ ${num}`;
    if (langCode === "hi") return `कक्ष ${num}`;
    return `Room ${num}`;
  }

  return toLocaleNumber(str, langCode);
}

/**
 * Translates academic book titles across languages (English, Bengali, Arabic, Hindi).
 */
export function translateBookTitle(title?: string | null, langCode: string = "en"): string {
  if (!title) return "";
  const trimmed = title.trim();
  const lower = trimmed.toLowerCase();

  if (langCode === "bn") {
    const bnMap: Record<string, string> = {
      "english for today": "ইংলিশ ফর টুডে",
      "anondo path (bangla rapid reader)": "আনন্দ পাঠ (বাংলা দ্রুত পঠন)",
      "anondo path": "আনন্দ পাঠ",
      "secondary mathematics": "মাধ্যমিক গণিত",
      "higher mathematics": "উচ্চতর গণিত",
      "general science": "সাধারণ বিজ্ঞান",
      "bangladesh and global studies": "বাংলাদেশ ও বিশ্বপরিচয়",
      "physics": "পদার্থবিজ্ঞান",
      "chemistry": "রসায়ন",
      "biology": "জীববিজ্ঞান",
    };
    if (bnMap[lower]) return bnMap[lower];
  }

  if (langCode === "ar") {
    const arMap: Record<string, string> = {
      "english for today": "اللغة الإنجليزية لليوم",
      "anondo path (bangla rapid reader)": "طريق السعادة (القراءة السريعة للبنغالية)",
      "anondo path": "طريق السعادة",
      "secondary mathematics": "الرياضيات للمرحلة الثانوية",
      "higher mathematics": "الرياضيات المتقدمة",
      "general science": "العلوم العامة",
      "bangladesh and global studies": "بنغلاديش والدراسات العالمية",
      "physics": "الفيزياء",
      "chemistry": "الكيمياء",
      "biology": "الأحياء",
    };
    if (arMap[lower]) return arMap[lower];
  }

  if (langCode === "hi") {
    const hiMap: Record<string, string> = {
      "english for today": "इंग्लिश फॉर टुडे",
      "anondo path (bangla rapid reader)": "आनंद पाठ (बांग्ला त्वरित वाचन)",
      "anondo path": "आनंद पाठ",
      "secondary mathematics": "माध्यमिक गणित",
      "higher mathematics": "उच्चतर गणित",
      "general science": "सामान्य विज्ञान",
      "bangladesh and global studies": "बांग्लादेश और वैश्विक अध्ययन",
      "physics": "भौतिकी",
      "chemistry": "रसायन विज्ञान",
      "biology": "जीव विज्ञान",
    };
    if (hiMap[lower]) return hiMap[lower];
  }

  return trimmed;
}
