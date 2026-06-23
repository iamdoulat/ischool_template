"use client";

import { useState, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { Info, CheckCircle2, Search, Save, Loader2, UserCheck, ClipboardCheck, Filter } from "lucide-react";
import CsvImportDialog from "@/components/attendance/CsvImportDialog";
import { useSettings } from "@/components/providers/settings-provider";
import { useTranslation } from "@/hooks/use-translation";

interface StudentAttendanceRecord {
    id: number;
    student_id: number;
    admission_no: string;
    roll_no: string;
    name: string;
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
    { id: "present", label: "Present" },
    { id: "late", label: "Late" },
    { id: "absent", label: "Absent" },
    { id: "holiday", label: "Holiday" },
    { id: "half_day", label: "Half Day" },
];

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

export default function StudentAttendancePage() {
    const { settings } = useSettings();
    const { t } = useTranslation();
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState<StudentAttendanceRecord[]>([]);
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
            setSelectedSection("");
        } else {
            setSections([]);
            setSelectedSection("");
        }
    }, [selectedClass, classes]);

    const fetchClasses = async () => {
        try {
            const response = await api.get("/academics/classes?no_paginate=true");
            if (response.data.success) {
                setClasses(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching classes:", error);
            toast.error(t("failed_to_load_classes"));
        }
    };

    const handleSearch = async () => {
        if (!selectedClass || !selectedSection || !attendanceDate) {
            toast.error(t("please_select_all_criteria"));
            return;
        }

        setLoading(true);
        setHasSearched(true);
        setStudents([]);

        try {
            // Step 1: Try to get students with existing attendance data
            let studentsData: RawStudent[] = [];

            try {
                const attendanceRes = await api.get("/attendance/student", {
                    params: {
                        school_class_id: selectedClass,
                        section_id: selectedSection,
                        attendance_date: attendanceDate,
                    },
                });
                if (attendanceRes.data.success && attendanceRes.data.data?.length > 0) {
                    studentsData = attendanceRes.data.data;
                }
            } catch (err) {
                console.warn("Attendance endpoint failed, falling back to students endpoint:", err);
            }

            // Step 2: If no students found via attendance endpoint, fetch from students list
            if (studentsData.length === 0) {
                try {
                    const studentsRes = await api.get("/students", {
                        params: {
                            school_class_id: selectedClass,
                            section_id: selectedSection,
                            limit: 200,
                        },
                    });
                    if (studentsRes.data.success) {
                        // Handle paginated response
                        const rawData = studentsRes.data.data?.data || studentsRes.data.data;
                        if (Array.isArray(rawData)) {
                            studentsData = rawData;
                        }
                    }
                } catch (err) {
                    console.error("Students endpoint also failed:", err);
                }
            }

            if (studentsData.length > 0) {
                const mappedStudents = studentsData.map((student) => {
                    const attendance = student.attendances?.[0] || student.student_attendances?.[0];
                    const hasApprovedLeave =
                        attendance?.attendance === "on_leave" ||
                        (student.leave_requests && student.leave_requests.length > 0) ||
                        (student.leave_requests && student.leave_requests.length > 0);
                    return {
                        id: student.id,
                        student_id: student.id,
                        admission_no: student.admission_no || "-",
                        roll_no: student.roll_no || "-",
                        name: `${student.name || ""}${student.last_name ? " " + student.last_name : ""}`.trim(),
                        attendance: attendance?.attendance || (hasApprovedLeave ? "on_leave" : "present"),
                        reason: attendance?.reason || (hasApprovedLeave ? "Leave System" : "Manual"),
                        entry_time: attendance?.entry_time || "",
                        exit_time: attendance?.exit_time || "",
                        note: attendance?.note || "",
                        isOnLeave: hasApprovedLeave,
                        leaveDetails: hasApprovedLeave ? (student.leave_requests?.[0] || student.leave_requests?.[0]) : null,
                    };
                });
                setStudents(mappedStudents);
                setBulkAttendance("");
                toast.success(t("found_students", { count: mappedStudents.length }));
            } else {
                toast.info(t("no_students_found_for_class_section"));
            }
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            console.error("Error searching students:", error);
            toast.error(err?.response?.data?.message || t("failed_to_load_students"));
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

        let autoEntry = "";

        if (value === "present") {
            autoEntry = getAutoEntryTime();
        }

        setStudents(prev => prev.map(s => {
            if (s.isOnLeave) return s;
            const updates: Partial<StudentAttendanceRecord> = { attendance: value as StudentAttendanceRecord["attendance"] };
            if (value === "present" && autoEntry) {
                updates.entry_time = autoEntry;
            }
            return { ...s, ...updates };
        }));

        toast.info(t("set_all_students_to", { status: t(value) }));
    };

    const handleInputChange = (studentId: number, field: keyof StudentAttendanceRecord, value: string) => {
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, [field]: value } : s));
    };

    const handleSave = async () => {
        if (students.length === 0) {
            toast.error(t("no_attendance_data_to_save"));
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

            if (response.data.success) {
                toast.success(t("success"), {
                    description: t("student_attendance_updated_successfully"),
                    icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
                });
                setIsConfirmOpen(false);
            }
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            console.error("Error saving attendance:", error);
            toast.error(err?.response?.data?.message || t("failed_to_save_attendance"));
        } finally {
            setSaving(false);
        }
    };

    const handleCsvImport = (records: StudentAttendanceRecord[]) => {
        setStudents(records);
        setHasSearched(true);
        setBulkAttendance("");
    };

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            {/* Select Criteria */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("select_criteria")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("filter_students_by_class_section_date")}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                {t("class")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="h-8 text-[11px] border-gray-200 shadow-none rounded">
                                    <SelectValue placeholder={t("select")} />
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

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                {t("section")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                                <SelectTrigger className="h-8 text-[11px] border-gray-200 shadow-none rounded">
                                    <SelectValue placeholder={t("select")} />
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

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                {t("attendance_date")} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="date"
                                value={attendanceDate}
                                onChange={(e) => setAttendanceDate(e.target.value)}
                                className="h-8 text-[11px] border-gray-200 focus:ring-indigo-500 shadow-none rounded"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end mt-4">
                        <Button
                            onClick={handleSearch}
                            disabled={loading}
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-8 h-9 text-xs font-bold uppercase transition-all rounded-full shadow-lg active:scale-95 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            {t("search")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Student List - shown after search (or while loading) */}
            {hasSearched && (loading || students.length > 0) && (
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <ClipboardCheck className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("student_list")}</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{students.length} {students.length === 1 ? t("student") : t("students")}</p>
                            </div>
                        </div>
                        <CsvImportDialog
                            onImport={handleCsvImport}
                            attendanceDate={attendanceDate}
                            selectedClass={selectedClass}
                            selectedSection={selectedSection}
                        />
                    </CardHeader>

                    <CardContent className="p-5 space-y-4">
                        {/* Bulk Actions & Save Button Row */}
                        <div className="flex items-center justify-between flex-wrap gap-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-4 flex-wrap">
                                <span className="text-[11px] font-semibold text-gray-500">
                                    {t("set_attendance_for_all_students_as")}
                                </span>
                                <RadioGroup
                                    value={bulkAttendance}
                                    onValueChange={handleBulkAction}
                                    className="flex items-center gap-4"
                                >
                                    {ATTENDANCE_OPTIONS.map((opt) => (
                                        <div key={opt.id} className="flex items-center gap-1.5">
                                            <RadioGroupItem
                                                value={opt.id}
                                                id={`bulk-${opt.id}`}
                                                className={cn(
                                                    "h-4 w-4 border-gray-300",
                                                    bulkAttendance === opt.id && "text-indigo-600 border-indigo-600"
                                                )}
                                            />
                                            <label
                                                htmlFor={`bulk-${opt.id}`}
                                                className={cn(
                                                    "text-[11px] font-medium cursor-pointer",
                                                    "text-gray-600"
                                                )}
                                            >
                                                {t(opt.id)}
                                            </label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        disabled={saving || students.length === 0}
                                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-8 h-9 text-xs font-bold uppercase transition-all rounded-full shadow-lg active:scale-95 flex items-center gap-2"
                                    >
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        {t("save_attendance")}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="max-w-[400px] rounded-lg border-none shadow-2xl">
                                    <AlertDialogHeader>
                                        <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                                            <Info className="h-6 w-6 text-indigo-600" />
                                        </div>
                                        <AlertDialogTitle className="text-lg font-bold text-gray-800">{t("confirm_attendance")}</AlertDialogTitle>
                                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed">
                                            {t("about_to_save_attendance_for")} <span className="font-bold text-indigo-600">{students.length}</span> {t("students_for")} <span className="font-bold text-gray-700">{attendanceDate}</span>.
                                            <br /><br />
                                            {t("are_you_sure_proceed_with_records")}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="mt-6 gap-2">
                                        <AlertDialogCancel className="rounded-full border-gray-100 text-xs font-bold uppercase h-10 px-6">
                                            {t("cancel")}
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleSave();
                                            }}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold uppercase h-10 px-8 transition-all active:scale-95"
                                        >
                                            {t("confirm_and_save")}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>

                        {/* Attendance Table */}
                        <div className="rounded-lg border border-gray-100 overflow-x-auto shadow-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent text-[10px] font-bold uppercase text-gray-500 bg-gray-50/50">
                                        <TableHead className="py-3 px-4 w-10 text-center">#</TableHead>
                                        <TableHead className="py-3 px-4">{t("admission_no")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("roll_number")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("name")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("attendance")}</TableHead>
                                        <TableHead className="py-3 px-4 text-center">{t("date")}</TableHead>
                                        <TableHead className="py-3 px-4 text-center">{t("source")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("entry_time")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("exit_time")}</TableHead>
                                        <TableHead className="py-3 px-4">{t("note")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={10} />
                                    ) : students.length === 0 ? (
                                        <tr><td colSpan={10} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data_found")}</td></tr>
                                    ) : (
                                        students.map((student, idx) => (
                                            <TableRow
                                                key={student.id}
                                                className={cn(
                                                    "text-[12px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors bg-white"
                                                )}
                                            >
                                                <TableCell className="py-3 px-4 text-center text-gray-400 font-medium">
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-indigo-600 font-bold">
                                                    {student.admission_no}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-600 font-medium">
                                                    {student.roll_no}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-semibold">
                                                    {student.name}
                                                </TableCell>
                                                {student.isOnLeave ? (
                                                    <TableCell colSpan={6} className="py-3 px-4 bg-gradient-to-r from-orange-50/30 to-indigo-50/30 border-y border-gray-100">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[10px] font-black bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md uppercase tracking-wider animate-pulse">
                                                                    {t("on_leave")}
                                                                </span>
                                                                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50/50 border border-indigo-100/50 px-3 py-1 rounded-full uppercase tracking-tight">
                                                                    {student.leaveDetails?.leaveType?.name || student.leaveDetails?.leave_type?.name || t("approved_leave")}
                                                                </span>
                                                                {student.leaveDetails?.reason && (
                                                                    <span className="text-[11px] font-medium text-gray-500 italic max-w-[200px] truncate" title={student.leaveDetails.reason}>
                                                                        &quot;{student.leaveDetails.reason}&quot;
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white border border-gray-100 px-3 py-1 rounded-full shadow-sm">
                                                                {t("leave_range")}: {student.leaveDetails?.leave_from ? new Date(student.leaveDetails.leave_from).toLocaleDateString() : ""} - {student.leaveDetails?.leave_to ? new Date(student.leaveDetails.leave_to).toLocaleDateString() : ""}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                ) : (
                                                    <>
                                                        <TableCell className="py-3 px-4">
                                                            <RadioGroup
                                                                value={student.attendance}
                                                                onValueChange={(val) => handleAttendanceChange(student.id, val as "present" | "late" | "absent" | "holiday" | "half_day")}
                                                                className="flex flex-col gap-1"
                                                            >
                                                                {ATTENDANCE_OPTIONS.map((opt) => (
                                                                    <div key={opt.id} className="flex items-center gap-1.5">
                                                                        <RadioGroupItem
                                                                            value={opt.id}
                                                                            id={`${opt.id}-${student.id}`}
                                                                            className={cn(
                                                                                "h-3.5 w-3.5 border-gray-300",
                                                                                student.attendance === opt.id && "text-indigo-600 border-indigo-600"
                                                                            )}
                                                                        />
                                                                        <label
                                                                            htmlFor={`${opt.id}-${student.id}`}
                                                                            className={cn(
                                                                                "text-[11px] font-medium cursor-pointer leading-none",
                                                                                "text-gray-600"
                                                                            )}
                                                                        >
                                                                            {opt.label}
                                                                        </label>
                                                                    </div>
                                                                ))}
                                                            </RadioGroup>
                                                        </TableCell>
                                                        <TableCell className="py-3 px-4 text-center text-gray-500 font-medium text-[11px]">
                                                            {attendanceDate}
                                                        </TableCell>
                                                        <TableCell className="py-3 px-4 text-center text-gray-400 font-medium text-[11px]">
                                                            {student.reason || "Manual"}
                                                        </TableCell>
                                                        <TableCell className="py-3 px-4">
                                                            <Input
                                                                type="time"
                                                                value={student.entry_time}
                                                                onChange={(e) => handleInputChange(student.id, 'entry_time', e.target.value)}
                                                                className="h-8 text-[11px] border-gray-200 shadow-none rounded w-[145px] focus:ring-2 focus:ring-indigo-500/20"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="py-3 px-4">
                                                            <Input
                                                                type="time"
                                                                value={student.exit_time}
                                                                onChange={(e) => handleInputChange(student.id, 'exit_time', e.target.value)}
                                                                className="h-8 text-[11px] border-gray-200 shadow-none rounded w-[145px] focus:ring-2 focus:ring-indigo-500/20"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="py-3 px-4">
                                                            <Input
                                                                placeholder={t("note_placeholder")}
                                                                value={student.note}
                                                                onChange={(e) => handleInputChange(student.id, 'note', e.target.value)}
                                                                className="h-8 text-[11px] border-gray-200 shadow-none rounded w-[100px] focus:ring-2 focus:ring-indigo-500/20"
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
            )}

            {/* Empty State */}
            {(!hasSearched || (hasSearched && students.length === 0 && !loading)) && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center justify-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-200 border border-gray-100">
                        <UserCheck className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{t("no_records_found")}</p>
                        <p className="text-[11px] text-gray-400 max-w-[220px] mx-auto leading-relaxed">
                            {t("select_class_section_date_to_fetch")}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
