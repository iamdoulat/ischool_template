"use client";

import { useState, useEffect, useCallback } from "react";
import {
    BookOpen, Clock, ChevronLeft, ChevronRight, Building, FileText,
    Loader2, Search, Printer, CalendarRange, CalendarDays, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";

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
    Monday:    { card: "border-indigo-200 bg-indigo-50/50",   accent: "text-indigo-600",  text: "text-indigo-700",  dot: "bg-indigo-500" },
    Tuesday:   { card: "border-violet-200 bg-violet-50/50",   accent: "text-violet-600",  text: "text-violet-700",  dot: "bg-violet-500" },
    Wednesday: { card: "border-sky-200 bg-sky-50/50",         accent: "text-sky-600",     text: "text-sky-700",     dot: "bg-sky-500" },
    Thursday:  { card: "border-emerald-200 bg-emerald-50/50", accent: "text-emerald-600", text: "text-emerald-700", dot: "bg-emerald-500" },
    Friday:    { card: "border-amber-200 bg-amber-50/50",     accent: "text-amber-600",   text: "text-amber-700",   dot: "bg-amber-500" },
    Saturday:  { card: "border-orange-200 bg-orange-50/50",   accent: "text-orange-600",  text: "text-orange-700",  dot: "bg-orange-500" },
    Sunday:    { card: "border-rose-200 bg-rose-50/50",       accent: "text-rose-500",    text: "text-rose-600",    dot: "bg-rose-500" },
};

const TODAY_NAME = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

