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
    RotateCcw
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

interface Student {
    id: string;
    admission_no: string;
    name: string;
    last_name: string;
    school_class?: { name: string };
    section?: { name: string };
    father_name: string;
    disable_reason: string;
    disable_date: string;
    gender: string;
    phone: string;
    active: boolean;
}

export default function DisabledStudentsPage() {
    const [activeTab, setActiveTab] = useState("list");
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [from, setFrom] = useState(0);
    const [to, setTo] = useState(0);

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

    // Export functions
    const exportToCopy = () => {
        if (students.length === 0) {
            toast("error", "No data to copy.");
            return;
        }
        const headers = ["Admission No", "Student Name", "Class", "Father Name", "Disable Reason", "Gender", "Mobile Number"];
        const rows = students.map(s => [
            s.admission_no,
            `${s.name} ${s.last_name} `,
            `${s.school_class?.name || ""} (${s.section?.name || ""})`,
            s.father_name,
            s.disable_reason || "-",
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
            "Student Name": `${s.name} ${s.last_name} `,
            "Class": `${s.school_class?.name || ""} (${s.section?.name || ""})`,
            "Father Name": s.father_name,
            "Disable Reason": s.disable_reason || "-",
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
            head: [["Adm No", "Student Name", "Class", "Father", "Disable Reason", "Gender", "Mobile"]],
            body: students.map(s => [
                s.admission_no,
                `${s.name} ${s.last_name} `,
                `${s.school_class?.name || ""} (${s.section?.name || ""})`,
                s.father_name,
                s.disable_reason || "-",
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
            await api.post(`/ students / ${id}/toggle-status`, { active: true });
            toast("success", "Student enabled successfully");
            fetchStudents(currentPage);
        } catch (error) {
            toast("error", "Failed to restore student");
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
                                    <option>Class 1</option>
                                    <option>Class 2</option>
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
                                    <option>A</option>
                                    <option>B</option>
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
                            <div className="overflow-x-auto rounded-xl border border-muted/50">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        <tr>
                                            <Th>Admission No</Th>
                                            <Th>Student Name</Th>
                                            <Th>Class</Th>
                                            <Th>Father Name</Th>
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
                                                <Td className="font-semibold">{student.name} {student.last_name}</Td>
                                                <Td>{student.school_class?.name || ""}({student.section?.name || ""})</Td>
                                                <Td>{student.father_name}</Td>
                                                <Td>{student.disable_reason || "-"}</Td>
                                                <Td>{student.gender}</Td>
                                                <Td>{student.phone}</Td>
                                                <Td className="text-right print:hidden">
                                                    <div className="flex justify-end gap-1">
                                                        <ActionBtn icon={RotateCcw} onClick={() => handleRestore(student.id)} className="bg-green-500 hover:bg-green-600" title="Enable" />
                                                        <ActionBtn icon={Eye} className="bg-indigo-500 hover:bg-indigo-600" title="View" />
                                                        <ActionBtn icon={Pencil} className="bg-indigo-500 hover:bg-indigo-600" title="Edit" />
                                                        <ActionBtn icon={Trash2} className="bg-red-500 hover:bg-red-600" title="Delete" />
                                                    </div>
                                                </Td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

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
            </div>
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
