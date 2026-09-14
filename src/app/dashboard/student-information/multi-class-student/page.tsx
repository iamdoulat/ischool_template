"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
    Printer,
    FileText,
    FileSpreadsheet,
    Copy,
    Loader2,
    Trash2,
    Plus,
    ChevronLeft,
    ChevronRight,
    User,
    GitBranch,
    Filter,
    GraduationCap,
    Phone,
    Users,
    Building,
    Layers
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
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, translateClassName, translateSectionName, toLocaleNumber } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
                        <td key={j} className="px-4 py-3.5">
                            <div
                                className="h-4 rounded-md bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }}
                            />
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

interface ClassItem {
    id: number;
    name: string;
    [key: string]: unknown;
}

interface SectionItem {
    id: number;
    name: string;
    [key: string]: unknown;
}

interface StudentItem {
    id: number;
    name: string;
    last_name?: string;
    admission_no?: string;
    [key: string]: unknown;
}

export default function MultiClassStudentPage() {
    const getImageUrl = useImageUrl();
    const [records, setRecords] = useState<MultiClassRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [sections, setSections] = useState<SectionItem[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [limit, setLimit] = useState("20");
    const [searched, setSearched] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [allStudents, setAllStudents] = useState<StudentItem[]>([]);
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

    const { t, language, isRtl } = useTranslation();
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

    const [dialogSections, setDialogSections] = useState<SectionItem[]>([]);

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

    const fetchRecords = useCallback(async (pg = 1, kw = "", lim = limit) => {
        setLoading(true);
        try {
            const response = await api.get("/multi-class-students", {
                params: {
                    school_class_id: selectedClass || undefined,
                    section_id: selectedSection || undefined,
                    search: kw || undefined,
                    page: pg,
                    limit: Number(lim)
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
    }, [selectedClass, selectedSection, limit, tt]);

    useEffect(() => {
        fetchDropdowns();
    }, [fetchDropdowns]);

    // Export functions
    const exportToCopy = () => {
        if (records.length === 0) {
            tt.error("no_data_found");
            return;
        }
        const headers = ["#", t("admission_no"), t("student_name"), t("class"), t("section"), t("category"), t("mobile_number")];
        const rows = records.map((r, idx) => [
            (currentPage - 1) * Number(limit) + idx + 1,
            r.student?.admission_no || "-",
            `${r.student?.name || ""} ${r.student?.last_name || ""}`.trim(),
            translateClassName(r.school_class?.name, language?.short_code) || "-",
            translateSectionName(r.section?.name, language?.short_code) || "-",
            r.student?.student_category?.category_name || r.student?.category || t("general"),
            r.student?.phone || "-"
        ]);
        const text = [headers.join("\t"), ...rows.map(row => row.join("\t"))].join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const exportToExcel = () => {
        if (records.length === 0) {
            tt.error("no_data_found");
            return;
        }
        const data = records.map((r, idx) => ({
            "#": (currentPage - 1) * Number(limit) + idx + 1,
            [t("admission_no")]: r.student?.admission_no || "-",
            [t("student_name")]: `${r.student?.name || ""} ${r.student?.last_name || ""}`.trim(),
            [t("class")]: `${translateClassName(r.school_class?.name, language?.short_code) || ""} (${translateSectionName(r.section?.name, language?.short_code) || ""})`,
            [t("category")]: r.student?.student_category?.category_name || r.student?.category || t("general"),
            [t("mobile_number")]: r.student?.phone || "-"
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, t("multi_class_students"));
        XLSX.writeFile(workbook, "multi_class_students.xlsx");
        tt.success("excel_file_downloaded");
    };

    const exportToPDF = () => {
        if (records.length === 0) {
            tt.error("no_data_found");
            return;
        }
        const doc = new jsPDF();
        doc.text(t("multi_class_student_list"), 14, 15);
        autoTable(doc, {
            head: [["#", t("adm_no"), t("student_name"), t("class"), t("category"), t("mobile")]],
            body: records.map((r, idx) => [
                (currentPage - 1) * Number(limit) + idx + 1,
                r.student?.admission_no || "-",
                `${r.student?.name || ""} ${r.student?.last_name || ""}`.trim(),
                `${translateClassName(r.school_class?.name, language?.short_code) || ""} (${translateSectionName(r.section?.name, language?.short_code) || ""})`,
                r.student?.student_category?.category_name || r.student?.category || t("general"),
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
        } catch {
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
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || t("failed_to_assign_student");
            tt.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-3 sm:p-5 pt-1 sm:pt-2 space-y-4 max-w-[1600px] mx-auto animate-in fade-in duration-300 pb-20">
            {/* Top Page Header Banner with Signature Gradient */}
            <div className="bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden px-5 py-4 flex flex-row items-center justify-between gap-3 no-print">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <GitBranch className="h-4 w-4" />
                    </span>
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800 leading-none">
                            {t("multi_class_student")}
                        </h1>
                        <p className="text-xs text-slate-600 mt-1 font-medium">
                            {t("manage_students_enrolled_in_additional_classes")}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setIsAddDialogOpen(true)}
                        className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white shadow-md shadow-indigo-500/20 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer border-none"
                    >
                        <Plus className="h-4 w-4" />
                        <span>{t("add_multi_class_enrollment")}</span>
                    </Button>
                </div>
            </div>

            {/* Select Criteria Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card overflow-hidden pt-0 no-print">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-200/70">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-4 w-4" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                            {t("select_criteria")}
                        </CardTitle>
                        <p className="text-xs text-slate-500 font-medium mt-1">{t("filter_by_class_and_section")}</p>
                    </div>
                </CardHeader>

                <CardContent className="p-5 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-end">
                        {/* Class */}
                        <div className="lg:col-span-4 space-y-1.5 group">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <Building className="h-3.5 w-3.5 text-indigo-600" />
                                {t("class")} <span className="text-destructive">*</span>
                            </label>
                            <select
                                value={selectedClass}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedClass(val);
                                    setSelectedSection("");
                                    fetchSections(val);
                                }}
                                className="flex h-10 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs sm:text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                            >
                                <option value="">{t("select_class")}</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id.toString()}>
                                        {translateClassName(c.name, language?.short_code)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Section */}
                        <div className="lg:col-span-3 space-y-1.5 group">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <Layers className="h-3.5 w-3.5 text-indigo-600" />
                                {t("section")}
                            </label>
                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                disabled={!selectedClass}
                                className="flex h-10 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs sm:text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium disabled:opacity-50"
                            >
                                <option value="">{!selectedClass ? t("select_class_first") : t("select_section")}</option>
                                {sections.map(s => (
                                    <option key={s.id} value={s.id.toString()}>
                                        {translateSectionName(s.name, language?.short_code)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Search By Student */}
                        <div className="lg:col-span-3 space-y-1.5 group">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <User className="h-3.5 w-3.5 text-indigo-600" />
                                {t("search_by_student")}
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder={t("student_name_or_admission_no")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && fetchRecords(1, searchTerm, limit)}
                                    className="pl-8.5 h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                                />
                            </div>
                        </div>

                        {/* Search CTA */}
                        <div className="lg:col-span-2">
                            <Button
                                onClick={() => {
                                    if (!selectedClass) {
                                        tt.error("please_select_class_and_section");
                                        return;
                                    }
                                    setCurrentPage(1);
                                    fetchRecords(1, searchTerm, limit);
                                }}
                                disabled={loading}
                                className="h-10 w-full rounded-xl font-bold text-xs bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Search className="h-4 w-4 shrink-0" />}
                                <span>{t("search")}</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Table Section */}
            {(searched || loading) ? (
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card overflow-hidden pt-0 animate-in slide-in-from-bottom-3 duration-300">
                    <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-200/70">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <GitBranch className="h-4 w-4" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                    {t("multi_class_student_list")}
                                </CardTitle>
                                <p className="text-xs text-slate-500 font-medium mt-1">
                                    {t("x_results_found", { count: toLocaleNumber(totalRecords, language?.short_code) })}
                                </p>
                            </div>
                        </div>

                        {/* Export Toolbar & Row Selector */}
                        <div className="flex items-center gap-2">
                            <Select
                                value={limit}
                                onValueChange={(val) => {
                                    setLimit(val);
                                    setCurrentPage(1);
                                    fetchRecords(1, searchTerm, val);
                                }}
                            >
                                <SelectTrigger className="w-[72px] h-8 text-xs font-semibold rounded-lg border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs focus:ring-1 focus:ring-primary/20 cursor-pointer">
                                    <SelectValue placeholder={toLocaleNumber(limit, language?.short_code)}>
                                        {toLocaleNumber(limit, language?.short_code)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">{toLocaleNumber(10, language?.short_code)}</SelectItem>
                                    <SelectItem value="20">{toLocaleNumber(20, language?.short_code)}</SelectItem>
                                    <SelectItem value="50">{toLocaleNumber(50, language?.short_code)}</SelectItem>
                                    <SelectItem value="100">{toLocaleNumber(100, language?.short_code)}</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex items-center border border-gray-200/80 dark:border-slate-800 rounded-lg p-0.5 bg-white dark:bg-slate-900 shadow-xs">
                                <Button onClick={exportToCopy} variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-md transition-colors cursor-pointer" title={t("copy")}>
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button onClick={exportToExcel} variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md transition-colors cursor-pointer" title={t("export_excel")}>
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button onClick={exportToPDF} variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer" title={t("export_pdf")}>
                                    <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <Button onClick={() => window.print()} variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer" title={t("print")}>
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40 border-b border-border/70 hover:bg-muted/40 text-xs font-bold">
                                        <TableHead className="py-3 px-4 w-[60px]">#</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[240px]">{t("student_name")}</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[160px]">{t("class")}</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[130px]">{t("category")}</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[150px]">{t("mobile_number")}</TableHead>
                                        <TableHead className="py-3 px-4 text-right pr-6 w-[100px]">{t("action")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-border/50 text-xs">
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={6} />
                                    ) : records.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="px-4 py-16 text-center text-xs font-bold text-muted-foreground">
                                                {t("no_data_found")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        records.map((record, idx) => {
                                            const student = record.student || ({} as unknown as MultiClassRecord["student"]);
                                            const photoUrl = getImageUrl(student.student_photo || student.avatar || student.photo || student.image);

                                            return (
                                                <TableRow
                                                    key={record.id}
                                                    className="hover:bg-muted/20 transition-colors"
                                                >
                                                    {/* Serial Number */}
                                                    <TableCell className="py-3.5 px-4 font-bold text-muted-foreground text-xs">
                                                        {toLocaleNumber((currentPage - 1) * Number(limit) + idx + 1, language?.short_code)}
                                                    </TableCell>

                                                    {/* Student Avatar & Name */}
                                                    <TableCell className="py-3.5 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-9 w-9 rounded-xl border border-border/80 shrink-0 overflow-hidden bg-muted">
                                                                <AvatarImage
                                                                    src={photoUrl}
                                                                    alt={student.name || t("student")}
                                                                    className="object-cover h-full w-full"
                                                                />
                                                                <AvatarFallback className="bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white font-bold text-xs flex items-center justify-center">
                                                                    {(student.name || "ST").slice(0, 2).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-bold text-foreground text-sm">
                                                                    {student.name} {student.last_name || ""}
                                                                </p>
                                                                <span className="font-mono text-[10.5px] text-muted-foreground font-semibold">
                                                                    #{student.admission_no ? toLocaleNumber(student.admission_no, language?.short_code) : "N/A"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Class & Section */}
                                                    <TableCell className="py-3.5 px-4">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-100 dark:border-indigo-800">
                                                            <GraduationCap className="h-3.5 w-3.5 text-indigo-500" />
                                                            {translateClassName(record.school_class?.name, language?.short_code)} ({translateSectionName(record.section?.name, language?.short_code)})
                                                        </span>
                                                    </TableCell>

                                                    {/* Category */}
                                                    <TableCell className="py-3.5 px-4">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[10.5px] font-bold tracking-wide">
                                                            {student.student_category?.category_name || student.category || t("general")}
                                                        </span>
                                                    </TableCell>

                                                    {/* Mobile Number */}
                                                    <TableCell className="py-3.5 px-4 text-foreground">
                                                        <div className="flex items-center gap-1.5 text-xs font-medium font-mono">
                                                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                                            {student.phone ? toLocaleNumber(student.phone, language?.short_code) : "—"}
                                                        </div>
                                                    </TableCell>

                                                    {/* Action */}
                                                    <TableCell className="py-3.5 px-4 text-right pr-6">
                                                        <Button
                                                            onClick={() => confirmDeleteRecord(record.id)}
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7 rounded-lg text-white shadow-xs active:scale-95 transition-all bg-gradient-to-r from-rose-500 to-red-600 hover:opacity-90 flex items-center justify-center border-none p-0 cursor-pointer ml-auto"
                                                            title={t("delete")}
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
                        {!loading && (
                            <div className="p-4 sm:p-5 border-t border-border/70 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-semibold">
                                <div>
                                    {t("showing_x_to_y_of_z", {
                                        from: toLocaleNumber(totalRecords === 0 ? 0 : (currentPage - 1) * Number(limit) + 1, language?.short_code),
                                        to: toLocaleNumber(Math.min(currentPage * Number(limit), totalRecords), language?.short_code),
                                        total: toLocaleNumber(totalRecords, language?.short_code)
                                    })}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 w-8 p-0 rounded-xl border-border/70 text-muted-foreground hover:bg-card active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
                                        disabled={currentPage === 1 || loading || totalRecords === 0}
                                        onClick={() => {
                                            const newPg = currentPage - 1;
                                            setCurrentPage(newPg);
                                            fetchRecords(newPg, searchTerm, limit);
                                        }}
                                    >
                                        {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                                    </Button>

                                    {Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i + 1).map((page) => {
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
                                                        "h-8 w-8 p-0 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs",
                                                        currentPage === page
                                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-none shadow-indigo-500/20"
                                                            : "bg-card border border-border/80 text-foreground hover:bg-muted"
                                                    )}
                                                    onClick={() => {
                                                        setCurrentPage(page);
                                                        fetchRecords(page, searchTerm, limit);
                                                    }}
                                                    disabled={loading || totalRecords === 0}
                                                >
                                                    {toLocaleNumber(page, language?.short_code)}
                                                </Button>
                                            );
                                        } else if (
                                            page === currentPage - 2 ||
                                            page === currentPage + 2
                                        ) {
                                            return <span key={page} className="text-muted-foreground self-center px-1">...</span>;
                                        }
                                        return null;
                                    })}

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 w-8 p-0 rounded-xl border-border/70 text-muted-foreground hover:bg-card active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
                                        disabled={currentPage >= totalPages || loading || totalRecords === 0}
                                        onClick={() => {
                                            const newPg = currentPage + 1;
                                            setCurrentPage(newPg);
                                            fetchRecords(newPg, searchTerm, limit);
                                        }}
                                    >
                                        {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card rounded-2xl border border-dashed border-border shadow-xs print:hidden">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-full mb-3 text-indigo-500">
                        <Users className="h-8 w-8" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider text-foreground">{t("no_data_selected") || "No Criteria Selected"}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{t("select_class_and_section_then_click_search")}</p>
                </div>
            )}

            {/* Add Enrollment Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-2xl border border-border shadow-2xl bg-card">
                    <DialogHeader className="p-5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-border">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Plus className="h-5 w-5" />
                            </span>
                            <div>
                                <DialogTitle className="text-base font-bold text-slate-800 tracking-tight leading-none">
                                    {t("add_multi_class_enrollment")}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-600 mt-1">
                                    {t("enroll_a_student_into_additional_class_and_section")}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleAddSubmit}>
                        <div className="p-6 space-y-4">
                            {/* Student Search & Select */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {t("select_student")} <span className="text-destructive">*</span>
                                </Label>
                                <div className="relative mb-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder={t("filter_students_by_name_or_admission_no")}
                                        className="pl-8.5 h-9 text-xs rounded-xl bg-background border-border/80"
                                        value={studentSearch}
                                        onChange={(e) => setStudentSearch(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="flex h-10 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                    value={addFormData.user_id}
                                    onChange={(e) => setAddFormData({ ...addFormData, user_id: e.target.value })}
                                    required
                                >
                                    <option value="">{t("select_student")}</option>
                                    {allStudents
                                        .filter(s =>
                                            `${s.name} ${s.last_name || ""} ${s.admission_no || ""}`.toLowerCase().includes(studentSearch.toLowerCase())
                                        )
                                        .slice(0, 100)
                                        .map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} {s.last_name || ""} {s.admission_no ? `(#${toLocaleNumber(s.admission_no, language?.short_code)})` : ""}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>

                            {/* Additional Class & Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {t("additional_class")} <span className="text-destructive">*</span>
                                    </Label>
                                    <select
                                        className="flex h-10 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                        value={addFormData.school_class_id}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setAddFormData({ ...addFormData, school_class_id: val, section_id: "" });
                                            fetchSections(val, true);
                                        }}
                                        required
                                    >
                                        <option value="">{t("select_class")}</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id.toString()}>
                                                {translateClassName(c.name, language?.short_code)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {t("additional_section")} <span className="text-destructive">*</span>
                                    </Label>
                                    <select
                                        className="flex h-10 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                        value={addFormData.section_id}
                                        onChange={(e) => setAddFormData({ ...addFormData, section_id: e.target.value })}
                                        required
                                    >
                                        <option value="">{t("select_section")}</option>
                                        {dialogSections.map(s => (
                                            <option key={s.id} value={s.id.toString()}>
                                                {translateSectionName(s.name, language?.short_code)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-4 bg-muted/20 border-t border-border flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-9 px-4 rounded-xl text-xs font-bold cursor-pointer"
                                onClick={() => setIsAddDialogOpen(false)}
                            >
                                {t("cancel")}
                            </Button>
                            <Button
                                type="submit"
                                className="h-9 px-6 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white shadow-md shadow-indigo-500/20 cursor-pointer border-none"
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
                <AlertDialogContent className="rounded-2xl border border-border shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-bold text-foreground">
                            {t("are_you_sure")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed mt-2">
                            {t("are_you_sure_remove_enrollment")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel disabled={deleting} className="h-9 rounded-xl text-xs font-bold">
                            {t("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white h-9 rounded-xl text-xs font-bold border-none"
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
