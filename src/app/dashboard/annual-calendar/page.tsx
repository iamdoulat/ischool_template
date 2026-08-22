"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parseISO, isValid } from "date-fns";
import {
    ChevronLeft, ChevronRight, Search, Plus, Pencil, Trash2,
    CalendarRange, Calendar, Loader2, FolderOpen,
    Copy, FileSpreadsheet, FileDown, Printer,
    LayoutGrid, List, Clock, Info, Tag, CalendarDays, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface HolidayTypeOption {
    id: string | number;
    name: string;
}

interface CalendarEntry {
    id: string | number;
    start_date: string;
    end_date: string;
    holiday_type_id: string | number;
    holiday_type?: { name: string };
    holiday_type_name?: string;
    description: string;
    creator?: { name: string; last_name: string; staff_id: string };
    is_front_site?: boolean;
}

interface EventDetail {
    id: string | number;
    title: string;
    type: string;
    startDate: string;
    endDate: string;
    description?: string;
    isFrontSite?: boolean;
    rawEntry?: CalendarEntry;
}

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const PAGE_SIZES = ["10", "25", "50", "100"];

// Color definitions for various event/holiday categories
const CATEGORY_STYLES: Record<string, { badge: string; pill: string; cellBg: string; text: string }> = {
    holiday: {
        badge: "bg-blue-600 text-white",
        pill: "bg-blue-100/90 text-blue-700 border-blue-200/80 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800",
        cellBg: "bg-blue-50/80 hover:bg-blue-100/80 dark:bg-blue-950/40 border-blue-200/80",
        text: "text-blue-700",
    },
    vacation: {
        badge: "bg-emerald-600 text-white",
        pill: "bg-emerald-100/90 text-emerald-700 border-emerald-200/80 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800",
        cellBg: "bg-emerald-50/80 hover:bg-emerald-100/80 dark:bg-emerald-950/40 border-emerald-200/80",
        text: "text-emerald-700",
    },
    "school events": {
        badge: "bg-indigo-600 text-white",
        pill: "bg-indigo-100/90 text-indigo-700 border-indigo-200/80 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800",
        cellBg: "bg-indigo-50/80 hover:bg-indigo-100/80 dark:bg-indigo-950/40 border-indigo-200/80",
        text: "text-indigo-700",
    },
    event: {
        badge: "bg-indigo-600 text-white",
        pill: "bg-indigo-100/90 text-indigo-700 border-indigo-200/80 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800",
        cellBg: "bg-indigo-50/80 hover:bg-indigo-100/80 dark:bg-indigo-950/40 border-indigo-200/80",
        text: "text-indigo-700",
    },
    activity: {
        badge: "bg-amber-600 text-white",
        pill: "bg-amber-100/90 text-amber-800 border-amber-200/80 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800",
        cellBg: "bg-amber-50/80 hover:bg-amber-100/80 dark:bg-amber-950/40 border-amber-200/80",
        text: "text-amber-700",
    },
    weekly: {
        badge: "bg-red-600 text-white",
        pill: "bg-red-100/90 text-red-700 border-red-200/80 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800",
        cellBg: "bg-red-50/90 hover:bg-red-100/90 dark:bg-red-950/40 border-red-200/80",
        text: "text-red-700",
    },
};

function getCategoryStyle(typeName?: string) {
    const key = (typeName || "").toLowerCase();
    for (const [k, v] of Object.entries(CATEGORY_STYLES)) {
        if (key.includes(k)) return v;
    }
    return CATEGORY_STYLES.holiday;
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

export default function AnnualCalendarPage() {
    const { t } = useTranslation();
    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const now = new Date();

    // View & Navigation State
    const [viewMode, setViewMode] = useState<"calendar" | "list" | "table">("calendar");
    const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(now.getFullYear());
    const [weeklyHolidays, setWeeklyHolidays] = useState<number[]>([7]);

    // Data State
    const [holidayTypes, setHolidayTypes] = useState<HolidayTypeOption[]>([]);
    const [calendarData, setCalendarData] = useState<CalendarEntry[]>([]);
    const [allEntries, setAllEntries] = useState<CalendarEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Table Filters & Pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState("50");
    const [totalEntries, setTotalEntries] = useState(0);

    // Dialogs State
    const [open, setOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
    const [selectedId, setSelectedId] = useState<string | number | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);
    const [deleteId, setDeleteId] = useState<string | number | null>(null);

    const [formData, setFormData] = useState({
        start_date: "",
        end_date: "",
        holiday_type_id: "",
        description: "",
        is_front_site: true,
    });

    const strtolower = (s: string) => (s || "").toLowerCase().trim();

    // Fetch System General Settings (for weekly holiday identification)
    const fetchSettings = useCallback(async () => {
        try {
            const res = await api.get("/system-setting/general-setting");
            const setting = res.data?.data ?? res.data ?? {};
            const startDay = strtolower(setting?.start_day_of_week ?? "");
            if (startDay === "saturday" || startDay === "sunday") {
                setWeeklyHolidays([5]); // Friday
            } else if (startDay === "friday") {
                setWeeklyHolidays([4, 5]); // Thursday & Friday
            } else {
                setWeeklyHolidays([7]); // Sunday
            }
        } catch {
            setWeeklyHolidays([7]);
        }
    }, []);

    const fetchHolidayTypes = useCallback(async () => {
        try {
            const response = await api.get("/annual-calendar/holiday-types?no_paginate=true");
            const payload = response.data?.data ?? response.data ?? [];
            setHolidayTypes(Array.isArray(payload) ? payload : []);
        } catch {
            console.error("Failed to fetch holiday types");
        }
    }, []);

    // Fetch all entries for calendar rendering + paginated table entries
    const fetchCalendarData = useCallback(async () => {
        setLoading(true);
        try {
            const [paginatedRes, allRes] = await Promise.allSettled([
                api.get("/annual-calendar/annual-calendars", {
                    params: {
                        page: currentPage,
                        per_page: itemsPerPage,
                        search: searchTerm || undefined,
                        holiday_type_id: filterType !== "all" ? filterType : undefined,
                    },
                }),
                api.get("/annual-calendar/annual-calendars", {
                    params: { no_paginate: true },
                }),
            ]);

            if (paginatedRes.status === "fulfilled") {
                const resData = paginatedRes.value.data;
                if (resData?.data && Array.isArray(resData.data)) {
                    setCalendarData(resData.data);
                    setTotalEntries(resData.total ?? resData.data.length);
                } else if (resData?.data?.data && Array.isArray(resData.data.data)) {
                    setCalendarData(resData.data.data);
                    setTotalEntries(resData.data.total ?? resData.data.data.length);
                } else if (Array.isArray(resData)) {
                    setCalendarData(resData);
                    setTotalEntries(resData.length);
                } else {
                    setCalendarData([]);
                    setTotalEntries(0);
                }
            }

            if (allRes.status === "fulfilled") {
                const payload = allRes.value.data?.data ?? allRes.value.data ?? [];
                setAllEntries(Array.isArray(payload) ? payload : []);
            }
        } catch {
            toast.error(t("failed_to_load_calendar_entries") || "Failed to load calendar entries");
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, searchTerm, filterType, t]);

    useEffect(() => {
        fetchSettings();
        fetchHolidayTypes();
    }, [fetchSettings, fetchHolidayTypes]);

    useEffect(() => {
        fetchCalendarData();
    }, [fetchCalendarData]);

    // Month Navigation
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

    // Calendar grid calculations
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const firstDayOfWeekRaw = new Date(currentYear, currentMonth - 1, 1).getDay();
    const startDayOfWeek = firstDayOfWeekRaw === 0 ? 7 : firstDayOfWeekRaw;
    const startOffset = startDayOfWeek - 1;
    const totalCells = Math.ceil((daysInMonth + startOffset) / 7) * 7;
    const cells = Array.from({ length: totalCells }, (_, i) => {
        const day = i - startOffset + 1;
        return day > 0 && day <= daysInMonth ? day : null;
    });

    // Map events across month days
    const monthEventMap = useMemo(() => {
        const map: Record<number, CalendarEntry[]> = {};
        for (const entry of allEntries) {
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
    }, [allEntries, currentMonth, currentYear]);

    // Monthly event items list
    const currentMonthEntries = useMemo(() => {
        return allEntries.filter(e => {
            if (!e.start_date) return false;
            const s = new Date(e.start_date);
            const ed = e.end_date ? new Date(e.end_date) : s;
            const mStart = new Date(currentYear, currentMonth - 1, 1);
            const mEnd = new Date(currentYear, currentMonth, 0);
            return (s <= mEnd && ed >= mStart);
        });
    }, [allEntries, currentMonth, currentYear]);

    // Overall stats
    const stats = useMemo(() => {
        let holidays = 0;
        let vacations = 0;
        let schoolEvents = 0;
        let activities = 0;

        for (const e of allEntries) {
            const tName = (e.holiday_type?.name || e.holiday_type_name || "").toLowerCase();
            if (tName.includes("vacation")) vacations++;
            else if (tName.includes("event")) schoolEvents++;
            else if (tName.includes("activity")) activities++;
            else holidays++;
        }

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
            weeklyHolidays: monthWeeklyHolidays,
            totalEvents: allEntries.length,
            monthEventsCount: currentMonthEntries.length,
        };
    }, [allEntries, currentMonthEntries, daysInMonth, currentYear, currentMonth, weeklyHolidays]);

    const summaryCards = [
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
            label: t("activities") || "Activities",
            count: stats.activities,
            bar: "from-amber-500 to-orange-500",
            text: "text-amber-700 dark:text-amber-300",
            bg: "bg-amber-50/90 dark:bg-amber-950/50",
            border: "border-amber-200 dark:border-amber-800",
            labelColor: "text-amber-600 dark:text-amber-400",
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
        {
            label: t("total_events") || "Total Events",
            count: stats.totalEvents,
            bar: "from-gray-700 to-gray-900",
            text: "text-gray-800 dark:text-gray-200",
            bg: "bg-gray-50/90 dark:bg-zinc-800/60",
            border: "border-gray-200 dark:border-zinc-700",
            labelColor: "text-gray-500 dark:text-gray-400",
        },
    ];

    const todayDay =
        currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear()
            ? now.getDate()
            : null;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "—";
        const d = parseISO(dateStr);
        if (isValid(d)) {
            return format(d, "dd/MM/yyyy");
        }
        return dateStr;
    };

    const handleSave = async () => {
        if (!formData.start_date || !formData.end_date || !formData.holiday_type_id || !formData.description) {
            toast.error(t("all_fields_required") || "All fields are required");
            return;
        }
        setSubmitting(true);
        try {
            if (dialogMode === "edit" && selectedId) {
                await api.put(`/annual-calendar/annual-calendars/${selectedId}`, formData);
                toast.success(t("calendar_entry_updated") || "Calendar entry updated");
            } else {
                await api.post("/annual-calendar/annual-calendars", formData);
                toast.success(t("calendar_entry_created") || "Calendar entry created");
            }
            setOpen(false);
            resetForm();
            fetchCalendarData();
        } catch {
            toast.error(t("failed_to_save_calendar_entry") || "Failed to save calendar entry");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (entry: CalendarEntry) => {
        setDialogMode("edit");
        setSelectedId(entry.id);
        setFormData({
            start_date: entry.start_date,
            end_date: entry.end_date,
            holiday_type_id: entry.holiday_type_id?.toString() || "",
            description: entry.description,
            is_front_site: !!entry.is_front_site,
        });
        if (selectedEvent) setSelectedEvent(null);
        setOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/annual-calendar/annual-calendars/${deleteId}`);
            toast.success(t("calendar_entry_deleted") || "Calendar entry deleted");
            if (selectedEvent && selectedEvent.id === deleteId) {
                setSelectedEvent(null);
            }
            fetchCalendarData();
        } catch {
            toast.error(t("failed_to_delete_calendar_entry") || "Failed to delete calendar entry");
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setDialogMode("add");
        setSelectedId(null);
        setFormData({
            start_date: "",
            end_date: "",
            holiday_type_id: holidayTypes[0]?.id ? holidayTypes[0].id.toString() : "",
            description: "",
            is_front_site: true,
        });
    };

    // ── Export Handlers ──
    const handleCopy = () => {
        const rows = viewMode === "table" ? calendarData : allEntries;
        if (rows.length === 0) return;
        const text = rows.map(c => [
            `${formatDate(c.start_date)} - ${formatDate(c.end_date)}`,
            c.holiday_type?.name || c.holiday_type_name || "—",
            c.description || "",
            c.creator ? `${c.creator.name} ${c.creator.last_name || ""}`.trim() : "—",
            c.is_front_site ? "Yes" : "No"
        ].join("\t")).join("\n");
        navigator.clipboard.writeText(text);
        toast.success(t("copied_to_clipboard") || "Copied to clipboard");
    };

    const handleExcel = () => {
        const rows = viewMode === "table" ? calendarData : allEntries;
        if (rows.length === 0) return;
        const ws = XLSX.utils.json_to_sheet(rows.map(c => ({
            "Start Date": formatDate(c.start_date),
            "End Date": formatDate(c.end_date),
            "Holiday Type": c.holiday_type?.name || c.holiday_type_name || "—",
            "Description": c.description || "",
            "Created By": c.creator ? `${c.creator.name} ${c.creator.last_name || ""}`.trim() : "—",
            "Front Site": c.is_front_site ? "Yes" : "No",
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Annual Calendar");
        XLSX.writeFile(wb, "annual-calendar.xlsx");
    };

    const handlePDF = () => {
        const rows = viewMode === "table" ? calendarData : allEntries;
        if (rows.length === 0) return;
        const doc = new jsPDF("l");
        doc.text("Annual Calendar", 14, 16);
        autoTable(doc, {
            head: [["Date Range", "Holiday Type", "Description", "Created By", "Front Site"]],
            body: rows.map(c => [
                `${formatDate(c.start_date)} - ${formatDate(c.end_date)}`,
                c.holiday_type?.name || c.holiday_type_name || "—",
                c.description || "",
                c.creator ? `${c.creator.name} ${c.creator.last_name || ""}`.trim() : "—",
                c.is_front_site ? "Yes" : "No",
            ]),
            startY: 22,
            styles: { fontSize: 8 },
        });
        doc.save("annual-calendar.pdf");
    };

    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;

    return (
        <div className="p-4 lg:p-6 space-y-5 animate-in fade-in duration-500 pb-20">
            <Card className="border-[0.5px] border-gray-200 dark:border-gray-800 shadow-[0_4px_24px_rgb(0,0,0,0.08)] overflow-hidden pt-0 gap-0 bg-white dark:bg-slate-900">
                {/* ── Main Header ── */}
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-slate-800 dark:to-slate-850">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <CalendarRange className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold text-slate-800 dark:text-gray-100 leading-none">
                                {t("annual_calendar") || "Annual Calendar"}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                {t("manage_holidays_events_and_vacation_schedules") || "Manage Holidays, Events, And Vacation Schedules"}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        {/* View Switch Buttons */}
                        <div className="flex items-center bg-gray-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-gray-200 dark:border-zinc-700">
                            <button
                                onClick={() => setViewMode("calendar")}
                                className={cn(
                                    "flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer",
                                    viewMode === "calendar"
                                        ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                                        : "text-gray-500 hover:text-gray-800 dark:text-gray-400"
                                )}
                                title="Calendar Grid View"
                            >
                                <LayoutGrid className="h-3.5 w-3.5" />
                                <span>{t("calendar") || "Calendar"}</span>
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={cn(
                                    "flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer",
                                    viewMode === "list"
                                        ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                                        : "text-gray-500 hover:text-gray-800 dark:text-gray-400"
                                )}
                                title="Monthly Schedule List"
                            >
                                <List className="h-3.5 w-3.5" />
                                <span>{t("schedule_list") || "Schedule"}</span>
                            </button>
                            <button
                                onClick={() => setViewMode("table")}
                                className={cn(
                                    "flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer",
                                    viewMode === "table"
                                        ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                                        : "text-gray-500 hover:text-gray-800 dark:text-gray-400"
                                )}
                                title="Manage All Entries"
                            >
                                <CalendarDays className="h-3.5 w-3.5" />
                                <span>{t("manage_entries") || "Manage Entries"}</span>
                            </button>
                        </div>

                        {/* Add Entry Button */}
                        <Button
                            onClick={() => { resetForm(); setOpen(true); }}
                            className="h-9 px-4 sm:px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
                        >
                            <Plus className="h-4 w-4" />
                            <span>{t("add_entry") || "Add Entry"}</span>
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-4 lg:p-5 space-y-5">
                    {/* ── Top Summary Stat Cards ── */}
                    {!loading && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {summaryCards.map((card, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "rounded-xl border shadow-xs overflow-hidden transition-all hover:shadow-md",
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

                    {/* ── Calendar & Schedule Views Navigation ── */}
                    {viewMode !== "table" && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                            <Button
                                onClick={goToToday}
                                variant="outline"
                                size="sm"
                                className="text-xs font-semibold rounded-[10px] hidden sm:flex items-center gap-1.5 border-gray-200 dark:border-gray-700"
                            >
                                <Clock className="h-3.5 w-3.5 text-indigo-500" />
                                {t("today") || "Today"}
                            </Button>

                            <div className="flex items-center justify-center gap-4 mx-auto sm:mx-0">
                                <Button
                                    onClick={goToPrevMonth}
                                    size="icon"
                                    className="h-8 w-8 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-90 shadow-xs transition-all rounded-[10px] active:scale-95"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="font-bold text-[15px] text-gray-800 dark:text-gray-100 min-w-[170px] text-center">
                                    {monthNames[currentMonth - 1]} {currentYear}
                                </div>
                                <Button
                                    onClick={goToNextMonth}
                                    size="icon"
                                    className="h-8 w-8 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-90 shadow-xs transition-all rounded-[10px] active:scale-95"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium hidden sm:block">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                                    {currentMonthEntries.length} {t("events_in_month") || "Events in this month"}
                                </span>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-16 text-gray-400 text-sm">
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                                {t("loading") || "Loading calendar..."}
                            </div>
                        </div>
                    ) : viewMode === "calendar" ? (
                        /* ── Calendar Grid View ── */
                        <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-2xs">
                            {/* Days Header */}
                            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-slate-800/80">
                                {daysOfWeek.map((day, idx) => {
                                    const isWeekendHeader = weeklyHolidays.includes(idx + 1);
                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "text-center py-2.5 text-[10px] sm:text-[12px] font-bold border-r border-gray-200 dark:border-gray-800 last:border-r-0 uppercase",
                                                isWeekendHeader ? "text-red-600 bg-red-50/60 dark:bg-red-950/40" : "text-gray-600 dark:text-gray-300"
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
                                                "min-h-[86px] sm:min-h-[116px] border-r border-b border-gray-100 dark:border-gray-800 last:border-r-0 transition-colors flex flex-col justify-between p-1 sm:p-2",
                                                idx >= cells.length - 7 ? "border-b-0" : "",
                                                isToday
                                                    ? "bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-inset ring-indigo-200 dark:ring-indigo-800"
                                                    : isWeekend
                                                        ? "bg-red-50/90 hover:bg-red-100/90 dark:bg-red-950/40 border-red-200/80"
                                                        : dayEvents.length > 0
                                                            ? catStyle.cellBg
                                                            : day
                                                                ? "hover:bg-indigo-50/30 dark:hover:bg-slate-800/40"
                                                                : "bg-gray-50/40 dark:bg-slate-900/40"
                                            )}
                                        >
                                            {day && (
                                                <>
                                                    <div className={cn(
                                                        "text-[11px] font-semibold flex items-center justify-end gap-1 leading-none",
                                                        isToday
                                                            ? "text-indigo-600 dark:text-indigo-400 font-bold"
                                                            : isWeekend
                                                                ? "text-red-600 dark:text-red-400 font-bold"
                                                                : dayEvents.length > 0
                                                                    ? catStyle.text + " font-bold"
                                                                    : "text-gray-500 dark:text-gray-400"
                                                    )}>
                                                        {isToday && (
                                                            <span className="text-[8px] font-bold uppercase bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white px-1 py-0.5 rounded leading-none shadow-2xs">
                                                                {t("today") || "TODAY"}
                                                            </span>
                                                        )}
                                                        <span>{day}</span>
                                                    </div>

                                                    {/* Event & Holiday Badges */}
                                                    <div className="mt-1 space-y-1">
                                                        {isWeekend && dayEvents.length === 0 && (
                                                            <div className="px-1.5 py-0.5 text-[8px] sm:text-[10px] font-bold rounded shadow-2xs flex items-center justify-center text-center leading-tight bg-red-600 text-white">
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
                                                                        id: ev.id,
                                                                        title: ev.description || evType,
                                                                        type: evType,
                                                                        startDate: ev.start_date,
                                                                        endDate: ev.end_date,
                                                                        description: ev.description,
                                                                        isFrontSite: ev.is_front_site,
                                                                        rawEntry: ev,
                                                                    })}
                                                                    className="w-full text-left focus:outline-hidden cursor-pointer group"
                                                                >
                                                                    <div className={cn(
                                                                        "px-1.5 py-0.5 text-[8px] sm:text-[9.5px] font-bold rounded shadow-2xs flex items-center justify-center text-center leading-tight truncate mb-0.5 group-hover:opacity-90",
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
                                                            <p className="text-[7.5px] sm:text-[8.5px] font-bold text-center text-gray-500 dark:text-gray-400">
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
                    ) : viewMode === "list" ? (
                        /* ── Schedule List View ── */
                        <div className="space-y-4">
                            {currentMonthEntries.length === 0 ? (
                                <div className="text-center py-16 text-gray-400">
                                    <CalendarDays className="h-10 w-10 mx-auto opacity-30 mb-2" />
                                    <p className="text-sm font-semibold">{t("no_events_this_month") || "No events or holidays scheduled for this month"}</p>
                                </div>
                            ) : (
                                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                                    {currentMonthEntries.map((item, itemIdx) => {
                                        const evType = item.holiday_type?.name || item.holiday_type_name || "Holiday";
                                        const evStyle = getCategoryStyle(evType);
                                        const multiDay = item.start_date !== item.end_date;
                                        const sDate = parseISO(item.start_date);
                                        const dayStr = isValid(sDate) ? String(sDate.getDate()).padStart(2, "0") : "—";
                                        const mStr = isValid(sDate) ? monthNames[sDate.getMonth()].slice(0, 3).toUpperCase() : "";

                                        return (
                                            <div
                                                key={itemIdx}
                                                className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50/70 dark:hover:bg-slate-800/50 transition-colors"
                                            >
                                                <div className="flex flex-col items-center justify-center h-12 w-12 shrink-0 rounded-lg bg-gradient-to-br from-[#FF9800]/10 to-[#6366F1]/10 border border-indigo-100 dark:border-indigo-900/50">
                                                    <span className="text-[15px] font-bold text-indigo-700 dark:text-indigo-400 leading-none">{dayStr}</span>
                                                    <span className="text-[8px] font-semibold text-indigo-500 dark:text-indigo-400 mt-0.5">{mStr}</span>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] font-bold text-gray-800 dark:text-gray-200 leading-tight">
                                                        {item.description || evType}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-gray-400 font-medium">
                                                        <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                                            <Calendar className="h-3 w-3 text-indigo-500" />
                                                            {formatDate(item.start_date)}{multiDay ? ` – ${formatDate(item.end_date)}` : ""}
                                                        </span>
                                                        {item.creator && (
                                                            <span className="text-gray-400">
                                                                · By: {item.creator.name} {item.creator.last_name || ""}
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

                                                <div className="flex items-center gap-1 shrink-0">
                                                    <Button
                                                        onClick={() => handleEdit(item)}
                                                        size="sm"
                                                        className="h-7 w-7 p-0 rounded bg-amber-500 hover:bg-amber-600 text-white shadow-xs active:scale-95 cursor-pointer"
                                                        title={t("edit") || "Edit"}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        onClick={() => setDeleteId(item.id)}
                                                        size="sm"
                                                        className="h-7 w-7 p-0 rounded bg-red-500 hover:bg-red-600 text-white shadow-xs active:scale-95 cursor-pointer"
                                                        title={t("delete") || "Delete"}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ── Manage Entries Table View ── */
                        <div className="space-y-4">
                            {/* Filters & Export Toolbar */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                    <div className="space-y-1.5 w-full sm:w-56">
                                        <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("holiday_type") || "Holiday Type"}</Label>
                                        <Select value={filterType} onValueChange={v => { setFilterType(v); setCurrentPage(1); }}>
                                            <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
                                                <SelectValue placeholder={t("all_types") || "All Types"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t("all_types") || "All Types"}</SelectItem>
                                                {holidayTypes.map(typ => (
                                                    <SelectItem key={typ.id} value={typ.id.toString()}>{typ.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5 w-full sm:w-64">
                                        <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("search") || "Search"}</Label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder={t("search_description") || "Search description..."}
                                                value={searchTerm}
                                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                                className="pl-9 h-9 text-xs bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Export toolbar & page size */}
                                <div className="flex items-center gap-3 self-end sm:self-auto">
                                    <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1 bg-white dark:bg-slate-900">
                                        <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy" className="h-7 w-7 text-gray-500 hover:text-indigo-600">
                                            <Copy className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={handleExcel} title="Excel" className="h-7 w-7 text-gray-500 hover:text-green-600">
                                            <FileSpreadsheet className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={handlePDF} title="PDF" className="h-7 w-7 text-gray-500 hover:text-red-600">
                                            <FileDown className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => window.print()} title="Print" className="h-7 w-7 text-gray-500 hover:text-indigo-600">
                                            <Printer className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{t("show") || "Show"}</span>
                                        <Select value={itemsPerPage} onValueChange={v => { setItemsPerPage(v); setCurrentPage(1); }}>
                                            <SelectTrigger className="h-9 w-[70px] text-xs bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PAGE_SIZES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="rounded-md border border-gray-200 dark:border-gray-800 overflow-x-auto">
                                <Table className="min-w-[900px]">
                                    <TableHeader className="bg-gray-50 dark:bg-slate-800/80 text-xs uppercase">
                                        <TableRow className="hover:bg-transparent whitespace-nowrap">
                                            <TableHead className="font-semibold text-gray-600 dark:text-gray-300">{t("date") || "Date"}</TableHead>
                                            <TableHead className="font-semibold text-gray-600 dark:text-gray-300">{t("type") || "Type"}</TableHead>
                                            <TableHead className="font-semibold text-gray-600 dark:text-gray-300">{t("description") || "Description"}</TableHead>
                                            <TableHead className="font-semibold text-gray-600 dark:text-gray-300">{t("created_by") || "Created By"}</TableHead>
                                            <TableHead className="font-semibold text-gray-600 dark:text-gray-300 text-center">{t("front_site") || "Front Site"}</TableHead>
                                            <TableHead className="font-semibold text-gray-600 dark:text-gray-300 text-right w-[100px]">{t("action") || "Action"}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? <TableSkeleton cols={6} /> : calendarData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="py-14 text-center">
                                                    <div className="flex flex-col items-center gap-2 text-gray-400">
                                                        <FolderOpen className="h-8 w-8 opacity-40" />
                                                        <span className="text-xs">{t("no_calendar_entries_found") || "No calendar entries found."}</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : calendarData.map((item, idx) => (
                                            <TableRow key={item.id || idx} className="text-xs hover:bg-indigo-50/40 dark:hover:bg-slate-800/50 transition-colors">
                                                <TableCell className="py-3 font-medium text-gray-800 dark:text-gray-200">
                                                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                                                        <Calendar className="h-3 w-3 text-indigo-400" />
                                                        {formatDate(item.start_date)}{item.start_date !== item.end_date ? ` – ${formatDate(item.end_date)}` : ""}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-[10px] font-semibold">
                                                        {item.holiday_type?.name || item.holiday_type_name || "—"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3 text-gray-600 dark:text-gray-300 max-w-[280px] truncate" title={item.description}>
                                                    {item.description}
                                                </TableCell>
                                                <TableCell className="py-3 text-gray-500 dark:text-gray-400">
                                                    {item.creator ? `${item.creator.name} ${item.creator.last_name || ""}`.trim() : "—"}
                                                </TableCell>
                                                <TableCell className="py-3 text-center">
                                                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold", item.is_front_site ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300" : "bg-gray-100 dark:bg-slate-800 text-gray-500")}>
                                                        {item.is_front_site ? (t("yes") || "Yes") : (t("no") || "No")}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button onClick={() => handleEdit(item)} size="sm" className="h-7 w-7 p-0 rounded bg-amber-500 hover:bg-amber-600 text-white shadow-xs active:scale-95 cursor-pointer" title={t("edit") || "Edit"}>
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button onClick={() => setDeleteId(item.id)} size="sm" className="h-7 w-7 p-0 rounded bg-red-500 hover:bg-red-600 text-white shadow-xs active:scale-95 cursor-pointer" title={t("delete") || "Delete"}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                <div>{t("showing") || "Showing"} {totalEntries > 0 ? startIndex + 1 : 0} {t("to") || "to"} {Math.min(startIndex + sizeNum, totalEntries)} {t("of") || "of"} {totalEntries} {t("entries") || "entries"}</div>
                                {totalPages > 1 && (
                                    <div className="flex gap-1">
                                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="h-8 w-8 p-0 rounded-[10px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></Button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, safePage - 3), safePage + 2).map(page => (
                                            <Button key={page} size="sm" onClick={() => setCurrentPage(page)} className={cn("h-8 w-8 p-0 rounded-[10px] text-xs font-bold", safePage === page ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md" : "bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700")}>{page}</Button>
                                        ))}
                                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="h-8 w-8 p-0 rounded-[10px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Monthly Event Highlights Breakdown ── */}
                    {viewMode === "calendar" && currentMonthEntries.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
                                <Info className="h-4 w-4 text-indigo-500" />
                                {monthNames[currentMonth - 1]} {currentYear} — {t("scheduled_events") || "Scheduled Events & Holidays"}
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
                                                id: ev.id,
                                                title: ev.description || evType,
                                                type: evType,
                                                startDate: ev.start_date,
                                                endDate: ev.end_date,
                                                description: ev.description,
                                                isFrontSite: ev.is_front_site,
                                                rawEntry: ev,
                                            })}
                                            className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-850 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs cursor-pointer transition-all flex flex-col justify-between space-y-2"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug">
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
                                                <span className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                                                    Details →
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Event Detail Modal (With Admin Edit & Delete) ── */}
            <Dialog open={Boolean(selectedEvent)} onOpenChange={(isOpen) => !isOpen && setSelectedEvent(null)}>
                <DialogContent className="sm:max-w-[460px] p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900">
                    <DialogHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-slate-800 dark:to-slate-850 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={cn("px-2.5 py-0.5 text-[10px] font-bold rounded-full border", selectedEvent ? getCategoryStyle(selectedEvent.type).pill : "")}>
                                {selectedEvent?.type}
                            </span>
                            {selectedEvent?.isFrontSite && (
                                <span className="px-2 py-0.5 text-[9px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Published on Front Site
                                </span>
                            )}
                        </div>
                        <DialogTitle className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">
                            {selectedEvent?.title}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                            <span className="flex items-center gap-1 font-medium text-gray-600 dark:text-gray-300">
                                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                                {selectedEvent?.startDate ? formatDate(selectedEvent.startDate) : ""}
                                {selectedEvent?.endDate && selectedEvent.endDate !== selectedEvent.startDate ? ` – ${formatDate(selectedEvent.endDate)}` : ""}
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-5 space-y-3">
                        {selectedEvent?.description && (
                            <div className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-lg text-xs text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-800">
                                <p className="font-semibold text-gray-500 dark:text-gray-400 text-[10px] uppercase mb-1">Description</p>
                                <p className="leading-relaxed">{selectedEvent.description}</p>
                            </div>
                        )}
                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        if (selectedEvent?.rawEntry) {
                                            handleEdit(selectedEvent.rawEntry);
                                        }
                                    }}
                                    className="h-8 text-xs font-semibold gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                    {t("edit") || "Edit"}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        if (selectedEvent) {
                                            setDeleteId(selectedEvent.id);
                                        }
                                    }}
                                    className="h-8 text-xs font-semibold gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    {t("delete") || "Delete"}
                                </Button>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedEvent(null)}
                                className="h-8 text-xs text-gray-500"
                            >
                                {t("close") || "Close"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Add/Edit Dialog ── */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900">
                    <DialogHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-slate-800 dark:to-slate-850 border-b border-gray-100 dark:border-gray-800">
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-gray-100">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <CalendarRange className="h-4 w-4" />
                            </span>
                            {dialogMode === "edit" ? (t("edit_calendar_entry") || "Edit Calendar Entry") : (t("add_calendar_entry") || "Add Calendar Entry")}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                    {t("start_date") || "Start Date"} <span className="text-red-500">*</span>
                                </Label>
                                <DatePicker
                                    value={formData.start_date}
                                    onChange={d => setFormData({ ...formData, start_date: d })}
                                    placeholder="DD/MM/YYYY"
                                    className="h-9 text-xs"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                    {t("end_date") || "End Date"} <span className="text-red-500">*</span>
                                </Label>
                                <DatePicker
                                    value={formData.end_date}
                                    onChange={d => setFormData({ ...formData, end_date: d })}
                                    placeholder="DD/MM/YYYY"
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                {t("holiday_type") || "Holiday Type"} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={formData.holiday_type_id} onValueChange={v => setFormData({ ...formData, holiday_type_id: v })}>
                                <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700">
                                    <SelectValue placeholder={t("select_type") || "Select type"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {holidayTypes.map(typ => (
                                        <SelectItem key={typ.id} value={typ.id.toString()}>{typ.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                {t("description") || "Description"} <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="text-xs resize-none bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-700"
                                placeholder={t("event_details") || "Event details..."}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-gray-800 rounded-lg">
                            <div className="space-y-0.5">
                                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                                    {t("publish_on_front_site") || "Publish on front site"}
                                </Label>
                                <p className="text-[10px] text-gray-400">
                                    {t("visible_to_students_and_public_users") || "Visible to students and public users"}
                                </p>
                            </div>
                            <Switch
                                checked={formData.is_front_site}
                                onCheckedChange={v => setFormData({ ...formData, is_front_site: v })}
                                className="data-[state=checked]:bg-emerald-500"
                            />
                        </div>
                    </div>
                    <DialogFooter className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/40">
                        <Button variant="ghost" onClick={() => setOpen(false)} className="h-9 px-5 text-xs font-bold">
                            {t("cancel") || "Cancel"}
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={submitting}
                            className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95"
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (dialogMode === "edit" ? (t("update_entry") || "Update Entry") : (t("save_entry") || "Save Entry"))}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation Alert ── */}
            <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
                <AlertDialogContent className="bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("delete_calendar_entry") || "Delete Calendar Entry"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("delete_calendar_entry_confirm") || "This action cannot be undone. The calendar entry will be permanently removed from all dashboards."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel") || "Cancel"}</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-red-500 hover:bg-red-600 text-white">
                            {t("delete") || "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
