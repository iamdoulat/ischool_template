"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "@/hooks/use-translation";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    CalendarRange,
    Calendar,
    Tag,
    ChevronLeft,
    ChevronRight,
    Loader2,
    CalendarDays,
    Info,
    LayoutGrid,
    List,
    Clock,
    UserCheck,
    Clock3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface CalendarEntry {
    id: string | number;
    start_date: string;
    end_date: string;
    description: string;
    holiday_type?: { name: string };
    holiday_type_name?: string;
    is_front_site?: boolean;
    is_leave?: boolean;
    leave_status?: "Pending" | "Approved" | "Disapproved" | string;
    leave_type?: string;
    half_day?: string;
    admin_remark?: string;
}

interface EventDetail {
    title: string;
    type: string;
    startDate: string;
    endDate: string;
    description?: string;
    isLeave?: boolean;
    leaveStatus?: string;
    leaveType?: string;
    halfDay?: string;
    adminRemark?: string;
}

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Color definitions for various event/holiday/leave categories
const CATEGORY_STYLES: Record<string, { badge: string; pill: string; cellBg: string; text: string }> = {
    "on leave": {
        badge: "bg-sky-600 text-white shadow-xs font-bold",
        pill: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
        cellBg: "bg-sky-50/80 hover:bg-sky-100/80 dark:bg-sky-950/40 border-sky-200/80",
        text: "text-sky-700 dark:text-sky-300",
    },
    on_leave: {
        badge: "bg-sky-600 text-white shadow-xs font-bold",
        pill: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
        cellBg: "bg-sky-50/80 hover:bg-sky-100/80 dark:bg-sky-950/40 border-sky-200/80",
        text: "text-sky-700 dark:text-sky-300",
    },
    leave: {
        badge: "bg-sky-600 text-white shadow-xs font-bold",
        pill: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
        cellBg: "bg-sky-50/80 hover:bg-sky-100/80 dark:bg-sky-950/40 border-sky-200/80",
        text: "text-sky-700 dark:text-sky-300",
    },
    pending: {
        badge: "bg-amber-500 text-white shadow-xs font-bold",
        pill: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
        cellBg: "bg-amber-50/80 hover:bg-amber-100/80 dark:bg-amber-950/40 border-amber-200/80",
        text: "text-amber-700 dark:text-amber-300",
    },
    "leave (pending)": {
        badge: "bg-amber-500 text-white shadow-xs font-bold",
        pill: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
        cellBg: "bg-amber-50/80 hover:bg-amber-100/80 dark:bg-amber-950/40 border-amber-200/80",
        text: "text-amber-700 dark:text-amber-300",
    },
    holiday: {
        badge: "bg-blue-600 text-white",
        pill: "bg-blue-100/90 text-blue-700 border-blue-200/80 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800",
        cellBg: "bg-blue-50/80 hover:bg-blue-100/80 dark:bg-blue-950/40 border-blue-200/80",
        text: "text-blue-700 dark:text-blue-300",
    },
    vacation: {
        badge: "bg-emerald-600 text-white",
        pill: "bg-emerald-100/90 text-emerald-700 border-emerald-200/80 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800",
        cellBg: "bg-emerald-50/80 hover:bg-emerald-100/80 dark:bg-emerald-950/40 border-emerald-200/80",
        text: "text-emerald-700 dark:text-emerald-300",
    },
    "school events": {
        badge: "bg-indigo-600 text-white",
        pill: "bg-indigo-100/90 text-indigo-700 border-indigo-200/80 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800",
        cellBg: "bg-indigo-50/80 hover:bg-indigo-100/80 dark:bg-indigo-950/40 border-indigo-200/80",
        text: "text-indigo-700 dark:text-indigo-300",
    },
    event: {
        badge: "bg-indigo-600 text-white",
        pill: "bg-indigo-100/90 text-indigo-700 border-indigo-200/80 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800",
        cellBg: "bg-indigo-50/80 hover:bg-indigo-100/80 dark:bg-indigo-950/40 border-indigo-200/80",
        text: "text-indigo-700 dark:text-indigo-300",
    },
    activity: {
        badge: "bg-amber-600 text-white",
        pill: "bg-amber-100/90 text-amber-800 border-amber-200/80 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800",
        cellBg: "bg-amber-50/80 hover:bg-amber-100/80 dark:bg-amber-950/40 border-amber-200/80",
        text: "text-amber-700 dark:text-amber-300",
    },
    weekly: {
        badge: "bg-red-600 text-white",
        pill: "bg-red-100/90 text-red-700 border-red-200/80 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800",
        cellBg: "bg-red-50/90 hover:bg-red-100/90 dark:bg-red-950/40 border-red-200/80",
        text: "text-red-700 dark:text-red-300",
    },
};

