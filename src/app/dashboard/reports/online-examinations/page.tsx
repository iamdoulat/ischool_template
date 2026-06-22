// @ts-nocheck
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
    BarChart3, 
    Trophy, 
    UserCheck, 
    Plus, 
    Monitor, 
    Eye, 
    Copy, 
    FileSpreadsheet, 
    Printer, 
    FileDown,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

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
    { name: "Result Report", icon: FileText },
    { name: "Exams Report", icon: FileText },
    { name: "Student Exams Attempt Report", icon: UserCheck },
    { name: "Exams Rank Report", icon: Trophy },
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
            setExams(response.data.exams);
            setClasses(response.data.classes);
        } catch (error) {
            console.error("Failed to fetch criteria", error);
            toast.error("Failed to fetch criteria data");
        }
    };

    const handleSearch = async () => {
        if (activeTab === "Result Report" || activeTab === "Exams Rank Report") {
            if (!selectedExam || !selectedClass || !selectedSection) {
                toast.error("Please select all required criteria fields");
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
                setReportData(response.data.data);
                setIsSearched(true);
                setCurrentPage(1); // reset to page 1 on new search
                toast.success("Report data loaded successfully");
            }
        } catch (error) {
            console.error("Failed to fetch report", error);
            toast.error("Failed to load report data");
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
            toast.error("No data available to copy");
            return;
        }

        let text = "";
        if (activeTab === "Result Report") {
            text = ["Admission No\tStudent Name\tClass\tTotal Attempt\tRemaining Attempt\tExam Submitted", 
                    ...filteredData.map(item => `${item.admission_no}\t${item.student_name}\t${item.class}\t${item.total_attempt}\t${item.remaining_attempt}\t${item.exam_submitted}`)
                   ].join("\n");
        } else if (activeTab === "Exams Report") {
            text = ["Exam\tAttempt\tExam From\tExam To\tDuration\tTotal Students\tQuestions\tExam Published\tResult Published", 
                    ...filteredData.map(item => `${item.exam}\t${item.attempt}\t${item.exam_from}\t${item.exam_to}\t${item.duration}\t${item.total_students}\t${item.questions}\t${item.exam_published ? 'Yes' : 'No'}\t${item.result_published ? 'Yes' : 'No'}`)
                   ].join("\n");
        } else if (activeTab === "Student Exams Attempt Report") {
            text = ["Admission No\tStudent\tClass\tSection\tExam\tExam From\tExam To\tDuration\tExam Published\tResult Published", 
                    ...filteredData.map(item => `${item.admission_no}\t${item.student_name}\t${item.class}\t${item.section}\t${item.exam}\t${item.exam_from}\t${item.exam_to}\t${item.duration}\t${item.exam_published ? 'Yes' : 'No'}\t${item.result_published ? 'Yes' : 'No'}`)
                   ].join("\n");
        } else if (activeTab === "Exams Rank Report") {
            text = ["Rank\tAdmission No\tStudent Name\tClass\tFather Name\tExam Submitted\tTotal Questions\tDescriptive\tCorrect Answer\tWrong Answer\tNot Attempted\tTotal Exam Marks\tTotal Negative Marks\tTotal Scored Marks\tScore (%)", 
                    ...filteredData.map(item => `${item.rank}\t${item.admission_no}\t${item.student_name}\t${item.class}\t${item.father_name}\t${item.exam_submitted}\t${item.total_questions}\t${item.descriptive}\t${item.correct_answer}\t${item.wrong_answer}\t${item.not_attempted}\t${item.total_exam_marks}\t${item.total_negative_marks}\t${item.total_scored_marks}\t${item.score_percentage}%`)
                   ].join("\n");
        }

        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const exportToExcel = (isCsv = false) => {
        if (filteredData.length === 0) {
            toast.error("No data available to export");
            return;
        }

        let mappedData = [];
        if (activeTab === "Result Report") {
            mappedData = filteredData.map(item => ({
                "Admission No": item.admission_no,
                "Student Name": item.student_name,
                "Class": item.class,
                "Total Attempt": item.total_attempt,
                "Remaining Attempt": item.remaining_attempt,
                "Exam Submitted": item.exam_submitted,
            }));
        } else if (activeTab === "Exams Report") {
            mappedData = filteredData.map(item => ({
                "Exam": item.exam,
                "Attempt": item.attempt,
                "Exam From": item.exam_from,
                "Exam To": item.exam_to,
                "Duration": item.duration,
                "Total Students": item.total_students,
                "Questions": item.questions,
                "Exam Published": item.exam_published ? "Yes" : "No",
                "Result Published": item.result_published ? "Yes" : "No",
            }));
        } else if (activeTab === "Student Exams Attempt Report") {
            mappedData = filteredData.map(item => ({
                "Admission No": item.admission_no,
                "Student": item.student_name,
                "Class": item.class,
                "Section": item.section,
                "Exam": item.exam,
                "Exam From": item.exam_from,
                "Exam To": item.exam_to,
                "Duration": item.duration,
                "Exam Published": item.exam_published ? "Yes" : "No",
                "Result Published": item.result_published ? "Yes" : "No",
            }));
        } else if (activeTab === "Exams Rank Report") {
            mappedData = filteredData.map(item => ({
                "Rank": item.rank,
                "Admission No": item.admission_no,
                "Student Name": item.student_name,
                "Class": item.class,
                "Father Name": item.father_name,
                "Exam Submitted": item.exam_submitted,
                "Total Questions": item.total_questions,
                "Descriptive": item.descriptive,
                "Correct Answer": item.correct_answer,
                "Wrong Answer": item.wrong_answer,
                "Not Attempted": item.not_attempted,
                "Total Exam Marks": item.total_exam_marks,
                "Total Negative Marks": item.total_negative_marks,
                "Total Scored Marks": item.total_scored_marks,
                "Score (%)": `${item.score_percentage}%`,
            }));
        }

        const worksheet = XLSX.utils.json_to_sheet(mappedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, activeTab);
        
        if (isCsv) {
            XLSX.writeFile(workbook, `${activeTab.toLowerCase().replace(/ /g, "_")}.csv`, { bookType: "csv" });
            toast.success("CSV file downloaded");
        } else {
            XLSX.writeFile(workbook, `${activeTab.toLowerCase().replace(/ /g, "_")}.xlsx`);
            toast.success("Excel file downloaded");
        }
    };

    const exportToPDF = () => {
        if (filteredData.length === 0) {
            toast.error("No data available to export");
            return;
        }

        const doc = new jsPDF();
        let head = [];
        let body = [];

        if (activeTab === "Result Report") {
            head = [["Admission No", "Student Name", "Class", "Total Attempt", "Remaining Attempt", "Exam Submitted"]];
            body = filteredData.map(item => [item.admission_no, item.student_name, item.class, item.total_attempt, item.remaining_attempt, item.exam_submitted]);
        } else if (activeTab === "Exams Report") {
            head = [["Exam", "Attempt", "Exam From", "Exam To", "Duration", "Total Students", "Questions", "Exam Published", "Result Published"]];
            body = filteredData.map(item => [item.exam, item.attempt, item.exam_from, item.exam_to, item.duration, item.total_students, item.questions, item.exam_published ? 'Yes' : 'No', item.result_published ? 'Yes' : 'No']);
        } else if (activeTab === "Student Exams Attempt Report") {
            head = [["Admission No", "Student", "Class", "Section", "Exam", "Exam From", "Exam To", "Duration", "Exam Published", "Result Published"]];
            body = filteredData.map(item => [item.admission_no, item.student_name, item.class, item.section, item.exam, item.exam_from, item.exam_to, item.duration, item.exam_published ? 'Yes' : 'No', item.result_published ? 'Yes' : 'No']);
        } else if (activeTab === "Exams Rank Report") {
            head = [["Rank", "Admission No", "Student", "Class", "Father Name", "Exam Submitted", "Total Questions", "Descriptive", "Correct", "Wrong", "Not Attempted", "Total Marks", "Negative Marks", "Scored Marks", "Score (%)"]];
            body = filteredData.map(item => [item.rank, item.admission_no, item.student_name, item.class, item.father_name, item.exam_submitted, item.total_questions, item.descriptive, item.correct_answer, item.wrong_answer, item.not_attempted, item.total_exam_marks, item.total_negative_marks, item.total_scored_marks, `${item.score_percentage}%`]);
        }

        autoTable(doc, {
            head: head,
            body: body,
        });

        doc.save(`${activeTab.toLowerCase().replace(/ /g, "_")}.pdf`);
        toast.success("PDF file downloaded");
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-4 lg:p-6 space-y-5 animate-in fade-in duration-500 pb-20">
            {/* Gradient header card with report-type tabs inside */}
            <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] overflow-hidden pt-0 gap-0">
                <CardHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Trophy className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold text-slate-800 leading-none">Online Examinations Report</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">Online exam results and rankings</p>
                            </div>
                        </div>
                        <Link
                            href="/user/online-exam"
                            className="flex items-center gap-1.5 h-8 px-3.5 rounded-[10px] text-white text-[11px] font-semibold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity active:scale-95 shadow-sm"
                        >
                            <Monitor className="h-3.5 w-3.5" />
                            Student Portal View
                        </Link>
                    </div>
                </CardHeader>
                <CardContent className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {reportLinks.map((link) => {
                            const isActive = activeTab === link.name;
                            return (
                                <div
                                    key={link.name}
                                    onClick={() => {
                                        setActiveTab(link.name);
                                        setReportData([]);
                                        setIsSearched(false);
                                        setSearchTerm("");
                                        setCurrentPage(1);
                                    }}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all group",
                                        isActive
                                            ? "border-indigo-200 bg-indigo-50/50 shadow-sm"
                                            : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                                    )}
                                >
                                    <div className={cn(
                                        "p-2 rounded-lg transition-all",
                                        isActive ? "bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                                    )}>
                                        <link.icon className="h-4 w-4" />
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-tight",
                                        isActive ? "text-indigo-700" : "text-gray-600"
                                    )}>
                                        {link.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Select Criteria Section */}
            <div className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] rounded-xl p-5 space-y-4 bg-white">
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-gray-100 pb-3 mb-2">Select Criteria</h2>
                
                {activeTab === "Result Report" || activeTab === "Exams Rank Report" ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Exam <span className="text-red-500">*</span></Label>
                            <Select value={selectedExam} onValueChange={setSelectedExam}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {exams.map(exam => (
                                        <SelectItem key={exam.id} value={exam.id.toString()}>{exam.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                            <Select value={selectedClass} onValueChange={(val) => { setSelectedClass(val); setSelectedSection(""); }}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(cls => (
                                        <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section <span className="text-red-500">*</span></Label>
                            <Select value={selectedSection} onValueChange={setSelectedSection}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {sections.map(sec => (
                                        <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                ) : activeTab === "Exams Report" || activeTab === "Student Exams Attempt Report" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type <span className="text-red-500">*</span></Label>
                            <Select value={searchType} onValueChange={setSearchType}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {searchTypeOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Date Type</Label>
                            <Select value={dateType} onValueChange={setDateType}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="exam_from">Exam From Date</SelectItem>
                                    <SelectItem value="exam_to">Exam To Date</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                ) : (
                    <div className="py-4 text-gray-400 italic">Criteria for this report coming soon...</div>
                )}

                {(activeTab === "Result Report" || activeTab === "Exams Report" || activeTab === "Student Exams Attempt Report" || activeTab === "Exams Rank Report") && (
                    <div className="flex justify-end">
                        <Button 
                            onClick={handleSearch}
                            disabled={loading}
                            variant="gradient"
                            className="text-white px-6 h-9 text-xs font-bold transition-all rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
                        >
                            <Search className="h-4 w-4" />
                            {loading ? "Searching..." : "Search"}
                        </Button>
                    </div>
                )}
            </div>

            {/* Report Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                
                {/* Status message warning box for Exam Rank Report */}
                {activeTab === "Exams Rank Report" && isSearched && reportData.length === 0 && (
                    <div className="bg-sky-50 border border-sky-200/50 rounded-lg p-3 text-sky-700 text-xs font-semibold mb-4">
                        Exam Rank Not Generated.
                    </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full bg-white border border-gray-200 rounded-md py-1.5 pl-9 pr-4 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                        />
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end gap-3 flex-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Show</span>
                            <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                <SelectTrigger className="h-7 w-16 border-gray-200 text-[11px] shadow-none rounded">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" title="Copy" onClick={exportToCopy} className="h-7 w-7 text-gray-400 hover:text-indigo-600 border border-gray-100 bg-gray-50/30 rounded shadow-sm">
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Excel" onClick={() => exportToExcel(false)} className="h-7 w-7 text-gray-400 hover:text-emerald-600 border border-gray-100 bg-gray-50/30 rounded shadow-sm">
                                <FileSpreadsheet className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" title="CSV" onClick={() => exportToExcel(true)} className="h-7 w-7 text-gray-400 hover:text-amber-600 border border-gray-100 bg-gray-50/30 rounded shadow-sm">
                                <FileText className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" title="PDF" onClick={exportToPDF} className="h-7 w-7 text-gray-400 hover:text-rose-600 border border-gray-100 bg-gray-50/30 rounded shadow-sm">
                                <FileDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Print" onClick={handlePrint} className="h-7 w-7 text-gray-400 hover:text-gray-900 border border-gray-100 bg-gray-50/30 rounded shadow-sm">
                                <Printer className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-full">
                        <TableHeader className="bg-transparent">
                            {activeTab === "Result Report" ? (
                                <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4">Admission No</TableHead>
                                    <TableHead className="py-3 px-4">Student Name</TableHead>
                                    <TableHead className="py-3 px-4">Class</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Total Attempt</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Remaining Attempt</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Exam Submitted</TableHead>
                                    <TableHead className="py-3 px-4 text-right">Action</TableHead>
                                </TableRow>
                            ) : activeTab === "Exams Report" ? (
                                <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4">Exam</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Attempt</TableHead>
                                    <TableHead className="py-3 px-4">Exam From</TableHead>
                                    <TableHead className="py-3 px-4">Exam To</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Duration</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Total Students</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Questions</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Exam Published</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Result Published</TableHead>
                                </TableRow>
                            ) : activeTab === "Student Exams Attempt Report" ? (
                                <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4">Admission No</TableHead>
                                    <TableHead className="py-3 px-4">Student</TableHead>
                                    <TableHead className="py-3 px-4">Class</TableHead>
                                    <TableHead className="py-3 px-4">Section</TableHead>
                                    <TableHead className="py-3 px-4">Exam</TableHead>
                                    <TableHead className="py-3 px-4">Exam From</TableHead>
                                    <TableHead className="py-3 px-4">Exam To</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Duration</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Exam Published</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Result Published</TableHead>
                                </TableRow>
                            ) : activeTab === "Exams Rank Report" ? (
                                <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4">Rank</TableHead>
                                    <TableHead className="py-3 px-4">Admission No</TableHead>
                                    <TableHead className="py-3 px-4">Student</TableHead>
                                    <TableHead className="py-3 px-4">Class</TableHead>
                                    <TableHead className="py-3 px-4">Father Name</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Exam Submitted</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Total Questions</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Descriptive</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Correct Answer</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Wrong Answer</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Not Attempted</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Total Exam Marks</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Total Negative Marks</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Total Scored Marks</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Score (%)</TableHead>
                                </TableRow>
                            ) : null}
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableSkeleton cols={activeTab === "Result Report" ? 7 : (activeTab === "Exams Rank Report" ? 15 : (activeTab === "Student Exams Attempt Report" ? 10 : 9))} />
                            ) : paginatedData.length > 0 ? (
                                paginatedData.map((item, index) => (
                                    <TableRow key={index} className="hover:bg-gray-50/50 border-b border-gray-100 text-[11px] text-gray-600">
                                        {activeTab === "Result Report" ? (
                                            <>
                                                <TableCell className="py-3 px-4 font-medium">{item.admission_no}</TableCell>
                                                <TableCell className="py-3 px-4 font-bold text-gray-800">{item.student_name}</TableCell>
                                                <TableCell className="py-3 px-4">{item.class}</TableCell>
                                                <TableCell className="py-3 px-4 text-center">
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded font-bold text-gray-700">{item.total_attempt}</span>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center">
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded font-bold text-gray-700">{item.remaining_attempt}</span>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded font-bold",
                                                        item.exam_submitted === 'Yes' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                    )}>
                                                        {item.exam_submitted}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right">
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </>
                                        ) : activeTab === "Exams Report" ? (
                                            <>
                                                <TableCell className="py-3 px-4 font-bold text-gray-800">{item.exam}</TableCell>
                                                <TableCell className="py-3 px-4 text-center">{item.attempt}</TableCell>
                                                <TableCell className="py-3 px-4">{item.exam_from}</TableCell>
                                                <TableCell className="py-3 px-4">{item.exam_to}</TableCell>
                                                <TableCell className="py-3 px-4 text-center">{item.duration}</TableCell>
                                                <TableCell className="py-3 px-4 text-center">{item.total_students}</TableCell>
                                                <TableCell className="py-3 px-4 text-center">{item.questions}</TableCell>
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
                                                <TableCell className="py-3 px-4">{item.class}</TableCell>
                                                <TableCell className="py-3 px-4">{item.section}</TableCell>
                                                <TableCell className="py-3 px-4 font-bold text-gray-800">{item.exam}</TableCell>
                                                <TableCell className="py-3 px-4">{item.exam_from}</TableCell>
                                                <TableCell className="py-3 px-4">{item.exam_to}</TableCell>
                                                <TableCell className="py-3 px-4 text-center">{item.duration}</TableCell>
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
                                                <TableCell className="py-3 px-4 font-bold text-indigo-600">{item.rank}</TableCell>
                                                <TableCell className="py-3 px-4 font-medium">{item.admission_no}</TableCell>
                                                <TableCell className="py-3 px-4 font-bold text-gray-800">{item.student_name}</TableCell>
                                                <TableCell className="py-3 px-4">{item.class}</TableCell>
                                                <TableCell className="py-3 px-4">{item.father_name}</TableCell>
                                                <TableCell className="py-3 px-4 text-center">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded font-bold text-[10px]",
                                                        item.exam_submitted === 'Yes' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                                    )}>
                                                        {item.exam_submitted}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center">{item.total_questions}</TableCell>
                                                <TableCell className="py-3 px-4 text-center">{item.descriptive}</TableCell>
                                                <TableCell className="py-3 px-4 text-center text-emerald-600 font-bold">{item.correct_answer}</TableCell>
                                                <TableCell className="py-3 px-4 text-center text-rose-600 font-bold">{item.wrong_answer}</TableCell>
                                                <TableCell className="py-3 px-4 text-center text-gray-400">{item.not_attempted}</TableCell>
                                                <TableCell className="py-3 px-4 text-center font-bold">{item.total_exam_marks}</TableCell>
                                                <TableCell className="py-3 px-4 text-center text-rose-600">{item.total_negative_marks}</TableCell>
                                                <TableCell className="py-3 px-4 text-center text-emerald-600 font-bold">{item.total_scored_marks}</TableCell>
                                                <TableCell className="py-3 px-4 text-center">
                                                    <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-extrabold">
                                                        {item.score_percentage}%
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
                                            <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest whitespace-nowrap">
                                                {isSearched ? "No results found for selected criteria" : "No data available in table"}
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
                                                <span className="text-lg">←</span> Add new record or search with different criteria.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold pt-4 border-t border-gray-50/50 mt-2">
                    <div>
                        Showing {totalEntries > 0 ? startIndex + 1 : 0} to{" "}
                        {Math.min(startIndex + sizeNum, totalEntries)} of {totalEntries} entries
                        {searchTerm && ` (filtered from ${reportData.length} total entries)`}
                    </div>
                    {reportData.length > 0 && (
                        <div className="flex items-center gap-1.5">
                            <button 
                                disabled={safeCurrentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "h-8 w-8 transition-all duration-300 text-xs flex items-center justify-center cursor-pointer border-none font-bold",
                                        safeCurrentPage === page 
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white font-extrabold shadow-lg shadow-indigo-500/25 rounded-xl hover:scale-105 active:scale-95" 
                                            : "bg-white hover:bg-gray-50/80 text-gray-500 hover:text-gray-700 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 border border-gray-100"
                                    )}
                                >
                                    {page}
                                </button>
                            ))}
                            <button 
                                disabled={safeCurrentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
