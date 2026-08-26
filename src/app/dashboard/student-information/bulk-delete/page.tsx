"use client";

import { useState, useEffect, useCallback } from "react";
import { getImageUrl } from "@/lib/image-url";
import {
    Search,
    Printer,
    FileText,
    FileSpreadsheet,
    Copy,
    Columns,
    Loader2,
    Trash2,
    ChevronLeft,
    ChevronRight,
    User,
    Filter,
    GraduationCap,
    Calendar,
    Phone,
    CheckCircle2,
    Users,
    AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatDate } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { useTranslation } from "@/hooks/use-translation";
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
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

interface Student {
    id: string;
    admission_no: string;
    name: string;
    last_name: string;
    school_class: { name: string };
    section: { name: string };
    dob: string;
    gender: string;
    category: string;
    phone: string;
    avatar?: string;
    student_photo?: string;
    photo?: string;
    image?: string;
    student_category?: { category_name: string };
}

export default function BulkDeletePage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalStudents, setTotalStudents] = useState(0);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [searched, setSearched] = useState(false);
    const { t } = useTranslation();
    const tt = useTranslateToast();

    const fetchDropdowns = useCallback(async () => {
        try {
            const [classRes] = await Promise.all([
                api.get("/academics/classes?no_paginate=true")
            ]);
            setClasses(classRes.data.data?.data || classRes.data.data || []);
        } catch (error) {
            console.error("Error fetching dropdowns:", error);
        }
    }, []);

    const fetchSections = async (classId: string) => {
        if (!classId) {
            setSections([]);
            return;
        }
        try {
            const response = await api.get(`/academics/sections?school_class_id=${classId}&no_paginate=true`);
            setSections(response.data.data?.data || response.data.data || []);
        } catch (error) {
            console.error("Error fetching sections:", error);
        }
    };

    const fetchStudents = useCallback(async (pg = currentPage, kw = searchTerm) => {
        setLoading(true);
        try {
            const response = await api.get("/students", {
                params: {
                    school_class_id: selectedClass || undefined,
                    section_id: selectedSection || undefined,
                    search: kw || undefined,
                    page: pg,
                    limit: 50
                }
            });
            setStudents(response.data.data?.data || response.data.data || []);
            setTotalPages(response.data.data?.last_page || 1);
            setTotalStudents(response.data.data?.total || 0);
            setSelectedIds(new Set());
            setSearched(true);
        } catch (error) {
            console.error("Error fetching students:", error);
            tt.error("failed_to_fetch_students");
        } finally {
            setLoading(false);
        }
    }, [selectedClass, selectedSection, tt]);

    useEffect(() => {
        fetchDropdowns();
    }, [fetchDropdowns]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(students.map(s => s.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) {
            tt.error("please_select_at_least_one_student");
            return;
        }
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        setLoading(true);
        setIsDeleteDialogOpen(false);
        try {
            await api.post("/students/bulk-delete", { ids: Array.from(selectedIds) });
            tt.success("students_deleted_successfully");
            fetchStudents(currentPage, searchTerm);
        } catch (error) {
            console.error("Error deleting students:", error);
            tt.error("failed_to_delete_students");
        } finally {
            setLoading(false);
        }
    };

    // Export functions
    const exportToCopy = () => {
        if (students.length === 0) return;
        const headers = ["#", t("admission_no"), t("student_name"), t("class"), t("dob"), t("gender"), t("category"), t("mobile_number")];
        const rows = students.map((s, idx) => [
            (currentPage - 1) * 50 + idx + 1,
            s.admission_no,
            `${s.name} ${s.last_name || ""}`.trim(),
            `${s.school_class?.name || ""} (${s.section?.name || ""})`,
            s.dob ? formatDate(s.dob) : "-",
            s.gender || "-",
            s.student_category?.category_name || s.category || "General",
            s.phone || "-"
        ]);
        const text = [headers.join("\t"), ...rows.map(row => row.join("\t"))].join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const exportToExcel = () => {
        if (students.length === 0) return;
        const data = students.map((s, idx) => ({
            "#": (currentPage - 1) * 50 + idx + 1,
            [t("admission_no")]: s.admission_no,
            [t("student_name")]: `${s.name} ${s.last_name || ""}`.trim(),
            [t("class")]: `${s.school_class?.name || ""} (${s.section?.name || ""})`,
            [t("date_of_birth")]: s.dob ? formatDate(s.dob) : "-",
            [t("gender")]: s.gender || "-",
            [t("category")]: s.student_category?.category_name || s.category || "General",
            [t("mobile_number")]: s.phone || "-"
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, t("students"));
        XLSX.writeFile(workbook, "students_bulk_delete.xlsx");
        tt.success("excel_file_downloaded");
    };

    const exportToPDF = () => {
        if (students.length === 0) return;
        const doc = new jsPDF();
        doc.text("Student List - Bulk Delete", 14, 15);
        autoTable(doc, {
            head: [["#", t("adm_no"), t("name"), t("class"), t("dob"), t("gender"), t("cat"), t("mobile")]],
            body: students.map((s, idx) => [
                (currentPage - 1) * 50 + idx + 1,
                s.admission_no,
                `${s.name} ${s.last_name || ""}`.trim(),
                `${s.school_class?.name || ""} (${s.section?.name || ""})`,
                s.dob ? formatDate(s.dob) : "-",
                s.gender || "-",
                s.student_category?.category_name || s.category || "General",
                s.phone || "-"
            ]),
            startY: 20
        });
        doc.save("students_bulk_delete.pdf");
        tt.success("pdf_file_downloaded");
    };

    return (
        <div className="space-y-6 font-sans p-3 sm:p-5 bg-gray-50/10 min-h-screen">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden no-print">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Trash2 className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 tracking-tight leading-none">
                            {t("bulk_delete")}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {t("search_and_remove_multiple_students") || "Search and remove multiple students securely"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Select Criteria Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 no-print">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                            {t("select_criteria")}
                        </CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("choose_class_and_section_to_find_students")}</p>
                    </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        {/* Class */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("class")} <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={selectedClass}
                                onValueChange={(val) => {
                                    setSelectedClass(val);
                                    setSelectedSection("");
                                    fetchSections(val);
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
                                {t("section")}
                            </Label>
                            <Select
                                value={selectedSection}
                                onValueChange={setSelectedSection}
                                disabled={!selectedClass}
                            >
                                <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                    <SelectValue placeholder={!selectedClass ? t("select_class_first") : t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Search Button */}
                        <div>
                            <Button
                                onClick={() => {
                                    if (!selectedClass) {
                                        tt.error("please_select_class_and_section_first");
                                        return;
                                    }
                                    setCurrentPage(1);
                                    fetchStudents(1, searchTerm);
                                }}
                                disabled={loading}
                                className="btn-gradient text-white gap-2 h-10 px-8 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full w-full md:w-auto"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                {t("search")}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Table Section */}
            {(loading || students.length > 0) ? (
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Trash2 className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                    {t("student_list")}
                                </CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    {t("students_found", { count: totalStudents })}
                                    {selectedIds.size > 0 && ` • ${selectedIds.size} selected`}
                                </p>
                            </div>
                        </div>

                        {/* Actions Toolbar */}
                        <div className="flex items-center gap-2">
                            {selectedIds.size > 0 && (
                                <Button
                                    onClick={handleBulkDelete}
                                    size="sm"
                                    className="h-8 px-3 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center gap-1.5 font-bold shadow-md animate-in fade-in cursor-pointer"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete Selected ({selectedIds.size})
                                </Button>
                            )}
                            <Button onClick={exportToCopy} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Copy">
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button onClick={exportToExcel} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Export Excel">
                                <FileSpreadsheet className="h-4 w-4" />
                            </Button>
                            <Button onClick={exportToPDF} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Export PDF">
                                <FileText className="h-4 w-4" />
                            </Button>
                            <Button onClick={() => window.print()} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Print">
                                <Printer className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Columns">
                                <Columns className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="px-5 pb-5 space-y-4">
                        {/* Search Bar & Stats */}
                        <div className="flex justify-between items-center gap-4">
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search students..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && fetchStudents(1, searchTerm)}
                                    className="pl-9 h-9 text-xs border-gray-200 bg-gray-50/30 rounded-lg focus-visible:ring-indigo-500 shadow-none"
                                />
                            </div>

                            {totalStudents > 0 && (
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10.5px] font-bold py-1 px-2.5">
                                    <Users className="h-3 w-3 mr-1" />
                                    {totalStudents} Students Found
                                </Badge>
                            )}
                        </div>

                        {/* Enhanced Table */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs">
                            <Table>
                                <TableHeader className="bg-gray-50/90 dark:bg-gray-800/80 text-[11px] uppercase font-bold text-gray-600 dark:text-gray-300">
                                    <TableRow className="hover:bg-transparent border-gray-200 dark:border-gray-700">
                                        <TableHead className="w-[45px] pl-4">
                                            <Checkbox
                                                checked={students.length > 0 && selectedIds.size === students.length}
                                                onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                                                className="h-4 w-4 rounded-md border-gray-300 data-[state=checked]:bg-indigo-600 shadow-2xs"
                                            />
                                        </TableHead>
                                        <TableHead className="py-3 px-3 w-[60px]">#</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[240px]">{t("student_name")}</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[150px]">{t("class")}</TableHead>
                                        <TableHead className="py-3 px-4 w-[130px]">{t("date_of_birth")}</TableHead>
                                        <TableHead className="py-3 px-4 w-[110px]">{t("gender")}</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[140px]">{t("category")}</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[150px]">{t("mobile_number")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={8} />
                                    ) : students.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="px-4 py-16 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                                                {t("no_data_found")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        students.map((student, idx) => {
                                            const isSelected = selectedIds.has(student.id);
                                            const photoUrl = getImageUrl(student.student_photo || student.avatar || student.photo || student.image);

                                            return (
                                                <TableRow
                                                    key={student.id}
                                                    className={cn(
                                                        "text-[13px] border-b last:border-0 border-gray-100 dark:border-gray-800 transition-colors group align-middle",
                                                        isSelected ? "bg-indigo-50/40 dark:bg-indigo-950/20" : "hover:bg-indigo-50/20"
                                                    )}
                                                >
                                                    <TableCell className="pl-4 py-3.5">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => handleSelectOne(student.id)}
                                                            className="h-4 w-4 rounded-md border-gray-300 data-[state=checked]:bg-indigo-600 shadow-2xs"
                                                        />
                                                    </TableCell>

                                                    {/* Serial Number (Renamed from HASH) */}
                                                    <TableCell className="py-3.5 px-3 font-bold text-gray-400 text-xs">
                                                        {(currentPage - 1) * 50 + idx + 1}
                                                    </TableCell>

                                                    {/* Student Avatar, Full Name & Admission No */}
                                                    <TableCell className="py-3.5 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-800">
                                                                <AvatarImage
                                                                    src={photoUrl}
                                                                    alt={student.name}
                                                                    className="object-cover h-full w-full"
                                                                />
                                                                <AvatarFallback className="bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white font-bold text-xs flex items-center justify-center">
                                                                    {student.name.slice(0, 2).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                                                                    {student.name} {student.last_name || ""}
                                                                </p>
                                                                <span className="inline-flex items-center gap-1 font-mono text-[10.5px] text-gray-500 font-semibold">
                                                                    {student.admission_no}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Class & Section */}
                                                    <TableCell className="py-3.5 px-4">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-100 dark:border-indigo-800 shadow-2xs">
                                                            <GraduationCap className="h-3.5 w-3.5 text-indigo-500" />
                                                            {student.school_class?.name} ({student.section?.name})
                                                        </span>
                                                    </TableCell>

                                                    {/* Date of Birth */}
                                                    <TableCell className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                                                        <div className="flex items-center gap-1.5 text-xs font-medium">
                                                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                            {student.dob ? formatDate(student.dob) : "—"}
                                                        </div>
                                                    </TableCell>

                                                    {/* Gender */}
                                                    <TableCell className="py-3.5 px-4">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-xs border border-gray-200 dark:border-gray-700">
                                                            {student.gender || "—"}
                                                        </span>
                                                    </TableCell>

                                                    {/* Category */}
                                                    <TableCell className="py-3.5 px-4">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 text-[10.5px] font-bold uppercase tracking-wider border border-indigo-100 dark:border-indigo-800">
                                                            {student.student_category?.category_name || student.category || "General"}
                                                        </span>
                                                    </TableCell>

                                                    {/* Mobile Number */}
                                                    <TableCell className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                                                        <div className="flex items-center gap-1.5 text-xs font-medium font-mono">
                                                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                                                            {student.phone || "—"}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Footer */}
                        {!loading && students.length > 0 && (
                            <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold pt-2 uppercase tracking-tight">
                                <div>
                                    {t("showing_x_to_y_of_z", {
                                        from: (currentPage - 1) * 50 + 1,
                                        to: Math.min(currentPage * 50, totalStudents),
                                        total: totalStudents
                                    })}
                                </div>
                                <div className="flex gap-1.5">
                                    <Button
                                        size="sm"
                                        className="h-8 w-8 p-0 bg-white border border-gray-200 text-gray-600 rounded-[10px] shadow-sm disabled:opacity-40"
                                        disabled={currentPage === 1 || loading}
                                        onClick={() => {
                                            const newPg = currentPage - 1;
                                            setCurrentPage(newPg);
                                            fetchStudents(newPg, searchTerm);
                                        }}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>

                                    {[...Array(totalPages)].map((_, i) => {
                                        const page = i + 1;
                                        if (
                                            page === 1 ||
                                            page === totalPages ||
                                            (page >= currentPage - 1 && page <= currentPage + 1)
                                        ) {
                                            return (
                                                <Button
                                                    key={page}
                                                    size="sm"
                                                    className={cn(
                                                        "h-8 w-8 p-0 rounded-[10px] text-xs font-black shadow-sm transition-all",
                                                        currentPage === page
                                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0"
                                                            : "bg-white border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                                                    )}
                                                    onClick={() => {
                                                        setCurrentPage(page);
                                                        fetchStudents(page, searchTerm);
                                                    }}
                                                    disabled={loading}
                                                >
                                                    {page}
                                                </Button>
                                            );
                                        } else if (
                                            page === currentPage - 2 ||
                                            page === currentPage + 2
                                        ) {
                                            return <span key={page} className="text-gray-400 self-center px-1">...</span>;
                                        }
                                        return null;
                                    })}

                                    <Button
                                        size="sm"
                                        className="h-8 w-8 p-0 bg-white border border-gray-200 text-gray-600 rounded-[10px] shadow-sm disabled:opacity-40"
                                        disabled={currentPage === totalPages || loading}
                                        onClick={() => {
                                            const newPg = currentPage + 1;
                                            setCurrentPage(newPg);
                                            fetchStudents(newPg, searchTerm);
                                        }}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : searched && !loading && (
                <div className="px-6 py-4 bg-red-100/80 border border-red-200 rounded-2xl text-red-600 font-bold text-sm shadow-sm flex items-center gap-3 animate-in slide-in-from-top-2">
                    <AlertCircle className="h-5 w-5 opacity-80" />
                    {t("no_record_found")}
                </div>
            )}

            {!searched && !loading && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 shadow-sm print:hidden">
                    <div className="p-4 bg-indigo-50 dark:bg-gray-700 rounded-full mb-3 text-indigo-400">
                        <User className="h-8 w-8" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{t("no_data_selected") || "No Criteria Selected"}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{t("select_class_and_section_then_click_search")}</p>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">
                            {t("confirm_bulk_deletion") || "Delete Selected Students?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            {t("are_you_sure_delete_selected_students", { count: selectedIds.size })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-9 rounded-full text-[11px] font-bold uppercase tracking-wider border-gray-200">
                            {t("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-rose-500 hover:bg-rose-600 h-9 rounded-full text-[11px] font-bold uppercase tracking-wider border-0 shadow-md"
                        >
                            {t("yes_delete_permanently") || "Delete Permanently"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
