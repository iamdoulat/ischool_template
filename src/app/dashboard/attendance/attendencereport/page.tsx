"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Search, Loader2, Filter, BarChart3, BookOpen, Copy, FileSpreadsheet,
    FileBox, FileText, Printer, ChevronLeft, ChevronRight, Users, Clock
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { DatePicker } from "@/components/ui/date-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useImageUrl } from "@/lib/image-url";
import { Skeleton } from "@/components/ui/skeleton";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { cn, toLocaleNumber } from "@/lib/utils";

interface Student {
    id: number;
    name: string;
    admission_no: string;
    roll_no: string;
    avatar?: string;
    attendances?: {
        attendance: string;
        note?: string;
        entry_time?: string | null;
        exit_time?: string | null;
    }[];
    student_attendances?: {
        attendance: string;
        note?: string;
        entry_time?: string | null;
        exit_time?: string | null;
    }[];
}

interface SchoolClass {
    id: number;
    name: string;
    sections?: { id: number; name: string }[];
}

function TableSkeleton({ cols }: { cols: number }) {
    return (
        <>
            {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3 px-4">
                            <Skeleton className="h-4 rounded" style={{ width: `${55 + ((i * 3 + j * 7) % 35)}%` }} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function AttendanceReportPage() {
    const { t, language } = useTranslation();
    const shortCode = language?.short_code || "en";
    const getImageUrl = useImageUrl();

    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [sections, setSections] = useState<{ id: number; name: string }[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState("50");

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

    const formatDateDisplay = (dateStr?: string) => {
        if (!dateStr) return "—";
        const cleanStr = dateStr.substring(0, 10);
        const parts = cleanStr.split("-");
        if (parts.length === 3) {
            const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
            return toLocaleNumber(formatted, shortCode);
        }
        return toLocaleNumber(cleanStr, shortCode);
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
            }
        };

        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            const cls = classes.find(c => c.id.toString() === selectedClass);
            setSections(cls?.sections || []);
            if (cls?.sections && cls.sections.length > 0) {
                setSelectedSection(cls.sections[0].id.toString());
            } else {
                setSelectedSection("");
            }
        } else {
            setSections([]);
            setSelectedSection("");
        }
    }, [selectedClass, classes]);

    const handleSearch = useCallback(async () => {
        if (!selectedClass || !selectedSection || !attendanceDate) {
            toast.error(t("please_select_class_section_date") || "Please select Class, Section, and Date");
            return;
        }

        setLoading(true);
        setHasSearched(true);
        try {
            const response = await api.get("/attendance/student", {
                params: {
                    school_class_id: selectedClass,
                    section_id: selectedSection,
                    attendance_date: attendanceDate,
                },
            });

            let payload = response.data;
            if (payload?.status === "Success" || payload?.success) {
                payload = payload.data;
            }
            if (payload?.data && Array.isArray(payload.data)) {
                payload = payload.data;
            }

            if (Array.isArray(payload)) {
                setStudents(payload);
                setCurrentPage(1);
                if (payload.length === 0) {
                    toast.info(t("no_students_found_for_class_section") || "No records found for selected criteria");
                }
            } else {
                setStudents([]);
            }
        } catch (error) {
            console.error("Error searching attendance:", error);
            toast.error(t("failed_to_load_attendance_report") || "Failed to load report data");
        } finally {
            setLoading(false);
        }
    }, [selectedClass, selectedSection, attendanceDate, t]);

    const getAttendanceStatus = (student: Student) => {
        const record = student.attendances?.[0] || student.student_attendances?.[0];
        if (!record || !record.attendance) return "not_marked";
        return record.attendance;
    };

    const getAttendanceNote = (student: Student) => {
        const record = student.attendances?.[0] || student.student_attendances?.[0];
        if (!record || !record.note) return "—";
        return record.note;
    };

    const getEntryTime = (student: Student) => {
        const record = student.attendances?.[0] || student.student_attendances?.[0];
        if (!record || !record.entry_time) return "—";
        return toLocaleNumber(record.entry_time.substring(0, 5), shortCode);
    };

    const getExitTime = (student: Student) => {
        const record = student.attendances?.[0] || student.student_attendances?.[0];
        if (!record || !record.exit_time) return "—";
        return toLocaleNumber(record.exit_time.substring(0, 5), shortCode);
    };

    const getStatusBadge = (status: string) => {
        const s = (status || "").toLowerCase();
        switch (s) {
            case "present":
                return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">{t("present")}</span>;
            case "absent":
                return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">{t("absent")}</span>;
            case "late":
                return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">{t("late")}</span>;
            case "half_day":
                return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">{t("half_day")}</span>;
            case "holiday":
                return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">{t("holiday")}</span>;
            case "on_leave":
                return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">{t("on_leave")}</span>;
            default:
                return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">{t("not_marked")}</span>;
        }
    };

    // Filter & Paginate
    const filteredStudents = useMemo(() => {
        return students.filter((s) => {
            const status = getAttendanceStatus(s).toLowerCase();
            if (statusFilter !== "all" && status !== statusFilter.toLowerCase()) {
                return false;
            }
            if (!searchTerm) return true;
            const lower = searchTerm.toLowerCase();
            return (
                (s.name || "").toLowerCase().includes(lower) ||
                (s.admission_no || "").toLowerCase().includes(lower) ||
                (s.roll_no || "").toLowerCase().includes(lower)
            );
        });
    }, [students, searchTerm, statusFilter]);

    // Statistics
    const stats = useMemo(() => {
        const total = students.length;
        const present = students.filter(s => getAttendanceStatus(s).toLowerCase() === "present").length;
        const late = students.filter(s => getAttendanceStatus(s).toLowerCase() === "late").length;
        const absent = students.filter(s => getAttendanceStatus(s).toLowerCase() === "absent").length;
        const halfDay = students.filter(s => getAttendanceStatus(s).toLowerCase() === "half_day").length;
        const holiday = students.filter(s => getAttendanceStatus(s).toLowerCase() === "holiday").length;
        const onLeave = students.filter(s => getAttendanceStatus(s).toLowerCase() === "on_leave").length;
        const rate = total > 0 ? Math.round(((present + late + halfDay * 0.5) / total) * 100) : 0;
        return { total, present, late, absent, halfDay, holiday, onLeave, rate };
    }, [students]);

    const sizeNum = parseInt(rowsPerPage, 10) || 50;
    const totalEntries = filteredStudents.length;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;
    const paginatedStudents = filteredStudents.slice(startIndex, startIndex + sizeNum);

    // Export Helpers
    const exportToCopy = () => {
        if (filteredStudents.length === 0) { toast.error(t("no_data_to_copy") || "No data to copy"); return; }
        const text = [
            "Admission No\tRoll No\tStudent Name\tAttendance\tEntry Time\tExit Time\tNote",
            ...filteredStudents.map(s =>
                `${s.admission_no}\t${s.roll_no || '-'}\t${s.name}\t${getAttendanceStatus(s)}\t${getEntryTime(s)}\t${getExitTime(s)}\t${getAttendanceNote(s)}`
            )
        ].join("\n");
        navigator.clipboard.writeText(text);
        toast.success(t("copied_to_clipboard") || "Attendance report copied to clipboard");
    };

    const exportToExcel = (isCsv = false) => {
        if (filteredStudents.length === 0) { toast.error(t("no_records_to_export") || "No records to export"); return; }
        const mapped = filteredStudents.map(s => ({
            "Admission No": s.admission_no,
            "Roll No": s.roll_no || "-",
            "Student Name": s.name,
            "Attendance": getAttendanceStatus(s),
            "Entry Time": getEntryTime(s),
            "Exit Time": getExitTime(s),
            "Note": getAttendanceNote(s),
        }));
        const ws = XLSX.utils.json_to_sheet(mapped);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");
        if (isCsv) { XLSX.writeFile(wb, `attendance_report_${attendanceDate}.csv`, { bookType: "csv" }); toast.success(t("csv_downloaded") || "CSV downloaded"); }
        else { XLSX.writeFile(wb, `attendance_report_${attendanceDate}.xlsx`); toast.success(t("excel_file_downloaded") || "Excel report downloaded"); }
    };

    const exportToPDF = () => {
        if (filteredStudents.length === 0) { toast.error(t("no_records_to_export") || "No records to export"); return; }
        const doc = new jsPDF("landscape");
        const head = [["Adm No", "Roll No", "Student Name", "Attendance", "Entry Time", "Exit Time", "Note"]];
        const body = filteredStudents.map(s => [
            s.admission_no,
            s.roll_no || "-",
            s.name,
            getAttendanceStatus(s),
            getEntryTime(s),
            getExitTime(s),
            getAttendanceNote(s),
        ]);
        autoTable(doc, { head, body, theme: "grid" });
        doc.save(`attendance_report_${attendanceDate}.pdf`);
        toast.success(t("pdf_downloaded") || "PDF report downloaded");
    };

    return (
        <div className="w-full space-y-6 p-4 lg:p-6 font-sans bg-gray-50/10 min-h-screen">
            {/* Master Header Banner */}
            <div className="rounded-xl border border-gray-100 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] via-[#F8F9FE] to-[#EFF0FD]">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
                            <BarChart3 className="h-6 w-6" />
                        </span>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-800 leading-none flex items-center gap-2">
                                {t("student_attendance_report")}
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                    {t("analytics_auditing")}
                                </span>
                            </h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {t("attendance_report_subtitle")}
                            </p>
                        </div>
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
                                    {classes.map(cls => (
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
                                    {sections.map(sec => (
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

                        {/* Generate Report Button */}
                        <div>
                            <Button
                                onClick={handleSearch}
                                disabled={loading || !selectedClass || !selectedSection}
                                className="w-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white h-9 text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer border-0"
                            >
                                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                                {loading ? t("generating") : t("generate_report")}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Metrics Ribbon */}
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
                        <p className="text-[10px] font-bold uppercase text-purple-600">{t("on_leave_or_holiday")}</p>
                        <p className="text-base font-extrabold text-purple-700">{toLocaleNumber(stats.onLeave + stats.holiday, shortCode)}</p>
                    </div>
                </div>
            )}

            {/* Attendance Report Table Card */}
            {hasSearched && (
                <Card className="border border-gray-100 shadow-sm bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden pt-0 animate-in fade-in duration-300">
                    {/* Header & Filter Toolbar */}
                    <CardHeader className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                <Users className="h-4 w-4" />
                            </span>
                            <div>
                                <CardTitle className="text-sm font-bold text-slate-800">
                                    {t("student_attendance_report")} ({toLocaleNumber(filteredStudents.length, shortCode)})
                                </CardTitle>
                                <p className="text-[11px] text-slate-500 font-mono">
                                    {t("date")}: {formatDateDisplay(attendanceDate)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Status Filter */}
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="h-8 w-32 text-xs bg-white border-slate-200 cursor-pointer">
                                    <SelectValue placeholder={t("all_status")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="cursor-pointer">{t("all_status")}</SelectItem>
                                    <SelectItem value="present" className="cursor-pointer">{t("present_only")}</SelectItem>
                                    <SelectItem value="late" className="cursor-pointer">{t("late")}</SelectItem>
                                    <SelectItem value="absent" className="cursor-pointer">{t("absent")}</SelectItem>
                                    <SelectItem value="half_day" className="cursor-pointer">{t("half_day")}</SelectItem>
                                    <SelectItem value="on_leave" className="cursor-pointer">{t("on_leave")}</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Search Input */}
                            <div className="relative w-full sm:w-56">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <Input
                                    placeholder={t("search_by_name_roll_or_adm")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8 h-8 text-xs bg-white border-slate-200 focus-visible:ring-indigo-500 rounded-lg shadow-none"
                                />
                            </div>

                            {/* Per page */}
                            <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                                <SelectTrigger className="h-8 w-20 text-xs bg-white border-slate-200 cursor-pointer">
                                    <SelectValue placeholder="50" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="20" className="cursor-pointer">{toLocaleNumber(20, shortCode)}</SelectItem>
                                    <SelectItem value="50" className="cursor-pointer">{toLocaleNumber(50, shortCode)}</SelectItem>
                                    <SelectItem value="100" className="cursor-pointer">{toLocaleNumber(100, shortCode)}</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Multi-format export toolbar */}
                            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                                <button
                                    type="button"
                                    onClick={exportToCopy}
                                    className="p-1.5 hover:bg-slate-100 text-slate-600 border-r border-slate-200 transition-all cursor-pointer"
                                    title="Copy"
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => exportToExcel(false)}
                                    className="p-1.5 hover:bg-slate-100 text-slate-600 border-r border-slate-200 transition-all cursor-pointer"
                                    title="Excel"
                                >
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => exportToExcel(true)}
                                    className="p-1.5 hover:bg-slate-100 text-slate-600 border-r border-slate-200 transition-all cursor-pointer"
                                    title="CSV"
                                >
                                    <FileBox className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={exportToPDF}
                                    className="p-1.5 hover:bg-slate-100 text-slate-600 border-r border-slate-200 transition-all cursor-pointer"
                                    title="PDF"
                                >
                                    <FileText className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="p-1.5 hover:bg-slate-100 text-slate-600 transition-all cursor-pointer"
                                    title="Print"
                                >
                                    <Printer className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    </CardHeader>

                    {/* Table Content */}
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                                    <TableRow>
                                        <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 w-12 text-center">#</TableHead>
                                        <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 min-w-[200px]">{t("student_profile")}</TableHead>
                                        <TableHead className="py-3 px-4 text-xs font-bold text-slate-700">{t("admission_no")}</TableHead>
                                        <TableHead className="py-3 px-4 text-xs font-bold text-slate-700">{t("roll_no")}</TableHead>
                                        <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 text-center min-w-[130px]">{t("attendance_status")}</TableHead>
                                        <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 text-center min-w-[110px]">{t("entry_time")}</TableHead>
                                        <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 text-center min-w-[110px]">{t("exit_time")}</TableHead>
                                        <TableHead className="py-3 px-4 text-xs font-bold text-slate-700 min-w-[160px]">{t("remarks_note")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <TableSkeleton cols={8} />
                                    ) : paginatedStudents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-16 text-slate-400">
                                                <BookOpen className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                                                <p className="text-xs font-bold text-slate-600">{t("no_records_found_matching_filters")}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">{t("try_changing_criteria_or_filters")}</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedStudents.map((student, idx) => (
                                            <TableRow
                                                key={student.id || idx}
                                                className="hover:bg-indigo-50/20 transition-colors group"
                                            >
                                                {/* Index */}
                                                <TableCell className="py-3 px-4 text-center text-xs font-medium text-slate-400">
                                                    {toLocaleNumber(startIndex + idx + 1, shortCode)}
                                                </TableCell>

                                                {/* Student Profile */}
                                                <TableCell className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8 border border-slate-200 shadow-2xs">
                                                            <AvatarImage src={getImageUrl(student.avatar)} />
                                                            <AvatarFallback className="text-[10px] font-bold bg-indigo-50 text-indigo-700">
                                                                {student.name?.charAt(0) || "S"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors">
                                                                {student.name}
                                                            </p>
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
                                                    {student.roll_no ? toLocaleNumber(student.roll_no, shortCode) : "—"}
                                                </TableCell>

                                                {/* Status Badge */}
                                                <TableCell className="py-3 px-4 text-center">
                                                    {getStatusBadge(getAttendanceStatus(student))}
                                                </TableCell>

                                                {/* Entry Time */}
                                                <TableCell className="py-3 px-4 text-center font-mono text-xs text-slate-700">
                                                    <span className="inline-flex items-center gap-1">
                                                        <Clock className="h-3 w-3 text-slate-400" />
                                                        {getEntryTime(student)}
                                                    </span>
                                                </TableCell>

                                                {/* Exit Time */}
                                                <TableCell className="py-3 px-4 text-center font-mono text-xs text-slate-700">
                                                    <span className="inline-flex items-center gap-1">
                                                        <Clock className="h-3 w-3 text-slate-400" />
                                                        {getExitTime(student)}
                                                    </span>
                                                </TableCell>

                                                {/* Note */}
                                                <TableCell className="py-3 px-4 text-xs text-slate-500 italic">
                                                    {getAttendanceNote(student)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>

                    {/* Footer / Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
                        <div>
                            {t("showing")} {toLocaleNumber(totalEntries > 0 ? startIndex + 1 : 0, shortCode)} {t("to")}{" "}
                            {toLocaleNumber(Math.min(startIndex + sizeNum, totalEntries), shortCode)} {t("of")} {toLocaleNumber(totalEntries, shortCode)} {t("entries")}
                        </div>

                        {totalEntries > 0 && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    disabled={safePage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                    className="h-8 w-8 bg-white hover:bg-slate-100 text-slate-600 rounded-lg transition-all border border-slate-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "h-8 w-8 transition-all text-xs flex items-center justify-center cursor-pointer font-bold rounded-lg",
                                            safePage === page
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                                                : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                                        )}
                                    >
                                        {toLocaleNumber(page, shortCode)}
                                    </button>
                                ))}

                                <button
                                    disabled={safePage === totalPages}
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                    className="h-8 w-8 bg-white hover:bg-slate-100 text-slate-600 rounded-lg transition-all border border-slate-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}
