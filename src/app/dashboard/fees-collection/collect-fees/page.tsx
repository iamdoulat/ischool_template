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
import { cn, formatDate, toLocaleNumber } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
    const { t, language } = useTranslation();
    const shortCode = language?.short_code || "en";
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

    const getLocalizedClassName = (name?: string) => {
        if (!name || name === "-") return "-";
        const num = name.replace(/[^0-9]/g, "");
        if (num) {
            const locNum = toLocaleNumber(num, shortCode);
            if (shortCode === "bn") return `ক্লাস ${locNum}`;
            if (shortCode === "hi") return `कक्षा ${locNum}`;
            if (shortCode === "ar") return `الصف ${locNum}`;
            return `Class ${locNum}`;
        }
        const key = name.toLowerCase().replace(/[\s-]+/g, "_");
        const trans = t(key);
        return trans !== key ? trans : name;
    };

    const getLocalizedSectionName = (name?: string) => {
        if (!name || name === "-") return "-";
        const secLabel = shortCode === "bn" ? "শাখা" : shortCode === "hi" ? "अनुभाग" : shortCode === "ar" ? "قسم" : "Section";
        const key = name.toLowerCase().replace(/[\s-]+/g, "_");
        const trans = t(key);
        if (trans !== key) return `${secLabel} ${trans}`;
        return `${secLabel} ${name}`;
    };

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
            "Class": getLocalizedClassName(getClassDisplay(s)),
            "Section": getLocalizedSectionName(getSectionDisplay(s)),
            "Admission No": s.admission_no || "",
            "Student Name": `${s.name || ""} ${s.last_name || ""}`.trim(),
            "Father Name": s.father_name || "",
            "Date of Birth": s.dob ? formatDate(s.dob) : "-",
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
                head: [[t("class"), t("section"), t("admission_no"), t("student_name"), t("father_name"), t("date_of_birth"), t("mobile_no")]],
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
        <div className="space-y-5 animate-in fade-in duration-500 font-sans">
            {/* Toolbar Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] overflow-hidden p-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-200/60">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Wallet className="h-4.5 w-4.5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("collect_fees")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {toLocaleNumber(students.length, shortCode)} {t("students_listed")}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 bg-white/90 hover:bg-white border-gray-200 text-gray-600 hover:text-indigo-600 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                            onClick={() => exportTable('excel')}
                        >
                            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                            {t("excel")}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 bg-white/90 hover:bg-white border-gray-200 text-gray-600 hover:text-indigo-600 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                            onClick={() => exportTable('csv')}
                        >
                            <FileCode className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                            {t("csv")}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 bg-white/90 hover:bg-white border-gray-200 text-gray-600 hover:text-indigo-600 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                            onClick={() => exportTable('pdf')}
                        >
                            <FileText className="h-3.5 w-3.5 mr-1.5 text-rose-600" />
                            {t("pdf")}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 bg-white/90 hover:bg-white border-gray-200 text-gray-600 hover:text-indigo-600 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                            onClick={printTable}
                        >
                            <Printer className="h-3.5 w-3.5 mr-1.5 text-slate-600" />
                            {t("print")}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Select Criteria Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden p-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-200/60">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-4.5 w-4.5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("select_criteria")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("search_students_to_collect_fees")}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                        {/* Criteria Search */}
                        <div className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                                <div className="space-y-1.5 group">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">
                                        {t("class")} <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={classId}
                                            onChange={handleClassChange}
                                            className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all font-medium"
                                        >
                                            <option value="">{t("select_class")}</option>
                                            {classes.map(c => (
                                                <option key={c.id} value={c.id}>{getLocalizedClassName(c.name)}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-1.5 group">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">
                                        {t("section")}
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={sectionId}
                                            onChange={(e) => setSectionId(e.target.value)}
                                            className="flex h-9 w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all font-medium"
                                        >
                                            <option value="">{t("select_section")}</option>
                                            {sections.map(s => (
                                                <option key={s.id} value={s.id}>{getLocalizedSectionName(s.name)}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <Button
                                    className="btn-gradient h-9 px-6 rounded-lg font-bold text-xs uppercase shrink-0 shadow-md cursor-pointer"
                                    onClick={() => handleSearch('criteria')}
                                    disabled={loading}
                                >
                                    {loading ? t("searching") : (
                                        <>
                                            <Search className="h-3.5 w-3.5 mr-1.5" />
                                            {t("search")}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Keyword Search */}
                        <div className="space-y-2 border-t lg:border-t-0 lg:border-l border-gray-200/80 pt-5 lg:pt-0 lg:pl-6">
                            <div className="space-y-1.5 group">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-0.5">
                                    {t("search_by_keyword")}
                                </label>
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <Input
                                            placeholder={t("search_by_student_name_roll_no_etc")}
                                            className="h-9 pl-9 rounded-lg bg-white border-gray-200 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all text-xs font-medium w-full shadow-2xs"
                                            value={keyword}
                                            onChange={(e) => setKeyword(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch('keyword')}
                                        />
                                    </div>
                                    <Button
                                        className="btn-gradient h-9 px-6 rounded-lg font-bold text-xs uppercase shrink-0 shadow-md cursor-pointer"
                                        onClick={() => handleSearch('keyword')}
                                        disabled={loading}
                                    >
                                        {loading ? t("searching") : (
                                            <>
                                                <Search className="h-3.5 w-3.5 mr-1.5" />
                                                {t("search")}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Student List Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden p-0 print:shadow-none print:bg-white">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-3.5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-200/60">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Wallet className="h-4.5 w-4.5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("student_list")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {toLocaleNumber(students.length, shortCode)} {t("students_found")}
                        </p>
                    </div>
                </CardHeader>

                <div className="p-0 overflow-x-auto custom-scrollbar">
                    <Table className="w-full min-w-[900px]">
                        <TableHeader className="!bg-[#f1f5f9] dark:!bg-slate-800 text-[11px] uppercase font-bold text-slate-700 dark:text-slate-200 border-b border-gray-200">
                            <TableRow className="hover:bg-transparent border-b border-gray-200 whitespace-nowrap">
                                <TableHead className="py-3 px-4 pl-6 font-bold text-slate-700">{t("class")}</TableHead>
                                <TableHead className="py-3 px-4 font-bold text-slate-700">{t("section")}</TableHead>
                                <TableHead className="py-3 px-4 font-bold text-slate-700">{t("admission_no")}</TableHead>
                                <TableHead className="py-3 px-4 font-bold text-slate-700">{t("student_name")}</TableHead>
                                <TableHead className="py-3 px-4 font-bold text-slate-700">{t("father_name")}</TableHead>
                                <TableHead className="py-3 px-4 font-bold text-slate-700">{t("date_of_birth")}</TableHead>
                                <TableHead className="py-3 px-4 font-bold text-slate-700">{t("mobile_no")}</TableHead>
                                <TableHead className="py-3 px-4 pr-6 text-right font-bold text-slate-700">{t("action")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 bg-white">
                            {loading ? (
                                <TableSkeleton rows={5} cols={8} />
                            ) : (
                                students.map((student) => (
                                    <TableRow key={student.id} className="hover:bg-indigo-50/30 transition-colors border-b border-gray-100 last:border-none text-xs">
                                        <TableCell className="py-3.5 px-4 pl-6 font-medium text-gray-700">{getLocalizedClassName(getClassDisplay(student))}</TableCell>
                                        <TableCell className="py-3.5 px-4 font-medium text-gray-600">{getLocalizedSectionName(getSectionDisplay(student))}</TableCell>
                                        <TableCell className="py-3.5 px-4 font-bold text-gray-800">{student.admission_no || '-'}</TableCell>
                                        <TableCell className="py-3.5 px-4 font-bold text-gray-900 capitalize">{`${student.name || ''} ${student.last_name || ''}`.trim() || '-'}</TableCell>
                                        <TableCell className="py-3.5 px-4 font-medium text-gray-600 capitalize">{student.father_name || '-'}</TableCell>
                                        <TableCell className="py-3.5 px-4 font-medium text-gray-600">{student.dob ? formatDate(student.dob) : '-'}</TableCell>
                                        <TableCell className="py-3.5 px-4 font-medium text-gray-600">{student.phone || '-'}</TableCell>
                                        <TableCell className="py-3.5 px-4 pr-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    className="btn-gradient h-8 px-4 rounded-lg font-bold text-xs shadow-md cursor-pointer"
                                                    onClick={() => {
                                                        const branchMatch = typeof window !== 'undefined' ? window.location.pathname.match(/^\/br\/([^\/]+)/) : null;
                                                        const prefix = branchMatch && branchMatch[1] !== "main" ? `/br/${branchMatch[1]}` : "";
                                                        window.location.href = `${prefix}/dashboard/fees-collection/collect-fees/student/${student.id}`;
                                                    }}
                                                >
                                                    <Wallet className="h-3.5 w-3.5 mr-1.5" />
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
                        <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 bg-white">
                            <div className="relative group">
                                <div className="relative p-6 bg-gray-50 rounded-2xl border border-gray-200/60 shadow-xs">
                                    <FolderSearch className="h-12 w-12 text-indigo-400" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-gray-500 font-semibold text-xs">
                                    {t("no_data_available_in_table")}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-3.5 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        {t("showing_x_to_y_of_z", {
                            from: toLocaleNumber(students.length > 0 ? 1 : 0, shortCode),
                            to: toLocaleNumber(students.length, shortCode),
                            total: toLocaleNumber(students.length, shortCode)
                        })}
                    </p>
                    <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="icon" disabled className="h-7.5 w-7.5 rounded-lg bg-white border border-gray-200 text-gray-400 disabled:opacity-40">
                            <ChevronDown className="h-3.5 w-3.5 rotate-90" />
                        </Button>
                        <Button className="h-7.5 w-7.5 rounded-lg border-none p-0 text-white font-bold text-xs shadow-xs bg-gradient-to-r from-[#FF9800] to-[#6366F1]">
                            {toLocaleNumber(1, shortCode)}
                        </Button>
                        <Button variant="outline" size="icon" disabled className="h-7.5 w-7.5 rounded-lg bg-white border border-gray-200 text-gray-400 disabled:opacity-40">
                            <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
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
