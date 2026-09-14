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
import { Input } from "@/components/ui/input";
import {
    Search,
    FileText,
    BookOpen,
    ClipboardCheck,
    CalendarCheck,
    Copy,
    FileSpreadsheet,
    FileBox,
    Printer,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Plus,
    BookMarked,
    Eye,
    Monitor,
    Filter
} from "lucide-react";
import { cn, translateClassName, translateSectionName, toLocaleNumber } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/providers/language-provider";

const reportLinks = [
    { id: "Homework Report", key: "homework_report", icon: FileText, active: true },
    { id: "Homework Evaluation Report", key: "homework_evaluation_report", icon: ClipboardCheck },
    { id: "Daily Assignment Report", key: "daily_assignment_report", icon: CalendarCheck },
    { id: "Homework Marks Report", key: "homework_marks_report", icon: BookOpen },
];

const searchTypes = [
    { key: "today",       label: "Today",       value: "today"      },
    { key: "this_week",   label: "This Week",   value: "this_week"  },
    { key: "this_month",  label: "This Month",  value: "this_month" },
    { key: "last_month",  label: "Last Month",  value: "last_month" },
    { key: "this_year",   label: "This Year",   value: "this_year"  },
    { key: "all_time",    label: "All Time",    value: "all"         },
];

interface ClassSection {
    id: number;
    name: string;
}

interface SchoolClass {
    id: number;
    name: string;
    sections: ClassSection[];
}

interface Subject {
    id: number;
    name: string;
}

interface SubjectGroup {
    id: number;
    name: string;
    subjects: Subject[];
}

interface HomeworkReportData {
    class: string;
    section: string;
    subjectGroup: string;
    subject: string;
    homeworkDate: string;
    submissionDate: string;
    studentCount: number;
    homeworkSubmitted: number;
    pendingStudent: number;
}

interface HomeworkEvaluationData {
    subject: string;
    homeworkDate: string;
    submissionDate: string;
    completeIncomplete: string;
    completePercent: number;
}

interface DailyAssignmentData {
    studentName: string;
    class: string;
    section: string;
    totalAssignment: number;
    studentId: number;
}

interface HomeworkMarksData {
    admissionNo: string;
    studentName: string;
    rollNo: string;
    homeworkDate: string;
    submissionDate: string;
    evaluationDate: string;
    totalMarks: number;
    marksObtained: number;
    note: string;
}

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

function translateSubjectName(subject?: string | null, langCode: string = "en"): string {
    if (!subject) return "";
    if (langCode === "en") return subject;
    const s = subject.trim();
    
    // Check if it has a code like "English (210)"
    const match = s.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
        const namePart = translateSubjectName(match[1], langCode);
        const codePart = toLocaleNumber(match[2], langCode);
        return `${namePart} (${codePart})`;
    }
    
    const sLower = s.toLowerCase();
    if (sLower === "bangla" || sLower === "bengali") {
        return langCode === "bn" ? "বাংলা" : langCode === "ar" ? "البنغالية" : "बंगाली";
    }
    if (sLower === "english") {
        return langCode === "bn" ? "ইংরেজি" : langCode === "ar" ? "الإنجليزية" : "अंग्रेजी";
    }
    if (sLower === "mathematics" || sLower === "math") {
        return langCode === "bn" ? "গণিত" : langCode === "ar" ? "الرياضيات" : "गणित";
    }
    if (sLower === "science") {
        return langCode === "bn" ? "বিজ্ঞান" : langCode === "ar" ? "العلوم" : "विज्ञान";
    }
    if (sLower === "social science") {
        return langCode === "bn" ? "সমাজবিজ্ঞান" : langCode === "ar" ? "العلوم الاجتماعية" : "सामाजिक विज्ञान";
    }
    if (sLower === "history") {
        return langCode === "bn" ? "ইতিহাস" : langCode === "ar" ? "التاريخ" : "इतिहास";
    }
    if (sLower === "economics") {
        return langCode === "bn" ? "অর্থনীতি" : langCode === "ar" ? "الاقتصاد" : "अर्थशास्त्र";
    }
    if (sLower === "religion" || sLower === "islamic studies") {
        return langCode === "bn" ? "ধর্ম" : langCode === "ar" ? "التربية الدينية" : "धर्म";
    }
    if (sLower === "ict" || sLower === "computer") {
        return langCode === "bn" ? "তথ্য ও যোগাযোগ প্রযুক্তি" : langCode === "ar" ? "تكنولوجيا المعلومات" : "कंप्यूटर";
    }
    if (sLower === "physics") {
        return langCode === "bn" ? "পদার্থবিজ্ঞান" : langCode === "ar" ? "الفيزياء" : "भौतिकी";
    }
    if (sLower === "chemistry") {
        return langCode === "bn" ? "রসায়ন" : langCode === "ar" ? "الكيمياء" : "रसायन विज्ञान";
    }
    if (sLower === "biology") {
        return langCode === "bn" ? "জীববিজ্ঞান" : langCode === "ar" ? "الأحياء" : "जीव विज्ञान";
    }
    if (sLower === "all") {
        return langCode === "bn" ? "সকল" : langCode === "ar" ? "الكل" : "सभी";
    }
    return subject;
}

function translateSubjectGroupName(group?: string | null, langCode: string = "en"): string {
    if (!group) return "";
    if (langCode === "en") return group;
    const gLower = group.toLowerCase().trim();

    if (gLower.includes("class 1")) {
        return langCode === "bn" ? "১ম শ্রেণির বিষয় গ্রুপ" : langCode === "ar" ? "مجموعة مواد الصف الأول" : "कक्षा 1 विषय समूह";
    }
    if (gLower.includes("class 2")) {
        if (gLower.includes("science")) {
            return langCode === "bn" ? "২য় শ্রেণির বিজ্ঞান গ্রুপ" : langCode === "ar" ? "مجموعة علوم الصف الثاني" : "कक्षा 2 विज्ञान समूह";
        }
        return langCode === "bn" ? "২য় শ্রেণির বিষয় গ্রুপ" : langCode === "ar" ? "مجموعة مواد الصف الثاني" : "कक्षा 2 विषय समूह";
    }
    if (gLower.includes("class 3")) {
        if (gLower.includes("humanities")) {
            return langCode === "bn" ? "৩য় শ্রেণির মানবিক গ্রুপ" : langCode === "ar" ? "مجموعة العلوم الإنسانية الصف الثالث" : "कक्षा 3 मानविकी समूह";
        }
        return langCode === "bn" ? "৩য় শ্রেণির বিষয় গ্রুপ" : langCode === "ar" ? "مجموعة مواد الصف الثالث" : "कक्षा 3 विषय समूह";
    }
    if (gLower.includes("class 4")) {
        if (gLower.includes("commerce")) {
            return langCode === "bn" ? "৪র্থ শ্রেণির বাণিজ্য গ্রুপ" : langCode === "ar" ? "مجموعة التجارة الصف الرابع" : "कक्षा 4 वाणिज्य समूह";
        }
        return langCode === "bn" ? "৪র্থ শ্রেণির বিষয় গ্রুপ" : langCode === "ar" ? "مجموعة مواد الصف الرابع" : "कक्षा 4 विषय समूह";
    }
    if (gLower.includes("class 5")) {
        return langCode === "bn" ? "৫ম শ্রেণির বিষয় গ্রুপ" : langCode === "ar" ? "مجموعة مواد الصف الخامس" : "कक्षा 5 विषय समूह";
    }
    if (gLower === "all") {
        return langCode === "bn" ? "সকল" : langCode === "ar" ? "الكل" : "सभी";
    }
    return group;
}

