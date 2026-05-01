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
    Save
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
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

interface Student {
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
    dob?: string;
    email?: string;
    blood_group?: string;
    religion?: string;
    avatar?: string;
    category?: string;
    student_category?: { category_name: string };
    disable_reason_id?: string;
    school_class_id?: string;
    section_id?: string;
    guardian_name?: string;
    guardian_relation?: string;
    guardian_phone?: string;
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
    const [activeTab, setActiveTab] = useState("list");
    const [students, setStudents] = useState<Student[]>([]);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
    const [sections, setSections] = useState<{ id: number; name: string }[]>([]);
    const [disableReasons, setDisableReasons] = useState<{ id: number; reason: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingAll, setLoadingAll] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    // Pagination state (Disabled Students)
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [from, setFrom] = useState(0);
    const [to, setTo] = useState(0);

    // Pagination state (All Students)
    const [allCurrentPage, setAllCurrentPage] = useState(1);
    const [allLastPage, setAllLastPage] = useState(1);
    const [allTotal, setAllTotal] = useState(0);
    const [allFrom, setAllFrom] = useState(0);
    const [allTo, setAllTo] = useState(0);

    // Fetch classes, sections and disable reasons
    const fetchClassesAndSections = useCallback(async () => {
        try {
            const [classesRes, sectionsRes, reasonsRes] = await Promise.all([
                api.get("/academics/classes?no_paginate=true"),
                api.get("/academics/sections?no_paginate=true"),
                api.get("/disable-reasons?no_paginate=true")
            ]);
            setClasses(classesRes.data.data || []);
            setSections(sectionsRes.data.data || []);
            setDisableReasons(reasonsRes.data.data || []);
        } catch (error) {
            console.error("Error fetching dependencies:", error);
            toast("error", "Failed to load dependencies");
        }
    }, [toast]);

    // Fetch all students
    const fetchAllStudents = useCallback(async (page = 1) => {
        setLoadingAll(true);
        try {
            const response = await api.get("/students", {
                params: { page, limit: 50 }
            });
            const { data, current_page, last_page, total, from, to } = response.data.data;
            setAllStudents(data || []);
            setAllCurrentPage(current_page);
            setAllLastPage(last_page);
            setAllTotal(total);
            setAllFrom(from || 0);
            setAllTo(to || 0);
        } catch (error) {
            console.error("Error fetching all students:", error);
            toast("error", "Failed to fetch all students");
        } finally {
            setLoadingAll(false);
        }
    }, [toast]);

    const handleView = (student: Student) => {
        setSelectedStudent(student);
        setViewDialogOpen(true);
    };

