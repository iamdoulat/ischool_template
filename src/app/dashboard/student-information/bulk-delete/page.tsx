"use client";

import { useState, useEffect, useCallback } from "react";
import { useImageUrl } from "@/lib/image-url";
import {
    Search,
    ChevronDown,
    AlertCircle,
    Printer,
    FileText,
    Table as TableIcon,
    Download,
    Columns,
    Copy,
    Loader2,
    Trash2,
    ChevronLeft,
    ChevronRight,
    User,
    Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
    student_category?: { category_name: string };
}

export default function BulkDeletePage() {
    const getImageUrl = useImageUrl();
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
                    school_class_id: selectedClass,
                    section_id: selectedSection,
                    search: kw,
                    page: pg,
                    limit: 50
                }
            });
            setStudents(response.data.data?.data || response.data.data || []);
            setTotalPages(response.data.data?.last_page || 1);
            setTotalStudents(response.data.data?.total || 0);
            setSelectedIds(new Set()); // Reset selections when data changes
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

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
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
        const headers = [t("admission_no"), t("student_name"), t("class"), t("section"), t("dob"), t("gender"), t("category"), t("mobile_number")];
        const rows = students.map(s => [
            s.admission_no,
            `${s.name} ${s.last_name}`,
            s.school_class?.name || "",
            s.section?.name || "",
            s.dob,
            s.gender,
            s.category,
            s.phone
        ]);
        const text = [headers.join("\t"), ...rows.map(row => row.join("\t"))].join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const exportToExcel = () => {
        if (students.length === 0) return;
        const data = students.map(s => ({
            [t("admission_no")]: s.admission_no,
            [t("student_name")]: `${s.name} ${s.last_name}`,
            [t("class")]: s.school_class?.name || "",
            [t("section")]: s.section?.name || "",
            [t("date_of_birth")]: s.dob,
            [t("gender")]: s.gender,
            [t("category")]: s.category,
            [t("mobile_number")]: s.phone
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, t("students"));
        XLSX.writeFile(workbook, "students_list.xlsx");
        tt.success("excel_file_downloaded");
    };

    const exportToPDF = () => {
        if (students.length === 0) return;
        const doc = new jsPDF();
        autoTable(doc, {
            head: [[t("adm_no"), t("name"), t("class"), t("sec"), t("dob"), t("gender"), t("cat"), t("mobile")]],
            body: students.map(s => [
                s.admission_no,
                `${s.name} ${s.last_name}`,
                s.school_class?.name || "",
                s.section?.name || "",
                s.dob,
                s.gender,
                s.category,
                s.phone
            ]),
        });
        doc.save("students_list.pdf");
        tt.success("pdf_file_downloaded");
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-destructive/10 rounded-lg">
                        <Trash2 className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">{t("bulk_delete")}</h1>
                        <p className="text-sm text-muted-foreground font-medium">{t("search_and_remove_multiple_students")}</p>
                    </div>
                </div>
            </div>

            {/* Select Criteria Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 print:hidden">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("select_criteria")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("choose_class_and_section_to_find_students")}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                {t("class")}
                            </label>
                            <div className="relative">
                                <select
                                    className="flex h-11 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer"
                                    value={selectedClass}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSelectedClass(val);
                                        setSelectedSection("");
                                        fetchSections(val);
                                    }}
                                >
                                    <option value="">{t("select")}</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors" />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                {t("section")}
                            </label>
                            <div className="relative">
                                <select
                                    className="flex h-11 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer"
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                >
                                    <option value="">{t("select")}</option>
                                    {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end mt-6">
                        <Button variant="gradient" className="h-11 px-8 rounded-lg" onClick={() => {
                            if (!selectedClass || !selectedSection) {
                                tt.error("please_select_class_and_section_first");
                                return;
                            }
                            setCurrentPage(1);
                            fetchStudents(1, searchTerm);
                        }} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} {t("search")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results Section */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-lg border border-muted/50">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-muted/50 text-primary focus:ring-primary/20 cursor-pointer"
                                checked={students.length > 0 && selectedIds.size === students.length}
                                onChange={handleSelectAll}
                            />
                            <span className="text-sm font-bold text-muted-foreground whitespace-nowrap">{t("select_all")}</span>
                        </div>
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t("search")}
                                className="pl-10 h-10 rounded-lg bg-muted/30 border-muted/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && fetchStudents(1, searchTerm)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <Button
                            variant="gradient"
                            className="h-10 px-6 rounded-lg shadow-sm"
                            disabled={selectedIds.size === 0 || loading}
                            onClick={handleBulkDelete}
                        >
                            <Trash2 className="h-4 w-4 mr-2" /> {t("delete")}
                        </Button>
                        <div className="h-8 w-px bg-muted mx-1" />
                        <IconButton icon={Printer} onClick={() => window.print()} title={t("print")} />
                        <IconButton icon={Copy} onClick={exportToCopy} title={t("copy")} />
                        <IconButton icon={TableIcon} onClick={exportToExcel} title={t("excel")} />
                        <IconButton icon={FileText} onClick={exportToPDF} title={t("pdf")} />
                        <IconButton icon={Download} onClick={exportToExcel} title={t("download")} />
                        <IconButton icon={Columns} title={t("columns")} />
                    </div>
                </div>

                {(loading || students.length > 0) ? (
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Trash2 className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("student_list")}</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{t("students_found", { count: totalStudents })}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-muted/50 text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
                                        <tr>
                                            <Th className="w-10">{t("hash")}</Th>
                                            <Th className="w-12">{t("avatar")}</Th>
                                            <Th>{t("admission_no")}</Th>
                                            <Th>{t("student_name")}</Th>
                                            <Th>{t("class")}</Th>
                                            <Th>{t("date_of_birth")}</Th>
                                            <Th>{t("gender")}</Th>
                                            <Th>{t("category")}</Th>
                                            <Th>{t("mobile_number")}</Th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-muted/30">
                                        {loading ? (
                                            <TableSkeleton rows={5} cols={9} />
                                        ) : students.length === 0 ? (
                                            <tr><td colSpan={9} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data_found")}</td></tr>
                                        ) : (
                                            students.map((student) => (
                                            <tr key={student.id} className="hover:bg-muted/10 transition-colors">
                                                <Td>
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-muted/50 text-primary focus:ring-primary/20 cursor-pointer"
                                                        checked={selectedIds.has(student.id)}
                                                        onChange={() => handleSelectOne(student.id)}
                                                    />
                                                </Td>
                                                <Td>
                                                <div className="h-10 w-10 rounded-full border-2 border-muted overflow-hidden bg-muted/20">
                                                    {student.avatar ? (
                                                        <img
                                                            src={getImageUrl(student.avatar)}
                                                            alt={t("avatar")}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                                            <User className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                </div>
                                            </Td>
                                            <Td className="font-semibold text-primary">{student.admission_no}</Td>
                                                <Td className="font-medium text-destructive">{student.name} {student.last_name}</Td>
                                                <Td>{student.school_class?.name}({student.section?.name})</Td>
                                                <Td>{student.dob}</Td>
                                                <Td>{student.gender}</Td>
                                            <Td>
                                                <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
                                                    {student.student_category?.category_name || student.category || t("general")}
                                                </span>
                                            </Td>
                                                <Td>{student.phone}</Td>
                                            </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {!loading && students.length > 0 && (
                            <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-muted/10 border-t border-muted/50">
                                <p className="text-xs text-muted-foreground font-medium">
                                    {t("showing_x_to_y_of_z", { from: (currentPage - 1) * 50 + 1, to: Math.min(currentPage * 50, totalStudents), total: totalStudents })}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="icon"
                                        className="h-8 w-8 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white"
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
                                        // Simple pagination logic: show current, first, last, and neighbors
                                        if (
                                            page === 1 ||
                                            page === totalPages ||
                                            (page >= currentPage - 1 && page <= currentPage + 1)
                                        ) {
                                            return (
                                                <Button
                                                    key={page}
                                                    className={cn(
                                                        "h-8 w-8 rounded-[10px] text-xs font-bold",
                                                        currentPage === page
                                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md scale-105"
                                                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
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
                                            return <span key={page} className="text-muted-foreground">...</span>;
                                        }
                                        return null;
                                    })}

                                    <Button
                                        size="icon"
                                        className="h-8 w-8 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white"
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
                    <div className="px-6 py-4 bg-red-100/80 border border-red-200 rounded-lg text-red-600 font-bold text-sm shadow-sm flex items-center gap-3 animate-in slide-in-from-top-2">
                        <AlertCircle className="h-5 w-5 opacity-80" />
                        {t("no_record_found")}
                    </div>
                )}

                {!searched && !loading && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-300 bg-white rounded-lg border border-dashed border-gray-200 shadow-sm print:hidden">
                        <User className="h-16 w-16 mb-4 opacity-10" />
                        <p className="text-[12px] font-medium uppercase tracking-[.2em] text-gray-400">{t("no_data_selected")}</p>
                        <p className="text-[11px] text-gray-400 mt-2 italic">{t("select_class_and_section_then_click_search")}</p>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-lg border-none shadow-2xl p-0 overflow-hidden">
                    <AlertDialogHeader className="p-8 bg-destructive/5 border-b border-destructive/10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-destructive text-white rounded-lg shadow-lg shadow-destructive/20">
                                <Trash2 className="h-6 w-6" />
                            </div>
                            <div>
                                <AlertDialogTitle className="text-2xl font-bold text-slate-800 tracking-tight">
                                    {t("confirm_bulk_deletion")}
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground font-medium mt-1">
                                    {t("are_you_sure_delete_selected_students", { count: selectedIds.size })}
                                </AlertDialogDescription>
                            </div>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="p-8 bg-muted/20 flex gap-4">
                        <AlertDialogCancel className="flex-1 h-12 rounded-lg font-bold border-muted/50 mt-0">
                            {t("cancel_keep_records")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="flex-1 h-12 rounded-lg font-bold bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20 border-none"
                        >
                            {t("yes_delete_permanently")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// Helper Components
function Th({ children, className }: { children: React.ReactNode, className?: string }) {
    return <th className={cn("px-4 py-3 border-b border-muted/50 whitespace-nowrap", className)}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode, className?: string }) {
    return <td className={cn("px-4 py-3 text-[14px]", className)}>{children}</td>;
}

function IconButton({ icon: Icon, onClick, title }: { icon: React.ElementType, onClick?: () => void, title?: string }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className="p-2 hover:bg-card hover:text-primary rounded-lg transition-all border border-muted/50 bg-muted/10 text-muted-foreground group active:scale-95"
        >
            <Icon className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
        </button>
    );
}
