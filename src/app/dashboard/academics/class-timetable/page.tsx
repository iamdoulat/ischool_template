"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Plus,
    Search,
    Printer,
    Clock,
    User,
    BookOpen,
    MapPin,
    AlertCircle,
    Loader2,
    Trash2,
    CalendarClock,
    Filter,
    Sparkles,
    Calendar,
    GraduationCap,
    Layers,
    CheckCircle2
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { useSettings } from "@/components/providers/settings-provider";
import { formatTime, cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/image-url";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TimetableEntry {
    id: number;
    subject_id: number;
    subject_group_id?: number;
    staff_id: number;
    day: string;
    start_time: string;
    end_time: string;
    room: string;
    subject?: { name: string; code?: string };
    staff?: { name: string; staff_id?: string; avatar?: string; photo?: string };
}

interface TimetableDay {
    day: string;
    entries: TimetableEntry[];
}

interface ClassOption {
    id: number | string;
    name: string;
}

interface SectionOption {
    id: number | string;
    name: string;
    school_class_id?: number | string;
}

interface SubjectGroupOption {
    id: number | string;
    name: string;
    school_class_id?: number | string;
}

const DEFAULT_DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function TimetableSkeleton({ days }: { days: string[] }) {
    return (
        <div className="overflow-x-auto p-4">
            <div className="flex min-w-max gap-4">
                {days.map((day) => (
                    <div key={day} className="flex-1 min-w-[230px]">
                        <div className="h-10 rounded-xl bg-muted/60 animate-pulse mb-3" />
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-28 rounded-xl bg-muted/60 animate-pulse" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ClassTimetablePage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const { settings } = useSettings();
    const tf = settings?.time_format === "12" ? "12" : "24" as const;

    // Derived ordered days based on settings
    const orderedDays = useMemo(() => {
        const startDay = settings?.start_day_of_week?.toLowerCase() || "saturday";
        const startIndex = DEFAULT_DAYS.findIndex(d => d.toLowerCase() === startDay);
        if (startIndex === -1) return DEFAULT_DAYS;
        return [...DEFAULT_DAYS.slice(startIndex), ...DEFAULT_DAYS.slice(0, startIndex)];
    }, [settings?.start_day_of_week]);

    // Prerequisite states
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [sections, setSections] = useState<SectionOption[]>([]);
    const [subjectGroups, setSubjectGroups] = useState<SubjectGroupOption[]>([]);

    // Selection states
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [selectedSectionId, setSelectedSectionId] = useState<string>("");
    const [selectedSubjectGroupId, setSelectedSubjectGroupId] = useState<string>("");

    // Timetable data
    const [timetableData, setTimetableData] = useState<TimetableDay[]>([]);

    // Delete dialog states
    const [entryToDelete, setEntryToDelete] = useState<number | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Initialize/Update empty timetable grid when orderedDays changes
    useEffect(() => {
        setTimetableData(orderedDays.map(day => ({ day, entries: [] })));
    }, [orderedDays]);

    // UI states
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    // Total scheduled entries
    const totalEntries = useMemo(
        () => timetableData.reduce((sum, d) => sum + d.entries.length, 0),
        [timetableData]
    );

    // Load prerequisites (classes, subject groups)
    useEffect(() => {
        const fetchPrerequisites = async () => {
            setLoading(true);
            try {
                const [classRes, subjectGroupRes] = await Promise.all([
                    api.get("/academics/classes?no_paginate=true").catch(() => ({ data: [] })),
                    api.get("/academics/subject-groups?no_paginate=true").catch(() => ({ data: [] })),
                ]);
                setClasses(classRes.data?.data || classRes.data || []);
                setSubjectGroups(subjectGroupRes.data?.data || subjectGroupRes.data || []);
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
            const all: SectionOption[] = res.data?.data || res.data || [];
            const filtered = all.filter((s: SectionOption) => String(s.school_class_id) === String(classId));
            setSections(filtered);
        } catch {
            setSections([]);
        }
    };

    const handleSearch = async () => {
        if (!selectedClassId || !selectedSectionId) {
            tt.error("please_select_class_and_section");
            return;
        }

        setSearching(true);
        try {
            const res = await api.get("/academics/class-timetables", {
                params: {
                    school_class_id: selectedClassId,
                    section_id: selectedSectionId,
                    subject_group_id: selectedSubjectGroupId || undefined
                }
            });
            const entries = res.data.data || [];

            const grouped = orderedDays.map(day => ({
                day,
                entries: entries.filter((e: TimetableEntry) => e.day === day)
            }));
            setTimetableData(grouped);
            tt.success("timetable_data_loaded");
        } catch (error) {
            console.error("Error searching timetable:", error);
            tt.error("failed_to_fetch");
        } finally {
            setSearching(false);
        }
    };

    const confirmDeleteEntry = (id: number) => {
        setEntryToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteEntry = async () => {
        if (!entryToDelete) return;
        setDeleting(true);

        try {
            await api.delete(`/academics/class-timetables/${entryToDelete}`);
            tt.success("entry_deleted_successfully");
            handleSearch();
        } catch (error) {
            console.error("Error deleting entry:", error);
            tt.error("failed_to_delete");
        } finally {
            setDeleting(false);
            setIsDeleteDialogOpen(false);
            setEntryToDelete(null);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const selectedClassName = classes.find(c => String(c.id) === selectedClassId)?.name;
    const selectedSectionName = sections.find(s => String(s.id) === selectedSectionId)?.name;

    return (
        <div className="space-y-6 font-sans p-3 sm:p-5 bg-gray-50/10 min-h-screen">
            {/* Header/Title Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden no-print">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <CalendarClock className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 tracking-tight leading-none">
                            {t("class_timetable")}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {t("view_weekly_class_period_schedules") || "Weekly class period routine and timetable schedules"}
                        </p>
                    </div>
                </div>
                <Link href="/dashboard/academics/class-timetable/add">
                    <Button className="btn-gradient text-white px-5 h-9 text-xs gap-1.5 shadow-md rounded-full font-bold uppercase tracking-wider">
                        <Plus className="h-4 w-4" /> {t("add_new") || "Add Timetable"}
                    </Button>
                </Link>
            </div>

            {/* Select Criteria Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 no-print select-criteria-section">
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Filter className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                {t("select_criteria")}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("choose_class_section_to_view_timetable")}</p>
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
                                    {classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
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
                                    {sections.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Subject Group */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("subject_group")}
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
                                        .filter(sg => !selectedClassId || String(sg.school_class_id) === selectedClassId)
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

            {/* Timetable Weekly Matrix Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <CalendarClock className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                {t("class_timetable")}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {selectedClassName && selectedSectionName
                                    ? `${selectedClassName} • Section ${selectedSectionName} (${totalEntries} Periods Scheduled)`
                                    : t("x_scheduled_entries", { count: totalEntries })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {totalEntries > 0 && (
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-bold px-2.5 py-1">
                                {totalEntries} Scheduled Periods
                            </Badge>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white rounded-lg shadow-sm p-0 border-0 no-print cursor-pointer"
                            onClick={handlePrint}
                            title="Print Timetable"
                        >
                            <Printer className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {searching ? (
                        <TimetableSkeleton days={orderedDays} />
                    ) : (
                        <div className="overflow-x-auto p-4 sm:p-5">
                            <div className="flex min-w-max gap-4 items-start">
                                {timetableData.map((dayData) => {
                                    const entryCount = dayData.entries.length;
                                    return (
                                        <div
                                            key={dayData.day}
                                            className="flex-1 min-w-[240px] max-w-[280px] flex flex-col space-y-3 bg-gray-50/40 dark:bg-gray-900/30 p-3 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-2xs"
                                        >
                                            {/* Column Header */}
                                            <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xs">
                                                <span className="text-xs font-black text-gray-800 dark:text-gray-100 uppercase tracking-wider">
                                                    {dayData.day}
                                                </span>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight",
                                                    entryCount > 0
                                                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200"
                                                        : "bg-gray-100 text-gray-500 dark:bg-gray-700"
                                                )}>
                                                    {entryCount > 0 ? `${entryCount} Period${entryCount === 1 ? '' : 's'}` : "Off"}
                                                </span>
                                            </div>

                                            {/* Period Cards Container */}
                                            <div className="space-y-3 min-h-[300px]">
                                                {entryCount > 0 ? (
                                                    dayData.entries.map((entry, idx) => (
                                                        <div
                                                            key={entry.id || idx}
                                                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all duration-200 relative group"
                                                        >
                                                            {/* Quick Delete Button */}
                                                            <button
                                                                type="button"
                                                                onClick={() => confirmDeleteEntry(entry.id)}
                                                                className="absolute top-2.5 right-2.5 h-6 w-6 rounded-md bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-2xs"
                                                                title="Delete Period"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>

                                                            {/* Period Time Pill */}
                                                            <div className="flex items-center gap-1.5 mb-2.5">
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10.5px] border border-indigo-100 dark:border-indigo-900/60">
                                                                    <Clock className="h-3 w-3 text-indigo-500" />
                                                                    #{idx + 1} • {formatTime(entry.start_time, tf)} - {formatTime(entry.end_time, tf)}
                                                                </span>
                                                            </div>

                                                            {/* Subject Name */}
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="h-6 w-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                                                                    <BookOpen className="h-3.5 w-3.5" />
                                                                </div>
                                                                <span className="font-bold text-gray-900 dark:text-gray-100 text-xs truncate">
                                                                    {entry.subject?.name} {entry.subject?.code ? `(${entry.subject?.code})` : ""}
                                                                </span>
                                                            </div>

                                                            {/* Teacher & Room Rows */}
                                                            <div className="space-y-1 pt-1.5 border-t border-gray-100 dark:border-gray-700/60 text-[11px]">
                                                                <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                                                                    <div className="flex items-center gap-1.5 truncate">
                                                                        <User className="h-3 w-3 text-gray-400 shrink-0" />
                                                                        <span className="truncate font-medium">{entry.staff?.name || "Teacher"}</span>
                                                                    </div>
                                                                    {entry.staff?.staff_id && (
                                                                        <span className="text-[9.5px] font-mono text-gray-400 font-semibold shrink-0">
                                                                            {entry.staff.staff_id}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-[10.5px]">
                                                                    <MapPin className="h-3 w-3 text-amber-500 shrink-0" />
                                                                    <span>Room {entry.room || "N/A"}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    /* Empty / Off Day Placeholder */
                                                    <div className="bg-white/60 dark:bg-gray-800/40 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center flex flex-col items-center justify-center gap-2">
                                                        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                                                            <AlertCircle className="h-4 w-4" />
                                                        </div>
                                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                                            {t("not_scheduled")}
                                                        </span>
                                                        <Link href="/dashboard/academics/class-timetable/add">
                                                            <button
                                                                type="button"
                                                                className="text-[10.5px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5 mt-1 cursor-pointer"
                                                            >
                                                                <Plus className="h-3 w-3" /> Add Period
                                                            </button>
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">
                            {t("are_you_absolutely_sure") || "Delete Timetable Entry?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            {t("delete_entry_confirm_message") || "Are you sure you want to remove this period schedule? This action cannot be undone."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel disabled={deleting} className="h-9 rounded-full text-[11px] font-bold uppercase tracking-wider border-gray-200">
                            {t("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeleteEntry();
                            }}
                            className="bg-rose-500 hover:bg-rose-600 h-9 rounded-full text-[11px] font-bold uppercase tracking-wider border-0 shadow-md"
                            disabled={deleting}
                        >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
