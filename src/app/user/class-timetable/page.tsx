"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
    Printer, BookOpen, Clock, User, Building, XCircle, Loader2, CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { useSettings } from "@/components/providers/settings-provider";
import {
    cn,
    toLocaleNumber,
    translateClassName,
    translateSectionName,
    translateSubjectName,
    translateDayName,
    translateDayShortName,
} from "@/lib/utils";

type Period = {
    id: number;
    subject: string;
    time: string;
    teacher: string;
    room: string;
};

type Timetable = Record<string, Period[]>;

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DAY_COLORS: Record<string, { card: string; header: string; accent: string; text: string }> = {
    Monday:    { card: "border-indigo-200 bg-indigo-50/60",    header: "bg-indigo-100",    accent: "text-indigo-600",  text: "text-indigo-700" },
    Tuesday:   { card: "border-violet-200 bg-violet-50/60",    header: "bg-violet-100",    accent: "text-violet-600",  text: "text-violet-700" },
    Wednesday: { card: "border-sky-200 bg-sky-50/60",          header: "bg-sky-100",       accent: "text-sky-600",     text: "text-sky-700" },
    Thursday:  { card: "border-emerald-200 bg-emerald-50/60",  header: "bg-emerald-100",   accent: "text-emerald-600", text: "text-emerald-700" },
    Friday:    { card: "border-amber-200 bg-amber-50/60",      header: "bg-amber-100",     accent: "text-amber-600",   text: "text-amber-700" },
    Saturday:  { card: "border-orange-200 bg-orange-50/60",    header: "bg-orange-100",    accent: "text-orange-600",  text: "text-orange-700" },
    Sunday:    { card: "border-rose-200 bg-rose-50/60",        header: "bg-rose-100",      accent: "text-rose-500",    text: "text-rose-600" },
};

const TODAY_NAME = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

// ── Format time range with localized digits & 12h/24h format ──
function formatTimeRange(timeStr: string, langCode: string, timeFormat: "12" | "24") {
    if (!timeStr) return "";
    const parts = timeStr.split("-").map(p => p.trim());
    const formatSingleTime = (t: string) => {
        if (!t) return "";
        const m = t.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*(AM|PM))?$/i);
        if (m) {
            let h = parseInt(m[1], 10);
            const min = m[2];
            const ampm = m[3] ? m[3].toUpperCase() : undefined;
            if (ampm) {
                if (ampm === "PM" && h < 12) h += 12;
                if (ampm === "AM" && h === 12) h = 0;
            }
            if (timeFormat === "12") {
                const p = h >= 12 ? "PM" : "AM";
                const h12 = h % 12 || 12;
                return `${toLocaleNumber(h12, langCode)}:${toLocaleNumber(min, langCode)} ${p}`;
            }
            const hh = h.toString().padStart(2, "0");
            return `${toLocaleNumber(hh, langCode)}:${toLocaleNumber(min, langCode)}`;
        }
        return toLocaleNumber(t, langCode);
    };

    if (parts.length === 2) {
        return `${formatSingleTime(parts[0])} - ${formatSingleTime(parts[1])}`;
    }
    return toLocaleNumber(timeStr, langCode);
}

// ── Format teacher string with localized staff code ──
function formatTeacher(teacherStr: string, langCode: string) {
    if (!teacherStr) return "";
    return teacherStr.replace(/\(([^)]+)\)/g, (match, code) => {
        return `(${toLocaleNumber(code.trim(), langCode)})`;
    });
}

