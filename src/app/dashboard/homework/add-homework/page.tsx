"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    Plus,
    Eye,
    Pencil,
    Trash2,
    ArrowUpDown,
    Filter,
    BookOpenCheck,
    CheckCircle2,
    Paperclip
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

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

const getAttachmentUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
    const origin = baseApiUrl.replace(/\/api\/v1\/?$/, "").replace(/\/api\/?$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${origin}${normalizedPath}`;
};

interface HomeworkRecord {
    id: number;
    school_class?: { id: number; name: string };
    schoolClass?: { id: number; name: string };
    class?: { id: number; name: string };
    section?: { id: number; name: string };
    subject_group?: { id: number; name: string };
    subjectGroup?: { id: number; name: string };
    subject?: { id: number; name: string };
    title?: string;
    homework_date: string;
    submission_date: string;
    evaluation_date?: string;
    creator?: { id: number; name: string };
    description: string;
    class_id?: number;
    section_id?: number;
    subject_group_id?: number;
    subject_id?: number;
    max_marks?: number | string;
    attachment?: string;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

interface OptionItem {
    id: number;
    name: string;
    school_class_id?: number;
    sections?: { id: number; name: string }[];
}

interface SubjectItem {
    id: number;
    name: string;
    code?: string;
    type?: string;
}

interface SubjectGroupItem {
    id: number;
    name: string;
    school_class_id: number;
    description?: string;
    subjects?: SubjectItem[];
}

export default function AddHomeworkPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [homeworks, setHomeworks] = useState<HomeworkRecord[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [limit, setLimit] = useState("50");

    const [classes, setClasses] = useState<OptionItem[]>([]);
    const [sections, setSections] = useState<OptionItem[]>([]);
    const [subjectGroups, setSubjectGroups] = useState<SubjectGroupItem[]>([]);
    const [subjects, setSubjects] = useState<SubjectItem[]>([]);

    const [filters, setFilters] = useState({
        class_id: "",
        section_id: "",
        subject_group_id: "",
        subject_id: "",
    });

    const [activeTab, setActiveTab] = useState("upcoming");

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        class_id: "",
        section_id: "",
        subject_group_id: "",
        subject_id: "",
        title: "",
        homework_date: new Date().toISOString().split('T')[0],
        submission_date: new Date().toISOString().split('T')[0],
        evaluation_date: "",
        description: "",
        max_marks: "",
        attachment_url: "",
    });

    // Evaluate dialog
    const [isEvaluateOpen, setIsEvaluateOpen] = useState(false);
    const [evaluateHomework, setEvaluateHomework] = useState<HomeworkRecord | null>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [evalLoading, setEvalLoading] = useState(false);
    const [activeSubmissionId, setActiveSubmissionId] = useState<number | null>(null);
    const [evalFormData, setEvalFormData] = useState({
        marks_obtained: "",
        evaluation_date: new Date().toISOString().split('T')[0],
        teacher_remarks: "",
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [viewRecord, setViewRecord] = useState<HomeworkRecord | null>(null);
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const startEdit = (item: HomeworkRecord) => {
        setIsEditing(true);
        setEditId(item.id);
        setFormData({
            class_id: String(item.class_id || item.school_class?.id || ""),
            section_id: String(item.section_id || item.section?.id || ""),
            subject_group_id: String(item.subject_group_id || item.subject_group?.id || ""),
            subject_id: String(item.subject_id || item.subject?.id || ""),
            title: item.title || "",
            homework_date: item.homework_date ? new Date(item.homework_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            submission_date: item.submission_date ? new Date(item.submission_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            evaluation_date: item.evaluation_date ? new Date(item.evaluation_date).toISOString().split('T')[0] : "",
            description: item.description || "",
            max_marks: item.max_marks !== undefined && item.max_marks !== null ? String(item.max_marks) : "",
            attachment_url: item.attachment || "",
        });
        setAttachmentFile(null);
        setIsDialogOpen(true);
    };

    const startView = (item: HomeworkRecord) => {
        setViewRecord(item);
        setIsViewOpen(true);
    };

    const startEvaluate = (item: HomeworkRecord) => {
        setEvaluateHomework(item);
        setIsEvaluateOpen(true);
        fetchSubmissions(item.id);
    };

    const fetchSubmissions = async (homeworkId: number) => {
        setEvalLoading(true);
        try {
            const res = await api.get(`/homework/homeworks/${homeworkId}/submissions?limit=1000`);
            setSubmissions(res.data.submissions?.data || res.data.submissions || []);
        } catch {
            toast({ title: t("error") || "Error", description: "Failed to fetch submissions", variant: "destructive" });
        } finally {
            setEvalLoading(false);
        }
    };

    const saveEvaluation = async (submissionId: number) => {
        try {
            await api.put(`/homework/submissions/${submissionId}/evaluate`, evalFormData);
            toast({ title: t("success") || "Success", description: "Evaluation saved" });
            setActiveSubmissionId(null);
            if (evaluateHomework) fetchSubmissions(evaluateHomework.id);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast({ title: t("error") || "Error", description: e.response?.data?.message || "Failed to evaluate", variant: "destructive" });
        }
    };

    const filteredSections = filters.class_id
        ? classes.find(c => String(c.id) === filters.class_id)?.sections || []
        : [];
    const filteredSubjectGroups = filters.class_id
        ? subjectGroups.filter(sg => String(sg.school_class_id) === filters.class_id)
        : subjectGroups;
    const filteredSubjects = useMemo(() => {
        if (filters.subject_group_id) {
            const group = subjectGroups.find(sg => String(sg.id) === filters.subject_group_id);
            return group?.subjects || [];
        }
        if (filters.class_id) {
            const classGroups = subjectGroups.filter(sg => String(sg.school_class_id) === filters.class_id);
            const subjectsMap = new Map<number, SubjectItem>();
            classGroups.forEach(sg => {
                sg.subjects?.forEach(s => {
                    subjectsMap.set(s.id, s);
                });
            });
            return Array.from(subjectsMap.values());
        }
        return subjects;
    }, [filters.class_id, filters.subject_group_id, subjectGroups, subjects]);

    const formFilteredSections = formData.class_id
        ? classes.find(c => String(c.id) === formData.class_id)?.sections || []
        : [];
    const formFilteredSubjectGroups = formData.class_id
        ? subjectGroups.filter(sg => String(sg.school_class_id) === formData.class_id)
        : subjectGroups;
    const formFilteredSubjects = useMemo(() => {
        if (formData.subject_group_id) {
            const group = subjectGroups.find(sg => String(sg.id) === formData.subject_group_id);
            return group?.subjects || [];
        }
        if (formData.class_id) {
            const classGroups = subjectGroups.filter(sg => String(sg.school_class_id) === formData.class_id);
            const subjectsMap = new Map<number, SubjectItem>();
            classGroups.forEach(sg => {
                sg.subjects?.forEach(s => {
                    subjectsMap.set(s.id, s);
                });
            });
            return Array.from(subjectsMap.values());
        }
        return subjects;
    }, [formData.class_id, formData.subject_group_id, subjectGroups, subjects]);

    const { t } = useTranslation();

    const today = new Date().toISOString().split('T')[0];
    const upcomingHomeworks = homeworks.filter(h => h.submission_date >= today);
    const closedHomeworks = homeworks.filter(h => h.submission_date < today);

    useEffect(() => {
        fetchInitialData();
        fetchHomeworks(1);
    }, []);

    const fetchInitialData = async () => {
        try {
            const [classesRes, sectionsRes, groupsRes, subjectsRes] = await Promise.all([
                api.get('/academics/classes?no_paginate=true'),
                api.get('/academics/sections?with_class=true&no_paginate=true'),
                api.get('/academics/subject-groups?no_paginate=true'),
                api.get('/academics/subjects?no_paginate=true')
            ]);
            setClasses(classesRes.data.data || []);
            setSections(sectionsRes.data.data || []);
            setSubjectGroups(groupsRes.data.data || []);
            setSubjects(subjectsRes.data.data || []);
        } catch (error) {
            console.error("Error fetching initial data:", error);
        }
    };

    const fetchHomeworks = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit,
                search: searchTerm,
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
            });
            const response = await api.get(`/homework/homeworks?${params.toString()}`);
            setHomeworks(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
        } catch (error) {
            console.error("Error fetching homeworks:", error);
            toast({ title: t("error"), description: t("failed_to_fetch_homeworks"), variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchHomeworks(1);
    };

    const handleSave = async () => {
        try {
            const data = new FormData();
            data.append('class_id', formData.class_id);
            data.append('section_id', formData.section_id);
            data.append('subject_group_id', formData.subject_group_id);
            data.append('subject_id', formData.subject_id);
            data.append('title', formData.title);
            data.append('homework_date', formData.homework_date);
            data.append('submission_date', formData.submission_date);
            if (formData.evaluation_date) data.append('evaluation_date', formData.evaluation_date);
            data.append('description', formData.description);
            data.append('max_marks', formData.max_marks);
            if (attachmentFile) {
                data.append('attachment', attachmentFile);
            }

            if (isEditing && editId) {
                data.append('_method', 'PUT');
                await api.post(`/homework/homeworks/${editId}`, data);
                toast({ title: t("success"), description: t("homework_updated_successfully") || "Homework updated successfully" });
            } else {
                await api.post('/homework/homeworks', data);
                toast({ title: t("success"), description: t("homework_added_successfully") });
            }
            setIsDialogOpen(false);
            fetchHomeworks();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            toast({
                title: t("error"),
                description: err.response?.data?.message || t("failed_to_save_homework"),
                variant: "destructive",
            });
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/homework/homeworks/${deleteId}`);
            toast({ title: t("success"), description: t("homework_deleted_successfully") });
            setIsDeleteOpen(false);
            fetchHomeworks();
        } catch (error) {
            console.error(error);
            toast({ title: t("error"), description: t("failed_to_delete_homework"), variant: "destructive" });
        }
    };

    const handleCopy = () => {
        const text = homeworks.map(h => `${h.school_class?.name || h.schoolClass?.name}\t${h.subject?.name}\t${h.title || "—"}\t${h.max_marks !== null && h.max_marks !== undefined ? h.max_marks : "—"}\t${h.homework_date}`).join('\n');
        navigator.clipboard.writeText(text);
        toast({ title: t("copied"), description: t("data_copied_to_clipboard") });
    };

    const handleExportCSV = () => {
        const headers = [t("class"), t("section"), t("subject"), t("title") || "Title", t("homework_date"), t("submission_date"), t("max_marks") || "Max Marks"];
        const rows = homeworks.map(h => [h.school_class?.name || h.schoolClass?.name, h.section?.name, h.subject?.name, h.title || "—", h.homework_date, h.submission_date, h.max_marks !== null && h.max_marks !== undefined ? h.max_marks : "—"]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "homework_list.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toolbarActions: { Icon: React.ElementType; onClick: () => void; title: string }[] = [
        { Icon: Copy, onClick: handleCopy, title: t("copy") },
        { Icon: FileSpreadsheet, onClick: handleExportCSV, title: t("excel") },
        { Icon: FileText, onClick: handleExportCSV, title: t("csv") },
        { Icon: Printer, onClick: () => window.print(), title: t("print") },
        { Icon: Columns, onClick: () => {}, title: t("columns") },
    ];

    return (
        <>
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            {/* Select Criteria Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("select_criteria")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("filter_homework_by_class_section_subject")}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                {t("class")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={filters.class_id} onValueChange={(v) => setFilters({ ...filters, class_id: v, section_id: "", subject_group_id: "", subject_id: "" })}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">{t("section")}</Label>
                            <Select value={filters.section_id} onValueChange={(v) => setFilters({ ...filters, section_id: v })}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredSections.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">{t("subject_group")}</Label>
                            <Select value={filters.subject_group_id} onValueChange={(v) => setFilters({ ...filters, subject_group_id: v })}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredSubjectGroups.map(sg => <SelectItem key={sg.id} value={String(sg.id)}>{sg.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">{t("subject")}</Label>
                            <Select value={filters.subject_id} onValueChange={(v) => setFilters({ ...filters, subject_id: v })}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredSubjects.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end md:col-span-4">
                            <Button type="submit" className="btn-gradient gap-2 h-9 px-8 text-[11px] font-bold uppercase transition-all rounded-full shadow-md">
                                <Search className="h-3.5 w-3.5" /> {t("search")}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Homework List Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <BookOpenCheck className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("add_homework")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{pagination?.total ?? homeworks.length} {t("homework_records")}</p>
                        </div>
                    </div>
                    <Button onClick={() => {
                        setIsEditing(false);
                        setEditId(null);
                        setFormData({
                            class_id: "",
                            section_id: "",
                            subject_group_id: "",
                            subject_id: "",
                            title: "",
                            homework_date: new Date().toISOString().split('T')[0],
                            submission_date: new Date().toISOString().split('T')[0],
                            evaluation_date: "",
                            description: "",
                            max_marks: "",
                            attachment_url: "",
                        });
                        setAttachmentFile(null);
                        setIsDialogOpen(true);
                    }} className="btn-gradient gap-2 h-8 px-4 text-[10px] font-bold uppercase transition-all rounded-full shadow-md">
                        <Plus className="h-3.5 w-3.5" /> {t("add_homework")}
                    </Button>
                </CardHeader>
                <CardContent className="p-4">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="bg-transparent h-auto p-0 border-b border-gray-100 w-full justify-start rounded-none gap-6 mb-4">
                            <TabsTrigger
                                value="upcoming"
                                className="text-[11px] font-medium px-0 py-2 border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 rounded-none bg-transparent shadow-none"
                            >
                                {t("upcoming_homework")}
                            </TabsTrigger>
                            <TabsTrigger
                                value="closed"
                                className="text-[11px] font-medium px-0 py-2 border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 rounded-none bg-transparent shadow-none"
                            >
                                {t("closed_homework")}
                            </TabsTrigger>
                        </TabsList>

                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4 border-b border-gray-50 pb-4">
                            <div className="relative w-full md:w-64">
                                <Input
                                    placeholder={t("search_results")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-3 h-9 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded-full shadow-none bg-gray-50/50"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 mr-2">
                                    <Select value={limit} onValueChange={setLimit}>
                                        <SelectTrigger className="h-7 w-16 text-[10px] border-gray-200 bg-transparent shadow-none rounded-md px-2 flex gap-1 items-center justify-between">
                                            <SelectValue />
                                            <ChevronLeft className="h-2 w-2 text-gray-400 rotate-90" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                            <SelectItem value="200">200</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <ChevronLeft className="h-3 w-3 text-gray-400 rotate-90" />
                                </div>
                                <div className="flex items-center gap-1 text-gray-400">
                                    {toolbarActions.map((action, i) => (
                                        <Button
                                            key={i}
                                            variant="ghost"
                                            size="icon"
                                            onClick={action.onClick}
                                            title={action.title}
                                            className="h-7 w-7 hover:bg-gray-100 rounded"
                                        >
                                            <action.Icon className="h-3.5 w-3.5" />
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="rounded border border-gray-50 overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100">
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            {t("class")} <ArrowUpDown className="h-2.5 w-2.5 inline-block ml-1 opacity-50" />
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">{t("section")}</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">{t("subject_group")}</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">{t("subject")}</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">{t("title") || "Title"}</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">{t("homework_date")}</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">{t("submission_date")}</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Status</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">{t("max_marks") || "Max Marks"}</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">{t("created_by")}</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">{t("action") || "Action"}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(() => {
                                        const displayData = activeTab === "upcoming" ? upcomingHomeworks : closedHomeworks;
                                        if (loading) return <TableSkeleton rows={5} cols={11} />;
                                        if (displayData.length === 0) return (
                                            <tr>
                                                <td colSpan={11} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data_found")}</td>
                                            </tr>
                                        );
                                        return displayData.map((item) => {
                                            const today = new Date().toISOString().split('T')[0];
                                            const isUpcoming = item.submission_date >= today;
                                            return (
                                                <TableRow key={item.id} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap">
                                                    <TableCell className="py-3 text-gray-700 font-medium">{item.school_class?.name || item.schoolClass?.name || item.class?.name || "-"}</TableCell>
                                                    <TableCell className="py-3 text-gray-500">{item.section?.name || "-"}</TableCell>
                                                    <TableCell className="py-3 text-gray-500">{item.subject_group?.name || item.subjectGroup?.name || "-"}</TableCell>
                                                    <TableCell className="py-3 text-gray-500">{item.subject?.name || "-"}</TableCell>
                                                    <TableCell className="py-3 text-gray-700 font-medium">{item.title || "—"}</TableCell>
                                                    <TableCell className="py-3 text-gray-500">{formatDate(item.homework_date)}</TableCell>
                                                    <TableCell className="py-3 text-gray-500">{formatDate(item.submission_date)}</TableCell>
                                                    <TableCell className="py-3">
                                                        <Badge className={cn("text-[10px] font-bold border", isUpcoming ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-600 border-gray-200")}>
                                                            {isUpcoming ? "Upcoming" : "Closed"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-3 text-gray-500">{item.max_marks !== null && item.max_marks !== undefined ? item.max_marks : "-"}</TableCell>
                                                    <TableCell className="py-3 text-gray-500">{item.creator?.name || "-"}</TableCell>
                                                    <TableCell className="py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button size="icon" variant="ghost" onClick={() => startEvaluate(item)} className="h-7 w-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-sm" title="Evaluate Submissions">
                                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" onClick={() => startView(item)} className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-sm">
                                                                <Eye className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" onClick={() => startEdit(item)} className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-sm">
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" onClick={() => { setDeleteId(item.id); setIsDeleteOpen(true); }} className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-sm">
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        });
                                    })()}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Footer / Pagination */}
                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-4 border-t border-gray-50">
                            <div>
                                {t("showing_x_to_y_of_z", { from: pagination?.from || 0, to: pagination?.to || 0, total: pagination?.total || 0 })}
                            </div>
                            <div className="flex gap-2 items-center">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={pagination?.current_page === 1}
                                    onClick={() => fetchHomeworks(pagination!.current_page - 1)}
                                    className="h-7 w-7 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 hover:opacity-90 transition-all shadow-sm disabled:opacity-30"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                {[...Array(pagination?.last_page || 0)].map((_, i) => (
                                    <Button
                                        key={i + 1}
                                        onClick={() => fetchHomeworks(i + 1)}
                                        className={cn(
                                            "h-7 w-7 p-0 text-[11px] font-bold rounded-[10px] shadow-sm transition-all duration-300",
                                            pagination?.current_page === i + 1
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white"
                                                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                                        )}
                                    >
                                        {i + 1}
                                    </Button>
                                ))}
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={pagination?.current_page === pagination?.last_page}
                                    onClick={() => fetchHomeworks(pagination!.current_page + 1)}
                                    className="h-7 w-7 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 hover:opacity-90 transition-all shadow-sm disabled:opacity-30"
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>

                        {/* Add Homework Dialog */}
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
                                <DialogHeader className="px-6 py-4 bg-gradient-to-r from-[#FF9800] to-[#6366F1]">
                                    <DialogTitle className="text-lg font-bold text-white">{isEditing ? "Edit Homework" : t("add_homework")}</DialogTitle>
                                </DialogHeader>
                                <div className="grid grid-cols-2 gap-4 px-6 py-4 max-h-[75vh] overflow-y-auto">
                                    <div className="space-y-1.5 col-span-2">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("title") || "Title"} <span className="text-red-500">*</span></Label>
                                        <Input
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="h-9 border-gray-200 text-xs shadow-none"
                                            placeholder={t("enter_title") || "Enter Title"}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("class")} <span className="text-red-500">*</span></Label>
                                        <Select value={formData.class_id} onValueChange={(v) => setFormData({ ...formData, class_id: v, section_id: "", subject_group_id: "", subject_id: "" })}>
                                            <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                                <SelectValue placeholder={t("select_class")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("section")} <span className="text-red-500">*</span></Label>
                                        <Select value={formData.section_id} onValueChange={(v) => setFormData({ ...formData, section_id: v })}>
                                            <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                                <SelectValue placeholder={t("select_section")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {formFilteredSections.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("subject_group")}</Label>
                                        <Select value={formData.subject_group_id} onValueChange={(v) => setFormData({ ...formData, subject_group_id: v })}>
                                            <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                                <SelectValue placeholder={t("select_group")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {formFilteredSubjectGroups.map(sg => <SelectItem key={sg.id} value={String(sg.id)}>{sg.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("subject")} <span className="text-red-500">*</span></Label>
                                        <Select value={formData.subject_id} onValueChange={(v) => setFormData({ ...formData, subject_id: v })}>
                                            <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                                <SelectValue placeholder={t("select_subject")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {formFilteredSubjects.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("homework_date")} <span className="text-red-500">*</span></Label>
                                        <DatePicker
                                            value={formData.homework_date}
                                            onChange={(date) => setFormData({ ...formData, homework_date: date })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("submission_date")} <span className="text-red-500">*</span></Label>
                                        <DatePicker
                                            value={formData.submission_date}
                                            onChange={(date) => setFormData({ ...formData, submission_date: date })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("evaluation_date")}</Label>
                                        <DatePicker
                                            value={formData.evaluation_date}
                                            onChange={(date) => setFormData({ ...formData, evaluation_date: date })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("max_marks") || "Max Marks"}</Label>
                                        <Input
                                            type="number"
                                            value={formData.max_marks}
                                            onChange={(e) => setFormData({ ...formData, max_marks: e.target.value })}
                                            className="h-9 border-gray-200 text-xs shadow-none"
                                            placeholder={t("enter_max_marks") || "Enter Max Marks"}
                                            min="0"
                                            step="any"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("attachment") || "Attachment"}</Label>
                                        <Input
                                            type="file"
                                            onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                                            className="h-9 border-gray-200 text-xs shadow-none cursor-pointer p-1.5"
                                            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                        />
                                        {formData.attachment_url && (
                                            <p className="text-[10px] text-gray-500 mt-1">
                                                Current file: <a href={getAttachmentUrl(formData.attachment_url)} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{formData.attachment_url.split('/').pop()}</a>
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5 col-span-2">
                                        <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("description")}</Label>
                                        <Textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="border-gray-200 text-xs shadow-none min-h-[80px]"
                                            placeholder={t("enter_homework_instructions")}
                                        />
                                    </div>
                                </div>
                                <DialogFooter className="px-6 pb-6">
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-9 text-[11px] uppercase font-bold rounded-full">{t("cancel")}</Button>
                                    <Button onClick={handleSave} className="btn-gradient h-9 px-8 text-[11px] uppercase font-bold rounded-full">{t("save_homework")}</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* View Homework Dialog */}
                        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
                                <DialogHeader className="px-6 py-4 bg-gradient-to-r from-[#FF9800] to-[#6366F1]">
                                    <DialogTitle className="text-lg font-bold text-white">Homework Details</DialogTitle>
                                </DialogHeader>
                                {viewRecord && (
                                    <div className="p-6 space-y-4 text-xs">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2 border-b pb-2">
                                                <span className="font-bold text-gray-500 uppercase block mb-1">{t("title") || "Title"}</span>
                                                <span className="text-gray-900 font-bold text-sm">{viewRecord.title || "—"}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-500 uppercase block mb-1">{t("class")}</span>
                                                <span className="text-gray-900 font-medium">{viewRecord.school_class?.name || viewRecord.schoolClass?.name || viewRecord.class?.name || "-"}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-500 uppercase block mb-1">{t("section")}</span>
                                                <span className="text-gray-900 font-medium">{viewRecord.section?.name || "-"}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-500 uppercase block mb-1">{t("subject_group")}</span>
                                                <span className="text-gray-900 font-medium">{viewRecord.subject_group?.name || viewRecord.subjectGroup?.name || "-"}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-500 uppercase block mb-1">{t("subject")}</span>
                                                <span className="text-gray-900 font-medium">{viewRecord.subject?.name || "-"}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-500 uppercase block mb-1">{t("homework_date")}</span>
                                                <span className="text-gray-900 font-medium">{formatDate(viewRecord.homework_date)}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-500 uppercase block mb-1">{t("submission_date")}</span>
                                                <span className="text-gray-900 font-medium">{formatDate(viewRecord.submission_date)}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-500 uppercase block mb-1">{t("evaluation_date")}</span>
                                                <span className="text-gray-900 font-medium">{viewRecord.evaluation_date ? formatDate(viewRecord.evaluation_date) : "-"}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-500 uppercase block mb-1">{t("max_marks") || "Max Marks"}</span>
                                                <span className="text-gray-900 font-medium">{viewRecord.max_marks !== null && viewRecord.max_marks !== undefined ? viewRecord.max_marks : "-"}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-500 uppercase block mb-1">{t("attachment") || "Attachment"}</span>
                                                {viewRecord.attachment ? (
                                                    <a href={getAttachmentUrl(viewRecord.attachment)} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-medium">
                                                        Download Attachment
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-900 font-medium">-</span>
                                                )}
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-500 uppercase block mb-1">{t("created_by")}</span>
                                                <span className="text-gray-900 font-medium">{viewRecord.creator?.name || "-"}</span>
                                            </div>
                                        </div>
                                        <div className="border-t pt-4">
                                            <span className="font-bold text-gray-500 uppercase block mb-2">{t("description")}</span>
                                            <div className="bg-gray-50 p-3 rounded-lg border text-gray-700 min-h-[100px] whitespace-pre-wrap">
                                                {viewRecord.description || "No description available"}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <DialogFooter className="px-6 pb-6">
                                    <Button variant="outline" onClick={() => setIsViewOpen(false)} className="h-9 text-[11px] uppercase font-bold rounded-full px-6">{t("close") || "Close"}</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </Tabs>
                </CardContent>
            </Card>
        </div>

        {/* Evaluate Submissions Dialog */}
        <Dialog open={isEvaluateOpen} onOpenChange={setIsEvaluateOpen}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 bg-gradient-to-r from-[#FF9800] to-[#6366F1]">
                    <DialogTitle className="text-lg font-bold text-white">Evaluate Submissions</DialogTitle>
                </DialogHeader>
                <div className="p-6">
                    {evalLoading ? (
                        <div className="py-12 text-center text-sm text-gray-400">Loading submissions...</div>
                    ) : submissions.length === 0 ? (
                        <div className="py-12 text-center text-sm text-gray-400">No submissions found for this homework.</div>
                    ) : (
                        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                            {submissions.map(sub => (
                                <div key={sub.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="font-bold text-gray-800 text-sm">{sub.student?.name || "Unknown Student"}</div>
                                            <div className="text-[10px] text-gray-500 uppercase mt-0.5">
                                                Status: <Badge variant="outline" className={cn("text-[9px] border-0", sub.status === 'evaluated' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>{sub.status}</Badge>
                                            </div>
                                        </div>
                                        {sub.submission_file ? (
                                            <a href={getAttachmentUrl(sub.submission_file)} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-indigo-600 flex items-center hover:underline">
                                                <Paperclip className="h-3 w-3 mr-1" /> View File
                                            </a>
                                        ) : (
                                            <span className="text-[10px] text-gray-400">No File</span>
                                        )}
                                    </div>
                                    
                                    {sub.student_answer && (
                                        <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-100 mb-3 whitespace-pre-wrap">
                                            {sub.student_answer}
                                        </div>
                                    )}

                                    {activeSubmissionId === sub.id ? (
                                        <div className="bg-white p-3 rounded-md border border-gray-200 grid grid-cols-2 gap-3 mt-3">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] uppercase font-bold text-gray-500">Marks</Label>
                                                <Input 
                                                    type="number" 
                                                    value={evalFormData.marks_obtained}
                                                    onChange={e => setEvalFormData({...evalFormData, marks_obtained: e.target.value})}
                                                    className="h-8 text-xs" 
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[10px] uppercase font-bold text-gray-500">Date</Label>
                                                <Input 
                                                    type="date" 
                                                    value={evalFormData.evaluation_date}
                                                    onChange={e => setEvalFormData({...evalFormData, evaluation_date: e.target.value})}
                                                    className="h-8 text-xs" 
                                                />
                                            </div>
                                            <div className="col-span-2 space-y-1">
                                                <Label className="text-[10px] uppercase font-bold text-gray-500">Remarks</Label>
                                                <Textarea 
                                                    value={evalFormData.teacher_remarks}
                                                    onChange={e => setEvalFormData({...evalFormData, teacher_remarks: e.target.value})}
                                                    className="min-h-[60px] text-xs"
                                                />
                                            </div>
                                            <div className="col-span-2 flex justify-end gap-2 mt-1">
                                                <Button size="sm" variant="ghost" onClick={() => setActiveSubmissionId(null)} className="h-7 text-[10px]">Cancel</Button>
                                                <Button size="sm" onClick={() => saveEvaluation(sub.id)} className="h-7 text-[10px] bg-indigo-500 text-white">Save Marks</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                                            <div className="text-xs text-gray-600">
                                                <span className="font-bold">Marks:</span> {sub.marks_obtained ?? "-"} / {evaluateHomework?.max_marks ?? "-"}
                                                {sub.teacher_remarks && <div className="text-[10px] text-gray-500 mt-0.5">Note: {sub.teacher_remarks}</div>}
                                            </div>
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => {
                                                    setActiveSubmissionId(sub.id);
                                                    setEvalFormData({
                                                        marks_obtained: sub.marks_obtained != null ? String(sub.marks_obtained) : "",
                                                        evaluation_date: sub.evaluation_date ? sub.evaluation_date.split('T')[0] : new Date().toISOString().split('T')[0],
                                                        teacher_remarks: sub.teacher_remarks || "",
                                                    });
                                                }} 
                                                className="h-7 text-[10px] font-bold"
                                            >
                                                {sub.status === 'evaluated' ? 'Edit Marks' : 'Evaluate'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <DialogFooter className="px-6 pb-6 bg-gray-50">
                    <Button variant="outline" onClick={() => setIsEvaluateOpen(false)} className="h-9 text-[11px] uppercase font-bold rounded-full px-6">{t("close") || "Close"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Delete Confirmation AlertDialog */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Homework?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the homework record. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
