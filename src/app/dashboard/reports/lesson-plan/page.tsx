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
    BookOpen, 
    Printer, 
    Copy, 
    FileSpreadsheet, 
    FileDown, 
    ChevronLeft, 
    ChevronRight,
    Eye,
    Plus,
    Monitor
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function DonutSkeleton() {
    return (
        <div className="flex flex-col items-center space-y-3">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-4 w-16 rounded" />
        </div>
    );
}

const reportLinks = [
    { name: "Syllabus Status Report", icon: FileText },
    { name: "Subject Lesson Plan Report", icon: BookOpen },
];

interface TopicItem {
    name: string;
    status: string;
    date?: string;
}

interface LessonItem {
    name: string;
    percentage: number;
    topics: TopicItem[];
}

interface SubjectLessonItem {
    name: string;
    code: string;
    percentage: number;
    lessons: LessonItem[];
}

const defaultSyllabusStatus = [
    { subject: "English (210)", percentage: 37 },
    { subject: "Hindi (230)", percentage: 100 },
    { subject: "Mathematics (110)", percentage: 75 },
    { subject: "Science (111)", percentage: 67 },
    { subject: "Drawing (200)", percentage: 100 },
    { subject: "Computer (00220)", percentage: 87 },
    { subject: "Elective 1 (101)", percentage: 50 },
];

const defaultSubjectLessons: SubjectLessonItem[] = [
    {
        name: "English (210)", code: "210", percentage: 37,
        lessons: [
            {
                name: "1 First Day at School", percentage: 100,
                topics: [
                    { name: "1.1 School Life", status: "Complete", date: "04/10/2025" },
                    { name: "1.2 School Day`s", status: "Complete", date: "04/12/2025" },
                    { name: "1.3 Chapter-2", status: "Complete", date: "12/26/2025" },
                ],
            },
            {
                name: "2 The Wind and the Sun", percentage: 100,
                topics: [
                    { name: "2.1 The Wind", status: "Complete", date: "04/15/2025" },
                ],
            },
            {
                name: "3 Storm in the Garden", percentage: 100,
                topics: [
                    { name: "3.1 My Garden", status: "Complete", date: "04/25/2025" },
                    { name: "3.2 Chapter 2", status: "Complete", date: "11/20/2025" },
                ],
            },
            {
                name: "4 The Grasshopper and the Ant", percentage: 67,
                topics: [
                    { name: "4.1 The Ant", status: "Complete", date: "08/20/2025" },
                    { name: "4.2 Chapter 4", status: "Complete", date: "10/25/2025" },
                    { name: "4.3 Chapter-5", status: "Incomplete" },
                ],
            },
        ],
    },
];

interface Subject {
    id: string;
    name: string;
    code?: string;
}

interface SubjectGroup {
    id: string;
    name: string;
    subjects: Subject[];
}

interface ReportItem {
    teacher_name: string;
    lesson_name: string;
    topic_name: string;
    sub_topic: string;
    date: string;
    time_from: string;
    time_to: string;
}

interface SchoolClass {
    id: string;
    name: string;
    sections: { id: string; name: string }[];
    subject_groups?: SubjectGroup[];
}

function DonutChart({ percentage, title }: { percentage: number; title: string }) {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center space-y-3">
            <span className="text-[10px] font-bold text-gray-700 tracking-tight">{title}</span>
            <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        className="text-gray-200"
                    />
                    <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="text-[#4caf50]"
                    />
                </svg>
            </div>
            <div className="bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded">
                Complete {percentage}%
            </div>
        </div>
    );
}

