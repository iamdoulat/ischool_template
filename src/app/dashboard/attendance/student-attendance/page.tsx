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
import { cn } from "@/lib/utils";
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
    Info,
    CheckCircle2,
    Search,
    Save,
    Loader2,
    ClipboardCheck,
    Filter,
    Users,
    Clock,
    AlertCircle,
    Calendar,
    Sparkles,
    Check,
    X,
    Sun,
    CalendarDays,
    Coffee
} from "lucide-react";
import CsvImportDialog from "@/components/attendance/CsvImportDialog";
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
    { id: "present", label: "Present", short: "P", color: "text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100", activeBg: "bg-emerald-600 text-white border-emerald-600" },
    { id: "late", label: "Late", short: "L", color: "text-amber-700 bg-amber-50 border-amber-300 hover:bg-amber-100", activeBg: "bg-amber-500 text-white border-amber-500" },
    { id: "absent", label: "Absent", short: "A", color: "text-rose-700 bg-rose-50 border-rose-300 hover:bg-rose-100", activeBg: "bg-rose-600 text-white border-rose-600" },
    { id: "half_day", label: "Half Day", short: "HD", color: "text-sky-700 bg-sky-50 border-sky-300 hover:bg-sky-100", activeBg: "bg-sky-600 text-white border-sky-600" },
    { id: "holiday", label: "Holiday", short: "H", color: "text-purple-700 bg-purple-50 border-purple-300 hover:bg-purple-100", activeBg: "bg-purple-600 text-white border-purple-600" },
] as const;

