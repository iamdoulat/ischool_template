"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Pencil,
    Trash2,
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    Plus,
    X,
    BookText,
    BookOpen,
    Layers,
    GraduationCap,
    Route
} from "lucide-react";
import { toLocaleNumber, translateClassName, translateSectionName, translateSubjectGroupName, translateSubjectName } from "@/lib/utils";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

interface OptionItem {
    id: string | number;
    name?: string;
    group_name?: string;
    school_class_id?: string | number;
}

interface TopicEntry {
    id: string; // Used for identifying the group (first topic ID)
    className: string;
    section: string;
    subjectGroup: string;
    subject: string;
    lesson: string;
    topics: { id: string; name: string; is_completed: boolean; completion_date: string | null }[];
    topic_ids: string[];
}

export default function TopicPage() {
    const { t, language } = useTranslation();
    const shortCode = language?.short_code || "en";
    const tt = useTranslateToast();

    const [searchTerm, setSearchTerm] = useState("");
    const [topicInputs, setTopicInputs] = useState([{ id: Date.now(), value: "" }]);
    const [topicsList, setTopicsList] = useState<TopicEntry[]>([]);
    const [classes, setClasses] = useState<OptionItem[]>([]);
    const [sections, setSections] = useState<OptionItem[]>([]);
    const [subjectGroups, setSubjectGroups] = useState<OptionItem[]>([]);
    const [subjects, setSubjects] = useState<OptionItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Pagination & Export
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    // Lesson data for dropdown
    const [lessonsList, setLessonsList] = useState<{ className: string; section: string; subjectGroup: string; subject: string; lessons: string[] }[]>([]);

    // Form State
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        class_name: "",
        section: "",
        subject_group: "",
        subject: "",
        lesson: ""
    });

    // Filtered lesson names based on selected class/section/subject_group/subject
    const lessonNames = useMemo(() => {
        if (!lessonsList.length) return [];
        const hasFilter = formData.class_name || formData.section || formData.subject_group || formData.subject;
        if (!hasFilter) return Array.from(new Set(lessonsList.flatMap(g => g.lessons))).sort();
        return lessonsList
            .filter(g =>
                (!formData.class_name || g.className === formData.class_name) &&
                (!formData.section || g.section === formData.section) &&
                (!formData.subject_group || g.subjectGroup === formData.subject_group) &&
                (!formData.subject || g.subject === formData.subject)
            )
            .flatMap(g => g.lessons)
            .filter((v, i, a) => a.indexOf(v) === i)
            .sort();
    }, [lessonsList, formData.class_name, formData.section, formData.subject_group, formData.subject]);

    // Dialog State
    const [deleteId, setDeleteId] = useState<string | null>(null);

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
            const [classesRes, groupsRes, subjectsRes, lessonsRes] = await Promise.all([
                api.get('/academics/classes?no_paginate=true').catch(() => ({ data: [] })),
                api.get('/academics/subject-groups?no_paginate=true').catch(() => ({ data: [] })),
                api.get('/academics/subjects?no_paginate=true').catch(() => ({ data: [] })),
                api.get('/lesson-plan/lessons').catch(() => ({ data: [] }))
            ]);

            setClasses(extractData(classesRes));
            setSubjectGroups(extractData(groupsRes));
            setSubjects(extractData(subjectsRes));

            const lessonsData = lessonsRes.data?.data || lessonsRes.data || [];
            setLessonsList(Array.isArray(lessonsData) ? lessonsData : []);
        } catch (error) {
            console.error("Failed to load initial dropdowns", error);
        }
        fetchTopics();
    };

    // Fetch sections filtered by selected class ID
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

    const fetchTopics = async () => {
        setLoading(true);
        try {
            const response = await api.get('/lesson-plan/topics');
            setTopicsList(Array.isArray(response.data) ? response.data : []);
        } catch {
            tt.error("failed_to_fetch_topics");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.class_name || !formData.section || !formData.subject_group || !formData.subject || !formData.lesson) {
            tt.error("please_fill_required_fields");
            return;
        }

        const validTopics = topicInputs.map(tItem => tItem.value).filter(v => v.trim() !== "");
        if (validTopics.length === 0) {
            tt.error("please_enter_at_least_one_topic");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                topics: validTopics,
                topic_ids: editMode && selectedId ? topicsList.find(tItem => tItem.id === selectedId)?.topic_ids : []
            };

            if (editMode && selectedId) {
                await api.put(`/lesson-plan/topics/${selectedId}`, payload);
                tt.success("topics_updated_successfully");
            } else {
                await api.post('/lesson-plan/topics', payload);
                tt.success("topics_created_successfully");
            }

            resetForm();
            fetchTopics();
        } catch {
            tt.error("failed_to_save_topics");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (entry: TopicEntry) => {
        const cls = classes.find((c) => c.name === entry.className);
        if (cls) fetchSectionsByClass(cls.id.toString());
        setFormData({
            class_name: entry.className,
            section: entry.section,
            subject_group: entry.subjectGroup,
            subject: entry.subject,
            lesson: entry.lesson
        });
        setTopicInputs(entry.topics.length > 0 ? entry.topics.map((tItem, i) => ({ id: Date.now() + i, value: tItem.name })) : [{ id: Date.now(), value: "" }]);
        setSelectedId(entry.id);
        setEditMode(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/lesson-plan/topics/${deleteId}`);
            tt.success("topics_deleted_successfully");
            fetchTopics();
        } catch {
            tt.error("failed_to_delete_topics");
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setFormData({
            class_name: "",
            section: "",
            subject_group: "",
            subject: "",
            lesson: ""
        });
        setTopicInputs([{ id: Date.now(), value: "" }]);
        setEditMode(false);
        setSelectedId(null);
    };

    const addMoreTopic = () => {
        setTopicInputs([...topicInputs, { id: Date.now(), value: "" }]);
    };

    const updateTopicInput = (id: number, value: string) => {
        setTopicInputs(topicInputs.map(tItem => tItem.id === id ? { ...tItem, value } : tItem));
    };

    const removeTopicInput = (id: number) => {
        const newInputs = topicInputs.filter(tItem => tItem.id !== id);
        if (newInputs.length === 0) {
            setTopicInputs([{ id: Date.now(), value: "" }]);
        } else {
            setTopicInputs(newInputs);
        }
    };



    // Filter & Pagination logic
    const filteredTopics = topicsList.filter(entry =>
        (entry.className || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.section || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.subjectGroup || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.subject || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.lesson || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.topics || []).some(tItem => tItem.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalPages = Math.ceil(filteredTopics.length / itemsPerPage) || 1;
    const paginatedTopics = filteredTopics.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalTopicsCount = filteredTopics.reduce((acc, curr) => acc + (curr.topics?.length || 0), 0);

    const handleAction = (action: string) => {
        if (action === 'print') {
            window.print();
        } else if (action === 'copy') {
            navigator.clipboard.writeText(JSON.stringify(filteredTopics, null, 2));
            tt.success("copied_to_clipboard");
        } else if (action === 'excel') {
            const rows: Record<string, string | number>[] = [];
            filteredTopics.forEach((l) => {
                (l.topics || []).forEach((tItem) => {
                    rows.push({
                        [t("class")]: l.className,
                        [t("section")]: l.section,
                        [t("subject_group")]: l.subjectGroup,
                        [t("subject")]: l.subject,
                        [t("lesson")]: l.lesson,
                        [t("topic")]: tItem.name
                    });
                });
            });
            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Topics");
            XLSX.writeFile(wb, "topics.xlsx");
            tt.success("exported_to_excel");
        } else if (action === 'pdf') {
            const doc = new jsPDF();
            doc.text(t("topic_list") || "Topic List", 14, 15);
            const rows: (string | number)[][] = [];
            filteredTopics.forEach((l) => {
                (l.topics || []).forEach((tItem) => {
                    rows.push([l.className, l.section, l.subject, l.lesson, tItem.name]);
                });
            });
            autoTable(doc, {
                head: [[t("class"), t("section"), t("subject"), t("lesson"), t("topic")]],
                body: rows,
                startY: 20
            });
            doc.save("topics.pdf");
            tt.success("exported_to_pdf");
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-3 sm:p-5 font-sans bg-gray-50/10 min-h-screen">
            {/* Left Column: Add Topic Form */}
            <div className="w-full lg:w-1/4">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <BookText className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                {editMode ? (t("edit_topic") || "Edit Topic") : (t("add_topic") || "Add Topic")}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {t("configure_syllabus_topics") || "Configure syllabus topics"}
                            </p>
                        </div>
                    </CardHeader>

                    <CardContent className="px-5 pb-5">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    {t("class")} <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.class_name}
                                    onValueChange={(val) => {
                                        const cls = classes.find((c) => c.name === val);
                                        setFormData({ ...formData, class_name: val, section: '', lesson: '' });
                                        fetchSectionsByClass(cls?.id?.toString() ?? '');
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
                                    value={formData.section}
                                    onValueChange={(val) => setFormData({ ...formData, section: val, lesson: '' })}
                                    disabled={!formData.class_name}
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
                                <Select value={formData.subject_group} onValueChange={(val) => setFormData({...formData, subject_group: val, lesson: ''})}>
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
                                <Select value={formData.subject} onValueChange={(val) => setFormData({...formData, subject: val, lesson: ''})}>
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

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    {t("lesson")} <span className="text-red-500">*</span>
                                </Label>
                                <Select value={formData.lesson} onValueChange={(val) => setFormData({...formData, lesson: val})}>
                                    <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                        <SelectValue placeholder={t("select_lesson") || "Select Lesson"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {lessonNames.length > 0 ? lessonNames.map((name) => (
                                            <SelectItem key={name} value={name}>
                                                {toLocaleNumber(name, shortCode)}
                                            </SelectItem>
                                        )) : (
                                            <div className="p-2 text-xs text-gray-400 text-center">
                                                {t("no_lessons_found") || "No lessons found"}
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        {t("topic_names") || "Topic Names"} <span className="text-red-500">*</span>
                                    </Label>
                                    <Button
                                        type="button"
                                        onClick={addMoreTopic}
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-3 text-[10.5px] font-bold uppercase btn-gradient flex items-center gap-1 rounded-full shadow-xs cursor-pointer"
                                    >
                                        <Plus className="h-3 w-3" /> {t("add_topic") || "Add Topic"}
                                    </Button>
                                </div>

                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                    {topicInputs.map((input, idx) => (
                                        <div key={input.id} className="flex gap-1.5 items-center group">
                                            <span className="text-[10px] font-bold text-gray-400 w-4 text-center">
                                                #{toLocaleNumber(idx + 1, shortCode)}
                                            </span>
                                            <Input
                                                value={input.value}
                                                placeholder={`${t("topic")} ${toLocaleNumber(idx + 1, shortCode)}`}
                                                onChange={(e) => updateTopicInput(input.id, e.target.value)}
                                                className="h-9 border-gray-200 bg-gray-50/30 text-xs shadow-none focus-visible:ring-indigo-500 rounded-lg flex-1"
                                            />
                                            {topicInputs.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeTopicInput(input.id)}
                                                    className="h-7 w-7 rounded-md hover:bg-rose-50 text-gray-400 hover:text-rose-600 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end pt-3 gap-2 border-t border-gray-100 dark:border-gray-800">
                                {editMode && (
                                    <Button onClick={resetForm} variant="outline" className="h-9 text-xs rounded-full px-4 border-gray-200 font-bold uppercase cursor-pointer">
                                        {t("cancel")}
                                    </Button>
                                )}
                                <Button
                                    onClick={handleSave}
                                    disabled={submitting}
                                    className="btn-gradient text-white px-8 h-9 text-[11px] font-bold uppercase shadow-lg shadow-orange-200/50 transition-all rounded-full cursor-pointer"
                                >
                                    {submitting ? (t("saving") || "Saving...") : editMode ? (t("update") || "Update") : (t("save_topic") || "Save Topic")}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Topic List */}
            <div className="w-full lg:w-3/4">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <BookText className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                    {t("topic_list") || "Topic List"}
                                </CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    {t("x_syllabus_groups_recorded", { count: toLocaleNumber(filteredTopics.length, shortCode) })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Select value={String(itemsPerPage)} onValueChange={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}>
                                <SelectTrigger className="h-8 w-16 text-xs border-gray-200 rounded-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">{toLocaleNumber(10, shortCode)}</SelectItem>
                                    <SelectItem value="25">{toLocaleNumber(25, shortCode)}</SelectItem>
                                    <SelectItem value="50">{toLocaleNumber(50, shortCode)}</SelectItem>
                                    <SelectItem value="100">{toLocaleNumber(100, shortCode)}</SelectItem>
                                </SelectContent>
                            </Select>
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
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title={t("columns") || "Columns"}>
                                    <Columns className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="px-5 pb-5 space-y-4">
                        {/* Search Bar */}
                        <div className="flex justify-between items-center gap-4">
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder={t("search_by_class_subject_lesson_topic") || "Search by class, subject, lesson, topic..."}
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="pl-9 h-9 text-xs border-gray-200 bg-gray-50/30 rounded-lg focus-visible:ring-indigo-500 shadow-none"
                                />
                            </div>
                            {filteredTopics.length > 0 && (
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10.5px] font-bold py-1 px-2.5">
                                    <Layers className="h-3 w-3 mr-1" />
                                    {t("x_total_topics", { count: toLocaleNumber(totalTopicsCount, shortCode) })}
                                </Badge>
                            )}
                        </div>

                        {/* Enhanced Table */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs">
                            <Table>
                                <TableHeader className="bg-gray-50/90 dark:bg-gray-800/80 text-[11px] uppercase font-bold text-gray-600 dark:text-gray-300">
                                    <TableRow className="hover:bg-transparent border-gray-200 dark:border-gray-700">
                                        <TableHead className="py-3 px-4 w-[110px]">{t("class")}</TableHead>
                                        <TableHead className="py-3 px-4 w-[90px]">{t("section")}</TableHead>
                                        <TableHead className="py-3 px-4 w-[140px]">{t("subject_group")}</TableHead>
                                        <TableHead className="py-3 px-4 w-[140px]">{t("subject")}</TableHead>
                                        <TableHead className="py-3 px-4 w-[180px]">{t("lesson")}</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[240px]">
                                            <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
                                                <Route className="h-3.5 w-3.5" />
                                                <span>{t("hierarchical_topics") || "Hierarchical Topics"}</span>
                                            </div>
                                        </TableHead>
                                        <TableHead className="py-3 px-4 text-right w-[90px]">{t("action")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={7} />
                                    ) : filteredTopics.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="px-4 py-16 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                                                {t("no_topics_found") || "No topics found"}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedTopics.map((entry) => (
                                            <TableRow
                                                key={entry.id}
                                                className="text-[12px] border-b last:border-0 border-gray-100 dark:border-gray-800 hover:bg-indigo-50/25 transition-colors group"
                                            >
                                                {/* Class */}
                                                <TableCell className="py-4 px-4 align-top">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-100 dark:border-indigo-800 shadow-2xs">
                                                        <GraduationCap className="h-3.5 w-3.5 text-indigo-500" />
                                                        {translateClassName(entry.className, shortCode)}
                                                    </span>
                                                </TableCell>

                                                {/* Section */}
                                                <TableCell className="py-4 px-4 align-top">
                                                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-[11px] border border-gray-200 dark:border-gray-700">
                                                        {translateSectionName(entry.section, shortCode)}
                                                    </span>
                                                </TableCell>

                                                {/* Subject Group */}
                                                <TableCell className="py-4 px-4 align-top font-medium text-gray-600 dark:text-gray-400">
                                                    <div className="flex items-center gap-1.5">
                                                        <Layers className="h-3.5 w-3.5 text-gray-400" />
                                                        <span>{translateSubjectGroupName(entry.subjectGroup, shortCode)}</span>
                                                    </div>
                                                </TableCell>

                                                {/* Subject */}
                                                <TableCell className="py-4 px-4 align-top font-bold text-gray-800 dark:text-gray-200">
                                                    <div className="flex items-center gap-1.5">
                                                        <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                                                        <span>{translateSubjectName(entry.subject, shortCode)}</span>
                                                    </div>
                                                </TableCell>

                                                {/* Lesson */}
                                                <TableCell className="py-4 px-4 align-top">
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-200 dark:border-amber-800">
                                                        <Route className="h-3.5 w-3.5 text-amber-500" />
                                                        <span>{toLocaleNumber(entry.lesson, shortCode)}</span>
                                                    </div>
                                                </TableCell>

                                                {/* Hierarchical Topics */}
                                                <TableCell className="py-4 px-4 align-top">
                                                    <div className="space-y-1.5">
                                                        {(entry.topics || []).map((topic, tIdx) => (
                                                            <div
                                                                key={topic.id || tIdx}
                                                                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 text-xs font-medium shadow-2xs mr-1.5 mb-1 hover:border-indigo-300 transition-colors"
                                                            >
                                                                <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[9px] font-black">
                                                                    #{toLocaleNumber(tIdx + 1, shortCode)}
                                                                </span>
                                                                <span className="font-semibold text-slate-700 dark:text-slate-200">{topic.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="py-4 px-4 align-top text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => handleEdit(entry)}
                                                            className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all shadow-xs cursor-pointer"
                                                            title={t("edit") || "Edit"}
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => setDeleteId(entry.id)}
                                                            className="h-7 w-7 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all shadow-xs cursor-pointer"
                                                            title={t("delete") || "Delete"}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Footer */}
                        {filteredTopics.length > 0 && (
                            <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold pt-2 uppercase tracking-tight">
                                <div>
                                    {t("showing_x_to_y_of_z_entries", {
                                        from: toLocaleNumber((currentPage - 1) * itemsPerPage + 1, shortCode),
                                        to: toLocaleNumber(Math.min(currentPage * itemsPerPage, filteredTopics.length), shortCode),
                                        total: toLocaleNumber(filteredTopics.length, shortCode)
                                    }) || `Showing ${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, filteredTopics.length)} of ${filteredTopics.length} entries`}
                                </div>
                                <div className="flex gap-1.5">
                                    <Button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        size="sm"
                                        className="h-8 w-8 p-0 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 rounded-[10px] shadow-sm disabled:opacity-40 cursor-pointer"
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" className="h-8 w-8 p-0 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 rounded-[10px] shadow-sm font-black">
                                        {toLocaleNumber(currentPage, shortCode)}
                                    </Button>
                                    <Button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        size="sm"
                                        className="h-8 w-8 p-0 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 rounded-[10px] shadow-sm disabled:opacity-40 cursor-pointer"
                                        disabled={currentPage === totalPages || totalPages === 0}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">
                            {t("delete_lesson_topics") || "Delete Lesson Topics"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            {t("delete_lesson_topics_confirm_message") || "Are you sure you want to delete all topics associated with this lesson? This action cannot be undone."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-9 rounded-full text-[11px] font-bold uppercase tracking-wider border-gray-200 cursor-pointer">
                            {t("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-rose-500 hover:bg-rose-600 h-9 rounded-full text-[11px] font-bold uppercase tracking-wider border-0 shadow-md cursor-pointer">
                            {t("yes_delete_topics") || "Yes, Delete Topics"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