export default function LessonPlanReportPage() {
    const [activeTab, setActiveTab] = useState("Syllabus Status Report");
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>("");
    const [selectedSection, setSelectedSection] = useState<string>("");
    const [selectedSubjectGroup, setSelectedSubjectGroup] = useState<string>("");
    const [selectedSubject, setSelectedSubject] = useState<string>("");
    const [reportData, setReportData] = useState<ReportItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSearched, setIsSearched] = useState(false);
    const [syllabusData, setSyllabusData] = useState(defaultSyllabusStatus);
    const [subjectLessons, setSubjectLessons] = useState<SubjectLessonItem[]>(defaultSubjectLessons);

    // Search and Pagination States
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [itemsPerPage, setItemsPerPage] = useState<string>("50");
    const [currentPage, setCurrentPage] = useState<number>(1);

    useEffect(() => {
        fetchCriteria();
    }, []);

    const fetchCriteria = async () => {
        interface RawItem { id: number | string; name: string; class_id?: number | string; code?: string; subjects?: RawItem[]; }

        function extractItems(d: unknown): RawItem[] {
            if (!d || typeof d !== 'object') return [];
            const obj = d as Record<string, unknown>;
            const inner = obj.data;
            if (inner && typeof inner === 'object') {
                const innerObj = inner as Record<string, unknown>;
                if (Array.isArray(innerObj.data)) return innerObj.data as RawItem[];
                if (Array.isArray(innerObj.sections)) return innerObj.sections as RawItem[];
            }
            if (Array.isArray(inner)) return inner as RawItem[];
            if (Array.isArray(obj)) return obj as RawItem[];
            return [];
        }

        const fallback: SchoolClass[] = [
            { id: "1", name: "Class 1", sections: [{ id: "1", name: "A" }, { id: "2", name: "B" }, { id: "3", name: "C" }], subject_groups: [{ id: "1", name: "Class 1st Subject Group", subjects: [{ id: "1", name: "English", code: "210" }, { id: "2", name: "Hindi", code: "230" }, { id: "3", name: "Mathematics", code: "110" }, { id: "4", name: "Science", code: "111" }, { id: "5", name: "Drawing", code: "200" }, { id: "6", name: "Computer", code: "00220" }, { id: "7", name: "Elective 1", code: "101" }] }] },
            { id: "2", name: "Class 2", sections: [{ id: "4", name: "A" }, { id: "5", name: "B" }], subject_groups: [{ id: "2", name: "Class 2nd Subject Group", subjects: [{ id: "8", name: "English", code: "220" }, { id: "9", name: "Hindi", code: "240" }, { id: "10", name: "Mathematics", code: "120" }] }] },
            { id: "3", name: "Class 3", sections: [{ id: "6", name: "A" }, { id: "7", name: "B" }, { id: "8", name: "C" }], subject_groups: [{ id: "3", name: "Class 3rd Subject Group", subjects: [{ id: "11", name: "English", code: "310" }, { id: "12", name: "Mathematics", code: "320" }] }] },
        ];

        try {
            const response = await api.get('/reports/lesson-plan/criteria');
            const data = response.data.classes || response.data.data || [];
            if (data.length > 0) {
                setClasses(data);
            } else {
                setClasses(fallback);
            }
        } catch (error) {
            console.error("Failed to load lesson plan criteria", error);
            setClasses(fallback);
        }
    };

    const handleSearch = async () => {
        if (!selectedClass || !selectedSection || !selectedSubjectGroup || !selectedSubject) {
            toast.error("Please select all required criteria fields");
            return;
        }

        setLoading(true);
        try {
            const response = await api.get('/reports/lesson-plan/report', {
                params: {
                    school_class_id: selectedClass,
                    section_id: selectedSection,
                    subject_group_id: selectedSubjectGroup,
                    subject_id: selectedSubject,
                }
            });
            setReportData(response.data.data);
            setIsSearched(true);
            setCurrentPage(1);
            toast.success("Lesson plan report loaded successfully");
        } catch (error) {
            console.error("Failed to load lesson plan report", error);
            toast.error("Failed to load report data");
        } finally {
            setLoading(false);
        }
    };

    // Extract dynamic sections and subject groups
    const selectedClassData = classes.find(c => c.id.toString() === selectedClass);
    const sections = selectedClassData?.sections || [];
    const subjectGroups = selectedClassData?.subject_groups || [];
    const selectedGroupData = subjectGroups.find(g => g.id.toString() === selectedSubjectGroup);
    const subjects = selectedGroupData?.subjects || [];

    // Local filters
    const filteredData = reportData.filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (item.teacher_name && item.teacher_name.toLowerCase().includes(term)) ||
            (item.lesson_name && item.lesson_name.toLowerCase().includes(term)) ||
            (item.topic_name && item.topic_name.toLowerCase().includes(term)) ||
            (item.sub_topic && item.sub_topic.toLowerCase().includes(term))
        );
    });

    // Pagination
    const totalEntries = filteredData.length;
    const sizeNum = parseInt(itemsPerPage);
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safeCurrentPage = Math.min(currentPage, totalPages) || 1;
    const startIndex = (safeCurrentPage - 1) * sizeNum;
    const paginatedData = filteredData.slice(startIndex, startIndex + sizeNum);

    // Exports
    const exportToCopy = () => {
        if (filteredData.length === 0) {
            toast.error("No data available to copy");
            return;
        }
        const text = [
            "Teacher\tLesson Name\tTopic Name\tSub Topic\tDate\tTime From\tTime To",
            ...filteredData.map(item => `${item.teacher_name}\t${item.lesson_name}\t${item.topic_name}\t${item.sub_topic}\t${item.date}\t${item.time_from}\t${item.time_to}`)
        ].join("\n");

        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const exportToExcel = (isCsv = false) => {
        if (filteredData.length === 0) {
            toast.error("No data available to export");
            return;
        }
        const mappedData = filteredData.map(item => ({
            "Teacher": item.teacher_name,
            "Lesson Name": item.lesson_name,
            "Topic Name": item.topic_name,
            "Sub Topic": item.sub_topic,
            "Date": item.date,
            "Time From": item.time_from,
            "Time To": item.time_to,
        }));

        const worksheet = XLSX.utils.json_to_sheet(mappedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Subject Lesson Plan Report");

        if (isCsv) {
            XLSX.writeFile(workbook, "subject_lesson_plan_report.csv", { bookType: "csv" });
            toast.success("CSV file downloaded");
        } else {
            XLSX.writeFile(workbook, "subject_lesson_plan_report.xlsx");
            toast.success("Excel file downloaded");
        }
    };

    const exportToPDF = () => {
        if (filteredData.length === 0) {
            toast.error("No data available to export");
            return;
        }
        const doc = new jsPDF();
        const head = [["Teacher", "Lesson Name", "Topic Name", "Sub Topic", "Date", "Time From", "Time To"]];
        const body = filteredData.map(item => [item.teacher_name, item.lesson_name, item.topic_name, item.sub_topic, item.date, item.time_from, item.time_to]);

        autoTable(doc, { head, body });
        doc.save("subject_lesson_plan_report.pdf");
        toast.success("PDF file downloaded");
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-4 lg:p-6 space-y-5 animate-in fade-in duration-500 pb-20 text-xs">
            {/* Gradient header card with report-type tabs inside */}
            <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] overflow-hidden pt-0 gap-0">
                <CardHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <BookOpen className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold text-slate-800 leading-none">Lesson Plan Report</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">Syllabus completion status and subject lesson plans</p>
                            </div>
                        </div>
                        <Link
                            href="/user/lesson-plan"
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
                                        "p-2 rounded-lg transition-all duration-300",
                                        isActive ? "bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                                    )}>
                                        <link.icon className="h-4 w-4" />
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-bold tracking-tight uppercase transition-colors duration-300",
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                        <Select value={selectedClass} onValueChange={(val) => { setSelectedClass(val); setSelectedSection(""); setSelectedSubjectGroup(""); setSelectedSubject(""); }}>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(c => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
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
                                {sections.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Subject Group <span className="text-red-500">*</span></Label>
                        <Select value={selectedSubjectGroup} onValueChange={(val) => { setSelectedSubjectGroup(val); setSelectedSubject(""); }}>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {subjectGroups.map(g => (
                                    <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Subject <span className="text-red-500">*</span></Label>
                        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {subjects.map(sub => (
                                    <SelectItem key={sub.id} value={sub.id.toString()}>{sub.name} {sub.code ? `(${sub.code})` : ''}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end">
                    {activeTab === "Subject Lesson Plan Report" ? (
                        <Button 
                            onClick={handleSearch}
                            disabled={loading}
                            variant="gradient"
                            className="text-white px-6 h-9 text-xs font-bold transition-all rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
                        >
                            <Search className="h-4 w-4" />
                            {loading ? "Searching..." : "Search"}
                        </Button>
                    ) : (
                        <Button 
                            onClick={async () => {
                                if (!selectedClass || !selectedSection || !selectedSubjectGroup) {
                                    toast.error("Please select Class, Section, and Subject Group first");
                                    return;
                                }
                                setLoading(true);
                                try {
                                    const res = await api.get("/reports/lesson-plan/syllabus", {
                                        params: {
                                            school_class_id: selectedClass,
                                            section_id: selectedSection,
                                            subject_group_id: selectedSubjectGroup,
                                        }
                                    });
                                    const syllabus = res.data.syllabus || [];
                                    setSyllabusData(syllabus);
                                    
                                    const mappedLessons = syllabus.map((item: any) => ({
                                        name: item.subject,
                                        percentage: item.percentage,
                                        lessons: (item.lessons || []).map((les: any) => ({
                                            name: les.lesson_name,
                                            percentage: les.percentage,
                                            topics: (les.topics || []).map((top: any) => ({
                                                name: top.topic_name,
                                                status: top.is_completed ? "Complete" : "Incomplete",
                                                date: top.completion_date
                                            }))
                                        }))
                                    }));
                                    setSubjectLessons(mappedLessons);
                                    
                                    setIsSearched(true);
                                    toast.success("Syllabus status loaded successfully");
                                } catch (error) {
                                    console.error("Failed to load syllabus status", error);
                                    toast.error("Failed to load syllabus status");
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                            variant="gradient"
                            className="text-white px-6 h-9 text-xs font-bold transition-all rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
                        >
                            <Search className="h-4 w-4" />
                            {loading ? "Searching..." : "Search"}
                        </Button>
                    )}
                </div>
            </div>

            {/* Syllabus Status Report Tab */}
            {activeTab === "Syllabus Status Report" && (
                <>
                    {/* Loading skeleton */}
                    {loading && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-8">
                            <Skeleton className="h-3 w-40 rounded" />
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-y-10">
                                {Array.from({ length: 6 }).map((_, i) => <DonutSkeleton key={i} />)}
                            </div>
                        </div>
                    )}

                    {/* Syllabus Status Report Section */}
                    {!loading && isSearched && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-8 animate-fadeIn">
                            <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Syllabus Status Report</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-y-10">
                                 {syllabusData.map((item) => (
                                    <DonutChart key={item.subject} title={item.subject} percentage={item.percentage} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Subject - Lesson - Topic Status Section */}
                    {!loading && isSearched && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
                            <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                                <div className="space-y-1">
                                    <p className="text-[9px] text-indigo-500 italic font-medium tracking-tight">Note : Subject Percentage Based On Topic.</p>
                                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Subject - Lesson - Topic Status</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={handlePrint} className="h-7 w-7 text-indigo-500 border border-indigo-100 rounded">
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={exportToPDF} className="h-7 w-7 text-indigo-500 border border-indigo-100 rounded">
                                        <FileDown className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>

                            <div className="p-4">
                                <div className="space-y-6">
                                    {subjectLessons.map((subject, si) => (
                                        <div key={si} className="space-y-3">
                                            <div className="flex justify-between items-center border-b border-gray-50 pb-1.5">
                                                <h3 className="text-[11px] font-bold text-gray-800">{subject.name}</h3>
                                                <span className="text-[10px] font-bold text-gray-500">{subject.percentage}% Complete</span>
                                            </div>

                                            <div className="pl-4 space-y-4">
                                                {subject.lessons.map((lesson, li) => (
                                                    <div key={li} className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] font-bold text-gray-700">{lesson.name}</span>
                                                            <span className="text-[10px] font-bold text-gray-500">{lesson.percentage}% Complete</span>
                                                        </div>
                                                        <div className="pl-6 space-y-1.5 text-[10px] text-gray-500">
                                                            {lesson.topics.map((topic, ti) => (
                                                                <div key={ti} className="flex justify-between italic">
                                                                    <span>{topic.name}</span>
                                                                    {topic.status === "Complete" || topic.status === "complete" ? (
                                                                        <span className="text-gray-400">Complete ({topic.date || "N/A"})</span>
                                                                    ) : (
                                                                        <span className="text-red-400 font-bold">Incomplete</span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Subject Lesson Plan Report Tab */}
            {activeTab === "Subject Lesson Plan Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
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
                                <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4">Teacher</TableHead>
                                    <TableHead className="py-3 px-4">Lesson Name</TableHead>
                                    <TableHead className="py-3 px-4">Topic Name</TableHead>
                                    <TableHead className="py-3 px-4">Sub Topic</TableHead>
                                    <TableHead className="py-3 px-4">Date</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Time From</TableHead>
                                    <TableHead className="py-3 px-4 text-center">Time To</TableHead>
                                    <TableHead className="py-3 px-4 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableSkeleton cols={8} />
                                ) : paginatedData.length > 0 ? (
                                    paginatedData.map((item, index) => (
                                        <TableRow key={index} className="hover:bg-gray-50/50 border-b border-gray-100 text-[11px] text-gray-600">
                                            <TableCell className="py-3 px-4 font-bold text-gray-800">{item.teacher_name}</TableCell>
                                            <TableCell className="py-3 px-4 font-medium">{item.lesson_name}</TableCell>
                                            <TableCell className="py-3 px-4">{item.topic_name}</TableCell>
                                            <TableCell className="py-3 px-4 italic text-gray-500">{item.sub_topic}</TableCell>
                                            <TableCell className="py-3 px-4 font-semibold text-indigo-600">{item.date}</TableCell>
                                            <TableCell className="py-3 px-4 text-center font-medium text-emerald-600">{item.time_from}</TableCell>
                                            <TableCell className="py-3 px-4 text-center font-medium text-rose-600">{item.time_to}</TableCell>
                                            <TableCell className="py-3 px-4 text-right">
                                                <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="hover:bg-transparent h-64">
                                        <TableCell colSpan={8} className="text-center py-12">
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
            )}
        </div>
    );
}
