"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    Search,
    FileText,
    Users,
    Wallet,
    CalendarDays,
    Copy,
    FileSpreadsheet,
    FileBox,
    Printer,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Filter,
} from "lucide-react";
import { cn, toLocaleNumber } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import { useLanguage } from "@/components/providers/language-provider";

const reportLinks = [
    { id: "Staff Report", key: "staff_report", icon: Users },
    { id: "Payroll Report", key: "payroll_report", icon: Wallet },
    { id: "Leave Request Report", key: "leave_request_report", icon: CalendarDays },
    { id: "My Leave Request Report", key: "my_leave_request_report", icon: UserIcon },
];

function UserIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
    );
}

interface StaffData {
    id: string;
    role: string;
    designation: string;
    department: string;
    name: string;
    fatherName: string;
    motherName: string;
    email: string;
    gender: string;
    dob: string;
    doj: string;
    phone: string;
    emergency: string;
    marital: string;
    currentAddress: string;
    permanentAddress: string;
    qualification: string;
    experience: string;
    note: string;
    epf: string;
    salary: string;
    contract: string;
    shift: string;
    location: string;
    leaves: string[];
}

interface PayrollData {
    name: string;
    role: string;
    designation: string;
    monthYear: string;
    payslip: string;
    basic: number;
    earning: number;
    deduction: number;
    gross: number;
    tax: number;
    net: number;
}

interface LeaveData {
    staff: string;
    leaveType: string;
    halfDay: string;
    doj: string;
    applyDate: string;
    leaveDate: string;
    days: string;
    status: string;
}

interface MyLeaveData {
    staff: string;
    leaveType: string;
    halfDay: string;
    applyDate: string;
    leaveDate: string;
    days: string;
    status: string;
}

