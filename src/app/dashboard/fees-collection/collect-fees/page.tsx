"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
    ListFilter,
    Users,
    ChevronDown,
    Plus,
    FolderSearch,
    FileSpreadsheet,
    FileText,
    FileCode,
    Printer,
    Eye,
    Wallet
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface SchoolClass {
    id: number;
    name: string;
    sections?: Section[];
}

interface Section {
    id: number;
    name: string;
}

interface Student {
    id: number;
    name: string;
    last_name: string;
    admission_no: string;
    roll_no: string;
    dob: string;
    phone: string;
    father_name: string;
    schoolClass?: { name: string };
    section?: { name: string };
}

export default function CollectFeesPage() {
    const { toast } = useToast();
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);

    // Search states
    const [classId, setClassId] = useState("");
    const [sectionId, setSectionId] = useState("");
    const [keyword, setKeyword] = useState("");

    const fetchInitialData = useCallback(async () => {
        try {
            const [classesRes] = await Promise.all([
                api.get("/academics/classes?no_paginate=true")
            ]);
            setClasses(classesRes.data.data.data || classesRes.data.data);
        } catch (error) {
            toast("error", "Failed to fetch initial data");
        }
    }, [toast]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setClassId(id);
        setSectionId("");
        const selectedClass = classes.find(c => c.id === parseInt(id));
        setSections(selectedClass?.sections || []);
    };

    const handleSearch = async (type: 'criteria' | 'keyword') => {
        setLoading(true);
        try {
            const params: any = {};
            if (type === 'criteria') {
                if (classId) params.school_class_id = classId;
                if (sectionId) params.section_id = sectionId;
            } else {
                if (keyword) params.search = keyword;
            }

            const response = await api.get("/fee-collection/students", { params });
            const data = response.data.data;
            setStudents(Array.isArray(data) ? data : (data.data || []));

            if ((Array.isArray(data) ? data.length : data.data.length) === 0) {
                toast("error", "No students found matching your criteria");
            }
        } catch (error) {
            toast("error", "Search failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    const exportTable = (format: 'excel' | 'csv' | 'pdf') => {
        if (students.length === 0) {
            toast("error", "No data to export");
            return;
        }

        const exportData = students.map(s => ({
            "Class": s.schoolClass?.name || "",
            "Section": s.section?.name || "",
            "Admission No": s.admission_no,
            "Student Name": `${s.name} ${s.last_name}`,
            "Father Name": s.father_name,
            "Date of Birth": s.dob,
            "Mobile No": s.phone
        }));

        if (format === 'excel' || format === 'csv') {
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
            XLSX.writeFile(workbook, `student_list.${format === 'excel' ? 'xlsx' : 'csv'}`);
        } else if (format === 'pdf') {
            const doc = new jsPDF() as any;
            doc.autoTable({
                head: [["Class", "Section", "Admission No", "Student Name", "Father Name", "DOB", "Mobile No"]],
                body: exportData.map(d => Object.values(d)),
            });
            doc.save("student_list.pdf");
        }
    };

    const printTable = () => {
        if (students.length === 0) {
            toast("error", "No data to print");
            return;
        }
        window.print();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Toolbar Card */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden mb-6">
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="font-bold text-lg tracking-tight">Collect Fees</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 border-muted/50 text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => exportTable('excel')}
                        >
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Excel
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 border-muted/50 text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => exportTable('csv')}
                        >
                            <FileCode className="h-4 w-4 mr-2" />
                            CSV
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 border-muted/50 text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => exportTable('pdf')}
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            PDF
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 border-muted/50 text-muted-foreground hover:text-primary transition-colors"
                            onClick={printTable}
                        >
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Select Criteria Card */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-muted/50 flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <ListFilter className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="font-bold text-lg tracking-tight">Select Criteria</h2>
                </div>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                    Class <span className="text-destructive">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={classId}
                                        onChange={handleClassChange}
                                        className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all"
                                    >
                                        <option value="">Select Class</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                    Section
                                </label>
                                <div className="relative">
                                    <select
                                        value={sectionId}
                                        onChange={(e) => setSectionId(e.target.value)}
                                        className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all"
                                    >
                                        <option value="">Select Section</option>
                                        {sections.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <div className="sm:col-span-2 flex justify-end">
                                <Button
                                    variant="gradient"
                                    className="h-11 px-8 rounded-xl font-bold"
                                    onClick={() => handleSearch('criteria')}
                                    disabled={loading}
                                >
                                    {loading ? "Searching..." : (
                                        <>
                                            <Search className="h-4 w-4 mr-2" />
                                            Search
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4 border-l border-muted/50 pl-8 hidden md:block">
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                    Search By Keyword
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        placeholder="Search By Student Name, Roll Number Etc."
                                        className="h-11 pl-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                        value={keyword}
                                        onChange={(e) => setKeyword(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch('keyword')}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    variant="gradient"
                                    className="h-11 px-8 rounded-xl font-bold"
                                    onClick={() => handleSearch('keyword')}
                                    disabled={loading}
                                >
                                    {loading ? "Searching..." : (
                                        <>
                                            <Search className="h-4 w-4 mr-2" />
                                            Search
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden print:shadow-none print:bg-white">
                <div className="px-6 py-4 border-b border-muted/50 flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Users className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="font-bold text-lg tracking-tight">Student List</h2>
                </div>

                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/30">
                                {[
                                    "Class", "Section", "Admission No", "Student Name",
                                    "Father Name", "Date Of Birth", "Mobile No.", "Action"
                                ].map((header) => (
                                    <th key={header} className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 whitespace-nowrap">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-muted/50">
                            {students.map((student) => (
                                <tr key={student.id} className="group hover:bg-muted/20 transition-colors border-b border-muted/50">
                                    <td className="px-6 py-4 text-xs font-bold text-muted-foreground">{student.schoolClass?.name}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-muted-foreground">{student.section?.name}</td>
                                    <td className="px-6 py-4 text-xs font-black text-primary hover:text-primary/80 transition-colors cursor-pointer">{student.admission_no}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-foreground capitalize">{`${student.name} ${student.last_name}`}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-muted-foreground capitalize">{student.father_name}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-muted-foreground italic">{student.dob}</td>
                                    <td className="px-6 py-4 text-xs font-bold text-muted-foreground">{student.phone}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="gradient"
                                                size="sm"
                                                className="h-8 px-4 rounded-lg font-bold text-[10px] shadow-lg shadow-primary/20"
                                                onClick={() => window.location.href = `/dashboard/fees-collection/collect-fees/student/${student.id}`}
                                            >
                                                <Wallet className="h-3 w-3 mr-2" />
                                                Collect Fee
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Empty State */}
                    {students.length === 0 && (
                        <div className="py-24 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="relative group">
                                <div className="absolute -inset-4 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="relative p-8 bg-muted/30 rounded-[2.5rem] border border-muted/50 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                    <img
                                        src="https://cdn-icons-png.flaticon.com/512/7486/7486744.png"
                                        alt="No Data"
                                        className="h-24 w-24 object-contain opacity-80 drop-shadow-2xl grayscale group-hover:grayscale-0 transition-all duration-500"
                                    />
                                    <div className="absolute -bottom-2 -right-2 p-3 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-muted/50">
                                        <FolderSearch className="h-6 w-6 text-amber-500" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <p className="text-destructive font-semibold text-xs transition-colors">
                                    {loading ? "Searching for students..." : "No data available in table"}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-muted/10 border-t border-muted/50 flex items-center justify-between">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                        Showing 0 to 0 of 0 entries
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all">
                            <ChevronDown className="h-4 w-4 rotate-90" />
                        </Button>
                        <Button className="h-8 w-8 rounded-lg border-none p-0 text-white font-bold active:scale-95 transition-all shadow-md shadow-orange-500/10 bg-gradient-to-br from-[#FF9800] to-[#4F39F6]">1</Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all">
                            <ChevronDown className="h-4 w-4 -rotate-90" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