export default function StudentAttendancePage() {
    const { settings } = useSettings();
    const { t } = useTranslation();
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

    useEffect(() => {
        fetchClasses();
    }, []);

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
                        school_class_id: selectedClass,
                        section_id: selectedSection,
                        attendance_date: attendanceDate,
                    },
                });
                
                let payload = attendanceRes.data;
                if (payload?.status === "Success" || payload?.success) {
                    payload = payload.data;
                }
                if (payload?.data && Array.isArray(payload.data)) {
                    payload = payload.data;
                }
                
                if (Array.isArray(payload) && payload.length > 0) {
                    studentsData = payload;
                }
            } catch (err) {
                console.warn("Attendance endpoint fallback:", err);
            }

            // Step 2: Fallback to students list
            if (studentsData.length === 0) {
                try {
                    const studentsRes = await api.get("/students", {
                        params: {
                            school_class_id: selectedClass,
                            section_id: selectedSection,
                            limit: 200,
                        },
                    });
                    
                    let payload = studentsRes.data;
                    if (payload?.status === "Success" || payload?.success) {
                        payload = payload.data;
                    }
                    if (payload?.data && Array.isArray(payload.data)) {
                        payload = payload.data;
                    }
                    
                    if (Array.isArray(payload) && payload.length > 0) {
                        studentsData = payload;
                    }
                } catch (err) {
                    console.error("Students endpoint error:", err);
                }
            }

            if (studentsData.length > 0) {
                const mappedStudents = studentsData.map((student) => {
                    const attendance = student.attendances?.[0] || student.student_attendances?.[0];
                    const hasLeaveRecord = student.leave_requests && student.leave_requests.length > 0;
                    const hasApprovedLeave = attendance?.attendance === "on_leave" || hasLeaveRecord;
                    return {
                        id: student.id,
                        student_id: student.id,
                        admission_no: student.admission_no || "-",
                        roll_no: student.roll_no || "-",
                        name: `${student.name || ""}${student.last_name ? " " + student.last_name : ""}`.trim(),
                        avatar: student.avatar || "",
                        attendance: attendance?.attendance || (hasApprovedLeave ? "on_leave" : "present"),
                        reason: attendance?.reason || (hasApprovedLeave ? "Leave System" : "Manual"),
                        entry_time: attendance?.entry_time || "",
                        exit_time: attendance?.exit_time || "",
                        note: attendance?.note || "",
                        isOnLeave: hasApprovedLeave,
                        leaveDetails: hasApprovedLeave ? student.leave_requests?.[0] : null,
                    };
                });
                setStudents(mappedStudents);
                setBulkAttendance("");
                toast.success(`Loaded ${mappedStudents.length} student records`);
            } else {
                toast.info(t("no_students_found_for_class_section") || "No students found for this class and section");
            }
        } catch (error) {
            console.error("Error searching students:", error);
            toast.error(t("failed_to_load_students") || "Failed to load student roster");
        } finally {
            setLoading(false);
        }
    };

    const getAutoEntryTime = () => {
        let entryTime = "";
        if (settings?.student_attendance_settings) {
            const classSettings = (settings.student_attendance_settings as unknown as ClassAttendanceSetting[]).find(
                (c) => String(c.class_id) === selectedClass
            );
            if (classSettings) {
                const sectionSettings = classSettings.sections?.find(
                    (s) => String(s.section_id) === selectedSection
                );
                if (sectionSettings) {
                    const presentSetting = sectionSettings.settings?.find(
                        (s) => s.type?.toLowerCase().startsWith("present")
                    );
                    if (presentSetting) {
                        entryTime = presentSetting.from ? presentSetting.from.substring(0, 5) : "";
                    }
                }
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
        let autoEntry = value === "present" ? getAutoEntryTime() : "";

        setStudents(prev => prev.map(s => {
            if (s.isOnLeave) return s;
            const updates: Partial<StudentAttendanceRecord> = { attendance: value as StudentAttendanceRecord["attendance"] };
            if (value === "present" && autoEntry) {
                updates.entry_time = autoEntry;
            }
            return { ...s, ...updates };
        }));

        toast.info(`Marked all students as ${value.toUpperCase()}`);
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
        <div className="space-y-6 max-w-7xl mx-auto px-4 py-4 sm:py-6 font-sans">
            {/* Master Header Banner */}
            <div className="rounded-2xl border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] via-[#F8F9FE] to-[#EFF0FD]">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
                            <ClipboardCheck className="h-6 w-6" />
                        </span>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-800 leading-none flex items-center gap-2">
                                Student Daily Attendance Registry
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                    Roll-Call System
                                </span>
                            </h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                Record and update section-wise daily attendance records, arrival timestamps, and leave verifications.
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
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 px-5 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                            <Filter className="h-4 w-4" />
                        </span>
                        <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                            {t("select_criteria") || "Select Attendance Criteria"}
                        </CardTitle>
                    </div>
                </CardHeader>

                <CardContent className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        {/* Class */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">
                                {t("class") || "Class"} <span className="text-rose-500">*</span>
                            </Label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="h-9 text-xs bg-white border-slate-200 focus:ring-indigo-500 rounded-lg">
                                    <SelectValue placeholder={t("select") || "Select Class"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.id.toString()}>
                                            {cls.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Section */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">
                                {t("section") || "Section"} <span className="text-rose-500">*</span>
                            </Label>
                            <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                                <SelectTrigger className="h-9 text-xs bg-white border-slate-200 focus:ring-indigo-500 rounded-lg">
                                    <SelectValue placeholder={t("select") || "Select Section"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map((sec) => (
                                        <SelectItem key={sec.id} value={sec.id.toString()}>
                                            {sec.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Attendance Date */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">
                                {t("attendance_date") || "Attendance Date"} <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                type="date"
                                value={attendanceDate}
                                onChange={(e) => setAttendanceDate(e.target.value)}
                                className="h-9 text-xs bg-white border-slate-200 focus:ring-indigo-500 rounded-lg"
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
                                {t("search") || "Search Students"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Attendance Metrics Ribbon */}
            {students.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Total Enrolled</p>
                        <p className="text-base font-extrabold text-slate-800">{stats.total}</p>
                    </div>
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 shadow-2xs">
                        <p className="text-[10px] font-bold uppercase text-emerald-600">Present (P)</p>
                        <p className="text-base font-extrabold text-emerald-700">{stats.present}</p>
                    </div>
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 shadow-2xs">
                        <p className="text-[10px] font-bold uppercase text-amber-600">Late (L)</p>
                        <p className="text-base font-extrabold text-amber-700">{stats.late}</p>
                    </div>
                    <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 shadow-2xs">
                        <p className="text-[10px] font-bold uppercase text-rose-600">Absent (A)</p>
                        <p className="text-base font-extrabold text-rose-700">{stats.absent}</p>
                    </div>
                    <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-200 shadow-2xs">
                        <p className="text-[10px] font-bold uppercase text-sky-600">Half Day (HD)</p>
                        <p className="text-base font-extrabold text-sky-700">{stats.halfDay}</p>
                    </div>
                    <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 shadow-2xs">
                        <p className="text-[10px] font-bold uppercase text-purple-600">On Leave / Holiday</p>
                        <p className="text-base font-extrabold text-purple-700">{stats.onLeave + stats.holiday}</p>
                    </div>
                </div>
            )}

            {/* Student Attendance List Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden pt-0">
                {/* Header with Title & Save Action */}
                <CardHeader className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                            <Users className="h-4 w-4" />
                        </span>
                        <div>
                            <CardTitle className="text-sm font-bold text-slate-800">
                                {t("student_list") || "Student Roll-Call List"} ({filteredStudents.length})
                            </CardTitle>
                            <p className="text-[11px] text-slate-500 font-mono">
                                Date: {attendanceDate}
                            </p>
                        </div>
                    </div>

                    {students.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        disabled={saving || students.length === 0}
                                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-5 h-8.5 text-xs font-bold rounded-lg shadow-sm active:scale-95 flex items-center gap-1.5 border-0"
                                    >
                                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                        {t("save_attendance") || "Save Attendance"}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="max-w-md rounded-2xl bg-white">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                                            {t("confirm_attendance") || "Confirm Daily Attendance"}
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-xs text-slate-500 leading-relaxed">
                                            You are about to save attendance records for <strong className="text-indigo-600">{students.length} students</strong> on <strong className="text-slate-800">{attendanceDate}</strong>.
                                            <br /><br />
                                            Summary: <strong>{stats.present} Present</strong>, <strong>{stats.late} Late</strong>, <strong>{stats.absent} Absent</strong>.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="gap-2 sm:gap-0">
                                        <AlertDialogCancel className="text-xs font-semibold rounded-lg">
                                            {t("cancel") || "Cancel"}
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleSave();
                                            }}
                                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-bold rounded-lg shadow-sm"
                                        >
                                            {saving ? "Saving..." : "Confirm & Save"}
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
                                Mark All As:
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
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Search in List */}
                        <div className="relative w-full sm:w-56">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <Input
                                placeholder="Search by name, roll, or adm..."
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
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 min-w-[180px]">Student Profile</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700">Admission No</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700">Roll No</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 min-w-[280px]">Attendance Status</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 min-w-[110px]">Entry Time</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 min-w-[110px]">Exit Time</TableHead>
                                    <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 min-w-[160px]">Note / Remarks</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-slate-100">
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-16">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500 mb-2" />
                                            <p className="text-xs font-medium text-slate-500">Loading student roster...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : students.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-16 text-slate-400">
                                            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                            <p className="text-xs font-bold text-slate-600">
                                                {hasSearched ? "No students found for this class and section" : "Select Class, Section, and Date to start attendance"}
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                                            <p className="text-xs font-bold text-slate-600">No students match &quot;{searchTerm}&quot;</p>
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
                                                {idx + 1}
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
                                                            Source: {student.reason || "Manual"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Admission No */}
                                            <TableCell className="py-3 px-4">
                                                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                                    {student.admission_no}
                                                </span>
                                            </TableCell>

                                            {/* Roll No */}
                                            <TableCell className="py-3 px-4 text-xs font-semibold text-slate-600">
                                                {student.roll_no}
                                            </TableCell>

                                            {/* Attendance Status Selection */}
                                            {student.isOnLeave ? (
                                                <TableCell colSpan={4} className="py-3 px-4">
                                                    <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-indigo-50 p-2 rounded-xl border border-amber-200/60">
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-2xs uppercase">
                                                            On Approved Leave
                                                        </span>
                                                        <span className="text-xs font-semibold text-indigo-700">
                                                            {student.leaveDetails?.leaveType?.name || student.leaveDetails?.leave_type?.name || "Official Leave"}
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
                                                                        title={opt.label}
                                                                    >
                                                                        <span>{opt.label}</span>
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
                                                            placeholder={t("note_placeholder") || "Remarks..."}
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
