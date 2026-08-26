"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
    Printer,
    FileText,
    FileSpreadsheet,
    Copy,
    Columns,
    Loader2,
    Trash2,
    Plus,
    UserCircle,
    ChevronLeft,
    ChevronRight,
    User,
    GitBranch,
    Filter,
    GraduationCap,
    Phone,
    AlertCircle,
    Users
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { useTranslation } from "@/hooks/use-translation";
import { useImageUrl } from "@/lib/image-url";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

interface MultiClassRecord {
    id: string;
    student: {
        admission_no: string;
        name: string;
        last_name: string;
        phone: string;
        avatar?: string;
        student_photo?: string;
        photo?: string;
        image?: string;
        category?: string;
        student_category?: { category_name: string };
    };
    school_class: { name: string };
    section: { name: string };
}

export default function MultiClassStudentPage() {
    const getImageUrl = useImageUrl();
    const [records, setRecords] = useState<MultiClassRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [searched, setSearched] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [allStudents, setAllStudents] = useState<any[]>([]);
    const [addFormData, setAddFormData] = useState({
        user_id: "",
        school_class_id: "",
        section_id: ""
    });
    const [studentSearch, setStudentSearch] = useState("");

    // Delete dialog
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const { t } = useTranslation();
    const tt = useTranslateToast();

    const fetchDropdowns = useCallback(async () => {
        try {
            const [classRes, studentRes] = await Promise.all([
                api.get("/academics/classes?no_paginate=true"),
                api.get("/students?no_paginate=true")
            ]);
            setClasses(classRes.data.data?.data || classRes.data.data || []);
            setAllStudents(studentRes.data.data?.data || studentRes.data.data || []);
        } catch (error) {
            console.error("Error fetching dropdowns:", error);
        }
    }, []);

    const [dialogSections, setDialogSections] = useState<any[]>([]);

    const fetchSections = async (classId: string, isDialog = false) => {
        if (!classId) {
            if (isDialog) setDialogSections([]);
            else setSections([]);
            return;
        }
        try {
            const response = await api.get(`/academics/sections?school_class_id=${classId}&no_paginate=true`);
            const data = response.data.data?.data || response.data.data || [];
            if (isDialog) setDialogSections(data);
            else setSections(data);
        } catch (error) {
            console.error("Error fetching sections:", error);
        }
    };

    const fetchRecords = useCallback(async (pg = currentPage, kw = searchTerm) => {
        setLoading(true);
        try {
            const response = await api.get("/multi-class-students", {
                params: {
                    school_class_id: selectedClass || undefined,
                    section_id: selectedSection || undefined,
                    search: kw || undefined,
                    page: pg,
                    limit: 50
                }
            });
            const data = response.data.data;
            setRecords(data?.data || data || []);
            setTotalPages(data?.last_page || 1);
            setTotalRecords(data?.total || 0);
            setSearched(true);
        } catch (error) {
            console.error("Error fetching multi-class records:", error);
            tt.error("failed_to_fetch_records");
        } finally {
            setLoading(false);
        }
    }, [selectedClass, selectedSection, tt]);

    useEffect(() => {
        fetchDropdowns();
    }, [fetchDropdowns]);

    // Export functions
    const exportToCopy = () => {
        if (records.length === 0) return;
        const headers = ["#", t("admission_no"), t("student_name"), t("class"), t("section"), t("category"), t("mobile_number")];
        const rows = records.map((r, idx) => [
            (currentPage - 1) * 50 + idx + 1,
            r.student?.admission_no || "-",
            `${r.student?.name || ""} ${r.student?.last_name || ""}`.trim(),
            r.school_class?.name || "-",
            r.section?.name || "-",
            r.student?.student_category?.category_name || r.student?.category || "General",
            r.student?.phone || "-"
        ]);
        const text = [headers.join("\t"), ...rows.map(row => row.join("\t"))].join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const exportToExcel = () => {
        if (records.length === 0) return;
        const data = records.map((r, idx) => ({
            "#": (currentPage - 1) * 50 + idx + 1,
            [t("admission_no")]: r.student?.admission_no || "-",
            [t("student_name")]: `${r.student?.name || ""} ${r.student?.last_name || ""}`.trim(),
            [t("class")]: `${r.school_class?.name || ""} (${r.section?.name || ""})`,
            [t("category")]: r.student?.student_category?.category_name || r.student?.category || "General",
            [t("mobile_number")]: r.student?.phone || "-"
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, t("multi_class_students"));
        XLSX.writeFile(workbook, "multi_class_students.xlsx");
        tt.success("excel_file_downloaded");
    };

    const exportToPDF = () => {
        if (records.length === 0) return;
        const doc = new jsPDF();
        doc.text("Multi Class Student List", 14, 15);
        autoTable(doc, {
            head: [["#", t("adm_no"), t("student_name"), t("class"), t("category"), t("mobile")]],
            body: records.map((r, idx) => [
                (currentPage - 1) * 50 + idx + 1,
                r.student?.admission_no || "-",
                `${r.student?.name || ""} ${r.student?.last_name || ""}`.trim(),
                `${r.school_class?.name || ""} (${r.section?.name || ""})`,
                r.student?.student_category?.category_name || r.student?.category || "General",
                r.student?.phone || "-"
            ]),
            startY: 20
        });
        doc.save("multi_class_students.pdf");
        tt.success("pdf_file_downloaded");
    };

    const confirmDeleteRecord = (id: string) => {
        setDeleteId(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await api.delete(`/multi-class-students/${deleteId}`);
            tt.success("enrollment_removed_successfully");
            fetchRecords(currentPage, searchTerm);
        } catch (error) {
            tt.error("failed_to_remove_enrollment");
        } finally {
            setDeleting(false);
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addFormData.user_id || !addFormData.school_class_id || !addFormData.section_id) {
            tt.error("please_fill_all_required_fields");
            return;
        }

        setLoading(true);
        try {
            await api.post("/multi-class-students", addFormData);
            tt.success("student_assigned_to_additional_class_successfully");
            setIsAddDialogOpen(false);
            setAddFormData({ user_id: "", school_class_id: "", section_id: "" });
            fetchRecords(currentPage, searchTerm);
        } catch (error) {
            const message = (error as any)?.response?.data?.message || t("failed_to_assign_student");
            tt.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 font-sans p-3 sm:p-5 bg-gray-50/10 min-h-screen">
            {/* Top Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden no-print">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <GitBranch className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 tracking-tight leading-none">
                            {t("multi_class_student")}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {t("manage_students_enrolled_in_additional_classes") || "Manage students enrolled in additional classes and sections"}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="btn-gradient text-white px-5 h-9 text-xs gap-1.5 shadow-md rounded-full font-bold uppercase tracking-wider cursor-pointer"
                >
                    <Plus className="h-4 w-4" /> {t("add_multi_class_enrollment") || "Add Enrollment"}
                </Button>
            </div>

            {/* Select Criteria Card (Balanced 3-column row) */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 no-print">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                            {t("select_criteria")}
                        </CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("filter_by_class_and_section")}</p>
                    </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        {/* Class */}
                        <div className="md:col-span-4 space-y-1.5">
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
                        <div className="md:col-span-3 space-y-1.5">
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

                        {/* Search By Student */}
                        <div className="md:col-span-3 space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("search_by_student") || "Search By Student"}
                            </Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-gray-400" />
                                <Input
                                    placeholder={t("student_name_or_admission_no") || "Name or Adm No..."}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && fetchRecords(1, searchTerm)}
                                    className="pl-8 h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none"
                                />
                            </div>
                        </div>

                        {/* Search CTA */}
                        <div className="md:col-span-2">
                            <Button
                                onClick={() => {
                                    if (!selectedClass) {
                                        tt.error("please_select_class_and_section_first");
                                        return;
                                    }
                                    setCurrentPage(1);
                                    fetchRecords(1, searchTerm);
                                }}
                                disabled={loading}
                                className="btn-gradient text-white gap-2 h-10 px-6 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full w-full cursor-pointer"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                {t("search")}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Table Section */}
            {(searched || loading) ? (
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <GitBranch className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                    {t("multi_class_student_list")}
                                </CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    {t("records_count", { count: totalRecords })}
                                </p>
                            </div>
                        </div>

                        {/* Export Toolbar */}
                        <div className="flex items-center gap-1 text-gray-400">
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
                        {/* Enhanced Table */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs">
                            <Table>
                                <TableHeader className="bg-gray-50/90 dark:bg-gray-800/80 text-[11px] uppercase font-bold text-gray-600 dark:text-gray-300">
                                    <TableRow className="hover:bg-transparent border-gray-200 dark:border-gray-700">
                                        <TableHead className="py-3 px-3 w-[60px]">#</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[260px]">{t("student_name")}</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[160px]">{t("class")}</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[130px]">{t("category")}</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[150px]">{t("mobile_number")}</TableHead>
                                        <TableHead className="py-3 px-4 text-right w-[100px]">{t("action")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={6} />
                                    ) : records.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="px-4 py-16 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                                                {t("no_data_found")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        records.map((record, idx) => {
                                            const student = record.student || ({} as any);
                                            const photoUrl = getImageUrl(student.student_photo || student.avatar || student.photo || student.image);

                                            return (
                                                <TableRow
                                                    key={record.id}
                                                    className="text-[13px] border-b last:border-0 border-gray-100 dark:border-gray-800 hover:bg-indigo-50/20 transition-colors group align-middle"
                                                >
                                                    {/* Serial Number */}
                                                    <TableCell className="py-3.5 px-3 font-bold text-gray-400 text-xs">
                                                        {(currentPage - 1) * 50 + idx + 1}
                                                    </TableCell>

                                                    {/* Student Avatar & Name */}
                                                    <TableCell className="py-3.5 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-800">
                                                                <AvatarImage
                                                                    src={photoUrl}
                                                                    alt={student.name || "Student"}
                                                                    className="object-cover h-full w-full"
                                                                />
                                                                <AvatarFallback className="bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white font-bold text-xs flex items-center justify-center">
                                                                    {(student.name || "ST").slice(0, 2).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                                                                    {student.name} {student.last_name || ""}
                                                                </p>
                                                                <span className="inline-flex items-center gap-1 font-mono text-[10.5px] text-gray-500 font-semibold">
                                                                    {student.admission_no || "N/A"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Class & Section */}
                                                    <TableCell className="py-3.5 px-4">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-100 dark:border-indigo-800 shadow-2xs">
                                                            <GraduationCap className="h-3.5 w-3.5 text-indigo-500" />
                                                            {record.school_class?.name} ({record.section?.name})
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

                                                    {/* Action */}
                                                    <TableCell className="py-3.5 px-4 text-right">
                                                        <Button
                                                            onClick={() => confirmDeleteRecord(record.id)}
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all shadow-xs cursor-pointer"
                                                            title="Remove Enrollment"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Footer */}
                        {!loading && records.length > 0 && (
                            <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold pt-2 uppercase tracking-tight">
                                <div>
                                    {t("showing_x_to_y_of_z", {
                                        from: (currentPage - 1) * 50 + 1,
                                        to: Math.min(currentPage * 50, totalRecords),
                                        total: totalRecords
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
                                            fetchRecords(newPg, searchTerm);
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
                                                        fetchRecords(page, searchTerm);
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
                                            fetchRecords(newPg, searchTerm);
                                        }}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 shadow-sm print:hidden">
                    <div className="p-4 bg-indigo-50 dark:bg-gray-700 rounded-full mb-3 text-indigo-400">
                        <Users className="h-8 w-8" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{t("no_data_selected") || "No Criteria Selected"}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{t("select_class_and_section_then_click_search")}</p>
                </div>
            )}

            {/* Add Enrollment Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                    <DialogHeader className="p-5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Plus className="h-5 w-5" />
                            </span>
                            <div>
                                <DialogTitle className="text-base font-bold text-gray-800 tracking-tight leading-none">
                                    {t("add_multi_class_enrollment")}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-gray-500 mt-1">
                                    {t("enroll_a_student_into_additional_class_and_section")}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleAddSubmit}>
                        <div className="p-6 space-y-4">
                            {/* Student Search & Select */}
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    {t("select_student")} <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative mb-2">
                                    <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-gray-400" />
                                    <Input
                                        placeholder={t("filter_students_by_name_or_admission_no")}
                                        className="pl-8 h-9 text-xs border-gray-200 bg-gray-50/30 rounded-lg"
                                        value={studentSearch}
                                        onChange={(e) => setStudentSearch(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="flex h-10 w-full rounded-lg border border-gray-200 bg-gray-50/30 px-3 py-2 text-xs focus:ring-indigo-500 cursor-pointer"
                                    value={addFormData.user_id}
                                    onChange={(e) => setAddFormData({ ...addFormData, user_id: e.target.value })}
                                    required
                                >
                                    <option value="">{t("select_student")}</option>
                                    {allStudents
                                        .filter(s =>
                                            `${s.name} ${s.last_name || ""} ${s.admission_no}`.toLowerCase().includes(studentSearch.toLowerCase())
                                        )
                                        .slice(0, 100)
                                        .map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} {s.last_name || ""} ({s.admission_no})
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>

                            {/* Additional Class & Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        {t("additional_class")} <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        className="flex h-10 w-full rounded-lg border border-gray-200 bg-gray-50/30 px-3 py-2 text-xs focus:ring-indigo-500 cursor-pointer"
                                        value={addFormData.school_class_id}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setAddFormData({ ...addFormData, school_class_id: val, section_id: "" });
                                            fetchSections(val, true);
                                        }}
                                        required
                                    >
                                        <option value="">{t("select_class")}</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        {t("additional_section")} <span className="text-red-500">*</span>
                                    </Label>
                                    <select
                                        className="flex h-10 w-full rounded-lg border border-gray-200 bg-gray-50/30 px-3 py-2 text-xs focus:ring-indigo-500 cursor-pointer"
                                        value={addFormData.section_id}
                                        onChange={(e) => setAddFormData({ ...addFormData, section_id: e.target.value })}
                                        required
                                    >
                                        <option value="">{t("select_section")}</option>
                                        {dialogSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-9 px-4 rounded-full text-xs font-bold uppercase border-gray-200"
                                onClick={() => setIsAddDialogOpen(false)}
                            >
                                {t("cancel")}
                            </Button>
                            <Button
                                type="submit"
                                className="btn-gradient text-white h-9 px-6 rounded-full text-xs font-bold uppercase shadow-md"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
                                {t("assign_class")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Remove Enrollment Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">
                            {t("are_you_sure") || "Remove Multi-Class Enrollment?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            {t("are_you_sure_remove_enrollment") || "Are you sure you want to remove this additional class assignment for this student?"}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel disabled={deleting} className="h-9 rounded-full text-[11px] font-bold uppercase tracking-wider border-gray-200">
                            {t("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
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