    const handleEdit = (student: Student) => {
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
            toast("error", "Failed to fetch disabled students.");
        } finally {
            setLoading(false);
        }
    }, [searchTerm, toast]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchStudents(1);
        }, 500);
        return () => clearTimeout(timeout);
    }, [fetchStudents]);

    useEffect(() => {
        fetchClassesAndSections();
        fetchAllStudents();
    }, [fetchClassesAndSections, fetchAllStudents]);

    // Export functions
    const exportToCopy = () => {
        if (students.length === 0) {
            toast("error", "No data to copy.");
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
        toast("success", "Copied to clipboard");
    };

    const exportToExcel = () => {
        if (students.length === 0) {
            toast("error", "No data to export.");
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
        toast("success", "Excel file downloaded");
    };

    const exportToPDF = () => {
        if (students.length === 0) {
            toast("error", "No data to export.");
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
        toast("success", "PDF file downloaded");
    };

    const handlePrint = () => {
        window.print();
    };

    const handleRestore = async (id: string) => {
        if (!confirm("Are you sure you want to enable this student?")) return;
        try {
            await api.post(`/students/${id}/toggle-status`, { active: true });
            toast("success", "Student enabled successfully");
            fetchStudents(currentPage);
        } catch (error) {
            toast("error", "Failed to restore student");
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
            toast("success", "Student information updated successfully");
            setEditDialogOpen(false);
            fetchStudents(currentPage);
        } catch (error: any) {
            console.error("Error updating student:", error);
            toast("error", error.response?.data?.message || "Failed to update student information");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Select Criteria Section */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm print:hidden">
                <CardHeader className="border-b border-muted/50 pb-4">
                    <CardTitle className="text-xl font-bold tracking-tight">Select Criteria</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                        <div className="md:col-span-3 space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                Class <span className="text-destructive">*</span>
                            </label>
                             <div className="relative">
                                 <select className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer">
                                     <option value="">Select</option>
                                     {classes.map(c => (
                                         <option key={c.id} value={c.id}>{c.name}</option>
                                     ))}
                                 </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors" />
                            </div>
                        </div>

                        <div className="md:col-span-3 space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                Section
                            </label>
                             <div className="relative">
                                 <select className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer">
                                     <option value="">Select</option>
                                     {sections.map(s => (
                                         <option key={s.id} value={s.id}>{s.name}</option>
                                     ))}
                                 </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors" />
                            </div>
                        </div>

                        <div className="md:col-span-6 space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                Search By Keyword
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Search By Student Name, Roll Number, Etc."
                                    className="h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <Button variant="gradient" className="h-11 px-8 rounded-xl" onClick={() => fetchStudents(1)}>
                                    <Search className="h-4 w-4" /> Search
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
                        List View
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
                        Details View
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
                                    placeholder="Search"
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
                                    <IconButton icon={Printer} onClick={handlePrint} title="Print" />
                                    <IconButton icon={Copy} onClick={exportToCopy} title="Copy" />
                                    <IconButton icon={TableIcon} onClick={exportToExcel} title="Excel" />
                                    <IconButton icon={FileText} onClick={exportToPDF} title="PDF" />
                                    <IconButton icon={Download} onClick={() => students.length > 0 && exportToExcel()} title="Download" />
                                    <IconButton icon={Columns} title="Columns" />
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
                                <div className="overflow-x-auto rounded-xl border border-muted/50 text-slate-700">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            <tr>
                                                <Th>Admission No</Th>
                                                <Th>Roll No</Th>
                                                <Th>Student Name</Th>
                                                <Th>Class</Th>
                                                <Th>Father Name</Th>
                                                <Th>Disable Date</Th>
                                                <Th>Disable Reason</Th>
                                                <Th>Gender</Th>
                                                <Th>Mobile Number</Th>
                                                <Th className="text-right print:hidden">Action</Th>
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
                                                            <ActionBtn icon={RotateCcw} onClick={() => handleRestore(student.id)} className="bg-green-500 hover:bg-green-600" title="Enable" />
                                                            <ActionBtn 
                                                                icon={Eye} 
                                                                className="bg-indigo-500 hover:bg-indigo-600" 
                                                                title="View" 
                                                                onClick={() => handleView(student)}
                                                            />
                                                            <ActionBtn 
                                                                icon={Pencil} 
                                                                className="bg-indigo-500 hover:bg-indigo-600" 
                                                                title="Edit" 
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
                                        <div key={student.id} className="group bg-white rounded-3xl border border-muted/50 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                                            
                                            <div className="relative space-y-4">
                                                <div className="flex items-start justify-between">
                                                    <Avatar className="h-16 w-16 rounded-2xl border-2 border-primary/20 shadow-lg group-hover:scale-105 transition-transform">
                                                        <AvatarImage src={student.avatar} alt={student.name} />
                                                        <AvatarFallback className="bg-gradient-to-br from-primary to-indigo-600 text-white font-bold text-xl uppercase">
                                                            {student.name?.substring(0, 2).toUpperCase() || "ST"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black tracking-tighter">
                                                            {student.admission_no}
                                                        </Badge>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
                                                            Roll: {student.roll_no || "-"}
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
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reason</span>
                                                        <p className="text-xs font-bold text-slate-700 line-clamp-1">{student.reason?.reason || student.disable_reason || "-"}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</span>
                                                        <p className="text-xs font-bold text-slate-700">{formatDate(student.disable_date)}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-2">
                                                    <div className="flex -space-x-2">
                                                        <ActionBtn icon={RotateCcw} onClick={() => handleRestore(student.id)} className="bg-green-500 hover:bg-green-600 rounded-xl" title="Enable" />
                                                        <ActionBtn icon={Eye} onClick={() => handleView(student)} className="bg-indigo-500 hover:bg-indigo-600 rounded-xl ml-2" title="View" />
                                                        <ActionBtn icon={Pencil} onClick={() => handleEdit(student)} className="bg-indigo-500 hover:bg-indigo-600 rounded-xl ml-2" title="Edit" />
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
                                        <p className="text-red-400 font-bold text-sm">No data available in table</p>
                                        <button className="flex items-center gap-2 text-primary hover:underline font-bold text-sm mx-auto transition-all hover:gap-3" onClick={() => fetchStudents(1)}>
                                            <span>←</span> Refresh or search with different criteria.
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-medium print:hidden">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Showing {from} to {to} of {total} entries</p>
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

                {/* All Students Section */}
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden mt-6">
                    <CardHeader className="border-b border-muted/50 pb-4">
                        <CardTitle className="text-xl font-bold tracking-tight">All Students Information</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="min-h-[400px] flex flex-col relative">
                            {loadingAll && (
                                <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            )}
                            <div className="overflow-x-auto rounded-xl border border-muted/50">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        <tr>
                                            <Th>Admission No</Th>
                                            <Th>Roll No</Th>
                                            <Th>Student Name</Th>
                                            <Th>Class</Th>
                                            <Th>Father Name</Th>
                                            <Th>Disable Date</Th>
                                            <Th>Disable Reason</Th>
                                            <Th>Gender</Th>
                                            <Th>Mobile Number</Th>
                                            <Th>Status</Th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-muted/30">
                                        {allStudents.map((student) => (
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
                                                <Td>
                                                    <span className={cn(
                                                        "px-2 py-1 text-xs font-semibold rounded-full",
                                                        student.active
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                    )}>
                                                        {student.active ? "Active" : "Disabled"}
                                                    </span>
                                                </Td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Empty State */}
                            {!loadingAll && allStudents.length === 0 && (
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
                                        <p className="text-red-400 font-bold text-sm">No student data available</p>
                                        <button className="flex items-center gap-2 text-primary hover:underline font-bold text-sm mx-auto transition-all hover:gap-3" onClick={fetchAllStudents}>
                                            <span>←</span> Refresh data
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* All Students Pagination */}
                        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 px-2">
                            <p className="text-sm font-medium text-muted-foreground bg-muted/30 px-4 py-2 rounded-full border border-muted/50">
                                Showing <span className="text-primary font-bold">{allFrom}</span> to <span className="text-primary font-bold">{allTo}</span> of <span className="text-primary font-bold">{allTotal}</span> students
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all disabled:opacity-50"
                                    onClick={() => allCurrentPage > 1 && fetchAllStudents(allCurrentPage - 1)}
                                    disabled={allCurrentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="flex items-center gap-1">
                                    {[...Array(allLastPage)].map((_, i) => {
                                        const page = i + 1;
                                        if (
                                            page === 1 ||
                                            page === allLastPage ||
                                            (page >= allCurrentPage - 1 && page <= allCurrentPage + 1)
                                        ) {
                                            return (
                                                <Button
                                                    key={page}
                                                    variant={allCurrentPage === page ? "default" : "outline"}
                                                    size="icon"
                                                    className={cn(
                                                        "h-8 w-8 rounded-lg transition-all active:scale-95",
                                                        allCurrentPage === page
                                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110"
                                                            : "border-muted/50 text-muted-foreground hover:bg-card"
                                                    )}
                                                    onClick={() => fetchAllStudents(page)}
                                                >
                                                    {page}
                                                </Button>
                                            );
                                        } else if (
                                            page === allCurrentPage - 2 ||
                                            page === allCurrentPage + 2
                                        ) {
                                            return <span key={page} className="text-muted-foreground/50 px-1">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all disabled:opacity-50"
                                    onClick={() => allCurrentPage < allLastPage && fetchAllStudents(allCurrentPage + 1)}
                                    disabled={allCurrentPage === allLastPage}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-background/95 backdrop-blur-md">
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
                                        <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-indigo-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-500" />
                                        <Avatar className="h-32 w-32 md:h-40 md:w-40 rounded-3xl border-4 border-white shadow-xl relative transition-transform duration-500 group-hover:scale-[1.02]">
                                            <AvatarImage src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/storage/${selectedStudent?.avatar}`} />
                                            <AvatarFallback className="bg-primary/5 text-primary text-4xl font-black">
                                                {selectedStudent?.name?.substring(0, 2)?.toUpperCase() || "ST"}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="text-center md:text-left space-y-3">
                                        <Badge variant="secondary" className="px-4 py-1.5 rounded-full bg-primary/10 text-primary border-primary/20 text-xs font-bold uppercase tracking-widest shadow-sm">
                                            Student Profile
                                        </Badge>
                                        <DialogTitle className="text-4xl font-black tracking-tight text-foreground">
                                            {selectedStudent?.name} {selectedStudent?.last_name}
                                        </DialogTitle>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                            <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm bg-white/50 px-3 py-1.5 rounded-xl border border-muted/50">
                                                <BadgeCheck className="h-4 w-4 text-primary" />
                                                ADM: {selectedStudent?.admission_no}
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm bg-white/50 px-3 py-1.5 rounded-xl border border-muted/50">
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
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 px-1">Personal Details</h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            <InfoField label="Date of Birth" value={formatDate(selectedStudent?.dob)} icon={Calendar} />
                                            <InfoField label="Gender" value={selectedStudent?.gender} icon={User} />
                                            <InfoField label="Blood Group" value={selectedStudent?.blood_group || "-"} icon={BadgeCheck} />
                                            <InfoField label="Religion" value={selectedStudent?.religion || "-"} icon={BadgeCheck} />
                                        </div>
                                    </div>
                                    
                                    {/* Contact & Parent Info */}
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/60 px-1">Contact & Guardian</h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            <InfoField label="Mobile Number" value={selectedStudent?.phone} icon={Phone} />
                                            <InfoField label="Email Address" value={selectedStudent?.email || "-"} icon={Mail} />
                                            <InfoField label="Father Name" value={selectedStudent?.father_name} icon={User} />
                                            <InfoField label="Category" value={selectedStudent?.student_category?.category_name || selectedStudent?.category || "-"} icon={BadgeCheck} />
                                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/10 border border-muted/50 group hover:bg-white hover:shadow-md transition-all duration-300">
                                                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-muted group-hover:scale-110 transition-transform">
                                                    <BadgeCheck className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">Status</p>
                                                    <Badge className={cn(
                                                        "mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border-none",
                                                        selectedStudent?.active 
                                                            ? "bg-green-500/10 text-green-600" 
                                                            : "bg-red-500/10 text-red-600"
                                                    )}>
                                                        {selectedStudent?.active ? "Active" : "Disabled"}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <InfoField label="Disable Reason" value={selectedStudent?.reason?.reason || selectedStudent?.disable_reason} icon={FileText} />
                                            <InfoField label="Disable Date" value={formatDate(selectedStudent?.disable_date)} icon={Calendar} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <DialogFooter className="p-6 bg-muted/20 border-t border-muted/50 flex flex-row gap-3">
                                <Button variant="outline" className="flex-1 rounded-2xl h-12 font-bold" onClick={() => setViewDialogOpen(false)}>
                                    Close
                                </Button>
                                <Button 
                                    variant="gradient" 
                                    className="flex-1 rounded-2xl h-12 font-bold"
                                    onClick={() => {
                                        setViewDialogOpen(false);
                                        router.push(`/dashboard/student-information/student-details/${selectedStudent?.id}/edit`);
                                    }}
                                >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit Profile
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Student Modal */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-2xl border-none shadow-2xl rounded-3xl bg-background/95 backdrop-blur-md overflow-hidden p-0">
                    {editingStudent && (
                        <>
                            <DialogHeader className="p-8 bg-gradient-to-br from-indigo-500/10 via-primary/5 to-transparent relative">
                                <div className="absolute top-4 right-4">
                                    <Button variant="ghost" size="icon" onClick={() => setEditDialogOpen(false)} className="rounded-full hover:bg-white/20 transition-all">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-200">
                                        <Pencil className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
                                            Edit Student Information
                                        </DialogTitle>
                                        <DialogDescription className="text-muted-foreground font-medium">
                                            Update the details for <span className="text-primary font-bold">{editingStudent?.name || ""} {editingStudent?.last_name || ""}</span>
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
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/60 px-1">Identification</h4>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Admission No</label>
                                                <Input name="admission_no" defaultValue={editingStudent?.admission_no} className="h-12 rounded-xl bg-muted/30 border-muted/50 focus:bg-white focus:ring-primary/20 transition-all" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Roll No</label>
                                                <Input name="roll_no" defaultValue={editingStudent?.roll_no} className="h-12 rounded-xl bg-muted/30 border-muted/50 focus:bg-white focus:ring-primary/20 transition-all" />
                                            </div>
                                        </div>

                                        {/* Name & Basic Info */}
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 px-1">Basic Information</h4>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">First Name</label>
                                                <Input name="name" defaultValue={editingStudent?.name} className="h-12 rounded-xl bg-muted/30 border-muted/50 focus:bg-white focus:ring-primary/20 transition-all" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Last Name</label>
                                                <Input name="last_name" defaultValue={editingStudent?.last_name} className="h-12 rounded-xl bg-muted/30 border-muted/50 focus:bg-white focus:ring-primary/20 transition-all" />
                                            </div>
                                        </div>

                                        {/* Class & Contact */}
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/60 px-1">Academic & Contact</h4>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Mobile Number</label>
                                                <Input name="phone" defaultValue={editingStudent?.phone} className="h-12 rounded-xl bg-muted/30 border-muted/50 focus:bg-white focus:ring-primary/20 transition-all" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Disable Reason</label>
                                                <div className="relative">
                                                    <select 
                                                        name="disable_reason" 
                                                        defaultValue={editingStudent?.disable_reason}
                                                        className="flex h-12 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-white focus-visible:border-primary transition-all appearance-none cursor-pointer"
                                                    >
                                                        <option value="">Select Reason</option>
                                                        {disableReasons.map(r => (
                                                            <option key={r.id} value={r.id}>{r.reason}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Disable Date</label>
                                                <Input 
                                                    name="disable_date" 
                                                    type="date" 
                                                    defaultValue={editingStudent?.disable_date} 
                                                    className="h-12 rounded-xl bg-muted/30 border-muted/50 focus:bg-white focus:ring-primary/20 transition-all" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter className="p-6 bg-muted/20 border-t border-muted/50 flex flex-row gap-3">
                                    <Button type="button" variant="outline" className="flex-1 rounded-2xl h-12 font-bold" onClick={() => setEditDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        variant="gradient" 
                                        className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-primary/20"
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                                        Save Changes
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
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/10 border border-muted/50 group hover:bg-white hover:shadow-md transition-all duration-300">
            <div className="p-2.5 bg-white rounded-xl shadow-sm border border-muted group-hover:scale-110 transition-transform">
                <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">{label}</p>
                <p className="text-sm font-bold text-foreground">{value || "N/A"}</p>
            </div>
        </div>
    );
}
