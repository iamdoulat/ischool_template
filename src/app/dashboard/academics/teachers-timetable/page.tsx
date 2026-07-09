"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Search, Printer, Clock, MapPin, AlertCircle, LayoutGrid, Loader2, Filter, CalendarRange
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { useSettings } from "@/components/providers/settings-provider";
import { formatTime } from "@/lib/utils";
import { useMemo } from "react";

interface TimetableEntry {
    class: string;
    subject: string;
    time: string;
    room: string;
}

interface TimetableDay {
    day: string;
    entries: TimetableEntry[];
}

interface Staff {
    id: number | string;
    name: string;
    staff_id?: string;
    role?: string;
}

interface ApiTimetableEntry {
    id?: number;
    day?: string;
    start_time?: string;
    end_time?: string;
    room?: string;
    school_class?: { name?: string };
    section?: { name?: string };
    subject?: { name?: string; code?: string };
}

interface ApiTimetableDay {
    day: string;
    entries: ApiTimetableEntry[];
}

function TimetableSkeleton() {
    return (
        <div className="flex min-w-max gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex-1 min-w-[220px]">
                    <div className="h-10 rounded-t-lg bg-muted/60 animate-pulse mb-3" />
                    <div className="space-y-3 px-1">
                        {Array.from({ length: 4 }).map((_, j) => (
                            <div key={j} className="h-20 rounded-lg bg-muted/60 animate-pulse" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

const mockTimetable: TimetableDay[] = [
    {
        day: "Monday",
        entries: [
            { class: "Class: Class 1(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 2(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 2(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 2(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 1(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 1(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 4(C)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
            { class: "Class: Class 4(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
        ]
    },
    {
        day: "Tuesday",
        entries: [
            { class: "Class: Class 2(B)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 5(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 1(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(C)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 1(D)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 2(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 4(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
            { class: "Class: Class 3(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12FF" },
        ]
    },
    {
        day: "Wednesday",
        entries: [
            { class: "Class: Class 3(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
            { class: "Class: Class 2(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 5(C)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 5(B)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 1(D)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(C)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(B)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 1(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 2(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(B)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
        ]
    },
    {
        day: "Thursday",
        entries: [
            { class: "Class: Class 3(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
            { class: "Class: Class 5(C)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 5(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 1(D)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(B)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 2(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 4(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 2(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(B)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12FF" },
        ]
    },
    {
        day: "Friday",
        entries: [
            { class: "Class: Class 2(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 4(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
            { class: "Class: Class 5(B)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 5(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
            { class: "Class: Class 3(B)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 2(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 5(A)", subject: "Subject: Mathematics (110)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 5(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 2(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
        ]
    },
    {
        day: "Saturday",
        entries: [
            { class: "Class: Class 3(C)", subject: "Subject: Hindi (230)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
            { class: "Class: Class 5(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 5(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 1(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 4(B)", subject: "Subject: Mathematics (110)", time: "9:00 AM - 09:45 AM", room: "Room No: 150" },
            { class: "Class: Class 2(C)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 12" },
            { class: "Class: Class 4(A)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 2(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 3(B)", subject: "Subject: Mathematics (110)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
            { class: "Class: Class 5(B)", subject: "Subject: English (210)", time: "9:00 AM - 09:45 AM", room: "Room No: 15" },
        ]
    },
    {
        day: "Sunday",
        entries: []
    }
];

const DEFAULT_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function TeachersTimetablePage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const { settings } = useSettings();
    const tf = settings?.time_format === "12" ? "12" : "24" as const;

    // Derived ordered days based on settings
    const orderedDays = useMemo(() => {
        const startDay = settings?.start_day_of_week?.toLowerCase() || "monday";
        const startIndex = DEFAULT_DAYS.findIndex(d => d.toLowerCase() === startDay);
        if (startIndex === -1) return DEFAULT_DAYS;
        return [...DEFAULT_DAYS.slice(startIndex), ...DEFAULT_DAYS.slice(0, startIndex)];
    }, [settings?.start_day_of_week]);

    // Prerequisite states
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [selectedStaffId, setSelectedStaffId] = useState<string>("");

    // Timetable data
    const [timetableData, setTimetableData] = useState<ApiTimetableDay[]>([]);

    // Initialize/Update empty timetable grid when orderedDays changes
    useEffect(() => {
        setTimetableData(orderedDays.map(day => ({ day, entries: [] })));
    }, [orderedDays]);

    // UI states
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    // Total scheduled entries for the header subtitle
    const totalEntries = useMemo(
        () => timetableData.reduce((sum, d) => sum + (d.entries?.length || 0), 0),
        [timetableData]
    );

    // Load staff list (Teachers only)
    useEffect(() => {
        const fetchStaff = async () => {
            setLoading(true);
            try {
                const res = await api.get("/hr/staff-directory", {
                    params: { role: 'Teacher', no_paginate: true, active: 'all' }
                });
                const teachers = (res.data?.data || res.data || []).filter((u: Staff) => u.role === 'Teacher');
                setStaffList(teachers);
            } catch (error) {
                console.error("Error fetching staff:", error);
                tt.error("failed_to_load");
            } finally {
                setLoading(false);
            }
        };
        fetchStaff();
    }, []);

    const handleSearch = async () => {
        if (!selectedStaffId) {
            tt.error("please_select_a_teacher");
            return;
        }

        setSearching(true);
        try {
            const res = await api.get("/academics/class-timetables", {
                params: { staff_id: selectedStaffId }
            });
            const entries = res.data.data || [];

            // Group entries by day in correct order
            const grouped = orderedDays.map(day => ({
                day,
                entries: entries.filter((e: ApiTimetableEntry) => e.day === day)
            }));
            setTimetableData(grouped);
            tt.success("timetable_loaded");
        } catch (error) {
            console.error("Error searching timetable:", error);
            tt.error("failed_to_fetch");
        } finally {
            setSearching(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-4">
            {/* Header/Title */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100 no-print">
                <div className="flex items-center gap-2 text-[#6366f1]">
                    <Clock className="h-6 w-6" />
                    <h1 className="text-xl font-medium text-gray-800">{t("teacher_time_table")}</h1>
                </div>
            </div>

            {/* Select Criteria Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 no-print select-criteria-section">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("select_criteria")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("x_teachers_available", { count: staffList.length })}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="teacher" className="text-xs font-semibold text-gray-600 uppercase">
                            {t("teachers")} <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-2 max-w-2xl">
                            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                                <SelectTrigger id="teacher" className="h-10 flex-1">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {staffList.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.staff_id})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                onClick={handleSearch}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-8 h-10 text-xs shadow-md transition-all duration-300"
                                disabled={searching || loading}
                            >
                                {searching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                                {t("search")}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Timetable Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 relative min-h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <CalendarRange className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("teachers_timetable")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("x_scheduled_entries", { count: totalEntries })}</p>
                        </div>
                    </div>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white rounded shadow-sm p-0 border-0 no-print"
                        onClick={handlePrint}
                    >
                        <Printer className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto px-4 py-4">
                        {searching ? (
                            <TimetableSkeleton />
                        ) : (
                            <div className="flex min-w-max gap-4">
                                {timetableData.map((dayData) => (
                                    <div key={dayData.day} className="flex-1 min-w-[220px]">
                                        <div className="bg-gray-100 py-2.5 px-3 text-left mb-3 rounded-t-lg border-b-2 border-indigo-500 border border-gray-200/50 shadow-sm">
                                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t(dayData.day.toLowerCase())}</span>
                                        </div>
                                        <div className="space-y-3 px-1">
                                            {dayData.entries.length > 0 ? (
                                                dayData.entries.map((entry: ApiTimetableEntry, idx: number) => (
                                                    <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-indigo-400">
                                                        <div className="space-y-2 text-[11px]">
                                                            <div className="flex items-start gap-2">
                                                                <LayoutGrid className="h-3.5 w-3.5 text-indigo-500 mt-0.5" />
                                                                <div>
                                                                    <span className="font-bold text-gray-900 block">{t("class")}: {entry.school_class?.name}({entry.section?.name})</span>
                                                                    <span className="text-gray-600 font-medium">{t("subject")}: {entry.subject?.name} ({entry.subject?.code})</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 pl-5">
                                                                <Clock className="h-3.5 w-3.5 text-orange-400" />
                                                                <span className="text-gray-700 font-semibold">{formatTime(entry.start_time, tf)} - {formatTime(entry.end_time, tf)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 pl-5">
                                                                <MapPin className="h-3.5 w-3.5 text-green-500" />
                                                                <span className="text-gray-700 font-medium">{t("room_no")}: {entry.room || t("n_a")}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="bg-gray-50/50 border border-dashed border-gray-200 rounded-lg p-4 text-center">
                                                    <div className="flex flex-col items-center justify-center gap-1.5 text-gray-400">
                                                        <AlertCircle className="h-5 w-5 opacity-50" />
                                                        <span className="text-[10px] font-bold uppercase tracking-tighter">{t("not_scheduled")}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
