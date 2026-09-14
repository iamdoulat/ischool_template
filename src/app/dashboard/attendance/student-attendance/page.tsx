"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn, toLocaleNumber } from "@/lib/utils";
import { toast } from "sonner";
import api from "@/lib/api";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    CheckCircle2,
    Search,
    Save,
    Loader2,
    ClipboardCheck,
    Filter,
    Users,
    AlertCircle,
} from "lucide-react";
import CsvImportDialog from "@/components/attendance/CsvImportDialog";
import { DatePicker } from "@/components/ui/date-picker";
import { useSettings } from "@/components/providers/settings-provider";
import { useTranslation } from "@/hooks/use-translation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useImageUrl } from "@/lib/image-url";

interface StudentAttendanceRecord {
    id: number;
    student_id: number;
    admission_no: string;
    roll_no: string;
    name: string;
    avatar: string;
    attendance: "present" | "late" | "absent" | "holiday" | "half_day" | "on_leave";
    reason: string;
    entry_time: string;
    exit_time: string;
    note: string;
    isOnLeave?: boolean;
    leaveDetails?: LeaveDetails | null;
}

interface LeaveDetails {
    reason?: string;
    leave_from?: string;
    leave_to?: string;
    leaveType?: { name?: string };
    leave_type?: { name?: string };
    [key: string]: unknown;
}

interface RawStudent {
    id: number;
    admission_no?: string;
    roll_no?: string;
    name?: string;
    last_name?: string;
    avatar?: string;
    attendances?: { attendance?: StudentAttendanceRecord["attendance"]; reason?: string; entry_time?: string; exit_time?: string; note?: string }[];
    student_attendances?: { attendance?: StudentAttendanceRecord["attendance"]; reason?: string; entry_time?: string; exit_time?: string; note?: string }[];
    leave_requests?: Record<string, unknown>[];
}

interface ClassAttendanceSetting {
    class_id: number | string;
    sections?: {
        section_id: number | string;
        settings?: { type?: string; from?: string }[];
    }[];
}

interface SchoolClass {
    id: number;
    name: string;
    sections?: Section[];
}

interface Section {
    id: number;
    name: string;
}

const ATTENDANCE_OPTIONS = [
    { id: "present", key: "present", defaultLabel: "Present", short: "P", color: "text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100", activeBg: "bg-emerald-600 text-white border-emerald-600" },
    { id: "late", key: "late", defaultLabel: "Late", short: "L", color: "text-amber-700 bg-amber-50 border-amber-300 hover:bg-amber-100", activeBg: "bg-amber-500 text-white border-amber-500" },
    { id: "absent", key: "absent", defaultLabel: "Absent", short: "A", color: "text-rose-700 bg-rose-50 border-rose-300 hover:bg-rose-100", activeBg: "bg-rose-600 text-white border-rose-600" },
    { id: "half_day", key: "half_day", defaultLabel: "Half Day", short: "HD", color: "text-sky-700 bg-sky-50 border-sky-300 hover:bg-sky-100", activeBg: "bg-sky-600 text-white border-sky-600" },
    { id: "holiday", key: "holiday", defaultLabel: "Holiday", short: "H", color: "text-purple-700 bg-purple-50 border-purple-300 hover:bg-purple-100", activeBg: "bg-purple-600 text-white border-purple-600" },
] as const;

