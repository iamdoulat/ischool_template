"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
    Search,
    FileSpreadsheet,
    FileText,
    Printer,
    Copy,
    Filter,
    ListChecks,
    Calendar,
    BookOpen,
    Check
} from "lucide-react";
import { cn, formatDate, toLocaleNumber, translateClassName, translateSectionName, translateSubjectGroupName, translateSubjectName } from "@/lib/utils";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface OptionItem {
    id: string | number;
    name?: string;
    group_name?: string;
    school_class_id?: string | number;
}

interface RawTopic {
    id: string;
    className: string;
    section: string;
    subjectGroup: string;
    subject: string;
    lesson: string;
    topics: { id: string; name: string; completion_date?: string | null; is_completed?: boolean }[];
}

interface TopicStatus {
    id: string;
    name: string;
    completionDate?: string | null;
    isCompleted: boolean;
}

interface LessonStatus {
    id: string;
    className: string;
    section: string;
    subjectGroup: string;
    subject: string;
    lesson: string;
    topics: TopicStatus[];
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-4 p-4">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="p-4 rounded-2xl border border-gray-100 bg-white space-y-3 animate-pulse">
                    <div className="h-4 bg-muted/60 rounded w-1/4" />
                    <div className="h-8 bg-muted/40 rounded w-full" />
                </div>
            ))}
        </div>
    );
}