/* ── Single lesson card ── */
function PlanCard({ plan, colors }: { plan: PlanItem; colors: typeof DAY_COLORS[string] }) {
    const { t } = useTranslation();
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
                    <div className="flex items-start gap-1.5">
                        <BookOpen className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", colors.accent)} />
                        <span className={cn("font-bold leading-tight text-[12px]", colors.text)}>{plan.subject}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                        <Clock className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", colors.accent)} />
                        <span className="leading-tight text-[11px] font-medium text-gray-600">{plan.time}</span>
                    </div>
                    {plan.room && (
                        <div className="flex items-start gap-1.5">
                            <Building className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", colors.accent)} />
                            <span className="leading-tight text-[11px] text-gray-600">{t("room")} {plan.room}</span>
                        </div>
                    )}
                    {(plan.topic || plan.subTopic) && (
                        <div className="mt-1 pt-1.5 border-t border-gray-200/70 space-y-0.5">
                            {plan.topic && (
                                <div className="flex items-start gap-1.5">
                                    <FileText className="h-3 w-3 mt-0.5 shrink-0 text-gray-400" />
                                    <span className="leading-tight text-[10px] text-gray-500">
                                        <span className="font-semibold text-gray-600">{t("topic")}:</span> {plan.topic}
                                    </span>
                                </div>
                            )}
                            {plan.subTopic && (
                                <div className="text-[10px] text-gray-500 pl-[18px] leading-tight">
                                    <span className="font-semibold text-gray-600">{t("sub")}:</span> {plan.subTopic}
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
        <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-200 bg-gray-50/40 py-6 text-gray-400">
            <XCircle className="h-4 w-4 opacity-50" />
            <span className="text-[11px] font-medium">{t("not_scheduled")}</span>
        </div>
    );
}

export default function UserLessonPlanPage() {
    const { t } = useTranslation();
    const [data, setData] = useState<LessonPlanData | null>(null);
    const [loading, setLoading] = useState(true);
    const [weekOffset, setWeekOffset] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeDay, setActiveDay] = useState(TODAY_NAME);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/user/lesson-plan", {
                params: { week: weekOffset },
            });
            const res = response.data?.data || response.data || {};
            setData(res);
        } catch (error) {
            console.error("Error fetching lesson plan:", error);
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
    const activePlans = plansFor(activeDay);

    return (
        <div className="p-4 lg:p-6 animate-in fade-in duration-500">
            <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden p-0 gap-0">
                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <CalendarRange className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none truncate">{t("lesson_plan")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {loading ? t("loading_schedule") : `${totalPlans} ${totalPlans === 1 ? t("lesson_this_week") : t("lessons_this_week")}`}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => window.print()}
                        title={t("print")}
                        className="h-9 shrink-0 px-3.5 gap-1.5 rounded-[10px] text-white text-[12px] font-semibold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity active:scale-95 print:hidden"
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
                                className="h-9 w-9 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-90 transition-opacity active:scale-95 border-0"
                                title={t("previous_week")}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-1.5 px-3 h-9 rounded-[10px] bg-white border border-gray-200 min-w-[180px] justify-center">
                                <CalendarDays className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                <span className="text-[12px] font-bold text-gray-700 whitespace-nowrap">
                                    {data ? `${data.weekStart} – ${data.weekEnd}` : t("loading")}
                                </span>
                            </div>
                            <Button
                                onClick={() => setWeekOffset((p) => p + 1)}
                                size="icon"
                                className="h-9 w-9 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-90 transition-opacity active:scale-95 border-0"
                                title={t("next_week")}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            {weekOffset !== 0 && (
                                <Button
                                    onClick={() => setWeekOffset(0)}
                                    variant="outline"
                                    className="h-9 px-3 rounded-[10px] text-[11px] font-semibold text-gray-600 border-gray-200"
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
                                    return (
                                        <div key={day} className="border-r border-gray-100 last:border-r-0 min-h-[180px]">
                                            {/* Day column header */}
                                            <div className={cn(
                                                "px-2 py-2.5 border-b text-center sticky top-0",
                                                isToday ? "bg-gradient-to-b from-indigo-50 to-transparent border-indigo-200" : "bg-gray-50/60 border-gray-100"
                                            )}>
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
                                                    <span className={cn("text-[11px] font-bold uppercase tracking-wide", isToday ? "text-indigo-700" : "text-gray-600")}>
                                                        {day.slice(0, 3)}
                                                    </span>
                                                    {isToday && (
                                                        <span className="text-[9px] px-1.5 py-px rounded-full text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] font-semibold">
                                                            {t("today")}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-gray-400 mt-0.5">{info?.date || ""}</div>
                                            </div>
                                            {/* Day column body */}
                                            <div className="p-1.5 space-y-2">
                                                {plans.length > 0 ? (
                                                    plans.map((plan, idx) => (
                                                        <PlanCard key={idx} plan={plan} colors={colors} />
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
                                        const colors = DAY_COLORS[day];
                                        return (
                                            <button
                                                key={day}
                                                onClick={() => setActiveDay(day)}
                                                className={cn(
                                                    "flex flex-col items-center px-4 py-2.5 text-[12px] font-semibold whitespace-nowrap border-b-2 transition-all duration-200 min-w-[78px]",
                                                    isActive
                                                        ? `border-[#6366F1] ${colors.text} bg-gradient-to-b from-transparent to-indigo-50/40`
                                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                                )}
                                            >
                                                <span>{day.slice(0, 3)}</span>
                                                <span className={cn(
                                                    "text-[10px] mt-0.5 font-medium px-1.5 py-px rounded-full",
                                                    isToday ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white" : "text-gray-400"
                                                )}>
                                                    {isToday ? t("today") : `${count}`}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-[13px] font-bold text-gray-700">{activeDay}</span>
                                        <span className="text-[11px] text-gray-400">{dayFor(activeDay)?.date || ""}</span>
                                        <span className="text-[11px] text-gray-400 ml-auto">
                                            {activePlans.length} {activePlans.length !== 1 ? t("lessons") : t("lesson")}
                                        </span>
                                    </div>
                                    {activePlans.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {activePlans.map((plan, idx) => (
                                                <PlanCard key={idx} plan={plan} colors={DAY_COLORS[activeDay]} />
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
                                    {t("lesson_plan")} — {data?.weekStart} {t("to")} {data?.weekEnd}
                                </h2>
                                <table className="w-full border-collapse text-[11px]">
                                    <thead>
                                        <tr>
                                            {DAYS.map((day) => (
                                                <th key={day} className="border border-gray-300 px-2 py-2 bg-gray-100 font-bold text-gray-700 text-left">
                                                    {day}
                                                    <span className="block font-normal text-gray-500">{dayFor(day)?.date || ""}</span>
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
                                                                        <p className="font-semibold">{p.subject}</p>
                                                                        <p className="text-gray-600">{p.time}</p>
                                                                        {p.room && <p className="text-gray-500">{t("room")}: {p.room}</p>}
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
        </div>
    );
}
