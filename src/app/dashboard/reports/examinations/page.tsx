/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    Search,
    Trophy,
    Copy,
    FileSpreadsheet,
    FileBox,
    Printer,
    FileText,
    Monitor,
    Filter,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { 
    cn, 
    toLocaleNumber, 
    translateClassName, 
    translateSectionName, 
    translateSubjectName, 
    translateExamName 
} from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/providers/language-provider";

function TableSkeleton({ cols }: { cols: number }) {
    return (
        <>
            {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3">
                            <Skeleton className="h-4 rounded" style={{ width: `${55 + ((i * 3 + j * 7) % 35)}%` }} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function ExaminationsReportPage() {
    const { t, language } = useLanguage();
    const langCode = language?.short_code || "en";

    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [criteria, setCriteria] = useState<any>({ exam_groups: [], sessions: [], classes: [] });
    const [exams, setExams] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState("");
    const [selectedExam, setSelectedExam] = useState("");
    const [selectedSession, setSelectedSession] = useState("");
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [reportData, setReportData] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        fetchCriteria();
    }, []);

    const fetchCriteria = async () => {
        try {
            const res = await api.get("reports/examinations/criteria");
            setCriteria(res.data);
        } catch {
            toast.error(t("failed_to_fetch_report") || "Failed to fetch report");
        }
    };

    const handleGroupChange = async (val: string) => {
        setSelectedGroup(val);
        setSelectedExam("");
        setExams([]);
        try {
            const res = await api.get(`reports/examinations/exams/${val}`);
            setExams(res.data);
        } catch {}
    };

    const handleSearch = async () => {
        if (!selectedExam || !selectedClass || !selectedSection) {
            toast.warning(t("please_select_a_class") || "Please select exam, class and section");
            return;
        }
        setLoading(true);
        try {
            const res = await api.get("reports/examinations/rank", {
                params: { 
                    exam_id: selectedExam, 
                    school_class_id: selectedClass, 
                    section_id: selectedSection 
                }
            });
            setReportData(res.data.data || []);
            setSubjects(res.data.subjects || []);
            setCurrentPage(1);
            toast.success(t("rank_report") || "Rank report loaded");
        } catch {
            toast.error(t("failed_to_fetch_report") || "Failed to fetch report");
        } finally {
            setLoading(false);
        }
    };

    const filteredSections = selectedClass 
        ? criteria.classes.find((c: any) => c.id.toString() === selectedClass)?.sections || []
        : [];

    const handleExport = (type: string) => {
        if (reportData.length === 0) {
            toast.warning(t("no_data_available_in_table") || "No data available in table");
            return;
        }
        
        const headers = [
            t("rank") || "Rank", 
            t("admission_no") || "Admission No", 
            t("roll_number") || "Roll Number", 
            t("student_name") || "Student Name", 
            ...subjects.map(s => translateSubjectName(s.name, langCode)), 
            t("grand_total") || "Grand Total", 
            t("percent") || "Percent", 
            t("result") || "Result"
        ];
        const rows = reportData.map(row => [
            row.rank,
            row.admission_no,
            row.roll_no,
            row.student_name,
            ...subjects.map(s => row.marks[s.id] || 0),
            `${row.total_marks}/${row.max_total}`,
            `${row.percent}%`,
            /pass/i.test(row.result) ? (t("passed") || "Passed") : (t("failed") || "Failed")
        ]);

        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `Examination_Rank_Report.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const filteredData = reportData.filter(row =>
        row.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.admission_no?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
    const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="space-y-6 pb-20">
            {/* Standalone Edge-to-Edge Gradient Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Trophy className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                            {t("examinations_report") || "Examinations Report"}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">
                            {t("examinations_report_description") || "View student rankings, exam results, and subject marks report"}
                        </p>
                    </div>
                </div>
                <Link
                    href="/user/examinations"
                    className="flex items-center gap-1.5 h-8 px-4 rounded-full text-white text-xs font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] transition-all active:scale-95 shadow-md shrink-0"
                >
                    <Monitor className="h-3.5 w-3.5" />
                    {t("student_portal_view") || "Student Portal View"}
                </Link>
            </div>

            {/* Navigation Grid of Tab Links */}
            <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-200 cursor-pointer">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                            <Trophy className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold tracking-tight text-[#6366f1]">
                            {t("rank_report") || "Rank Report"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Select Criteria Section */}
            <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white transition-all">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                    <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                        <Filter className="h-4 w-4" />
                    </span>
                    <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        {t("select_criteria") || "Select Criteria"}
                    </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold text-gray-600">
                            {t("exam_group") || "Exam Group"} <span className="text-red-500">*</span>
                        </Label>
                        <Select value={selectedGroup} onValueChange={handleGroupChange}>
                            <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                <SelectValue placeholder={t("select") || "Select"}>
                                    {selectedGroup ? translateExamName(criteria.exam_groups.find((g: any) => g.id.toString() === selectedGroup)?.name, langCode) : (t("select") || "Select")}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {criteria.exam_groups.map((g: any) => (
                                    <SelectItem key={g.id} value={g.id.toString()}>
                                        {translateExamName(g.name, langCode)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold text-gray-600">
                            {t("exam") || "Exam"} <span className="text-red-500">*</span>
                        </Label>
                        <Select value={selectedExam} onValueChange={setSelectedExam}>
                            <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                <SelectValue placeholder={t("select") || "Select"}>
                                    {selectedExam ? translateExamName(exams.find((e: any) => e.id.toString() === selectedExam)?.name, langCode) : (t("select") || "Select")}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {exams.map((e: any) => (
                                    <SelectItem key={e.id} value={e.id.toString()}>
                                        {translateExamName(e.name, langCode)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold text-gray-600">
                            {t("session") || "Session"} <span className="text-red-500">*</span>
                        </Label>
                        <Select value={selectedSession} onValueChange={setSelectedSession}>
                            <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                <SelectValue placeholder={t("select") || "Select"}>
                                    {selectedSession ? toLocaleNumber(criteria.sessions.find((s: any) => s.id.toString() === selectedSession || s.session === selectedSession)?.session || selectedSession, langCode) : (t("select") || "Select")}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {criteria.sessions.map((s: any) => (
                                    <SelectItem key={s.id} value={s.id.toString()}>
                                        {toLocaleNumber(s.session, langCode)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold text-gray-600">
                            {t("class") || "Class"} <span className="text-red-500">*</span>
                        </Label>
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                            <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                <SelectValue placeholder={t("select_class") || "Select Class"}>
                                    {selectedClass ? translateClassName(criteria.classes.find((c: any) => c.id.toString() === selectedClass)?.name, langCode) : (t("select_class") || "Select Class")}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {criteria.classes.map((c: any) => (
                                    <SelectItem key={c.id} value={c.id.toString()}>
                                        {translateClassName(c.name, langCode)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold text-gray-600">
                            {t("section") || "Section"} <span className="text-red-500">*</span>
                        </Label>
                        <Select value={selectedSection} onValueChange={setSelectedSection}>
                            <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                <SelectValue placeholder={t("select") || "Select"}>
                                    {selectedSection === "all" ? (t("all_sections") || "All Sections") : (selectedSection ? translateSectionName(filteredSections.find((s: any) => s.id.toString() === selectedSection)?.name, langCode) : (t("select") || "Select"))}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("all_sections") || "All Sections"}</SelectItem>
                                {filteredSections.map((s: any) => (
                                    <SelectItem key={s.id} value={s.id.toString()}>
                                        {translateSectionName(s.name, langCode)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <Button 
                        onClick={handleSearch}
                        disabled={loading}
                        className="h-9 px-6 text-xs font-bold rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-sm shadow-orange-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                    >
                        <Search className="h-3.5 w-3.5" />
                        {loading ? (t("loading") || "Loading...") : (t("search") || "Search")}
                    </Button>
                </div>
            </div>

            {/* Student List Section */}
            <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white overflow-hidden flex flex-col justify-between min-h-[480px]">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                        <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                            <Trophy className="h-4 w-4" />
                        </span>
                        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            {t("rank_report") || "Rank Report"}
                        </h2>
                    </div>

                    {/* Table Toolbar */}
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder={t("search") || "Search"}
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-8 pl-8 text-[11px] w-full rounded-lg border-gray-200 shadow-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="flex items-center gap-1 text-gray-500 self-end sm:self-auto">
                            <Button onClick={() => handleExport('copy')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("copy") || "Copy"}><Copy className="h-3.5 w-3.5" /></Button>
                            <Button onClick={() => handleExport('excel')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("excel") || "Excel"}><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                            <Button onClick={() => handleExport('csv')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title="CSV"><FileBox className="h-3.5 w-3.5" /></Button>
                            <Button onClick={() => handleExport('pdf')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("pdf") || "PDF"}><FileText className="h-3.5 w-3.5" /></Button>
                            <Button onClick={() => handleExport('print')} variant="outline" size="icon" className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 hover:text-gray-700" title={t("print") || "Print"}><Printer className="h-3.5 w-3.5" /></Button>
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="rounded-xl border border-gray-200/80 overflow-x-auto shadow-2xs">
                        <Table className="min-w-[1200px]">
                            <TableHeader className="bg-gray-50/75 text-xs uppercase">
                                <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600 border-b border-gray-200">
                                    <TableHead className="py-2.5 px-4">{t("rank") || "Rank"}</TableHead>
                                    <TableHead className="py-2.5 px-4">{t("admission_no") || "Admission No"}</TableHead>
                                    <TableHead className="py-2.5 px-4">{t("roll_number") || "Roll Number"}</TableHead>
                                    <TableHead className="py-2.5 px-4">{t("student_name") || "Student Name"}</TableHead>
                                    {subjects.map(sub => (
                                        <TableHead key={sub.id} className="py-2.5 px-4 text-center font-bold">
                                            {translateSubjectName(sub.name, langCode)} ({toLocaleNumber(sub.min_marks, langCode)}/{toLocaleNumber(sub.max_marks, langCode)})
                                        </TableHead>
                                    ))}
                                    <TableHead className="py-2.5 px-4 text-center">{t("grand_total") || "Grand Total"}</TableHead>
                                    <TableHead className="py-2.5 px-4 text-center">{t("percent") || "Percent"}</TableHead>
                                    <TableHead className="py-2.5 px-4 text-right">{t("result") || "Result"}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? <TableSkeleton cols={7 + subjects.length} /> : paginatedData.length > 0 ? (
                                    paginatedData.map((row, i) => (
                                        <TableRow key={i} className="text-[11px] border-b border-gray-100 hover:bg-indigo-50/40 hover:shadow-xs transition-colors">
                                            <TableCell className="py-3 px-4 font-bold text-indigo-600">{toLocaleNumber(row.rank, langCode)}</TableCell>
                                            <TableCell className="py-3 px-4 font-medium">{row.admission_no}</TableCell>
                                            <TableCell className="py-3 px-4">{row.roll_no ? toLocaleNumber(row.roll_no, langCode) : "-"}</TableCell>
                                            <TableCell className="py-3 px-4 font-semibold text-gray-800">{row.student_name}</TableCell>
                                            {subjects.map(sub => (
                                                <TableCell key={sub.id} className="py-3 px-4 text-center font-medium">
                                                    {toLocaleNumber(row.marks?.[sub.id] ?? 0, langCode)}
                                                </TableCell>
                                            ))}
                                            <TableCell className="py-3 px-4 text-center font-bold text-gray-800">
                                                {toLocaleNumber(row.total_marks, langCode)} / {toLocaleNumber(row.max_total, langCode)}
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-center">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[9px] font-bold shadow-2xs", 
                                                    row.percent >= 80 ? "bg-emerald-100 text-emerald-700" : 
                                                    row.percent >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                                                )}>
                                                    {toLocaleNumber(row.percent, langCode)}%
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-right">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[9px] font-bold inline-block shadow-2xs", 
                                                    /pass/i.test(row.result) ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                                                )}>
                                                    {/pass/i.test(row.result) ? (t("passed") || "উত্তীর্ণ") : (t("failed") || "অনুত্তীর্ণ")}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="hover:bg-transparent h-64">
                                        <TableCell colSpan={7 + subjects.length} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                <p className="text-rose-400 font-bold mb-2 uppercase text-[10px] tracking-widest">{t("no_data_available_in_table") || "No data available in table"}</p>
                                                <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 shadow-inner">
                                                    <Trophy className="h-7 w-7 text-gray-300" />
                                                </div>
                                                <p className="text-gray-500 font-medium text-[11px]">
                                                    {t("search_with_different_criteria") || "Add new record or search with different criteria."}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Footer with Pagination placed at the bottom edge */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-100 text-[11px] text-gray-500 mt-6">
                    <div>
                        {t("showing_x_to_y_of_z", {
                            from: toLocaleNumber(filteredData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0, langCode),
                            to: toLocaleNumber(Math.min(currentPage * pageSize, filteredData.length), langCode),
                            total: toLocaleNumber(filteredData.length, langCode),
                        })}
                    </div>
                    <div className="flex items-center gap-1">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-7 w-7 rounded-lg border-gray-200 disabled:opacity-40" 
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                            <Button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={cn(
                                    "h-7 px-2.5 text-[11px] font-bold rounded-lg transition-all",
                                    currentPage === pageNum 
                                        ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs" 
                                        : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                {toLocaleNumber(pageNum, langCode)}
                            </Button>
                        ))}
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-7 w-7 rounded-lg border-gray-200 disabled:opacity-40" 
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

