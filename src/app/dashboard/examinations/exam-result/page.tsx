"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { useSettings } from "@/components/providers/settings-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Copy, FileSpreadsheet, Printer, Search,
    Award, Filter,
    FileBarChart,
    CheckCircle2, XCircle, Download, Eye, GraduationCap, Trophy
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/lib/image-url";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse" style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

interface Subject {
    id: number;
    name: string;
    code: string;
}

interface ExamMark {
    subject_id: number | string;
    marks: string | number;
    is_absent: boolean;
    subject?: Subject;
}

interface StudentResult {
    id: string | number;
    admission_no: string;
    roll_no?: string;
    name: string;
    last_name?: string;
    avatar?: string;
    photo?: string;
    gender?: string;
    schoolClass?: { name: string };
    section?: { name: string };
    exam_results?: ExamMark[];
    examResults?: ExamMark[];
}

interface SectionItem {
    id: number;
    name: string;
}

interface ClassItem {
    id: number;
    name: string;
    sections?: SectionItem[];
}

interface ExamItem {
    id: number;
    name: string;
}

interface ExamGroupItem {
    id: number;
    name: string;
    exams?: ExamItem[];
}

interface SessionItem {
    id: number;
    session: string;
}

interface ExamSchedule {
    id: number;
    exam_id: number;
    subject_id: number;
    max_marks: string | number;
    min_marks: string | number;
}

interface MarksGrade {
    id: number;
    name: string;
    percent_from: number;
    percent_upto: number;
    grade_point: number | string;
    description?: string;
}

interface MarksDivision {
    id: number;
    name: string;
    percent_from: number;
    percent_upto: number;
}

interface GeneralSetting {
    school_name?: string;
    school_address?: string;
    phone?: string;
    email?: string;
    print_logo?: string;
    admin_logo?: string;
    app_logo?: string;
    address?: string;
}

interface PrintSettingItem {
    id?: number;
    type: string;
    header_image_url?: string | null;
    footer_content?: string | null;
    paper_size?: string;
}

// Robust browser Base64 image loader with Data URL support, fetch Blob proxy & canvas fallback
const loadBase64Image = async (rawUrl: string): Promise<{ data: string; width: number; height: number; ext: string } | null> => {
    if (!rawUrl) return null;

    // 1. If already a Base64 data URI
    if (rawUrl.startsWith("data:image/")) {
        const ext = rawUrl.includes("image/jpeg") || rawUrl.includes("image/jpg") ? "JPEG" : "PNG";
        return { data: rawUrl, width: 100, height: 40, ext };
    }

    const fullUrl = getImageUrl(rawUrl);
    if (!fullUrl) return null;

    // 2. Fetch directly or via camera-proxy to prevent canvas CORS security errors
    try {
        const proxyUrl = fullUrl.startsWith("http") ? `/api/camera-proxy?url=${encodeURIComponent(fullUrl)}` : fullUrl;
        const res = await fetch(proxyUrl);
        if (res.ok) {
            const blob = await res.blob();
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
            const ext = fullUrl.toLowerCase().includes(".jpg") || fullUrl.toLowerCase().includes(".jpeg") ? "JPEG" : "PNG";
            return { data: dataUrl, width: 100, height: 40, ext };
        }
    } catch {
        // Fallback to canvas
    }

    // 3. Fallback to image canvas
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = img.naturalWidth || img.width || 100;
                canvas.height = img.naturalHeight || img.height || 40;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const ext = fullUrl.toLowerCase().includes(".png") ? "PNG" : "JPEG";
                    const data = canvas.toDataURL(ext === "PNG" ? "image/png" : "image/jpeg");
                    resolve({ data, width: canvas.width, height: canvas.height, ext });
                    return;
                }
            } catch {
                // Ignore
            }
            resolve(null);
        };
        img.onerror = () => resolve(null);
        img.src = fullUrl;
    });
};

