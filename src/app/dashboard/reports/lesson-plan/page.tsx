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
    BookOpen, 
    Printer, 
    Copy, 
    FileSpreadsheet, 
    FileDown, 
    ChevronLeft, 
    ChevronRight,
    Eye,
    Plus,
    Monitor,
    Filter
} from "lucide-react";
import { 
    cn, 
    toLocaleNumber, 
    translateClassName, 
    translateSectionName, 
    translateSubjectName 
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
    { id: "Syllabus Status Report", key: "syllabus_status_report", icon: FileText },
    { id: "Subject Lesson Plan Report", key: "subject_lesson_plan_report", icon: BookOpen },
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
                name: "Chapter 1 First Day at School", percentage: 100,
                topics: [
                    { name: "1.1 School Life", status: "Complete", date: "04/10/2025" },
                    { name: "1.2 School Days", status: "Complete", date: "04/12/2025" },
                    { name: "1.3 Chapter 2", status: "Complete", date: "12/26/2025" },
                ],
            },
            {
                name: "Chapter 2 The Wind and the Sun", percentage: 100,
                topics: [
                    { name: "2.1 The Wind", status: "Complete", date: "04/15/2025" },
                ],
            },
            {
                name: "Chapter 3 Storm in the Garden", percentage: 100,
                topics: [
                    { name: "3.1 My Garden", status: "Complete", date: "04/25/2025" },
                    { name: "3.2 Chapter 2", status: "Complete", date: "11/20/2025" },
                ],
            },
            {
                name: "Chapter 4 The Grasshopper and the Ant", percentage: 67,
                topics: [
                    { name: "4.1 The Ant", status: "Complete", date: "08/20/2025" },
                    { name: "4.2 Chapter 4", status: "Complete", date: "10/25/2025" },
                    { name: "4.3 Chapter 5", status: "Incomplete" },
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

function translateSubjectWithCode(title?: string | null, langCode: string = "en"): string {
    if (!title) return "";
    const match = title.match(/^(.*?)\s*\((\d+)\)$/);
    if (match) {
        const subName = match[1].trim();
        const code = match[2];
        return `${translateSubjectName(subName, langCode)} (${toLocaleNumber(code, langCode)})`;
    }
    return translateSubjectName(title, langCode);
}

function translateLessonTopicName(name?: string | null, langCode: string = "en"): string {
    if (!name) return "";
    if (langCode === "en") return name;

    let result = name;
    if (langCode === "bn") {
        result = result
            .replace(/Chapter\s*(\d+)/gi, (_, num) => `অধ্যায় ${toLocaleNumber(num, "bn")}`)
            .replace(/Chapter/gi, "অধ্যায়")
            .replace(/First Day at School/gi, "বিদ্যালয়ে প্রথম দিন")
            .replace(/School Life/gi, "বিদ্যালয় জীবন")
            .replace(/School Day['`]?s/gi, "বিদ্যালয়ের দিনগুলি")
            .replace(/The Wind and the Sun/gi, "বাতাস ও সূর্য")
            .replace(/Storm in the Garden/gi, "বাগানে ঝড়")
            .replace(/The Grasshopper and the Ant/gi, "ঘাসফড়িং ও পিঁপড়া")
            .replace(/Size and Shape/gi, "আকার ও আকৃতি")
            .replace(/Noun/gi, "বিশেষ্য (Noun)")
            .replace(/Mayer Valovasha/gi, "মায়ের ভালোবাসা");
    } else if (langCode === "ar") {
        result = result
            .replace(/Chapter\s*(\d+)/gi, (_, num) => `الفصل ${toLocaleNumber(num, "ar")}`)
            .replace(/Chapter/gi, "الفصل")
            .replace(/First Day at School/gi, "اليوم الأول في المدرسة")
            .replace(/School Life/gi, "الحياة المدرسية")
            .replace(/The Wind and the Sun/gi, "الريح والشمس")
            .replace(/Storm in the Garden/gi, "عاصفة في الحديقة")
            .replace(/The Grasshopper and the Ant/gi, "الجراد والنملة")
            .replace(/Size and Shape/gi, "الحجم والشكل")
            .replace(/Noun/gi, "الاسم (Noun)")
            .replace(/Mayer Valovasha/gi, "حب الأم");
    } else if (langCode === "hi") {
        result = result
            .replace(/Chapter\s*(\d+)/gi, (_, num) => `अध्याय ${toLocaleNumber(num, "hi")}`)
            .replace(/Chapter/gi, "अध्याय")
            .replace(/First Day at School/gi, "स्कूल में पहला दिन")
            .replace(/School Life/gi, "स्कूल जीवन")
            .replace(/The Wind and the Sun/gi, "हवा और सूरज")
            .replace(/Storm in the Garden/gi, "बगीचे में तूफान")
            .replace(/The Grasshopper and the Ant/gi, "टिड्डा और चींटी")
            .replace(/Size and Shape/gi, "आकार और रूप")
            .replace(/Noun/gi, "संज्ञा (Noun)")
            .replace(/Mayer Valovasha/gi, "मां का प्यार");
    }

    return result.replace(/\d+/g, (digitStr) => toLocaleNumber(digitStr, langCode));
}

function DonutChart({ percentage, title, langCode, t }: { percentage: number; title: string; langCode: string; t: any }) {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center space-y-3">
            <span className="text-[11px] font-bold text-gray-700 tracking-tight text-center">
                {translateSubjectWithCode(title, langCode)}
            </span>
            <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="transparent"
                        className="text-gray-100"
                    />
                    <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className={percentage === 100 ? "text-emerald-500" : percentage > 0 ? "text-indigo-500" : "text-gray-300"}
                    />
                </svg>
            </div>
            <div className={cn(
                "text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs",
                percentage === 100 
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                    : percentage > 0 
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200" 
                        : "bg-gray-100 text-gray-600 border border-gray-200"
            )}>
                {t("complete") || "Complete"} {toLocaleNumber(percentage, langCode)}%
            </div>
        </div>
    );
}

export default function LessonPlanReportPage() {
    const { t, language } = useLanguage();
    const langCode = language?.short_code || "en";
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
            toast.warning(t("please_select_a_class") || "Please select all required criteria fields");
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
            setReportData(response.data.data || []);
            setIsSearched(true);
            setCurrentPage(1);
            toast.success(t("report_results") || "Lesson plan report loaded successfully");
        } catch (error) {
            console.error("Failed to load lesson plan report", error);
            toast.error(t("failed_to_fetch_report") || "Failed to load report data");
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
            toast.warning(t("no_data_available_in_table") || "No data available to copy");
            return;
        }
        const text = [
            `${t("teacher")}\t${t("lesson_name")}\t${t("topic_name")}\t${t("sub_topic")}\t${t("date")}\t${t("time_from")}\t${t("time_to")}`,
            ...filteredData.map(item => `${item.teacher_name}\t${translateLessonTopicName(item.lesson_name, langCode)}\t${translateLessonTopicName(item.topic_name, langCode)}\t${item.sub_topic}\t${item.date}\t${item.time_from}\t${item.time_to}`)
        ].join("\n");

        navigator.clipboard.writeText(text);
        toast.success(t("copied_to_clipboard") || "Copied to clipboard");
    };

    const exportToExcel = (isCsv = false) => {
        if (filteredData.length === 0) {
            toast.warning(t("no_data_available_in_table") || "No data available to export");
            return;
        }
        const mappedData = filteredData.map(item => ({
            [t("teacher") || "Teacher"]: item.teacher_name,
            [t("lesson_name") || "Lesson Name"]: translateLessonTopicName(item.lesson_name, langCode),
            [t("topic_name") || "Topic Name"]: translateLessonTopicName(item.topic_name, langCode),
            [t("sub_topic") || "Sub Topic"]: item.sub_topic,
            [t("date") || "Date"]: item.date,
            [t("time_from") || "Time From"]: item.time_from,
            [t("time_to") || "Time To"]: item.time_to,
        }));

        const worksheet = XLSX.utils.json_to_sheet(mappedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Subject Lesson Plan Report");

        if (isCsv) {
            XLSX.writeFile(workbook, "subject_lesson_plan_report.csv", { bookType: "csv" });
            toast.success(t("csv_file_downloaded") || "CSV file downloaded");
        } else {
            XLSX.writeFile(workbook, "subject_lesson_plan_report.xlsx");
            toast.success(t("excel_file_downloaded") || "Excel file downloaded");
        }
    };

    const exportToPDF = () => {
        if (filteredData.length === 0) {
            toast.warning(t("no_data_available_in_table") || "No data available to export");
            return;
        }
        const doc = new jsPDF();
        const head = [[t("teacher") || "Teacher", t("lesson_name") || "Lesson Name", t("topic_name") || "Topic Name", t("sub_topic") || "Sub Topic", t("date") || "Date", t("time_from") || "Time From", t("time_to") || "Time To"]];
        const body = filteredData.map(item => [item.teacher_name, translateLessonTopicName(item.lesson_name, langCode), translateLessonTopicName(item.topic_name, langCode), item.sub_topic, item.date, item.time_from, item.time_to]);

        autoTable(doc, { head, body });
        doc.save("subject_lesson_plan_report.pdf");
        toast.success(t("pdf_file_downloaded") || "PDF file downloaded");
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6 pb-20 text-xs">
            {/* Standalone Edge-to-Edge Gradient Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <BookOpen className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                            {t("lesson_plan_report") || "Lesson Plan Report"}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">
                            {t("lesson_plan_report_description") || "View syllabus status and subject lesson plan reports"}
                        </p>
                    </div>
                </div>
                <Link
                    href="/user/lesson-plan"
                    className="flex items-center gap-1.5 h-8 px-4 rounded-full text-white text-xs font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] transition-all active:scale-95 shadow-md shrink-0"
                >
                    <Monitor className="h-3.5 w-3.5" />
                    {t("student_portal_view") || "Student Portal View"}
                </Link>
            </div>

            {/* Navigation Grid of 2 Report Tabs */}
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold text-gray-600">
                            {t("class")} <span className="text-red-500">*</span>
                        </Label>
                        <Select value={selectedClass} onValueChange={(val) => { setSelectedClass(val); setSelectedSection(""); setSelectedSubjectGroup(""); setSelectedSubject(""); }}>
                            <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                <SelectValue placeholder={t("select_class") || "Select Class"}>
                                    {selectedClass ? translateClassName(classes.find(c => c.id.toString() === selectedClass)?.name, langCode) : (t("select_class") || "Select Class")}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(c => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{translateClassName(c.name, langCode)}</SelectItem>
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
                                    {selectedSection ? translateSectionName(sections.find(s => s.id.toString() === selectedSection)?.name, langCode) : (t("select") || "Select")}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {sections.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{translateSectionName(s.name, langCode)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold text-gray-600">
                            {t("subject_group") || "Subject Group"} <span className="text-red-500">*</span>
                        </Label>
                        <Select value={selectedSubjectGroup} onValueChange={(val) => { setSelectedSubjectGroup(val); setSelectedSubject(""); }}>
                            <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                <SelectValue placeholder={t("select") || "Select"}>
                                    {selectedSubjectGroup ? (subjectGroups.find(g => g.id.toString() === selectedSubjectGroup)?.name || selectedSubjectGroup) : (t("select") || "Select")}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {subjectGroups.map(g => (
                                    <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-semibold text-gray-600">
                            {t("subject")} <span className="text-red-500">*</span>
                        </Label>
                        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                            <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                <SelectValue placeholder={t("select") || "Select"}>
                                    {selectedSubject ? (translateSubjectWithCode(subjects.find(sub => sub.id.toString() === selectedSubject)?.name, langCode)) : (t("select") || "Select")}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {subjects.map(sub => (
                                    <SelectItem key={sub.id} value={sub.id.toString()}>
                                        {translateSubjectWithCode(sub.name, langCode)} {sub.code ? `(${toLocaleNumber(sub.code, langCode)})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    {activeTab === "Subject Lesson Plan Report" ? (
                        <Button 
                            onClick={handleSearch}
                            disabled={loading}
                            className="h-9 px-6 text-xs font-bold rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-sm shadow-orange-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                        >
                            <Search className="h-3.5 w-3.5" />
                            {loading ? (t("loading") || "Loading...") : (t("search") || "Search")}
                        </Button>
                    ) : (
                        <Button 
                            onClick={async () => {
                                if (!selectedClass || !selectedSection || !selectedSubjectGroup) {
                                    toast.warning(t("please_select_a_class") || "Please select class, section and subject group");
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
                                    toast.success(t("syllabus_status_report") || "Syllabus status loaded");
                                } catch {
                                    toast.error(t("failed_to_fetch_report") || "Failed to load report");
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                            className="h-9 px-6 text-xs font-bold rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-sm shadow-orange-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                        >
                            <Search className="h-3.5 w-3.5" />
                            {loading ? (t("loading") || "Loading...") : (t("search") || "Search")}
                        </Button>
                    )}
                </div>
            </div>

            {/* Syllabus Status Report Tab */}
            {activeTab === "Syllabus Status Report" && (
                <>
                    {/* Loading skeleton */}
                    {loading && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-8">
                            <Skeleton className="h-3 w-40 rounded" />
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-y-10">
                                {Array.from({ length: 6 }).map((_, i) => <DonutSkeleton key={i} />)}
                            </div>
                        </div>
                    )}

                    {/* Syllabus Status Report Section */}
                    {!loading && isSearched && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-8 animate-fadeIn">
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-gray-100 pb-3">
                                {t("syllabus_status_report") || "Syllabus Status Report"}
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-y-10 gap-x-4">
                                {syllabusData.map((item) => (
                                    <DonutChart key={item.subject} title={item.subject} percentage={item.percentage} langCode={langCode} t={t} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Subject - Lesson - Topic Status Section */}
                    {!loading && isSearched && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] text-indigo-600 font-medium">
                                        {t("note_subject_percentage_based_on_topic") || "Note : Subject Percentage Based On Topic."}
                                    </p>
                                    <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        {t("subject_lesson_topic_status") || "Subject - Lesson - Topic Status"}
                                    </h2>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        onClick={handlePrint} 
                                        className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 text-gray-600"
                                        title={t("print") || "Print"}
                                    >
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        onClick={exportToPDF} 
                                        className="h-7 w-7 rounded-lg border-gray-200 hover:bg-gray-50 text-gray-600"
                                        title={t("pdf") || "PDF"}
                                    >
                                        <FileDown className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="space-y-6">
                                    {subjectLessons.map((subject, si) => (
                                        <div key={si} className="space-y-3 border-b border-gray-100 pb-5 last:border-b-0 last:pb-0">
                                            <div className="flex justify-between items-center pb-1.5">
                                                <h3 className="text-xs font-bold text-gray-800">
                                                    {translateSubjectWithCode(subject.name, langCode)}
                                                </h3>
                                                <span className="text-[11px] font-bold text-indigo-600">
                                                    {toLocaleNumber(subject.percentage, langCode)}% {t("complete") || "Complete"}
                                                </span>
                                            </div>

                                            <div className="pl-4 space-y-4">
                                                {subject.lessons.map((lesson, li) => (
                                                    <div key={li} className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[11px] font-semibold text-gray-700">
                                                                {translateLessonTopicName(lesson.name, langCode)}
                                                            </span>
                                                            <span className="text-[10px] font-semibold text-gray-500">
                                                                {toLocaleNumber(lesson.percentage, langCode)}% {t("complete") || "Complete"}
                                                            </span>
                                                        </div>
                                                        <div className="pl-6 space-y-1.5 text-[10px] text-gray-500">
                                                            {lesson.topics.map((topic, ti) => (
                                                                <div key={ti} className="flex justify-between items-center italic">
                                                                    <span>{translateLessonTopicName(topic.name, langCode)}</span>
                                                                    {topic.status === "Complete" || topic.status === "complete" ? (
                                                                        <span className="text-emerald-600 font-medium">
                                                                            {t("complete") || "Complete"} ({toLocaleNumber(topic.date || "N/A", langCode)})
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-rose-500 font-bold">
                                                                            {t("incomplete") || "Incomplete"}
                                                                        </span>
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
                <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white overflow-hidden flex flex-col justify-between min-h-[480px]">
                    <div className="space-y-4">
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

                        <div className="rounded-xl border border-gray-200/80 overflow-x-auto shadow-2xs">
                            <Table className="min-w-full">
                                <TableHeader className="bg-gray-50/75 text-xs uppercase">
                                    <TableRow className="hover:bg-transparent border-b border-gray-200 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-2.5 px-4">{t("teacher") || "Teacher"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("lesson_name") || "Lesson Name"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("topic_name") || "Topic Name"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("sub_topic") || "Sub Topic"}</TableHead>
                                        <TableHead className="py-2.5 px-4">{t("date") || "Date"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("time_from") || "Time From"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-center">{t("time_to") || "Time To"}</TableHead>
                                        <TableHead className="py-2.5 px-4 text-right">{t("action") || "Action"}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton cols={8} />
                                    ) : paginatedData.length > 0 ? (
                                        paginatedData.map((item, index) => (
                                            <TableRow key={index} className="hover:bg-indigo-50/40 hover:shadow-xs transition-colors border-b border-gray-100 text-[11px] text-gray-600">
                                                <TableCell className="py-3 px-4 font-bold text-gray-800">{item.teacher_name}</TableCell>
                                                <TableCell className="py-3 px-4 font-medium">{translateLessonTopicName(item.lesson_name, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4">{translateLessonTopicName(item.topic_name, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 italic text-gray-500">{item.sub_topic}</TableCell>
                                                <TableCell className="py-3 px-4 font-semibold text-indigo-600">{toLocaleNumber(item.date, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-center font-medium text-emerald-600">{toLocaleNumber(item.time_from, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-center font-medium text-rose-600">{toLocaleNumber(item.time_to, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-right">
                                                    <Button 
                                                        size="icon" 
                                                        variant="ghost" 
                                                        className="h-7 w-7 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xs active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                                                        title={t("view") || "View"}
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={8} className="text-center py-12">
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
            )}
        </div>
    );
}

