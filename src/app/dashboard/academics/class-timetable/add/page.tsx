"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Plus,
    Search,
    Clock,
    User,
    BookOpen,
    MapPin,
    Loader2,
    Trash2,
    Save,
    Wand2,
    Calendar,
    Filter,
    Sparkles,
    Copy,
    GraduationCap,
    Layers,
    CheckCircle2
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { cn } from "@/lib/utils";
import { useSettings } from "@/components/providers/settings-provider";

const DEFAULT_DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

interface TimetableRow {
    id: string; // temp client side id
    subject_id: string;
    staff_id: string;
    start_time: string;
    end_time: string;
    room: string;
}

interface DayData {
    [key: string]: TimetableRow[];
}

export default function AddClassTimetablePage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const { settings } = useSettings();

    // Derived ordered days based on settings
    const orderedDays = useMemo(() => {
        const startDay = settings?.start_day_of_week?.toLowerCase() || "saturday";
        const startIndex = DEFAULT_DAYS.findIndex(d => d.toLowerCase() === startDay);
        if (startIndex === -1) return DEFAULT_DAYS;
        return [...DEFAULT_DAYS.slice(startIndex), ...DEFAULT_DAYS.slice(0, startIndex)];
    }, [settings?.start_day_of_week]);

    // Prerequisite states
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [subjectGroups, setSubjectGroups] = useState<any[]>([]);
    const [allSubjects, setAllSubjects] = useState<any[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [classTeacherAssignments, setClassTeacherAssignments] = useState<any[]>([]);

    // Selection states
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [selectedSectionId, setSelectedSectionId] = useState<string>("");
    const [selectedSubjectGroupId, setSelectedSubjectGroupId] = useState<string>("");

    // Quick Parameter states
    const [quickParams, setQuickParams] = useState({
        start_time: "09:00",
        duration: "45",
        interval: "5",
        room: "101"
    });

    // Timetable data state
    const [dayData, setDayData] = useState<DayData>(
        DEFAULT_DAYS.reduce((acc, day) => ({ ...acc, [day]: [] }), {})
    );

    // UI states
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentDay, setCurrentDay] = useState("Saturday");

    // Update empty timetable grid when orderedDays changes
    useEffect(() => {
        setDayData(prev => {
            const next = { ...prev };
            orderedDays.forEach(day => {
                if (!next[day]) next[day] = [];
            });
            return next;
        });
        if (orderedDays.length > 0) setCurrentDay(orderedDays[0]);
    }, [orderedDays]);

    // Load prerequisites
    useEffect(() => {
        const fetchPrerequisites = async () => {
            setLoading(true);
            try {
                const [classRes, subjectGroupRes, subjectRes, staffRes, teacherAssignRes] = await Promise.all([
                    api.get("/academics/classes?no_paginate=true").catch(() => ({ data: [] })),
                    api.get("/academics/subject-groups?no_paginate=true").catch(() => ({ data: [] })),
                    api.get("/academics/subjects?no_paginate=true").catch(() => ({ data: [] })),
                    api.get("/hr/staff-directory", { params: { role: 'Teacher', no_paginate: true, active: 'all' } }).catch(() => ({ data: [] })),
                    api.get("/academics/class-teachers").catch(() => ({ data: [] }))
                ]);
                setClasses(classRes.data.data?.data || classRes.data.data || []);
                setSubjectGroups(subjectGroupRes.data.data?.data || subjectGroupRes.data.data || []);
                setAllSubjects(subjectRes.data.data?.data || subjectRes.data.data || []);
                const teachers = (staffRes.data?.data || staffRes.data || []).filter((u: any) => u.role === 'Teacher');
                setStaffList(teachers);
                setClassTeacherAssignments(teacherAssignRes.data?.data || teacherAssignRes.data || []);
            } catch (error) {
                console.error("Error fetching prerequisites:", error);
                tt.error("failed_to_load");
            } finally {
                setLoading(false);
            }
        };
        fetchPrerequisites();
    }, []);

    // Fetch sections filtered by selected class ID
    const fetchSectionsByClass = async (classId: string) => {
        if (!classId) { setSections([]); return; }
        try {
            const res = await api.get('/academics/sections?with_class=true&no_paginate=true');
            const all: any[] = res.data?.data || res.data || [];
            const filtered = all.filter((s: any) => String(s.school_class_id) === String(classId));
            setSections(filtered);
        } catch {
            setSections([]);
        }
    };

    // Filtered subjects based on selected subject group
    const filteredSubjects = selectedSubjectGroupId
        ? subjectGroups.find(sg => sg.id.toString() === selectedSubjectGroupId)?.subjects || []
        : allSubjects;

    // Filter teachers based on class-teacher assignments for selected class + section
    const filteredTeachers = useMemo(() => {
        if (!selectedClassId || !selectedSectionId) return staffList;
        const assignment = classTeacherAssignments.find(
            (a: any) => String(a.class_id) === selectedClassId && String(a.section_id) === selectedSectionId
        );
        if (!assignment?.teachers?.length) return staffList;
        const assignedIds = new Set(assignment.teachers.map((t: any) => String(t.id)));
        const matched = staffList.filter((s: any) => assignedIds.has(String(s.id)));
        return matched.length > 0 ? matched : staffList;
    }, [selectedClassId, selectedSectionId, classTeacherAssignments, staffList]);

    const handleSearch = async () => {
        if (!selectedClassId || !selectedSectionId || !selectedSubjectGroupId) {
            tt.error("please_select_class_section_and_subject_group");
            return;
        }

        setSearching(true);
        try {
            const res = await api.get("/academics/class-timetables", {
                params: {
                    school_class_id: selectedClassId,
                    section_id: selectedSectionId,
                    subject_group_id: selectedSubjectGroupId
                }
            });
            const entries = res.data.data || [];

            const newDayData = orderedDays.reduce((acc, day) => {
                const dayEntries = entries.filter((e: any) => e.day === day).map((e: any) => ({
                    id: e.id.toString(),
                    subject_id: e.subject_id?.toString() || "",
                    staff_id: e.staff_id?.toString() || "",
                    start_time: e.start_time || "",
                    end_time: e.end_time || "",
                    room: e.room || ""
                }));
                return { ...acc, [day]: dayEntries };
            }, {});

            setDayData(newDayData);
            tt.success("timetable_data_loaded");
        } catch (error) {
            console.error("Error fetching timetable data:", error);
            tt.error("failed_to_load_existing_timetable");
        } finally {
            setSearching(false);
        }
    };

    const addRow = (day: string) => {
        const prevRows = dayData[day] || [];
        let nextStartTime = quickParams.start_time || "09:00";
        let nextEndTime = "09:45";

        if (prevRows.length > 0) {
            const lastRow = prevRows[prevRows.length - 1];
            if (lastRow.end_time) {
                const interval = parseInt(quickParams.interval) || 5;
                const duration = parseInt(quickParams.duration) || 45;
                nextStartTime = addMinutesToTime(lastRow.end_time, interval);
                nextEndTime = addMinutesToTime(nextStartTime, duration);
            }
        }

        const newRow: TimetableRow = {
            id: Math.random().toString(36).substr(2, 9),
            subject_id: filteredSubjects[prevRows.length % filteredSubjects.length]?.id?.toString() || "",
            staff_id: filteredTeachers[0]?.id?.toString() || "",
            start_time: nextStartTime,
            end_time: nextEndTime,
            room: prevRows.length > 0 ? prevRows[prevRows.length - 1].room : quickParams.room
        };

        setDayData({
            ...dayData,
            [day]: [...prevRows, newRow]
        });
    };

    const removeRow = (day: string, id: string) => {
        setDayData({
            ...dayData,
            [day]: dayData[day].filter(row => row.id !== id)
        });
    };

    const updateRow = (day: string, id: string, field: keyof TimetableRow, value: string) => {
        setDayData({
            ...dayData,
            [day]: dayData[day].map(row => row.id === id ? { ...row, [field]: value } : row)
        });
    };

    const addMinutesToTime = (timeStr: string, minutes: number) => {
        if (!timeStr) return "";
        const [hours, mins] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours || 0, mins || 0, 0, 0);
        date.setMinutes(date.getMinutes() + minutes);
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    };

    const applyQuickParams = () => {
        if (!quickParams.start_time) {
            tt.error("please_set_start_time_first");
            return;
        }

        const currentRows = dayData[currentDay] || [];
        if (currentRows.length === 0) {
            tt.error("no_rows_added_for_day", { day: t(currentDay.toLowerCase()) });
            return;
        }

        let currentTime = quickParams.start_time;
        const duration = parseInt(quickParams.duration) || 45;
        const interval = parseInt(quickParams.interval) || 5;

        const newRows = currentRows.map((row) => {
            const start = currentTime;
            const end = addMinutesToTime(start, duration);
            currentTime = addMinutesToTime(end, interval);

            return {
                ...row,
                start_time: start,
                end_time: end,
                room: quickParams.room || row.room
            };
        });

        setDayData({
            ...dayData,
            [currentDay]: newRows
        });
        tt.success("time_parameters_applied", { count: currentRows.length, day: t(currentDay.toLowerCase()) });
    };

    const copyCurrentDayToAllDays = () => {
        const sourceRows = dayData[currentDay] || [];
        if (sourceRows.length === 0) {
            tt.error("no_rows_to_copy");
            return;
        }

        const updated: DayData = {};
        orderedDays.forEach(day => {
            updated[day] = sourceRows.map(r => ({
                ...r,
                id: Math.random().toString(36).substr(2, 9)
            }));
        });

        setDayData(updated);
        tt.success(`Copied ${currentDay} schedule to all weekdays!`);
    };

    const handleSave = async () => {
        if (!selectedClassId || !selectedSectionId || !selectedSubjectGroupId) {
            tt.error("criteria_missing");
            return;
        }

        setSaving(true);
        try {
            const entries = dayData[currentDay].map(row => ({
                subject_id: row.subject_id,
                staff_id: row.staff_id,
                start_time: row.start_time,
                end_time: row.end_time,
                room: row.room
            }));

            if (entries.some(e => !e.subject_id || !e.staff_id || !e.start_time || !e.end_time)) {
                tt.error("please_fill_all_fields_for_all_rows");
                setSaving(false);
                return;
            }

            await api.post("/academics/class-timetables/bulk-store", {
                school_class_id: selectedClassId,
                section_id: selectedSectionId,
                subject_group_id: selectedSubjectGroupId,
                day: currentDay,
                entries: entries
            });

            tt.success("timetable_saved_successfully", { day: t(currentDay.toLowerCase()) });
        } catch (error) {
            console.error("Error saving timetable:", error);
            tt.error("failed_to_save");
        } finally {
            setSaving(false);
        }
    };

    const currentDayRows = dayData[currentDay] || [];

    return (
        <div className="space-y-6 font-sans p-3 sm:p-5 bg-gray-50/10 min-h-screen">
            {/* Top Criteria Selection Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Calendar className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                {t("add_timetable_entry")}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("build_weekly_class_period_schedules")}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Class */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("class")} <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={selectedClassId}
                                onValueChange={(val) => {
                                    setSelectedClassId(val);
                                    setSelectedSectionId('');
                                    setSelectedSubjectGroupId('');
                                    fetchSectionsByClass(val);
                                }}
                            >
                                <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Section */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("section")} <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={selectedSectionId}
                                onValueChange={setSelectedSectionId}
                                disabled={!selectedClassId}
                            >
                                <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                    <SelectValue placeholder={!selectedClassId ? t("select_class_first") : t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Subject Group */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("subject_group")} <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={selectedSubjectGroupId}
                                onValueChange={setSelectedSubjectGroupId}
                                disabled={!selectedClassId}
                            >
                                <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjectGroups
                                        .filter(sg => !selectedClassId || sg.school_class_id.toString() === selectedClassId)
                                        .map(sg => (
                                            <SelectItem key={sg.id} value={sg.id.toString()}>{sg.name}</SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end mt-5 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <Button
                            onClick={handleSearch}
                            disabled={searching || loading}
                            className="btn-gradient text-white gap-2 h-10 px-8 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full"
                        >
                            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            {t("search")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Auto-Schedule Generator Bar */}
            <div className="p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/70 via-white to-amber-50/50 dark:from-indigo-950/40 dark:via-gray-900 dark:to-gray-900 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                        {t("select_parameter_to_generate_timetable_quickly")}
                    </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <Clock className="h-3 w-3 text-indigo-500" /> Period Start Time *
                        </Label>
                        <Input
                            type="time"
                            value={quickParams.start_time}
                            onChange={(e) => setQuickParams({ ...quickParams, start_time: e.target.value })}
                            className="h-9 text-xs border-gray-200 bg-white dark:bg-gray-800 rounded-lg shadow-none"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Duration (Minutes) *
                        </Label>
                        <Input
                            type="number"
                            value={quickParams.duration}
                            onChange={(e) => setQuickParams({ ...quickParams, duration: e.target.value })}
                            className="h-9 text-xs border-gray-200 bg-white dark:bg-gray-800 rounded-lg shadow-none"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Interval / Break (Min) *
                        </Label>
                        <Input
                            type="number"
                            value={quickParams.interval}
                            onChange={(e) => setQuickParams({ ...quickParams, interval: e.target.value })}
                            className="h-9 text-xs border-gray-200 bg-white dark:bg-gray-800 rounded-lg shadow-none"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Default Room No.
                        </Label>
                        <Input
                            value={quickParams.room}
                            onChange={(e) => setQuickParams({ ...quickParams, room: e.target.value })}
                            className="h-9 text-xs border-gray-200 bg-white dark:bg-gray-800 rounded-lg shadow-none"
                            placeholder="e.g. 101"
                        />
                    </div>

                    <Button
                        type="button"
                        onClick={applyQuickParams}
                        className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                        <Wand2 className="h-3.5 w-3.5" />
                        Apply Timing
                    </Button>
                </div>
            </div>

            {/* Weekly Days Schedule Table Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                {/* Custom Styled Day Tabs Navigation Bar */}
                <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 p-2 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Day Pill Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        {orderedDays.map((day) => {
                            const count = dayData[day]?.length || 0;
                            const isActive = currentDay === day;
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => setCurrentDay(day)}
                                    className={cn(
                                        "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                                        isActive
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md shadow-indigo-200/50"
                                            : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 border border-gray-200 dark:border-gray-700"
                                    )}
                                >
                                    {day}
                                    {count > 0 && (
                                        <span className={cn(
                                            "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                                            isActive ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"
                                        )}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Batch Actions & Add Period */}
                    <div className="flex items-center gap-2">
                        {currentDayRows.length > 0 && (
                            <Button
                                type="button"
                                onClick={copyCurrentDayToAllDays}
                                variant="outline"
                                className="h-8 px-3 rounded-lg text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex items-center gap-1"
                            >
                                <Copy className="h-3.5 w-3.5 text-indigo-500" />
                                Copy to All Days
                            </Button>
                        )}
                        <Button
                            type="button"
                            onClick={() => addRow(currentDay)}
                            className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                        >
                            <Plus className="h-4 w-4" />
                            Add Period
                        </Button>
                    </div>
                </div>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/90 dark:bg-gray-800/80 text-[11px] uppercase font-bold text-gray-600 dark:text-gray-300">
                                <TableRow className="hover:bg-transparent border-gray-200 dark:border-gray-700">
                                    <TableHead className="py-3 px-4 w-[90px]">Period</TableHead>
                                    <TableHead className="py-3 px-4 min-w-[200px]">{t("subject")}</TableHead>
                                    <TableHead className="py-3 px-4 w-[150px]">{t("time_from")} *</TableHead>
                                    <TableHead className="py-3 px-4 w-[150px]">{t("time_to")} *</TableHead>
                                    <TableHead className="py-3 px-4 min-w-[220px]">{t("teacher")}</TableHead>
                                    <TableHead className="py-3 px-4 w-[130px]">{t("room_no")}</TableHead>
                                    <TableHead className="py-3 px-4 text-center w-[70px]">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentDayRows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="px-4 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <div className="p-3 bg-indigo-50 dark:bg-gray-800 rounded-2xl text-indigo-500">
                                                    <Clock className="h-7 w-7" />
                                                </div>
                                                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                                    No schedule periods added for {currentDay}
                                                </p>
                                                <Button
                                                    type="button"
                                                    onClick={() => addRow(currentDay)}
                                                    variant="outline"
                                                    className="h-8 px-4 rounded-full text-xs font-bold text-indigo-600 border-indigo-200 mt-2"
                                                >
                                                    <Plus className="h-3.5 w-3.5 mr-1" /> Add 1st Period
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    currentDayRows.map((row, idx) => (
                                        <TableRow
                                            key={row.id}
                                            className="text-[13px] border-b last:border-0 border-gray-100 dark:border-gray-800 hover:bg-indigo-50/20 transition-colors"
                                        >
                                            {/* Period Number */}
                                            <TableCell className="py-3 px-4">
                                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold text-xs border border-indigo-100 dark:border-indigo-800">
                                                    #{idx + 1}
                                                </span>
                                            </TableCell>

                                            {/* Subject Select */}
                                            <TableCell className="py-3 px-4">
                                                <Select
                                                    value={row.subject_id}
                                                    onValueChange={(v) => updateRow(currentDay, row.id, "subject_id", v)}
                                                >
                                                    <SelectTrigger className="h-9 text-xs border-gray-200 bg-gray-50/30 rounded-lg shadow-none">
                                                        <SelectValue placeholder={t("select")} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {filteredSubjects.map((s: any) => (
                                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                                {s.name} {s.code ? `(${s.code})` : ""}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>

                                            {/* Time From */}
                                            <TableCell className="py-3 px-4">
                                                <div className="relative">
                                                    <Input
                                                        type="time"
                                                        value={row.start_time}
                                                        onChange={(e) => updateRow(currentDay, row.id, "start_time", e.target.value)}
                                                        className="h-9 text-xs border-gray-200 bg-gray-50/30 rounded-lg shadow-none"
                                                    />
                                                </div>
                                            </TableCell>

                                            {/* Time To */}
                                            <TableCell className="py-3 px-4">
                                                <div className="relative">
                                                    <Input
                                                        type="time"
                                                        value={row.end_time}
                                                        onChange={(e) => updateRow(currentDay, row.id, "end_time", e.target.value)}
                                                        className="h-9 text-xs border-gray-200 bg-gray-50/30 rounded-lg shadow-none"
                                                    />
                                                </div>
                                            </TableCell>

                                            {/* Teacher Select */}
                                            <TableCell className="py-3 px-4">
                                                <Select
                                                    value={row.staff_id}
                                                    onValueChange={(v) => updateRow(currentDay, row.id, "staff_id", v)}
                                                >
                                                    <SelectTrigger className="h-9 text-xs border-gray-200 bg-gray-50/30 rounded-lg shadow-none">
                                                        <SelectValue placeholder={t("select")} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {filteredTeachers.map((s: any) => (
                                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                                {s.name} {s.staff_id ? `(${s.staff_id})` : ""}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>

                                            {/* Room No */}
                                            <TableCell className="py-3 px-4">
                                                <Input
                                                    value={row.room}
                                                    onChange={(e) => updateRow(currentDay, row.id, "room", e.target.value)}
                                                    className="h-9 text-xs border-gray-200 bg-gray-50/30 rounded-lg shadow-none"
                                                    placeholder="Room No"
                                                />
                                            </TableCell>

                                            {/* Delete Action */}
                                            <TableCell className="py-3 px-4 text-center">
                                                <Button
                                                    type="button"
                                                    onClick={() => removeRow(currentDay, row.id)}
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all shadow-xs"
                                                    title="Delete Period"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Bottom Save Bar */}
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-xs text-gray-500 font-bold">
                            {currentDay}: {currentDayRows.length} Scheduled Periods
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={saving || currentDayRows.length === 0}
                            className="btn-gradient text-white px-8 h-10 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full flex items-center gap-2"
                        >
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            <Save className="h-4 w-4" />
                            {t("save_timetable")}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
