"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Loader2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
    "Present": "bg-[#16a34a] text-white",
    "Absent": "bg-[#dc2626] text-white",
    "Late": "bg-[#facc15] text-white",
    "Half Day": "bg-[#f97316] text-white",
    "Holiday": "bg-blue-600 text-white",
    "On Leave": "bg-sky-600 text-white",
};

// Gradient + text styles for the per-status summary cards.
const statusCardStyles: Record<string, { bar: string; text: string; bg?: string; border?: string; labelColor?: string }> = {
    "Present": { bar: "from-green-500 to-emerald-400", text: "text-green-700", bg: "bg-white", border: "border-gray-100", labelColor: "text-gray-400" },
    "Absent": { bar: "from-red-500 to-rose-400", text: "text-red-700", bg: "bg-white", border: "border-gray-100", labelColor: "text-gray-400" },
    "Late": { bar: "from-yellow-400 to-amber-400", text: "text-yellow-700", bg: "bg-white", border: "border-gray-100", labelColor: "text-gray-400" },
    "Half Day": { bar: "from-orange-500 to-amber-400", text: "text-orange-700", bg: "bg-white", border: "border-gray-100", labelColor: "text-gray-400" },
    "Holiday": { bar: "from-blue-600 to-indigo-500", text: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50/90 dark:bg-blue-950/50", border: "border-blue-200 dark:border-blue-800", labelColor: "text-blue-600 dark:text-blue-400" },
    "On Leave": { bar: "from-sky-500 to-blue-500", text: "text-sky-700 dark:text-sky-300", bg: "bg-sky-50/90 dark:bg-sky-950/50", border: "border-sky-200 dark:border-sky-800", labelColor: "text-sky-600 dark:text-sky-400" },
};

interface AttendanceDayRecord {
    status?: string;
    entry_time?: string | null;
    exit_time?: string | null;
    holiday_title?: string | null;
    holiday_type?: string | null;
    is_public_holiday?: boolean;
    reason?: string | null;
    note?: string | null;
}

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export default function UserAttendancePage() {
    const { t } = useTranslation();
    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const now = new Date();
    const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(now.getFullYear());
    const [attendanceData, setAttendanceData] = useState<Record<number, AttendanceDayRecord | string>>({});
    const [monthlyPercentage, setMonthlyPercentage] = useState(0);
    const [yearlyPercentage, setYearlyPercentage] = useState(0);
    const [daysInMonth, setDaysInMonth] = useState(30);
    const [startDayOfWeek, setStartDayOfWeek] = useState(1);
    const [weeklyHolidays, setWeeklyHolidays] = useState<number[]>([7]);
    const [loading, setLoading] = useState(true);

    const fetchAttendance = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/user/attendance", {
                params: { month: currentMonth, year: currentYear }
            });
            const data = response.data?.data || response.data || {};
            setAttendanceData(data.attendance || {});

            if (Array.isArray(data.weeklyHolidays)) {
                setWeeklyHolidays(data.weeklyHolidays);
            }

            const mPct = typeof data.monthly_percentage === "number"
                ? data.monthly_percentage
                : (data.monthly_percentage ? parseFloat(data.monthly_percentage) : 0);
            setMonthlyPercentage(mPct);

            const yPct = typeof data.yearly_percentage === "number"
                ? data.yearly_percentage
                : (typeof data.percentage === "number" ? data.percentage : (data.percentage ? parseFloat(data.percentage) : mPct));
            setYearlyPercentage(yPct);

            setDaysInMonth(data.daysInMonth || new Date(currentYear, currentMonth, 0).getDate());
            setStartDayOfWeek(data.startDayOfWeek || (new Date(currentYear, currentMonth - 1, 1).getDay() || 7));
        } catch (error) {
            console.error("Error fetching attendance:", error);
            toast.error(t("failed_to_load_attendance") || "Failed to load attendance");
            setDaysInMonth(new Date(currentYear, currentMonth, 0).getDate());
            setStartDayOfWeek(new Date(currentYear, currentMonth - 1, 1).getDay() || 7);
        } finally {
            setLoading(false);
        }
    }, [currentMonth, currentYear, t]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

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

    // startDayOfWeek: 1=Mon ... 7=Sun, convert to 0-indexed offset
    const startOffset = startDayOfWeek - 1;
    const totalCells = Math.ceil((daysInMonth + startOffset) / 7) * 7;
    const cells = Array.from({ length: totalCells }, (_, i) => {
        const day = i - startOffset + 1;
        return day > 0 && day <= daysInMonth ? day : null;
    });

    // Per-status counts derived from the fetched data (in sync with admin records).
    const statusCounts: Record<string, number> = {};
    Object.values(attendanceData).forEach((item) => {
        const s = typeof item === "string" ? item : item?.status;
        if (s) {
            statusCounts[s] = (statusCounts[s] || 0) + 1;
        }
    });

    // Highlight today's cell when viewing the current month.
    const todayDay =
        currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear()
            ? now.getDate()
            : null;

    return (
        <div className="p-4 lg:p-6 space-y-5 min-h-screen font-sans animate-in fade-in duration-500">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

                {/* ── Header ── */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <CalendarDays className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none">{t("attendance")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{monthNames[currentMonth - 1]} {currentYear}</p>
                        </div>
                    </div>
                    {!loading && (
                        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                            {/* Monthly % */}
                            <div className="flex items-center gap-1.5 bg-white/80 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 px-3 py-1.5 rounded-full shadow-2xs">
                                <span className="text-[11px] font-semibold text-gray-600 dark:text-zinc-300">{t("monthly") || "Monthly"}:</span>
                                <span className={cn(
                                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white shadow-2xs bg-gradient-to-r",
                                    monthlyPercentage >= 75 ? "from-green-500 to-emerald-500" : "from-amber-500 to-rose-500"
                                )}>
                                    {monthlyPercentage}%
                                </span>
                            </div>

                            {/* Yearly / Overall % */}
                            <div className="flex items-center gap-1.5 bg-white/80 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 px-3 py-1.5 rounded-full shadow-2xs">
                                <span className="text-[11px] font-semibold text-gray-600 dark:text-zinc-300">{t("overall") || "Overall"} ({t("yearly") || "Yearly"}):</span>
                                <span className={cn(
                                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white shadow-2xs bg-gradient-to-r",
                                    yearlyPercentage >= 75 ? "from-emerald-500 to-green-600" : "from-red-500 to-rose-500"
                                )}>
                                    {yearlyPercentage}%
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 lg:p-5 space-y-5">

                    {/* ── Summary stat cards ── */}
                    {!loading && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {Object.keys(statusColors).map((status) => {
                                const style = statusCardStyles[status] || { bar: "from-gray-400 to-gray-300", text: "text-gray-600", bg: "bg-white", border: "border-gray-100", labelColor: "text-gray-400" };
                                return (
                                    <div key={status} className={cn("rounded-xl border shadow-sm overflow-hidden", style.border || "border-gray-100", style.bg || "bg-white")}>
                                        <div className={cn("h-1 w-full bg-gradient-to-r", style.bar)} />
                                        <div className="px-3 py-2.5">
                                            <p className={cn("text-[10px] font-semibold uppercase tracking-wide leading-none truncate", style.labelColor || "text-gray-400")}>{status}</p>
                                            <p className={cn("mt-1 text-xl font-bold", style.text)}>{statusCounts[status] || 0}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Month nav ── */}
                    <div className="flex items-center justify-center gap-4">
                        <Button
                            onClick={goToPrevMonth}
                            size="icon-sm"
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-90 shadow-sm transition-all rounded-[10px] active:scale-95"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="font-bold text-[15px] text-gray-800 min-w-[150px] text-center">
                            {monthNames[currentMonth - 1]} {currentYear}
                        </div>
                        <Button
                            onClick={goToNextMonth}
                            size="icon-sm"
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-90 shadow-sm transition-all rounded-[10px] active:scale-95"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-16 text-gray-400 text-sm">
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t("loading")}
                            </div>
                        </div>
                    ) : (
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

                            {/* Calendar Body */}
                            <div className="grid grid-cols-7">
                                {cells.map((day, idx) => {
                                    const cellItem = day ? attendanceData[day] : null;
                                    const status = typeof cellItem === "string" ? cellItem : cellItem?.status;
                                    const entryTime = typeof cellItem === "object" ? cellItem?.entry_time : null;
                                    const exitTime = typeof cellItem === "object" ? cellItem?.exit_time : null;
                                    const holidayTitle = typeof cellItem === "object" ? cellItem?.holiday_title : null;
                                    const isWeekend = typeof cellItem === "object" ? Boolean(cellItem?.is_weekend) : (day ? weeklyHolidays.includes(new Date(currentYear, currentMonth - 1, day).getDay() === 0 ? 7 : new Date(currentYear, currentMonth - 1, day).getDay()) : false);
                                    const isHoliday = (status === "Holiday" || Boolean(holidayTitle)) && !isWeekend;
                                    const isWeeklyHoliday = status === "Weekly Holiday" || (isWeekend && (!status || status === "Weekly Holiday" || status === "Holiday"));
                                    const isOnLeave = status === "On Leave";
                                    const isToday = day === todayDay;

                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "min-h-[76px] sm:min-h-[105px] border-r border-b border-gray-100 last:border-r-0 transition-colors flex flex-col justify-between p-1 sm:p-2",
                                                idx >= cells.length - 7 ? "border-b-0" : "",
                                                isToday
                                                    ? "bg-indigo-50/60 ring-1 ring-inset ring-indigo-200"
                                                    : (isWeeklyHoliday || isWeekend)
                                                        ? "bg-red-50/90 hover:bg-red-100/90 dark:bg-red-950/40 border-red-200/80"
                                                        : isHoliday
                                                            ? "bg-blue-50/80 hover:bg-blue-100/80 dark:bg-blue-950/40 border-blue-200/80"
                                                            : isOnLeave
                                                                ? "bg-sky-50/80 hover:bg-sky-100/80 dark:bg-sky-950/40 border-sky-200/80"
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
                                                            : (isWeeklyHoliday || isWeekend)
                                                                ? "text-red-600 font-bold"
                                                                : isHoliday
                                                                    ? "text-blue-600 font-bold"
                                                                    : "text-gray-500"
                                                    )}>
                                                        {isToday && (
                                                            <span className="text-[8px] font-bold uppercase bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white px-1 py-0.5 rounded leading-none">
                                                                {t("today") || "TODAY"}
                                                            </span>
                                                        )}
                                                        <span>{day}</span>
                                                    </div>

                                                    {(status || holidayTitle || isWeekend) && (
                                                        <div className="mt-1 space-y-1">
                                                            {(isWeeklyHoliday || (isWeekend && !entryTime)) ? (
                                                                <div className="px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold rounded shadow-xs flex items-center justify-center text-center leading-tight bg-red-600 text-white">
                                                                    {status || t("weekly_holiday") || "Weekly Holiday"}
                                                                </div>
                                                            ) : status ? (
                                                                <div className={cn(
                                                                    "px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold rounded shadow-xs flex items-center justify-center text-center leading-tight",
                                                                    statusColors[status] || "bg-gray-500 text-white"
                                                                )}>
                                                                    {status}
                                                                </div>
                                                            ) : null}

                                                            {holidayTitle && !isWeekend && (
                                                                <p
                                                                    className="text-[8px] sm:text-[9.5px] font-semibold text-blue-700 dark:text-blue-300 line-clamp-2 text-center leading-tight px-1 bg-blue-100/90 dark:bg-blue-900/40 border border-blue-200/80 dark:border-blue-800 rounded py-0.5 shadow-2xs"
                                                                    title={holidayTitle}
                                                                >
                                                                    {holidayTitle}
                                                                </p>
                                                            )}

                                                            {(entryTime || exitTime) && (
                                                                <div className="text-[8px] sm:text-[9.5px] font-medium flex flex-col items-center justify-center gap-0.5 pt-0.5 leading-tight">
                                                                    {entryTime && (
                                                                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                                                                            <span className="text-[7.5px] sm:text-[8.5px] text-gray-500 font-normal uppercase">In:</span> {entryTime}
                                                                        </span>
                                                                    )}
                                                                    {exitTime && (
                                                                        <span className="text-indigo-700 dark:text-indigo-400 font-semibold flex items-center gap-0.5">
                                                                            <span className="text-[7.5px] sm:text-[8.5px] text-gray-500 font-normal uppercase">Out:</span> {exitTime}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
