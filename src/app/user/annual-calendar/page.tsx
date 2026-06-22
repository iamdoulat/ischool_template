"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    CalendarRange, Calendar, Tag, FolderOpen,
} from "lucide-react";

interface CalendarEntry {
    id: string;
    start_date: string;
    end_date: string;
    description: string;
    holiday_type?: { name: string };
    is_front_site: boolean;
}

const TYPE_COLORS: Record<string, string> = {
    holiday: "bg-rose-50 text-rose-600 border-rose-200",
    activity: "bg-amber-50 text-amber-600 border-amber-200",
    "school events": "bg-indigo-50 text-indigo-600 border-indigo-200",
    vacation: "bg-emerald-50 text-emerald-600 border-emerald-200",
};

function typeColor(name?: string) {
    return TYPE_COLORS[(name || "").toLowerCase()] || "bg-gray-50 text-gray-600 border-gray-200";
}

function SkeletonRow() {
    return (
        <div className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-100 animate-pulse">
            <div className="h-12 w-12 rounded-lg bg-gray-200/70 shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 rounded bg-gray-200/70" />
                <div className="h-2.5 w-1/2 rounded bg-gray-200/60" />
            </div>
            <div className="h-6 w-16 rounded-full bg-gray-200/70" />
        </div>
    );
}

export default function UserAnnualCalendarPage() {
    const [entries, setEntries] = useState<CalendarEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("/annual-calendar/annual-calendars", {
                    params: { is_front_site: true, no_paginate: true },
                });
                const payload = res.data?.data ?? res.data ?? [];
                setEntries(Array.isArray(payload) ? payload : []);
            } catch {
                toast.error("Failed to load calendar");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const dayMonth = (dateStr: string) => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return { day: "—", month: "" };
        return {
            day: d.toLocaleDateString("en-US", { day: "2-digit" }),
            month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
        };
    };

    const grouped = useMemo(() => {
        const map = new Map<string, CalendarEntry[]>();
        for (const e of entries) {
            const d = new Date(e.start_date);
            const key = isNaN(d.getTime()) ? "Other" : d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(e);
        }
        return Array.from(map.entries());
    }, [entries]);

    return (
        <div className="p-4 lg:p-6 space-y-5 min-h-screen font-sans animate-in fade-in duration-500">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <CalendarRange className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none">Annual Calendar</h1>
                            <p className="text-[11px] text-gray-500 mt-1">Holidays, events, and vacation schedule</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 lg:p-5">
                    {loading ? (
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow />
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
                            <FolderOpen className="h-12 w-12 opacity-30" />
                            <p className="text-[12px] font-semibold">No calendar events published.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {grouped.map(([month, items]) => (
                                <div key={month}>
                                    <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 pl-1">{month}</h2>
                                    <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                                        {items.map(item => {
                                            const dm = dayMonth(item.start_date);
                                            const multiDay = item.start_date !== item.end_date;
                                            return (
                                                <div key={item.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50/60 transition-colors">
                                                    <div className="flex flex-col items-center justify-center h-12 w-12 shrink-0 rounded-lg bg-gradient-to-br from-[#FF9800]/10 to-[#6366F1]/10 border border-indigo-100">
                                                        <span className="text-[14px] font-bold text-indigo-700 leading-none">{dm.day}</span>
                                                        <span className="text-[8px] font-semibold text-indigo-400 mt-0.5">{dm.month}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px] font-bold text-gray-800 leading-tight">{item.description}</p>
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] text-gray-400 font-medium">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {formatDate(item.start_date)}{multiDay ? ` – ${formatDate(item.end_date)}` : ""}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {item.holiday_type?.name && (
                                                        <span className={cn("shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold border", typeColor(item.holiday_type.name))}>
                                                            <Tag className="h-3 w-3" />
                                                            {item.holiday_type.name}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
