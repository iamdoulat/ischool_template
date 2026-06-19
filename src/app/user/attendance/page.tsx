"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Loader2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
    "Present": "bg-[#16a34a] text-white",
    "Absent": "bg-[#dc2626] text-white",
    "Late": "bg-[#facc15] text-white",
    "Half Day": "bg-[#f97316] text-white",
    "Holiday": "bg-[#9ca3af] text-white",
    "On Leave": "bg-[#6b7280] text-white",
};

// Gradient + text styles for the per-status summary cards.
const statusCardStyles: Record<string, { bar: string; text: string }> = {
    "Present": { bar: "from-green-500 to-emerald-400", text: "text-green-700" },
    "Absent": { bar: "from-red-500 to-rose-400", text: "text-red-700" },
    "Late": { bar: "from-yellow-400 to-amber-400", text: "text-yellow-700" },
    "Half Day": { bar: "from-orange-500 to-amber-400", text: "text-orange-700" },
    "Holiday": { bar: "from-gray-400 to-gray-300", text: "text-gray-600" },
    "On Leave": { bar: "from-slate-500 to-slate-400", text: "text-slate-700" },
};

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export default function UserAttendancePage() {
    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const now = new Date();
    const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(now.getFullYear());
    const [attendanceData, setAttendanceData] = useState<Record<number, string>>({});
    const [percentage, setPercentage] = useState(0);
    const [daysInMonth, setDaysInMonth] = useState(30);
    const [startDayOfWeek, setStartDayOfWeek] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetchAttendance = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/user/attendance", {
                params: { month: currentMonth, year: currentYear }
            });
            const data = response.data?.data || {};
            setAttendanceData(data.attendance || {});
            setPercentage(data.percentage || 0);
            setDaysInMonth(data.daysInMonth || 30);
            setStartDayOfWeek(data.startDayOfWeek || 1);
        } catch (error) {
            console.error("Error fetching attendance:", error);
            toast.error("Failed to load attendance");
        } finally {
            setLoading(false);
        }
    }, [currentMonth, currentYear]);

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
    Object.values(attendanceData).forEach((s) => {
        statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    // Highlight today's cell when viewing the current month.
    const todayDay =
        currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear()
            ? now.getDate()
            : null;

    const isAbove = percentage >= 75;

    return (
        <div className="p-4 lg:p-6 space-y-5 min-h-screen font-sans animate-in fade-in duration-500">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

                {/* ── Header ── */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <CalendarDays className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none">Attendance</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{monthNames[currentMonth - 1]} {currentYear}</p>
                        </div>
                    </div>
                    {!loading && (
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-gray-500 hidden sm:inline">Overall</span>
                            <span className={cn(
                                "inline-flex items-center rounded-full px-3 py-1 text-[13px] font-bold text-white shadow-sm bg-gradient-to-r",
                                isAbove ? "from-green-500 to-emerald-400" : "from-red-500 to-rose-400"
                            )}>
                                {percentage}%
                            </span>
                        </div>
                    )}
                </div>

                <div className="p-4 lg:p-5 space-y-5">

                    {/* ── Summary stat cards ── */}
                    {!loading && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {Object.keys(statusColors).map((status) => {
                                const style = statusCardStyles[status];
                                return (
                                    <div key={status} className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                                        <div className={cn("h-1 w-full bg-gradient-to-r", style.bar)} />
                                        <div className="px-3 py-2.5">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 leading-none truncate">{status}</p>
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
                                Loading attendance...
                            </div>
                        </div>
                    ) : (
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                            {/* Days Header */}
                            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80">
                                {daysOfWeek.map((day, idx) => (
                                    <div key={idx} className="text-center py-2 text-[10px] sm:text-[12px] text-gray-600 font-bold border-r border-gray-200 last:border-r-0 uppercase">
                                        <span className="sm:hidden">{day.charAt(0)}</span>
                                        <span className="hidden sm:inline">{day}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Body */}
                            <div className="grid grid-cols-7">
                                {cells.map((day, idx) => {
                                    const status = day ? attendanceData[day] : null;
                                    const isToday = day === todayDay;
                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "min-h-[64px] sm:min-h-[100px] border-r border-b border-gray-100 last:border-r-0 transition-colors",
                                                idx >= cells.length - 7 ? "border-b-0" : "",
                                                day ? "hover:bg-indigo-50/30" : "bg-gray-50/40",
                                                isToday ? "bg-indigo-50/60 ring-1 ring-inset ring-indigo-200" : ""
                                            )}
                                        >
                                            {day && (
                                                <div className="flex flex-col h-full">
                                                    <div className={cn(
                                                        "p-1.5 text-[11px] font-semibold flex items-center justify-end gap-1",
                                                        isToday ? "text-indigo-600" : "text-gray-500"
                                                    )}>
                                                        {isToday && <span className="text-[8px] font-bold uppercase bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white px-1 py-px rounded">Today</span>}
                                                        {day}
                                                    </div>
                                                    {status && (
                                                        <div className={cn(
                                                            "mx-1 mb-1 px-1 py-0.5 text-[8px] sm:text-[10px] font-bold rounded shadow-sm flex items-center justify-center text-center leading-tight",
                                                            statusColors[status]
                                                        )}>
                                                            {status}
                                                        </div>
                                                    )}
                                                </div>
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
