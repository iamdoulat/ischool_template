"use client";

import { useState, useEffect, useCallback } from "react";
import {
    BookOpen, Clock, ChevronLeft, ChevronRight, Building, FileText,
    Loader2, Search, Printer, CalendarRange, CalendarDays, XCircle, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    cn,
    toLocaleNumber,
    translateSubjectName,
    translateDayName,
    translateDayShortName,
} from "@/lib/utils";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useSettings } from "@/components/providers/settings-provider";

interface PlanItem {
    subject: string;
    time: string;
    room: string;
    lesson: string;
    topic: string;
    subTopic: string;
}

interface DaySchedule {
    day: string;
    date: string;
    plans: PlanItem[];
}

interface LessonPlanData {
    weekStart: string;
    weekEnd: string;
    schedule: DaySchedule[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DAY_COLORS: Record<string, { card: string; accent: string; text: string; dot: string }> = {
    Monday:    { card: "border-indigo-200 bg-indigo-50/50 dark:bg-slate-900/90 dark:border-indigo-900/60",   accent: "text-indigo-600 dark:text-indigo-400",  text: "text-indigo-700 dark:text-indigo-300",  dot: "bg-indigo-500" },
    Tuesday:   { card: "border-violet-200 bg-violet-50/50 dark:bg-slate-900/90 dark:border-violet-900/60",   accent: "text-violet-600 dark:text-violet-400",  text: "text-violet-700 dark:text-violet-300",  dot: "bg-violet-500" },
    Wednesday: { card: "border-sky-200 bg-sky-50/50 dark:bg-slate-900/90 dark:border-sky-900/60",         accent: "text-sky-600 dark:text-sky-400",     text: "text-sky-900 dark:text-sky-200 font-bold", dot: "bg-sky-500" },
    Thursday:  { card: "border-emerald-200 bg-emerald-50/50 dark:bg-slate-900/90 dark:border-emerald-900/60", accent: "text-emerald-600 dark:text-emerald-400", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
    Friday:    { card: "border-amber-200 bg-amber-50/50 dark:bg-slate-900/90 dark:border-amber-900/60",     accent: "text-amber-600 dark:text-amber-400",   text: "text-amber-700 dark:text-amber-300",   dot: "bg-amber-500" },
    Saturday:  { card: "border-orange-200 bg-orange-50/50 dark:bg-slate-900/90 dark:border-orange-900/60",   accent: "text-orange-600 dark:text-orange-400",  text: "text-orange-700 dark:text-orange-300",  dot: "bg-orange-500" },
    Sunday:    { card: "border-rose-200 bg-rose-50/50 dark:bg-slate-900/90 dark:border-rose-900/60",       accent: "text-rose-500 dark:text-rose-400",    text: "text-rose-600 dark:text-rose-300",    dot: "bg-rose-500" },
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

// ── Localize date string (MM/DD/YYYY or YYYY-MM-DD) into localized DD/MM/YYYY ──
function formatLocalizedDate(dateStr: string, langCode: string) {
    if (!dateStr) return "";
    const mdy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mdy) {
        const [, mm, dd, yyyy] = mdy;
        const pad = (v: string) => v.padStart(2, "0");
        return `${toLocaleNumber(pad(dd), langCode)}/${toLocaleNumber(pad(mm), langCode)}/${toLocaleNumber(yyyy, langCode)}`;
    }
    const ymd = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (ymd) {
        const [, yyyy, mm, dd] = ymd;
        const pad = (v: string) => v.padStart(2, "0");
        return `${toLocaleNumber(pad(dd), langCode)}/${toLocaleNumber(pad(mm), langCode)}/${toLocaleNumber(yyyy, langCode)}`;
    }
    return toLocaleNumber(dateStr, langCode);
}

/* ── Single lesson card ── */
function PlanCard({
    plan,
    colors,
    onView,
    langCode,
    timeFormat,
}: {
    plan: PlanItem;
    colors: typeof DAY_COLORS[string];
    onView: (plan: PlanItem) => void;
    langCode: string;
    timeFormat: "12" | "24";
}) {
    const { t } = useTranslation();
    const hasPlanData = !!(plan.topic || plan.subTopic || plan.lesson);
    const translatedSubject = translateSubjectName(plan.subject, langCode);
    const formattedTime = formatTimeRange(plan.time, langCode, timeFormat);
    const formattedRoom = toLocaleNumber(plan.room, langCode);

    return (
        <div
            className={cn(
                "rounded-xl border p-2.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
                colors.card
            )}
        >
            <div className="flex gap-2">
                <div className={cn("w-0.5 rounded-full shrink-0 self-stretch", colors.dot)} />
                <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                        <div className="flex items-start gap-1.5 min-w-0">
                            <BookOpen className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", colors.accent)} />
                            <span className={cn("font-bold leading-tight text-[12px]", colors.text)}>{translatedSubject}</span>
                        </div>
                        {hasPlanData && (
                            <Button
                                onClick={() => onView(plan)}
                                size="icon"
                                className="h-6 w-6 shrink-0 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md shadow-sm cursor-pointer"
                                title={t("view_details")}
                            >
                                <Eye className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                    <div className="flex items-start gap-1.5">
                        <Clock className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", colors.accent)} />
                        <span className="leading-tight text-[11px] font-medium text-gray-600 dark:text-gray-300">{formattedTime}</span>
                    </div>
                    {plan.room && (
                        <div className="flex items-start gap-1.5">
                            <Building className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", colors.accent)} />
                            <span className="leading-tight text-[11px] text-gray-600 dark:text-gray-300">{t("room")}: {formattedRoom}</span>
                        </div>
                    )}
                    {(plan.topic || plan.subTopic) && (
                        <div className="mt-1 pt-1.5 border-t border-gray-200/70 dark:border-gray-700/70 space-y-0.5">
                            {plan.topic && (
                                <div className="flex items-start gap-1.5">
                                    <FileText className="h-3 w-3 mt-0.5 shrink-0 text-gray-400" />
                                    <span className="leading-tight text-[10px] text-gray-500 dark:text-gray-300">
                                        <span className="font-semibold text-gray-600 dark:text-gray-200">{t("topic")}:</span> {plan.topic}
                                    </span>
                                </div>
                            )}
                            {plan.subTopic && (
                                <div className="text-[10px] text-gray-500 dark:text-gray-300 pl-[18px] leading-tight">
                                    <span className="font-semibold text-gray-600 dark:text-gray-200">{t("sub")}:</span> {plan.subTopic}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Empty-day placeholder ── */
function EmptyDay() {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-slate-900/60 py-6 text-gray-400 dark:text-gray-500">
            <XCircle className="h-4 w-4 opacity-50" />
            <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">{t("not_scheduled")}</span>
        </div>
    );
}

export default function UserLessonPlanPage() {
    const { t, language } = useTranslation();
    const langCode = language?.short_code || "en";
    const { settings } = useSettings();
    const timeFormat = settings?.time_format === "12" ? "12" : ("24" as const);

    const [data, setData] = useState<LessonPlanData | null>(null);
    const [loading, setLoading] = useState(true);
    const [weekOffset, setWeekOffset] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeDay, setActiveDay] = useState(TODAY_NAME);
    const [viewPlan, setViewPlan] = useState<PlanItem | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/user/lesson-plan", {
                params: { week: weekOffset },
            });
            const res = response.data?.data || response.data || {};
            setData(res);
        } catch {
            // Graceful fallback
        } finally {
            setLoading(false);
        }
    }, [weekOffset]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const matches = (p: PlanItem) =>
        !searchTerm ||
        p.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.lesson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.topic.toLowerCase().includes(searchTerm.toLowerCase());

    const schedule = (data?.schedule || []).map((day) => ({
        ...day,
        plans: day.plans.filter(matches),
    }));

    const dayFor = (day: string) => schedule.find((d) => d.day === day);
    const plansFor = (day: string) => dayFor(day)?.plans || [];
    const totalPlans = schedule.reduce((acc, d) => acc + d.plans.length, 0);
    const localizedTotalPlans = toLocaleNumber(totalPlans, langCode);
    const activePlans = plansFor(activeDay);

    const weekRangeDisplay = data
        ? `${formatLocalizedDate(data.weekStart, langCode)} – ${formatLocalizedDate(data.weekEnd, langCode)}`
        : t("loading");

    return (
        <div className="p-4 lg:p-6 animate-in fade-in duration-500">
            <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden p-0 gap-0">
                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <CalendarRange className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 space-y-1">
                            <h1 className="text-[16px] font-bold text-gray-800 dark:text-zinc-100 leading-snug">{t("lesson_plan")}</h1>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                {loading
                                    ? t("loading_schedule")
                                    : totalPlans === 1
                                        ? t("lesson_this_week", { count: localizedTotalPlans })
                                        : t("lessons_this_week", { count: localizedTotalPlans })}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => window.print()}
                        title={t("print")}
                        className="h-9 shrink-0 px-3.5 gap-1.5 rounded-[10px] text-white text-[12px] font-semibold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity active:scale-95 print:hidden cursor-pointer"
                    >
                        <Printer className="h-4 w-4" />
                        <span className="hidden sm:inline">{t("print")}</span>
                    </Button>
                </div>

                <CardContent className="p-0">
                    {/* ── Toolbar: search + week nav ── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-gray-100 print:hidden">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder={t("search_subject_or_topic")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 h-9 text-[12px] border-gray-200 focus-visible:ring-indigo-500 rounded-[10px] shadow-none"
                            />
                        </div>

                        <div className="flex items-center justify-center gap-2">
                            <Button
                                onClick={() => setWeekOffset((p) => p - 1)}
                                size="icon"
                                className="h-9 w-9 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-90 transition-opacity active:scale-95 border-0 cursor-pointer"
                                title={t("previous_week")}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-1.5 px-3 h-9 rounded-[10px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 min-w-[180px] justify-center">
                                <CalendarDays className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                <span className="text-[12px] font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                                    {weekRangeDisplay}
                                </span>
                            </div>
                            <Button
                                onClick={() => setWeekOffset((p) => p + 1)}
                                size="icon"
                                className="h-9 w-9 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-90 transition-opacity active:scale-95 border-0 cursor-pointer"
                                title={t("next_week")}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            {weekOffset !== 0 && (
                                <Button
                                    onClick={() => setWeekOffset(0)}
                                    variant="outline"
                                    className="h-9 px-3 rounded-[10px] text-[11px] font-semibold text-gray-600 border-gray-200 cursor-pointer"
                                    title={t("back_to_current_week")}
                                >
                                    {t("today")}
                                </Button>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span>{t("loading_lesson_plan")}</span>
                        </div>
                    ) : (
                        <>
                            {/* ── Desktop: weekly calendar grid ── */}
                            <div className="hidden lg:grid grid-cols-7 gap-0 print:hidden">
                                {DAYS.map((day) => {
                                    const info = dayFor(day);
                                    const plans = plansFor(day);
                                    const colors = DAY_COLORS[day];
                                    const isToday = day === TODAY_NAME && weekOffset === 0;
                                    const localizedDayShort = translateDayShortName(day, langCode);
                                    const localizedDate = formatLocalizedDate(info?.date || "", langCode);
                                    return (
                                        <div key={day} className="border-r border-gray-100 last:border-r-0 min-h-[180px]">
                                            {/* Day column header */}
                                            <div className={cn(
                                                "px-2 py-2.5 border-b text-center sticky top-0",
                                                isToday
                                                    ? "bg-gradient-to-b from-indigo-50/80 to-transparent dark:from-indigo-950/80 dark:to-slate-900 border-indigo-200 dark:border-indigo-800"
                                                    : "bg-gray-50/60 dark:bg-slate-900/80 border-gray-100 dark:border-gray-800"
                                            )}>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
                                                    <span className={cn("text-[11px] font-extrabold uppercase tracking-wide", isToday ? "text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-200")}>
                                                        {localizedDayShort}
                                                    </span>
                                                    {isToday && (
                                                        <span className="text-[9px] px-1.5 py-px rounded-full text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] font-semibold">
                                                            {t("today")}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 mt-0.5">{localizedDate}</div>
                                            </div>
                                            {/* Day column body */}
                                            <div className="p-1.5 space-y-2">
                                                {plans.length > 0 ? (
                                                    plans.map((plan, idx) => (
                                                        <PlanCard
                                                            key={idx}
                                                            plan={plan}
                                                            colors={colors}
                                                            onView={setViewPlan}
                                                            langCode={langCode}
                                                            timeFormat={timeFormat}
                                                        />
                                                    ))
                                                ) : (
                                                    <EmptyDay />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* ── Mobile / tablet: day tabs + single-day view ── */}
                            <div className="lg:hidden print:hidden">
                                <div className="flex overflow-x-auto border-b border-gray-200 custom-scrollbar">
                                    {DAYS.map((day) => {
                                        const count = plansFor(day).length;
                                        const isToday = day === TODAY_NAME && weekOffset === 0;
                                        const isActive = day === activeDay;
                                        const localizedDayShort = translateDayShortName(day, langCode);
                                        return (
                                            <button
                                                key={day}
                                                onClick={() => setActiveDay(day)}
                                                className={cn(
                                                    "flex flex-col items-center px-4 py-2.5 text-[12px] font-semibold whitespace-nowrap border-b-2 transition-all duration-200 min-w-[78px] cursor-pointer",
                                                    isActive
                                                        ? "border-[#6366F1] bg-gradient-to-b from-transparent to-indigo-50/40 text-indigo-700 dark:text-indigo-300 font-bold"
                                                        : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50"
                                                )}
                                            >
                                                <span className={cn(isActive ? "text-indigo-700 dark:text-indigo-300 font-bold" : "text-gray-700 dark:text-gray-300")}>{localizedDayShort}</span>
                                                <span className={cn(
                                                    "text-[10px] mt-0.5 font-medium px-1.5 py-px rounded-full",
                                                    isToday ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white" : "text-gray-400"
                                                )}>
                                                    {isToday ? t("today") : toLocaleNumber(count, langCode)}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-[13px] font-bold text-gray-700">{translateDayName(activeDay, langCode)}</span>
                                        <span className="text-[11px] text-gray-400">{formatLocalizedDate(dayFor(activeDay)?.date || "", langCode)}</span>
                                        <span className="text-[11px] text-gray-400 ml-auto">
                                            {toLocaleNumber(activePlans.length, langCode)} {activePlans.length !== 1 ? t("lessons") : t("lesson")}
                                        </span>
                                    </div>
                                    {activePlans.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {activePlans.map((plan, idx) => (
                                                <PlanCard
                                                    key={idx}
                                                    plan={plan}
                                                    colors={DAY_COLORS[activeDay]}
                                                    onView={setViewPlan}
                                                    langCode={langCode}
                                                    timeFormat={timeFormat}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyDay />
                                    )}
                                </div>
                            </div>

                            {/* ── Print: full weekly grid ── */}
                            <div className="hidden print:block p-4">
                                <h2 className="text-base font-bold mb-3">
                                    {t("lesson_plan")} — {formatLocalizedDate(data?.weekStart || "", langCode)} {t("to")} {formatLocalizedDate(data?.weekEnd || "", langCode)}
                                </h2>
                                <table className="w-full border-collapse text-[11px]">
                                    <thead>
                                        <tr>
                                            {DAYS.map((day) => (
                                                <th key={day} className="border border-gray-300 px-2 py-2 bg-gray-100 font-bold text-gray-700 text-left">
                                                    {translateDayName(day, langCode)}
                                                    <span className="block font-normal text-gray-500">{formatLocalizedDate(dayFor(day)?.date || "", langCode)}</span>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            {DAYS.map((day) => {
                                                const plans = plansFor(day);
                                                return (
                                                    <td key={day} className="border border-gray-300 p-1.5 align-top">
                                                        {plans.length === 0 ? (
                                                            <span className="text-gray-400 italic">—</span>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                {plans.map((p, i) => (
                                                                    <div key={i} className="border border-gray-200 rounded p-1.5">
                                                                        <p className="font-semibold">{translateSubjectName(p.subject, langCode)}</p>
                                                                        <p className="text-gray-600">{formatTimeRange(p.time, langCode, timeFormat)}</p>
                                                                        {p.room && <p className="text-gray-500">{t("room")}: {toLocaleNumber(p.room, langCode)}</p>}
                                                                        {p.topic && <p className="text-gray-500">{t("topic")}: {p.topic}</p>}
                                                                        {p.subTopic && <p className="text-gray-500">{t("sub")}: {p.subTopic}</p>}
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

            {/* ── View Details Modal ── */}
            <Dialog open={!!viewPlan} onOpenChange={(open) => !open && setViewPlan(null)}>
                <DialogContent className="max-w-lg rounded-xl border-0 shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="relative p-5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white" />
                            <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white" />
                        </div>
                        <div className="relative">
                            <DialogTitle className="text-base font-bold flex items-center gap-2.5">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                                    <Eye className="h-4 w-4" />
                                </span>
                                {t("lesson_details")}
                            </DialogTitle>
                            {viewPlan && (
                                <div className="flex flex-wrap gap-1.5 mt-2.5">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur-sm">
                                        <BookOpen className="h-3 w-3" />
                                        {translateSubjectName(viewPlan.subject, langCode)}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur-sm">
                                        <Clock className="h-3 w-3" />
                                        {formatTimeRange(viewPlan.time, langCode, timeFormat)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </DialogHeader>

                    <div className="p-5 space-y-4 max-h-[55vh] overflow-y-auto bg-white">
                        {viewPlan && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("subject")}</span>
                                        <p className="text-sm font-semibold text-gray-800">{translateSubjectName(viewPlan.subject, langCode)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("time")}</span>
                                        <p className="text-sm font-semibold text-gray-800">{formatTimeRange(viewPlan.time, langCode, timeFormat)}</p>
                                    </div>
                                    {viewPlan.room && (
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("room")}</span>
                                            <p className="text-sm font-semibold text-gray-800">{toLocaleNumber(viewPlan.room, langCode)}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-gray-100 pt-3">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                                            <span>{t("curriculum_hierarchy")}</span>
                                        </span>
                                        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                                    </div>

                                    <div className="relative pl-6 space-y-2.5 before:absolute before:left-[10px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-indigo-400 before:via-violet-400 before:to-emerald-400">
                                        {/* Step 1: Lesson */}
                                        <div className="relative flex items-start gap-2.5">
                                            <div className="absolute -left-6 top-1 h-5 w-5 rounded-full bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white flex items-center justify-center font-black text-[9px] shadow-xs">
                                                {toLocaleNumber(1, langCode)}
                                            </div>
                                            <div className="flex-1 bg-indigo-50/40 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 rounded-xl p-2.5">
                                                <span className="text-[9.5px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">{t("lesson")}</span>
                                                <p className="text-xs font-bold text-gray-800 dark:text-gray-100 mt-0.5">{viewPlan.lesson || "—"}</p>
                                            </div>
                                        </div>

                                        {/* Step 2: Topic */}
                                        <div className="relative flex items-start gap-2.5">
                                            <div className="absolute -left-6 top-1 h-5 w-5 rounded-full bg-violet-600 text-white flex items-center justify-center font-black text-[9px] shadow-xs">
                                                {toLocaleNumber(2, langCode)}
                                            </div>
                                            <div className="flex-1 bg-violet-50/40 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900 rounded-xl p-2.5">
                                                <span className="text-[9.5px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400">{t("topic")}</span>
                                                <p className="text-xs font-bold text-gray-800 dark:text-gray-100 mt-0.5">{viewPlan.topic || "—"}</p>
                                            </div>
                                        </div>

                                        {/* Step 3: Sub Topic */}
                                        {viewPlan.subTopic && (
                                            <div className="relative flex items-start gap-2.5">
                                                <div className="absolute -left-6 top-1 h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-[9px] shadow-xs">
                                                    {toLocaleNumber(3, langCode)}
                                                </div>
                                                <div className="flex-1 bg-emerald-50/40 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-xl p-2.5">
                                                    <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{t("sub")}</span>
                                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-100 mt-0.5">{viewPlan.subTopic}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter className="p-4 bg-gray-50/80 border-t border-gray-100">
                        <Button
                            onClick={() => setViewPlan(null)}
                            variant="outline"
                            className="h-9 px-5 rounded-lg text-[10px] font-bold uppercase tracking-widest border-gray-200 hover:bg-gray-100 transition-all cursor-pointer"
                        >
                            {t("close")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

