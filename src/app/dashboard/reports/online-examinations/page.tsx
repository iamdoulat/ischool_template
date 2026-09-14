/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
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
import { 
    Search, 
    FileText, 
    Trophy, 
    UserCheck, 
    Monitor, 
    Copy, 
    FileSpreadsheet, 
    Printer, 
    FileDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    Plus,
    Filter
} from "lucide-react";
import { 
    cn, 
    toLocaleNumber, 
    translateClassName, 
    translateSectionName,
    translateClassSection,
    translateExamName
} from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link";
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

const reportLinks = [
    { id: "Result Report", key: "result_report", icon: FileText },
    { id: "Exams Report", key: "exams_report", icon: FileText },
    { id: "Student Exams Attempt Report", key: "student_exams_attempt_report", icon: UserCheck },
    { id: "Exams Rank Report", key: "exams_rank_report", icon: Trophy },
];

const searchTypeOptions = [
    { value: "today", label: "Today" },
    { value: "this_week", label: "This Week" },
    { value: "last_week", label: "Last Week" },
    { value: "this_month", label: "This Month" },
    { value: "last_month", label: "Last Month" },
    { value: "this_year", label: "This Year" },
    { value: "last_year", label: "Last Year" },
    { value: "all", label: "All" },
];

interface OnlineExam {
    id: string;
    title: string;
}

interface SchoolClass {
    id: string;
    name: string;
    sections: { id: string; name: string }[];
}