function getCategoryStyle(typeName?: string) {
    const key = (typeName || "").toLowerCase();
    for (const [k, v] of Object.entries(CATEGORY_STYLES)) {
        if (key.includes(k)) return v;
    }
    return CATEGORY_STYLES.holiday;
}

export default function UserAnnualCalendarPage() {
    const { t } = useTranslation();
    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const now = new Date();
    const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(now.getFullYear());
    const [entries, setEntries] = useState<CalendarEntry[]>([]);
    const [weeklyHolidays, setWeeklyHolidays] = useState<number[]>([7]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
    const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [calendarRes, settingsRes, leavesRes] = await Promise.allSettled([
                api.get("/annual-calendar/annual-calendars", {
                    params: { no_paginate: true },
                }),
                api.get("/system-setting/general-setting"),
                api.get("/user/apply-leave", {
                    params: { per_page: 200 },
                }),
            ]);

            const allEntriesList: CalendarEntry[] = [];

            // 1. Annual Calendar Events
            if (calendarRes.status === "fulfilled") {
                const payload = calendarRes.value.data?.data ?? calendarRes.value.data ?? [];
                if (Array.isArray(payload)) {
                    allEntriesList.push(...payload);
                }
            }

            // 2. Student Leave Requests (Pending & Approved)
            if (leavesRes.status === "fulfilled") {
                const resData = leavesRes.value.data?.data ?? leavesRes.value.data ?? [];
                const leavesArr = Array.isArray(resData) ? resData : (resData.data || []);
                for (const l of leavesArr) {
                    if (!l.fromDate) continue;
                    const fromDate = l.fromDate;
                    const toDate = l.toDate || fromDate;
                    const status = l.status || "Pending";
                    const isPending = status.toLowerCase() === "pending";
                    const isApproved = status.toLowerCase() === "approved";

                    if (isPending || isApproved) {
                        const typeLabel = isApproved ? "On Leave" : "Pending";
                        const descriptionText = l.reason
                            ? `${l.leaveType || "Leave"}: ${l.reason}`
                            : `${l.leaveType || "Leave"} (${isApproved ? "Approved Leave" : "Pending Leave"})`;

                        allEntriesList.push({
                            id: `leave-${l.id}`,
                            start_date: fromDate,
                            end_date: toDate,
                            description: descriptionText,
                            holiday_type: { name: typeLabel },
                            holiday_type_name: typeLabel,
                            is_leave: true,
                            leave_status: status,
                            leave_type: l.leaveType,
                            half_day: l.halfDay,
                            admin_remark: l.adminRemark,
                        });
                    }
                }
            }

            setEntries(allEntriesList);

            // 3. System General Settings for Weekly Holidays
            if (settingsRes.status === "fulfilled") {
                const setting = settingsRes.value.data?.data ?? settingsRes.value.data ?? {};
                const startDay = strtolower(setting?.start_day_of_week ?? "");
                if (startDay === "saturday" || startDay === "sunday") {
                    setWeeklyHolidays([5]); // Friday
                } else if (startDay === "friday") {
                    setWeeklyHolidays([4, 5]); // Thursday & Friday
                } else {
                    setWeeklyHolidays([7]); // Sunday
                }
            }
        } catch {
            toast.error(t("failed_to_load_calendar") || "Failed to load calendar events");
        } finally {
            setLoading(false);
        }
    }, [t]);

    function strtolower(s: string) {
        return (s || "").toLowerCase().trim();
    }

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const goToPrevMonth = () => {
        if (currentMonth === 1) {
            setCurrentMonth(12);
            setCurrentYear(prev => prev - 1);
        } else {
            setCurrentMonth(prev => prev - 1);
        }
    };

    const goToNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentMonth(1);
            setCurrentYear(prev => prev + 1);
        } else {
            setCurrentMonth(prev => prev + 1);
        }
    };

    const goToToday = () => {
        setCurrentMonth(now.getMonth() + 1);
        setCurrentYear(now.getFullYear());
    };

    // Calculate calendar grid days for currentMonth and currentYear
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    // JS getDay(): 0=Sun, 1=Mon ... 6=Sat. Convert to 1=Mon ... 7=Sun
    const firstDayOfWeekRaw = new Date(currentYear, currentMonth - 1, 1).getDay();
    const startDayOfWeek = firstDayOfWeekRaw === 0 ? 7 : firstDayOfWeekRaw;
    const startOffset = startDayOfWeek - 1;
    const totalCells = Math.ceil((daysInMonth + startOffset) / 7) * 7;
    const cells = Array.from({ length: totalCells }, (_, i) => {
        const day = i - startOffset + 1;
        return day > 0 && day <= daysInMonth ? day : null;
    });

    // Map events to day numbers of the current month
    const monthEventMap = useMemo(() => {
        const map: Record<number, CalendarEntry[]> = {};
        for (const entry of entries) {
            if (!entry.start_date) continue;
            const start = new Date(entry.start_date);
            const end = entry.end_date ? new Date(entry.end_date) : start;

            const curr = new Date(start);
            while (curr <= end) {
                if (curr.getFullYear() === currentYear && curr.getMonth() + 1 === currentMonth) {
                    const dayNum = curr.getDate();
                    if (!map[dayNum]) map[dayNum] = [];
                    map[dayNum].push(entry);
                }
                curr.setDate(curr.getDate() + 1);
            }
        }
        return map;
    }, [entries, currentMonth, currentYear]);

    // Monthly event items list
    const currentMonthEntries = useMemo(() => {
        return entries.filter(e => {
            if (!e.start_date) return false;
            const s = new Date(e.start_date);
            const ed = e.end_date ? new Date(e.end_date) : s;
            const mStart = new Date(currentYear, currentMonth - 1, 1);
            const mEnd = new Date(currentYear, currentMonth, 0);
            return (s <= mEnd && ed >= mStart);
        });
    }, [entries, currentMonth, currentYear]);

    // Overall stats
    const stats = useMemo(() => {
        let holidays = 0;
        let vacations = 0;
        let schoolEvents = 0;
        let activities = 0;
        let onLeave = 0;
        let pendingLeaves = 0;

        for (const e of entries) {
            const tName = (e.holiday_type?.name || e.holiday_type_name || "").toLowerCase();
            if (e.is_leave) {
                if (e.leave_status?.toLowerCase() === "approved" || tName.includes("on leave")) {
                    onLeave++;
                } else {
                    pendingLeaves++;
                }
            } else if (tName.includes("vacation")) {
                vacations++;
            } else if (tName.includes("event")) {
                schoolEvents++;
            } else if (tName.includes("activity")) {
                activities++;
            } else {
                holidays++;
            }
        }

        // Count weekly holidays in current month
        let monthWeeklyHolidays = 0;
        for (let d = 1; d <= daysInMonth; d++) {
            const rawD = new Date(currentYear, currentMonth - 1, d).getDay();
            const isoDay = rawD === 0 ? 7 : rawD;
            if (weeklyHolidays.includes(isoDay)) {
                monthWeeklyHolidays++;
            }
        }

        return {
            holidays,
            vacations,
            schoolEvents,
            activities,
            onLeave,
            pendingLeaves,
            weeklyHolidays: monthWeeklyHolidays,
            totalEvents: entries.length,
            monthEventsCount: currentMonthEntries.length,
        };
    }, [entries, currentMonthEntries, daysInMonth, currentYear, currentMonth, weeklyHolidays]);

    const summaryCards = [
        {
            label: t("on_leave") || "On Leave",
            count: stats.onLeave,
            bar: "from-sky-500 to-blue-500",
            text: "text-sky-700 dark:text-sky-300",
            bg: "bg-sky-50/90 dark:bg-sky-950/50",
            border: "border-sky-200 dark:border-sky-800",
            labelColor: "text-sky-600 dark:text-sky-400",
        },
        {
            label: t("pending_leaves") || "Pending Leave",
            count: stats.pendingLeaves,
            bar: "from-amber-400 to-orange-500",
            text: "text-amber-700 dark:text-amber-300",
            bg: "bg-amber-50/90 dark:bg-amber-950/50",
            border: "border-amber-200 dark:border-amber-800",
            labelColor: "text-amber-600 dark:text-amber-400",
        },
        {
            label: t("public_holidays") || "Holidays",
            count: stats.holidays,
            bar: "from-blue-600 to-indigo-500",
            text: "text-blue-700 dark:text-blue-300",
            bg: "bg-blue-50/90 dark:bg-blue-950/50",
            border: "border-blue-200 dark:border-blue-800",
            labelColor: "text-blue-600 dark:text-blue-400",
        },
        {
            label: t("vacations") || "Vacations",
            count: stats.vacations,
            bar: "from-emerald-500 to-teal-500",
            text: "text-emerald-700 dark:text-emerald-300",
            bg: "bg-emerald-50/90 dark:bg-emerald-950/50",
            border: "border-emerald-200 dark:border-emerald-800",
            labelColor: "text-emerald-600 dark:text-emerald-400",
        },
        {
            label: t("school_events") || "School Events",
            count: stats.schoolEvents,
            bar: "from-indigo-500 to-purple-500",
            text: "text-indigo-700 dark:text-indigo-300",
            bg: "bg-indigo-50/90 dark:bg-indigo-950/50",
            border: "border-indigo-200 dark:border-indigo-800",
            labelColor: "text-indigo-600 dark:text-indigo-400",
        },
        {
            label: t("weekly_holidays") || "Weekly Holidays",
            count: stats.weeklyHolidays,
            bar: "from-red-500 to-rose-500",
            text: "text-red-700 dark:text-red-300",
            bg: "bg-red-50/90 dark:bg-red-950/50",
            border: "border-red-200 dark:border-red-800",
            labelColor: "text-red-600 dark:text-red-400",
        },
    ];

    const todayDay =
        currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear()
            ? now.getDate()
            : null;

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    return (
        <div className="p-4 lg:p-6 space-y-5 min-h-screen font-sans animate-in fade-in duration-500">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

                {/* ── Header ── */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <CalendarRange className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none">
                                {t("annual_calendar") || "Annual Calendar"}
                            </h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {t("holidays_events_and_vacation_schedule") || "Holidays Events, Leaves And Vacation Schedule"}
                            </p>
                        </div>
                    </div>

                    {!loading && (
                        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                            {/* Monthly Events Badge */}
                            <div className="flex items-center gap-1.5 bg-white/80 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 px-3 py-1.5 rounded-full shadow-2xs">
                                <span className="text-[11px] font-semibold text-gray-600 dark:text-zinc-300">
                                    {t("this_month") || "This Month"}:
                                </span>
                                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white shadow-2xs bg-gradient-to-r from-blue-600 to-indigo-600">
                                    {stats.monthEventsCount} {t("events") || "Events"}
                                </span>
                            </div>

                            {/* View Switch Buttons */}
                            <div className="flex items-center bg-gray-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-gray-200 dark:border-zinc-700">
                                <button
                                    onClick={() => setViewMode("calendar")}
                                    className={cn(
                                        "flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer",
                                        viewMode === "calendar"
                                            ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                                            : "text-gray-500 hover:text-gray-800"
                                    )}
                                >
                                    <LayoutGrid className="h-3.5 w-3.5" />
                                    <span>{t("calendar") || "Calendar"}</span>
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={cn(
                                        "flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer",
                                        viewMode === "list"
                                            ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                                            : "text-gray-500 hover:text-gray-800"
                                    )}
                                >
                                    <List className="h-3.5 w-3.5" />
                                    <span>{t("schedule_list") || "Schedule"}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 lg:p-5 space-y-5">

                    {/* ── Top Summary Stat Cards ── */}
                    {!loading && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {summaryCards.map((card, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md",
                                        card.border,
                                        card.bg
                                    )}
                                >
                                    <div className={cn("h-1 w-full bg-gradient-to-r", card.bar)} />
                                    <div className="px-3 py-2.5">
                                        <p className={cn("text-[10px] font-semibold uppercase tracking-wide leading-none truncate", card.labelColor)}>
                                            {card.label}
                                        </p>
                                        <p className={cn("mt-1 text-xl font-bold", card.text)}>
                                            {card.count}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Month Navigation Controls ── */}
                    <div className="flex items-center justify-between gap-4">
                        <Button
                            onClick={goToToday}
                            variant="outline"
                            size="sm"
                            className="text-xs font-semibold rounded-[10px] hidden sm:flex items-center gap-1 border-gray-200"
                        >
                            <Clock className="h-3.5 w-3.5 text-indigo-500" />
                            {t("today") || "Today"}
                        </Button>

                        <div className="flex items-center justify-center gap-4 mx-auto sm:mx-0">
                            <Button
                                onClick={goToPrevMonth}
                                size="icon"
                                className="h-8 w-8 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-90 shadow-sm transition-all rounded-[10px] active:scale-95 cursor-pointer"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="font-bold text-[15px] text-gray-800 min-w-[160px] text-center">
                                {monthNames[currentMonth - 1]} {currentYear}
                            </div>
                            <Button
                                onClick={goToNextMonth}
                                size="icon"
                                className="h-8 w-8 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-90 shadow-sm transition-all rounded-[10px] active:scale-95 cursor-pointer"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="text-xs text-gray-500 font-medium hidden sm:block">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {currentMonthEntries.length} {t("events_in_month") || "Events in this month"}
                            </span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-16 text-gray-400 text-sm">
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                                {t("loading")}
                            </div>
                        </div>
                    ) : viewMode === "calendar" ? (
                        /* ── Calendar Grid View ── */
                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                            {/* Days Header */}
                            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80">
                                {daysOfWeek.map((day, idx) => {
                                    const isWeekendHeader = weeklyHolidays.includes(idx + 1);
                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "text-center py-2.5 text-[10px] sm:text-[12px] font-bold border-r border-gray-200 last:border-r-0 uppercase",
                                                isWeekendHeader ? "text-red-600 bg-red-50/60" : "text-gray-600"
                                            )}
                                        >
                                            <span className="sm:hidden">{day.charAt(0)}</span>
                                            <span className="hidden sm:inline">{day}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Calendar Grid Cells */}
                            <div className="grid grid-cols-7">
                                {cells.map((day, idx) => {
                                    const rawDayOfWeek = day ? new Date(currentYear, currentMonth - 1, day).getDay() : 0;
                                    const isoDayOfWeek = rawDayOfWeek === 0 ? 7 : rawDayOfWeek;
                                    const isWeekend = day ? weeklyHolidays.includes(isoDayOfWeek) : false;
                                    const isToday = day === todayDay;
                                    const dayEvents = day ? (monthEventMap[day] || []) : [];
                                    const primaryEvent = dayEvents[0];
                                    const typeName = primaryEvent?.holiday_type?.name || primaryEvent?.holiday_type_name || (dayEvents.length > 0 ? "Holiday" : "");
                                    const catStyle = getCategoryStyle(typeName);

                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "min-h-[84px] sm:min-h-[114px] border-r border-b border-gray-100 last:border-r-0 transition-colors flex flex-col justify-between p-1 sm:p-2",
                                                idx >= cells.length - 7 ? "border-b-0" : "",
                                                isToday
                                                    ? "bg-indigo-50/60 ring-1 ring-inset ring-indigo-200"
                                                    : isWeekend
                                                        ? "bg-red-50/90 hover:bg-red-100/90 dark:bg-red-950/40 border-red-200/80"
                                                        : dayEvents.length > 0
                                                            ? catStyle.cellBg
                                                            : day
                                                                ? "hover:bg-indigo-50/30"
                                                                : "bg-gray-50/40"
                                            )}
                                        >
                                            {day && (
                                                <>
                                                    <div className={cn(
                                                        "text-[11px] font-semibold flex items-center justify-end gap-1 leading-none",
                                                        isToday
                                                            ? "text-indigo-600 font-bold"
                                                            : isWeekend
                                                                ? "text-red-600 font-bold"
                                                                : dayEvents.length > 0
                                                                    ? catStyle.text + " font-bold"
                                                                    : "text-gray-500"
                                                    )}>
                                                        {isToday && (
                                                            <span className="text-[8px] font-bold uppercase bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white px-1 py-0.5 rounded leading-none shadow-2xs">
                                                                {t("today") || "TODAY"}
                                                            </span>
                                                        )}
                                                        <span>{day}</span>
                                                    </div>

                                                    {/* Event & Holiday & Leave Badges */}
                                                    <div className="mt-1 space-y-1">
                                                        {isWeekend && dayEvents.length === 0 && (
                                                            <div className="px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold rounded shadow-xs flex items-center justify-center text-center leading-tight bg-red-600 text-white">
                                                                {t("weekly_holiday") || "Weekly Holiday"}
                                                            </div>
                                                        )}

                                                        {dayEvents.slice(0, 2).map((ev, evIdx) => {
                                                            const evType = ev.holiday_type?.name || ev.holiday_type_name || "Holiday";
                                                            const evStyle = getCategoryStyle(evType);
                                                            return (
                                                                <button
                                                                    key={evIdx}
                                                                    type="button"
                                                                    onClick={() => setSelectedEvent({
                                                                        title: ev.description || evType,
                                                                        type: evType,
                                                                        startDate: ev.start_date,
                                                                        endDate: ev.end_date,
                                                                        description: ev.description,
                                                                        isLeave: ev.is_leave,
                                                                        leaveStatus: ev.leave_status,
                                                                        leaveType: ev.leave_type,
                                                                        halfDay: ev.half_day,
                                                                        adminRemark: ev.admin_remark,
                                                                    })}
                                                                    className="w-full text-left focus:outline-hidden cursor-pointer group"
                                                                >
                                                                    <div className={cn(
                                                                        "px-1.5 py-0.5 text-[8px] sm:text-[9.5px] font-bold rounded shadow-xs flex items-center justify-center text-center leading-tight truncate mb-0.5 group-hover:opacity-90",
                                                                        evStyle.badge
                                                                    )}>
                                                                        {evType}
                                                                    </div>
                                                                    {ev.description && (
                                                                        <p
                                                                            className={cn(
                                                                                "text-[8px] sm:text-[9px] font-semibold line-clamp-2 text-center leading-tight px-1 rounded py-0.5 shadow-2xs border group-hover:brightness-95",
                                                                                evStyle.pill
                                                                            )}
                                                                            title={ev.description}
                                                                        >
                                                                            {ev.description}
                                                                        </p>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}

                                                        {dayEvents.length > 2 && (
                                                            <p className="text-[7.5px] sm:text-[8.5px] font-bold text-center text-gray-500">
                                                                +{dayEvents.length - 2} more
                                                            </p>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* ── List / Schedule View ── */
                        <div className="space-y-4">
                            {currentMonthEntries.length === 0 ? (
                                <div className="text-center py-16 text-gray-400">
                                    <CalendarDays className="h-10 w-10 mx-auto opacity-30 mb-2" />
                                    <p className="text-sm font-semibold">{t("no_events_this_month") || "No events, holidays, or leaves scheduled for this month"}</p>
                                </div>
                            ) : (
                                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                                    {currentMonthEntries.map((item, itemIdx) => {
                                        const evType = item.holiday_type?.name || item.holiday_type_name || "Holiday";
                                        const evStyle = getCategoryStyle(evType);
                                        const multiDay = item.start_date !== item.end_date;
                                        const sDate = new Date(item.start_date);
                                        const dayStr = isNaN(sDate.getTime()) ? "—" : String(sDate.getDate()).padStart(2, "0");
                                        const mStr = isNaN(sDate.getTime()) ? "" : monthNames[sDate.getMonth()].slice(0, 3).toUpperCase();

                                        return (
                                            <div
                                                key={itemIdx}
                                                onClick={() => setSelectedEvent({
                                                    title: item.description || evType,
                                                    type: evType,
                                                    startDate: item.start_date,
                                                    endDate: item.end_date,
                                                    description: item.description,
                                                    isLeave: item.is_leave,
                                                    leaveStatus: item.leave_status,
                                                    leaveType: item.leave_type,
                                                    halfDay: item.half_day,
                                                    adminRemark: item.admin_remark,
                                                })}
                                                className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50/70 cursor-pointer transition-colors"
                                            >
                                                <div className="flex flex-col items-center justify-center h-12 w-12 shrink-0 rounded-lg bg-gradient-to-br from-[#FF9800]/10 to-[#6366F1]/10 border border-indigo-100">
                                                    <span className="text-[15px] font-bold text-indigo-700 leading-none">{dayStr}</span>
                                                    <span className="text-[8px] font-semibold text-indigo-500 mt-0.5">{mStr}</span>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-bold text-gray-800 leading-tight">
                                                        {item.description || evType}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-gray-400 font-medium">
                                                        <span className="flex items-center gap-1 text-gray-500">
                                                            <Calendar className="h-3 w-3 text-indigo-500" />
                                                            {formatDate(item.start_date)}{multiDay ? ` – ${formatDate(item.end_date)}` : ""}
                                                        </span>
                                                        {item.is_leave && item.leave_status && (
                                                            <span className={cn(
                                                                "px-2 py-0.2 rounded text-[10px] font-bold",
                                                                item.leave_status.toLowerCase() === "approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                                                            )}>
                                                                Status: {item.leave_status}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <span className={cn(
                                                    "shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold border",
                                                    evStyle.pill
                                                )}>
                                                    <Tag className="h-3 w-3" />
                                                    {evType}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Monthly Event Highlights Breakdown ── */}
                    {viewMode === "calendar" && currentMonthEntries.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                                <Info className="h-4 w-4 text-indigo-500" />
                                {monthNames[currentMonth - 1]} {currentYear} — {t("scheduled_events") || "Scheduled Events, Holidays & Leaves"}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {currentMonthEntries.map((ev, idx) => {
                                    const evType = ev.holiday_type?.name || ev.holiday_type_name || "Holiday";
                                    const evStyle = getCategoryStyle(evType);
                                    const multiDay = ev.start_date !== ev.end_date;

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedEvent({
                                                title: ev.description || evType,
                                                type: evType,
                                                startDate: ev.start_date,
                                                endDate: ev.end_date,
                                                description: ev.description,
                                                isLeave: ev.is_leave,
                                                leaveStatus: ev.leave_status,
                                                leaveType: ev.leave_type,
                                                halfDay: ev.half_day,
                                                adminRemark: ev.admin_remark,
                                            })}
                                            className="p-3 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between space-y-2"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug">
                                                    {ev.description || evType}
                                                </p>
                                                <span className={cn("shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full border", evStyle.pill)}>
                                                    {evType}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-medium flex items-center justify-between">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3 text-gray-400" />
                                                    {formatDate(ev.start_date)}{multiDay ? ` – ${formatDate(ev.end_date)}` : ""}
                                                </span>
                                                {ev.is_leave && (
                                                    <span className={cn(
                                                        "text-[9px] font-bold px-1.5 py-0.5 rounded",
                                                        ev.leave_status?.toLowerCase() === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                                    )}>
                                                        {ev.leave_status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Event / Leave Detail Modal ── */}
            <Dialog open={Boolean(selectedEvent)} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                <DialogContent className="sm:max-w-[440px] p-0 gap-0 overflow-hidden bg-white dark:bg-zinc-900">
                    <DialogHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-zinc-800 dark:to-zinc-850 border-b border-gray-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={cn("px-2.5 py-0.5 text-[10px] font-bold rounded-full border", selectedEvent ? getCategoryStyle(selectedEvent.type).pill : "")}>
                                {selectedEvent?.type}
                            </span>
                            {selectedEvent?.isLeave && (
                                <span className={cn(
                                    "px-2 py-0.5 text-[9px] font-bold rounded",
                                    selectedEvent.leaveStatus?.toLowerCase() === "approved"
                                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                        : "bg-amber-100 text-amber-800 border border-amber-200"
                                )}>
                                    Status: {selectedEvent.leaveStatus}
                                </span>
                            )}
                        </div>
                        <DialogTitle className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">
                            {selectedEvent?.title}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500 pt-1">
                            <span className="flex items-center gap-1 font-medium text-gray-600 dark:text-gray-300">
                                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                                {selectedEvent?.startDate ? formatDate(selectedEvent.startDate) : ""}
                                {selectedEvent?.endDate && selectedEvent.endDate !== selectedEvent.startDate ? ` – ${formatDate(selectedEvent.endDate)}` : ""}
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-5 space-y-3">
                        {selectedEvent?.description && (
                            <div className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-lg text-xs text-gray-700 dark:text-zinc-200 border border-gray-100 dark:border-zinc-700">
                                <p className="font-semibold text-gray-500 dark:text-zinc-400 text-[10px] uppercase mb-1">
                                    {selectedEvent.isLeave ? "Leave Reason & Details" : "Description"}
                                </p>
                                <p className="leading-relaxed">{selectedEvent.description}</p>
                            </div>
                        )}

                        {selectedEvent?.isLeave && selectedEvent.halfDay && (
                            <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                <Clock3 className="h-3.5 w-3.5 text-indigo-500" />
                                <span className="font-medium">Half Day Option:</span>
                                <span className="font-semibold text-gray-800">{selectedEvent.halfDay}</span>
                            </div>
                        )}

                        {selectedEvent?.isLeave && selectedEvent.adminRemark && (
                            <div className="p-3 bg-amber-50/60 rounded-lg text-xs text-amber-900 border border-amber-100">
                                <p className="font-bold text-[10px] uppercase text-amber-700 mb-0.5">Admin Remark</p>
                                <p>{selectedEvent.adminRemark}</p>
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedEvent(null)}
                                className="h-8 text-xs text-gray-600"
                            >
                                {t("close") || "Close"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
