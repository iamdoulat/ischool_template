"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
    FileText,
    Table as TableIcon,
    Printer,
    FileDown,
    ChevronDown,
    LayoutList,
    LayoutGrid,
    Plus,
    FileSearch,
    Download,
    Columns,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Copy,
    Check,
    Pencil,
    Trash2,
    Eye,
    RotateCcw,
    X,
    BadgeCheck,
    GraduationCap,
    Calendar,
    User,
    Phone,
    Mail,
    Save,
    UserX
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { useTranslation } from "@/hooks/use-translation";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useImageUrl } from "@/lib/image-url";

interface IDisabledStudent {
    id: string;
    admission_no: string;
    roll_no?: string;
    name: string;
    last_name: string;
    school_class?: { name: string };
    section?: { name: string };
    father_name: string;
    disable_reason: string;
    reason?: { reason: string };
    disable_date: string;
    gender: string;
    phone: string;
    active: boolean;
    [key: string]: any;
}

const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};



export default function DisabledStudentsPage() {
    const getImageUrl = useImageUrl();
    const [activeTab, setActiveTab] = useState("list");
    const [students, setStudents] = useState<IDisabledStudent[]>([]);
    const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
    const [sections, setSections] = useState<{ id: number; name: string }[]>([]);
    const [disableReasons, setDisableReasons] = useState<{ id: number; reason: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [editingStudent, setEditingStudent] = useState<any | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const tt = useTranslateToast();
    const { t } = useTranslation();
    const router = useRouter();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [from, setFrom] = useState(0);
    const [to, setTo] = useState(0);
    const [selectedClassId, setSelectedClassId] = useState("");
    const [selectedSectionId, setSelectedSectionId] = useState("");

    // Fetch classes, sections and disable reasons
    const fetchClassesAndReasons = useCallback(async () => {
        try {
            const [classesRes, reasonsRes] = await Promise.all([
                api.get("/academics/classes?no_paginate=true"),
                api.get("/disable-reasons?no_paginate=true")
            ]);
            setClasses(classesRes.data.data || []);
            setDisableReasons(reasonsRes.data.data || []);
        } catch (error) {
            console.error("Error fetching dependencies:", error);
            tt.error("failed_to_load_dependencies");
        }
    }, [tt]);

    const fetchSections = async (classId: string) => {
        if (!classId) {
            setSections([]);
            return;
        }
        try {
            const response = await api.get(`/academics/sections?school_class_id=${classId}&no_paginate=true`);
            setSections(response.data.data || []);
        } catch (error) {
            console.error("Error fetching sections:", error);
        }
    };


    const handleView = (student: IDisabledStudent) => {
        setSelectedStudent(student);
        setViewDialogOpen(true);
    };

    const handleEdit = (student: IDisabledStudent) => {
        setEditingStudent(student);
        setEditDialogOpen(true);
    };

    const fetchStudents = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get("/students/disabled", {
                params: {
                    page,
                    search: searchTerm,
                    school_class_id: selectedClassId,
                    section_id: selectedSectionId,
                    limit: 50
                }
            });
            const { data, current_page, last_page, total, from, to } = response.data.data;
            setStudents(data);
            setCurrentPage(current_page);
            setLastPage(last_page);
            setTotal(total);
            setFrom(from || 0);
            setTo(to || 0);
        } catch (error) {
            console.error("Error fetching disabled students:", error);
            tt.error("failed_to_fetch_disabled_students");
        } finally {
            setLoading(false);
        }
    }, [searchTerm, selectedClassId, selectedSectionId, tt]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchStudents(1);
        }, 500);
        return () => clearTimeout(timeout);
    }, [fetchStudents]);

    useEffect(() => {
        fetchClassesAndReasons();
    }, [fetchClassesAndReasons]);

    // Export functions
    const exportToCopy = () => {
        if (students.length === 0) {
            tt.error("no_data_to_copy");
            return;
        }
        const headers = ["Admission No", "Roll No", "Student Name", "Class", "Father Name", "Disable Date", "Disable Reason", "Gender", "Mobile Number"];
        const rows = students.map(s => [
            s.admission_no,
            s.roll_no || "-",
            `${s.name} ${s.last_name} `,
            `${s.school_class?.name || ""} (${s.section?.name || ""})`,
            s.father_name,
            formatDate(s.disable_date),
            s.reason?.reason || s.disable_reason || "-",
            s.gender,
            s.phone
        ]);
        const text = [headers.join("\t"), ...rows.map(r => r.join("\t"))].join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const exportToExcel = () => {
        if (students.length === 0) {
            tt.error("no_data_to_export");
            return;
        }
        const data = students.map(s => ({
            "Admission No": s.admission_no,
            "Roll No": s.roll_no || "-",
            "Student Name": `${s.name} ${s.last_name} `,
            "Class": `${s.school_class?.name || ""} (${s.section?.name || ""})`,
            "Father Name": s.father_name,
            "Disable Date": formatDate(s.disable_date),
            "Disable Reason": s.reason?.reason || s.disable_reason || "-",
            "Gender": s.gender,
            "Mobile Number": s.phone
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Disabled Students");
        XLSX.writeFile(workbook, "disabled_students.xlsx");
        tt.success("excel_file_downloaded");
    };

    const exportToPDF = () => {
        if (students.length === 0) {
            tt.error("no_data_to_export");
            return;
        }
        const doc = new jsPDF("landscape");
        autoTable(doc, {
            head: [["Adm No", "Roll No", "Student Name", "Class", "Father", "Disable Date", "Disable Reason", "Gender", "Mobile"]],
            body: students.map(s => [
                s.admission_no,
                s.roll_no || "-",
                `${s.name} ${s.last_name} `,
                `${s.school_class?.name || ""} (${s.section?.name || ""})`,
                s.father_name,
                formatDate(s.disable_date),
                s.reason?.reason || s.disable_reason || "-",
                s.gender,
                s.phone
            ]),
            styles: { fontSize: 8 },
        });
        doc.save("disabled_students.pdf");
        tt.success("pdf_file_downloaded");
    };

    const handlePrint = () => {
        window.print();
    };

    const handleRestore = async (id: string) => {
        if (!confirm(t("are_you_sure_enable_student"))) return;
        try {
            await api.post(`/students/${id}/toggle-status`, { active: true });
            tt.success("student_enabled_successfully");
            fetchStudents(currentPage);
        } catch (error) {
            tt.error("failed_to_restore_student");
        }
    };

    const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingStudent) return;
        
        setLoading(true);
        try {
            const formData = new FormData(e.currentTarget);
            const data = {
                name: formData.get("name"),
                last_name: formData.get("last_name"),
                admission_no: formData.get("admission_no"),
                roll_no: formData.get("roll_no"),
                phone: formData.get("phone"),
                disable_reason: formData.get("disable_reason"),
                disable_date: formData.get("disable_date"),
                school_class_id: formData.get("school_class_id"),
                section_id: formData.get("section_id"),
                guardian_name: formData.get("guardian_name"),
                guardian_relation: formData.get("guardian_relation"),
                guardian_phone: formData.get("guardian_phone"),
                gender: editingStudent.gender,
                dob: editingStudent.dob,
            };
            
            await api.put(`/students/${editingStudent.id}`, data);
            tt.success("student_information_updated_successfully");
            setEditDialogOpen(false);
            fetchStudents(currentPage);
        } catch (error: any) {
            console.error("Error updating student:", error);
            tt.error(error.response?.data?.message || t("failed_to_update_student_information"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Select Criteria Section */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm print:hidden pt-0 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <UserX className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("disabled_students")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{t("search_and_manage_disabled_student_records")}</p>
                        </div>
                    </div>
                </div>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                        <div className="md:col-span-3 space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                {t("class")} <span className="text-destructive">*</span>
                            </label>
                             <div className="relative">
                                 <select
                                     className="flex h-11 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer"
                                     value={selectedClassId}
                                     onChange={(e) => {
                                         const val = e.target.value;
                                         setSelectedClassId(val);
                                         setSelectedSectionId("");
                                         fetchSections(val);
                                     }}
                                 >
                                     <option value="">{t("select")}</option>
                                     {classes.map(c => (
                                         <option key={c.id} value={c.id}>{c.name}</option>
                                     ))}
                                 </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors" />
                            </div>
                        </div>

                        <div className="md:col-span-3 space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                {t("section")}
                            </label>
                             <div className="relative">
                                 <select
                                     className="flex h-11 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer"
                                     value={selectedSectionId}
                                     onChange={(e) => setSelectedSectionId(e.target.value)}
                                 >
                                     <option value="">{t("select")}</option>
                                     {sections.map(s => (
                                         <option key={s.id} value={s.id}>{s.name}</option>
                                     ))}
                                 </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors" />
                            </div>
                        </div>

                        <div className="md:col-span-6 space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                {t("search_by_keyword")}
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder={t("search_by_student_name_roll_number_etc")}
                                    className="h-11 rounded-lg bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <Button variant="gradient" className="h-11 px-8 rounded-lg" onClick={() => fetchStudents(1)}>
                                    <Search className="h-4 w-4" /> {t("search")}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* View Selection & Table Section */}
            <div className="space-y-4">
                {/* Tabs */}
                <div className="flex border-b border-muted/50 print:hidden">
                    <button
                        onClick={() => setActiveTab("list")}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all relative",
                            activeTab === "list" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <LayoutList className="h-4 w-4" />
                        {t("list_view")}
                        {activeTab === "list" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab("details")}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all relative",
                            activeTab === "details" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <LayoutGrid className="h-4 w-4" />
                        {t("details_view")}
                        {activeTab === "details" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
                    </button>
                </div>

                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden print:shadow-none print:border-none">
                    <CardContent className="p-6">
                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 print:hidden">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t("search")}
                                    className="pl-10 h-10 rounded-lg bg-muted/30 border-muted/50"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 mr-4">
                                    <span className="text-sm font-semibold text-muted-foreground">50</span>
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex gap-1">
                                    <IconButton icon={Printer} onClick={handlePrint} title={t("print")} />
                                    <IconButton icon={Copy} onClick={exportToCopy} title={t("copy")} />
                                    <IconButton icon={TableIcon} onClick={exportToExcel} title={t("excel")} />
                                    <IconButton icon={FileText} onClick={exportToPDF} title={t("pdf")} />
                                    <IconButton icon={Download} onClick={() => students.length > 0 && exportToExcel()} title={t("download")} />
                                    <IconButton icon={Columns} title={t("columns")} />
                                </div>
                            </div>
                        </div>

                        {/* List View Table */}
                        <div className="min-h-[400px] flex flex-col relative">
                            {loading && (
                                <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            )}

                            {activeTab === "list" ? (
                                <div className="overflow-x-auto rounded-lg border border-muted/50 text-slate-700">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            <tr>
                                                <Th>{t("admission_no")}</Th>
                                                <Th>{t("roll_no")}</Th>
                                                <Th>{t("student_name")}</Th>
                                                <Th>{t("class")}</Th>
                                                <Th>{t("father_name")}</Th>
                                                <Th>{t("disable_date")}</Th>
                                                <Th>{t("disable_reason")}</Th>
                                                <Th>{t("gender")}</Th>
                                                <Th>{t("mobile_number")}</Th>
                                                <Th className="text-right print:hidden">{t("action")}</Th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-muted/30">
                                            {students.map((student) => (
                                                <tr key={student.id} className="hover:bg-muted/10 transition-colors">
                                                    <Td><span className="font-semibold text-primary/80">{student.admission_no}</span></Td>
                                                    <Td>{student.roll_no || "-"}</Td>
                                                    <Td className="font-semibold">{student.name} {student.last_name}</Td>
                                                    <Td>{student.school_class?.name || ""}({student.section?.name || ""})</Td>
                                                    <Td>{student.father_name}</Td>
                                                    <Td>{formatDate(student.disable_date)}</Td>
                                                    <Td>{student.reason?.reason || student.disable_reason || "-"}</Td>
                                                    <Td>{student.gender}</Td>
                                                    <Td>{student.phone}</Td>
                                                    <Td className="text-right print:hidden">
                                                        <div className="flex justify-end gap-1">
                                                            <ActionBtn icon={RotateCcw} onClick={() => handleRestore(student.id)} className="bg-green-500 hover:bg-green-600" title={t("enable")} />
                                                            <ActionBtn
                                                                icon={Eye}
                                                                className="bg-indigo-500 hover:bg-indigo-600"
                                                                title={t("view")}
                                                                onClick={() => handleView(student)}
                                                            />
                                                            <ActionBtn
                                                                icon={Pencil}
                                                                className="bg-indigo-500 hover:bg-indigo-600"
                                                                title={t("edit")}
                                                                onClick={() => handleEdit(student)}
                                                            />
                                                        </div>
                                                    </Td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {students.map((student) => (
                                        <div key={student.id} className="group bg-white rounded-lg border border-muted/50 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                                            
                                            <div className="relative space-y-4">
                                                <div className="flex items-start justify-between">
                                                    <Avatar className="h-16 w-16 rounded-lg border-2 border-primary/20 shadow-lg group-hover:scale-105 transition-transform">
                                                        <AvatarImage src={getImageUrl(student.avatar)} alt={student.name} />
                                                        <AvatarFallback className="bg-gradient-to-br from-primary to-indigo-600 text-white font-bold text-xl uppercase">
                                                            {student.name?.substring(0, 2).toUpperCase() || "ST"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black tracking-tighter">
                                                            {student.admission_no}
                                                        </Badge>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
                                                            {t("roll")}: {student.roll_no || "-"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <h3 className="font-black text-lg text-slate-800 leading-tight group-hover:text-primary transition-colors">
                                                        {student.name} {student.last_name}
                                                    </h3>
                                                    <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                                        <GraduationCap className="h-3 w-3" />
                                                        {student.school_class?.name || ""}({student.section?.name || ""})
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 py-4 border-y border-muted/50">
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("reason")}</span>
                                                        <p className="text-xs font-bold text-slate-700 line-clamp-1">{student.reason?.reason || student.disable_reason || "-"}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("date")}</span>
                                                        <p className="text-xs font-bold text-slate-700">{formatDate(student.disable_date)}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-2">
                                                    <div className="flex -space-x-2">
                                                        <ActionBtn icon={RotateCcw} onClick={() => handleRestore(student.id)} className="bg-green-500 hover:bg-green-600 rounded-lg" title={t("enable")} />
                                                        <ActionBtn icon={Eye} onClick={() => handleView(student)} className="bg-indigo-500 hover:bg-indigo-600 rounded-lg ml-2" title={t("view")} />
                                                        <ActionBtn icon={Pencil} onClick={() => handleEdit(student)} className="bg-indigo-500 hover:bg-indigo-600 rounded-lg ml-2" title={t("edit")} />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                                                        {student.gender}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Empty State */}
                            {!loading && students.length === 0 && (
                                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-6">
                                    <div className="relative">
                                        <div className="absolute -inset-4 bg-primary/5 rounded-full blur-2xl animate-pulse" />
                                        <div className="relative bg-muted/20 p-8 rounded-full border border-muted/50">
                                            <FileSearch className="h-16 w-16 text-muted-foreground/30" />
                                        </div>
                                        <div className="absolute top-0 right-0 bg-primary/10 p-2 rounded-lg -rotate-12 border border-primary/20">
                                            <Plus className="h-4 w-4 text-primary" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 max-w-xs">
                                        <p className="text-red-400 font-bold text-sm">{t("no_data_available_in_table")}</p>
                                        <button className="flex items-center gap-2 text-primary hover:underline font-bold text-sm mx-auto transition-all hover:gap-3" onClick={() => fetchStudents(1)}>
                                            <span>←</span> {t("refresh_or_search_with_different_criteria")}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-medium print:hidden">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t("showing_x_to_y_of_z", { from, to, total })}</p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all disabled:opacity-50"
                                    onClick={() => currentPage > 1 && fetchStudents(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                {Array.from({ length: lastPage || 1 }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        className={cn(
                                            "h-8 w-8 rounded-lg border-none p-0 font-bold active:scale-95 transition-all shadow-md",
                                            currentPage === page
                                                ? "bg-gradient-to-br from-[#FF9800] to-[#4F39F6] text-white shadow-orange-500/10"
                                                : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                                        )}
                                        onClick={() => fetchStudents(page)}
                                    >
                                        {page}
                                    </Button>
                                ))}

                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all disabled:opacity-50"
                                    onClick={() => currentPage < lastPage && fetchStudents(currentPage + 1)}
                                    disabled={currentPage === lastPage}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded-lg bg-background/95 backdrop-blur-md">
                    {selectedStudent && (
                        <>
                            <DialogHeader className="p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent relative">
                                <div className="absolute top-4 right-4">
                                    <Button variant="ghost" size="icon" onClick={() => setViewDialogOpen(false)} className="rounded-full hover:bg-white/20 transition-all">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-indigo-500 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-500" />
                                        <Avatar className="h-32 w-32 md:h-40 md:w-40 rounded-lg border-4 border-white shadow-xl relative transition-transform duration-500 group-hover:scale-[1.02]">
                                            <AvatarImage src={getImageUrl(selectedStudent?.avatar)} />
                                            <AvatarFallback className="bg-primary/5 text-primary text-4xl font-black">
                                                {selectedStudent?.name?.substring(0, 2)?.toUpperCase() || "ST"}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="text-center md:text-left space-y-3">
                                        <Badge variant="secondary" className="px-4 py-1.5 rounded-full bg-primary/10 text-primary border-primary/20 text-xs font-bold uppercase tracking-widest shadow-sm">
                                            {t("student_profile")}
                                        </Badge>
                                        <DialogTitle className="text-4xl font-black tracking-tight text-foreground">
                                            {selectedStudent?.name} {selectedStudent?.last_name}
                                        </DialogTitle>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                            <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm bg-white/50 px-3 py-1.5 rounded-lg border border-muted/50">
                                                <BadgeCheck className="h-4 w-4 text-primary" />
                                                {t("adm")}: {selectedStudent?.admission_no}
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm bg-white/50 px-3 py-1.5 rounded-lg border border-muted/50">
                                                <GraduationCap className="h-4 w-4 text-indigo-500" />
                                                {selectedStudent?.school_class?.name} ({selectedStudent?.section?.name})
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </DialogHeader>
                            
                            <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Personal Info */}
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 px-1">{t("personal_details")}</h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            <InfoField label={t("date_of_birth")} value={formatDate(selectedStudent?.dob)} icon={Calendar} />
                                            <InfoField label={t("gender")} value={selectedStudent?.gender} icon={User} />
                                            <InfoField label={t("blood_group")} value={selectedStudent?.blood_group || "-"} icon={BadgeCheck} />
                                            <InfoField label={t("religion")} value={selectedStudent?.religion || "-"} icon={BadgeCheck} />
                                        </div>
                                    </div>
                                    
                                    {/* Contact & Parent Info */}
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/60 px-1">{t("contact_and_guardian")}</h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            <InfoField label={t("mobile_number")} value={selectedStudent?.phone} icon={Phone} />
                                            <InfoField label={t("email_address")} value={selectedStudent?.email || "-"} icon={Mail} />
                                            <InfoField label={t("father_name")} value={selectedStudent?.father_name} icon={User} />
                                            <InfoField label={t("category")} value={selectedStudent?.student_category?.category_name || selectedStudent?.category || "-"} icon={BadgeCheck} />
                                            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/10 border border-muted/50 group hover:bg-white hover:shadow-md transition-all duration-300">
                                                <div className="p-2.5 bg-white rounded-lg shadow-sm border border-muted group-hover:scale-110 transition-transform">
                                                    <BadgeCheck className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">{t("status")}</p>
                                                    <Badge className={cn(
                                                        "mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border-none",
                                                        selectedStudent?.active
                                                            ? "bg-green-500/10 text-green-600"
                                                            : "bg-red-500/10 text-red-600"
                                                    )}>
                                                        {selectedStudent?.active ? t("active") : t("disabled")}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <InfoField label={t("disable_reason")} value={selectedStudent?.reason?.reason || selectedStudent?.disable_reason} icon={FileText} />
                                            <InfoField label={t("disable_date")} value={formatDate(selectedStudent?.disable_date)} icon={Calendar} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <DialogFooter className="p-6 bg-muted/20 border-t border-muted/50 flex flex-row gap-3">
                                <Button variant="outline" className="flex-1 rounded-lg h-12 font-bold" onClick={() => setViewDialogOpen(false)}>
                                    {t("close")}
                                </Button>
                                <Button
                                    variant="gradient"
                                    className="flex-1 rounded-lg h-12 font-bold"
                                    onClick={() => {
                                        setViewDialogOpen(false);
                                        router.push(`/dashboard/student-information/student-details/${selectedStudent?.id}/edit`);
                                    }}
                                >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    {t("edit_profile")}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Student Modal */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-2xl border-none shadow-2xl rounded-lg bg-background/95 backdrop-blur-md overflow-hidden p-0">
                    {editingStudent && (
                        <>
                            <DialogHeader className="p-8 bg-gradient-to-br from-indigo-500/10 via-primary/5 to-transparent relative">
                                <div className="absolute top-4 right-4">
                                    <Button variant="ghost" size="icon" onClick={() => setEditDialogOpen(false)} className="rounded-full hover:bg-white/20 transition-all">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-3 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-200">
                                        <Pencil className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
                                            {t("edit_student_information")}
                                        </DialogTitle>
                                        <DialogDescription className="text-muted-foreground font-medium">
                                            {t("update_the_details_for")} <span className="text-primary font-bold">{editingStudent?.name || ""} {editingStudent?.last_name || ""}</span>
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                            
                            <form onSubmit={handleEditSubmit}>
                                <input type="hidden" name="school_class_id" value={editingStudent?.school_class_id || ""} />
                                <input type="hidden" name="section_id" value={editingStudent?.section_id || ""} />
                                <input type="hidden" name="guardian_name" value={editingStudent?.guardian_name || ""} />
                                <input type="hidden" name="guardian_relation" value={editingStudent?.guardian_relation || ""} />
                                <input type="hidden" name="guardian_phone" value={editingStudent?.guardian_phone || ""} />
                                <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Core Identification */}
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/60 px-1">{t("identification")}</h4>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("admission_no")}</label>
                                                <Input name="admission_no" defaultValue={editingStudent?.admission_no} className="h-12 rounded-lg bg-muted/30 border-muted/50 focus:bg-white focus:ring-primary/20 transition-all" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("roll_no")}</label>
                                                <Input name="roll_no" defaultValue={editingStudent?.roll_no} className="h-12 rounded-lg bg-muted/30 border-muted/50 focus:bg-white focus:ring-primary/20 transition-all" />
                                            </div>
                                        </div>

                                        {/* Name & Basic Info */}
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 px-1">{t("basic_information")}</h4>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("first_name")}</label>
                                                <Input name="name" defaultValue={editingStudent?.name} className="h-12 rounded-lg bg-muted/30 border-muted/50 focus:bg-white focus:ring-primary/20 transition-all" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("last_name")}</label>
                                                <Input name="last_name" defaultValue={editingStudent?.last_name} className="h-12 rounded-lg bg-muted/30 border-muted/50 focus:bg-white focus:ring-primary/20 transition-all" />
                                            </div>
                                        </div>

                                        {/* Class & Contact */}
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/60 px-1">{t("academic_and_contact")}</h4>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("mobile_number")}</label>
                                                <Input name="phone" defaultValue={editingStudent?.phone} className="h-12 rounded-lg bg-muted/30 border-muted/50 focus:bg-white focus:ring-primary/20 transition-all" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("disable_reason")}</label>
                                                <div className="relative">
                                                    <select 
                                                        name="disable_reason" 
                                                        defaultValue={editingStudent?.disable_reason}
                                                        className="flex h-12 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-white focus-visible:border-primary transition-all appearance-none cursor-pointer"
                                                    >
                                                        <option value="">{t("select_reason")}</option>
                                                        {disableReasons.map(r => (
                                                            <option key={r.id} value={r.id}>{r.reason}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("disable_date")}</label>
                                                <Input 
                                                    name="disable_date" 
                                                    type="date" 
                                                    defaultValue={editingStudent?.disable_date} 
                                                    className="h-12 rounded-lg bg-muted/30 border-muted/50 focus:bg-white focus:ring-primary/20 transition-all" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter className="p-6 bg-muted/20 border-t border-muted/50 flex flex-row gap-3">
                                    <Button type="button" variant="outline" className="flex-1 rounded-lg h-12 font-bold" onClick={() => setEditDialogOpen(false)}>
                                        {t("cancel")}
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="gradient"
                                        className="flex-1 rounded-lg h-12 font-bold shadow-lg shadow-primary/20"
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                                        {t("save_changes")}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Helper Components
function Th({ children, className }: { children: React.ReactNode, className?: string }) {
    return <th className={cn("px-4 py-4 border-b border-muted/50", className)}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode, className?: string }) {
    return <td className={cn("px-4 py-4 text-sm font-medium text-slate-600", className)}>{children}</td>;
}

function IconButton({ icon: Icon, onClick, title }: { icon: any, onClick?: () => void, title?: string }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className="p-2 hover:bg-muted rounded-lg transition-colors border border-muted/50 text-muted-foreground hover:text-foreground shadow-sm group"
        >
            <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
        </button>
    );
}

function ActionBtn({ icon: Icon, className, onClick, title }: { icon: any, className?: string, onClick?: () => void, title?: string }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={cn("p-1.5 text-white rounded transition-all hover:shadow-md hover:scale-110", className)}
        >
            <Icon className="h-3.5 w-3.5" />
        </button>
    );
}

function InfoField({ label, value, icon: Icon }: { label: string, value?: string, icon: any }) {
    return (
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/10 border border-muted/50 group hover:bg-white hover:shadow-md transition-all duration-300">
            <div className="p-2.5 bg-white rounded-lg shadow-sm border border-muted group-hover:scale-110 transition-transform">
                <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">{label}</p>
                <p className="text-sm font-bold text-foreground">{value || "N/A"}</p>
            </div>
        </div>
    );
}
