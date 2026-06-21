"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
    ChevronDown,
    Printer,
    FileText,
    Table as TableIcon,
    Download,
    Columns,
    Copy,
    Loader2,
    Trash2,
    Plus,
    UserCircle,
    ChevronLeft,
    ChevronRight,
    User,
    GitBranch,
    Filter
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
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useImageUrl } from "@/lib/image-url";
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

interface MultiClassRecord {
    id: string;
    student: {
        admission_no: string;
        name: string;
        last_name: string;
        phone: string;
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
    const { toast } = useToast();

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
                    school_class_id: selectedClass,
                    section_id: selectedSection,
                    search: kw,
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
            toast("error", "Failed to fetch records.");
        } finally {
            setLoading(false);
        }
    }, [selectedClass, selectedSection, toast]);

    useEffect(() => {
        fetchDropdowns();
    }, [fetchDropdowns]);

    // Export functions
    const exportToCopy = () => {
        if (records.length === 0) return;
        const headers = ["Admission No", "Student Name", "Class", "Section", "Mobile Number"];
        const rows = records.map(r => [
            r.student.admission_no,
            `${r.student.name} ${r.student.last_name}`,
            r.school_class.name,
            r.section.name,
            r.student.phone
        ]);
        const text = [headers.join("\t"), ...rows.map(row => row.join("\t"))].join("\n");
        navigator.clipboard.writeText(text);
        toast("success", "Copied to clipboard");
    };

    const exportToExcel = () => {
        if (records.length === 0) return;
        const data = records.map(r => ({
            "Admission No": r.student.admission_no,
            "Student Name": `${r.student.name} ${r.student.last_name}`,
            "Class": r.school_class.name,
            "Section": r.section.name,
            "Mobile Number": r.student.phone
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Multi Class Students");
        XLSX.writeFile(workbook, "multi_class_students.xlsx");
        toast("success", "Excel file downloaded");
    };

    const exportToPDF = () => {
        if (records.length === 0) return;
        const doc = new jsPDF();
        autoTable(doc, {
            head: [["Adm No", "Student Name", "Class", "Section", "Mobile"]],
            body: records.map(r => [
                r.student.admission_no,
                `${r.student.name} ${r.student.last_name}`,
                r.school_class.name,
                r.section.name,
                r.student.phone
            ]),
        });
        doc.save("multi_class_students.pdf");
        toast("success", "PDF file downloaded");
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to remove this enrollment?")) return;
        try {
            await api.delete(`/multi-class-students/${id}`);
            toast("success", "Enrollment removed successfully");
            fetchRecords(currentPage, searchTerm);
        } catch (error) {
            toast("error", "Failed to remove enrollment");
        }
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addFormData.user_id || !addFormData.school_class_id || !addFormData.section_id) {
            toast("error", "Please fill all required fields");
            return;
        }

        setLoading(true);
        try {
            await api.post("/multi-class-students", addFormData);
            toast("success", "Student assigned to additional class successfully");
            setIsAddDialogOpen(false);
            setAddFormData({ user_id: "", school_class_id: "", section_id: "" });
            fetchRecords(currentPage, searchTerm);
        } catch (error) {
            const message = (error as any)?.response?.data?.message || "Failed to assign student";
            toast("error", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                        <UserCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Multi Class Student</h1>
                        <p className="text-sm text-muted-foreground font-medium">Manage students enrolled in additional classes</p>
                    </div>
                </div>
                <Button
                    variant="gradient"
                    className="h-12 px-6 rounded-lg shadow-lg shadow-primary/20 font-bold"
                    onClick={() => setIsAddDialogOpen(true)}
                >
                    <Plus className="h-5 w-5 mr-2" /> Add Multi-Class Enrollment
                </Button>
            </div>

            {/* Select Criteria Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 print:hidden">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Select Criteria</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">Filter by class and section</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                Class <span className="text-destructive">*</span>
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
                                    <option value="">Select</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors" />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                Section <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    className="flex h-11 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer"
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                >
                                    <option value="">Select</option>
                                    {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between mt-6 gap-4">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by student..."
                                className="pl-10 h-10 rounded-lg bg-muted/30 border-muted/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && fetchRecords(1, searchTerm)}
                            />
                        </div>
                        <Button variant="gradient" className="h-11 px-8 rounded-lg" onClick={() => {
                            if (!selectedClass || !selectedSection) {
                                toast("error", "Please select Class and Section first.");
                                return;
                            }
                            setCurrentPage(1);
                            fetchRecords(1, searchTerm);
                        }} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Toolbar Panel */}
            <div className="flex justify-end gap-2 print:hidden mb-4">
                <IconButton icon={Printer} onClick={() => window.print()} title="Print" />
                <IconButton icon={Copy} onClick={exportToCopy} title="Copy" />
                <IconButton icon={TableIcon} onClick={exportToExcel} title="Excel" />
                <IconButton icon={FileText} onClick={exportToPDF} title="PDF" />
                <IconButton icon={Download} onClick={exportToExcel} title="Download" />
                <IconButton icon={Columns} title="Columns" />
            </div>

            {/* Data Table */}
            {(searched || loading) ? (
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <GitBranch className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Multi Class Student List</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{totalRecords} records</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    <tr>
                                        <Th className="w-16">Avatar</Th>
                                        <Th>Admission No</Th>
                                        <Th>Student Name</Th>
                                        <Th>Category</Th>
                                        <Th>Class</Th>
                                        <Th>Section</Th>
                                        <Th>Mobile Number</Th>
                                        <Th className="text-right print:hidden">Action</Th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-muted/30">
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={8} />
                                    ) : records.length === 0 ? (
                                        <tr><td colSpan={8} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">No data found</td></tr>
                                    ) : (
                                        records.map((record) => (
                                            <tr key={record.id} className="hover:bg-muted/10 transition-colors">
                                                <Td>
                                                    <div className="h-10 w-10 rounded-full border-2 border-muted overflow-hidden bg-muted/20">
                                                        {(record.student as any)?.avatar ? (
                                                            <img
                                                                src={getImageUrl((record.student as any).avatar)}
                                                                alt="Avatar"
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                                                <User className="h-5 w-5" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </Td>
                                                <Td className="font-semibold text-primary">{record.student.admission_no}</Td>
                                                <Td className="font-medium">{record.student.name} {record.student.last_name}</Td>
                                                <Td>
                                                    <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
                                                        {(record.student as any).student_category?.category_name || (record.student as any).category || "General"}
                                                    </span>
                                                </Td>
                                                <Td>{record.school_class.name}</Td>
                                                <Td>{record.section.name}</Td>
                                                <Td>{record.student.phone}</Td>
                                                <Td className="text-right print:hidden">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-all"
                                                        onClick={() => handleDelete(record.id)}
                                                        title="Remove Enrollment"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </Td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Section */}
                        {!loading && records.length > 0 && (
                            <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-muted/10 border-t border-muted/50">
                                <p className="text-xs text-muted-foreground font-medium">
                                    Showing {(currentPage - 1) * 50 + 1} to {Math.min(currentPage * 50, totalRecords)} of {totalRecords} entries
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="icon"
                                        className="h-8 w-8 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white"
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
                                                    className={cn(
                                                        "h-8 w-8 rounded-[10px] text-xs font-bold",
                                                        currentPage === page
                                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md scale-105"
                                                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
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
                <div className="flex flex-col items-center justify-center py-20 text-gray-300 bg-white rounded-lg border border-dashed border-gray-200 shadow-sm print:hidden">
                    <User className="h-16 w-16 mb-4 opacity-10" />
                    <p className="text-[12px] font-medium uppercase tracking-[.2em] text-gray-400">No Data Selected</p>
                    <p className="text-[11px] text-gray-400 mt-2 italic">Select class and section, then click search.</p>
                </div>
            )}

            {/* Add Enrollment Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-lg border-none shadow-2xl">
                    <DialogHeader className="p-8 bg-primary/5 border-b border-primary/10 relative">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary text-white rounded-lg shadow-lg">
                                <Plus className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-bold text-slate-800 tracking-tight">
                                    Add Multi-Class Enrollment
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground font-medium mt-1">
                                    Enroll a student into an additional class and section.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleAddSubmit}>
                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                        Select Student <span className="text-destructive">*</span>
                                    </label>
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Filter students by name or admission no..."
                                                className="pl-10 h-11 rounded-lg bg-muted/30 border-muted/50 focus:bg-white"
                                                value={studentSearch}
                                                onChange={(e) => setStudentSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="relative">
                                            <select
                                                className="flex h-12 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-white focus-visible:border-primary transition-all appearance-none cursor-pointer"
                                                value={addFormData.user_id}
                                                onChange={(e) => setAddFormData({ ...addFormData, user_id: e.target.value })}
                                                required
                                            >
                                                <option value="">Select Student</option>
                                                {allStudents
                                                    .filter(s =>
                                                        `${s.name} ${s.last_name} ${s.admission_no}`.toLowerCase().includes(studentSearch.toLowerCase())
                                                    )
                                                    .slice(0, 100)
                                                    .map(s => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.name} {s.last_name} ({s.admission_no})
                                                        </option>
                                                    ))
                                                }
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 group">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                            Additional Class <span className="text-destructive">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                className="flex h-12 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-white focus-visible:border-primary transition-all appearance-none cursor-pointer"
                                                value={addFormData.school_class_id}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setAddFormData({ ...addFormData, school_class_id: val, section_id: "" });
                                                    fetchSections(val, true);
                                                }}
                                                required
                                            >
                                                <option value="">Select Class</option>
                                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="space-y-2 group">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                            Additional Section <span className="text-destructive">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                className="flex h-12 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-white focus-visible:border-primary transition-all appearance-none cursor-pointer"
                                                value={addFormData.section_id}
                                                onChange={(e) => setAddFormData({ ...addFormData, section_id: e.target.value })}
                                                required
                                            >
                                                <option value="">Select Section</option>
                                                {dialogSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-8 bg-muted/20 border-t border-muted/50 flex gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 h-12 rounded-lg font-bold border-muted/50"
                                onClick={() => setIsAddDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="gradient"
                                className="flex-1 h-12 rounded-lg font-bold shadow-lg shadow-primary/20"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
                                Assign Class
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Helper Components
function Th({ children, className }: { children: React.ReactNode, className?: string }) {
    return <th className={cn("px-6 py-4 border-b border-muted/50 ml-1", className)}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode, className?: string }) {
    return <td className={cn("px-6 py-4 text-sm", className)}>{children}</td>;
}

function IconButton({ icon: Icon, onClick, title }: { icon: React.ElementType, onClick?: () => void, title?: string }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className="p-2.5 hover:bg-card hover:text-primary rounded-lg transition-all border border-muted/50 bg-muted/10 text-muted-foreground shadow-sm active:scale-95 group"
        >
            <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
        </button>
    );
}