export default function StudentAttendancePage() {
    const { settings } = useSettings();
    const { t, language } = useTranslation();
    const shortCode = language?.short_code || "en";
    const getImageUrl = useImageUrl();
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState<StudentAttendanceRecord[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [bulkAttendance, setBulkAttendance] = useState("");
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const getLocalizedClassName = (name?: string) => {
        if (!name) return "";
        const match = name.match(/^Class\s+(\d+)$/i);
        if (match) {
            const key = `class_${match[1]}`;
            const trans = t(key);
            if (trans && trans !== key) return trans;
            return `${t("class")} ${toLocaleNumber(match[1], shortCode)}`;
        }
        const key = name.toLowerCase().replace(/\s+/g, "_");
        const trans = t(key);
        return trans && trans !== key ? trans : toLocaleNumber(name, shortCode);
    };

    const getLocalizedSectionName = (name?: string) => {
        if (!name) return "";
        return toLocaleNumber(name, shortCode);
    };

    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return "";
        const parts = dateStr.split("-");
        if (parts.length === 3) {
            const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
            return toLocaleNumber(formatted, shortCode);
        }
        return toLocaleNumber(dateStr, shortCode);
    };

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const response = await api.get("/academics/classes?no_paginate=true");
                if (response.data.success || response.data.data) {
                    const list = response.data.data || [];
                    setClasses(list);
                    if (list.length > 0) {
                        setSelectedClass(list[0].id.toString());
                    }
                }
            } catch (error) {
                console.error("Error fetching classes:", error);
                toast.error(t("failed_to_load_classes"));
            }
        };

        fetchClasses();
    }, [t]);

    useEffect(() => {
        if (selectedClass) {
            const selectedCls = classes.find(c => c.id.toString() === selectedClass);
            setSections(selectedCls?.sections || []);
            if (selectedCls?.sections && selectedCls.sections.length > 0) {
                setSelectedSection(selectedCls.sections[0].id.toString());
            } else {
                setSelectedSection("");
            }
        } else {
            setSections([]);
            setSelectedSection("");
        }
    }, [selectedClass, classes]);

    // Clear students when criteria change
    useEffect(() => {
        setStudents([]);
        setHasSearched(false);
        setBulkAttendance("");
    }, [selectedClass, selectedSection, attendanceDate]);

    const handleSearch = async () => {
        if (!selectedClass || !selectedSection || !attendanceDate) {
            toast.error(t("please_select_all_criteria") || "Please select Class, Section, and Date");
            return;
        }

        setLoading(true);
        setHasSearched(true);
        setStudents([]);

        try {
            let studentsData: RawStudent[] = [];

            // Step 1: Attendance endpoint
            try {
                const attendanceRes = await api.get("/attendance/student", {
                    params: {
                        class_id: selectedClass,
                        section_id: selectedSection,
                        attendance_date: attendanceDate,
                    }
                });

                if (attendanceRes.data?.data && Array.isArray(attendanceRes.data.data) && attendanceRes.data.data.length > 0) {
                    studentsData = attendanceRes.data.data;
                }
            } catch (attErr) {
                console.warn("Could not fetch from /attendance/student:", attErr);
            }

            // Step 2: Fallback to /student/students
            if (studentsData.length === 0) {
                try {
                    const studentsRes = await api.get("/students", {
                        params: {
                            class_id: selectedClass,
                            section_id: selectedSection,
                            no_paginate: true,
                        }
                    });

                    if (studentsRes.data?.data && Array.isArray(studentsRes.data.data)) {
                        studentsData = studentsRes.data.data;
                    } else if (Array.isArray(studentsRes.data)) {
                        studentsData = studentsRes.data;
                    }
                } catch (studErr) {
                    console.warn("Could not fetch from /student/students:", studErr);
                }
            }

            // Step 3: Fetch active leave requests
            let leaveRequests: Record<string, unknown>[] = [];
            try {
                const leavesRes = await api.get("/attendance/approve-leave", {
                    params: {
                        class_id: selectedClass,
                        section_id: selectedSection,
                        status: "approved",
                        no_paginate: true,
                    }
                });
                if (leavesRes.data?.data && Array.isArray(leavesRes.data.data)) {
                    leaveRequests = leavesRes.data.data;
                }
            } catch {
                // optional
            }

            // Map and assemble attendance roster
            const mappedRecords: StudentAttendanceRecord[] = studentsData.map((s, idx) => {
                const existingAtt = (s.attendances && s.attendances.length > 0)
                    ? s.attendances[0]
                    : (s.student_attendances && s.student_attendances.length > 0)
                    ? s.student_attendances[0]
                    : null;

                // Check leave status
                const activeLeave = leaveRequests.find((l) => {
                    if (Number(l.student_id) !== Number(s.id)) return false;
                    const from = String(l.leave_from || l.from_date || "");
                    const to = String(l.leave_to || l.to_date || "");
                    return attendanceDate >= from && attendanceDate <= to;
                });

                const fullName = s.name
                    ? (s.last_name ? `${s.name} ${s.last_name}` : s.name)
                    : `Student #${s.id}`;

                let attendanceStatus: StudentAttendanceRecord["attendance"] = "present";
                let isOnLeave = false;

                if (activeLeave) {
                    attendanceStatus = "on_leave";
                    isOnLeave = true;
                } else if (existingAtt?.attendance) {
                    attendanceStatus = existingAtt.attendance;
                }

                return {
                    id: s.id || idx + 1,
                    student_id: s.id,
                    admission_no: s.admission_no || `ADM-${s.id}`,
                    roll_no: s.roll_no || `${idx + 1}`,
                    name: fullName,
                    avatar: s.avatar || "",
                    attendance: attendanceStatus,
                    reason: existingAtt?.reason || (isOnLeave ? "Approved Leave" : "Manual"),
                    entry_time: existingAtt?.entry_time || "",
                    exit_time: existingAtt?.exit_time || "",
                    note: existingAtt?.note || "",
                    isOnLeave,
                    leaveDetails: activeLeave as LeaveDetails | null,
                };
            });

            setStudents(mappedRecords);

            if (mappedRecords.length === 0) {
                toast.info(t("no_students_found_for_class_section"));
            }
        } catch (error) {
            console.error("Error during attendance search:", error);
            toast.error(t("failed_to_fetch_attendance"));
        } finally {
            setLoading(false);
        }
    };

    const getAutoEntryTime = (): string => {
        let entryTime = "";
        if (settings?.class_attendance_time) {
            try {
                const parsed: ClassAttendanceSetting[] = typeof settings.class_attendance_time === "string"
                    ? JSON.parse(settings.class_attendance_time)
                    : settings.class_attendance_time;

                if (Array.isArray(parsed)) {
                    const clsSetting = parsed.find(c => c.class_id.toString() === selectedClass);
                    if (clsSetting && clsSetting.sections) {
                        const secSetting = clsSetting.sections.find(s => s.section_id.toString() === selectedSection);
                        if (secSetting && secSetting.settings) {
                            const presentSetting = secSetting.settings.find(st => st.type === "present");
                            if (presentSetting && presentSetting.from) {
                                entryTime = presentSetting.from.substring(0, 5);
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to parse class_attendance_time", e);
            }
        }
        return entryTime;
    };

    const handleAttendanceChange = (studentId: number, value: "present" | "late" | "absent" | "holiday" | "half_day") => {
        setStudents(prev => prev.map(s => {
            if (s.id !== studentId || s.isOnLeave) return s;

            const updates: Partial<StudentAttendanceRecord> = { attendance: value };
            if (value === "present") {
                const entryTime = getAutoEntryTime();
                if (entryTime && !s.entry_time) updates.entry_time = entryTime;
            }
            return { ...s, ...updates };
        }));
    };

    const handleBulkAction = (value: string) => {
        setBulkAttendance(value);
        const autoEntry = value === "present" ? getAutoEntryTime() : "";

        setStudents(prev => prev.map(s => {
            if (s.isOnLeave) return s;
            const updates: Partial<StudentAttendanceRecord> = { attendance: value as StudentAttendanceRecord["attendance"] };
            if (value === "present" && autoEntry) {
                updates.entry_time = autoEntry;
            }
            return { ...s, ...updates };
        }));

        const optionObj = ATTENDANCE_OPTIONS.find(o => o.id === value);
        const label = optionObj ? t(optionObj.key) : value;
        toast.info(`${t("mark_all_as")}: ${label}`);
    };

    const handleInputChange = (studentId: number, field: keyof StudentAttendanceRecord, value: string) => {
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, [field]: value } : s));
    };

    const handleSave = async () => {
        if (students.length === 0) {
            toast.error(t("no_attendance_data_to_save") || "No attendance records to save");
            return;
        }

        setSaving(true);
        try {
            const response = await api.post("/attendance/student", {
                attendance_date: attendanceDate,
                attendances: students.map(s => ({
                    student_id: s.student_id,
                    attendance: s.attendance,
                    reason: s.reason || "Manual",
                    entry_time: s.entry_time || null,
                    exit_time: s.exit_time || null,
                    note: s.note || null,
                })),
            });

            if (response.data.success || response.status === 200) {
                toast.success(t("success"), {
                    description: t("student_attendance_updated_successfully") || "Student attendance saved successfully!",
                    icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                });
                setIsConfirmOpen(false);
            }
        } catch (error) {
            console.error("Error saving attendance:", error);
            toast.error(t("failed_to_save_attendance") || "Failed to submit attendance");
        } finally {
            setSaving(false);
        }
    };

    const handleCsvImport = (records: StudentAttendanceRecord[]) => {
        setStudents(records);
        setHasSearched(true);
        setBulkAttendance("");
    };

    // Filter students by local search
    const filteredStudents = useMemo(() => {
        if (!searchTerm) return students;
        const lower = searchTerm.toLowerCase();
        return students.filter(s =>
            s.name.toLowerCase().includes(lower) ||
            s.admission_no.toLowerCase().includes(lower) ||
            s.roll_no.toLowerCase().includes(lower)
        );
    }, [students, searchTerm]);

    // Statistics counts
    const stats = useMemo(() => {
        const total = students.length;
        const present = students.filter(s => s.attendance === "present").length;
        const late = students.filter(s => s.attendance === "late").length;
        const absent = students.filter(s => s.attendance === "absent").length;
        const halfDay = students.filter(s => s.attendance === "half_day").length;
        const holiday = students.filter(s => s.attendance === "holiday").length;
        const onLeave = students.filter(s => s.isOnLeave || s.attendance === "on_leave").length;
        const presentRate = total > 0 ? Math.round(((present + late + halfDay * 0.5) / total) * 100) : 0;

        return { total, present, late, absent, halfDay, holiday, onLeave, presentRate };
    }, [students]);

    return (
        <div className="w-full space-y-6 p-4 lg:p-6 font-sans bg-gray-50/10 min-h-screen">
            {/* Master Header Banner */}
            <div className="rounded-xl border border-gray-100 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] via-[#F8F9FE] to-[#EFF0FD]">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
                            <ClipboardCheck className="h-6 w-6" />
                        </span>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-800 leading-none flex items-center gap-2">
                                {t("student_daily_attendance_registry")}
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                    {t("roll_call_system")}
                                </span>
                            </h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {t("student_attendance_subtitle")}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                        <CsvImportDialog
                            onImport={handleCsvImport}
                            attendanceDate={attendanceDate}
                            selectedClass={selectedClass}
                            selectedSection={selectedSection}
                        />
                    </div>
                </div>
            </div>

            {/* Criteria Selection Card */}
            <Card className="border border-gray-100 shadow-sm bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 px-5 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                            <Filter className="h-4 w-4" />
                        </span>
                        <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                            {t("select_criteria")}
                        </CardTitle>
                    </div>
                </CardHeader>

                <CardContent className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        {/* Class */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">
                                {t("class")} <span className="text-rose-500">*</span>
                            </Label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="h-9 text-xs bg-white border-slate-200 focus:ring-indigo-500 rounded-lg cursor-pointer">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.id.toString()} className="cursor-pointer">
                                            {getLocalizedClassName(cls.name)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Section */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">
                                {t("section")} <span className="text-rose-500">*</span>
                            </Label>
                            <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                                <SelectTrigger className="h-9 text-xs bg-white border-slate-200 focus:ring-indigo-500 rounded-lg cursor-pointer">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map((sec) => (
                                        <SelectItem key={sec.id} value={sec.id.toString()} className="cursor-pointer">
                                            {getLocalizedSectionName(sec.name)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Attendance Date */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">
                                {t("attendance_date")} <span className="text-rose-500">*</span>
                            </Label>
                            <DatePicker
                                value={attendanceDate}
                                onChange={(val) => setAttendanceDate(val)}
                                placeholder="DD/MM/YYYY"
                                className="h-9 text-xs bg-white border-slate-200 focus-visible:ring-indigo-500 rounded-lg cursor-pointer shadow-xs"
                            />
                        </div>

                        {/* Search Button in 4th Column */}
                        <div>
                            <Button
                                onClick={handleSearch}
                                disabled={loading || !selectedClass || !selectedSection}
                                className="w-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white h-9 text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer border-0"
                            >
                                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                                {loading ? t("searching") : t("search")}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Attendance Metrics Ribbon */}
            {students.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <p className="text-[10px] font-bold uppercase text-slate-400">{t("total_enrolled")}</p>
                        <p className="text-base font-extrabold text-slate-800">{toLocaleNumber(stats.total, shortCode)}</p>
                    </div>
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 shadow-2xs">
                        <p className="text-[10px] font-bold uppercase text-emerald-600">{t("present")} (P)</p>
                        <p className="text-base font-extrabold text-emerald-700">{toLocaleNumber(stats.present, shortCode)}</p>
                    </div>
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 shadow-2xs">
                        <p className="text-[10px] font-bold uppercase text-amber-600">{t("late")} (L)</p>
                        <p className="text-base font-extrabold text-amber-700">{toLocaleNumber(stats.late, shortCode)}</p>
                    </div>
                    <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 shadow-2xs">
                        <p className="text-[10px] font-bold uppercase text-rose-600">{t("absent")} (A)</p>
                        <p className="text-base font-extrabold text-rose-700">{toLocaleNumber(stats.absent, shortCode)}</p>
                    </div>
                    <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-200 shadow-2xs">
                        <p className="text-[10px] font-bold uppercase text-sky-600">{t("half_day")} (HD)</p>
                        <p className="text-base font-extrabold text-sky-700">{toLocaleNumber(stats.halfDay, shortCode)}</p>
                    </div>
                    <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 shadow-2xs">
                        <p className="text-[10px] font-bold uppercase text-purple-600">{t("on_leave")} / {t("holiday")}</p>
                        <p className="text-base font-extrabold text-purple-700">{toLocaleNumber(stats.onLeave + stats.holiday, shortCode)}</p>
                    </div>
                </div>
            )}

            {/* Student Attendance List Card */}
            <Card className="border border-gray-100 shadow-sm bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden pt-0">
                {/* Header with Title & Save Action */}
                <CardHeader className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                            <Users className="h-4 w-4" />
                        </span>
                        <div>
                            <CardTitle className="text-sm font-bold text-slate-800">
                                {t("student_list")} ({toLocaleNumber(filteredStudents.length, shortCode)})
                            </CardTitle>
                            <p className="text-[11px] text-slate-500 font-mono">
                                {t("date")}: {formatDateDisplay(attendanceDate)}
                            </p>
                        </div>
                    </div>

                    {students.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        disabled={saving || students.length === 0}
                                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-5 h-8.5 text-xs font-bold rounded-lg shadow-sm active:scale-95 flex items-center gap-1.5 border-0 cursor-pointer"
                                    >
                                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                        {t("save_attendance")}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="max-w-md rounded-2xl bg-white">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                                            {t("confirm_attendance")}
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-xs text-slate-500 leading-relaxed">
                                            {t("confirm_attendance_desc", {
                                                count: toLocaleNumber(students.length, shortCode),
                                                date: formatDateDisplay(attendanceDate),
                                            })}
                                            <br /><br />
                                            {t("summary")}: <strong>{toLocaleNumber(stats.present, shortCode)} {t("present")}</strong>, <strong>{toLocaleNumber(stats.late, shortCode)} {t("late")}</strong>, <strong>{toLocaleNumber(stats.absent, shortCode)} {t("absent")}</strong>.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="gap-2 sm:gap-0">
                                        <AlertDialogCancel className="text-xs font-semibold rounded-lg cursor-pointer">
                                            {t("cancel")}
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleSave();
                                            }}
                                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                                        >
                                            {saving ? t("saving") : t("confirm_and_save")}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </CardHeader>

                {/* Bulk Actions & Quick Filter Toolbar */}
                {students.length > 0 && (
                    <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-600 mr-1">
                                {t("mark_all_as")}:
                            </span>
                            {ATTENDANCE_OPTIONS.map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => handleBulkAction(opt.id)}
                                    className={cn(
                                        "px-2.5 py-1 text-[11px] font-bold rounded-md border transition-all cursor-pointer shadow-2xs active:scale-95",
                                        bulkAttendance === opt.id
                                            ? opt.activeBg
                                            : opt.color
                                    )}
                                >
                                    {t(opt.key)}
                                </button>
                            ))}
                        </div>

                        {/* Search in List */}
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <Input
                                placeholder={t("search_by_name_roll_or_adm")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 h-8 text-xs bg-white border-slate-200 focus:ring-indigo-500 rounded-lg shadow-none"
                            />
                        </div>
                    </div>
                )}

                {/* Table Content */}
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                                <TableRow>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 w-12 text-center">#</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 min-w-[180px]">{t("student_profile")}</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700">{t("admission_no")}</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700">{t("roll_no")}</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 min-w-[280px]">{t("attendance_status")}</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 min-w-[110px]">{t("entry_time")}</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 min-w-[110px]">{t("exit_time")}</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 min-w-[160px]">{t("note_remarks")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-slate-100">
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-16">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500 mb-2" />
                                            <p className="text-xs font-medium text-slate-500">{t("loading_student_roster")}</p>
                                        </TableCell>
                                    </TableRow>
                                ) : students.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-16 text-slate-400">
                                            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                            <p className="text-xs font-bold text-slate-600">
                                                {hasSearched ? t("no_students_found_for_class_section") : t("select_class_section_and_date_to_start_attendance")}
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                                            <p className="text-xs font-bold text-slate-600">{t("no_students_match_search", { search: searchTerm })}</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStudents.map((student, idx) => (
                                        <TableRow
                                            key={student.id}
                                            className={cn(
                                                "hover:bg-indigo-50/20 transition-colors group",
                                                student.isOnLeave && "bg-amber-50/20"
                                            )}
                                        >
                                            {/* Index */}
                                            <TableCell className="py-3 px-4 text-center text-xs font-medium text-slate-400">
                                                {toLocaleNumber(idx + 1, shortCode)}
                                            </TableCell>

                                            {/* Student Profile */}
                                            <TableCell className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 border border-slate-200 shadow-2xs">
                                                        <AvatarImage src={getImageUrl(student.avatar)} />
                                                        <AvatarFallback className="text-[10px] font-bold bg-indigo-50 text-indigo-700">
                                                            {student.name.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors">
                                                            {student.name}
                                                        </p>
                                                        <span className="text-[10px] text-slate-400">
                                                            {student.reason === "Manual" ? t("manual") : student.reason || t("manual")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Admission No */}
                                            <TableCell className="py-3 px-4">
                                                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                                    {toLocaleNumber(student.admission_no, shortCode)}
                                                </span>
                                            </TableCell>

                                            {/* Roll No */}
                                            <TableCell className="py-3 px-4 text-xs font-semibold text-slate-600">
                                                {toLocaleNumber(student.roll_no, shortCode)}
                                            </TableCell>

                                            {/* Attendance Status Selection */}
                                            {student.isOnLeave ? (
                                                <TableCell colSpan={4} className="py-3 px-4">
                                                    <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-indigo-50 p-2 rounded-xl border border-amber-200/60">
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-2xs uppercase">
                                                            {t("on_approved_leave")}
                                                        </span>
                                                        <span className="text-xs font-semibold text-indigo-700">
                                                            {student.leaveDetails?.leaveType?.name || student.leaveDetails?.leave_type?.name || t("on_leave")}
                                                        </span>
                                                        {student.leaveDetails?.reason && (
                                                            <span className="text-[11px] text-slate-500 italic truncate max-w-[220px]">
                                                                ({student.leaveDetails.reason})
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            ) : (
                                                <>
                                                    <TableCell className="py-3 px-4">
                                                        <div className="flex items-center gap-1">
                                                            {ATTENDANCE_OPTIONS.map((opt) => {
                                                                const isSelected = student.attendance === opt.id;
                                                                return (
                                                                    <button
                                                                        key={opt.id}
                                                                        type="button"
                                                                        onClick={() => handleAttendanceChange(student.id, opt.id)}
                                                                        className={cn(
                                                                            "px-2 py-1 text-[10px] font-bold rounded-md border transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1",
                                                                            isSelected
                                                                                ? opt.activeBg
                                                                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                                                        )}
                                                                        title={t(opt.key)}
                                                                    >
                                                                        <span>{t(opt.key)}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </TableCell>

                                                    {/* Entry Time */}
                                                    <TableCell className="py-3 px-4">
                                                        <Input
                                                            type="time"
                                                            value={student.entry_time}
                                                            onChange={(e) => handleInputChange(student.id, 'entry_time', e.target.value)}
                                                            className="h-8 text-xs bg-white border-slate-200 focus:ring-indigo-500 rounded-lg w-28"
                                                        />
                                                    </TableCell>

                                                    {/* Exit Time */}
                                                    <TableCell className="py-3 px-4">
                                                        <Input
                                                            type="time"
                                                            value={student.exit_time}
                                                            onChange={(e) => handleInputChange(student.id, 'exit_time', e.target.value)}
                                                            className="h-8 text-xs bg-white border-slate-200 focus:ring-indigo-500 rounded-lg w-28"
                                                        />
                                                    </TableCell>

                                                    {/* Note */}
                                                    <TableCell className="py-3 px-4">
                                                        <Input
                                                            placeholder={t("note_remarks")}
                                                            value={student.note}
                                                            onChange={(e) => handleInputChange(student.id, 'note', e.target.value)}
                                                            className="h-8 text-xs bg-white border-slate-200 focus:ring-indigo-500 rounded-lg"
                                                        />
                                                    </TableCell>
                                                </>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