function TableSkeleton({ cols }: { cols: number }) {
    return (
        <>
            {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3">
                            <Skeleton className="h-4 rounded" style={{ width: `${55 + ((i * 3 + j * 7) % 35)}%` }} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

function translateRoleName(role?: string | null, langCode: string = "en"): string {
    if (!role) return "";
    if (langCode === "en") return role;
    const r = role.toLowerCase().trim();
    if (r === "super admin") return langCode === "bn" ? "সুপার অ্যাডমিন" : langCode === "ar" ? "مسؤول متميز" : "सुपर एडमिन";
    if (r === "branch admin") return langCode === "bn" ? "শাখা অ্যাডমিন" : langCode === "ar" ? "مسؤول الفرع" : "शाखा व्यवस्थापक";
    if (r === "admin") return langCode === "bn" ? "অ্যাডমিন" : langCode === "ar" ? "مسؤول" : "व्यवस्थापक";
    if (r === "teacher") return langCode === "bn" ? "শিক্ষক" : langCode === "ar" ? "معلم" : "शिक्षक";
    if (r === "accountant") return langCode === "bn" ? "হিসাবরক্ষক" : langCode === "ar" ? "محاسب" : "लेखाकार";
    if (r === "librarian") return langCode === "bn" ? "গ্রন্থাগারিক" : langCode === "ar" ? "أمين مكتبة" : "पुस्तकालय अध्यक्ष";
    if (r === "receptionist") return langCode === "bn" ? "অভ্যর্থনাকারী" : langCode === "ar" ? "موظف استقبال" : "रिसेप्शनिस्ट";
    if (r === "driver") return langCode === "bn" ? "চালক" : langCode === "ar" ? "سائق" : "चालक";
    if (r === "staff") return langCode === "bn" ? "কর্মী" : langCode === "ar" ? "موظف" : "स्टाफ";
    if (r === "student") return langCode === "bn" ? "শিক্ষার্থী" : langCode === "ar" ? "طالب" : "छात्र";
    if (r === "parent") return langCode === "bn" ? "অভিভাবক" : langCode === "ar" ? "ولي الأمر" : "अभिभावक";
    return role;
}

function translateDesignationName(designation?: string | null, langCode: string = "en"): string {
    if (!designation) return "";
    if (langCode === "en") return designation;
    const d = designation.toLowerCase().trim();
    if (d === "admin") return langCode === "bn" ? "অ্যাডমিন" : langCode === "ar" ? "مسؤول" : "व्यवस्थापक";
    if (d === "librarian") return langCode === "bn" ? "গ্রন্থাগারিক" : langCode === "ar" ? "أمين مكتبة" : "पुस्तकालय अध्यक्ष";
    if (d === "receptionist") return langCode === "bn" ? "অভ্যর্থনাকারী" : langCode === "ar" ? "موظف استقبال" : "रिसेप्शनिस्ट";
    if (d === "accountant") return langCode === "bn" ? "হিসাবরক্ষক" : langCode === "ar" ? "محاسب" : "लेखाकार";
    if (d === "driver") return langCode === "bn" ? "চালক" : langCode === "ar" ? "سائق" : "चालक";
    if (d === "technical head") return langCode === "bn" ? "কারিগরি প্রধান" : langCode === "ar" ? "رئيس القسم التقني" : "तकनीकी प्रमुख";
    if (d === "subject teacher") return langCode === "bn" ? "বিষয় শিক্ষক" : langCode === "ar" ? "معلم مادة" : "विषय शिक्षक";
    if (d === "principal" || d === "headmaster") return langCode === "bn" ? "প্রধান শিক্ষক" : langCode === "ar" ? "مدير المدرسة" : "प्रधानाचार्य";
    if (d === "assistant teacher" || d === "assistant professor") return langCode === "bn" ? "সহকারী শিক্ষক" : langCode === "ar" ? "معلم مساعد" : "सहायक शिक्षक";
    if (d === "senior teacher") return langCode === "bn" ? "সিনিয়র শিক্ষক" : langCode === "ar" ? "معلم أول" : "वरिष्ठ शिक्षक";
    if (d === "lecturer") return langCode === "bn" ? "প্রভাষক" : langCode === "ar" ? "محاضر" : "व्याख्याता";
    if (d === "faculty") return langCode === "bn" ? "অনুষদ" : langCode === "ar" ? "عضو هيئة تدريس" : "संकाय";
    return designation;
}

function translateDepartment(dept?: string | null, langCode: string = "en"): string {
    if (!dept) return "";
    if (langCode === "en") return dept;
    const d = dept.toLowerCase().trim();
    if (d === "admin" || d === "administration") return langCode === "bn" ? "প্রশাসন" : langCode === "ar" ? "الإدارة" : "प्रशासन";
    if (d === "academic" || d === "academics") return langCode === "bn" ? "একাডেমিক" : langCode === "ar" ? "أكاديمي" : "अकादमिक";
    if (d === "management") return langCode === "bn" ? "ব্যবস্থাপনা" : langCode === "ar" ? "الإدارة" : "प्रबंधन";
    if (d === "finance") return langCode === "bn" ? "অর্থ" : langCode === "ar" ? "المالية" : "वित्त";
    if (d === "library") return langCode === "bn" ? "গ্রন্থাগার" : langCode === "ar" ? "المكتبة" : "पुस्तकालय";
    if (d === "transport") return langCode === "bn" ? "পরিবহন" : langCode === "ar" ? "النقل" : "परिवहन";
    if (d === "human resource" || d === "hr") return langCode === "bn" ? "মানব সম্পদ" : langCode === "ar" ? "الموارد البشرية" : "मानव संसाधन";
    if (d === "it" || d === "information technology") return langCode === "bn" ? "তথ্য প্রযুক্তি" : langCode === "ar" ? "تقنية المعلومات" : "सूचना प्रौद्योगिकी";
    return dept;
}

function translatePersonName(name?: string | null, langCode: string = "en"): string {
    if (!name || name === "-") return name || "";
    if (langCode === "en") return name;
    const n = name.trim();
    if (n === "Joe Black") return langCode === "bn" ? "জো ব্ল্যাক" : langCode === "ar" ? "جو بلاك" : "जो ब्लैक";
    if (n === "Will Black") return langCode === "bn" ? "উইল ব্ল্যাক" : langCode === "ar" ? "ويل بلاك" : "विल ब्लैक";
    if (n === "Mini Black") return langCode === "bn" ? "মিনি ব্ল্যাক" : langCode === "ar" ? "ميني بلاك" : "मिनी ब्लैक";
    if (n === "Sarah Jenkins") return langCode === "bn" ? "সারাহ জেনকিন্স" : langCode === "ar" ? "سارة جنكينز" : "सारा जेनकिंस";
    if (n === "Robert Jenkins") return langCode === "bn" ? "রবার্ট জেনকিন্স" : langCode === "ar" ? "روبرت جنكينز" : "रॉबर्ट जेनकिंस";
    if (n === "Alice Jenkins") return langCode === "bn" ? "অ্যালিস জেনকিন্স" : langCode === "ar" ? "أليس جنكينز" : "एलिस जेनकिंस";
    if (n === "William Abbot") return langCode === "bn" ? "উইলিয়াম অ্যাবট" : langCode === "ar" ? "ويليام أبوت" : "विलियम एबट";
    return name;
}

function translateStaffWithId(raw?: string | null, langCode: string = "en"): string {
    if (!raw) return "";
    if (langCode === "en") return raw;
    const match = raw.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
        const namePart = translatePersonName(match[1], langCode);
        const idPart = toLocaleNumber(match[2], langCode);
        return `${namePart} (${idPart})`;
    }
    return translatePersonName(raw, langCode);
}

function translateQualification(qual?: string | null, langCode: string = "en"): string {
    if (!qual) return "";
    if (langCode === "en") return qual;
    const q = qual.trim();
    if (q === "MS" || q === "M.S") return langCode === "bn" ? "এম.এস" : langCode === "ar" ? "ماجستير العلوم" : "एम.एस";
    if (q === "M.Ed" || q === "M.E.d") return langCode === "bn" ? "এম.এড" : langCode === "ar" ? "ماجستير التربية" : "एम.এড";
    if (q === "B.Ed" || q === "B.E.d") return langCode === "bn" ? "বি.এড" : langCode === "ar" ? "بكالوريوس التربية" : "बी.এড";
    if (q === "B.Sc" || q === "B.S.c") return langCode === "bn" ? "বি.এসসি" : langCode === "ar" ? "بكالوريوس علوم" : "बी.एससी";
    if (q === "M.Sc" || q === "M.S.c") return langCode === "bn" ? "এম.এসসি" : langCode === "ar" ? "ماجستير علوم" : "एम.এসসি";
    return qual;
}

function translateExperience(exp?: string | null, langCode: string = "en"): string {
    if (!exp) return "";
    if (langCode === "en") return exp;
    const match = exp.match(/(\d+)\s*Yrs?/i);
    if (match) {
        const yrs = toLocaleNumber(match[1], langCode);
        const suffix = langCode === "bn" ? "বছর" : langCode === "ar" ? "سنوات" : langCode === "hi" ? "वर्ष" : "Yrs";
        return `${yrs} ${suffix}`;
    }
    return toLocaleNumber(exp, langCode);
}

function translateNote(note?: string | null, langCode: string = "en"): string {
    if (!note) return "";
    if (langCode === "en") return note;
    const n = note.trim();
    if (n === "Specialist in Math") {
        return langCode === "bn" ? "গণিতে বিশেষজ্ঞ" : langCode === "ar" ? "متخصص في الرياضيات" : "गणित विशेषज्ञ";
    }
    return note;
}

function translateContract(contract?: string | null, langCode: string = "en"): string {
    if (!contract) return "";
    if (langCode === "en") return contract;
    const c = contract.toLowerCase().trim();
    if (c === "permanent") return langCode === "bn" ? "স্থায়ী" : langCode === "ar" ? "دائم" : "स्थायी";
    if (c === "contractual") return langCode === "bn" ? "চুক্তিভিত্তিক" : langCode === "ar" ? "تعاقدي" : "संविदात्मक";
    if (c === "temporary") return langCode === "bn" ? "অস্থায়ী" : langCode === "ar" ? "مؤقت" : "अस्थायी";
    if (c === "probation") return langCode === "bn" ? "শিক্ষানবিস" : langCode === "ar" ? "تحت التجربة" : "परिवीक्षा";
    return contract;
}

function translateWorkShift(shift?: string | null, langCode: string = "en"): string {
    if (!shift) return "";
    if (langCode === "en") return shift;
    const s = shift.toLowerCase().trim();
    if (s === "morning") return langCode === "bn" ? "সকাল" : langCode === "ar" ? "صباحي" : "सुबह";
    if (s === "day") return langCode === "bn" ? "দিন" : langCode === "ar" ? "نهاري" : "दिन";
    if (s === "evening") return langCode === "bn" ? "সন্ধ্যা" : langCode === "ar" ? "مسائي" : "शाम";
    if (s === "night") return langCode === "bn" ? "রাত" : langCode === "ar" ? "ليلي" : "रात";
    return shift;
}

function translateWorkLocation(loc?: string | null, langCode: string = "en"): string {
    if (!loc) return "";
    if (langCode === "en") return loc;
    const l = loc.toLowerCase().trim();
    if (l === "ground floor") return langCode === "bn" ? "নিচতলা" : langCode === "ar" ? "الطابق الأرضي" : "भूतल";
    if (l === "1st floor" || l === "first floor") return langCode === "bn" ? "১ম তলা" : langCode === "ar" ? "الطابق الأول" : "पहली मंजिल";
    if (l === "2nd floor" || l === "second floor") return langCode === "bn" ? "২য় তলা" : langCode === "ar" ? "الطابق الثاني" : "दूसरी मंजिल";
    if (l === "block a") return langCode === "bn" ? "ব্লক এ" : langCode === "ar" ? "المبنى أ" : "ब्लॉक ए";
    if (l === "block b") return langCode === "bn" ? "ব্লক বি" : langCode === "ar" ? "المبنى ب" : "ब्लॉक बी";
    return loc;
}

function translateLeaveType(type?: string | null, langCode: string = "en"): string {
    if (!type) return "";
    if (langCode === "en") return type;
    const tLower = type.toLowerCase().trim();
    if (tLower === "medical leave") return langCode === "bn" ? "চিকিৎসা ছুটি" : langCode === "ar" ? "إجازة مرضية" : "चिकित्सा अवकाश";
    if (tLower === "casual leave") return langCode === "bn" ? "নৈমিত্তিক ছুটি" : langCode === "ar" ? "إجازة عارضة" : "आकस्मिक अवकाश";
    if (tLower === "maternity leave") return langCode === "bn" ? "মাতৃত্বকালীন ছুটি" : langCode === "ar" ? "إجازة أمومة" : "मातृत्व अवकाश";
    if (tLower === "sick leave") return langCode === "bn" ? "অসুস্থতাজনিত ছুটি" : langCode === "ar" ? "إجازة مرضية" : "बीमारी की छुट्टी";
    return type;
}

function translateLeaveItem(leaveItem: string, langCode: string = "en"): string {
    if (!leaveItem) return "";
    if (langCode === "en") return leaveItem;
    const parts = leaveItem.split(":");
    if (parts.length === 2) {
        const typeTranslated = translateLeaveType(parts[0].trim(), langCode);
        const countFormatted = toLocaleNumber(parts[1].trim(), langCode);
        return `${typeTranslated}: ${countFormatted}`;
    }
    return leaveItem;
}

function translateMarital(marital?: string | null, langCode: string = "en"): string {
    if (!marital) return "";
    if (langCode === "en") return marital;
    const m = marital.toLowerCase().trim();
    if (m === "married") return langCode === "bn" ? "বিবাহিত" : langCode === "ar" ? "متزوج" : "विवाहित";
    if (m === "single") return langCode === "bn" ? "অবিবাহিত" : langCode === "ar" ? "أعزب" : "अविवाहित";
    if (m === "divorced") return langCode === "bn" ? "তালাকপ্রাপ্ত" : langCode === "ar" ? "مطلق" : "तलाकशुदा";
    return marital;
}

function translateAddress(addr?: string | null, langCode: string = "en"): string {
    if (!addr) return "";
    if (langCode === "en") return addr;
    if (addr.includes("9837 Temple Apartment")) {
        const num = toLocaleNumber(9837, langCode);
        const name = langCode === "bn" ? "টেম্পল অ্যাপার্টমেন্ট" : langCode === "ar" ? "شقة المعبد" : "टेम्पल अपार्टमेंट";
        return `${num} ${name}`;
    }
    if (addr.includes("123 School Lane")) {
        const num = toLocaleNumber(123, langCode);
        const name = langCode === "bn" ? "স্কুল লেন" : langCode === "ar" ? "ممر المدرسة" : "स्कूल लेन";
        return `${num} ${name}`;
    }
    return toLocaleNumber(addr, langCode);
}

function translateMonthYear(monthYear?: string | null, langCode: string = "en"): string {
    if (!monthYear) return "";
    if (langCode === "en") return monthYear;
    const parts = monthYear.split(" - ");
    if (parts.length === 2) {
        const m = parts[0].trim().toLowerCase();
        const monthNames: Record<string, { bn: string; ar: string; hi: string }> = {
            january: { bn: "জানুয়ারি", ar: "يناير", hi: "जनवरी" },
            february: { bn: "ফেব্রুয়ারি", ar: "فبراير", hi: "फरवरी" },
            march: { bn: "মার্চ", ar: "مارس", hi: "मार्च" },
            april: { bn: "এপ্রিল", ar: "أبريل", hi: "अप्रैल" },
            may: { bn: "মে", ar: "مايو", hi: "मई" },
            june: { bn: "জুন", ar: "يونيو", hi: "जून" },
            july: { bn: "জুলাই", ar: "يوليو", hi: "जुलाई" },
            august: { bn: "আগস্ট", ar: "অগাস্ট", hi: "अगस्त" },
            september: { bn: "সেপ্টেম্বর", ar: "سبتمبر", hi: "सितंबर" },
            october: { bn: "অক্টোবর", ar: "أكتوبر", hi: "अक्टूबर" },
            november: { bn: "নভেম্বর", ar: "نوفمبر", hi: "नवंबर" },
            december: { bn: "ডিসেম্বর", ar: "ديسمبر", hi: "दिसंबर" },
        };
        const transM = monthNames[m] ? (monthNames[m][langCode as "bn" | "ar" | "hi"] || parts[0]) : parts[0];
        const transY = toLocaleNumber(parts[1].trim(), langCode);
        return `${transM} - ${transY}`;
    }
    return monthYear;
}

function translateGender(gender?: string | null, langCode: string = "en"): string {
    if (!gender) return "";
    if (langCode === "en") return gender;
    const g = gender.toLowerCase().trim();
    if (g === "male") return langCode === "bn" ? "পুরুষ" : langCode === "ar" ? "ذكر" : "पुरुष";
    if (g === "female") return langCode === "bn" ? "মহিলা" : langCode === "ar" ? "أنثى" : "महिला";
    return gender;
}

function formatDateDDMMYYYY(dateStr?: string | null, langCode: string = "en"): string {
    if (!dateStr || dateStr === "-") return dateStr || "-";
    const trimmed = dateStr.trim();
    if (trimmed.includes(" - ")) {
        const parts = trimmed.split(" - ");
        return `${formatDateDDMMYYYY(parts[0], langCode)} - ${formatDateDDMMYYYY(parts[1], langCode)}`;
    }
    const yyyymmdd = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (yyyymmdd) {
        const y = yyyymmdd[1];
        const m = yyyymmdd[2].padStart(2, "0");
        const d = yyyymmdd[3].padStart(2, "0");
        return toLocaleNumber(`${d}/${m}/${y}`, langCode);
    }
    const mmddyyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mmddyyyy) {
        const p1 = parseInt(mmddyyyy[1], 10);
        const p2 = parseInt(mmddyyyy[2], 10);
        const y = mmddyyyy[3];
        if (p1 <= 12 && p2 > 12) {
            const d = String(p2).padStart(2, "0");
            const m = String(p1).padStart(2, "0");
            return toLocaleNumber(`${d}/${m}/${y}`, langCode);
        }
        return toLocaleNumber(trimmed, langCode);
    }
    return toLocaleNumber(trimmed, langCode);
}

export default function HumanResourceReportPage() {
    const { t, language } = useLanguage();
    const langCode = language?.short_code || "en";
    const [activeTab, setActiveTab] = useState("Staff Report");
    
    // Dropdown criteria lists
    const [roles, setRoles] = useState<{ name: string }[]>([]);
    const [designations, setDesignations] = useState<{ name: string }[]>([]);
    const [staffs, setStaffs] = useState<{ id: number; name: string; staff_id: string }[]>([]);

    // Selection states (Staff Report)
    const [selectedSearchType, setSelectedSearchType] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("active");
    const [selectedRole, setSelectedRole] = useState<string>("all");
    const [selectedDesignation, setSelectedDesignation] = useState<string>("all");

    // Selection states (Payroll Report)
    const [selectedPayrollRole, setSelectedPayrollRole] = useState<string>("all");
    const [selectedPayrollMonth, setSelectedPayrollMonth] = useState<string>("January");
    const [selectedPayrollYear, setSelectedPayrollYear] = useState<string>("2026");

    // Selection states (Leave Request Report)
    const [selectedLeaveFrom, setSelectedLeaveFrom] = useState<string>("2026-05-01");
    const [selectedLeaveTo, setSelectedLeaveTo] = useState<string>("2026-05-30");
    const [selectedLeaveDoj, setSelectedLeaveDoj] = useState<string>("2026-05-01");
    const [selectedLeaveStaff, setSelectedLeaveStaff] = useState<string>("all");
    const [selectedLeaveStatus, setSelectedLeaveStatus] = useState<string>("Pending");

    // Selection states (My Leave Request Report)
    const [selectedMyLeaveFrom, setSelectedMyLeaveFrom] = useState<string>("2026-05-01");
    const [selectedMyLeaveTo, setSelectedMyLeaveTo] = useState<string>("2026-05-30");
    const [selectedMyLeaveStatus, setSelectedMyLeaveStatus] = useState<string>("Approved");

    // Report results state
    const [staffList, setStaffList] = useState<StaffData[]>([]);
    const [payrollList, setPayrollList] = useState<PayrollData[]>([]);
    const [leaveList, setLeaveList] = useState<LeaveData[]>([]);
    const [myLeaveList, setMyLeaveList] = useState<MyLeaveData[]>([]);
    
    const [loading, setLoading] = useState(false);
    const [payrollIsSearched, setPayrollIsSearched] = useState(false);
    const [leaveIsSearched, setLeaveIsSearched] = useState(false);
    const [myLeaveIsSearched, setMyLeaveIsSearched] = useState(false);

    // Search and Pagination states
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState<string>("50");
    const [currentPage, setCurrentPage] = useState<number>(1);

    useEffect(() => {
        fetchCriteria();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchCriteria = async () => {
        try {
            const response = await api.get('/reports/human-resource/criteria');
            setRoles(response.data.roles || []);
            setDesignations(response.data.designations || []);
            setStaffs(response.data.staff || []);
        } catch (error) {
            console.error("Failed to fetch criteria", error);
            toast.error(t("failed_to_load_criteria") || "Failed to load HR criteria options");
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const response = await api.get('/reports/human-resource/report', {
                params: {
                    search_type: selectedSearchType,
                    status: selectedStatus,
                    role: selectedRole,
                    designation: selectedDesignation,
                }
            });
            setStaffList(response.data.data || []);
            setCurrentPage(1);
            toast.success(t("report_results") || "Staff report loaded successfully");
        } catch (error) {
            console.error("Failed to query staff report", error);
            toast.error(t("failed_to_fetch_report") || "Failed to load staff report data");
        } finally {
            setLoading(false);
        }
    };

    const handlePayrollSearch = async () => {
        if (!selectedPayrollYear) {
            toast.warning(t("please_select_a_class") || "Please select a Year");
            return;
        }
        setLoading(true);
        try {
            const response = await api.get('/reports/human-resource/payroll', {
                params: {
                    role: selectedPayrollRole,
                    month: selectedPayrollMonth,
                    year: selectedPayrollYear,
                }
            });
            setPayrollList(response.data.data || []);
            setPayrollIsSearched(true);
            setCurrentPage(1);
            toast.success(t("report_results") || "Payroll report loaded successfully");
        } catch (error) {
            console.error("Failed to query payroll report", error);
            toast.error(t("failed_to_fetch_report") || "Failed to load payroll report data");
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveSearch = async () => {
        setLoading(true);
        try {
            const response = await api.get('/reports/human-resource/leave', {
                params: {
                    status: selectedLeaveStatus,
                    staff_id: selectedLeaveStaff,
                    from_date: selectedLeaveFrom,
                    to_date: selectedLeaveTo,
                    doj: selectedLeaveDoj,
                }
            });
            setLeaveList(response.data.data || []);
            setLeaveIsSearched(true);
            setCurrentPage(1);
            toast.success(t("report_results") || "Leave requests report loaded successfully");
        } catch (error) {
            console.error("Failed to query leave report", error);
            toast.error(t("failed_to_fetch_report") || "Failed to load leave request report data");
        } finally {
            setLoading(false);
        }
    };

    const handleMyLeaveSearch = async () => {
        setLoading(true);
        try {
            const response = await api.get('/reports/human-resource/my-leave', {
                params: {
                    status: selectedMyLeaveStatus,
                    from_date: selectedMyLeaveFrom,
                    to_date: selectedMyLeaveTo,
                }
            });
            setMyLeaveList(response.data.data || []);
            setMyLeaveIsSearched(true);
            setCurrentPage(1);
            toast.success(t("report_results") || "My Leave report loaded successfully");
        } catch (error) {
            console.error("Failed to query my leave report", error);
            toast.error(t("failed_to_fetch_report") || "Failed to load my leave report data");
        } finally {
            setLoading(false);
        }
    };

    // Filter lists locally by keyword search box
    const filteredStaff = staffList.filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (item.id && item.id.toLowerCase().includes(term)) ||
            (item.name && item.name.toLowerCase().includes(term)) ||
            (item.email && item.email.toLowerCase().includes(term)) ||
            (item.phone && item.phone.toLowerCase().includes(term)) ||
            (item.role && item.role.toLowerCase().includes(term)) ||
            (item.designation && item.designation.toLowerCase().includes(term)) ||
            (item.department && item.department.toLowerCase().includes(term))
        );
    });

    const filteredPayroll = payrollList.filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (item.name && item.name.toLowerCase().includes(term)) ||
            (item.role && item.role.toLowerCase().includes(term)) ||
            (item.designation && item.designation.toLowerCase().includes(term)) ||
            (item.monthYear && item.monthYear.toLowerCase().includes(term)) ||
            (item.payslip && item.payslip.toLowerCase().includes(term))
        );
    });

    const filteredLeave = leaveList.filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (item.staff && item.staff.toLowerCase().includes(term)) ||
            (item.leaveType && item.leaveType.toLowerCase().includes(term)) ||
            (item.halfDay && item.halfDay.toLowerCase().includes(term)) ||
            (item.doj && item.doj.toLowerCase().includes(term)) ||
            (item.applyDate && item.applyDate.toLowerCase().includes(term)) ||
            (item.leaveDate && item.leaveDate.toLowerCase().includes(term)) ||
            (item.days && item.days.toLowerCase().includes(term)) ||
            (item.status && item.status.toLowerCase().includes(term))
        );
    });

    const filteredMyLeave = myLeaveList.filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (item.staff && item.staff.toLowerCase().includes(term)) ||
            (item.leaveType && item.leaveType.toLowerCase().includes(term)) ||
            (item.halfDay && item.halfDay.toLowerCase().includes(term)) ||
            (item.applyDate && item.applyDate.toLowerCase().includes(term)) ||
            (item.leaveDate && item.leaveDate.toLowerCase().includes(term)) ||
            (item.days && item.days.toLowerCase().includes(term)) ||
            (item.status && item.status.toLowerCase().includes(term))
        );
    });

    // Pagination Calculations
    const totalEntries = 
        activeTab === "Staff Report" ? filteredStaff.length : 
        activeTab === "Payroll Report" ? filteredPayroll.length :
        activeTab === "Leave Request Report" ? filteredLeave.length : filteredMyLeave.length;
    
    const sizeNum = parseInt(itemsPerPage);
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safeCurrentPage = Math.min(currentPage, totalPages) || 1;
    const startIndex = (safeCurrentPage - 1) * sizeNum;
    
    const paginatedStaff = filteredStaff.slice(startIndex, startIndex + sizeNum);
    const paginatedPayroll = filteredPayroll.slice(startIndex, startIndex + sizeNum);
    const paginatedLeave = filteredLeave.slice(startIndex, startIndex + sizeNum);
    const paginatedMyLeave = filteredMyLeave.slice(startIndex, startIndex + sizeNum);

    // Grand Totals for Payroll Report
    const totalBasic = filteredPayroll.reduce((sum, item) => sum + item.basic, 0);
    const totalEarning = filteredPayroll.reduce((sum, item) => sum + item.earning, 0);
    const totalDeduction = filteredPayroll.reduce((sum, item) => sum + item.deduction, 0);
    const totalGross = filteredPayroll.reduce((sum, item) => sum + item.gross, 0);
    const totalTax = filteredPayroll.reduce((sum, item) => sum + item.tax, 0);
    const totalNet = filteredPayroll.reduce((sum, item) => sum + item.net, 0);

    // Export Options
    const exportToCopy = () => {
        if (activeTab === "Staff Report") {
            if (filteredStaff.length === 0) {
                toast.warning(t("no_data_available_in_table") || "No data available to copy");
                return;
            }
            const text = [
                `${t("staff_id")}\t${t("role")}\t${t("designation")}\t${t("department")}\t${t("name")}\t${t("email")}\t${t("phone")}\t${t("basic_salary")}\t${t("contract_type")}`,
                ...filteredStaff.map(s => `${s.id}\t${s.role}\t${s.designation}\t${s.department}\t${s.name}\t${s.email}\t${s.phone}\t${s.salary}\t${s.contract}`)
            ].join("\n");

            navigator.clipboard.writeText(text);
            toast.success(t("copied_to_clipboard") || "Staff records copied to clipboard");
        } else if (activeTab === "Payroll Report") {
            if (filteredPayroll.length === 0) {
                toast.warning(t("no_data_available_in_table") || "No data available to copy");
                return;
            }
            const text = [
                `${t("name")}\t${t("role")}\t${t("designation")}\t${t("month_year")}\t${t("payslip_no")}\t${t("basic_salary")}\t${t("earning")}\t${t("deduction")}\t${t("gross_salary")}\t${t("tax")}\t${t("net_salary")}`,
                ...filteredPayroll.map(p => `${p.name}\t${p.role}\t${p.designation}\t${p.monthYear}\t${p.payslip}\t$${p.basic}\t$${p.earning}\t$${p.deduction}\t$${p.gross}\t$${p.tax}\t$${p.net}`)
            ].join("\n");

            navigator.clipboard.writeText(text);
            toast.success(t("copied_to_clipboard") || "Payroll records copied to clipboard");
        } else if (activeTab === "Leave Request Report") {
            if (filteredLeave.length === 0) {
                toast.warning(t("no_data_available_in_table") || "No data available to copy");
                return;
            }
            const text = [
                `${t("staff")}\t${t("leave_type")}\t${t("half_day")}\t${t("date_of_joining")}\t${t("apply_date")}\t${t("leave_date")}\t${t("days")}\t${t("status")}`,
                ...filteredLeave.map(l => `${l.staff}\t${l.leaveType}\t${l.halfDay}\t${l.doj}\t${l.applyDate}\t${l.leaveDate}\t${l.days}\t${l.status}`)
            ].join("\n");

            navigator.clipboard.writeText(text);
            toast.success(t("copied_to_clipboard") || "Leave records copied to clipboard");
        } else {
            if (filteredMyLeave.length === 0) {
                toast.warning(t("no_data_available_in_table") || "No data available to copy");
                return;
            }
            const text = [
                `${t("staff")}\t${t("leave_type")}\t${t("half_day")}\t${t("apply_date")}\t${t("leave_date")}\t${t("days")}\t${t("status")}`,
                ...filteredMyLeave.map(l => `${l.staff}\t${l.leaveType}\t${l.halfDay}\t${l.applyDate}\t${l.leaveDate}\t${l.days}\t${l.status}`)
            ].join("\n");

            navigator.clipboard.writeText(text);
            toast.success(t("copied_to_clipboard") || "Personal leave records copied to clipboard");
        }
    };

    const exportToExcel = (isCsv = false) => {
        if (activeTab === "Staff Report") {
            if (filteredStaff.length === 0) {
                toast.warning(t("no_data_available_in_table") || "No data available to export");
                return;
            }
            const mapped = filteredStaff.map(s => ({
                [t("staff_id") || "Staff ID"]: s.id,
                [t("role") || "Role"]: s.role,
                [t("designation") || "Designation"]: s.designation,
                [t("department") || "Department"]: s.department,
                [t("name") || "Name"]: s.name,
                [t("email") || "Email"]: s.email,
                [t("phone") || "Phone"]: s.phone,
                [t("basic_salary") || "Basic Salary"]: s.salary,
                [t("contract_type") || "Contract Type"]: s.contract,
                [t("date_of_joining") || "Date of Joining"]: s.doj,
            }));

            const worksheet = XLSX.utils.json_to_sheet(mapped);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Staff Directory Report");

            if (isCsv) {
                XLSX.writeFile(workbook, "staff_directory_report.csv", { bookType: "csv" });
                toast.success(t("csv_file_downloaded") || "CSV file downloaded successfully");
            } else {
                XLSX.writeFile(workbook, "staff_directory_report.xlsx");
                toast.success(t("excel_file_downloaded") || "Excel spreadsheet downloaded successfully");
            }
        } else if (activeTab === "Payroll Report") {
            if (filteredPayroll.length === 0) {
                toast.warning(t("no_data_available_in_table") || "No data available to export");
                return;
            }
            const mapped = filteredPayroll.map(p => ({
                [t("name") || "Name"]: p.name,
                [t("role") || "Role"]: p.role,
                [t("designation") || "Designation"]: p.designation,
                [t("month_year") || "Month - Year"]: p.monthYear,
                [t("payslip_no") || "Payslip #"]: p.payslip,
                [`${t("basic_salary") || "Basic Salary"} ($)`]: p.basic,
                [`${t("earning") || "Earning"} ($)`]: p.earning,
                [`${t("deduction") || "Deduction"} ($)`]: p.deduction,
                [`${t("gross_salary") || "Gross Salary"} ($)`]: p.gross,
                [`${t("tax") || "Tax"} ($)`]: p.tax,
                [`${t("net_salary") || "Net Salary"} ($)`]: p.net
            }));

            const worksheet = XLSX.utils.json_to_sheet(mapped);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll Report");

            if (isCsv) {
                XLSX.writeFile(workbook, "payroll_report.csv", { bookType: "csv" });
                toast.success(t("csv_file_downloaded") || "CSV file downloaded successfully");
            } else {
                XLSX.writeFile(workbook, "payroll_report.xlsx");
                toast.success(t("excel_file_downloaded") || "Excel spreadsheet downloaded successfully");
            }
        } else if (activeTab === "Leave Request Report") {
            if (filteredLeave.length === 0) {
                toast.warning(t("no_data_available_in_table") || "No data available to export");
                return;
            }
            const mapped = filteredLeave.map(l => ({
                [t("staff") || "Staff"]: l.staff,
                [t("leave_type") || "Leave Type"]: l.leaveType,
                [t("half_day") || "Half Day"]: l.halfDay,
                [t("date_of_joining") || "Date Of Joining"]: l.doj,
                [t("apply_date") || "Apply Date"]: l.applyDate,
                [t("leave_date") || "Leave Date"]: l.leaveDate,
                [t("days") || "Days"]: l.days,
                [t("status") || "Status"]: l.status,
            }));

            const worksheet = XLSX.utils.json_to_sheet(mapped);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Leave Request Report");

            if (isCsv) {
                XLSX.writeFile(workbook, "leave_request_report.csv", { bookType: "csv" });
                toast.success(t("csv_file_downloaded") || "CSV file downloaded successfully");
            } else {
                XLSX.writeFile(workbook, "leave_request_report.xlsx");
                toast.success(t("excel_file_downloaded") || "Excel spreadsheet downloaded successfully");
            }
        } else {
            if (filteredMyLeave.length === 0) {
                toast.warning(t("no_data_available_in_table") || "No data available to export");
                return;
            }
            const mapped = filteredMyLeave.map(l => ({
                [t("staff") || "Staff"]: l.staff,
                [t("leave_type") || "Leave Type"]: l.leaveType,
                [t("half_day") || "Half Day"]: l.halfDay,
                [t("apply_date") || "Apply Date"]: l.applyDate,
                [t("leave_date") || "Leave Date"]: l.leaveDate,
                [t("days") || "Days"]: l.days,
                [t("status") || "Status"]: l.status,
            }));

            const worksheet = XLSX.utils.json_to_sheet(mapped);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "My Leave Request Report");

            if (isCsv) {
                XLSX.writeFile(workbook, "my_leave_request_report.csv", { bookType: "csv" });
                toast.success(t("csv_file_downloaded") || "CSV file downloaded successfully");
            } else {
                XLSX.writeFile(workbook, "my_leave_request_report.xlsx");
                toast.success(t("excel_file_downloaded") || "Excel spreadsheet downloaded successfully");
            }
        }
    };

    const exportToPDF = () => {
        if (activeTab === "Staff Report") {
            if (filteredStaff.length === 0) {
                toast.warning(t("no_data_available_in_table") || "No data available to export");
                return;
            }
            const doc = new jsPDF("landscape");
            const head = [[t("staff_id") || "Staff ID", t("name") || "Name", t("role") || "Role", t("designation") || "Designation", t("department") || "Department", t("email") || "Email", t("phone") || "Phone", t("basic_salary") || "Salary", t("contract_type") || "Contract"]];
            const body = filteredStaff.map(s => [s.id, s.name, s.role, s.designation, s.department, s.email, s.phone, s.salary, s.contract]);

            autoTable(doc, { head, body, theme: "grid" });
            doc.save("staff_directory_report.pdf");
            toast.success(t("pdf_file_downloaded") || "PDF report downloaded successfully");
        } else if (activeTab === "Payroll Report") {
            if (filteredPayroll.length === 0) {
                toast.warning(t("no_data_available_in_table") || "No data available to export");
                return;
            }
            const doc = new jsPDF("landscape");
            const head = [[t("name") || "Name", t("role") || "Role", t("designation") || "Designation", t("month_year") || "Month - Year", t("payslip_no") || "Payslip #", t("basic_salary") || "Basic Salary", t("earning") || "Earning", t("deduction") || "Deduction", t("gross_salary") || "Gross Salary", t("tax") || "Tax", t("net_salary") || "Net Salary"]];
            const body = filteredPayroll.map(p => [
                p.name, p.role, p.designation, p.monthYear, p.payslip,
                `$${p.basic.toFixed(2)}`, `$${p.earning.toFixed(2)}`, `$${p.deduction.toFixed(2)}`,
                `$${p.gross.toFixed(2)}`, `$${p.tax.toFixed(2)}`, `$${p.net.toFixed(2)}`
            ]);

            autoTable(doc, { head, body, theme: "grid" });
            doc.save("payroll_report.pdf");
            toast.success(t("pdf_file_downloaded") || "PDF report downloaded successfully");
        } else if (activeTab === "Leave Request Report") {
            if (filteredLeave.length === 0) {
                toast.warning(t("no_data_available_in_table") || "No data available to export");
                return;
            }
            const doc = new jsPDF("landscape");
            const head = [[t("staff") || "Staff", t("leave_type") || "Leave Type", t("half_day") || "Half Day", t("date_of_joining") || "Date Of Joining", t("apply_date") || "Apply Date", t("leave_date") || "Leave Date", t("days") || "Days", t("status") || "Status"]];
            const body = filteredLeave.map(l => [l.staff, l.leaveType, l.halfDay, l.doj, l.applyDate, l.leaveDate, l.days, l.status]);

            autoTable(doc, { head, body, theme: "grid" });
            doc.save("leave_request_report.pdf");
            toast.success(t("pdf_file_downloaded") || "PDF report downloaded successfully");
        } else {
            if (filteredMyLeave.length === 0) {
                toast.warning(t("no_data_available_in_table") || "No data available to export");
                return;
            }
            const doc = new jsPDF("landscape");
            const head = [[t("staff") || "Staff", t("leave_type") || "Leave Type", t("half_day") || "Half Day", t("apply_date") || "Apply Date", t("leave_date") || "Leave Date", t("days") || "Days", t("status") || "Status"]];
            const body = filteredMyLeave.map(l => [l.staff, l.leaveType, l.halfDay, l.applyDate, l.leaveDate, l.days, l.status]);

            autoTable(doc, { head, body, theme: "grid" });
            doc.save("my_leave_request_report.pdf");
            toast.success(t("pdf_file_downloaded") || "PDF report downloaded successfully");
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const monthOptions = [
        { key: "january", val: "January" },
        { key: "february", val: "February" },
        { key: "march", val: "March" },
        { key: "april", val: "April" },
        { key: "may", val: "May" },
        { key: "june", val: "June" },
        { key: "july", val: "July" },
        { key: "august", val: "August" },
        { key: "september", val: "September" },
        { key: "october", val: "October" },
        { key: "november", val: "November" },
        { key: "december", val: "December" },
    ];

    return (
        <div className="space-y-6 pb-20 text-xs">
            {/* Standalone Edge-to-Edge Gradient Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Users className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                            {t("human_resource_report") || "Human Resource Report"}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">
                            {t("human_resource_report_description") || "View staff directory, payroll reports, and staff leave requests"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation Grid of 4 Report Tabs */}
            <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {reportLinks.map((link) => {
                        const isActive = activeTab === link.id;
                        return (
                            <div
                                key={link.id}
                                onClick={() => {
                                    setActiveTab(link.id);
                                    setSearchTerm("");
                                    setCurrentPage(1);
                                }}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all group",
                                    isActive
                                        ? "border-indigo-200 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-200"
                                        : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-xs"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-lg transition-all duration-300",
                                    isActive ? "bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                                )}>
                                    <link.icon className="h-4 w-4" />
                                </div>
                                <span className={cn(
                                    "text-xs font-bold tracking-tight transition-colors duration-300",
                                    isActive ? "text-[#6366f1]" : "text-gray-700"
                                )}>
                                    {t(link.key) || link.id}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Select Criteria Section (Staff Report) - Rearranged to 5 Columns with Inline Search Button */}
            {activeTab === "Staff Report" && (
                <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white transition-all">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                        <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                            <Filter className="h-4 w-4" />
                        </span>
                        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            {t("select_criteria") || "Select Criteria"}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {t("search_type_by_date_of_joining") || "Search Type By (Date Of Joining)"}
                            </Label>
                            <Select value={selectedSearchType} onValueChange={setSelectedSearchType}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("all") || "All"}</SelectItem>
                                    <SelectItem value="today">{t("today") || "Today"}</SelectItem>
                                    <SelectItem value="this_week">{t("this_week") || "This Week"}</SelectItem>
                                    <SelectItem value="this_month">{t("this_month") || "This Month"}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {t("status") || "Status"}
                            </Label>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">{t("active") || "Active"}</SelectItem>
                                    <SelectItem value="disabled">{t("disabled") || "Disabled"}</SelectItem>
                                    <SelectItem value="all">{t("all_status") || "All Status"}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {t("role") || "Role"}
                            </Label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {selectedRole === "all" ? (t("all_roles") || "All Roles") : translateRoleName(selectedRole, langCode)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("all_roles") || "All Roles"}</SelectItem>
                                    {roles.map(r => (
                                        <SelectItem key={r.name} value={r.name}>{translateRoleName(r.name, langCode)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {t("designation") || "Designation"}
                            </Label>
                            <Select value={selectedDesignation} onValueChange={setSelectedDesignation}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {selectedDesignation === "all" ? (t("all_designations") || "All Designations") : translateDesignationName(selectedDesignation, langCode)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("all_designations") || "All Designations"}</SelectItem>
                                    {designations.map(d => (
                                        <SelectItem key={d.name} value={d.name}>{translateDesignationName(d.name, langCode)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Button 
                                onClick={handleSearch}
                                disabled={loading}
                                className="h-9 px-6 text-xs font-bold rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-sm shadow-orange-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider w-full"
                            >
                                <Search className="h-3.5 w-3.5" />
                                {loading ? (t("loading") || "Searching...") : (t("search") || "Search")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Select Criteria Section (Payroll Report) - Rearranged to 4 Columns with Inline Search Button */}
            {activeTab === "Payroll Report" && (
                <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white transition-all animate-fadeIn">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                        <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                            <Filter className="h-4 w-4" />
                        </span>
                        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            {t("select_criteria") || "Select Criteria"}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {t("role") || "Role"}
                            </Label>
                            <Select value={selectedPayrollRole} onValueChange={setSelectedPayrollRole}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {selectedPayrollRole === "all" ? (t("all_roles") || "All Roles") : translateRoleName(selectedPayrollRole, langCode)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("all_roles") || "All Roles"}</SelectItem>
                                    {roles.map(r => (
                                        <SelectItem key={r.name} value={r.name}>{translateRoleName(r.name, langCode)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {t("month") || "Month"}
                            </Label>
                            <Select value={selectedPayrollMonth} onValueChange={setSelectedPayrollMonth}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {t(selectedPayrollMonth.toLowerCase()) || selectedPayrollMonth}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {monthOptions.map(m => (
                                        <SelectItem key={m.val} value={m.val}>{t(m.key) || m.val}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {t("year") || "Year"} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedPayrollYear} onValueChange={setSelectedPayrollYear}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {toLocaleNumber(selectedPayrollYear, langCode)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {["2026", "2025", "2024", "2023", "2022"].map(y => (
                                        <SelectItem key={y} value={y}>{toLocaleNumber(y, langCode)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Button 
                                onClick={handlePayrollSearch}
                                disabled={loading}
                                className="h-9 px-6 text-xs font-bold rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-sm shadow-orange-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider w-full"
                            >
                                <Search className="h-3.5 w-3.5" />
                                {loading ? (t("loading") || "Searching...") : (t("search") || "Search")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Select Criteria Section (Leave Request Report) - Rearranged to 6 Columns with Inline Search Button */}
            {activeTab === "Leave Request Report" && (
                <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white transition-all animate-fadeIn">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                        <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                            <Filter className="h-4 w-4" />
                        </span>
                        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            {t("select_criteria") || "Select Criteria"}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">{t("from_date") || "From Date"}</Label>
                            <DatePicker 
                                value={selectedLeaveFrom} 
                                onChange={setSelectedLeaveFrom}
                                className="h-9 px-3 border-gray-200 text-xs rounded-lg shadow-none focus-visible:ring-1 focus-visible:ring-indigo-500 bg-gray-50/30 font-normal"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">{t("to_date") || "To Date"}</Label>
                            <DatePicker 
                                value={selectedLeaveTo} 
                                onChange={setSelectedLeaveTo}
                                className="h-9 px-3 border-gray-200 text-xs rounded-lg shadow-none focus-visible:ring-1 focus-visible:ring-indigo-500 bg-gray-50/30 font-normal"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">{t("date_of_joining") || "Date Of Joining"}</Label>
                            <DatePicker 
                                value={selectedLeaveDoj} 
                                onChange={setSelectedLeaveDoj}
                                className="h-9 px-3 border-gray-200 text-xs rounded-lg shadow-none focus-visible:ring-1 focus-visible:ring-indigo-500 bg-gray-50/30 font-normal"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">{t("staff_name") || "Staff Name"}</Label>
                            <Select value={selectedLeaveStaff} onValueChange={setSelectedLeaveStaff}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {selectedLeaveStaff === "all" ? (t("all_staff") || "All Staff") : staffs.find(s => String(s.id) === selectedLeaveStaff)?.name || selectedLeaveStaff}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("all_staff") || "All Staff"}</SelectItem>
                                    {staffs.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.staff_id || s.id})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">{t("status") || "Status"}</Label>
                            <Select value={selectedLeaveStatus} onValueChange={setSelectedLeaveStatus}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {selectedLeaveStatus === "all" ? (t("all_status") || "All Status") :
                                         selectedLeaveStatus === "Pending" ? (t("pending") || "Pending") :
                                         selectedLeaveStatus === "Approved" ? (t("approved") || "Approved") : (t("disapproved") || "Disapproved")}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("all_status") || "All Status"}</SelectItem>
                                    <SelectItem value="Pending">{t("pending") || "Pending"}</SelectItem>
                                    <SelectItem value="Approved">{t("approved") || "Approved"}</SelectItem>
                                    <SelectItem value="Disapproved">{t("disapproved") || "Disapproved"}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Button 
                                onClick={handleLeaveSearch}
                                disabled={loading}
                                className="h-9 px-6 text-xs font-bold rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-sm shadow-orange-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider w-full"
                            >
                                <Search className="h-3.5 w-3.5" />
                                {loading ? (t("loading") || "Searching...") : (t("search") || "Search")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Select Criteria Section (My Leave Request Report) - Rearranged to 4 Columns with Inline Search Button */}
            {activeTab === "My Leave Request Report" && (
                <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white transition-all animate-fadeIn">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                        <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                            <Filter className="h-4 w-4" />
                        </span>
                        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            {t("select_criteria") || "Select Criteria"}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">{t("from_date") || "From Date"}</Label>
                            <DatePicker 
                                value={selectedMyLeaveFrom} 
                                onChange={setSelectedMyLeaveFrom}
                                className="h-9 px-3 border-gray-200 text-xs rounded-lg shadow-none focus-visible:ring-1 focus-visible:ring-indigo-500 bg-gray-50/30 font-normal"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">{t("to_date") || "To Date"}</Label>
                            <DatePicker 
                                value={selectedMyLeaveTo} 
                                onChange={setSelectedMyLeaveTo}
                                className="h-9 px-3 border-gray-200 text-xs rounded-lg shadow-none focus-visible:ring-1 focus-visible:ring-indigo-500 bg-gray-50/30 font-normal"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">{t("status") || "Status"}</Label>
                            <Select value={selectedMyLeaveStatus} onValueChange={setSelectedMyLeaveStatus}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {selectedMyLeaveStatus === "all" ? (t("all_status") || "All Status") :
                                         selectedMyLeaveStatus === "Pending" ? (t("pending") || "Pending") :
                                         selectedMyLeaveStatus === "Approved" ? (t("approved") || "Approved") : (t("disapproved") || "Disapproved")}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("all_status") || "All Status"}</SelectItem>
                                    <SelectItem value="Pending">{t("pending") || "Pending"}</SelectItem>
                                    <SelectItem value="Approved">{t("approved") || "Approved"}</SelectItem>
                                    <SelectItem value="Disapproved">{t("disapproved") || "Disapproved"}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Button 
                                onClick={handleMyLeaveSearch}
                                disabled={loading}
                                className="h-9 px-6 text-xs font-bold rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-sm shadow-orange-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider w-full"
                            >
                                <Search className="h-3.5 w-3.5" />
                                {loading ? (t("loading") || "Searching...") : (t("search") || "Search")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Staff Report Table Section with Bottom-Anchored Pagination */}
            {activeTab === "Staff Report" && (
                <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white overflow-hidden flex flex-col justify-between min-h-[480px]">
                    <div className="space-y-4">
                        {/* Table Toolbar */}
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                                <Input
                                    placeholder={t("search") || "Search..."}
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="pl-8 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded-lg shadow-none"
                                />
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{t("show") || "Show"}</span>
                                    <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                        <SelectTrigger className="h-7 w-16 text-[11px] border-gray-200 shadow-none rounded-lg">
                                            <SelectValue>
                                                {toLocaleNumber(itemsPerPage, langCode)}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {["10", "25", "50", "100"].map((opt) => (
                                                <SelectItem key={opt} value={opt}>{toLocaleNumber(opt, langCode)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-1 text-gray-500">
                                    <Button variant="outline" size="icon" title={t("copy") || "Copy"} onClick={exportToCopy} className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50">
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="outline" size="icon" title={t("excel") || "Excel"} onClick={() => exportToExcel(false)} className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50">
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="outline" size="icon" title="CSV" onClick={() => exportToExcel(true)} className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50">
                                        <FileBox className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="outline" size="icon" title={t("pdf") || "PDF"} onClick={exportToPDF} className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50">
                                        <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="outline" size="icon" title={t("print") || "Print"} onClick={handlePrint} className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50">
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Staff Table */}
                        <div className="rounded-xl border border-gray-200/80 overflow-x-auto shadow-2xs">
                            <Table className="min-w-[3500px]">
                                <TableHeader className="bg-gray-50/75 text-xs uppercase">
                                    <TableRow className="hover:bg-transparent border-b border-gray-200 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-2.5 px-4">{t("staff_id") || "Staff ID"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("role") || "Role"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("designation") || "Designation"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("department") || "Department"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("name") || "Name"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("father_name") || "Father Name"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("mother_name") || "Mother Name"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("email") || "Email"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("gender") || "Gender"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("date_of_birth") || "Date Of Birth"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("date_of_joining") || "Date Of Joining"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("phone") || "Phone"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("emergency_contact_number") || "Emergency Contact Number"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("marital_status") || "Marital Status"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("current_address") || "Current Address"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("permanent_address") || "Permanent Address"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("qualification") || "Qualification"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("work_experience") || "Work Experience"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("note") || "Note"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("epf_no") || "EPF No."} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("basic_salary") || "Basic Salary"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("contract_type") || "Contract Type"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("work_shift") || "Work Shift"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("work_location") || "Work Location"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4 text-right">{t("leaves") || "Leaves"}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton cols={25} />
                                    ) : paginatedStaff.length > 0 ? (
                                        paginatedStaff.map((staff, idx) => (
                                            <TableRow key={idx} className="text-[11px] border-b border-gray-100 hover:bg-indigo-50/40 transition-colors">
                                                <TableCell className="py-3 px-4 text-gray-700 font-medium">{toLocaleNumber(staff.id, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{translateRoleName(staff.role, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{translateDesignationName(staff.designation, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{translateDepartment(staff.department, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-700 font-bold">{translatePersonName(staff.name, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{translatePersonName(staff.fatherName, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{translatePersonName(staff.motherName, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-indigo-600 underline cursor-pointer">{staff.email}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{translateGender(staff.gender, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{formatDateDDMMYYYY(staff.dob, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{formatDateDDMMYYYY(staff.doj, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{toLocaleNumber(staff.phone, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{toLocaleNumber(staff.emergency, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{translateMarital(staff.marital, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500 max-w-xs">{translateAddress(staff.currentAddress, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500 max-w-xs">{translateAddress(staff.permanentAddress, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{translateQualification(staff.qualification, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{translateExperience(staff.experience, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500 italic max-w-xs">{translateNote(staff.note, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{toLocaleNumber(staff.epf, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-emerald-600 font-bold">{toLocaleNumber(staff.salary, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{translateContract(staff.contract, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{translateWorkShift(staff.shift, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{translateWorkLocation(staff.location, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-right">
                                                    <div className="flex flex-col text-[10px] leading-relaxed text-gray-500 text-right">
                                                        {(staff.leaves || []).map((leave, lIdx) => (
                                                            <span key={lIdx}>{translateLeaveItem(leave, langCode)}</span>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={25} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                                {t("no_results_found_for_selected_criteria") || "No staff records match selected filters."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Pagination Spacing Anchored to Bottom Border */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-100 text-[11px] text-gray-500 mt-6">
                        <div>
                            {t("showing_x_to_y_of_z", {
                                from: toLocaleNumber(totalEntries > 0 ? startIndex + 1 : 0, langCode),
                                to: toLocaleNumber(Math.min(startIndex + sizeNum, totalEntries), langCode),
                                total: toLocaleNumber(totalEntries, langCode),
                            })}
                        </div>
                        <div className="flex items-center gap-1">
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-7 w-7 rounded-lg border-gray-200 disabled:opacity-40" 
                                disabled={safeCurrentPage <= 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "h-7 px-2.5 text-[11px] font-bold rounded-lg transition-all",
                                        safeCurrentPage === page 
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs" 
                                            : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                    )}
                                >
                                    {toLocaleNumber(page, langCode)}
                                </Button>
                            ))}
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-7 w-7 rounded-lg border-gray-200 disabled:opacity-40" 
                                disabled={safeCurrentPage >= totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payroll Report Table Section with Bottom-Anchored Pagination */}
            {activeTab === "Payroll Report" && payrollIsSearched && (
                <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white overflow-hidden flex flex-col justify-between min-h-[480px] animate-fadeIn">
                    <div className="space-y-4">
                        {/* Table Toolbar */}
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                                <Input
                                    placeholder={t("search") || "Search..."}
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="pl-8 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded-lg shadow-none"
                                />
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{t("show") || "Show"}</span>
                                    <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                        <SelectTrigger className="h-7 w-16 text-[11px] border-gray-200 shadow-none rounded-lg">
                                            <SelectValue>
                                                {toLocaleNumber(itemsPerPage, langCode)}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {["10", "25", "50", "100"].map((opt) => (
                                                <SelectItem key={opt} value={opt}>{toLocaleNumber(opt, langCode)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-1 text-gray-500">
                                    <Button variant="outline" size="icon" title={t("copy") || "Copy"} onClick={exportToCopy} className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50">
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="outline" size="icon" title={t("excel") || "Excel"} onClick={() => exportToExcel(false)} className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50">
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="outline" size="icon" title="CSV" onClick={() => exportToExcel(true)} className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50">
                                        <FileBox className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="outline" size="icon" title={t("pdf") || "PDF"} onClick={exportToPDF} className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50">
                                        <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="outline" size="icon" title={t("print") || "Print"} onClick={handlePrint} className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50">
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Payroll Table */}
                        <div className="rounded-xl border border-gray-200/80 overflow-x-auto shadow-2xs">
                            <Table className="min-w-[1400px]">
                                <TableHeader className="bg-gray-50/75 text-xs uppercase">
                                    <TableRow className="hover:bg-transparent border-b border-gray-200 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-2.5 px-4">{t("name") || "Name"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("role") || "Role"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("designation") || "Designation"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("month_year") || "Month - Year"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("payslip_no") || "Payslip #"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4 text-right">{t("basic_salary") || "Basic Salary"} ($) <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4 text-right">{t("earning") || "Earning"} ($) <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4 text-right">{t("deduction") || "Deduction"} ($) <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4 text-right">{t("gross_salary") || "Gross Salary"} ($) <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4 text-right">{t("tax") || "Tax"} ($) <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4 text-right">{t("net_salary") || "Net Salary"} ($) <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton cols={11} />
                                    ) : paginatedPayroll.length > 0 ? (
                                        <>
                                            {paginatedPayroll.map((pay, idx) => (
                                                <TableRow key={idx} className="text-[11px] border-b border-gray-100 hover:bg-indigo-50/40 transition-colors">
                                                    <TableCell className="py-3 px-4 text-gray-700 font-bold">{translateStaffWithId(pay.name, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{translateRoleName(pay.role, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{translateDesignationName(pay.designation, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-500">{translateMonthYear(pay.monthYear, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-[#6366F1] font-bold text-center">{toLocaleNumber(pay.payslip, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-700">{toLocaleNumber(pay.basic.toFixed(2), langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-700">{toLocaleNumber(pay.earning.toFixed(2), langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-700">{toLocaleNumber(pay.deduction.toFixed(2), langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-700 font-medium">{toLocaleNumber(pay.gross.toFixed(2), langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-gray-700">{toLocaleNumber(pay.tax.toFixed(2), langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-right text-emerald-600 font-bold">{toLocaleNumber(pay.net.toFixed(2), langCode)}</TableCell>
                                                </TableRow>
                                            ))}
                                            
                                            {/* Grand Total Row */}
                                            <TableRow className="bg-gray-50/50 text-[11px] font-extrabold hover:bg-gray-50/80 border-t border-t-gray-200">
                                                <TableCell colSpan={5} className="py-3.5 px-4 text-right text-gray-800 font-extrabold">{t("grand_total") || "Grand Total"}</TableCell>
                                                <TableCell className="py-3.5 px-4 text-right text-gray-800">${toLocaleNumber(totalBasic.toFixed(2), langCode)}</TableCell>
                                                <TableCell className="py-3.5 px-4 text-right text-gray-800">${toLocaleNumber(totalEarning.toFixed(2), langCode)}</TableCell>
                                                <TableCell className="py-3.5 px-4 text-right text-gray-800">${toLocaleNumber(totalDeduction.toFixed(2), langCode)}</TableCell>
                                                <TableCell className="py-3.5 px-4 text-right text-gray-800">${toLocaleNumber(totalGross.toFixed(2), langCode)}</TableCell>
                                                <TableCell className="py-3.5 px-4 text-right text-gray-800">${toLocaleNumber(totalTax.toFixed(2), langCode)}</TableCell>
                                                <TableCell className="py-3.5 px-4 text-right text-emerald-700 font-black">${toLocaleNumber(totalNet.toFixed(2), langCode)}</TableCell>
                                            </TableRow>
                                        </>
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={11} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                                {t("no_results_found_for_selected_criteria") || "No payroll records match selected filters."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Pagination Spacing Anchored to Bottom Border */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-100 text-[11px] text-gray-500 mt-6">
                        <div>
                            {t("showing_x_to_y_of_z", {
                                from: toLocaleNumber(totalEntries > 0 ? startIndex + 1 : 0, langCode),
                                to: toLocaleNumber(Math.min(startIndex + sizeNum, totalEntries), langCode),
                                total: toLocaleNumber(totalEntries, langCode),
                            })}
                        </div>
                        <div className="flex items-center gap-1">
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-7 w-7 rounded-lg border-gray-200 disabled:opacity-40" 
                                disabled={safeCurrentPage <= 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "h-7 px-2.5 text-[11px] font-bold rounded-lg transition-all",
                                        safeCurrentPage === page 
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs" 
                                            : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                    )}
                                >
                                    {toLocaleNumber(page, langCode)}
                                </Button>
                            ))}
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-7 w-7 rounded-lg border-gray-200 disabled:opacity-40" 
                                disabled={safeCurrentPage >= totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave Request Report Table Section with Bottom-Anchored Pagination */}
            {activeTab === "Leave Request Report" && leaveIsSearched && (
                <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white overflow-hidden flex flex-col justify-between min-h-[480px] animate-fadeIn">
                    <div className="space-y-4">
                        {/* Table Toolbar */}
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                                <Input
                                    placeholder={t("search") || "Search..."}
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="pl-8 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded-lg shadow-none"
                                />
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{t("show") || "Show"}</span>
                                    <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                        <SelectTrigger className="h-7 w-16 text-[11px] border-gray-200 shadow-none rounded-lg">
                                            <SelectValue>
                                                {toLocaleNumber(itemsPerPage, langCode)}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {["10", "25", "50", "100"].map((opt) => (
                                                <SelectItem key={opt} value={opt}>{toLocaleNumber(opt, langCode)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-1 text-gray-500">
                                    <Button variant="outline" size="icon" title={t("copy") || "Copy"} onClick={exportToCopy} className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50">
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="outline" size="icon" title={t("excel") || "Excel"} onClick={() => exportToExcel(false)} className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50">
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="outline" size="icon" title="CSV" onClick={() => exportToExcel(true)} className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50">
                                        <FileBox className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="outline" size="icon" title={t("pdf") || "PDF"} onClick={exportToPDF} className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50">
                                        <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="outline" size="icon" title={t("print") || "Print"} onClick={handlePrint} className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50">
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Leave Table */}
                        <div className="rounded-xl border border-gray-200/80 overflow-x-auto shadow-2xs">
                            <Table className="min-w-[1200px]">
                                <TableHeader className="bg-gray-50/75 text-xs uppercase">
                                    <TableRow className="hover:bg-transparent border-b border-gray-200 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-2.5 px-4">{t("staff") || "Staff"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("leave_type") || "Leave Type"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("half_day") || "Half Day"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("date_of_joining") || "Date Of Joining"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("apply_date") || "Apply Date"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("leave_date") || "Leave Date"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("days") || "Days"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4 text-right">{t("status") || "Status"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton cols={8} />
                                    ) : paginatedLeave.length > 0 ? (
                                        paginatedLeave.map((leave, idx) => (
                                            <TableRow key={idx} className="text-[11px] border-b border-gray-100 hover:bg-indigo-50/40 transition-colors">
                                                <TableCell className="py-3 px-4 text-gray-700 font-bold">{translateStaffWithId(leave.staff, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{translateLeaveType(leave.leaveType, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500 font-medium">{leave.halfDay ? (t("half_day") || "Half Day") : "-"}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{formatDateDDMMYYYY(leave.doj, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{formatDateDDMMYYYY(leave.applyDate, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500 font-medium">{formatDateDDMMYYYY(leave.leaveDate, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-center text-gray-700">{toLocaleNumber(leave.days, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-right">
                                                    <span className={cn(
                                                        "inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide",
                                                        leave.status === "Approved" ? "bg-emerald-500 text-white" :
                                                        leave.status === "Pending" ? "bg-amber-500 text-white" : "bg-rose-500 text-white"
                                                    )}>
                                                        {leave.status === "Approved" ? (t("approved") || "Approved") :
                                                         leave.status === "Pending" ? (t("pending") || "Pending") : (t("disapproved") || "Disapproved")}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={8} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                                {t("no_results_found_for_selected_criteria") || "No leave request records match selected filters."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Pagination Spacing Anchored to Bottom Border */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-100 text-[11px] text-gray-500 mt-6">
                        <div>
                            {t("showing_x_to_y_of_z", {
                                from: toLocaleNumber(totalEntries > 0 ? startIndex + 1 : 0, langCode),
                                to: toLocaleNumber(Math.min(startIndex + sizeNum, totalEntries), langCode),
                                total: toLocaleNumber(totalEntries, langCode),
                            })}
                        </div>
                        <div className="flex items-center gap-1">
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-7 w-7 rounded-lg border-gray-200 disabled:opacity-40" 
                                disabled={safeCurrentPage <= 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "h-7 px-2.5 text-[11px] font-bold rounded-lg transition-all",
                                        safeCurrentPage === page 
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs" 
                                            : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                    )}
                                >
                                    {toLocaleNumber(page, langCode)}
                                </Button>
                            ))}
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-7 w-7 rounded-lg border-gray-200 disabled:opacity-40" 
                                disabled={safeCurrentPage >= totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* My Leave Request Report Table Section with Bottom-Anchored Pagination */}
            {activeTab === "My Leave Request Report" && myLeaveIsSearched && (
                <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white overflow-hidden flex flex-col justify-between min-h-[480px] animate-fadeIn">
                    <div className="space-y-4">
                        {/* Table Toolbar */}
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                                <Input
                                    placeholder={t("search") || "Search..."}
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="pl-8 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded-lg shadow-none"
                                />
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{t("show") || "Show"}</span>
                                    <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                        <SelectTrigger className="h-7 w-16 text-[11px] border-gray-200 shadow-none rounded-lg">
                                            <SelectValue>
                                                {toLocaleNumber(itemsPerPage, langCode)}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {["10", "25", "50", "100"].map((opt) => (
                                                <SelectItem key={opt} value={opt}>{toLocaleNumber(opt, langCode)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-1 text-gray-500">
                                    <Button variant="outline" size="icon" title={t("copy") || "Copy"} onClick={exportToCopy} className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50">
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="outline" size="icon" title={t("excel") || "Excel"} onClick={() => exportToExcel(false)} className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50">
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="outline" size="icon" title="CSV" onClick={() => exportToExcel(true)} className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50">
                                        <FileBox className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="outline" size="icon" title={t("pdf") || "PDF"} onClick={exportToPDF} className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50">
                                        <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="outline" size="icon" title={t("print") || "Print"} onClick={handlePrint} className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50">
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* My Leave Table */}
                        <div className="rounded-xl border border-gray-200/80 overflow-x-auto shadow-2xs">
                            <Table className="min-w-[1000px]">
                                <TableHeader className="bg-gray-50/75 text-xs uppercase">
                                    <TableRow className="hover:bg-transparent border-b border-gray-200 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-2.5 px-4">{t("staff") || "Staff"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("leave_type") || "Leave Type"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("half_day") || "Half Day"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("apply_date") || "Apply Date"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4">{t("leave_date") || "Leave Date"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("days") || "Days"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4 text-right">{t("status") || "Status"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton cols={7} />
                                    ) : paginatedMyLeave.length > 0 ? (
                                        paginatedMyLeave.map((leave, idx) => (
                                            <TableRow key={idx} className="text-[11px] border-b border-gray-100 hover:bg-indigo-50/40 transition-colors">
                                                <TableCell className="py-3 px-4 text-gray-700 font-bold">{translateStaffWithId(leave.staff, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{translateLeaveType(leave.leaveType, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500 font-medium">{leave.halfDay ? (t("half_day") || "Half Day") : "-"}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{formatDateDDMMYYYY(leave.applyDate, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500 font-medium">{formatDateDDMMYYYY(leave.leaveDate, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-center text-gray-700">{toLocaleNumber(leave.days, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-right">
                                                    <span className={cn(
                                                        "inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide",
                                                        leave.status === "Approved" ? "bg-emerald-500 text-white" :
                                                        leave.status === "Pending" ? "bg-amber-500 text-white" : "bg-rose-500 text-white"
                                                    )}>
                                                        {leave.status === "Approved" ? (t("approved") || "Approved") :
                                                         leave.status === "Pending" ? (t("pending") || "Pending") : (t("disapproved") || "Disapproved")}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={7} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                                {t("no_results_found_for_selected_criteria") || "No personal leave request records match selected filters."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Pagination Spacing Anchored to Bottom Border */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-100 text-[11px] text-gray-500 mt-6">
                        <div>
                            {t("showing_x_to_y_of_z", {
                                from: toLocaleNumber(totalEntries > 0 ? startIndex + 1 : 0, langCode),
                                to: toLocaleNumber(Math.min(startIndex + sizeNum, totalEntries), langCode),
                                total: toLocaleNumber(totalEntries, langCode),
                            })}
                        </div>
                        <div className="flex items-center gap-1">
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-7 w-7 rounded-lg border-gray-200 disabled:opacity-40" 
                                disabled={safeCurrentPage <= 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "h-7 px-2.5 text-[11px] font-bold rounded-lg transition-all",
                                        safeCurrentPage === page 
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs" 
                                            : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                    )}
                                >
                                    {toLocaleNumber(page, langCode)}
                                </Button>
                            ))}
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-7 w-7 rounded-lg border-gray-200 disabled:opacity-40" 
                                disabled={safeCurrentPage >= totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