export default function OnlineExaminationsReportPage() {
    const { t, language } = useLanguage();
    const langCode = language?.short_code || "en";
    const [activeTab, setActiveTab] = useState("Result Report");
    const [exams, setExams] = useState<OnlineExam[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [selectedExam, setSelectedExam] = useState<string>("");
    const [selectedClass, setSelectedClass] = useState<string>("");
    const [selectedSection, setSelectedSection] = useState<string>("");
    const [searchType, setSearchType] = useState<string>("today");
    const [dateType, setDateType] = useState<string>("all");
    const [reportData, setReportData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSearched, setIsSearched] = useState(false);

    // Search and Pagination States
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [itemsPerPage, setItemsPerPage] = useState<string>("50");
    const [currentPage, setCurrentPage] = useState<number>(1);

    useEffect(() => {
        fetchCriteria();
    }, []);

    const fetchCriteria = async () => {
        try {
            const response = await api.get('/reports/online-examinations/criteria');
            setExams(response.data.exams || []);
            setClasses(response.data.classes || []);
        } catch (error) {
            console.error("Failed to fetch criteria", error);
            toast.error(t("failed_to_fetch_report") || "Failed to fetch criteria data");
        }
    };

    const handleSearch = async () => {
        if (activeTab === "Result Report" || activeTab === "Exams Rank Report") {
            if (!selectedExam || !selectedClass || !selectedSection) {
                toast.error(t("please_select_a_class") || "Please select all required criteria fields");
                return;
            }
        }
        
        setLoading(true);
        try {
            let response;
            if (activeTab === "Result Report") {
                response = await api.get('/reports/online-examinations/result', {
                    params: {
                        online_exam_id: selectedExam,
                        school_class_id: selectedClass,
                        section_id: selectedSection,
                    }
                });
            } else if (activeTab === "Exams Report") {
                response = await api.get('/reports/online-examinations/exams', {
                    params: {
                        search_type: searchType,
                        date_type: dateType,
                    }
                });
            } else if (activeTab === "Student Exams Attempt Report") {
                response = await api.get('/reports/online-examinations/attempts', {
                    params: {
                        search_type: searchType,
                        date_type: dateType,
                    }
                });
            } else if (activeTab === "Exams Rank Report") {
                response = await api.get('/reports/online-examinations/rank', {
                    params: {
                        online_exam_id: selectedExam,
                        school_class_id: selectedClass,
                        section_id: selectedSection,
                    }
                });
            }
            
            if (response) {
                setReportData(response.data.data || []);
                setIsSearched(true);
                setCurrentPage(1); // reset to page 1 on new search
                toast.success(t("report_results") || "Report data loaded successfully");
            }
        } catch (error) {
            console.error("Failed to fetch report", error);
            toast.error(t("failed_to_fetch_report") || "Failed to load report data");
        } finally {
            setLoading(false);
        }
    };

    const sections = classes.find(c => c.id.toString() === selectedClass)?.sections || [];

    // Local filter based on searchTerm
    const filteredData = reportData.filter((item) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();

        if (activeTab === "Result Report") {
            return (
                (item.admission_no && item.admission_no.toLowerCase().includes(term)) ||
                (item.student_name && item.student_name.toLowerCase().includes(term)) ||
                (item.class && item.class.toLowerCase().includes(term)) ||
                (item.exam_submitted && item.exam_submitted.toLowerCase().includes(term))
            );
        } else if (activeTab === "Exams Report") {
            return (
                (item.exam && item.exam.toLowerCase().includes(term)) ||
                (item.exam_from && item.exam_from.toLowerCase().includes(term)) ||
                (item.exam_to && item.exam_to.toLowerCase().includes(term)) ||
                (item.duration && item.duration.toString().toLowerCase().includes(term))
            );
        } else if (activeTab === "Student Exams Attempt Report") {
            return (
                (item.admission_no && item.admission_no.toLowerCase().includes(term)) ||
                (item.student_name && item.student_name.toLowerCase().includes(term)) ||
                (item.class && item.class.toLowerCase().includes(term)) ||
                (item.section && item.section.toLowerCase().includes(term)) ||
                (item.exam && item.exam.toLowerCase().includes(term)) ||
                (item.exam_from && item.exam_from.toLowerCase().includes(term)) ||
                (item.exam_to && item.exam_to.toLowerCase().includes(term))
            );
        } else if (activeTab === "Exams Rank Report") {
            return (
                (item.admission_no && item.admission_no.toLowerCase().includes(term)) ||
                (item.student_name && item.student_name.toLowerCase().includes(term)) ||
                (item.class && item.class.toLowerCase().includes(term)) ||
                (item.father_name && item.father_name.toLowerCase().includes(term))
            );
        }
        return true;
    });

    // Pagination logic
    const totalEntries = filteredData.length;
    const sizeNum = parseInt(itemsPerPage);
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safeCurrentPage = Math.min(currentPage, totalPages) || 1;
    const startIndex = (safeCurrentPage - 1) * sizeNum;
    const paginatedData = filteredData.slice(startIndex, startIndex + sizeNum);

    // Export functions
    const exportToCopy = () => {
        if (filteredData.length === 0) {
            toast.warning(t("no_data_available_in_table") || "No data available to copy");
            return;
        }

        let text = "";
        if (activeTab === "Result Report") {
            text = [
                `${t("admission_no")}\t${t("student_name")}\t${t("class")}\t${t("total_attempt")}\t${t("remaining_attempt")}\t${t("exam_submitted")}`, 
                ...filteredData.map(item => `${item.admission_no}\t${item.student_name}\t${translateClassSection(item.class, langCode)}\t${toLocaleNumber(item.total_attempt, langCode)}\t${toLocaleNumber(item.remaining_attempt, langCode)}\t${item.exam_submitted === 'Yes' ? (t("yes") || "Yes") : (t("no") || "No")}`)
            ].join("\n");
        } else if (activeTab === "Exams Report") {
            text = [
                `${t("exam")}\t${t("attempt")}\t${t("exam_from")}\t${t("exam_to")}\t${t("duration")}\t${t("total_students")}\t${t("questions")}\t${t("exam_published")}\t${t("result_published")}`, 
                ...filteredData.map(item => `${translateExamName(item.exam, langCode)}\t${toLocaleNumber(item.attempt, langCode)}\t${item.exam_from}\t${item.exam_to}\t${toLocaleNumber(item.duration, langCode)}\t${toLocaleNumber(item.total_students, langCode)}\t${toLocaleNumber(item.questions, langCode)}\t${item.exam_published ? (t("yes") || 'Yes') : (t("no") || 'No')}\t${item.result_published ? (t("yes") || 'Yes') : (t("no") || 'No')}`)
            ].join("\n");
        } else if (activeTab === "Student Exams Attempt Report") {
            text = [
                `${t("admission_no")}\t${t("student")}\t${t("class")}\t${t("section")}\t${t("exam")}\t${t("exam_from")}\t${t("exam_to")}\t${t("duration")}\t${t("exam_published")}\t${t("result_published")}`, 
                ...filteredData.map(item => `${item.admission_no}\t${item.student_name}\t${translateClassName(item.class, langCode)}\t${translateSectionName(item.section, langCode)}\t${translateExamName(item.exam, langCode)}\t${item.exam_from}\t${item.exam_to}\t${toLocaleNumber(item.duration, langCode)}\t${item.exam_published ? (t("yes") || 'Yes') : (t("no") || 'No')}\t${item.result_published ? (t("yes") || 'Yes') : (t("no") || 'No')}`)
            ].join("\n");
        } else if (activeTab === "Exams Rank Report") {
            text = [
                `${t("rank")}\t${t("admission_no")}\t${t("student_name")}\t${t("class")}\t${t("father_name")}\t${t("exam_submitted")}\t${t("total_questions")}\t${t("descriptive")}\t${t("correct_answer")}\t${t("wrong_answer")}\t${t("not_attempted")}\t${t("total_exam_marks")}\t${t("total_negative_marks")}\t${t("total_scored_marks")}\t${t("score_percent")}`, 
                ...filteredData.map(item => `${toLocaleNumber(item.rank, langCode)}\t${item.admission_no}\t${item.student_name}\t${translateClassSection(item.class, langCode)}\t${item.father_name}\t${item.exam_submitted === 'Yes' ? (t("yes") || 'Yes') : (t("no") || 'No')}\t${toLocaleNumber(item.total_questions, langCode)}\t${toLocaleNumber(item.descriptive, langCode)}\t${toLocaleNumber(item.correct_answer, langCode)}\t${toLocaleNumber(item.wrong_answer, langCode)}\t${toLocaleNumber(item.not_attempted, langCode)}\t${toLocaleNumber(item.total_exam_marks, langCode)}\t${toLocaleNumber(item.total_negative_marks, langCode)}\t${toLocaleNumber(item.total_scored_marks, langCode)}\t${toLocaleNumber(item.score_percentage, langCode)}%`)
            ].join("\n");
        }

        navigator.clipboard.writeText(text);
        toast.success(t("copied_to_clipboard") || "Copied to clipboard");
    };

    const exportToExcel = (isCsv = false) => {
        if (filteredData.length === 0) {
            toast.warning(t("no_data_available_in_table") || "No data available to export");
            return;
        }

        let mappedData: any[] = [];
        if (activeTab === "Result Report") {
            mappedData = filteredData.map(item => ({
                [t("admission_no") || "Admission No"]: item.admission_no,
                [t("student_name") || "Student Name"]: item.student_name,
                [t("class") || "Class"]: translateClassSection(item.class, langCode),
                [t("total_attempt") || "Total Attempt"]: toLocaleNumber(item.total_attempt, langCode),
                [t("remaining_attempt") || "Remaining Attempt"]: toLocaleNumber(item.remaining_attempt, langCode),
                [t("exam_submitted") || "Exam Submitted"]: item.exam_submitted === 'Yes' ? (t("yes") || "Yes") : (t("no") || "No"),
            }));
        } else if (activeTab === "Exams Report") {
            mappedData = filteredData.map(item => ({
                [t("exam") || "Exam"]: translateExamName(item.exam, langCode),
                [t("attempt") || "Attempt"]: toLocaleNumber(item.attempt, langCode),
                [t("exam_from") || "Exam From"]: item.exam_from,
                [t("exam_to") || "Exam To"]: item.exam_to,
                [t("duration") || "Duration"]: toLocaleNumber(item.duration, langCode),
                [t("total_students") || "Total Students"]: toLocaleNumber(item.total_students, langCode),
                [t("questions") || "Questions"]: toLocaleNumber(item.questions, langCode),
                [t("exam_published") || "Exam Published"]: item.exam_published ? (t("yes") || "Yes") : (t("no") || "No"),
                [t("result_published") || "Result Published"]: item.result_published ? (t("yes") || "Yes") : (t("no") || "No"),
            }));
        } else if (activeTab === "Student Exams Attempt Report") {
            mappedData = filteredData.map(item => ({
                [t("admission_no") || "Admission No"]: item.admission_no,
                [t("student") || "Student"]: item.student_name,
                [t("class") || "Class"]: translateClassName(item.class, langCode),
                [t("section") || "Section"]: translateSectionName(item.section, langCode),
                [t("exam") || "Exam"]: translateExamName(item.exam, langCode),
                [t("exam_from") || "Exam From"]: item.exam_from,
                [t("exam_to") || "Exam To"]: item.exam_to,
                [t("duration") || "Duration"]: toLocaleNumber(item.duration, langCode),
                [t("exam_published") || "Exam Published"]: item.exam_published ? (t("yes") || "Yes") : (t("no") || "No"),
                [t("result_published") || "Result Published"]: item.result_published ? (t("yes") || "Yes") : (t("no") || "No"),
            }));
        } else if (activeTab === "Exams Rank Report") {
            mappedData = filteredData.map(item => ({
                [t("rank") || "Rank"]: toLocaleNumber(item.rank, langCode),
                [t("admission_no") || "Admission No"]: item.admission_no,
                [t("student_name") || "Student Name"]: item.student_name,
                [t("class") || "Class"]: translateClassSection(item.class, langCode),
                [t("father_name") || "Father Name"]: item.father_name,
                [t("exam_submitted") || "Exam Submitted"]: item.exam_submitted === 'Yes' ? (t("yes") || "Yes") : (t("no") || "No"),
                [t("total_questions") || "Total Questions"]: toLocaleNumber(item.total_questions, langCode),
                [t("descriptive") || "Descriptive"]: toLocaleNumber(item.descriptive, langCode),
                [t("correct_answer") || "Correct Answer"]: toLocaleNumber(item.correct_answer, langCode),
                [t("wrong_answer") || "Wrong Answer"]: toLocaleNumber(item.wrong_answer, langCode),
                [t("not_attempted") || "Not Attempted"]: toLocaleNumber(item.not_attempted, langCode),
                [t("total_exam_marks") || "Total Exam Marks"]: toLocaleNumber(item.total_exam_marks, langCode),
                [t("total_negative_marks") || "Total Negative Marks"]: toLocaleNumber(item.total_negative_marks, langCode),
                [t("total_scored_marks") || "Total Scored Marks"]: toLocaleNumber(item.total_scored_marks, langCode),
                [t("score_percent") || "Score (%)"]: `${toLocaleNumber(item.score_percentage, langCode)}%`,
            }));
        }

        const worksheet = XLSX.utils.json_to_sheet(mappedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, activeTab);
        
        if (isCsv) {
            XLSX.writeFile(workbook, `${activeTab.toLowerCase().replace(/ /g, "_")}.csv`, { bookType: "csv" });
            toast.success(t("csv_file_downloaded") || "CSV file downloaded");
        } else {
            XLSX.writeFile(workbook, `${activeTab.toLowerCase().replace(/ /g, "_")}.xlsx`);
            toast.success(t("excel_file_downloaded") || "Excel file downloaded");
        }
    };

    const exportToPDF = () => {
        if (filteredData.length === 0) {
            toast.warning(t("no_data_available_in_table") || "No data available to export");
            return;
        }

        const doc = new jsPDF();
        let head: any[] = [];
        let body: any[] = [];

        if (activeTab === "Result Report") {
            head = [[t("admission_no") || "Admission No", t("student_name") || "Student Name", t("class") || "Class", t("total_attempt") || "Total Attempt", t("remaining_attempt") || "Remaining Attempt", t("exam_submitted") || "Exam Submitted"]];
            body = filteredData.map(item => [item.admission_no, item.student_name, translateClassSection(item.class, langCode), toLocaleNumber(item.total_attempt, langCode), toLocaleNumber(item.remaining_attempt, langCode), item.exam_submitted === 'Yes' ? (t("yes") || "Yes") : (t("no") || "No")]);
        } else if (activeTab === "Exams Report") {
            head = [[t("exam") || "Exam", t("attempt") || "Attempt", t("exam_from") || "Exam From", t("exam_to") || "Exam To", t("duration") || "Duration", t("total_students") || "Total Students", t("questions") || "Questions", t("exam_published") || "Exam Published", t("result_published") || "Result Published"]];
            body = filteredData.map(item => [translateExamName(item.exam, langCode), toLocaleNumber(item.attempt, langCode), item.exam_from, item.exam_to, toLocaleNumber(item.duration, langCode), toLocaleNumber(item.total_students, langCode), toLocaleNumber(item.questions, langCode), item.exam_published ? (t("yes") || 'Yes') : (t("no") || 'No'), item.result_published ? (t("yes") || 'Yes') : (t("no") || 'No')]);
        } else if (activeTab === "Student Exams Attempt Report") {
            head = [[t("admission_no") || "Admission No", t("student") || "Student", t("class") || "Class", t("section") || "Section", t("exam") || "Exam", t("exam_from") || "Exam From", t("exam_to") || "Exam To", t("duration") || "Duration", t("exam_published") || "Exam Published", t("result_published") || "Result Published"]];
            body = filteredData.map(item => [item.admission_no, item.student_name, translateClassName(item.class, langCode), translateSectionName(item.section, langCode), translateExamName(item.exam, langCode), item.exam_from, item.exam_to, toLocaleNumber(item.duration, langCode), item.exam_published ? (t("yes") || 'Yes') : (t("no") || 'No'), item.result_published ? (t("yes") || 'Yes') : (t("no") || 'No')]);
        } else if (activeTab === "Exams Rank Report") {
            head = [[t("rank") || "Rank", t("admission_no") || "Admission No", t("student") || "Student", t("class") || "Class", t("father_name") || "Father Name", t("exam_submitted") || "Exam Submitted", t("total_questions") || "Total Questions", t("descriptive") || "Descriptive", t("correct_answer") || "Correct", t("wrong_answer") || "Wrong", t("not_attempted") || "Not Attempted", t("total_exam_marks") || "Total Marks", t("total_negative_marks") || "Negative Marks", t("total_scored_marks") || "Scored Marks", t("score_percent") || "Score (%)"]];
            body = filteredData.map(item => [toLocaleNumber(item.rank, langCode), item.admission_no, item.student_name, translateClassSection(item.class, langCode), item.father_name, item.exam_submitted === 'Yes' ? (t("yes") || 'Yes') : (t("no") || 'No'), toLocaleNumber(item.total_questions, langCode), toLocaleNumber(item.descriptive, langCode), toLocaleNumber(item.correct_answer, langCode), toLocaleNumber(item.wrong_answer, langCode), toLocaleNumber(item.not_attempted, langCode), toLocaleNumber(item.total_exam_marks, langCode), toLocaleNumber(item.total_negative_marks, langCode), toLocaleNumber(item.total_scored_marks, langCode), `${toLocaleNumber(item.score_percentage, langCode)}%`]);
        }

        autoTable(doc, {
            head: head,
            body: body,
        });

        doc.save(`${activeTab.toLowerCase().replace(/ /g, "_")}.pdf`);
        toast.success(t("pdf_file_downloaded") || "PDF file downloaded");
    };

    const handlePrint = () => {
        window.print();
    };

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
                            {t("online_examinations_report") || "Online Examinations Report"}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">
                            {t("online_examinations_report_description") || "View student rankings, exam results, and subject marks report"}
                        </p>
                    </div>
                </div>
                <Link
                    href="/user/online-exam"
                    className="flex items-center gap-1.5 h-8 px-4 rounded-full text-white text-xs font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] transition-all active:scale-95 shadow-md shrink-0"
                >
                    <Monitor className="h-3.5 w-3.5" />
                    {t("student_portal_view") || "Student Portal View"}
                </Link>
            </div>

            {/* Navigation Grid of 4 Report Tabs */}
            <div className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {reportLinks.map((link) => {
                        const isActive = activeTab === link.id;
                        return (
                            <div
                                key={link.id}
                                onClick={() => {
                                    setActiveTab(link.id);
                                    setReportData([]);
                                    setIsSearched(false);
                                    setSearchTerm("");
                                    setCurrentPage(1);
                                }}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all group",
                                    isActive
                                        ? "border-indigo-200 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-200"
                                        : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-xs"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-lg transition-all duration-300",
                                    isActive ? "bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                                )}>
                                    <link.icon className="h-4 w-4" />
                                </div>
                                <span className={cn(
                                    "text-xs font-bold tracking-tight transition-colors duration-300",
                                    isActive ? "text-[#6366f1]" : "text-gray-700"
                                )}>
                                    {t(link.key) || link.id}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Select Criteria Section with rearranged inline search button */}
            <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white transition-all">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                    <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                        <Filter className="h-4 w-4" />
                    </span>
                    <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        {t("select_criteria") || "Select Criteria"}
                    </h2>
                </div>
                
                {activeTab === "Result Report" || activeTab === "Exams Rank Report" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {t("exam") || "Exam"} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedExam} onValueChange={setSelectedExam}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {selectedExam ? translateExamName(exams.find(e => e.id.toString() === selectedExam)?.title, langCode) : (t("select") || "Select")}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {exams.map(exam => (
                                        <SelectItem key={exam.id} value={exam.id.toString()}>
                                            {translateExamName(exam.title, langCode)}
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
                                        {selectedClass ? translateClassName(classes.find(c => c.id.toString() === selectedClass)?.name, langCode) : (t("select_class") || "Select Class")}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(cls => (
                                        <SelectItem key={cls.id} value={cls.id.toString()}>
                                            {translateClassName(cls.name, langCode)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {t("section")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedSection} onValueChange={setSelectedSection}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {selectedSection === "all" ? (t("all_sections") || "All Sections") : (selectedSection ? translateSectionName(sections.find(s => s.id.toString() === selectedSection)?.name, langCode) : (t("select") || "Select"))}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("all_sections") || "All Sections"}</SelectItem>
                                    {sections.map(sec => (
                                        <SelectItem key={sec.id} value={sec.id.toString()}>
                                            {translateSectionName(sec.name, langCode)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-end">
                            <Button 
                                onClick={handleSearch}
                                disabled={loading}
                                className="w-full h-9 px-6 text-xs font-bold rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-sm shadow-orange-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                            >
                                <Search className="h-3.5 w-3.5" />
                                {loading ? (t("loading") || "Loading...") : (t("search") || "Search")}
                            </Button>
                        </div>
                    </div>
                ) : activeTab === "Exams Report" || activeTab === "Student Exams Attempt Report" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {t("search_type") || "Search Type"} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={searchType} onValueChange={setSearchType}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {searchType ? (t(searchType) || searchTypeOptions.find(o => o.value === searchType)?.label) : (t("select") || "Select")}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {searchTypeOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {t(opt.value) || opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {t("date_type") || "Date Type"}
                            </Label>
                            <Select value={dateType} onValueChange={setDateType}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {dateType === "all" ? (t("all") || "All") : dateType === "exam_from" ? (t("exam_from") || "Exam From") : dateType === "exam_to" ? (t("exam_to") || "Exam To") : (t("select") || "Select")}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("all") || "All"}</SelectItem>
                                    <SelectItem value="exam_from">{t("exam_from") || "Exam From"}</SelectItem>
                                    <SelectItem value="exam_to">{t("exam_to") || "Exam To"}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-end">
                            <Button 
                                onClick={handleSearch}
                                disabled={loading}
                                className="w-full h-9 px-6 text-xs font-bold rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-sm shadow-orange-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                            >
                                <Search className="h-3.5 w-3.5" />
                                {loading ? (t("loading") || "Loading...") : (t("search") || "Search")}
                            </Button>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Report Table Card with flex layout pushing footer to bottom */}
            <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white overflow-hidden flex flex-col justify-between min-h-[480px]">
                <div className="space-y-4">
                    {/* Status message warning box for Exam Rank Report */}
                    {activeTab === "Exams Rank Report" && isSearched && reportData.length === 0 && (
                        <div className="bg-sky-50 border border-sky-200/50 rounded-lg p-3 text-sky-700 text-xs font-semibold">
                            {t("exam_rank_not_generated") || "Exam Rank Not Generated."}
                        </div>
                    )}

                    {/* Table Toolbar */}
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder={t("search") || "Search..."} 
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="h-8 pl-8 pr-4 text-[11px] w-full rounded-lg border border-gray-200 shadow-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">
                                    {t("show") || "Show"}
                                </span>
                                <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-7 w-16 border-gray-200 text-[11px] shadow-none rounded-lg">
                                        <SelectValue>
                                            {toLocaleNumber(itemsPerPage, langCode)}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {["10", "25", "50", "100"].map((opt) => (
                                            <SelectItem key={opt} value={opt}>
                                                {toLocaleNumber(opt, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-1 text-gray-500">
                                <Button variant="outline" size="icon" title={t("copy") || "Copy"} onClick={exportToCopy} className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50">
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="outline" size="icon" title={t("excel") || "Excel"} onClick={() => exportToExcel(false)} className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50">
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="outline" size="icon" title="CSV" onClick={() => exportToExcel(true)} className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50">
                                    <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="outline" size="icon" title={t("pdf") || "PDF"} onClick={exportToPDF} className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50">
                                    <FileDown className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="outline" size="icon" title={t("print") || "Print"} onClick={handlePrint} className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50">
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-xl border border-gray-200/80 overflow-x-auto shadow-2xs">
                        <Table className="min-w-full">
                            <TableHeader className="bg-gray-50/75 text-xs uppercase">
                                {activeTab === "Result Report" ? (
                                    <TableRow className="hover:bg-transparent border-b border-gray-200 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-2.5 px-4">{t("admission_no") || "Admission No"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("student_name") || "Student Name"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("class") || "Class"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("total_attempt") || "Total Attempt"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("remaining_attempt") || "Remaining Attempt"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("exam_submitted") || "Exam Submitted"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-right">{t("action") || "Action"}</TableHead>
                                    </TableRow>
                                ) : activeTab === "Exams Report" ? (
                                    <TableRow className="hover:bg-transparent border-b border-gray-200 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-2.5 px-4">{t("exam") || "Exam"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("attempt") || "Attempt"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("exam_from") || "Exam From"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("exam_to") || "Exam To"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("duration") || "Duration"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("total_students") || "Total Students"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("questions") || "Questions"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("exam_published") || "Exam Published"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("result_published") || "Result Published"}</TableHead>
                                    </TableRow>
                                ) : activeTab === "Student Exams Attempt Report" ? (
                                    <TableRow className="hover:bg-transparent border-b border-gray-200 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-2.5 px-4">{t("admission_no") || "Admission No"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("student") || "Student"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("class") || "Class"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("section") || "Section"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("exam") || "Exam"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("exam_from") || "Exam From"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("exam_to") || "Exam To"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("duration") || "Duration"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("exam_published") || "Exam Published"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("result_published") || "Result Published"}</TableHead>
                                    </TableRow>
                                ) : activeTab === "Exams Rank Report" ? (
                                    <TableRow className="hover:bg-transparent border-b border-gray-200 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-2.5 px-4">{t("rank") || "Rank"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("admission_no") || "Admission No"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("student") || "Student"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("class") || "Class"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("father_name") || "Father Name"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("exam_submitted") || "Exam Submitted"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("total_questions") || "Total Questions"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("descriptive") || "Descriptive"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("correct_answer") || "Correct Answer"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("wrong_answer") || "Wrong Answer"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("not_attempted") || "Not Attempted"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("total_exam_marks") || "Total Exam Marks"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("total_negative_marks") || "Total Negative Marks"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("total_scored_marks") || "Total Scored Marks"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("score_percent") || "Score (%)"}</TableHead>
                                    </TableRow>
                                ) : null}
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableSkeleton cols={activeTab === "Result Report" ? 7 : (activeTab === "Exams Rank Report" ? 15 : (activeTab === "Student Exams Attempt Report" ? 10 : 9))} />
                                ) : paginatedData.length > 0 ? (
                                    paginatedData.map((item, index) => (
                                        <TableRow key={index} className="hover:bg-indigo-50/40 hover:shadow-xs transition-colors border-b border-gray-100 text-[11px] text-gray-600">
                                            {activeTab === "Result Report" ? (
                                                <>
                                                    <TableCell className="py-3 px-4 font-medium">{item.admission_no}</TableCell>
                                                    <TableCell className="py-3 px-4 font-bold text-gray-800">{item.student_name}</TableCell>
                                                    <TableCell className="py-3 px-4">{translateClassSection(item.class, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center">
                                                        <span className="bg-gray-100 px-2 py-0.5 rounded font-bold text-gray-700">{toLocaleNumber(item.total_attempt, langCode)}</span>
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-center">
                                                        <span className="bg-gray-100 px-2 py-0.5 rounded font-bold text-gray-700">{toLocaleNumber(item.remaining_attempt, langCode)}</span>
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-center">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded font-bold text-[10px] shadow-2xs",
                                                            item.exam_submitted === 'Yes' ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-rose-50 text-rose-600 border border-rose-200"
                                                        )}>
                                                            {item.exam_submitted === 'Yes' ? (t("yes") || "Yes") : (t("no") || "No")}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-right">
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xs active:scale-95 transition-all flex items-center justify-center cursor-pointer">
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </TableCell>
                                                </>
                                            ) : activeTab === "Exams Report" ? (
                                                <>
                                                    <TableCell className="py-3 px-4 font-bold text-gray-800">{translateExamName(item.exam, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center">{toLocaleNumber(item.attempt, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4">{item.exam_from}</TableCell>
                                                    <TableCell className="py-3 px-4">{item.exam_to}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center">{toLocaleNumber(item.duration, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center">{toLocaleNumber(item.total_students, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center">{toLocaleNumber(item.questions, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center">
                                                        <div className="flex justify-center">
                                                            {item.exam_published ? <UserCheck className="h-4 w-4 text-emerald-500" /> : <Plus className="h-4 w-4 text-gray-300 rotate-45" />}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-center">
                                                        <div className="flex justify-center">
                                                            {item.result_published ? <UserCheck className="h-4 w-4 text-emerald-500" /> : <Plus className="h-4 w-4 text-gray-300 rotate-45" />}
                                                        </div>
                                                    </TableCell>
                                                </>
                                            ) : activeTab === "Student Exams Attempt Report" ? (
                                                <>
                                                    <TableCell className="py-3 px-4 font-medium">{item.admission_no}</TableCell>
                                                    <TableCell className="py-3 px-4 font-bold text-gray-800">{item.student_name}</TableCell>
                                                    <TableCell className="py-3 px-4">{translateClassName(item.class, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4">{translateSectionName(item.section, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 font-bold text-gray-800">{translateExamName(item.exam, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4">{item.exam_from}</TableCell>
                                                    <TableCell className="py-3 px-4">{item.exam_to}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center">{toLocaleNumber(item.duration, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center">
                                                        <div className="flex justify-center">
                                                            {item.exam_published ? <UserCheck className="h-4 w-4 text-emerald-500" /> : <Plus className="h-4 w-4 text-gray-300 rotate-45" />}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-center">
                                                        <div className="flex justify-center">
                                                            {item.result_published ? <UserCheck className="h-4 w-4 text-emerald-500" /> : <Plus className="h-4 w-4 text-gray-300 rotate-45" />}
                                                        </div>
                                                    </TableCell>
                                                </>
                                            ) : activeTab === "Exams Rank Report" ? (
                                                <>
                                                    <TableCell className="py-3 px-4 font-bold text-indigo-600">{toLocaleNumber(item.rank, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 font-medium">{item.admission_no}</TableCell>
                                                    <TableCell className="py-3 px-4 font-bold text-gray-800">{item.student_name}</TableCell>
                                                    <TableCell className="py-3 px-4">{translateClassSection(item.class, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4">{item.father_name}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded font-bold text-[10px] shadow-2xs",
                                                            item.exam_submitted === 'Yes' ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-rose-50 text-rose-600 border border-rose-200"
                                                        )}>
                                                            {item.exam_submitted === 'Yes' ? (t("yes") || "Yes") : (t("no") || "No")}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-center">{toLocaleNumber(item.total_questions, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center">{toLocaleNumber(item.descriptive, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-emerald-600 font-bold">{toLocaleNumber(item.correct_answer, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-rose-600 font-bold">{toLocaleNumber(item.wrong_answer, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-gray-400">{toLocaleNumber(item.not_attempted, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center font-bold">{toLocaleNumber(item.total_exam_marks, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-rose-600">{toLocaleNumber(item.total_negative_marks, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-emerald-600 font-bold">{toLocaleNumber(item.total_scored_marks, langCode)}</TableCell>
                                                    <TableCell className="py-3 px-4 text-center">
                                                        <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-extrabold shadow-2xs">
                                                            {toLocaleNumber(item.score_percentage, langCode)}%
                                                        </span>
                                                    </TableCell>
                                                </>
                                            ) : null}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="hover:bg-transparent h-64">
                                        <TableCell colSpan={activeTab === "Result Report" ? 7 : (activeTab === "Exams Rank Report" ? 15 : (activeTab === "Student Exams Attempt Report" ? 10 : 9))} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                <p className="text-rose-400 font-bold mb-4 uppercase text-[10px] tracking-widest whitespace-nowrap">
                                                    {isSearched ? (t("no_results_found_for_selected_criteria") || "No results found for selected criteria") : (t("no_data_available_in_table") || "No data available in table")}
                                                </p>
                                                <div className="relative">
                                                    <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                        <Monitor className="h-8 w-8 text-gray-200" />
                                                    </div>
                                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center">
                                                        <Plus className="h-3 w-3 text-indigo-300" />
                                                    </div>
                                                </div>
                                                <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                                    <span className="text-lg">←</span> {t("search_with_different_criteria") || "Add new record or search with different criteria."}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Footer with clean pagination placed at the bottom edge */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-100 text-[11px] text-gray-500 mt-6">
                    <div>
                        {t("showing_x_to_y_of_z", {
                            from: toLocaleNumber(totalEntries > 0 ? startIndex + 1 : 0, langCode),
                            to: toLocaleNumber(Math.min(startIndex + sizeNum, totalEntries), langCode),
                            total: toLocaleNumber(totalEntries, langCode),
                        })}
                    </div>
                    <div className="flex items-center gap-1">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-7 w-7 rounded-lg border-gray-200 disabled:opacity-40" 
                            disabled={safeCurrentPage <= 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={cn(
                                    "h-7 px-2.5 text-[11px] font-bold rounded-lg transition-all",
                                    safeCurrentPage === page 
                                        ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs" 
                                        : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                )}
                            >
                                {toLocaleNumber(page, langCode)}
                            </Button>
                        ))}
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-7 w-7 rounded-lg border-gray-200 disabled:opacity-40" 
                            disabled={safeCurrentPage >= totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
