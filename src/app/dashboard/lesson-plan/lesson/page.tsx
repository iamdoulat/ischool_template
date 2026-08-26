"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
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
    BookMarked,
    BookOpen,
    Layers,
    GraduationCap,
    Sparkles,
    CheckCircle2,
    Route,
    Milestone,
    ArrowDown
} from "lucide-react";
import { cn } from "@/lib/utils";
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

interface LessonEntry {
    id: string; // Used for identifying the group (first lesson ID)
    className: string;
    section: string;
    subjectGroup: string;
    subject: string;
    lessons: string[];
    lesson_ids: string[];
}

interface OptionItem {
    id: string | number;
    name?: string;
    group_name?: string;
    school_class_id?: string | number;
}

export default function LessonPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [lessonsInputs, setLessonsInputs] = useState([{ id: Date.now(), value: "" }]);
    const [lessonsList, setLessonsList] = useState<LessonEntry[]>([]);
    const [classes, setClasses] = useState<OptionItem[]>([]);
    const [sections, setSections] = useState<OptionItem[]>([]);
    const [subjectGroups, setSubjectGroups] = useState<OptionItem[]>([]);
    const [subjects, setSubjects] = useState<OptionItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Pagination & Export
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    // Form State
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        class_name: "",
        section: "",
        subject_group: "",
        subject: ""
    });

    // Dialog State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [classesRes, groupsRes, subjectsRes] = await Promise.all([
                api.get('/academics/classes?no_paginate=true').catch(() => ({ data: [] })),
                api.get('/academics/subject-groups?no_paginate=true').catch(() => ({ data: [] })),
                api.get('/academics/subjects?no_paginate=true').catch(() => ({ data: [] }))
            ]);

            const extractData = (res: { data?: unknown }): OptionItem[] => {
                const data = res.data as { data?: unknown } | unknown[] | undefined;
                if (Array.isArray(data)) return data as OptionItem[];
                if (data && Array.isArray((data as { data?: unknown }).data)) {
                    return (data as { data: OptionItem[] }).data;
                }
                return [];
            };

            setClasses(extractData(classesRes));
            setSubjectGroups(extractData(groupsRes));
            setSubjects(extractData(subjectsRes));
        } catch (error) {
            console.error("Failed to load initial dropdowns", error);
        }
        fetchLessons();
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

    const fetchLessons = async () => {
        setLoading(true);
        try {
            const response = await api.get('/lesson-plan/lessons');
            setLessonsList(Array.isArray(response.data) ? response.data : []);
        } catch {
            toast({ title: "Error", description: "Failed to fetch lessons", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.class_name || !formData.section || !formData.subject_group || !formData.subject) {
            toast({ title: "Validation Error", description: "Please select all required fields", variant: "destructive" });
            return;
        }

        const validLessons = lessonsInputs.map(l => l.value).filter(v => v.trim() !== "");
        if (validLessons.length === 0) {
            toast({ title: "Validation Error", description: "Please enter at least one lesson", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                lessons: validLessons
            };

            if (editMode && selectedId) {
                await api.put(`/lesson-plan/lessons/${selectedId}`, payload);
                toast({ title: "Success", description: "Lessons updated successfully" });
            } else {
                await api.post('/lesson-plan/lessons', payload);
                toast({ title: "Success", description: "Lessons created successfully" });
            }

            resetForm();
            fetchLessons();
        } catch {
            toast({ title: "Error", description: "Failed to save lessons", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (entry: LessonEntry) => {
        const cls = classes.find((c) => c.name === entry.className);
        if (cls) fetchSectionsByClass(cls.id.toString());
        setFormData({
            class_name: entry.className,
            section: entry.section,
            subject_group: entry.subjectGroup,
            subject: entry.subject
        });
        setLessonsInputs(entry.lessons.length > 0 ? entry.lessons.map((l, i) => ({ id: Date.now() + i, value: l })) : [{ id: Date.now(), value: "" }]);
        setSelectedId(entry.id);
        setEditMode(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/lesson-plan/lessons/${deleteId}`);
            toast({ title: "Success", description: "Lessons deleted successfully" });
            fetchLessons();
        } catch {
            toast({ title: "Error", description: "Failed to delete lessons", variant: "destructive" });
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setFormData({
            class_name: "",
            section: "",
            subject_group: "",
            subject: ""
        });
        setLessonsInputs([{ id: Date.now(), value: "" }]);
        setEditMode(false);
        setSelectedId(null);
    };

    const addMoreLesson = () => {
        setLessonsInputs([...lessonsInputs, { id: Date.now(), value: "" }]);
    };

    const updateLessonInput = (id: number, value: string) => {
        setLessonsInputs(lessonsInputs.map(l => l.id === id ? { ...l, value } : l));
    };

    const removeLessonInput = (id: number) => {
        const newInputs = lessonsInputs.filter(l => l.id !== id);
        if (newInputs.length === 0) {
            setLessonsInputs([{ id: Date.now(), value: "" }]);
        } else {
            setLessonsInputs(newInputs);
        }
    };

    // Filter & Pagination logic
    const filteredLessons = lessonsList.filter(entry =>
        (entry.className || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.section || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.subjectGroup || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.subject || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.lessons || []).some(l => l.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalPages = Math.ceil(filteredLessons.length / itemsPerPage) || 1;
    const paginatedLessons = filteredLessons.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleAction = (action: string) => {
        if (action === 'print') {
            window.print();
        } else if (action === 'copy') {
            navigator.clipboard.writeText(JSON.stringify(filteredLessons, null, 2));
            toast({ title: "Success", description: "Copied to clipboard" });
        } else if (action === 'excel') {
            const ws = XLSX.utils.json_to_sheet(filteredLessons.map(l => ({
                "Class": l.className,
                "Section": l.section,
                "Subject Group": l.subjectGroup,
                "Subject": l.subject,
                "Lessons": (l.lessons || []).join(", ")
            })));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Lessons");
            XLSX.writeFile(wb, "lessons.xlsx");
            toast({ title: "Success", description: "Exported to Excel" });
        } else if (action === 'pdf') {
            const doc = new jsPDF();
            doc.text("Lesson List", 14, 15);
            autoTable(doc, {
                head: [["Class", "Section", "Subject Group", "Subject", "Lessons"]],
                body: filteredLessons.map(l => [l.className, l.section, l.subjectGroup, l.subject, (l.lessons || []).join(", ")]),
                startY: 20
            });
            doc.save("lessons.pdf");
            toast({ title: "Success", description: "Exported to PDF" });
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-3 sm:p-5 font-sans bg-gray-50/10 min-h-screen">
            {/* Left Column: Add Lesson Form */}
            <div className="w-full lg:w-1/4">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <BookMarked className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                {editMode ? "Edit Lesson" : "Add Lesson"}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">
                                Configure curriculum lessons
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    Class <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.class_name}
                                    onValueChange={(val) => {
                                        const cls = classes.find((c) => c.name === val);
                                        setFormData({ ...formData, class_name: val, section: '' });
                                        fetchSectionsByClass(cls?.id?.toString() ?? '');
                                    }}
                                >
                                    <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map(c => (
                                            <SelectItem key={c.id} value={c.name || ""}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    Section <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.section}
                                    onValueChange={(val) => setFormData({ ...formData, section: val })}
                                    disabled={!formData.class_name}
                                >
                                    <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                        <SelectValue placeholder="Select Section" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sections.map(s => (
                                            <SelectItem key={s.id} value={s.name || ""}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    Subject Group <span className="text-red-500">*</span>
                                </Label>
                                <Select value={formData.subject_group} onValueChange={(val) => setFormData({...formData, subject_group: val})}>
                                    <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                        <SelectValue placeholder="Select Subject Group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subjectGroups.map(g => (
                                            <SelectItem key={g.id} value={g.name || g.group_name || ""}>{g.name || g.group_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    Subject <span className="text-red-500">*</span>
                                </Label>
                                <Select value={formData.subject} onValueChange={(val) => setFormData({...formData, subject: val})}>
                                    <SelectTrigger className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none">
                                        <SelectValue placeholder="Select Subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subjects.map(s => (
                                            <SelectItem key={s.id} value={s.name || ""}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        Lesson Names <span className="text-red-500">*</span>
                                    </Label>
                                    <Button
                                        type="button"
                                        onClick={addMoreLesson}
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-3 text-[10.5px] font-bold uppercase btn-gradient flex items-center gap-1 rounded-full shadow-xs"
                                    >
                                        <Plus className="h-3 w-3" /> Add Lesson
                                    </Button>
                                </div>

                                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                    {lessonsInputs.map((input, idx) => (
                                        <div key={input.id} className="flex gap-1.5 items-center group">
                                            <span className="text-[10px] font-bold text-gray-400 w-4 text-center">#{idx + 1}</span>
                                            <Input
                                                value={input.value}
                                                placeholder={`e.g. Chapter ${idx + 1}`}
                                                onChange={(e) => updateLessonInput(input.id, e.target.value)}
                                                className="h-9 border-gray-200 bg-gray-50/30 text-xs shadow-none focus-visible:ring-indigo-500 rounded-lg flex-1"
                                            />
                                            {lessonsInputs.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeLessonInput(input.id)}
                                                    className="h-7 w-7 rounded-md hover:bg-rose-50 text-gray-400 hover:text-rose-600 flex items-center justify-center transition-colors shrink-0"
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
                                    <Button onClick={resetForm} variant="outline" className="h-9 text-xs rounded-full px-4 border-gray-200 font-bold uppercase">
                                        Cancel
                                    </Button>
                                )}
                                <Button
                                    onClick={handleSave}
                                    disabled={submitting}
                                    className="btn-gradient text-white px-8 h-9 text-[11px] font-bold uppercase shadow-lg shadow-orange-200/50 transition-all rounded-full"
                                >
                                    {submitting ? "Saving..." : editMode ? "Update" : "Save Lesson"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Lesson List */}
            <div className="w-full lg:w-3/4">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <BookMarked className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                    Lesson List
                                </CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    {filteredLessons.length} syllabus group{filteredLessons.length === 1 ? '' : 's'} recorded
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={String(itemsPerPage)} onValueChange={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}>
                                <SelectTrigger className="h-8 w-16 text-xs border-gray-200 rounded-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button onClick={() => handleAction('copy')} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Copy">
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button onClick={() => handleAction('excel')} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Export Excel">
                                    <FileSpreadsheet className="h-4 w-4" />
                                </Button>
                                <Button onClick={() => handleAction('pdf')} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Export PDF">
                                    <FileText className="h-4 w-4" />
                                </Button>
                                <Button onClick={() => handleAction('print')} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Print">
                                    <Printer className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Columns">
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
                                    placeholder="Search by class, subject, lesson..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="pl-9 h-9 text-xs border-gray-200 bg-gray-50/30 rounded-lg focus-visible:ring-indigo-500 shadow-none"
                                />
                            </div>
                            {filteredLessons.length > 0 && (
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10.5px] font-bold py-1 px-2.5">
                                    <Layers className="h-3 w-3 mr-1" />
                                    {filteredLessons.reduce((acc, curr) => acc + (curr.lessons?.length || 0), 0)} Total Lessons
                                </Badge>
                            )}
                        </div>

                        {/* Enhanced Table */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs">
                            <Table>
                                <TableHeader className="bg-gray-50/90 dark:bg-gray-800/80 text-[11px] uppercase font-bold text-gray-600 dark:text-gray-300">
                                    <TableRow className="hover:bg-transparent border-gray-200 dark:border-gray-700">
                                        <TableHead className="py-3 px-4 w-[120px]">Class</TableHead>
                                        <TableHead className="py-3 px-4 w-[100px]">Section</TableHead>
                                        <TableHead className="py-3 px-4 w-[150px]">Subject Group</TableHead>
                                        <TableHead className="py-3 px-4 w-[150px]">Subject</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[300px]">
                                            <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
                                                <Route className="h-3.5 w-3.5" />
                                                <span>Lesson Progression & Hierarchy</span>
                                            </div>
                                        </TableHead>
                                        <TableHead className="py-3 px-4 text-right w-[90px]">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={6} />
                                    ) : filteredLessons.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="px-4 py-16 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                                                No lessons found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedLessons.map((entry) => (
                                            <TableRow
                                                key={entry.id}
                                                className="text-[12px] border-b last:border-0 border-gray-100 dark:border-gray-800 hover:bg-indigo-50/25 transition-colors group"
                                            >
                                                {/* Class */}
                                                <TableCell className="py-4 px-4 align-top">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-100 dark:border-indigo-800 shadow-2xs">
                                                        <GraduationCap className="h-3.5 w-3.5 text-indigo-500" />
                                                        {entry.className}
                                                    </span>
                                                </TableCell>

                                                {/* Section */}
                                                <TableCell className="py-4 px-4 align-top">
                                                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-[11px] border border-gray-200 dark:border-gray-700">
                                                        Section {entry.section}
                                                    </span>
                                                </TableCell>

                                                {/* Subject Group */}
                                                <TableCell className="py-4 px-4 align-top font-medium text-gray-600 dark:text-gray-400">
                                                    <div className="flex items-center gap-1.5">
                                                        <Layers className="h-3.5 w-3.5 text-gray-400" />
                                                        <span>{entry.subjectGroup}</span>
                                                    </div>
                                                </TableCell>

                                                {/* Subject */}
                                                <TableCell className="py-4 px-4 align-top font-bold text-gray-800 dark:text-gray-200">
                                                    <div className="flex items-center gap-1.5">
                                                        <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                                                        <span>{entry.subject}</span>
                                                    </div>
                                                </TableCell>

                                                {/* Hierarchical Step-by-Step Lessons Column */}
                                                <TableCell className="py-4 px-4 align-top">
                                                    <div className="relative pl-6 space-y-2 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[2px] before:bg-gradient-to-b before:from-indigo-400 before:via-indigo-200 before:to-emerald-400 dark:before:from-indigo-600 dark:before:via-indigo-900 dark:before:to-emerald-600">
                                                        {(entry.lessons || []).map((lesson, idx) => {
                                                            const isFirst = idx === 0;
                                                            const isLast = idx === (entry.lessons?.length || 1) - 1;
                                                            return (
                                                                <div key={idx} className="relative flex items-start gap-2.5 group/step">
                                                                    {/* Node Dot / Milestone */}
                                                                    <div className={cn(
                                                                        "absolute -left-6 top-1 h-5 w-5 rounded-full flex items-center justify-center font-black text-[9.5px] shadow-2xs ring-4 ring-white dark:ring-gray-900 shrink-0 transition-transform group-hover/step:scale-115",
                                                                        isFirst ? "bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white" :
                                                                        isLast ? "bg-emerald-500 text-white" :
                                                                        "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                                                                    )}>
                                                                        {idx + 1}
                                                                    </div>

                                                                    {/* Step Content Box */}
                                                                    <div className="flex-1 bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/80 rounded-xl p-2.5 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-600 transition-all hover:shadow-xs">
                                                                        <div className="flex items-center justify-between gap-2">
                                                                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                                                                <span>Step {idx + 1}</span>
                                                                                {isFirst && (
                                                                                    <span className="text-[8.5px] bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 px-1.5 py-0.5 rounded font-bold border border-orange-200 dark:border-orange-800">
                                                                                        Initial
                                                                                    </span>
                                                                                )}
                                                                                {isLast && (entry.lessons?.length || 0) > 1 && (
                                                                                    <span className="text-[8.5px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold border border-emerald-200 dark:border-emerald-800">
                                                                                        Final Step
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs font-bold text-gray-800 dark:text-gray-100 mt-0.5 leading-snug">
                                                                            {lesson}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="py-4 px-4 align-top text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => handleEdit(entry)}
                                                            className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all shadow-xs"
                                                            title="Edit Lessons"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => setDeleteId(entry.id)}
                                                            className="h-7 w-7 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all shadow-xs"
                                                            title="Delete Lessons"
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
                        {filteredLessons.length > 0 && (
                            <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold pt-2 uppercase tracking-tight">
                                <div>
                                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLessons.length)} of {filteredLessons.length} entries
                                </div>
                                <div className="flex gap-1.5">
                                    <Button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        size="sm"
                                        className="h-8 w-8 p-0 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 rounded-[10px] shadow-sm disabled:opacity-40"
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" className="h-8 w-8 p-0 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 rounded-[10px] shadow-sm font-black">
                                        {currentPage}
                                    </Button>
                                    <Button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        size="sm"
                                        className="h-8 w-8 p-0 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 rounded-[10px] shadow-sm disabled:opacity-40"
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
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">Delete Lessons</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            Are you sure you want to delete all lessons associated with this group? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-9 rounded-full text-[11px] font-bold uppercase tracking-wider border-gray-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-rose-500 hover:bg-rose-600 h-9 rounded-full text-[11px] font-bold uppercase tracking-wider border-0 shadow-md">
                            Yes, Delete Lessons
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