/* ── Animated period card ── */
function PeriodCard({
    period,
    colors,
    delay,
    langCode,
    timeFormat,
}: {
    period: Period;
    colors: typeof DAY_COLORS[string];
    delay: number;
    langCode: string;
    timeFormat: "12" | "24";
}) {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    const formattedTime = formatTimeRange(period.time, langCode, timeFormat);
    const translatedSubject = translateSubjectName(period.subject, langCode);
    const formattedTeacherStr = formatTeacher(period.teacher, langCode);
    const formattedRoom = toLocaleNumber(period.room, langCode);

    return (
        <div
            className={cn(
                "rounded-xl border p-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300",
                colors.card,
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            )}
            style={{ transition: `opacity 0.35s ease ${delay}ms, transform 0.35s ease ${delay}ms, box-shadow 0.2s` }}
        >
            <div className="flex gap-2.5">
                {/* Left accent stripe */}
                <div className={cn("w-0.5 rounded-full shrink-0 self-stretch", colors.accent.replace("text-", "bg-"))} />
                <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-start gap-1.5">
                        <BookOpen className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", colors.accent)} />
                        <span className={cn("font-bold leading-tight text-[12px]", colors.text)}>{translatedSubject}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                        <Clock className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", colors.accent)} />
                        <span className={cn("leading-tight text-[11px] font-medium", colors.text)}>{formattedTime}</span>
                    </div>
                    {period.teacher && (
                        <div className="flex items-start gap-1.5">
                            <User className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", colors.accent)} />
                            <span className={cn("leading-tight text-[11px]", colors.text)}>{formattedTeacherStr}</span>
                        </div>
                    )}
                    {period.room && (
                        <div className="flex items-start gap-1.5">
                            <Building className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", colors.accent)} />
                            <span className={cn("leading-tight text-[11px]", colors.text)}>{t("room")}: {formattedRoom}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function UserClassTimetablePage() {
    const { t, language } = useTranslation();
    const langCode = language?.short_code || "en";
    const { settings } = useSettings();
    const timeFormat = settings?.time_format === "12" ? "12" : ("24" as const);

    const [timetable, setTimetable] = useState<Timetable>({});
    const [className, setClassName] = useState<string | null>(null);
    const [sectionName, setSectionName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeDay, setActiveDay] = useState(TODAY_NAME);
    const { toast } = useToast();

    useEffect(() => {
        const fetchTimetable = async () => {
            try {
                const res = await api.get("/user/class-timetable").catch(() => ({ data: { success: false, data: { class_name: null, section_name: null, timetable: {} } } }));
                if (res.data.success) {
                    const payload = res.data.data ?? {};
                    if (payload && typeof payload === "object" && "timetable" in payload) {
                        setTimetable(payload.timetable ?? {});
                        setClassName(payload.class_name ?? null);
                        setSectionName(payload.section_name ?? null);
                    } else {
                        setTimetable(payload ?? {});
                    }
                } else {
                    toast({ variant: "destructive", title: t("error"), description: res.data.message || t("failed_to_load_timetable") });
                }
            } catch {
                toast({ variant: "destructive", title: t("error"), description: t("failed_to_load_class_timetable") });
            } finally {
                setLoading(false);
            }
        };
        fetchTimetable();
    }, [toast, t]);

    const totalPeriods = DAYS.reduce((acc, d) => acc + (timetable[d]?.length ?? 0), 0);
    const localizedTotalPeriods = toLocaleNumber(totalPeriods, langCode);
    const translatedClsName = translateClassName(className, langCode);
    const translatedSecName = translateSectionName(sectionName, langCode);

    return (
        <div className="p-4 lg:p-6 animate-in fade-in duration-500">
            <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden p-0 gap-0">
                {/* ── Header ── */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <CalendarDays className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-[16px] font-bold text-gray-800 dark:text-zinc-100 leading-snug truncate">{t("class_timetable")}</h1>
                                {!loading && (className || sectionName) && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white/70 border border-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
                                        {translatedClsName || "—"}{sectionName ? ` · ${translatedSecName}` : ""}
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                {loading
                                    ? t("loading_schedule")
                                    : (className || sectionName)
                                        ? `${t("your_schedule_for")} ${translatedClsName}${sectionName ? ` — ${translatedSecName}` : ""} · ${localizedTotalPeriods} ${totalPeriods === 1 ? t("period") : t("periods")}`
                                        : `${localizedTotalPeriods} ${totalPeriods === 1 ? t("period") : t("periods")} ${t("scheduled_this_week")}`}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => window.print()}
                        title={t("print")}
                        className="h-9 shrink-0 ml-auto px-3.5 gap-1.5 rounded-[10px] text-white text-[12px] font-semibold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity active:scale-95 print:hidden cursor-pointer"
                    >
                        <Printer className="h-4 w-4" />
                        <span className="hidden sm:inline">{t("print")}</span>
                    </Button>
                </div>

                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span>{t("loading")}</span>
                        </div>
                    ) : totalPeriods === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <CalendarDays className="h-12 w-12 opacity-30 mb-3" />
                            {!className && !sectionName ? (
                                <>
                                    <p className="text-base font-semibold text-gray-500">{t("no_class_or_section_assigned")}</p>
                                    <p className="text-sm mt-1 text-gray-400">{t("please_contact_the_admin_to_assign_your_class_and_section")}</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-base font-semibold text-gray-500">{t("no_timetable_found")}</p>
                                    <p className="text-sm mt-1 text-gray-400">
                                        {t("the_admin_hasnt_scheduled_classes_for")}{" "}
                                        <span className="font-semibold text-indigo-500">
                                            {translatedClsName}
                                            {sectionName ? ` — ${translatedSecName}` : ""}
                                        </span>{" "}
                                        {t("yet")}.
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* ── Day tab strip ── */}
                            <div className="flex overflow-x-auto border-b border-gray-200 print:hidden">
                                {DAYS.map((day) => {
                                    const count = timetable[day]?.length ?? 0;
                                    const isToday = day === TODAY_NAME;
                                    const isActive = day === activeDay;
                                    const colors = DAY_COLORS[day];
                                    const localizedDayShort = translateDayShortName(day, langCode);
                                    return (
                                        <button
                                            key={day}
                                            onClick={() => setActiveDay(day)}
                                            className={cn(
                                                "flex flex-col items-center px-4 py-3 text-[12px] font-semibold whitespace-nowrap border-b-2 transition-all duration-200 min-w-[80px] cursor-pointer",
                                                isActive
                                                    ? `border-[#6366F1] ${colors.text} bg-gradient-to-b from-transparent to-indigo-50/40`
                                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50",
                                            )}
                                        >
                                            <span>{localizedDayShort}</span>
                                            <span className={cn(
                                                "text-[10px] mt-0.5 font-medium px-1.5 py-px rounded-full",
                                                isToday ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white" : "text-gray-400"
                                            )}>
                                                {isToday ? t("today") : `${toLocaleNumber(count, langCode)} ${t("cls")}`}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* ── Mobile / single-day view ── */}
                            <div className="p-4 print:hidden">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-[13px] font-bold text-gray-700">{translateDayName(activeDay, langCode)}</span>
                                    {activeDay === TODAY_NAME && (
                                        <span className="text-[11px] px-2 py-0.5 rounded-full text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] font-semibold">{t("today")}</span>
                                    )}
                                    <span className="text-[11px] text-gray-400 ml-auto">
                                        {toLocaleNumber(timetable[activeDay]?.length ?? 0, langCode)} {(timetable[activeDay]?.length ?? 0) !== 1 ? t("periods") : t("period")}
                                    </span>
                                </div>

                                {(timetable[activeDay]?.length ?? 0) === 0 ? (
                                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 p-4 text-gray-400">
                                        <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                                        <span className="text-[13px]">{t("no_classes_scheduled_for")} {translateDayName(activeDay, langCode)}.</span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {(timetable[activeDay] ?? []).map((period, i) => (
                                            <PeriodCard
                                                key={period.id}
                                                period={period}
                                                colors={DAY_COLORS[activeDay]}
                                                delay={i * 60}
                                                langCode={langCode}
                                                timeFormat={timeFormat}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ── Print / full weekly grid (hidden on screen) ── */}
                            <div className="hidden print:block p-4">
                                <table className="w-full border-collapse text-[11px]">
                                    <thead>
                                        <tr>
                                            {DAYS.map((day) => (
                                                <th key={day} className="border border-gray-300 px-2 py-2 bg-gray-100 font-bold text-gray-700 text-left">
                                                    {translateDayName(day, langCode)}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            {DAYS.map((day) => {
                                                const periods = timetable[day] ?? [];
                                                return (
                                                    <td key={day} className="border border-gray-300 p-1.5 align-top">
                                                        {periods.length === 0 ? (
                                                            <span className="text-gray-400 italic">—</span>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {periods.map((p) => (
                                                                    <div key={p.id} className="border border-gray-200 rounded p-1.5">
                                                                        <p className="font-semibold">{translateSubjectName(p.subject, langCode)}</p>
                                                                        <p className="text-gray-600">{formatTimeRange(p.time, langCode, timeFormat)}</p>
                                                                        {p.teacher && <p className="text-gray-500">{formatTeacher(p.teacher, langCode)}</p>}
                                                                        {p.room && <p className="text-gray-500">{t("room")}: {toLocaleNumber(p.room, langCode)}</p>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