function translateStudentName(name?: string | null, langCode: string = "en"): string {
    if (!name || name === "-") return name || "";
    if (langCode === "en") return name;
    
    const match = name.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
        const student = translateStudentName(match[1], langCode);
        const id = toLocaleNumber(match[2], langCode);
        return `${student} (${id})`;
    }

    const n = name.trim();
    if (n === "Joe Black") return langCode === "bn" ? "জো ব্ল্যাক" : langCode === "ar" ? "جو بلاك" : "जो ब्लैक";
    if (n === "Alice Green") return langCode === "bn" ? "অ্যালিস গ্রিন" : langCode === "ar" ? "أليس جرين" : "एलिस ग्रीन";
    if (n === "Bob Miller") return langCode === "bn" ? "বব মিলার" : langCode === "ar" ? "بوب ميلر" : "बॉब मिलर";
    if (n === "Clara Smith") return langCode === "bn" ? "ক্লারা স্মিথ" : langCode === "ar" ? "كلارا سميث" : "क्लारा स्मिथ";
    if (n === "David Lee") return langCode === "bn" ? "ডেভিড লি" : langCode === "ar" ? "ديفيد لي" : "डेविड ली";
    return name;
}

function translateCompleteIncomplete(val?: string | null, langCode: string = "en"): string {
    if (!val) return "";
    if (langCode === "en") return val;
    
    const v = val.trim();
    if (v.includes("/")) {
        const parts = v.split("/");
        return `${toLocaleNumber(parts[0], langCode)}/${toLocaleNumber(parts[1], langCode)}`;
    }
    const vLower = v.toLowerCase();
    if (vLower === "complete") return langCode === "bn" ? "সম্পূর্ণ" : langCode === "ar" ? "مكتمل" : "पूर्ण";
    if (vLower === "incomplete") return langCode === "bn" ? "অসম্পূর্ণ" : langCode === "ar" ? "غير مكتمل" : "अपूर्ण";
    return val;
}

function translateNote(note?: string | null, langCode: string = "en"): string {
    if (!note) return "";
    if (langCode === "en") return note;
    const n = note.toLowerCase().trim();
    if (n === "good work") return langCode === "bn" ? "ভালো কাজ" : langCode === "ar" ? "عمل جيد" : "अच्छा काम";
    if (n === "excellent") return langCode === "bn" ? "চমৎকার" : langCode === "ar" ? "ممتاز" : "उत्कृष्ट";
    if (n === "needs improvement") return langCode === "bn" ? "উন্নতি প্রয়োজন" : langCode === "ar" ? "يحتاج إلى تحسين" : "सुधार की आवश्यकता है";
    return note;
}

function formatDateDDMMYYYY(dateStr?: string | null, langCode: string = "en"): string {
    if (!dateStr || dateStr === "-") return dateStr || "-";
    const trimmed = dateStr.trim();
    if (trimmed.includes(" - ")) {
        const parts = trimmed.split(" - ");
        return `${formatDateDDMMYYYY(parts[0], langCode)} - ${formatDateDDMMYYYY(parts[1], langCode)}`;
    }
    const yyyymmdd = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (yyyymmdd) {
        const y = yyyymmdd[1];
        const m = yyyymmdd[2].padStart(2, "0");
        const d = yyyymmdd[3].padStart(2, "0");
        return toLocaleNumber(`${d}/${m}/${y}`, langCode);
    }
    const mmddyyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mmddyyyy) {
        const p1 = parseInt(mmddyyyy[1], 10);
        const p2 = parseInt(mmddyyyy[2], 10);
        const y = mmddyyyy[3];
        if (p1 <= 12 && p2 > 12) {
            const d = String(p2).padStart(2, "0");
            const m = String(p1).padStart(2, "0");
            return toLocaleNumber(`${d}/${m}/${y}`, langCode);
        }
        return toLocaleNumber(trimmed, langCode);
    }
    return toLocaleNumber(trimmed, langCode);
}

