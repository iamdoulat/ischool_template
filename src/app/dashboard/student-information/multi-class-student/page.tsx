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
    Trash2
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
    const [records, setRecords] = useState<MultiClassRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
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

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/multi-class-students", {
                params: {
                    school_class_id: selectedClass,
                    section_id: selectedSection,
                    search: searchTerm
                }
            });
            setRecords(response.data.data.data);
        } catch (error) {
            console.error("Error fetching multi-class records:", error);
            toast("error", "Failed to fetch records.");
        } finally {
            setLoading(false);
        }
    }, [selectedClass, selectedSection, searchTerm, toast]);

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
            fetchRecords();
        } catch (error) {
            toast("error", "Failed to remove enrollment");
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                        <div className="space-y-2 group">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                Class <span className="text-destructive">*</span>
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
                                Section <span className="text-destructive">*</span>
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

                    <div className="flex justify-between mt-6 gap-4">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by student..."
                                className="pl-10 h-10 rounded-lg bg-muted/30 border-muted/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="gradient" className="h-11 px-8 rounded-xl" onClick={fetchRecords} disabled={loading}>
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
            {records.length > 0 ? (
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    <tr>
                                        <Th>Admission No</Th>
                                        <Th>Student Name</Th>
                                        <Th>Class</Th>
                                        <Th>Section</Th>
                                        <Th>Mobile Number</Th>
                                        <Th className="text-right print:hidden">Action</Th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-muted/30">
                                    {records.map((record) => (
                                        <tr key={record.id} className="hover:bg-muted/10 transition-colors">
                                            <Td className="font-semibold text-primary">{record.student.admission_no}</Td>
                                            <Td className="font-medium">{record.student.name} {record.student.last_name}</Td>
                                            <Td>{record.school_class.name}</Td>
                                            <Td>{record.section.name}</Td>
                                            <Td>{record.student.phone}</Td>
                                            <Td className="text-right print:hidden">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-white hover:bg-destructive rounded-lg transition-all"
                                                    onClick={() => handleDelete(record.id)}
                                                    title="Remove Enrollment"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </Td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
    );
}

// Helper Components
function Th({ children, className }: { children: React.ReactNode, className?: string }) {
    return <th className={cn("px-6 py-4 border-b border-muted/50 ml-1", className)}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode, className?: string }) {
    return <td className={cn("px-6 py-4 text-sm", className)}>{children}</td>;
}

function IconButton({ icon: Icon, onClick, title }: { icon: any, onClick?: () => void, title?: string }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className="p-2.5 hover:bg-card hover:text-primary rounded-xl transition-all border border-muted/50 bg-muted/10 text-muted-foreground shadow-sm active:scale-95 group"
        >
            <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
        </button>
    );
}
