"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
    ChevronDown,
    AlertCircle,
    Printer,
    FileText,
    Table as TableIcon,
    FileDown,
    Download,
    Columns,
    Copy,
    Loader2,
    Trash2,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
    const { toast } = useToast();

    const fetchDropdowns = useCallback(async () => {
        try {
            const [classRes, sectionRes] = await Promise.all([
                api.get("/academics/classes"),
                api.get("/academics/sections")
            ]);
            setClasses(classRes.data.data);
            setSections(sectionRes.data.data);
        } catch (error) {
            console.error("Error fetching dropdowns:", error);
        }
    }, []);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/students", {
                params: {
                    school_class_id: selectedClass,
                    section_id: selectedSection,
                    search: searchTerm,
                    page: currentPage,
                    limit: 50
                }
            });
            setStudents(response.data.data.data);
            setTotalPages(response.data.data.last_page);
            setTotalStudents(response.data.data.total);
            setSelectedIds(new Set()); // Reset selections when data changes
        } catch (error) {
            console.error("Error fetching students:", error);
            toast("error", "Failed to fetch students.");
        } finally {
            setLoading(false);
        }
    }, [selectedClass, selectedSection, searchTerm, currentPage, toast]);

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
            toast("error", "Please select at least one student.");
            return;
        }

        if (!confirm(`Are you sure you want to delete ${selectedIds.size} selected students? This action cannot be undone.`)) {
            return;
        }

        setLoading(true);
        try {
            await api.post("/students/bulk-delete", { ids: Array.from(selectedIds) });
            toast("success", "Students deleted successfully.");
            fetchStudents();
        } catch (error) {
            console.error("Error deleting students:", error);
            toast("error", "Failed to delete students.");
        } finally {
            setLoading(false);
        }
    };

    // Export functions
    const exportToCopy = () => {
        if (students.length === 0) return;
        const headers = ["Admission No", "Student Name", "Class", "Section", "DOB", "Gender", "Category", "Mobile Number"];
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
        toast("success", "Copied to clipboard");
    };

    const exportToExcel = () => {
        if (students.length === 0) return;
        const data = students.map(s => ({
            "Admission No": s.admission_no,
            "Student Name": `${s.name} ${s.last_name}`,
            "Class": s.school_class?.name || "",
            "Section": s.section?.name || "",
            "Date Of Birth": s.dob,
            "Gender": s.gender,
            "Category": s.category,
            "Mobile Number": s.phone
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
        XLSX.writeFile(workbook, "students_list.xlsx");
        toast("success", "Excel file downloaded");
    };

    const exportToPDF = () => {
        if (students.length === 0) return;
        const doc = new jsPDF();
        autoTable(doc, {
            head: [["Adm No", "Name", "Class", "Sec", "DOB", "Gender", "Cat", "Mobile"]],
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
        toast("success", "PDF file downloaded");
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Select Criteria Section */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm print:hidden">
                <CardHeader className="border-b border-muted/50 pb-4">
                    <CardTitle className="text-xl font-bold tracking-tight">Select Criteria</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                Class
                            </label>
                            <div className="relative">
                                <select
                                    className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer"
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                >
                                    <option value="">Select</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors" />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                Section
                            </label>
                            <div className="relative">
                                <select
                                    className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all appearance-none cursor-pointer"
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

                    <div className="flex justify-end mt-6">
                        <Button variant="gradient" className="h-11 px-8 rounded-xl" onClick={() => { setCurrentPage(1); fetchStudents(); }} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search
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
                            <span className="text-sm font-bold text-muted-foreground whitespace-nowrap">Select All</span>
                        </div>
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                className="pl-10 h-10 rounded-lg bg-muted/30 border-muted/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
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
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </Button>
                        <div className="h-8 w-px bg-muted mx-1" />
                        <IconButton icon={Printer} onClick={() => window.print()} title="Print" />
                        <IconButton icon={Copy} onClick={exportToCopy} title="Copy" />
                        <IconButton icon={TableIcon} onClick={exportToExcel} title="Excel" />
                        <IconButton icon={FileText} onClick={exportToPDF} title="PDF" />
                        <IconButton icon={Download} onClick={exportToExcel} title="Download" />
                        <IconButton icon={Columns} title="Columns" />
                    </div>
                </div>

                {students.length > 0 ? (
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-muted/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        <tr>
                                            <Th className="w-10">#</Th>
                                            <Th>Admission No</Th>
                                            <Th>Student Name</Th>
                                            <Th>Class</Th>
                                            <Th>Date Of Birth</Th>
                                            <Th>Gender</Th>
                                            <Th>Category</Th>
                                            <Th>Mobile Number</Th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-muted/30">
                                        {students.map((student) => (
                                            <tr key={student.id} className="hover:bg-muted/10 transition-colors">
                                                <Td>
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-muted/50 text-primary focus:ring-primary/20 cursor-pointer"
                                                        checked={selectedIds.has(student.id)}
                                                        onChange={() => handleSelectOne(student.id)}
                                                    />
                                                </Td>
                                                <Td className="font-semibold text-primary">{student.admission_no}</Td>
                                                <Td className="font-medium text-destructive">{student.name} {student.last_name}</Td>
                                                <Td>{student.school_class?.name}({student.section?.name})</Td>
                                                <Td>{student.dob}</Td>
                                                <Td>{student.gender}</Td>
                                                <Td>{student.category || "General"}</Td>
                                                <Td>{student.phone}</Td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-muted/10 border-t border-muted/50">
                                <p className="text-xs text-muted-foreground font-medium">
                                    Showing {(currentPage - 1) * 50 + 1} to {Math.min(currentPage * 50, totalStudents)} of {totalStudents} entries
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg"
                                        disabled={currentPage === 1 || loading}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
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
                                                    variant={currentPage === page ? "gradient" : "outline"}
                                                    className={cn(
                                                        "h-8 w-8 rounded-lg text-xs font-bold",
                                                        currentPage === page && "shadow-md scale-105"
                                                    )}
                                                    onClick={() => setCurrentPage(page)}
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
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg"
                                        disabled={currentPage === totalPages || loading}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : !loading && (
                    <div className="px-6 py-4 bg-red-100/80 border border-red-200 rounded-xl text-red-600 font-bold text-sm shadow-sm flex items-center gap-3 animate-in slide-in-from-top-2">
                        <AlertCircle className="h-5 w-5 opacity-80" />
                        No Record Found
                    </div>
                )}

                {loading && (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper Components
function Th({ children, className }: { children: React.ReactNode, className?: string }) {
    return <th className={cn("px-4 py-3 border-b border-muted/50 whitespace-nowrap", className)}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode, className?: string }) {
    return <td className={cn("px-4 py-3 text-xs", className)}>{children}</td>;
}

function IconButton({ icon: Icon, onClick, title }: { icon: any, onClick?: () => void, title?: string }) {
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
