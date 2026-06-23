"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
    Plus, Search, Printer, Clock, User, BookOpen, MapPin, AlertCircle, Loader2, X, Trash2, Save, Wand2, Calendar
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/components/providers/settings-provider";
import { useMemo } from "react";

const DEFAULT_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
        const startDay = settings?.start_day_of_week?.toLowerCase() || "monday";
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

    // Selection states
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [selectedSectionId, setSelectedSectionId] = useState<string>("");
    const [selectedSubjectGroupId, setSelectedSubjectGroupId] = useState<string>("");

    // Quick Parameter states
    const [quickParams, setQuickParams] = useState({
        start_time: "",
        duration: "45",
        interval: "5",
        room: ""
    });

    // Timetable data state
    const [dayData, setDayData] = useState<DayData>(
        DEFAULT_DAYS.reduce((acc, day) => ({ ...acc, [day]: [] }), {})
    );

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

    // UI states
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentDay, setCurrentDay] = useState("Monday");

    // Load prerequisites (classes, subjects, teachers)
    useEffect(() => {
        const fetchPrerequisites = async () => {
            setLoading(true);
            try {
                const [classRes, subjectGroupRes, subjectRes, staffRes] = await Promise.all([
                    api.get("/academics/classes?no_paginate=true"),
                    api.get("/academics/subject-groups?no_paginate=true"),
                    api.get("/academics/subjects?no_paginate=true"),
                    api.get("/hr/staff-directory", { params: { role: 'Teacher', no_paginate: true, active: 'all' } })
                ]);
                setClasses(classRes.data.data?.data || classRes.data.data || []);
                setSubjectGroups(subjectGroupRes.data.data?.data || subjectGroupRes.data.data || []);
                setAllSubjects(subjectRes.data.data?.data || subjectRes.data.data || []);
                const teachers = (staffRes.data?.data || staffRes.data || []).filter((u: any) => u.role === 'Teacher');
                setStaffList(teachers);
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

            // Map entries to our dayData state in the correct order
            const newDayData = orderedDays.reduce((acc, day) => {
                const dayEntries = entries.filter((e: any) => e.day === day).map((e: any) => ({
                    id: e.id.toString(),
                    subject_id: e.subject_id.toString(),
                    staff_id: e.staff_id.toString(),
                    start_time: e.start_time,
                    end_time: e.end_time,
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
        const newRow: TimetableRow = {
            id: Math.random().toString(36).substr(2, 9),
            subject_id: "",
            staff_id: "",
            start_time: "",
            end_time: "",
            room: dayData[day].length > 0 ? dayData[day][dayData[day].length - 1].room : quickParams.room
        };
        setDayData({
            ...dayData,
            [day]: [...dayData[day], newRow]
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
        date.setHours(hours, mins, 0, 0);
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
        const duration = parseInt(quickParams.duration) || 0;
        const interval = parseInt(quickParams.interval) || 0;

        const newRows = currentRows.map((row, index) => {
            const start = currentTime;
            const end = addMinutesToTime(start, duration);

            // Prepare time for NEXT row
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

    const handleSave = async () => {
        if (!selectedClassId || !selectedSectionId || !selectedSubjectGroupId) {
            tt.error("criteria_missing");
            return;
        }

        setSaving(true);
        try {
            // Bulk Save per day (or all at once if backend supports)
            // For now, let's just save the current day's entries
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Calendar className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("add_timetable_entry")}</h1>
                        <p className="text-[11px] text-gray-500 mt-1">{t("build_weekly_class_period_schedules")}</p>
                    </div>
                </div>
            </div>

            {/* Select Criteria Section */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b">
                        <h2 className="text-lg font-medium text-gray-800">{t("select_criteria")}</h2>
                        <Button
                            onClick={handleSearch}
                            className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white px-8 h-9 text-xs gap-2 shadow-md transition-all duration-300"
                            disabled={searching || loading}
                        >
                            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            {t("search")}
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600 uppercase">
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
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600 uppercase">
                                {t("section")} <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={selectedSectionId}
                                onValueChange={setSelectedSectionId}
                                disabled={!selectedClassId}
                            >
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder={!selectedClassId ? t("select_class_first") : t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600 uppercase">
                                {t("subject_group")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedSubjectGroupId} onValueChange={setSelectedSubjectGroupId}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjectGroups.filter(sg => !selectedClassId || sg.school_class_id.toString() === selectedClassId).map(sg => (
                                        <SelectItem key={sg.id} value={sg.id.toString()}>{sg.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Params Section */}
            <Card>
                <CardContent className="pt-6">
                    <p className="text-sm text-gray-500 mb-4">{t("select_parameter_to_generate_timetable_quickly")}</p>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">{t("period_start_time")} *</Label>
                            <Input
                                type="time"
                                value={quickParams.start_time}
                                onChange={(e) => setQuickParams({ ...quickParams, start_time: e.target.value })}
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">{t("duration_minute")} *</Label>
                            <Input
                                type="number"
                                value={quickParams.duration}
                                onChange={(e) => setQuickParams({ ...quickParams, duration: e.target.value })}
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">{t("interval_minute")} *</Label>
                            <Input
                                type="number"
                                value={quickParams.interval}
                                onChange={(e) => setQuickParams({ ...quickParams, interval: e.target.value })}
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">{t("room_no")}</Label>
                            <Input
                                value={quickParams.room}
                                onChange={(e) => setQuickParams({ ...quickParams, room: e.target.value })}
                                className="h-10"
                                placeholder={t("e.g. 101")}
                            />
                        </div>
                        <Button
                            onClick={applyQuickParams}
                            className="bg-[#6366f1] hover:bg-[#5558dd] text-white h-10 gap-2"
                        >
                            <Wand2 className="h-4 w-4" /> {t("apply")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Day Tabs and Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <Tabs value={currentDay} onValueChange={setCurrentDay} className="w-full">
                    <div className="border-b bg-gray-50/50 flex justify-between items-center px-4">
                        <TabsList className="bg-transparent h-12 gap-0 p-0 border-r">
                            {orderedDays.map(day => (
                                <TabsTrigger
                                    key={day}
                                    value={day}
                                    className="h-12 rounded-none px-6 border-b-2 border-transparent data-[state=active]:border-[#6366f1] data-[state=active]:bg-white data-[state=active]:shadow-none transition-all"
                                >
                                    {t(day.toLowerCase())}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        <Button
                            onClick={() => addRow(currentDay)}
                            className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white h-8 text-xs gap-1 shadow-md"
                        >
                            <Plus className="h-4 w-4" /> {t("add_new")}
                        </Button>
                    </div>

                    {orderedDays.map(day => (
                        <TabsContent key={day} value={day} className="p-0 m-0 border-none outline-none">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 border-b text-gray-600 font-medium">
                                        <tr>
                                            <th className="py-3 px-4">{t("subject")}</th>
                                            <th className="py-3 px-4">{t("time_from")} *</th>
                                            <th className="py-3 px-4">{t("time_to")} *</th>
                                            <th className="py-3 px-4">{t("teacher")}</th>
                                            <th className="py-3 px-4">{t("room_no")}</th>
                                            <th className="py-3 px-4 w-10 text-center">{t("action")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {dayData[day]?.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-10 text-center text-gray-500">
                                                    {t("no_entries_added_for_day", { day: t(day.toLowerCase()) })}
                                                </td>
                                            </tr>
                                        ) : (
                                            dayData[day]?.map((row) => (
                                                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-2 px-4 whitespace-nowrap min-w-[200px]">
                                                        <Select value={row.subject_id} onValueChange={(v) => updateRow(day, row.id, "subject_id", v)}>
                                                            <SelectTrigger className="h-9">
                                                                <SelectValue placeholder={t("select")} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {filteredSubjects.map((s: any) => (
                                                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.code})</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </td>
                                                    <td className="py-2 px-4 whitespace-nowrap">
                                                        <Input
                                                            type="time"
                                                            value={row.start_time}
                                                            onChange={(e) => updateRow(day, row.id, "start_time", e.target.value)}
                                                            className="h-9"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-4 whitespace-nowrap">
                                                        <Input
                                                            type="time"
                                                            value={row.end_time}
                                                            onChange={(e) => updateRow(day, row.id, "end_time", e.target.value)}
                                                            className="h-9"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-4 whitespace-nowrap min-w-[200px]">
                                                        <Select value={row.staff_id} onValueChange={(v) => updateRow(day, row.id, "staff_id", v)}>
                                                            <SelectTrigger className="h-9">
                                                                <SelectValue placeholder={t("select")} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {staffList.map((s: any) => (
                                                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.staff_id})</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </td>
                                                    <td className="py-2 px-4 whitespace-nowrap">
                                                        <Input
                                                            value={row.room}
                                                            onChange={(e) => updateRow(day, row.id, "room", e.target.value)}
                                                            className="h-9"
                                                            placeholder={t("room")}
                                                        />
                                                    </td>
                                                    <td className="py-2 px-4 text-center">
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => removeRow(day, row.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>
                    ))}

                    <div className="p-4 border-t bg-gray-50 flex justify-end">
                        <Button
                            onClick={handleSave}
                            className="bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white px-8 h-10 gap-2 shadow-md transition-all duration-300 font-semibold"
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {t("save_timetable")}
                        </Button>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