export default function ManageSyllabusStatusPage() {
    const { t, language } = useTranslation();
    const shortCode = language?.short_code || "en";
    const tt = useTranslateToast();

    const [classes, setClasses] = useState<OptionItem[]>([]);
    const [sections, setSections] = useState<OptionItem[]>([]);
    const [subjectGroups, setSubjectGroups] = useState<OptionItem[]>([]);
    const [subjects, setSubjects] = useState<OptionItem[]>([]);
    const [syllabusData, setSyllabusData] = useState<LessonStatus[]>([]);
    const [loading, setLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Form State
    const [criteria, setCriteria] = useState({
        class_id: "",
        class_name: "",
        section: "",
        subject_group: "",
        subject: ""
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const extractData = (res: { data?: unknown }): OptionItem[] => {
        const data = res.data as { data?: unknown } | unknown[] | undefined;
        if (Array.isArray(data)) return data as OptionItem[];
        if (data && Array.isArray((data as { data?: unknown }).data)) {
            return (data as { data: OptionItem[] }).data;
        }
        return [];
    };

    const fetchInitialData = async () => {
        try {
            const [classesRes, subjectsRes] = await Promise.all([
                api.get('/academics/classes?no_paginate=true').catch(() => ({ data: [] })),
                api.get('/academics/subjects?no_paginate=true').catch(() => ({ data: [] }))
            ]);

            setClasses(extractData(classesRes));
            setSubjects(extractData(subjectsRes));
        } catch (error) {
            console.error("Failed to load initial dropdowns", error);
        }
    };

    // Fetch sections filtered by selected class
    const fetchSectionsByClass = async (classId: string) => {
        if (!classId) { setSections([]); return; }
        try {
            const res = await api.get('/academics/sections?with_class=true&no_paginate=true');
            const all: OptionItem[] = res.data?.data || res.data || [];
            const filtered = all.filter((s) => String(s.school_class_id) === String(classId));
            setSections(filtered);
        } catch {
            setSections([]);
        }
    };

    // Fetch subject groups filtered by class and section
    const fetchFilteredSubjectGroups = async (classId: string, sectionName: string) => {
        const params: Record<string, string> = { no_paginate: 'true' };
        if (classId) params.school_class_id = classId;
        const cls = classes.find((c) => String(c.id) === String(classId));
        if (cls && sectionName) {
            const sec = sections.find((s) => s.name === sectionName && String(s.school_class_id) === String(classId));
            if (sec) params.section_id = String(sec.id);
        }
        try {
            const res = await api.get('/academics/subject-groups', { params });
            setSubjectGroups(extractData(res));
        } catch {
            setSubjectGroups([]);
        }
    };

    const handleSearch = async () => {
        if (!criteria.class_name || !criteria.section || !criteria.subject_group || !criteria.subject) {
            tt.error("please_fill_required_fields");
            return;
        }

        setLoading(true);
        try {
            const response = await api.get('/lesson-plan/topics');
            const allTopics: RawTopic[] = response.data || [];

            // Filter based on criteria
            const filtered = allTopics.filter(tItem =>
                tItem.className === criteria.class_name &&
                tItem.section === criteria.section &&
                tItem.subjectGroup === criteria.subject_group &&
                tItem.subject === criteria.subject
            ).map(tItem => ({
                id: tItem.id,
                className: tItem.className,
                section: tItem.section,
                subjectGroup: tItem.subjectGroup,
                subject: tItem.subject,
                lesson: tItem.lesson,
                topics: (tItem.topics || []).map((topic) => ({
                    id: topic.id,
                    name: topic.name,
                    completionDate: topic.completion_date,
                    isCompleted: !!topic.is_completed
                }))
            }));

            setSyllabusData(filtered);
            if (filtered.length === 0) {
                tt.info("no_syllabus_data_found_for_selected_criteria");
            }
        } catch {
            tt.error("failed_to_fetch_syllabus_data");
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (topicId: string, currentStatus: boolean) => {
        setUpdatingId(topicId);
        try {
            const newStatus = !currentStatus;
            const completionDate = newStatus ? new Date().toISOString().split('T')[0] : null;

            await api.put(`/lesson-plan/topics/${topicId}/status`, {
                is_completed: newStatus,
                completion_date: completionDate
            });

            // Update local state
            setSyllabusData(prevData =>
                prevData.map(lesson => ({
                    ...lesson,
                    topics: lesson.topics.map(topic =>
                        topic.id === topicId
                            ? { ...topic, isCompleted: newStatus, completionDate: completionDate }
                            : topic
                    )
                }))
            );

            tt.success(newStatus ? "topic_marked_as_completed" : "topic_marked_as_incomplete");
        } catch {
            tt.error("failed_to_update_status");
        } finally {
            setUpdatingId(null);
        }
    };

    const totalTopics = syllabusData.reduce((acc, l) => acc + (l.topics?.length || 0), 0);
    const completedTopics = syllabusData.reduce((acc, l) => acc + (l.topics?.filter(tItem => tItem.isCompleted).length || 0), 0);
    const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    const handleAction = (action: string) => {
        if (action === 'print') {
            window.print();
        } else if (action === 'copy') {
            navigator.clipboard.writeText(JSON.stringify(syllabusData, null, 2));
            tt.success("copied_to_clipboard");
        } else if (action === 'excel') {
            const rows: Record<string, string | number>[] = [];
            syllabusData.forEach((l) => {
                (l.topics || []).forEach((topic) => {
                    rows.push({
                        [t("class")]: criteria.class_name,
                        [t("section")]: criteria.section,
                        [t("subject")]: criteria.subject,
                        [t("lesson")]: l.lesson,
                        [t("topic")]: topic.name,
                        [t("status")]: topic.isCompleted ? t("completed") : t("incomplete"),
                        [t("completion_date") || "Completion Date"]: topic.completionDate ? formatDate(topic.completionDate) : "—"
                    });
                });
            });
            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Syllabus Status");
            XLSX.writeFile(wb, "syllabus_status.xlsx");
            tt.success("exported_to_excel");
        } else if (action === 'pdf') {
            const doc = new jsPDF();
            doc.text(`${t("manage_syllabus_status")}: ${criteria.subject} (${criteria.class_name} - ${criteria.section})`, 14, 15);
            const rows: (string | number)[][] = [];
            syllabusData.forEach((l, lIdx) => {
                (l.topics || []).forEach((topic) => {
                    rows.push([`${lIdx + 1}. ${l.lesson}`, topic.name, topic.isCompleted ? t("completed") : t("incomplete"), topic.completionDate ? formatDate(topic.completionDate) : "—"]);
                });
            });
            autoTable(doc, {
                head: [[t("lesson"), t("topic"), t("status"), t("completion_date") || "Completion Date"]],
                body: rows,
                startY: 20
            });
            doc.save("syllabus_status.pdf");
            tt.success("exported_to_pdf");
        }
    };



    return (
        <div className="space-y-6 p-4 sm:p-5 font-sans bg-gray-50/10 min-h-screen">
            {/* Criteria Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                            {t("select_criteria") || "Select Criteria"}
                        </CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {t("choose_class_section_subject_group_desc") || "Choose class, section, subject group & subject"}
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("class")} <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={criteria.class_name}
                                onValueChange={(val) => {
                                    const cls = classes.find((c) => c.name === val);
                                    const classId = cls?.id?.toString() ?? '';
                                    setCriteria({ ...criteria, class_name: val, class_id: classId, section: '', subject_group: '', subject: '' });
                                    fetchSectionsByClass(classId);
                                    fetchFilteredSubjectGroups(classId, '');
                                }}
                            >
                                <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                    <SelectValue placeholder={t("select_class") || "Select Class"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.name || ""}>
                                            {translateClassName(c.name, shortCode)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("section")} <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={criteria.section}
                                onValueChange={(val) => {
                                    setCriteria({ ...criteria, section: val, subject_group: '', subject: '' });
                                    fetchFilteredSubjectGroups(criteria.class_id, val);
                                }}
                                disabled={!criteria.class_name}
                            >
                                <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                    <SelectValue placeholder={t("select_section") || "Select Section"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map(s => (
                                        <SelectItem key={s.id} value={s.name || ""}>
                                            {translateSectionName(s.name, shortCode)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("subject_group")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={criteria.subject_group} onValueChange={(val) => setCriteria({...criteria, subject_group: val})} disabled={!criteria.class_name}>
                                <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                    <SelectValue placeholder={t("select_subject_group") || "Select Subject Group"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjectGroups.map(g => (
                                        <SelectItem key={g.id} value={g.name || g.group_name || ""}>
                                            {translateSubjectGroupName(g.name || g.group_name, shortCode)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("subject")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={criteria.subject} onValueChange={(val) => setCriteria({...criteria, subject: val})}>
                                <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                    <SelectValue placeholder={t("select_subject") || "Select Subject"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map(s => (
                                        <SelectItem key={s.id} value={s.name || ""}>
                                            {translateSubjectName(s.name, shortCode)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end mt-4">
                        <Button
                            onClick={handleSearch}
                            disabled={loading}
                            className="btn-gradient text-white gap-2 h-10 px-8 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full cursor-pointer"
                        >
                            {loading ? (t("searching") || "Searching...") : <><Search className="h-4 w-4" /> {t("search")}</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {(loading || syllabusData.length > 0) && (
                <>
                    {/* Summary Ribbon */}
                    {syllabusData.length > 0 && (
                        <div className="p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/70 via-white to-amber-50/50 dark:from-indigo-950/40 dark:via-gray-900 dark:to-gray-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] flex items-center justify-center text-white shadow-sm">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400 font-bold uppercase">
                                            {t("syllabus_status_for") || "Syllabus Status For:"}
                                        </span>
                                        <span className="font-black text-sm text-indigo-700 dark:text-indigo-300">
                                            {translateSubjectName(criteria.subject, shortCode)}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 font-medium">
                                        {translateClassName(criteria.class_name, shortCode)} • {translateSectionName(criteria.section, shortCode)} • {translateSubjectGroupName(criteria.subject_group, shortCode)}
                                    </p>
                                </div>
                            </div>

                            {/* Live Progress Stats */}
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-[10px] uppercase font-bold text-gray-400">
                                        {t("total_completion") || "Total Completion"}
                                    </div>
                                    <div className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                                        {toLocaleNumber(progressPercent, shortCode)}%
                                    </div>
                                </div>
                                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] rounded-full transition-all duration-500"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold px-2.5 py-1">
                                    {t("x_of_y_topics", {
                                        completed: toLocaleNumber(completedTopics, shortCode),
                                        total: toLocaleNumber(totalTopics, shortCode)
                                    })}
                                </Badge>
                            </div>
                        </div>
                    )}

                    {/* Syllabus Table Section */}
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    <ListChecks className="h-5 w-5" />
                                </span>
                                <div>
                                    <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                        {t("manage_syllabus_status") || "Manage Syllabus Status"}
                                    </CardTitle>
                                    <p className="text-[11px] text-gray-500 mt-1">
                                        {t("x_lessons_y_topics", {
                                            lessons: toLocaleNumber(syllabusData.length, shortCode),
                                            topics: toLocaleNumber(totalTopics, shortCode)
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button onClick={() => handleAction('copy')} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title={t("copy") || "Copy"}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button onClick={() => handleAction('excel')} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title={t("export_excel") || "Export Excel"}>
                                    <FileSpreadsheet className="h-4 w-4" />
                                </Button>
                                <Button onClick={() => handleAction('pdf')} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title={t("export_pdf") || "Export PDF"}>
                                    <FileText className="h-4 w-4" />
                                </Button>
                                <Button onClick={() => handleAction('print')} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title={t("print") || "Print"}>
                                    <Printer className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            {loading ? (
                                <TableSkeleton rows={4} />
                            ) : syllabusData.length === 0 ? (
                                <div className="px-4 py-16 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                                    {t("no_syllabus_data_found") || "No syllabus data found"}
                                </div>
                            ) : (
                                <div className="p-5 space-y-6">
                                    {syllabusData.map((lesson, idx) => {
                                        const isFirst = idx === 0;
                                        const isLast = idx === syllabusData.length - 1;
                                        const lessonCompletedTopics = lesson.topics.filter(tItem => tItem.isCompleted).length;
                                        const lessonTotalTopics = lesson.topics.length;
                                        const isLessonDone = lessonTotalTopics > 0 && lessonCompletedTopics === lessonTotalTopics;

                                        return (
                                            <div
                                                key={lesson.id}
                                                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/90 shadow-2xs overflow-hidden"
                                            >
                                                {/* Lesson Header Banner */}
                                                <div className="p-4 bg-gray-50/80 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "h-7 w-7 rounded-xl flex items-center justify-center font-black text-xs shadow-2xs shrink-0",
                                                            isLessonDone
                                                                ? "bg-emerald-500 text-white"
                                                                : isFirst
                                                                ? "bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white"
                                                                : "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                                                        )}>
                                                            {isLessonDone ? <Check className="h-4 w-4 stroke-[3]" /> : toLocaleNumber(idx + 1, shortCode)}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                                                    {t("step_x", { step: toLocaleNumber(idx + 1, shortCode) })}
                                                                </span>
                                                                {isFirst && (
                                                                    <span className="text-[8.5px] bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 px-1.5 py-0.5 rounded font-bold border border-orange-200 dark:border-orange-800">
                                                                        {t("initial") || "Initial"}
                                                                    </span>
                                                                )}
                                                                {isLast && syllabusData.length > 1 && (
                                                                    <span className="text-[8.5px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold border border-emerald-200 dark:border-emerald-800">
                                                                        {t("final_step") || "Final Step"}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mt-0.5">
                                                                {lesson.lesson}
                                                            </h3>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 self-end sm:self-center">
                                                        <Badge variant="outline" className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold border-gray-200">
                                                            {t("x_of_y_completed", {
                                                                completed: toLocaleNumber(lessonCompletedTopics, shortCode),
                                                                total: toLocaleNumber(lessonTotalTopics, shortCode)
                                                            })}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                {/* Topics List Table */}
                                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                                    {lesson.topics.length === 0 ? (
                                                        <div className="p-4 text-center text-xs text-gray-400 italic">
                                                            {t("no_topics_registered_under_this_lesson") || "No topics registered under this lesson"}
                                                        </div>
                                                    ) : (
                                                        lesson.topics.map((topic, tIdx) => (
                                                            <div
                                                                key={topic.id}
                                                                className={cn(
                                                                    "p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors",
                                                                    topic.isCompleted
                                                                        ? "bg-emerald-50/20 hover:bg-emerald-50/40 dark:bg-emerald-950/10"
                                                                        : "hover:bg-gray-50/50 dark:hover:bg-gray-900/40"
                                                                )}
                                                            >
                                                                {/* Left: Topic Name with Branch line */}
                                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                    <span className="text-gray-300 font-bold hidden sm:inline">└──</span>
                                                                    <div className={cn(
                                                                        "h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0",
                                                                        topic.isCompleted
                                                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                                                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                                                    )}>
                                                                        {toLocaleNumber(idx + 1, shortCode)}.{toLocaleNumber(tIdx + 1, shortCode)}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                                                                            {topic.name}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Middle: Completion Date & Status Badge */}
                                                                <div className="flex items-center gap-4 shrink-0 pl-9 sm:pl-0">
                                                                    {/* Completion Date */}
                                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                                        <span className={topic.completionDate ? "font-semibold text-gray-700 dark:text-gray-300" : "italic text-gray-400"}>
                                                                            {topic.completionDate ? toLocaleNumber(formatDate(topic.completionDate), shortCode) : (t("not_completed") || "Not completed")}
                                                                        </span>
                                                                    </div>

                                                                    {/* Status Badge */}
                                                                    <span
                                                                        className={cn(
                                                                            "text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs",
                                                                            topic.isCompleted
                                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                                                                : "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                                                                        )}
                                                                    >
                                                                        {topic.isCompleted ? (t("completed") || "Completed") : (t("incomplete") || "Incomplete")}
                                                                    </span>

                                                                    {/* Action Toggle Switch */}
                                                                    <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
                                                                        <Switch
                                                                            checked={topic.isCompleted}
                                                                            disabled={updatingId === topic.id}
                                                                            onCheckedChange={() => toggleStatus(topic.id, topic.isCompleted)}
                                                                            className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-gray-200"
                                                                            title={topic.isCompleted ? (t("mark_incomplete") || "Mark Incomplete") : (t("mark_completed") || "Mark Completed")}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            {!loading && syllabusData.length === 0 && (
                <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-16 flex flex-col items-center justify-center text-center">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl mb-4 text-indigo-500">
                        <Search className="h-8 w-8" />
                    </div>
                    <h3 className="text-gray-600 dark:text-gray-300 text-sm font-bold">
                        {t("select_criteria_to_view_syllabus_status") || "Select criteria to view syllabus status"}
                    </h3>
                    <p className="text-gray-400 text-xs mt-1">
                        {t("class_section_subject_group_required") || "Class, Section, Subject Group, and Subject required"}
                    </p>
                </div>
            )}
        </div>
    );
}