const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export default function ExamResultPage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const { settings } = useSettings();
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    // Criteria Data
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [sections, setSections] = useState<SectionItem[]>([]);
    const [examGroups, setExamGroups] = useState<ExamGroupItem[]>([]);
    const [exams, setExams] = useState<ExamItem[]>([]);
    const [sessions, setSessions] = useState<SessionItem[]>([]);
    const [classStudents, setClassStudents] = useState<StudentResult[]>([]);
    const [printSettings, setPrintSettings] = useState<PrintSettingItem[]>([]);

    // Selected Criteria
    const [selectedCriteria, setSelectedCriteria] = useState({
        exam_group_id: "",
        exam_id: "",
        session_id: "",
        school_class_id: "",
        section_id: "all",
        student_id: "all"
    });

    // Results Data & Grading Config
    const [students, setStudents] = useState<StudentResult[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [examSchedules, setExamSchedules] = useState<ExamSchedule[]>([]);
    const [grades, setGrades] = useState<MarksGrade[]>([]);
    const [divisions, setDivisions] = useState<MarksDivision[]>([]);
    const [examDetails, setExamDetails] = useState<{ name?: string; exam_group?: { name?: string } } | null>(null);
    const [generalSetting, setGeneralSetting] = useState<GeneralSetting | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Student Marksheet Modal State
    const [selectedStudentForModal, setSelectedStudentForModal] = useState<StudentResult | null>(null);
    const [isMarksheetOpen, setIsMarksheetOpen] = useState(false);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [criteriaRes, classesRes, printSettingsRes] = await Promise.all([
                api.get('/examination/exam-results/criteria'),
                api.get('/academics/classes?no_paginate=true'),
                api.get('system-setting/print-settings').catch(() => ({ data: { data: [] } }))
            ]);

            setExamGroups(criteriaRes.data.exam_groups || []);
            setSessions(criteriaRes.data.sessions || []);
            setClasses(classesRes.data.data || classesRes.data || []);
            if (printSettingsRes.data?.data) {
                setPrintSettings(printSettingsRes.data.data);
            }
        } catch {
            tt.error("failed_to_load_criteria");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedCriteria.school_class_id) {
            const cls = classes.find(c => c.id.toString() === selectedCriteria.school_class_id);
            setSections(cls?.sections || []);
            fetchClassStudents(selectedCriteria.school_class_id, selectedCriteria.section_id);
        } else {
            setSections([]);
            setClassStudents([]);
        }
        setSelectedCriteria(prev => ({ ...prev, student_id: "all" }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCriteria.school_class_id, classes]);

    useEffect(() => {
        if (selectedCriteria.school_class_id) {
            fetchClassStudents(selectedCriteria.school_class_id, selectedCriteria.section_id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCriteria.section_id]);

    useEffect(() => {
        if (selectedCriteria.exam_group_id) {
            const group = examGroups.find(g => g.id.toString() === selectedCriteria.exam_group_id);
            setExams(group?.exams || []);
        } else {
            setExams([]);
        }
        setSelectedCriteria(prev => ({ ...prev, exam_id: "" }));
    }, [selectedCriteria.exam_group_id, examGroups]);

    const fetchClassStudents = async (classId: string, sectionId: string) => {
        if (!classId) return;
        try {
            const params: Record<string, string> = { school_class_id: classId, no_paginate: "true" };
            if (sectionId && sectionId !== "all") {
                params.section_id = sectionId;
            }
            const res = await api.get('/students', { params });
            const list = res.data?.data?.data || res.data?.data || res.data || [];
            setClassStudents(Array.isArray(list) ? list : []);
        } catch {
            setClassStudents([]);
        }
    };

    const handleSearch = async () => {
        if (!selectedCriteria.exam_id || !selectedCriteria.school_class_id) {
            tt.error("please_select_all_required_fields");
            return;
        }

        setSearching(true);
        try {
            const payload: Record<string, string> = {
                exam_id: selectedCriteria.exam_id,
                school_class_id: selectedCriteria.school_class_id,
            };
            if (selectedCriteria.section_id && selectedCriteria.section_id !== "all") {
                payload.section_id = selectedCriteria.section_id;
            }
            if (selectedCriteria.student_id && selectedCriteria.student_id !== "all") {
                payload.student_id = selectedCriteria.student_id;
            }

            const response = await api.post('/examination/exam-results/search', payload);
            const fetchedStudents: StudentResult[] = response.data.students || [];
            let fetchedSubjects: Subject[] = response.data.subjects || [];

            // If subjects array is empty, collect from student exam results
            if (fetchedSubjects.length === 0) {
                const subMap = new Map<number | string, Subject>();
                fetchedStudents.forEach(st => {
                    const marks = st.exam_results || st.examResults || [];
                    marks.forEach((m, idx) => {
                        if (m.subject) {
                            subMap.set(m.subject.id, m.subject);
                        } else if (m.subject_id) {
                            subMap.set(m.subject_id, {
                                id: Number(m.subject_id) || idx + 1,
                                name: `Subject ${m.subject_id}`,
                                code: `SUB-${m.subject_id}`
                            });
                        }
                    });
                });
                fetchedSubjects = Array.from(subMap.values());
            }

            setStudents(fetchedStudents);
            setSubjects(fetchedSubjects);
            setExamSchedules(response.data.exam_schedules || []);
            setGrades(response.data.grades || []);
            setDivisions(response.data.divisions || []);
            setExamDetails(response.data.exam || null);
            setGeneralSetting(response.data.general_setting || null);
        } catch {
            tt.error("failed_to_fetch_results");
        } finally {
            setSearching(false);
        }
    };

    const getSubjectSchedule = (subjectId: number | string) => {
        const numId = Number(subjectId);
        return examSchedules.find(s => Number(s.subject_id) === numId);
    };

    const getSubjectMaxMarks = (subjectId: number | string) => {
        const sch = getSubjectSchedule(subjectId);
        return sch ? parseFloat(String(sch.max_marks)) || 100 : 100;
    };

    const getSubjectPassMarks = (subjectId: number | string) => {
        const sch = getSubjectSchedule(subjectId);
        return sch ? parseFloat(String(sch.min_marks)) || 33 : 33;
    };

    const getGradeInfo = (percent: number) => {
        const standardPoint = percent >= 80 ? "5.00" :
                              percent >= 70 ? "4.00" :
                              percent >= 60 ? "3.50" :
                              percent >= 50 ? "3.00" :
                              percent >= 40 ? "2.00" :
                              percent >= 33 ? "1.00" : "0.00";

        if (grades.length > 0) {
            const matched = grades.find(g => percent >= g.percent_from && percent <= g.percent_upto);
            if (matched) {
                const pt = (matched.grade_point && parseFloat(String(matched.grade_point)) > 0) ? String(matched.grade_point) : standardPoint;
                return {
                    grade: matched.name,
                    point: pt,
                    color: percent >= 80 ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
                           percent >= 60 ? "text-blue-700 bg-blue-50 border-blue-200" :
                           percent >= 40 ? "text-amber-700 bg-amber-50 border-amber-200" :
                           "text-rose-700 bg-rose-50 border-rose-200"
                };
            }
        }

        if (percent >= 80) return { grade: "A+", point: "5.00", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
        if (percent >= 70) return { grade: "A", point: "4.00", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
        if (percent >= 60) return { grade: "A-", point: "3.50", color: "text-blue-700 bg-blue-50 border-blue-200" };
        if (percent >= 50) return { grade: "B", point: "3.00", color: "text-blue-700 bg-blue-50 border-blue-200" };
        if (percent >= 40) return { grade: "C", point: "2.00", color: "text-amber-700 bg-amber-50 border-amber-200" };
        if (percent >= 33) return { grade: "D", point: "1.00", color: "text-amber-700 bg-amber-50 border-amber-200" };
        return { grade: "F", point: "0.00", color: "text-rose-700 bg-rose-50 border-rose-200" };
    };

    const getDivisionInfo = (percent: number, hasFailedSubject: boolean) => {
        if (hasFailedSubject || percent < 33) {
            return { division: "Fail", color: "text-rose-700 bg-rose-50 border-rose-200" };
        }

        if (divisions.length > 0) {
            const matched = divisions.find(d => percent >= d.percent_from && percent <= d.percent_upto);
            if (matched) {
                return {
                    division: matched.name,
                    color: percent >= 60 ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
                           percent >= 45 ? "text-blue-700 bg-blue-50 border-blue-200" :
                           "text-amber-700 bg-amber-50 border-amber-200"
                };
            }
        }

        if (percent >= 75) return { division: "Distinction", color: "text-purple-700 bg-purple-50 border-purple-200" };
        if (percent >= 60) return { division: "1st Division", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
        if (percent >= 45) return { division: "2nd Division", color: "text-blue-700 bg-blue-50 border-blue-200" };
        if (percent >= 33) return { division: "3rd Division", color: "text-amber-700 bg-amber-50 border-amber-200" };
        return { division: "Fail", color: "text-rose-700 bg-rose-50 border-rose-200" };
    };

    const getStudentMark = (student: StudentResult, subjectId: number | string) => {
        const results = student.exam_results || student.examResults || [];
        const numId = Number(subjectId);
        return results.find((r) => Number(r.subject_id) === numId || Number(r.subject?.id) === numId);
    };

    // Combine subjects array and any subjects attached to student's results
    const getEffectiveSubjects = (student?: StudentResult | null): Subject[] => {
        const map = new Map<number | string, Subject>();
        subjects.forEach(s => map.set(s.id, s));

        if (student && map.size === 0) {
            const results = student.exam_results || student.examResults || [];
            results.forEach((r, idx) => {
                if (r.subject && !map.has(r.subject.id)) {
                    map.set(r.subject.id, r.subject);
                } else if (r.subject_id && !map.has(r.subject_id)) {
                    map.set(r.subject_id, {
                        id: Number(r.subject_id) || idx + 1,
                        name: `Subject ${r.subject_id}`,
                        code: `SUB-${r.subject_id}`
                    });
                }
            });
        }

        return Array.from(map.values());
    };

    const getStudentStats = (student: StudentResult) => {
        const studentSubjects = getEffectiveSubjects(student);
        let totalObtained = 0;
        let totalMax = 0;
        let hasFailedSubject = false;
        let gradedCount = 0;

        studentSubjects.forEach(subject => {
            const mark = getStudentMark(student, subject.id);
            const max = getSubjectMaxMarks(subject.id);
            const pass = getSubjectPassMarks(subject.id);
            totalMax += max;

            if (mark) {
                gradedCount++;
                if (mark.is_absent) {
                    hasFailedSubject = true;
                } else {
                    const val = parseFloat(String(mark.marks || "0"));
                    totalObtained += val;
                    if (val < pass) {
                        hasFailedSubject = true;
                    }
                }
            }
        });

        const percent = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
        const gradeInfo = getGradeInfo(percent);
        const divisionInfo = getDivisionInfo(percent, hasFailedSubject || (gradedCount === 0));

        return {
            totalObtained,
            totalMax,
            percent: percent.toFixed(2),
            grade: gradeInfo.grade,
            point: gradeInfo.point,
            gradeColor: gradeInfo.color,
            division: divisionInfo.division,
            divisionColor: divisionInfo.color,
            hasFailedSubject: hasFailedSubject || (gradedCount === 0)
        };
    };

    // Precalculate Ranks & Positions for all students (Passed highest first, then failed)
    const studentRanks = (() => {
        const map = new Map<string | number, { rank: number; positionText: string; badgeStyle: string }>();
        if (students.length === 0) return map;

        const studentScores = students.map(st => {
            const stats = getStudentStats(st);
            return {
                id: st.id,
                totalObtained: stats.totalObtained,
                percent: parseFloat(stats.percent) || 0,
                hasFailed: stats.hasFailedSubject
            };
        });

        studentScores.sort((a, b) => {
            if (!a.hasFailed && b.hasFailed) return -1;
            if (a.hasFailed && !b.hasFailed) return 1;
            if (b.totalObtained !== a.totalObtained) return b.totalObtained - a.totalObtained;
            return b.percent - a.percent;
        });

        studentScores.forEach((item, index) => {
            const rank = index + 1;
            const posText = getOrdinal(rank);
            let badgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-200";

            if (!item.hasFailed) {
                if (rank === 1) {
                    badgeStyle = "bg-amber-100 text-amber-900 border-amber-300 font-extrabold shadow-xs ring-1 ring-amber-400/30";
                } else if (rank === 2) {
                    badgeStyle = "bg-slate-200 text-slate-900 border-slate-300 font-bold shadow-xs";
                } else if (rank === 3) {
                    badgeStyle = "bg-orange-100 text-orange-900 border-orange-300 font-bold shadow-xs";
                } else {
                    badgeStyle = "bg-blue-50 text-blue-700 border-blue-200 font-medium";
                }
            } else {
                badgeStyle = "bg-gray-100 text-gray-500 border-gray-200 font-normal";
            }

            map.set(item.id, {
                rank,
                positionText: posText,
                badgeStyle
            });
        });

        return map;
    })();

    const filteredStudents = students.filter(s =>
        (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.last_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.admission_no || "").includes(searchTerm) ||
        (s.roll_no || "").includes(searchTerm)
    );

    const handleCopy = () => {
        if (filteredStudents.length === 0) return;
        const allSubs = getEffectiveSubjects();
        const headers = ["Position", "Admission No", "Student Name", ...allSubs.map(s => `${s.name} (${s.code})`), "Grand Total", "Percentage", "Grade", "Division", "Status"];
        const rows = filteredStudents.map(student => {
            const stats = getStudentStats(student);
            const rankInfo = studentRanks.get(student.id);
            const subjectMarks = allSubs.map(subject => {
                const mark = getStudentMark(student, subject.id);
                if (!mark) return "---";
                if (mark.is_absent) return "Absent";
                return mark.marks;
            });
            return [
                rankInfo?.positionText || "—",
                student.admission_no,
                `${student.name} ${student.last_name || ""}`.trim(),
                ...subjectMarks,
                `${stats.totalObtained.toFixed(2)} / ${stats.totalMax}`,
                `${stats.percent}%`,
                stats.grade,
                stats.division,
                stats.hasFailedSubject ? "Failed" : "Passed"
            ];
        });
        const text = [headers.join("\t"), ...rows.map(r => r.join("\t"))].join("\n");
        navigator.clipboard.writeText(text);
        tt.success("data_copied_to_clipboard");
    };

    const handleExportCSV = () => {
        if (filteredStudents.length === 0) return;
        const allSubs = getEffectiveSubjects();
        const headers = ["Position", "Admission No", "Student Name", ...allSubs.map(s => `"${s.name} (${s.code})"`), "Grand Total", "Max Total", "Percentage (%)", "Grade", "Grade Point", "Division", "Status"];
        const rows = filteredStudents.map(student => {
            const stats = getStudentStats(student);
            const rankInfo = studentRanks.get(student.id);
            const subjectMarks = allSubs.map(subject => {
                const mark = getStudentMark(student, subject.id);
                if (!mark) return `"---"`;
                if (mark.is_absent) return `"Absent"`;
                return `"${mark.marks}"`;
            });
            return [
                `"${rankInfo?.positionText || "—"}"`,
                `"${student.admission_no}"`,
                `"${student.name} ${student.last_name || ""}"`.trim(),
                ...subjectMarks,
                stats.totalObtained.toFixed(2),
                stats.totalMax,
                stats.percent,
                `"${stats.grade}"`,
                stats.point,
                `"${stats.division}"`,
                stats.hasFailedSubject ? `"Failed"` : `"Passed"`
            ];
        });
        const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Exam_Tabulation_Result_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        tt.success("export_completed");
    };

    const getGeneralPurposePrintSetting = () => {
        return printSettings.find(s => s.type === "General Purpose") ||
               printSettings.find(s => s.type === "Invoice") ||
               printSettings[0] ||
               {};
    };

    // Download Individual Student Marksheet PDF with 2-Column Header, School Logo & Clear Footer
    const downloadStudentMarksheetPDF = async (student: StudentResult) => {
        const stats = getStudentStats(student);
        const effectiveSubs = getEffectiveSubjects(student);
        const rankInfo = studentRanks.get(student.id);
        const gpSetting = getGeneralPurposePrintSetting();
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const schoolName = settings?.school_name || generalSetting?.school_name || "iSchool International Academy";
        const schoolAddress = settings?.address || generalSetting?.school_address || generalSetting?.address || "Institutional Campus";
        const phone = settings?.phone || generalSetting?.phone || "+8801851046320";
        const email = settings?.email || generalSetting?.email || "yourschool@gmail.com";
        const website = (settings?.frontend_url || (typeof window !== "undefined" ? window.location.host : "") || "ischool.com").replace(/^https?:\/\//, "");

        let startY = 12;

        // Check if custom header image is configured from Print Header/Footer
        let headerImageDrawn = false;
        if (gpSetting.header_image_url) {
            const customHeaderImg = await loadBase64Image(gpSetting.header_image_url);
            if (customHeaderImg) {
                const imgWidth = 182;
                const imgHeight = (customHeaderImg.height / customHeaderImg.width) * imgWidth;
                doc.addImage(customHeaderImg.data, customHeaderImg.ext, 14, startY, imgWidth, imgHeight);
                startY += imgHeight + 6;
                headerImageDrawn = true;
            }
        }

        // Two-Column Header (When no full banner image)
        if (!headerImageDrawn) {
            const logoUrl = settings?.print_logo || generalSetting?.print_logo || settings?.admin_logo || settings?.app_logo || generalSetting?.admin_logo || generalSetting?.app_logo;
            let logoEndY = startY;

            if (logoUrl) {
                try {
                    const loaded = await loadBase64Image(logoUrl);
                    if (loaded) {
                        const aspectRatio = (loaded.width > 0 && loaded.height > 0) ? (loaded.width / loaded.height) : 3.2;
                        // Standard compact school logo: max height 10mm, max width 32mm
                        let logoHeight = 10;
                        let logoWidth = logoHeight * aspectRatio;
                        if (logoWidth > 32) {
                            logoWidth = 32;
                            logoHeight = logoWidth / aspectRatio;
                        }
                        doc.addImage(loaded.data, loaded.ext, 14, startY, logoWidth, logoHeight);
                        logoEndY = startY + logoHeight;
                    }
                } catch {
                    // Fallback
                }
            }

            // Left Column: School Name placed directly below the Logo
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.setTextColor(30, 41, 59);
            const schoolNameLines = doc.splitTextToSize(schoolName, 95);
            doc.text(schoolNameLines, 14, logoEndY + 3.8);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(99, 102, 241);
            doc.text("Academic Excellence & Student Evaluation", 14, logoEndY + 3.8 + (schoolNameLines.length * 4.5));

            const leftY = logoEndY + 5.5 + (schoolNameLines.length * 4.5);

            // Right Column: Contact & Address Information
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(71, 85, 105);
            let rightY = startY + 2;

            const addressLines = doc.splitTextToSize(`Address: ${schoolAddress}`, 75);
            doc.text(addressLines, pageWidth - 14, rightY, { align: "right" });
            rightY += addressLines.length * 3.8;

            doc.text(`Phone No.: ${phone}`, pageWidth - 14, rightY, { align: "right" });
            rightY += 3.8;

            doc.text(`Email: ${email}`, pageWidth - 14, rightY, { align: "right" });
            rightY += 3.8;

            doc.text(`Website: ${website}`, pageWidth - 14, rightY, { align: "right" });
            rightY += 3.8;

            startY = Math.max(leftY, rightY) + 3;
        }

        // Title Bar
        const examName = examDetails?.name || "Term Examination";
        const examGroupName = examDetails?.exam_group?.name || "";
        const titleText = `ACADEMIC REPORT CARD & MARKSHEET - ${examGroupName ? examGroupName + " : " : ""}${examName}`.toUpperCase();

        doc.setFillColor(79, 70, 229);
        doc.roundedRect(14, startY, 182, 8, 1, 1, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(255, 255, 255);
        doc.text(titleText, pageWidth / 2, startY + 5.5, { align: "center" });

        startY += 12;

        // Student Info Card
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, startY, 182, 25, 2, 2, "F");
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14, startY, 182, 25, 2, 2, "S");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);

        doc.text("Student Name:", 18, startY + 6.5);
        doc.text("Admission No:", 18, startY + 13.5);
        doc.text("Roll No:", 18, startY + 20.5);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        doc.text(`${student.name} ${student.last_name || ""}`.trim(), 46, startY + 6.5);
        doc.text(`${student.admission_no}`, 46, startY + 13.5);
        doc.text(`${student.roll_no || "—"}`, 46, startY + 20.5);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(71, 85, 105);
        doc.text("Class:", 115, startY + 6.5);
        doc.text("Section:", 115, startY + 13.5);
        doc.text("Session:", 115, startY + 20.5);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        doc.text(`${student.schoolClass?.name || selectedCriteria.school_class_id || "—"}`, 135, startY + 6.5);
        doc.text(`${student.section?.name || selectedCriteria.section_id || "—"}`, 135, startY + 13.5);
        doc.text(`${sessions.find(s => s.id.toString() === selectedCriteria.session_id)?.session || "Current"}`, 135, startY + 20.5);

        // Subject Table
        const tableBody = effectiveSubs.map((subject, index) => {
            const mark = getStudentMark(student, subject.id);
            const max = getSubjectMaxMarks(subject.id);
            const pass = getSubjectPassMarks(subject.id);

            if (!mark) {
                return [
                    index + 1,
                    subject.name || "—",
                    subject.code || "—",
                    max,
                    pass,
                    "---",
                    "---",
                    "---",
                    "Not Graded"
                ];
            }

            if (mark.is_absent) {
                return [
                    index + 1,
                    subject.name || "—",
                    subject.code || "—",
                    max,
                    pass,
                    "Absent",
                    "F",
                    "0.00",
                    "Absent"
                ];
            }

            const val = parseFloat(String(mark.marks || "0"));
            const pct = max > 0 ? (val / max) * 100 : 0;
            const gr = getGradeInfo(pct);
            const isPass = val >= pass;

            return [
                index + 1,
                subject.name || "—",
                subject.code || "—",
                max,
                pass,
                val.toFixed(2),
                gr.grade,
                gr.point,
                isPass ? "Passed" : "Failed"
            ];
        });

        autoTable(doc, {
            startY: startY + 29,
            head: [["#", "Subject Name", "Code", "Full Marks", "Pass Marks", "Obtained", "Grade", "Grade Point", "Remarks"]],
            body: tableBody,
            theme: "grid",
            headStyles: {
                fillColor: [79, 70, 229],
                textColor: [255, 255, 255],
                fontStyle: "bold",
                fontSize: 8.5,
                halign: "center"
            },
            styles: {
                fontSize: 8,
                cellPadding: 3,
                halign: "center"
            },
            columnStyles: {
                1: { halign: "left" }
            }
        });

        // Summary Performance Box
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalY = (doc as any).lastAutoTable.finalY + 6;

        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, finalY, 182, 28, 2, 2, "F");
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(14, finalY, 182, 28, 2, 2, "S");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);

        doc.text("Grand Total:", 18, finalY + 6.5);
        doc.text("Percentage:", 18, finalY + 13.5);
        doc.text("Overall Grade:", 18, finalY + 20.5);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(`${stats.totalObtained.toFixed(2)} / ${stats.totalMax}`, 52, finalY + 6.5);
        doc.text(`${stats.percent}%`, 52, finalY + 13.5);
        doc.text(`${stats.grade} (GP: ${stats.point})`, 52, finalY + 20.5);

        doc.setTextColor(71, 85, 105);
        doc.text("Division:", 115, finalY + 6.5);
        doc.text("Merit Position:", 115, finalY + 13.5);
        doc.text("Final Result:", 115, finalY + 20.5);

        doc.setTextColor(15, 23, 42);
        doc.text(`${stats.division}`, 145, finalY + 6.5);
        doc.text(`${rankInfo?.positionText || "—"} Position`, 145, finalY + 13.5);

        if (stats.hasFailedSubject) {
            doc.setTextColor(225, 29, 72);
            doc.text("FAILED", 145, finalY + 20.5);
        } else {
            doc.setTextColor(16, 185, 129);
            doc.text("PASSED", 145, finalY + 20.5);
        }

        // Signature Lines (Well above footer, nicely spaced)
        const signY = Math.min(finalY + 48, pageHeight - 28);
        doc.setDrawColor(148, 163, 184);
        doc.setLineWidth(0.5);
        doc.line(18, signY, 65, signY);
        doc.line(82, signY, 128, signY);
        doc.line(145, signY, 192, signY);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text("Class Teacher", 41.5, signY + 4.5, { align: "center" });
        doc.text("Exam Controller", 105, signY + 4.5, { align: "center" });
        doc.text("Principal / Headmaster", 168.5, signY + 4.5, { align: "center" });

        // Footer at the very bottom of the page
        const footerY = pageHeight - 10;
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(14, footerY - 4, pageWidth - 14, footerY - 4);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        if (gpSetting.footer_content) {
            doc.setTextColor(5, 150, 105);
            const footerLines = doc.splitTextToSize(gpSetting.footer_content, 180);
            doc.text(footerLines, pageWidth / 2, footerY, { align: "center" });
        } else {
            doc.setTextColor(148, 163, 184);
            doc.text(`© ${new Date().getFullYear()} ${schoolName}. All rights reserved.`, pageWidth / 2, footerY, { align: "center" });
        }

        // Save
        const filename = `Marksheet_${student.admission_no}_${student.name.replace(/\s+/g, "_")}.pdf`;
        doc.save(filename);
        tt.success("marksheet_downloaded_successfully");
    };

    // Download Full Class Tabulation PDF
    const downloadTabulationPDF = async () => {
        if (filteredStudents.length === 0) return;

        const doc = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4"
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const schoolName = settings?.school_name || generalSetting?.school_name || "iSchool International Academy";
        const examName = examDetails?.name || "Examination Result Tabulation";
        const allSubs = getEffectiveSubjects();

        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(30, 41, 59);
        doc.text(schoolName, pageWidth / 2, 14, { align: "center" });

        doc.setFontSize(10.5);
        doc.setTextColor(79, 70, 229);
        doc.text(`OFFICIAL TABULATION SHEET - ${examName.toUpperCase()}`, pageWidth / 2, 20, { align: "center" });

        const tableHead = [
            [
                "Rank",
                "Adm No",
                "Student Name",
                ...allSubs.map(s => `${s.name}\n(${s.code})`),
                "Total",
                "Pct (%)",
                "Grade",
                "Division",
                "Status"
            ]
        ];

        const tableBody = filteredStudents.map(student => {
            const stats = getStudentStats(student);
            const rankInfo = studentRanks.get(student.id);
            const subjectMarks = allSubs.map(subject => {
                const mark = getStudentMark(student, subject.id);
                if (!mark) return "---";
                if (mark.is_absent) return "Abs";
                const val = parseFloat(String(mark.marks || "0"));
                const max = getSubjectMaxMarks(subject.id);
                const pct = max > 0 ? (val / max) * 100 : 0;
                const gr = getGradeInfo(pct);
                return `${val}\n(${gr.grade})`;
            });

            return [
                rankInfo?.positionText || "—",
                student.admission_no,
                `${student.name} ${student.last_name || ""}`.trim(),
                ...subjectMarks,
                `${stats.totalObtained.toFixed(1)}/${stats.totalMax}`,
                `${stats.percent}%`,
                stats.grade,
                stats.division,
                stats.hasFailedSubject ? "Fail" : "Pass"
            ];
        });

        autoTable(doc, {
            startY: 25,
            head: tableHead,
            body: tableBody,
            theme: "grid",
            headStyles: {
                fillColor: [79, 70, 229],
                textColor: [255, 255, 255],
                fontStyle: "bold",
                fontSize: 8,
                halign: "center"
            },
            styles: {
                fontSize: 7.5,
                cellPadding: 2,
                halign: "center"
            },
            columnStyles: {
                2: { halign: "left" }
            }
        });

        // Tabulation Footer
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Generated on ${new Date().toLocaleDateString()} | ${schoolName}`, pageWidth / 2, pageHeight - 8, { align: "center" });

        doc.save(`Tabulation_Sheet_${new Date().toISOString().split("T")[0]}.pdf`);
        tt.success("tabulation_pdf_downloaded");
    };

    const handleOpenStudentMarksheet = (student: StudentResult) => {
        setSelectedStudentForModal(student);
        setIsMarksheetOpen(true);
    };

    const gpPrintSetting = getGeneralPurposePrintSetting();
    const activeSubjectsList = getEffectiveSubjects();

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-xl shadow-xs">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
                        <Award className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-base font-bold text-gray-800 tracking-tight leading-none">
                            {t("exam_result")}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {t("exam_result_subtitle") || "Manage examination tabulation, student marks, grades, and academic performance"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Select Criteria Section (Class, Section, and Student Filter) */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("select_criteria")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("choose_exam_session_class_section")}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        {/* Exam Group */}
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{t("exam_group")} <span className="text-red-500">*</span></Label>
                            <Select value={selectedCriteria.exam_group_id} onValueChange={(val) => setSelectedCriteria({...selectedCriteria, exam_group_id: val})}>
                                <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg focus:ring-indigo-500 shadow-none">
                                    <SelectValue placeholder={t("select_group")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {examGroups.map(g => <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Exam */}
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{t("exam")} <span className="text-red-500">*</span></Label>
                            <Select value={selectedCriteria.exam_id} onValueChange={(val) => setSelectedCriteria({...selectedCriteria, exam_id: val})}>
                                <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg focus:ring-indigo-500 shadow-none">
                                    <SelectValue placeholder={t("select_exam")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {exams.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Session */}
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{t("session")} <span className="text-red-500">*</span></Label>
                            <Select value={selectedCriteria.session_id} onValueChange={(val) => setSelectedCriteria({...selectedCriteria, session_id: val})}>
                                <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg focus:ring-indigo-500 shadow-none">
                                    <SelectValue placeholder={t("select_session")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {sessions.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.session}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Class */}
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{t("class")} <span className="text-red-500">*</span></Label>
                            <Select value={selectedCriteria.school_class_id} onValueChange={(val) => setSelectedCriteria({...selectedCriteria, school_class_id: val})}>
                                <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg focus:ring-indigo-500 shadow-none">
                                    <SelectValue placeholder={t("select_class")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Section */}
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{t("section")}</Label>
                            <Select value={selectedCriteria.section_id} onValueChange={(val) => setSelectedCriteria({...selectedCriteria, section_id: val})}>
                                <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg focus:ring-indigo-500 shadow-none">
                                    <SelectValue placeholder={t("all_sections")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("all_sections")}</SelectItem>
                                    {sections.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Student Filter */}
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{t("student")}</Label>
                            <Select value={selectedCriteria.student_id} onValueChange={(val) => setSelectedCriteria({...selectedCriteria, student_id: val})}>
                                <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg focus:ring-indigo-500 shadow-none">
                                    <SelectValue placeholder={t("all_students")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("all_students")}</SelectItem>
                                    {classStudents.map(st => (
                                        <SelectItem key={st.id} value={st.id.toString()}>
                                            {st.name} {st.last_name || ""} ({st.admission_no})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={handleSearch}
                            disabled={searching || loading}
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-8 h-10 text-[11px] font-bold uppercase transition-all rounded-full shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer"
                        >
                            {searching ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Search className="h-4 w-4" />}
                            {t("retrieve_results")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Exam Result List / Tabulation Sheet Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-amber-50/40 via-indigo-50/20 to-purple-50/20">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                            <FileBarChart className="h-4 w-4" />
                        </span>
                        <div>
                            <CardTitle className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                {t("tabulation_record")}
                                {filteredStudents.length > 0 && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                        {filteredStudents.length} {t("students")}
                                    </span>
                                )}
                            </CardTitle>
                            <p className="text-[11px] text-slate-500 mt-0.5">{filteredStudents.length} {t("students_found")}</p>
                        </div>
                    </div>

                    {/* Right Controls: Search Input + Export Toolbar */}
                    <div className="flex items-center gap-2.5 self-end md:self-auto flex-wrap">
                        <div className="relative w-48 sm:w-60">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <Input
                                placeholder={t("search_by_student_name")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8.5 h-8.5 text-xs rounded-lg border-slate-200 bg-white focus:bg-white focus:ring-indigo-500 transition-all shadow-2xs"
                            />
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                            <Button variant="outline" size="icon" onClick={handleCopy} title="Copy Tabulation Sheet" className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer shadow-2xs"><Copy className="h-3.5 w-3.5" /></Button>
                            <Button variant="outline" size="icon" onClick={handleExportCSV} title="Export CSV / Excel" className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all cursor-pointer shadow-2xs"><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                            <Button variant="outline" size="icon" onClick={downloadTabulationPDF} title="Download Tabulation PDF" className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer shadow-2xs"><Download className="h-3.5 w-3.5" /></Button>
                            <Button variant="outline" size="icon" onClick={() => window.print()} title="Print Tabulation Record" className="h-8 w-8 rounded-lg border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer shadow-2xs"><Printer className="h-3.5 w-3.5" /></Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 md:p-5 space-y-3">
                    <div className="rounded-lg border border-gray-100 overflow-hidden shadow-sm overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1100px]">
                            <TableHeader className="!bg-[#f3f4f6] text-[10px] uppercase font-bold text-gray-600">
                                <TableRow className="hover:bg-transparent border-gray-100">
                                    <TableHead className="py-4 px-3 min-w-[85px] text-center font-bold">
                                        <div className="flex items-center justify-center gap-1">
                                            <Trophy className="h-3.5 w-3.5 text-amber-500" />
                                            {t("position")}
                                        </div>
                                    </TableHead>
                                    <TableHead className="py-4 px-4 min-w-[110px] font-bold">{t("admission_no")}</TableHead>
                                    <TableHead className="py-4 px-5 min-w-[200px] font-bold">{t("student_name")}</TableHead>
                                    {activeSubjectsList.map(subject => {
                                        const max = getSubjectMaxMarks(subject.id);
                                        const pass = getSubjectPassMarks(subject.id);
                                        return (
                                            <TableHead key={subject.id} className="py-4 px-4 min-w-[130px] text-center border-l border-gray-100">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-indigo-700 font-bold tracking-tight">{subject.name}</span>
                                                    <span className="text-[9px] text-gray-400 font-mono font-medium">
                                                        {subject.code} (Max:{max}|Pass:{pass})
                                                    </span>
                                                </div>
                                            </TableHead>
                                        );
                                    })}
                                    <TableHead className="py-4 px-4 min-w-[120px] text-center border-l border-indigo-100 bg-indigo-50/30 font-bold text-indigo-900">{t("grand_total")}</TableHead>
                                    <TableHead className="py-4 px-4 min-w-[100px] text-center border-l border-gray-100 bg-indigo-50/30 font-bold text-indigo-900">{t("percent")}</TableHead>
                                    <TableHead className="py-4 px-4 min-w-[90px] text-center border-l border-gray-100 bg-indigo-50/30 font-bold text-indigo-900">{t("grade")}</TableHead>
                                    <TableHead className="py-4 px-4 min-w-[110px] text-center border-l border-gray-100 bg-indigo-50/30 font-bold text-indigo-900">{t("division")}</TableHead>
                                    <TableHead className="py-4 px-4 min-w-[90px] text-center border-l border-gray-100 bg-indigo-50/30 font-bold text-indigo-900">{t("status")}</TableHead>
                                    <TableHead className="py-4 px-4 min-w-[130px] text-right border-l border-gray-100 bg-indigo-50/30 font-bold text-indigo-900">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {searching ? (
                                    <TableSkeleton rows={6} cols={activeSubjectsList.length + 9} />
                                ) : students.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={activeSubjectsList.length + 9} className="h-32 text-center text-gray-400 text-sm italic">
                                            {t("please_select_criteria_and_search")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStudents.map((student) => {
                                        const stats = getStudentStats(student);
                                        const avatarSrc = student.avatar || student.photo;
                                        const rankInfo = studentRanks.get(student.id) || { rank: 1, positionText: "1st", badgeStyle: "bg-indigo-50 text-indigo-700 border-indigo-200" };

                                        return (
                                            <TableRow key={student.id} className="text-[12px] text-gray-600 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer border-b last:border-0 border-gray-100">
                                                {/* Position / Rank Badge Column */}
                                                <TableCell className="py-4 px-3 text-center">
                                                    <span className={cn(
                                                        "inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold border",
                                                        rankInfo.badgeStyle
                                                    )}>
                                                        {rankInfo.rank === 1 && <span>👑</span>}
                                                        {rankInfo.rank === 2 && <span>🥈</span>}
                                                        {rankInfo.rank === 3 && <span>🥉</span>}
                                                        {rankInfo.positionText}
                                                    </span>
                                                </TableCell>

                                                <TableCell className="py-4 px-4 font-mono font-bold text-gray-500 uppercase tracking-tighter bg-gray-50/20">{student.admission_no}</TableCell>
                                                
                                                {/* Student Name with Real Profile Picture / Avatar */}
                                                <TableCell className="py-4 px-5">
                                                    <div className="flex items-center gap-2.5">
                                                        <Avatar className="h-8 w-8 rounded-full border border-indigo-100 shadow-xs shrink-0">
                                                            {avatarSrc ? (
                                                                <AvatarImage src={getImageUrl(avatarSrc)} alt={student.name} className="object-cover" />
                                                            ) : null}
                                                            <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold text-xs">
                                                                {student.name?.[0]?.toUpperCase() || "S"}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col min-w-0">
                                                            <Link href={`/dashboard/student-information/student-details/${student.id}`} className="font-bold text-indigo-600 hover:underline truncate">
                                                                {student.name} {student.last_name || ""}
                                                            </Link>
                                                            {student.roll_no && (
                                                                <span className="text-[10px] text-gray-400 font-mono">Roll: {student.roll_no}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Subject Wise Columns with Scored Numbers & Grade */}
                                                {activeSubjectsList.map(subject => {
                                                    const mark = getStudentMark(student, subject.id);
                                                    const max = getSubjectMaxMarks(subject.id);
                                                    const pass = getSubjectPassMarks(subject.id);

                                                    if (!mark) {
                                                        return (
                                                            <TableCell key={subject.id} className="py-4 px-4 text-center border-l border-gray-100">
                                                                <span className="text-gray-300">---</span>
                                                            </TableCell>
                                                        );
                                                    }

                                                    if (mark.is_absent) {
                                                        return (
                                                            <TableCell key={subject.id} className="py-4 px-4 text-center border-l border-gray-100">
                                                                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-600 border border-rose-200">
                                                                    {t("absent")}
                                                                </span>
                                                            </TableCell>
                                                        );
                                                    }

                                                    const markVal = parseFloat(String(mark.marks || "0"));
                                                    const subjPercent = max > 0 ? (markVal / max) * 100 : 0;
                                                    const subjGrade = getGradeInfo(subjPercent);
                                                    const isFail = markVal < pass;

                                                    return (
                                                        <TableCell key={subject.id} className="py-4 px-4 text-center border-l border-gray-100">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className={cn(
                                                                    "font-mono font-bold text-xs",
                                                                    isFail ? "text-rose-600" : "text-gray-800"
                                                                )}>
                                                                    {markVal} <span className="text-[10px] text-gray-400 font-normal">/ {max}</span>
                                                                </span>
                                                                <span className={cn(
                                                                    "inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold font-mono border",
                                                                    subjGrade.color
                                                                )}>
                                                                    {subjGrade.grade}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                    );
                                                })}

                                                {/* Grand Total */}
                                                <TableCell className="py-4 px-4 text-center font-mono font-bold text-indigo-700 border-l border-indigo-100 bg-indigo-50/15">
                                                    <div>{stats.totalObtained.toFixed(2)}</div>
                                                    <div className="text-[10px] text-gray-400 font-normal">/ {stats.totalMax}</div>
                                                </TableCell>

                                                {/* Percentage */}
                                                <TableCell className="py-4 px-4 text-center font-bold border-l border-gray-100 bg-indigo-50/15">
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-mono text-indigo-600">{stats.percent}%</span>
                                                        <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                                                            <div
                                                                className={cn(
                                                                    "h-full rounded-full transition-all",
                                                                    parseFloat(stats.percent) >= 60 ? "bg-emerald-500" :
                                                                    parseFloat(stats.percent) >= 40 ? "bg-blue-500" : "bg-rose-500"
                                                                )}
                                                                style={{ width: `${Math.min(100, parseFloat(stats.percent))}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Overall Grade */}
                                                <TableCell className="py-4 px-4 text-center border-l border-gray-100 bg-indigo-50/15">
                                                    <span className={cn(
                                                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold border shadow-xs",
                                                        stats.gradeColor
                                                    )}>
                                                        {stats.grade}
                                                    </span>
                                                </TableCell>

                                                {/* Division */}
                                                <TableCell className="py-4 px-4 text-center border-l border-gray-100 bg-indigo-50/15">
                                                    <span className={cn(
                                                        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border shadow-xs",
                                                        stats.divisionColor
                                                    )}>
                                                        {stats.division}
                                                    </span>
                                                </TableCell>

                                                {/* Pass / Fail Status Badge */}
                                                <TableCell className="py-4 px-4 text-center border-l border-gray-100 bg-indigo-50/15">
                                                    {stats.hasFailedSubject ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                            <XCircle className="h-3 w-3" />
                                                            {t("failed")}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            {t("passed")}
                                                        </span>
                                                    )}
                                                </TableCell>

                                                {/* Action Column: View Marksheet & Download PDF Result */}
                                                <TableCell className="py-4 px-4 text-right border-l border-gray-100 bg-indigo-50/15">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleOpenStudentMarksheet(student)}
                                                            title="View Student Marksheet"
                                                            className="h-7 px-2.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100/70 border-indigo-200 rounded-md cursor-pointer"
                                                        >
                                                            <Eye className="h-3.5 w-3.5 mr-1" />
                                                            {t("marksheet")}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => downloadStudentMarksheetPDF(student)}
                                                            title="Download PDF Result"
                                                            className="h-7 px-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs cursor-pointer"
                                                        >
                                                            <Download className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Table Footer: Showing entries on the left */}
                    {filteredStudents.length > 0 && (
                        <div className="flex items-center justify-between pt-1">
                            <div className="text-xs text-slate-500 font-medium">
                                {t("showing")} <strong className="text-slate-800">{filteredStudents.length}</strong> {t("of")} {filteredStudents.length} {t("entries")}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Student Marksheet View & Print Dialog */}
            <Dialog open={isMarksheetOpen} onOpenChange={setIsMarksheetOpen}>
                <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-white border border-gray-100 rounded-2xl shadow-2xl gap-0">
                    <DialogHeader className="flex flex-row items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 space-y-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <GraduationCap className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <DialogTitle className="text-sm font-bold text-gray-800 tracking-tight leading-none">
                                {t("student_marksheet_report")}
                            </DialogTitle>
                            <DialogDescription className="text-[11px] text-gray-500 mt-1">
                                {selectedStudentForModal ? `${selectedStudentForModal.name} ${selectedStudentForModal.last_name || ""} (${selectedStudentForModal.admission_no})` : ""}
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    {selectedStudentForModal && (() => {
                        const stats = getStudentStats(selectedStudentForModal);
                        const modalAvatar = selectedStudentForModal.avatar || selectedStudentForModal.photo;
                        const modalLogo = settings?.print_logo || settings?.admin_logo || generalSetting?.print_logo;
                        const modalSubjects = getEffectiveSubjects(selectedStudentForModal);
                        const modalRankInfo = studentRanks.get(selectedStudentForModal.id);

                        return (
                            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                                {/* Header (Full image or 2-column layout) */}
                                {gpPrintSetting.header_image_url ? (
                                    <div className="w-full pb-3 border-b border-gray-100 flex justify-center">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={getImageUrl(gpPrintSetting.header_image_url)}
                                            alt="Header"
                                            className="max-h-24 object-contain rounded-md"
                                        />
                                    </div>
                                ) : (
                                    <div className="pb-4 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                                        <div className="flex items-center gap-3">
                                            {modalLogo ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img
                                                    src={getImageUrl(modalLogo)}
                                                    alt="School Logo"
                                                    className="h-12 w-auto max-w-[80px] object-contain rounded"
                                                />
                                            ) : null}
                                            <div>
                                                <h2 className="text-base font-black text-gray-900 tracking-tight leading-tight">
                                                    {settings?.school_name || generalSetting?.school_name || "iSchool International Academy"}
                                                </h2>
                                                <p className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider mt-0.5">
                                                    Academic Excellence
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right text-[11px] text-gray-500 space-y-0.5">
                                            <p className="font-medium text-gray-700">{settings?.address || generalSetting?.school_address || "25 Kings Street, CA"}</p>
                                            <p>Phone: <span className="font-semibold text-gray-700">{settings?.phone || generalSetting?.phone || "+8801851046320"}</span></p>
                                            <p>Email: <span className="font-semibold text-gray-700">{settings?.email || generalSetting?.email || "yourschool@gmail.com"}</span></p>
                                        </div>
                                    </div>
                                )}

                                <div className="text-center">
                                    <div className="inline-block px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-md shadow-xs uppercase tracking-wide">
                                        ACADEMIC REPORT CARD & MARKSHEET — {examDetails?.name || "Term Examination"}
                                    </div>
                                </div>

                                {/* Student Information Card with Picture */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                                    <Avatar className="h-14 w-14 rounded-full border-2 border-indigo-200 shadow-sm shrink-0">
                                        {modalAvatar ? (
                                            <AvatarImage src={getImageUrl(modalAvatar)} alt={selectedStudentForModal.name} className="object-cover" />
                                        ) : null}
                                        <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-base">
                                            {selectedStudentForModal.name?.[0]?.toUpperCase() || "S"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full text-xs">
                                        <div>
                                            <span className="text-gray-400 font-bold uppercase text-[10px] block">{t("student_name")}</span>
                                            <span className="font-bold text-gray-800">{selectedStudentForModal.name} {selectedStudentForModal.last_name || ""}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 font-bold uppercase text-[10px] block">{t("admission_no")}</span>
                                            <span className="font-bold text-gray-800">{selectedStudentForModal.admission_no}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 font-bold uppercase text-[10px] block">{t("roll_no")}</span>
                                            <span className="font-bold text-gray-800">{selectedStudentForModal.roll_no || "—"}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 font-bold uppercase text-[10px] block">{t("position")}</span>
                                            <span className="font-bold text-indigo-700">{modalRankInfo?.positionText || "—"} Position</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 font-bold uppercase text-[10px] block">{t("class")}</span>
                                            <span className="font-bold text-gray-800">{selectedStudentForModal.schoolClass?.name || selectedCriteria.school_class_id || "—"}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 font-bold uppercase text-[10px] block">{t("section")}</span>
                                            <span className="font-bold text-gray-800">{selectedStudentForModal.section?.name || selectedCriteria.section_id || "—"}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-gray-400 font-bold uppercase text-[10px] block">{t("session")}</span>
                                            <span className="font-bold text-gray-800">{sessions.find(s => s.id.toString() === selectedCriteria.session_id)?.session || "Current"}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Subject Marks Table */}
                                <div className="rounded-lg border border-gray-200 overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-gray-100 text-[10px] uppercase font-bold text-gray-700">
                                            <TableRow>
                                                <TableHead className="py-2.5 px-3">#</TableHead>
                                                <TableHead className="py-2.5 px-3">{t("subject")}</TableHead>
                                                <TableHead className="py-2.5 px-3 text-center">{t("code")}</TableHead>
                                                <TableHead className="py-2.5 px-3 text-center">{t("max_marks")}</TableHead>
                                                <TableHead className="py-2.5 px-3 text-center">{t("pass_marks")}</TableHead>
                                                <TableHead className="py-2.5 px-3 text-center">{t("obtained")}</TableHead>
                                                <TableHead className="py-2.5 px-3 text-center">{t("grade")}</TableHead>
                                                <TableHead className="py-2.5 px-3 text-center">{t("status")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {modalSubjects.map((subject, idx) => {
                                                const mark = getStudentMark(selectedStudentForModal, subject.id);
                                                const max = getSubjectMaxMarks(subject.id);
                                                const pass = getSubjectPassMarks(subject.id);

                                                if (!mark) {
                                                    return (
                                                        <TableRow key={subject.id} className="text-xs">
                                                            <TableCell className="py-2.5 px-3">{idx + 1}</TableCell>
                                                            <TableCell className="py-2.5 px-3 font-semibold">{subject.name}</TableCell>
                                                            <TableCell className="py-2.5 px-3 text-center">{subject.code}</TableCell>
                                                            <TableCell className="py-2.5 px-3 text-center">{max}</TableCell>
                                                            <TableCell className="py-2.5 px-3 text-center">{pass}</TableCell>
                                                            <TableCell className="py-2.5 px-3 text-center text-gray-300">---</TableCell>
                                                            <TableCell className="py-2.5 px-3 text-center text-gray-300">---</TableCell>
                                                            <TableCell className="py-2.5 px-3 text-center text-gray-300">---</TableCell>
                                                        </TableRow>
                                                    );
                                                }

                                                if (mark.is_absent) {
                                                    return (
                                                        <TableRow key={subject.id} className="text-xs bg-rose-50/30">
                                                            <TableCell className="py-2.5 px-3">{idx + 1}</TableCell>
                                                            <TableCell className="py-2.5 px-3 font-semibold text-rose-700">{subject.name}</TableCell>
                                                            <TableCell className="py-2.5 px-3 text-center">{subject.code}</TableCell>
                                                            <TableCell className="py-2.5 px-3 text-center">{max}</TableCell>
                                                            <TableCell className="py-2.5 px-3 text-center">{pass}</TableCell>
                                                            <TableCell className="py-2.5 px-3 text-center font-bold text-rose-600">{t("absent")}</TableCell>
                                                            <TableCell className="py-2.5 px-3 text-center text-rose-600 font-bold">F</TableCell>
                                                            <TableCell className="py-2.5 px-3 text-center text-rose-600 font-bold">{t("absent")}</TableCell>
                                                        </TableRow>
                                                    );
                                                }

                                                const val = parseFloat(String(mark.marks || "0"));
                                                const pct = max > 0 ? (val / max) * 100 : 0;
                                                const gr = getGradeInfo(pct);
                                                const isPass = val >= pass;

                                                return (
                                                    <TableRow key={subject.id} className="text-xs">
                                                        <TableCell className="py-2.5 px-3 font-mono">{idx + 1}</TableCell>
                                                        <TableCell className="py-2.5 px-3 font-semibold text-gray-800">{subject.name}</TableCell>
                                                        <TableCell className="py-2.5 px-3 text-center text-gray-500">{subject.code}</TableCell>
                                                        <TableCell className="py-2.5 px-3 text-center font-mono">{max}</TableCell>
                                                        <TableCell className="py-2.5 px-3 text-center font-mono">{pass}</TableCell>
                                                        <TableCell className={cn("py-2.5 px-3 text-center font-mono font-bold", isPass ? "text-gray-900" : "text-rose-600")}>
                                                            {val.toFixed(2)}
                                                        </TableCell>
                                                        <TableCell className="py-2.5 px-3 text-center">
                                                            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold border", gr.color)}>
                                                                {gr.grade}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="py-2.5 px-3 text-center">
                                                            {isPass ? (
                                                                <span className="text-emerald-700 font-bold text-[11px]">{t("passed")}</span>
                                                            ) : (
                                                                <span className="text-rose-700 font-bold text-[11px]">{t("failed")}</span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Performance Summary Stats */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
                                    <div className="text-center">
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">{t("grand_total")}</span>
                                        <span className="text-sm font-mono font-black text-indigo-950">{stats.totalObtained.toFixed(2)} / {stats.totalMax}</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">{t("percentage")}</span>
                                        <span className="text-sm font-mono font-black text-indigo-950">{stats.percent}%</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">{t("grade")}</span>
                                        <span className="text-sm font-mono font-black text-indigo-950">{stats.grade} (GP: {stats.point})</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">{t("division")}</span>
                                        <span className="text-sm font-bold text-indigo-950">{stats.division}</span>
                                    </div>
                                </div>

                                {gpPrintSetting.footer_content && (
                                    <div className="p-3 bg-emerald-50/60 rounded-lg text-center text-xs text-emerald-800 font-medium border border-emerald-100">
                                        {gpPrintSetting.footer_content}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* Dialog Footer */}
                    <div className="px-6 py-3.5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-end gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsMarksheetOpen(false)}
                            className="h-8 px-4 text-xs font-medium rounded-full border-gray-200 hover:bg-gray-100 cursor-pointer"
                        >
                            {t("close")}
                        </Button>
                        {selectedStudentForModal && (
                            <Button
                                type="button"
                                onClick={() => downloadStudentMarksheetPDF(selectedStudentForModal)}
                                className="h-8 px-5 text-xs font-bold rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white shadow-md border-none transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <Download className="h-3.5 w-3.5" />
                                {t("download_pdf")}
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
