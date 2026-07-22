"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    Search,
    ChevronDown,
    FolderSearch,
    FileSpreadsheet,
    FileText,
    FileCode,
    Printer,
    Wallet,
    Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('en-GB');
};

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-5">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

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
    last_name?: string;
    admission_no?: string;
    roll_no?: string;
    dob?: string;
    phone?: string;
    father_name?: string;
    schoolClass?: { name?: string; class?: string };
    school_class?: { name?: string; class?: string };
    section?: { name?: string; section?: string };
    class_name?: string;
    section_name?: string;
}

const getClassDisplay = (student: Student): string => {
    const sc = student.schoolClass || student.school_class || (student as any).class;
    if (!sc) return (student as any).class_name || (student as any).class || "-";
    if (typeof sc === 'string') return sc;
    return sc.name || sc.class || (student as any).class_name || (student as any).class || "-";
};

const getSectionDisplay = (student: Student): string => {
    const sec = student.section;
    if (!sec) return (student as any).section_name || (student as any).section || "-";
    if (typeof sec === 'string') return sec;
    return sec.name || sec.section || (student as any).section_name || (student as any).section || "-";
};

function CollectFeesContent() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const searchParams = useSearchParams();
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
            const [classesRes, studentsRes] = await Promise.all([
                api.get("/academics/classes?no_paginate=true"),
                api.get("/fee-collection/search-students")
            ]);
            setClasses(classesRes.data?.data?.data || classesRes.data?.data || []);
            
            const data = studentsRes.data?.data;
            if (!searchParams.get("student_id")) {
                setStudents(Array.isArray(data) ? data : (data?.data || []));
            }
        } catch (error) {
            tt.error("failed_to_fetch_initial_data");
        }
    }, [searchParams, tt]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    // Auto-load student from ?student_id= query param
    useEffect(() => {
        const studentId = searchParams.get("student_id");
        if (!studentId) return;
        setLoading(true);
        api.get(`/students/${studentId}`)
            .then(res => {
                const s = res.data?.data || res.data;
                if (s) setStudents([s]);
            })
            .catch(() => tt.error("failed_to_load_student"))
            .finally(() => setLoading(false));
    }, [searchParams]);

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
            const params: Record<string, string | number> = {};
            if (type === 'criteria') {
                if (classId) params.school_class_id = classId;
                if (sectionId) params.section_id = sectionId;
            } else {
                if (keyword) params.search = keyword;
            }

            const response = await api.get("/fee-collection/search-students", { params });
            const data = response.data.data;
            setStudents(Array.isArray(data) ? data : (data.data || []));

            if ((Array.isArray(data) ? data.length : data.data.length) === 0) {
                tt.error("no_students_found_matching_your_criteria");
            }
        } catch (error) {
            tt.error("search_failed_please_try_again");
        } finally {
            setLoading(false);
        }
    };
    const exportTable = (format: 'excel' | 'csv' | 'pdf') => {
        if (students.length === 0) {
            tt.error("no_data_to_export");
            return;
        }

        const exportData = students.map(s => ({
            "Class": getClassDisplay(s),
            "Section": getSectionDisplay(s),
            "Admission No": s.admission_no || "",
            "Student Name": `${s.name || ""} ${s.last_name || ""}`.trim(),
            "Father Name": s.father_name || "",
            "Date of Birth": formatDate(s.dob),
            "Mobile No": s.phone || ""
        }));

        if (format === 'excel' || format === 'csv') {
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
            XLSX.writeFile(workbook, `student_list.${format === 'excel' ? 'xlsx' : 'csv'}`);
        } else if (format === 'pdf') {
            const doc = new jsPDF();
            autoTable(doc, {
                head: [["Class", "Section", "Admission No", "Student Name", "Father Name", "DOB", "Mobile No"]],
                body: exportData.map(d => Object.values(d)),
            });
            doc.save("student_list.pdf");
        }
    };

    const printTable = () => {
        if (students.length === 0) {
            tt.error("no_data_to_print");
            return;
        }
        window.print();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Toolbar Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 mb-6">
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Wallet className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("collect_fees")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{students.length} {t("students_listed")}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 border-muted/50 text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => exportTable('excel')}
                        >
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            {t("excel")}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 border-muted/50 text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => exportTable('csv')}
                        >
                            <FileCode className="h-4 w-4 mr-2" />
                            {t("csv")}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 border-muted/50 text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => exportTable('pdf')}
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            {t("pdf")}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 border-muted/50 text-muted-foreground hover:text-primary transition-colors"
                            onClick={printTable}
                        >
                            <Printer className="h-4 w-4 mr-2" />
                            {t("print")}
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* Select Criteria Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("select_criteria")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("search_students_to_collect_fees")}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                    {t("class")} <span className="text-destructive">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={classId}
                                        onChange={handleClassChange}
                                        className="flex h-11 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all"
                                    >
                                        <option value="">{t("select_class")}</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                    {t("section")}
                                </label>
                                <div className="relative">
                                    <select
                                        value={sectionId}
                                        onChange={(e) => setSectionId(e.target.value)}
                                        className="flex h-11 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all"
                                    >
                                        <option value="">{t("select_section")}</option>
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
                                    className="h-11 px-8 rounded-lg font-bold"
                                    onClick={() => handleSearch('criteria')}
                                    disabled={loading}
                                >
                                    {loading ? t("searching") : (
                                        <>
                                            <Search className="h-4 w-4 mr-2" />
                                            {t("search")}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4 border-l border-muted/50 pl-8 hidden md:block">
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                    {t("search_by_keyword")}
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        placeholder={t("search_by_student_name_roll_no_etc")}
                                        className="h-11 pl-11 rounded-lg bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                        value={keyword}
                                        onChange={(e) => setKeyword(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch('keyword')}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    variant="gradient"
                                    className="h-11 px-8 rounded-lg font-bold"
                                    onClick={() => handleSearch('keyword')}
                                    disabled={loading}
                                >
                                    {loading ? t("searching") : (
                                        <>
                                            <Search className="h-4 w-4 mr-2" />
                                            {t("search")}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 print:shadow-none print:bg-white">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Wallet className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("student_list")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{students.length} {t("students_found")}</p>
                    </div>
                </CardHeader>

                <div className="p-0 overflow-x-auto">
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow className="bg-muted/10 border-b border-muted/20">
                                {[
                                    t("class"), t("section"), t("admission_no"), t("student_name"),
                                    t("father_name"), t("date_of_birth"), t("mobile_no"), t("action")
                                ].map((header, index) => (
                                    <TableHead key={header} className={cn(
                                        "py-5 font-bold text-slate-800 whitespace-nowrap",
                                        header === t("action") ? "text-right pr-8" : "",
                                        index === 0 ? "pl-8" : ""
                                    )}>
                                        {header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-muted/10">
                            {loading ? (
                                <TableSkeleton rows={5} cols={8} />
                            ) : (
                                students.map((student) => (
                                    <TableRow key={student.id} className="hover:bg-muted/10 transition-colors group border-b border-muted/50 last:border-none">
                                        <TableCell className="py-4 pl-8 text-sm font-semibold text-slate-600">{getClassDisplay(student)}</TableCell>
                                        <TableCell className="py-4 text-sm font-semibold text-slate-600">{getSectionDisplay(student)}</TableCell>
                                        <TableCell className="py-4 text-sm font-bold text-slate-600">{student.admission_no || '-'}</TableCell>
                                        <TableCell className="py-4 text-sm font-bold text-slate-800 capitalize">{`${student.name || ''} ${student.last_name || ''}`.trim()}</TableCell>
                                        <TableCell className="py-4 text-sm font-semibold text-slate-600 capitalize">{student.father_name || '-'}</TableCell>
                                        <TableCell className="py-4 text-sm font-semibold text-slate-600">{formatDate(student.dob)}</TableCell>
                                        <TableCell className="py-4 text-sm font-semibold text-slate-600">{student.phone || '-'}</TableCell>
                                        <TableCell className="py-4 pr-8 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="gradient"
                                                    size="sm"
                                                    className="h-8 px-4 rounded-lg font-bold text-[10px] shadow-lg shadow-primary/20"
                                                    onClick={() => window.location.href = `/dashboard/fees-collection/collect-fees/student/${student.id}`}
                                                >
                                                    <Wallet className="h-3 w-3 mr-2" />
                                                    {t("collect_fee")}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Empty State */}
                    {!loading && students.length === 0 && (
                        <div className="py-24 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="relative group">
                                <div className="absolute -inset-4 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="relative p-8 bg-muted/30 rounded-[2.5rem] border border-muted/50 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                    <img
                                        src="https://cdn-icons-png.flaticon.com/512/7486/7486744.png"
                                        alt="No Data"
                                        className="h-24 w-24 object-contain opacity-80 drop-shadow-2xl grayscale group-hover:grayscale-0 transition-all duration-500"
                                    />
                                    <div className="absolute -bottom-2 -right-2 p-3 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-muted/50">
                                        <FolderSearch className="h-6 w-6 text-amber-500" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <p className="text-destructive font-semibold text-xs transition-colors">
                                    {t("no_data_available_in_table")}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-muted/10 border-t border-muted/50 flex items-center justify-between">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                        {t("showing_x_to_y_of_z", { from: 0, to: 0, total: 0 })}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-card active:scale-95 transition-all">
                            <ChevronDown className="h-4 w-4 rotate-90" />
                        </Button>
                        <Button className="h-8 w-8 rounded-[10px] border-none p-0 text-white font-bold active:scale-95 transition-all shadow-md shadow-orange-500/10 bg-gradient-to-r from-[#FF9800] to-[#6366F1]">1</Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-card active:scale-95 transition-all">
                            <ChevronDown className="h-4 w-4 -rotate-90" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default function CollectFeesPage() {
    return (
        <Suspense fallback={<div className="p-8 flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
            <CollectFeesContent />
        </Suspense>
    );
}