export default function HomeworkReportPage() {
    const { t, language } = useLanguage();
    const langCode = language?.short_code || "en";
    const [activeTab, setActiveTab] = useState("Homework Report");

    // Dynamic Options lists
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    
    // Cascaded Sections lists
    const [sections, setSections] = useState<ClassSection[]>([]);
    const [evalSections, setEvalSections] = useState<ClassSection[]>([]);
    const [assignSections, setAssignSections] = useState<ClassSection[]>([]);
    const [marksSections, setMarksSections] = useState<ClassSection[]>([]);

    // Selected Criteria states (Homework Report)
    const [selectedClass, setSelectedClass] = useState<string>("all");
    const [selectedSection, setSelectedSection] = useState<string>("all");
    const [selectedSubjectGroup, setSelectedSubjectGroup] = useState<string>("all");
    const [selectedSubject, setSelectedSubject] = useState<string>("all");

    // Selected Criteria states (Homework Evaluation Report)
    const [evalClass, setEvalClass] = useState<string>("Class 1");
    const [evalSection, setEvalSection] = useState<string>("A");
    const [evalSubjectGroup, setEvalSubjectGroup] = useState<string>("Class 1 subject");
    const [evalSubject, setEvalSubject] = useState<string>("English (210)");

    // Selected Criteria states (Daily Assignment Report)
    const [assignSearchType, setAssignSearchType] = useState<string>("today");
    const [assignClass, setAssignClass] = useState<string>("Class 1");
    const [assignSection, setAssignSection] = useState<string>("A");
    const [assignSubjectGroup, setAssignSubjectGroup] = useState<string>("Class 1 subject");
    const [assignSubject, setAssignSubject] = useState<string>("English (210)");

    // Selected Criteria states (Homework Marks Report)
    const [marksClass, setMarksClass] = useState<string>("Select");
    const [marksSection, setMarksSection] = useState<string>("Select");
    const [marksSubjectGroup, setMarksSubjectGroup] = useState<string>("Select");
    const [marksSubject, setMarksSubject] = useState<string>("Select");

    // Report result lists
    const [homeworkList, setHomeworkList] = useState<HomeworkReportData[]>([]);
    const [evalList, setEvalList] = useState<HomeworkEvaluationData[]>([]);
    const [assignList, setAssignList] = useState<DailyAssignmentData[]>([]);
    const [marksList, setMarksList] = useState<HomeworkMarksData[]>([]);
    
    const [isSearched, setIsSearched] = useState(false);
    const [evalIsSearched, setEvalIsSearched] = useState(false);
    const [assignIsSearched, setAssignIsSearched] = useState(false);
    const [marksIsSearched, setMarksIsSearched] = useState(false);
    const [loading, setLoading] = useState(false);

    // Search and pagination states
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState<string>("50");
    const [currentPage, setCurrentPage] = useState<number>(1);

    useEffect(() => {
        fetchCriteria();
    }, []);

    const fetchCriteria = async () => {
        try {
            const response = await api.get('/reports/homework/criteria');
            setClasses(response.data.classes || []);
            setSubjectGroups(response.data.subjectGroups || []);
            setSubjects(response.data.subjects || []);

            // Set initial cascaded sections for Class 1 if found
            const firstClass = response.data.classes?.[0];
            if (firstClass) {
                const classIdStr = String(firstClass.id);
                
                setEvalClass(classIdStr);
                setEvalSections(firstClass.sections || []);
                
                setAssignClass(classIdStr);
                setAssignSections(firstClass.sections || []);

                if (firstClass.sections?.[0]) {
                    const secIdStr = String(firstClass.sections[0].id);
                    setEvalSection(secIdStr);
                    setAssignSection(secIdStr);
                }
            }

            const firstGroup = response.data.subjectGroups?.[0];
            if (firstGroup) {
                const grpIdStr = String(firstGroup.id);
                setEvalSubjectGroup(grpIdStr);
                setAssignSubjectGroup(grpIdStr);

                if (firstGroup.subjects?.[0]) {
                    const subIdStr = String(firstGroup.subjects[0].id);
                    setEvalSubject(subIdStr);
                    setAssignSubject(subIdStr);
                }
            }

        } catch (error) {
            console.error("Failed to fetch homework criteria", error);
            toast.error("Failed to load homework criteria options");
        }
    };

    // Cascade: Filter sections when class changes (Homework Report)
    const handleClassChange = (classIdStr: string) => {
        setSelectedClass(classIdStr);
        setSelectedSection("all");
        
        if (classIdStr === "all" || classIdStr === "Select") {
            setSections([]);
            return;
        }

        const classId = parseInt(classIdStr);
        const found = classes.find(c => c.id === classId);
        if (found) {
            setSections(found.sections || []);
        } else {
            setSections([]);
        }
    };

    // Cascade: Filter sections when class changes (Homework Evaluation Report)
    const handleEvalClassChange = (classIdStr: string) => {
        setEvalClass(classIdStr);
        setEvalSection("all");
        
        if (classIdStr === "all" || classIdStr === "Select") {
            setEvalSections([]);
            return;
        }

        const classId = parseInt(classIdStr);
        const found = classes.find(c => c.id === classId);
        if (found) {
            setEvalSections(found.sections || []);
            if (found.sections?.[0]) {
                setEvalSection(String(found.sections[0].id));
            }
        } else {
            setEvalSections([]);
        }
    };

    // Cascade: Filter sections when class changes (Daily Assignment Report)
    const handleAssignClassChange = (classIdStr: string) => {
        setAssignClass(classIdStr);
        setAssignSection("all");
        
        if (classIdStr === "all" || classIdStr === "Select") {
            setAssignSections([]);
            return;
        }

        const classId = parseInt(classIdStr);
        const found = classes.find(c => c.id === classId);
        if (found) {
            setAssignSections(found.sections || []);
            if (found.sections?.[0]) {
                setAssignSection(String(found.sections[0].id));
            }
        } else {
            setAssignSections([]);
        }
    };

    // Cascade: Filter sections when class changes (Homework Marks Report)
    const handleMarksClassChange = (classIdStr: string) => {
        setMarksClass(classIdStr);
        setMarksSection("Select");
        
        if (classIdStr === "Select") {
            setMarksSections([]);
            return;
        }

        const classId = parseInt(classIdStr);
        const found = classes.find(c => c.id === classId);
        if (found) {
            setMarksSections(found.sections || []);
        } else {
            setMarksSections([]);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const response = await api.get('/reports/homework/report', {
                params: {
                    class_id: selectedClass,
                    section_id: selectedSection,
                    subject_group_id: selectedSubjectGroup,
                    subject_id: selectedSubject,
                }
            });
            setHomeworkList(response.data.data || []);
            setIsSearched(true);
            setCurrentPage(1);
            toast.success("Homework report loaded successfully");
        } catch (error) {
            console.error("Failed to query homework report", error);
            toast.error("Failed to load homework report data");
        } finally {
            setLoading(false);
        }
    };

    const handleEvalSearch = async () => {
        if (!evalClass || evalClass === "Select") {
            toast.error("Please select a Class");
            return;
        }
        if (!evalSection || evalSection === "Select") {
            toast.error("Please select a Section");
            return;
        }
        if (!evalSubjectGroup || evalSubjectGroup === "Select") {
            toast.error("Please select a Subject Group");
            return;
        }
        if (!evalSubject || evalSubject === "Select") {
            toast.error("Please select a Subject");
            return;
        }

        setLoading(true);
        try {
            const response = await api.get('/reports/homework/evaluation', {
                params: {
                    class_id: evalClass,
                    section_id: evalSection,
                    subject_group_id: evalSubjectGroup,
                    subject_id: evalSubject,
                }
            });
            setEvalList(response.data.data || []);
            setEvalIsSearched(true);
            setCurrentPage(1);
            toast.success("Homework evaluation report loaded successfully");
        } catch (error) {
            console.error("Failed to query evaluation report", error);
            toast.error("Failed to load homework evaluation report data");
        } finally {
            setLoading(false);
        }
    };

    const handleAssignSearch = async () => {
        if (!assignSearchType) {
            toast.error("Please select a Search Type");
            return;
        }
        if (!assignClass || assignClass === "Select") {
            toast.error("Please select a Class");
            return;
        }
        if (!assignSection || assignSection === "Select") {
            toast.error("Please select a Section");
            return;
        }
        if (!assignSubjectGroup || assignSubjectGroup === "Select") {
            toast.error("Please select a Subject Group");
            return;
        }
        if (!assignSubject || assignSubject === "Select") {
            toast.error("Please select a Subject");
            return;
        }

        setLoading(true);
        try {
            const response = await api.get('/reports/homework/assignment', {
                params: {
                    search_type: assignSearchType,
                    class_id: assignClass,
                    section_id: assignSection,
                    subject_group_id: assignSubjectGroup,
                    subject_id: assignSubject,
                }
            });
            setAssignList(response.data.data || []);
            setAssignIsSearched(true);
            setCurrentPage(1);
            toast.success("Daily assignment report loaded successfully");
        } catch (error) {
            console.error("Failed to query daily assignment report", error);
            toast.error("Failed to load daily assignment report data");
        } finally {
            setLoading(false);
        }
    };

    const handleMarksSearch = async () => {
        if (!marksClass || marksClass === "Select") {
            toast.error("Please select a Class");
            return;
        }
        if (!marksSection || marksSection === "Select") {
            toast.error("Please select a Section");
            return;
        }
        if (!marksSubjectGroup || marksSubjectGroup === "Select") {
            toast.error("Please select a Subject Group");
            return;
        }
        if (!marksSubject || marksSubject === "Select") {
            toast.error("Please select a Subject");
            return;
        }

        setLoading(true);
        try {
            const response = await api.get('/reports/homework/marks', {
                params: {
                    class_id: marksClass,
                    section_id: marksSection,
                    subject_group_id: marksSubjectGroup,
                    subject_id: marksSubject,
                }
            });
            setMarksList(response.data.data || []);
            setMarksIsSearched(true);
            setCurrentPage(1);
            toast.success("Homework marks report loaded successfully");
        } catch (error) {
            console.error("Failed to query homework marks report", error);
            toast.error("Failed to load homework marks report data");
        } finally {
            setLoading(false);
        }
    };

    // Filter list locally by search input
    const filteredList = homeworkList.filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (item.class && item.class.toLowerCase().includes(term)) ||
            (item.section && item.section.toLowerCase().includes(term)) ||
            (item.subjectGroup && item.subjectGroup.toLowerCase().includes(term)) ||
            (item.subject && item.subject.toLowerCase().includes(term)) ||
            (item.homeworkDate && item.homeworkDate.toLowerCase().includes(term)) ||
            (item.submissionDate && item.submissionDate.toLowerCase().includes(term))
        );
    });

    const filteredEvalList = evalList.filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (item.subject && item.subject.toLowerCase().includes(term)) ||
            (item.homeworkDate && item.homeworkDate.toLowerCase().includes(term)) ||
            (item.submissionDate && item.submissionDate.toLowerCase().includes(term)) ||
            (item.completeIncomplete && item.completeIncomplete.toLowerCase().includes(term))
        );
    });

    const filteredAssignList = assignList.filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (item.studentName && item.studentName.toLowerCase().includes(term)) ||
            (item.class && item.class.toLowerCase().includes(term)) ||
            (item.section && item.section.toLowerCase().includes(term))
        );
    });

    const filteredMarksList = marksList.filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (item.studentName && item.studentName.toLowerCase().includes(term)) ||
            (item.admissionNo && String(item.admissionNo).toLowerCase().includes(term)) ||
            (item.rollNo && String(item.rollNo).toLowerCase().includes(term)) ||
            (item.homeworkDate && item.homeworkDate.toLowerCase().includes(term)) ||
            (item.submissionDate && item.submissionDate.toLowerCase().includes(term)) ||
            (item.evaluationDate && item.evaluationDate.toLowerCase().includes(term)) ||
            (item.note && item.note.toLowerCase().includes(term))
        );
    });

    // Pagination Calculations
    const totalEntries = 
        activeTab === "Homework Report" ? filteredList.length : 
        activeTab === "Homework Evaluation Report" ? filteredEvalList.length : 
        activeTab === "Daily Assignment Report" ? filteredAssignList.length :
        filteredMarksList.length;

    const sizeNum = parseInt(itemsPerPage);
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safeCurrentPage = Math.min(currentPage, totalPages) || 1;
    const startIndex = (safeCurrentPage - 1) * sizeNum;
    
    const paginatedList = filteredList.slice(startIndex, startIndex + sizeNum);
    const paginatedEvalList = filteredEvalList.slice(startIndex, startIndex + sizeNum);
    const paginatedAssignList = filteredAssignList.slice(startIndex, startIndex + sizeNum);
    const paginatedMarksList = filteredMarksList.slice(startIndex, startIndex + sizeNum);

    // Export Options
    const exportToCopy = () => {
        if (activeTab === "Homework Report") {
            if (filteredList.length === 0) {
                toast.error("No data available to copy");
                return;
            }
            const text = [
                "Class\tSection\tSubject Group\tSubject\tHomework Date\tSubmission Date\tStudent Count\tHomework Submitted\tPending Student",
                ...filteredList.map(h => `${h.class}\t${h.section}\t${h.subjectGroup}\t${h.subject}\t${h.homeworkDate}\t${h.submissionDate}\t${h.studentCount}\t${h.homeworkSubmitted}\t${h.pendingStudent}`)
            ].join("\n");

            navigator.clipboard.writeText(text);
            toast.success("Homework report copied to clipboard");
        } else if (activeTab === "Homework Evaluation Report") {
            if (filteredEvalList.length === 0) {
                toast.error("No data available to copy");
                return;
            }
            const text = [
                "Subject\tHomework Date\tSubmission Date\tComplete / Incomplete\tComplete%",
                ...filteredEvalList.map(e => `${e.subject}\t${e.homeworkDate}\t${e.submissionDate}\t${e.completeIncomplete}\t${e.completePercent}%`)
            ].join("\n");

            navigator.clipboard.writeText(text);
            toast.success("Homework evaluation report copied to clipboard");
        } else if (activeTab === "Daily Assignment Report") {
            if (filteredAssignList.length === 0) {
                toast.error("No data available to copy");
                return;
            }
            const text = [
                "Student Name\tClass\tSection\tTotal Assignment",
                ...filteredAssignList.map(a => `${a.studentName}\t${a.class}\t${a.section}\t${a.totalAssignment}`)
            ].join("\n");

            navigator.clipboard.writeText(text);
            toast.success("Daily assignment report copied to clipboard");
        } else {
            if (filteredMarksList.length === 0) {
                toast.error("No data available to copy");
                return;
            }
            const text = [
                "Admission No\tStudent Name\tRoll No.\tHomework Date\tSubmission Date\tEvaluation Date\tTotal Marks\tMarks Obtained\tNote",
                ...filteredMarksList.map(m => `${m.admissionNo}\t${m.studentName}\t${m.rollNo}\t${m.homeworkDate}\t${m.submissionDate}\t${m.evaluationDate}\t${m.totalMarks}\t${m.marksObtained}\t${m.note}`)
            ].join("\n");

            navigator.clipboard.writeText(text);
            toast.success("Homework marks report copied to clipboard");
        }
    };

    const exportToExcel = (isCsv = false) => {
        if (activeTab === "Homework Report") {
            if (filteredList.length === 0) {
                toast.error("No data available to export");
                return;
            }
            const mapped = filteredList.map(h => ({
                "Class": h.class,
                "Section": h.section,
                "Subject Group": h.subjectGroup,
                "Subject": h.subject,
                "Homework Date": h.homeworkDate,
                "Submission Date": h.submissionDate,
                "Student Count": h.studentCount,
                "Homework Submitted": h.homeworkSubmitted,
                "Pending Student": h.pendingStudent
            }));

            const worksheet = XLSX.utils.json_to_sheet(mapped);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Homework Report");

            if (isCsv) {
                XLSX.writeFile(workbook, "homework_report.csv", { bookType: "csv" });
                toast.success("CSV file downloaded successfully");
            } else {
                XLSX.writeFile(workbook, "homework_report.xlsx");
                toast.success("Excel spreadsheet downloaded successfully");
            }
        } else if (activeTab === "Homework Evaluation Report") {
            if (filteredEvalList.length === 0) {
                toast.error("No data available to export");
                return;
            }
            const mapped = filteredEvalList.map(e => ({
                "Subject": e.subject,
                "Homework Date": e.homeworkDate,
                "Submission Date": e.submissionDate,
                "Complete / Incomplete": e.completeIncomplete,
                "Complete (%)": e.completePercent
            }));

            const worksheet = XLSX.utils.json_to_sheet(mapped);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Homework Evaluation Report");

            if (isCsv) {
                XLSX.writeFile(workbook, "homework_evaluation_report.csv", { bookType: "csv" });
                toast.success("CSV file downloaded successfully");
            } else {
                XLSX.writeFile(workbook, "homework_evaluation_report.xlsx");
                toast.success("Excel spreadsheet downloaded successfully");
            }
        } else if (activeTab === "Daily Assignment Report") {
            if (filteredAssignList.length === 0) {
                toast.error("No data available to export");
                return;
            }
            const mapped = filteredAssignList.map(a => ({
                "Student Name": a.studentName,
                "Class": a.class,
                "Section": a.section,
                "Total Assignment": a.totalAssignment
            }));

            const worksheet = XLSX.utils.json_to_sheet(mapped);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Assignment Report");

            if (isCsv) {
                XLSX.writeFile(workbook, "daily_assignment_report.csv", { bookType: "csv" });
                toast.success("CSV file downloaded successfully");
            } else {
                XLSX.writeFile(workbook, "daily_assignment_report.xlsx");
                toast.success("Excel spreadsheet downloaded successfully");
            }
        } else {
            if (filteredMarksList.length === 0) {
                toast.error("No data available to export");
                return;
            }
            const mapped = filteredMarksList.map(m => ({
                "Admission No": m.admissionNo,
                "Student Name": m.studentName,
                "Roll No.": m.rollNo,
                "Homework Date": m.homeworkDate,
                "Submission Date": m.submissionDate,
                "Evaluation Date": m.evaluationDate,
                "Total Marks": m.totalMarks,
                "Marks Obtained": m.marksObtained,
                "Note": m.note
            }));

            const worksheet = XLSX.utils.json_to_sheet(mapped);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Homework Marks Report");

            if (isCsv) {
                XLSX.writeFile(workbook, "homework_marks_report.csv", { bookType: "csv" });
                toast.success("CSV file downloaded successfully");
            } else {
                XLSX.writeFile(workbook, "homework_marks_report.xlsx");
                toast.success("Excel spreadsheet downloaded successfully");
            }
        }
    };

    const exportToPDF = () => {
        if (activeTab === "Homework Report") {
            if (filteredList.length === 0) {
                toast.error("No data available to export");
                return;
            }
            const doc = new jsPDF("landscape");
            const head = [["Class", "Section", "Subject Group", "Subject", "Homework Date", "Submission Date", "Student Count", "Homework Submitted", "Pending Student"]];
            const body = filteredList.map(h => [h.class, h.section, h.subjectGroup, h.subject, h.homeworkDate, h.submissionDate, h.studentCount, h.homeworkSubmitted, h.pendingStudent]);

            autoTable(doc, { head, body, theme: "grid" });
            doc.save("homework_report.pdf");
            toast.success("PDF report downloaded successfully");
        } else if (activeTab === "Homework Evaluation Report") {
            if (filteredEvalList.length === 0) {
                toast.error("No data available to export");
                return;
            }
            const doc = new jsPDF("landscape");
            const head = [["Subject", "Homework Date", "Submission Date", "Complete / Incomplete", "Complete%"]];
            const body = filteredEvalList.map(e => [e.subject, e.homeworkDate, e.submissionDate, e.completeIncomplete, `${e.completePercent}%`]);

            autoTable(doc, { head, body, theme: "grid" });
            doc.save("homework_evaluation_report.pdf");
            toast.success("PDF report downloaded successfully");
        } else if (activeTab === "Daily Assignment Report") {
            if (filteredAssignList.length === 0) {
                toast.error("No data available to export");
                return;
            }
            const doc = new jsPDF("portrait");
            const head = [["Student Name", "Class", "Section", "Total Assignment"]];
            const body = filteredAssignList.map(a => [a.studentName, a.class, a.section, a.totalAssignment]);

            autoTable(doc, { head, body, theme: "grid" });
            doc.save("daily_assignment_report.pdf");
            toast.success("PDF report downloaded successfully");
        } else {
            if (filteredMarksList.length === 0) {
                toast.error("No data available to export");
                return;
            }
            const doc = new jsPDF("landscape");
            const head = [["Admission No", "Student Name", "Roll No.", "Homework Date", "Submission Date", "Evaluation Date", "Total Marks", "Marks Obtained", "Note"]];
            const body = filteredMarksList.map(m => [m.admissionNo, m.studentName, m.rollNo, m.homeworkDate, m.submissionDate, m.evaluationDate, m.totalMarks, m.marksObtained, m.note]);

            autoTable(doc, { head, body, theme: "grid" });
            doc.save("homework_marks_report.pdf");
            toast.success("PDF report downloaded successfully");
        }
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
                            {t("homework_report")}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">
                            {t("homework_report_description")}
                        </p>
                    </div>
                </div>
                <Link
                    href="/user/homework"
                    className="flex items-center gap-1.5 h-8 px-4 rounded-full text-white text-xs font-bold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] transition-all active:scale-95 shadow-md shrink-0"
                >
                    <Monitor className="h-3.5 w-3.5" />
                    {t("student_portal_view")}
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
                                    {t(link.key)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Select Criteria Section (Homework Report) */}
            {activeTab === "Homework Report" && (
                <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white transition-all animate-fadeIn">
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
                                {t("class") || "Class"}
                            </Label>
                            <Select value={selectedClass} onValueChange={handleClassChange}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select_class") || "Select Class"}>
                                        {selectedClass === "all" ? (t("all_classes") || "All Classes") : (classes.find(c => String(c.id) === selectedClass) ? translateClassName(classes.find(c => String(c.id) === selectedClass)!.name, langCode) : selectedClass)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("all_classes") || "All Classes"}</SelectItem>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={String(c.id)}>{translateClassName(c.name, langCode)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {t("section") || "Section"}
                            </Label>
                            <Select value={selectedSection} onValueChange={setSelectedSection}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {selectedSection === "all" ? (t("all_sections") || "All Sections") : (sections.find(s => String(s.id) === selectedSection) ? translateSectionName(sections.find(s => String(s.id) === selectedSection)!.name, langCode) : selectedSection)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("all_sections") || "All Sections"}</SelectItem>
                                    {sections.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>{translateSectionName(s.name, langCode)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {t("subject_group") || "Subject Group"}
                            </Label>
                            <Select value={selectedSubjectGroup} onValueChange={setSelectedSubjectGroup}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {selectedSubjectGroup === "all" ? (t("all") || "All") : (subjectGroups.find(sg => String(sg.id) === selectedSubjectGroup) ? translateSubjectGroupName(subjectGroups.find(sg => String(sg.id) === selectedSubjectGroup)!.name, langCode) : translateSubjectGroupName(selectedSubjectGroup, langCode))}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("all") || "All"}</SelectItem>
                                    {subjectGroups.map(sg => (
                                        <SelectItem key={sg.id} value={String(sg.id)}>{translateSubjectGroupName(sg.name, langCode)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {t("subject") || "Subject"}
                            </Label>
                            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {selectedSubject === "all" ? (t("all") || "All") : (subjects.find(s => String(s.id) === selectedSubject) ? translateSubjectName(subjects.find(s => String(s.id) === selectedSubject)!.name, langCode) : translateSubjectName(selectedSubject, langCode))}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("all") || "All"}</SelectItem>
                                    {subjects.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>{translateSubjectName(s.name, langCode)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Button 
                                onClick={handleSearch}
                                disabled={loading}
                                className="h-9 px-6 text-xs font-bold rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-sm shadow-orange-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider w-full"
                            >
                                <Search className="h-3.5 w-3.5" />
                                {loading ? (t("loading") || "Searching...") : (t("search") || "Search")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Select Criteria Section (Homework Evaluation Report) */}
            {activeTab === "Homework Evaluation Report" && (
                <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white transition-all animate-fadeIn">
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
                                {t("class") || "Class"} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={evalClass} onValueChange={handleEvalClassChange}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {classes.find(c => String(c.id) === evalClass) ? translateClassName(classes.find(c => String(c.id) === evalClass)!.name, langCode) : translateClassName(evalClass, langCode)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={String(c.id)}>{translateClassName(c.name, langCode)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {t("section") || "Section"} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={evalSection} onValueChange={setEvalSection}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {evalSections.find(s => String(s.id) === evalSection) ? translateSectionName(evalSections.find(s => String(s.id) === evalSection)!.name, langCode) : translateSectionName(evalSection, langCode)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {evalSections.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>{translateSectionName(s.name, langCode)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {t("subject_group") || "Subject Group"} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={evalSubjectGroup} onValueChange={setEvalSubjectGroup}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {subjectGroups.find(sg => String(sg.id) === evalSubjectGroup) ? translateSubjectGroupName(subjectGroups.find(sg => String(sg.id) === evalSubjectGroup)!.name, langCode) : translateSubjectGroupName(evalSubjectGroup, langCode)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {subjectGroups.map(sg => (
                                        <SelectItem key={sg.id} value={String(sg.id)}>{translateSubjectGroupName(sg.name, langCode)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {t("subject") || "Subject"} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={evalSubject} onValueChange={setEvalSubject}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {subjects.find(s => String(s.id) === evalSubject) ? translateSubjectName(subjects.find(s => String(s.id) === evalSubject)!.name, langCode) : translateSubjectName(evalSubject, langCode)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>{translateSubjectName(s.name, langCode)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Button 
                                onClick={handleEvalSearch}
                                disabled={loading}
                                className="h-9 px-6 text-xs font-bold rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-sm shadow-orange-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider w-full"
                            >
                                <Search className="h-3.5 w-3.5" />
                                {loading ? (t("loading") || "Searching...") : (t("search") || "Search")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Select Criteria Section (Daily Assignment Report) */}
            {activeTab === "Daily Assignment Report" && (
                <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white transition-all animate-fadeIn">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                        <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                            <Filter className="h-4 w-4" />
                        </span>
                        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            {t("select_criteria") || "Select Criteria"}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {t("search_type") || "Search Type"} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={assignSearchType} onValueChange={setAssignSearchType}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {searchTypes.map(st => <SelectItem key={st.value} value={st.value}>{t(st.key) || st.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {t("class") || "Class"} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={assignClass} onValueChange={handleAssignClassChange}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {classes.find(c => String(c.id) === assignClass) ? translateClassName(classes.find(c => String(c.id) === assignClass)!.name, langCode) : translateClassName(assignClass, langCode)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={String(c.id)}>{translateClassName(c.name, langCode)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {t("section") || "Section"} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={assignSection} onValueChange={setAssignSection}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {assignSections.find(s => String(s.id) === assignSection) ? translateSectionName(assignSections.find(s => String(s.id) === assignSection)!.name, langCode) : translateSectionName(assignSection, langCode)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {assignSections.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>{translateSectionName(s.name, langCode)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {t("subject_group") || "Subject Group"} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={assignSubjectGroup} onValueChange={setAssignSubjectGroup}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {subjectGroups.find(sg => String(sg.id) === assignSubjectGroup) ? translateSubjectGroupName(subjectGroups.find(sg => String(sg.id) === assignSubjectGroup)!.name, langCode) : translateSubjectGroupName(assignSubjectGroup, langCode)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {subjectGroups.map(sg => (
                                        <SelectItem key={sg.id} value={String(sg.id)}>{translateSubjectGroupName(sg.name, langCode)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {t("subject") || "Subject"} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={assignSubject} onValueChange={setAssignSubject}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {subjects.find(s => String(s.id) === assignSubject) ? translateSubjectName(subjects.find(s => String(s.id) === assignSubject)!.name, langCode) : translateSubjectName(assignSubject, langCode)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>{translateSubjectName(s.name, langCode)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Button 
                                onClick={handleAssignSearch}
                                disabled={loading}
                                className="h-9 px-6 text-xs font-bold rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-sm shadow-orange-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider w-full"
                            >
                                <Search className="h-3.5 w-3.5" />
                                {loading ? (t("loading") || "Searching...") : (t("search") || "Search")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Select Criteria Section (Homework Marks Report) */}
            {activeTab === "Homework Marks Report" && (
                <div className="border border-gray-100 shadow-sm rounded-xl p-5 space-y-4 bg-white transition-all animate-fadeIn">
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
                                {t("class") || "Class"} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={marksClass} onValueChange={handleMarksClassChange}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {marksClass === "Select" ? (t("select") || "Select") : (classes.find(c => String(c.id) === marksClass) ? translateClassName(classes.find(c => String(c.id) === marksClass)!.name, langCode) : translateClassName(marksClass, langCode))}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Select">{t("select") || "Select"}</SelectItem>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={String(c.id)}>{translateClassName(c.name, langCode)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {t("section") || "Section"}
                            </Label>
                            <Select value={marksSection} onValueChange={setMarksSection}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {marksSection === "Select" ? (t("select") || "Select") : (marksSections.find(s => String(s.id) === marksSection) ? translateSectionName(marksSections.find(s => String(s.id) === marksSection)!.name, langCode) : translateSectionName(marksSection, langCode))}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Select">{t("select") || "Select"}</SelectItem>
                                    {marksSections.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>{translateSectionName(s.name, langCode)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {t("subject_group") || "Subject Group"}
                            </Label>
                            <Select value={marksSubjectGroup} onValueChange={setMarksSubjectGroup}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {marksSubjectGroup === "Select" ? (t("select") || "Select") : (subjectGroups.find(sg => String(sg.id) === marksSubjectGroup) ? translateSubjectGroupName(subjectGroups.find(sg => String(sg.id) === marksSubjectGroup)!.name, langCode) : translateSubjectGroupName(marksSubjectGroup, langCode))}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Select">{t("select") || "Select"}</SelectItem>
                                    {subjectGroups.map(sg => (
                                        <SelectItem key={sg.id} value={String(sg.id)}>{translateSubjectGroupName(sg.name, langCode)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {t("subject") || "Subject"}
                            </Label>
                            <Select value={marksSubject} onValueChange={setMarksSubject}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-1 focus:ring-indigo-500 bg-gray-50/30">
                                    <SelectValue placeholder={t("select") || "Select"}>
                                        {marksSubject === "Select" ? (t("select") || "Select") : (subjects.find(s => String(s.id) === marksSubject) ? translateSubjectName(subjects.find(s => String(s.id) === marksSubject)!.name, langCode) : translateSubjectName(marksSubject, langCode))}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Select">{t("select") || "Select"}</SelectItem>
                                    {subjects.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>{translateSubjectName(s.name, langCode)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Button 
                                onClick={handleMarksSearch}
                                disabled={loading}
                                className="h-9 px-6 text-xs font-bold rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-sm shadow-orange-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider w-full"
                            >
                                <Search className="h-3.5 w-3.5" />
                                {loading ? (t("loading") || "Searching...") : (t("search") || "Search")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Homework Report Table Section */}
            {activeTab === "Homework Report" && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4 overflow-hidden min-h-[420px] flex flex-col justify-between transition-all animate-fadeIn">
                    <div className="space-y-4 flex-1 flex flex-col">
                        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t("homework_report") || "Homework Report"}</h2>

                        {/* Table Toolbar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="relative w-full md:w-64">
                                <Input
                                    placeholder={t("search") || "Search..."}
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 mr-2">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{t("show") || "Show"}</span>
                                    <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                        <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">{toLocaleNumber(10, langCode)}</SelectItem>
                                            <SelectItem value="25">{toLocaleNumber(25, langCode)}</SelectItem>
                                            <SelectItem value="50">{toLocaleNumber(50, langCode)}</SelectItem>
                                            <SelectItem value="100">{toLocaleNumber(100, langCode)}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-1 text-gray-400">
                                    <Button variant="ghost" size="icon" title={t("copy") || "Copy"} onClick={exportToCopy} className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded">
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title={t("excel") || "Excel"} onClick={() => exportToExcel(false)} className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded">
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title={t("csv") || "CSV"} onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded">
                                        <FileBox className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title={t("pdf") || "PDF"} onClick={exportToPDF} className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded">
                                        <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title={t("print") || "Print"} onClick={handlePrint} className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded">
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Results Table */}
                        <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar flex-1">
                            <Table className="min-w-[1200px]">
                                <TableHeader className="bg-transparent border-b border-gray-100">
                                    <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">{t("class") || "Class"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">{t("section") || "Section"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">{t("subject_group") || "Subject Group"}<ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">{t("subject") || "Subject"}<ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">{t("homework_date") || "Homework Date"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">{t("submission_date") || "Submission Date"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4 text-center">{t("student_count") || "Student Count"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4 text-center">{t("homework_submitted") || "Homework Submitted"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4 text-right">{t("pending_student") || "Pending Student"}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton cols={9} />
                                    ) : !isSearched ? (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={9} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest">{t("no_data_available_in_table") || "No data available in table"}</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <BookMarked className="h-8 w-8 text-gray-200" />
                                                        </div>
                                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center">
                                                            <Plus className="h-3 w-3 text-indigo-300" />
                                                        </div>
                                                    </div>
                                                    <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                                        <span className="text-lg">←</span> {t("search_with_criteria_homework") || "Search with criteria to retrieve homework details."}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedList.length > 0 ? (
                                        paginatedList.map((h, idx) => (
                                            <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                                <TableCell className="py-3 px-4 text-gray-700 font-bold">{translateClassName(h.class, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{translateSectionName(h.section, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{translateSubjectGroupName(h.subjectGroup, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-indigo-600 underline font-bold cursor-pointer">{translateSubjectName(h.subject, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{formatDateDDMMYYYY(h.homeworkDate, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500 font-medium">{formatDateDDMMYYYY(h.submissionDate, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-center text-gray-700 font-semibold">{toLocaleNumber(h.studentCount, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-center text-emerald-600 font-bold">{toLocaleNumber(h.homeworkSubmitted, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-right text-rose-500 font-bold">{toLocaleNumber(h.pendingStudent, langCode)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent">
                                            <TableCell colSpan={9} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                                {t("no_records_homework") || "No homework records match selected filters."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Pagination Spacing Pinned to Bottom */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500 font-medium pt-4 border-t border-gray-100 mt-auto">
                        <div>
                            {t("showing") || "Showing"} {toLocaleNumber(totalEntries > 0 ? startIndex + 1 : 0, langCode)} {t("to") || "to"}{" "}
                            {toLocaleNumber(Math.min(startIndex + sizeNum, totalEntries), langCode)} {t("of") || "of"} {toLocaleNumber(totalEntries, langCode)} {t("entries") || "entries"}
                            {searchTerm && ` (${t("filtered_from") || "filtered from"} ${toLocaleNumber(homeworkList.length, langCode)} ${t("total_entries") || "total entries"})`}
                        </div>
                        {homeworkList.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <button 
                                    disabled={safeCurrentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all shadow-none"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "h-8 w-8 text-xs font-bold flex items-center justify-center cursor-pointer transition-all rounded-lg",
                                            safeCurrentPage === page 
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs font-bold" 
                                                : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200"
                                        )}
                                    >
                                        {toLocaleNumber(page, langCode)}
                                    </button>
                                ))}
                                <button 
                                    disabled={safeCurrentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all shadow-none"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Homework Evaluation Report Table Section */}
            {activeTab === "Homework Evaluation Report" && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4 overflow-hidden min-h-[420px] flex flex-col justify-between transition-all animate-fadeIn">
                    <div className="space-y-4 flex-1 flex flex-col">
                        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t("homework_evaluation_report") || "Homework Evaluation Report"}</h2>

                        {/* Table Toolbar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="relative w-full md:w-64">
                                <Input
                                    placeholder={t("search") || "Search..."}
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 mr-2">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{t("show") || "Show"}</span>
                                    <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                        <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">{toLocaleNumber(10, langCode)}</SelectItem>
                                            <SelectItem value="25">{toLocaleNumber(25, langCode)}</SelectItem>
                                            <SelectItem value="50">{toLocaleNumber(50, langCode)}</SelectItem>
                                            <SelectItem value="100">{toLocaleNumber(100, langCode)}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-1 text-gray-400">
                                    <Button variant="ghost" size="icon" title={t("copy") || "Copy"} onClick={exportToCopy} className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded">
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title={t("excel") || "Excel"} onClick={() => exportToExcel(false)} className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded">
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title={t("csv") || "CSV"} onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded">
                                        <FileBox className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title={t("pdf") || "PDF"} onClick={exportToPDF} className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded">
                                        <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title={t("print") || "Print"} onClick={handlePrint} className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded">
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Results Table */}
                        <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar flex-1">
                            <Table className="min-w-[1000px]">
                                <TableHeader className="bg-transparent border-b border-gray-100">
                                    <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">{t("subject") || "Subject"}<ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">{t("homework_date") || "Homework Date"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">{t("submission_date") || "Submission Date"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">{t("complete_incomplete") || "Complete / Incomplete"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4 text-right">{t("complete_percent") || "Complete%"}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton cols={5} />
                                    ) : !evalIsSearched ? (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={5} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest">{t("no_data_available_in_table") || "No data available in table"}</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <BookMarked className="h-8 w-8 text-gray-200" />
                                                        </div>
                                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center">
                                                            <Plus className="h-3 w-3 text-indigo-300" />
                                                        </div>
                                                    </div>
                                                    <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                                        <span className="text-lg">←</span> {t("search_with_criteria_eval") || "Search with criteria to retrieve evaluation details."}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedEvalList.length > 0 ? (
                                        paginatedEvalList.map((e, idx) => (
                                            <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                                <TableCell className="py-3 px-4 text-indigo-600 underline font-bold cursor-pointer">{translateSubjectName(e.subject, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{formatDateDDMMYYYY(e.homeworkDate, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500 font-medium">{formatDateDDMMYYYY(e.submissionDate, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500 font-bold">{translateCompleteIncomplete(e.completeIncomplete, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-700 font-bold">{toLocaleNumber(e.completePercent, langCode)}%</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent">
                                            <TableCell colSpan={5} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                                {t("no_records_eval") || "No homework evaluation records match selected filters."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Pagination Spacing Pinned to Bottom */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500 font-medium pt-4 border-t border-gray-100 mt-auto">
                        <div>
                            {t("showing") || "Showing"} {toLocaleNumber(totalEntries > 0 ? startIndex + 1 : 0, langCode)} {t("to") || "to"}{" "}
                            {toLocaleNumber(Math.min(startIndex + sizeNum, totalEntries), langCode)} {t("of") || "of"} {toLocaleNumber(totalEntries, langCode)} {t("entries") || "entries"}
                            {searchTerm && ` (${t("filtered_from") || "filtered from"} ${toLocaleNumber(evalList.length, langCode)} ${t("total_entries") || "total entries"})`}
                        </div>
                        {evalList.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <button 
                                    disabled={safeCurrentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all shadow-none"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "h-8 w-8 text-xs font-bold flex items-center justify-center cursor-pointer transition-all rounded-lg",
                                            safeCurrentPage === page 
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs font-bold" 
                                                : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200"
                                        )}
                                    >
                                        {toLocaleNumber(page, langCode)}
                                    </button>
                                ))}
                                <button 
                                    disabled={safeCurrentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all shadow-none"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Daily Assignment Report Table Section */}
            {activeTab === "Daily Assignment Report" && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4 overflow-hidden min-h-[420px] flex flex-col justify-between transition-all animate-fadeIn">
                    <div className="space-y-4 flex-1 flex flex-col">
                        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t("daily_assignment_report") || "Daily Assignment Report"}</h2>

                        {/* Table Toolbar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="relative w-full md:w-64">
                                <Input
                                    placeholder={t("search") || "Search..."}
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 mr-2">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{t("show") || "Show"}</span>
                                    <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                        <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">{toLocaleNumber(10, langCode)}</SelectItem>
                                            <SelectItem value="25">{toLocaleNumber(25, langCode)}</SelectItem>
                                            <SelectItem value="50">{toLocaleNumber(50, langCode)}</SelectItem>
                                            <SelectItem value="100">{toLocaleNumber(100, langCode)}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-1 text-gray-400">
                                    <Button variant="ghost" size="icon" title={t("copy") || "Copy"} onClick={exportToCopy} className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded">
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title={t("excel") || "Excel"} onClick={() => exportToExcel(false)} className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded">
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title={t("csv") || "CSV"} onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded">
                                        <FileBox className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title={t("pdf") || "PDF"} onClick={exportToPDF} className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded">
                                        <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title={t("print") || "Print"} onClick={handlePrint} className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded">
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Results Table */}
                        <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar flex-1">
                            <Table className="min-w-[900px]">
                                <TableHeader className="bg-transparent border-b border-gray-100">
                                    <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">{t("student_name") || "Student Name"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">{t("class") || "Class"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">{t("section") || "Section"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4 text-center">{t("total_assignment") || "Total Assignment"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4 text-right">{t("action") || "Action"}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton cols={5} />
                                    ) : !assignIsSearched ? (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={5} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest">{t("no_data_available_in_table") || "No data available in table"}</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <BookMarked className="h-8 w-8 text-gray-200" />
                                                        </div>
                                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center">
                                                            <Plus className="h-3 w-3 text-indigo-300" />
                                                        </div>
                                                    </div>
                                                    <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                                        <span className="text-lg">←</span> {t("search_with_criteria_assign") || "Search with criteria to retrieve daily assignments."}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedAssignList.length > 0 ? (
                                        paginatedAssignList.map((a, idx) => (
                                            <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                                <TableCell className="py-3 px-4 text-indigo-600 font-bold">{translateStudentName(a.studentName, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{translateClassName(a.class, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{translateSectionName(a.section, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-center text-gray-700 font-bold">{toLocaleNumber(a.totalAssignment, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-right">
                                                    <Button
                                                        size="icon"
                                                        title={t("view") || "View"}
                                                        className="h-7 w-7 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xs active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent">
                                            <TableCell colSpan={5} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                                {t("no_records_assign") || "No daily assignments match selected filters."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Pagination Spacing Pinned to Bottom */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500 font-medium pt-4 border-t border-gray-100 mt-auto">
                        <div>
                            {t("showing") || "Showing"} {toLocaleNumber(totalEntries > 0 ? startIndex + 1 : 0, langCode)} {t("to") || "to"}{" "}
                            {toLocaleNumber(Math.min(startIndex + sizeNum, totalEntries), langCode)} {t("of") || "of"} {toLocaleNumber(totalEntries, langCode)} {t("entries") || "entries"}
                            {searchTerm && ` (${t("filtered_from") || "filtered from"} ${toLocaleNumber(assignList.length, langCode)} ${t("total_entries") || "total entries"})`}
                        </div>
                        {assignList.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <button 
                                    disabled={safeCurrentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all shadow-none"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "h-8 w-8 text-xs font-bold flex items-center justify-center cursor-pointer transition-all rounded-lg",
                                            safeCurrentPage === page 
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs font-bold" 
                                                : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200"
                                        )}
                                    >
                                        {toLocaleNumber(page, langCode)}
                                    </button>
                                ))}
                                <button 
                                    disabled={safeCurrentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all shadow-none"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Homework Marks Report Table Section */}
            {activeTab === "Homework Marks Report" && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4 overflow-hidden min-h-[420px] flex flex-col justify-between transition-all animate-fadeIn">
                    <div className="space-y-4 flex-1 flex flex-col">
                        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t("homework_marks_report") || "Homework Marks Report"}</h2>

                        {/* Table Toolbar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="relative w-full md:w-64">
                                <Input
                                    placeholder={t("search") || "Search..."}
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 mr-2">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{t("show") || "Show"}</span>
                                    <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                        <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">{toLocaleNumber(10, langCode)}</SelectItem>
                                            <SelectItem value="25">{toLocaleNumber(25, langCode)}</SelectItem>
                                            <SelectItem value="50">{toLocaleNumber(50, langCode)}</SelectItem>
                                            <SelectItem value="100">{toLocaleNumber(100, langCode)}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-1 text-gray-400">
                                    <Button variant="ghost" size="icon" title={t("copy") || "Copy"} onClick={exportToCopy} className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded">
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title={t("excel") || "Excel"} onClick={() => exportToExcel(false)} className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded">
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title={t("csv") || "CSV"} onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded">
                                        <FileBox className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title={t("pdf") || "PDF"} onClick={exportToPDF} className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded">
                                        <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" title={t("print") || "Print"} onClick={handlePrint} className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded">
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Results Table */}
                        <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar flex-1">
                            <Table className="min-w-[1200px]">
                                <TableHeader className="bg-transparent border-b border-gray-100">
                                    <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-3 px-4">{t("admission_no") || "Admission No"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">{t("student_name") || "Student Name"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">{t("roll_no") || "Roll No."} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">{t("homework_date") || "Homework Date"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">{t("submission_date") || "Submission Date"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4">{t("evaluation_date") || "Evaluation Date"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4 text-center">{t("total_marks") || "Total Marks"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4 text-center">{t("marks_obtained") || "Marks Obtained"} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4 text-right">{t("note") || "Note"}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton cols={9} />
                                    ) : !marksIsSearched ? (
                                        <TableRow className="hover:bg-transparent h-64">
                                            <TableCell colSpan={9} className="text-center py-12">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                    <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest">{t("no_data_available_in_table") || "No data available in table"}</p>
                                                    <div className="relative">
                                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                            <BookMarked className="h-8 w-8 text-gray-200" />
                                                        </div>
                                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center">
                                                            <Plus className="h-3 w-3 text-indigo-300" />
                                                        </div>
                                                    </div>
                                                    <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                                        <span className="text-lg">←</span> {t("search_with_criteria_marks") || "Search with criteria to retrieve homework marks."}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedMarksList.length > 0 ? (
                                        paginatedMarksList.map((m, idx) => (
                                            <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                                <TableCell className="py-3 px-4 text-indigo-600 font-bold">{toLocaleNumber(m.admissionNo, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-800 font-medium">{translateStudentName(m.studentName, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{toLocaleNumber(m.rollNo, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{formatDateDDMMYYYY(m.homeworkDate, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{formatDateDDMMYYYY(m.submissionDate, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-gray-500">{formatDateDDMMYYYY(m.evaluationDate, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-center text-gray-700 font-bold">{toLocaleNumber(m.totalMarks, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-center text-emerald-600 font-bold">{toLocaleNumber(m.marksObtained, langCode)}</TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-500">{translateNote(m.note, langCode)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="hover:bg-transparent">
                                            <TableCell colSpan={9} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                                {t("no_records_marks") || "No homework marks match selected filters."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Pagination Spacing Pinned to Bottom */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500 font-medium pt-4 border-t border-gray-100 mt-auto">
                        <div>
                            {t("showing") || "Showing"} {toLocaleNumber(totalEntries > 0 ? startIndex + 1 : 0, langCode)} {t("to") || "to"}{" "}
                            {toLocaleNumber(Math.min(startIndex + sizeNum, totalEntries), langCode)} {t("of") || "of"} {toLocaleNumber(totalEntries, langCode)} {t("entries") || "entries"}
                            {searchTerm && ` (${t("filtered_from") || "filtered from"} ${toLocaleNumber(marksList.length, langCode)} ${t("total_entries") || "total entries"})`}
                        </div>
                        {marksList.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <button 
                                    disabled={safeCurrentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all shadow-none"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "h-8 w-8 text-xs font-bold flex items-center justify-center cursor-pointer transition-all rounded-lg",
                                            safeCurrentPage === page 
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs font-bold" 
                                                : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200"
                                        )}
                                    >
                                        {toLocaleNumber(page, langCode)}
                                    </button>
                                ))}
                                <button 
                                    disabled={safeCurrentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    className="h-8 w-8 bg-white hover:bg-gray-50 text-gray-500 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all shadow-none"
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
