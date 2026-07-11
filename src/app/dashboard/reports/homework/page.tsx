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

const reportLinks = [
    { name: "Homework Report", icon: FileText, active: true },
    { name: "Homework Evaluation Report", icon: ClipboardCheck },
    { name: "Daily Assignment Report", icon: CalendarCheck },
    { name: "Homework Marks Report", icon: BookOpen },
];

const searchTypes = [
    { label: "Today", value: "today" },
    { label: "This Week", value: "this_week" },
    { label: "Last Week", value: "last_week" },
    { label: "This Month", value: "this_month" },
    { label: "Last Month", value: "last_month" },
    { label: "This Year", value: "this_year" },
    { label: "Last Year", value: "last_year" },
    { label: "All Time", value: "all" }
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

export default function HomeworkReportPage() {
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
        <div className="p-4 lg:p-6 space-y-5 animate-in fade-in duration-500 pb-20 text-xs">
            {/* Header Card */}
            <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] overflow-hidden pt-0 gap-0">
                <CardHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <BookOpen className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold text-slate-800 leading-none">Homework Report</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">Homework assignments, evaluation, and marks reports</p>
                            </div>
                        </div>
                        <Link href="/user/homework" className="flex items-center gap-1.5 h-8 px-3.5 rounded-[10px] text-white text-[11px] font-semibold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity active:scale-95 shadow-sm">
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

            {/* Select Criteria Section (Homework Report) */}
            {activeTab === "Homework Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class</Label>
                            <Select value={selectedClass} onValueChange={handleClassChange}>
                                <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section</Label>
                            <Select value={selectedSection} onValueChange={setSelectedSection}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sections</SelectItem>
                                    {sections.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Subject Group</Label>
                            <Select value={selectedSubjectGroup} onValueChange={setSelectedSubjectGroup}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Subject Groups</SelectItem>
                                    {subjectGroups.map(sg => (
                                        <SelectItem key={sg.id} value={String(sg.id)}>{sg.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Subject</Label>
                            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Subjects</SelectItem>
                                    {subjects.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button 
                            onClick={handleSearch}
                            disabled={loading}
                            variant="gradient"
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-300 font-bold px-6 h-9 flex items-center justify-center gap-2 rounded-full shadow-[0_4px_14px_rgba(99,102,241,0.3)]"
                        >
                            <Search className="h-4 w-4" />
                            {loading ? "Searching..." : "Search"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Select Criteria Section (Homework Evaluation Report) */}
            {activeTab === "Homework Evaluation Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 animate-fadeIn">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                            <Select value={evalClass} onValueChange={handleEvalClassChange}>
                                <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section <span className="text-red-500">*</span></Label>
                            <Select value={evalSection} onValueChange={setEvalSection}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {evalSections.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Subject Group <span className="text-red-500">*</span></Label>
                            <Select value={evalSubjectGroup} onValueChange={setEvalSubjectGroup}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjectGroups.map(sg => (
                                        <SelectItem key={sg.id} value={String(sg.id)}>{sg.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Subject <span className="text-red-500">*</span></Label>
                            <Select value={evalSubject} onValueChange={setEvalSubject}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button 
                            onClick={handleEvalSearch}
                            disabled={loading}
                            variant="gradient"
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-300 font-bold px-6 h-9 flex items-center justify-center gap-2 rounded-full shadow-[0_4px_14px_rgba(99,102,241,0.3)]"
                        >
                            <Search className="h-4 w-4" />
                            {loading ? "Searching..." : "Search"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Select Criteria Section (Daily Assignment Report) */}
            {activeTab === "Daily Assignment Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 animate-fadeIn">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Type <span className="text-red-500">*</span></Label>
                            <Select value={assignSearchType} onValueChange={setAssignSearchType}>
                                <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {searchTypes.map(t => (
                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                            <Select value={assignClass} onValueChange={handleAssignClassChange}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section <span className="text-red-500">*</span></Label>
                            <Select value={assignSection} onValueChange={setAssignSection}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {assignSections.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Subject Group <span className="text-red-500">*</span></Label>
                            <Select value={assignSubjectGroup} onValueChange={setAssignSubjectGroup}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjectGroups.map(sg => (
                                        <SelectItem key={sg.id} value={String(sg.id)}>{sg.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Subject <span className="text-red-500">*</span></Label>
                            <Select value={assignSubject} onValueChange={setAssignSubject}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button 
                            onClick={handleAssignSearch}
                            disabled={loading}
                            variant="gradient"
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-300 font-bold px-6 h-9 flex items-center justify-center gap-2 rounded-full shadow-[0_4px_14px_rgba(99,102,241,0.3)]"
                        >
                            <Search className="h-4 w-4" />
                            {loading ? "Searching..." : "Search"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Select Criteria Section (Homework Marks Report) */}
            {activeTab === "Homework Marks Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 animate-fadeIn">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight border-b border-gray-50 pb-2">Select Criteria</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Class <span className="text-red-500">*</span></Label>
                            <Select value={marksClass} onValueChange={handleMarksClassChange}>
                                <SelectTrigger className="h-8 border-indigo-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Select">Select</SelectItem>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section</Label>
                            <Select value={marksSection} onValueChange={setMarksSection}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Select">Select</SelectItem>
                                    {marksSections.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Subject Group</Label>
                            <Select value={marksSubjectGroup} onValueChange={setMarksSubjectGroup}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Select">Select</SelectItem>
                                    {subjectGroups.map(sg => (
                                        <SelectItem key={sg.id} value={String(sg.id)}>{sg.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Subject</Label>
                            <Select value={marksSubject} onValueChange={setMarksSubject}>
                                <SelectTrigger className="h-8 border-gray-200 text-[11px] shadow-none rounded focus:ring-indigo-500">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Select">Select</SelectItem>
                                    {subjects.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button 
                            onClick={handleMarksSearch}
                            disabled={loading}
                            variant="gradient"
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-300 font-bold px-6 h-9 flex items-center justify-center gap-2 rounded-full shadow-[0_4px_14px_rgba(99,102,241,0.3)]"
                        >
                            <Search className="h-4 w-4" />
                            {loading ? "Searching..." : "Search"}
                        </Button>
                    </div>
                </div>
            )}

            {/* Homework Report Table Section */}
            {activeTab === "Homework Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px]">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Homework Report</h2>

                    {/* Table Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Show</span>
                                <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none">
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
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button variant="ghost" size="icon" title="Copy" onClick={exportToCopy} className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded">
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Excel" onClick={() => exportToExcel(false)} className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded">
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="CSV" onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded">
                                    <FileBox className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="PDF" onClick={exportToPDF} className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded">
                                    <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Print" onClick={handlePrint} className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded">
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="rounded border border-gray-100 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1200px]">
                            <TableHeader className="bg-transparent border-b border-gray-100">
                                <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4">Class <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Section <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Subject Group <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Subject <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Homework Date <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Submission Date <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-center">Student Count <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-center">Homework Submitted <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-right">Pending Student</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableSkeleton cols={9} />
                                ) : !isSearched ? (
                                    <TableRow className="hover:bg-transparent h-64">
                                        <TableCell colSpan={9} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest">No data available in table</p>
                                                <div className="relative">
                                                    <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                        <BookMarked className="h-8 w-8 text-gray-200" />
                                                    </div>
                                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center">
                                                        <Plus className="h-3 w-3 text-indigo-300" />
                                                    </div>
                                                </div>
                                                <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                                    <span className="text-lg">←</span> Search with criteria to retrieve homework details.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedList.length > 0 ? (
                                    paginatedList.map((h, idx) => (
                                        <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                            <TableCell className="py-3 px-4 text-gray-700 font-bold">{h.class}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{h.section}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{h.subjectGroup}</TableCell>
                                            <TableCell className="py-3 px-4 text-indigo-600 underline font-bold cursor-pointer">{h.subject}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{h.homeworkDate}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500 font-medium">{h.submissionDate}</TableCell>
                                            <TableCell className="py-3 px-4 text-center text-gray-700 font-semibold">{h.studentCount}</TableCell>
                                            <TableCell className="py-3 px-4 text-center text-emerald-600 font-bold">{h.homeworkSubmitted}</TableCell>
                                            <TableCell className="py-3 px-4 text-right text-rose-500 font-bold">{h.pendingStudent}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={9} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                            No homework records match selected filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Spacing */}
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold pt-4 border-t border-t-gray-50/50 mt-2">
                        <div>
                            Showing {totalEntries > 0 ? startIndex + 1 : 0} to{" "}
                            {Math.min(startIndex + sizeNum, totalEntries)} of {totalEntries} entries
                            {searchTerm && ` (filtered from ${homeworkList.length} total entries)`}
                        </div>
                        {homeworkList.length > 0 && (
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

            {/* Homework Evaluation Report Table Section */}
            {activeTab === "Homework Evaluation Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px] animate-fadeIn">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Homework Evaluation Report</h2>

                    {/* Table Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Show</span>
                                <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none">
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
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button variant="ghost" size="icon" title="Copy" onClick={exportToCopy} className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded">
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Excel" onClick={() => exportToExcel(false)} className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded">
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="CSV" onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded">
                                    <FileBox className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="PDF" onClick={exportToPDF} className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded">
                                    <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Print" onClick={handlePrint} className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded">
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="rounded border border-gray-100 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1000px]">
                            <TableHeader className="bg-transparent border-b border-gray-100">
                                <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4">Subject <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Homework Date <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Submission Date <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Complete / Incomplete <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-right">Complete%</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableSkeleton cols={5} />
                                ) : !evalIsSearched ? (
                                    <TableRow className="hover:bg-transparent h-64">
                                        <TableCell colSpan={5} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest">No data available in table</p>
                                                <div className="relative">
                                                    <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                        <BookMarked className="h-8 w-8 text-gray-200" />
                                                    </div>
                                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center">
                                                        <Plus className="h-3 w-3 text-indigo-300" />
                                                    </div>
                                                </div>
                                                <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                                    <span className="text-lg">←</span> Search with criteria to retrieve evaluation details.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedEvalList.length > 0 ? (
                                    paginatedEvalList.map((e, idx) => (
                                        <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                            <TableCell className="py-3 px-4 text-indigo-600 underline font-bold cursor-pointer">{e.subject}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{e.homeworkDate}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500 font-medium">{e.submissionDate}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500 font-bold">{e.completeIncomplete}</TableCell>
                                            <TableCell className="py-3 px-4 text-right text-gray-700 font-bold">{e.completePercent}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={5} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                            No homework evaluation records match selected filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Spacing */}
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold pt-4 border-t border-t-gray-50/50 mt-2">
                        <div>
                            Showing {totalEntries > 0 ? startIndex + 1 : 0} to{" "}
                            {Math.min(startIndex + sizeNum, totalEntries)} of {totalEntries} entries
                            {searchTerm && ` (filtered from ${evalList.length} total entries)`}
                        </div>
                        {evalList.length > 0 && (
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

            {/* Daily Assignment Report Table Section */}
            {activeTab === "Daily Assignment Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px] animate-fadeIn">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Daily Assignment Report</h2>

                    {/* Table Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Show</span>
                                <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none">
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
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button variant="ghost" size="icon" title="Copy" onClick={exportToCopy} className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded">
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Excel" onClick={() => exportToExcel(false)} className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded">
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="CSV" onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded">
                                    <FileBox className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="PDF" onClick={exportToPDF} className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded">
                                    <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Print" onClick={handlePrint} className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded">
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="rounded border border-gray-100 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[900px]">
                            <TableHeader className="bg-transparent border-b border-gray-100">
                                <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4">Student Name <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Class <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Section <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-center">Total Assignment <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableSkeleton cols={5} />
                                ) : !assignIsSearched ? (
                                    <TableRow className="hover:bg-transparent h-64">
                                        <TableCell colSpan={5} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest">No data available in table</p>
                                                <div className="relative">
                                                    <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                        <BookMarked className="h-8 w-8 text-gray-200" />
                                                    </div>
                                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center">
                                                        <Plus className="h-3 w-3 text-indigo-300" />
                                                    </div>
                                                </div>
                                                <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                                    <span className="text-lg">←</span> Search with criteria to retrieve daily assignments.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedAssignList.length > 0 ? (
                                    paginatedAssignList.map((a, idx) => (
                                        <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                            <TableCell className="py-3 px-4 text-indigo-600 font-bold">{a.studentName}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{a.class}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{a.section}</TableCell>
                                            <TableCell className="py-3 px-4 text-center text-gray-700 font-bold">{a.totalAssignment}</TableCell>
                                            <TableCell className="py-3 px-4 text-right">
                                                <Button variant="ghost" size="icon" title="View details" className="h-7 w-7 text-indigo-600 hover:bg-indigo-50 rounded">
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={5} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                            No daily assignments match selected filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Spacing */}
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold pt-4 border-t border-t-gray-50/50 mt-2">
                        <div>
                            Showing {totalEntries > 0 ? startIndex + 1 : 0} to{" "}
                            {Math.min(startIndex + sizeNum, totalEntries)} of {totalEntries} entries
                            {searchTerm && ` (filtered from ${assignList.length} total entries)`}
                        </div>
                        {assignList.length > 0 && (
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

            {/* Homework Marks Report Table Section */}
            {activeTab === "Homework Marks Report" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[400px] animate-fadeIn">
                    <h2 className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">Homework Marks Report</h2>

                    {/* Table Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Show</span>
                                <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none rounded outline-none">
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
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button variant="ghost" size="icon" title="Copy" onClick={exportToCopy} className="h-7 w-7 hover:bg-gray-100 hover:text-indigo-600 rounded">
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Excel" onClick={() => exportToExcel(false)} className="h-7 w-7 hover:bg-gray-100 hover:text-emerald-600 rounded">
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="CSV" onClick={() => exportToExcel(true)} className="h-7 w-7 hover:bg-gray-100 hover:text-amber-600 rounded">
                                    <FileBox className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="PDF" onClick={exportToPDF} className="h-7 w-7 hover:bg-gray-100 hover:text-rose-600 rounded">
                                    <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Print" onClick={handlePrint} className="h-7 w-7 hover:bg-gray-100 hover:text-gray-900 rounded">
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="rounded border border-gray-100 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1200px]">
                            <TableHeader className="bg-transparent border-b border-gray-100">
                                <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                    <TableHead className="py-3 px-4">Admission No <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Student Name <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Roll No. <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Homework Date <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Submission Date <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4">Evaluation Date <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-center">Total Marks <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-center">Marks Obtained <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                    <TableHead className="py-3 px-4 text-right">Note</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableSkeleton cols={9} />
                                ) : !marksIsSearched ? (
                                    <TableRow className="hover:bg-transparent h-64">
                                        <TableCell colSpan={9} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center space-y-3 opacity-60">
                                                <p className="text-red-400 font-bold mb-4 uppercase text-[10px] tracking-widest">No data available in table</p>
                                                <div className="relative">
                                                    <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border-t border-l border-gray-100 shadow-inner">
                                                        <BookMarked className="h-8 w-8 text-gray-200" />
                                                    </div>
                                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border border-indigo-50 flex items-center justify-center">
                                                        <Plus className="h-3 w-3 text-indigo-300" />
                                                    </div>
                                                </div>
                                                <p className="text-emerald-500 font-bold text-[10px] flex items-center gap-1">
                                                    <span className="text-lg">←</span> Search with criteria to retrieve homework marks.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedMarksList.length > 0 ? (
                                    paginatedMarksList.map((m, idx) => (
                                        <TableRow key={idx} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                            <TableCell className="py-3 px-4 text-indigo-600 font-bold">{m.admissionNo}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-800 font-medium">{m.studentName}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{m.rollNo}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{m.homeworkDate}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{m.submissionDate}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-500">{m.evaluationDate}</TableCell>
                                            <TableCell className="py-3 px-4 text-center text-gray-700 font-bold">{m.totalMarks}</TableCell>
                                            <TableCell className="py-3 px-4 text-center text-emerald-600 font-bold">{m.marksObtained}</TableCell>
                                            <TableCell className="py-3 px-4 text-right text-gray-500">{m.note}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={9} className="text-center py-12 text-gray-400 font-semibold uppercase text-[10px] tracking-wider">
                                            No homework marks match selected filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Spacing */}
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold pt-4 border-t border-t-gray-50/50 mt-2">
                        <div>
                            Showing {totalEntries > 0 ? startIndex + 1 : 0} to{" "}
                            {Math.min(startIndex + sizeNum, totalEntries)} of {totalEntries} entries
                            {searchTerm && ` (filtered from ${marksList.length} total entries)`}
                        </div>
                        {marksList.length > 0 && (
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
