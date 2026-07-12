"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Search, Copy, FileSpreadsheet, FileText, Printer, Columns,
    ChevronLeft, ChevronRight, Inbox, Filter, ClipboardList, Paperclip,
    Plus, Pencil, Trash2, Eye, CheckCircle2, Star
} from "lucide-react";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { DatePicker } from "@/components/ui/date-picker";

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

interface Assignment {
    id: number;
    title: string;
    description: string;
    submission_date: string;
    evaluation_date?: string;
    marks_obtained?: number | null;
    status?: string;
    student?: { id: number; name: string };
    class?: { id: number; name: string };
    section?: { id: number; name: string };
    subject?: { id: number; name: string };
    evaluator?: { name: string };
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
}

interface SubjectGroupItem {
    id: number;
    name: string;
    school_class_id: number;
    subjects?: SubjectItem[];
}

interface StudentItem {
    id: number;
    name: string;
}

const getAttachmentUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
    const origin = baseApiUrl.replace(/\/api\/v1\/?$/, "").replace(/\/api\/?$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${origin}${normalizedPath}`;
};

const statusConfig: Record<string, { label: string; className: string }> = {
    pending:   { label: "Pending",   className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    submitted: { label: "Submitted", className: "bg-blue-100 text-blue-700 border-blue-200" },
    evaluated: { label: "Evaluated", className: "bg-green-100 text-green-700 border-green-200" },
};

const EMPTY_FORM = {
    student_id: "",
    student_ids: [] as string[],
    class_id: "",
    section_id: "",
    subject_id: "",
    title: "",
    description: "",
    submission_date: new Date().toISOString().split("T")[0],
    evaluation_date: "",
};

const EMPTY_EVAL = {
    marks_obtained: "",
    evaluation_date: new Date().toISOString().split("T")[0],
    teacher_remarks: "",
};

export default function DailyAssignmentPage() {
    const { toast } = useToast();
    const { t } = useTranslation();

    const [searchTerm, setSearchTerm] = useState("");
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [limit, setLimit] = useState("50");
    const [saving, setSaving] = useState(false);

    // Meta data
    const [classes, setClasses] = useState<OptionItem[]>([]);
    const [sections, setSections] = useState<OptionItem[]>([]);
    const [subjectGroups, setSubjectGroups] = useState<SubjectGroupItem[]>([]);
    const [subjects, setSubjects] = useState<SubjectItem[]>([]);
    const [students, setStudents] = useState<StudentItem[]>([]);

    // Filters
    const [filters, setFilters] = useState({
        class_id: "", section_id: "", subject_group_id: "", subject_id: "", date: "",
    });

    // Add/Edit dialog
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ ...EMPTY_FORM, student_ids: [] as string[] });
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

    // View dialog
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [viewAssignment, setViewAssignment] = useState<Assignment | null>(null);

    // Evaluate dialog
    const [isEvalOpen, setIsEvalOpen] = useState(false);
    const [evalId, setEvalId] = useState<number | null>(null);
    const [evalData, setEvalData] = useState({ ...EMPTY_EVAL });
    const [maxMarks, setMaxMarks] = useState<number | null>(null);

    // Delete dialog
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Derived
    const filteredSections = filters.class_id
        ? classes.find(c => String(c.id) === filters.class_id)?.sections || []
        : [];
    const filteredSubjectGroups = filters.class_id
        ? subjectGroups.filter(sg => String(sg.school_class_id) === filters.class_id)
        : subjectGroups;
    const filteredSubjects = useMemo(() => {
        if (filters.subject_group_id) {
            const g = subjectGroups.find(sg => String(sg.id) === filters.subject_group_id);
            return g?.subjects || [];
        }
        if (filters.class_id) {
            const map = new Map<number, SubjectItem>();
            subjectGroups.filter(sg => String(sg.school_class_id) === filters.class_id)
                .forEach(sg => sg.subjects?.forEach(s => map.set(s.id, s)));
            return Array.from(map.values());
        }
        return subjects;
    }, [filters.class_id, filters.subject_group_id, subjectGroups, subjects]);

    const formFilteredSections = formData.class_id
        ? classes.find(c => String(c.id) === formData.class_id)?.sections || []
        : [];
    const formFilteredSubjects = useMemo(() => {
        if (formData.class_id) {
            const map = new Map<number, SubjectItem>();
            subjectGroups.filter(sg => String(sg.school_class_id) === formData.class_id)
                .forEach(sg => sg.subjects?.forEach(s => map.set(s.id, s)));
            return Array.from(map.values());
        }
        return subjects;
    }, [formData.class_id, subjectGroups, subjects]);

    useEffect(() => {
        fetchInitialData();
        fetchAssignments(1);
    }, []);

    // Fetch students when class+section changes in form
    useEffect(() => {
        if (formData.class_id && formData.section_id) {
            api.get(`/students?no_paginate=true&class_id=${formData.class_id}&section_id=${formData.section_id}&limit=1000`)
                .then(res => {
                    const payload = res.data.data;
                    setStudents(Array.isArray(payload) ? payload : (payload?.data || []));
                })
                .catch(() => setStudents([]));
        } else {
            setStudents([]);
        }
    }, [formData.class_id, formData.section_id]);

    const fetchInitialData = async () => {
        try {
            const [classesRes, sectionsRes, groupsRes, subjectsRes] = await Promise.all([
                api.get("/academics/classes?no_paginate=true"),
                api.get("/academics/sections?with_class=true&no_paginate=true"),
                api.get("/academics/subject-groups?no_paginate=true"),
                api.get("/academics/subjects?no_paginate=true"),
            ]);
            setClasses(classesRes.data.data || []);
            setSections(sectionsRes.data.data || []);
            setSubjectGroups(groupsRes.data.data || []);
            setSubjects(subjectsRes.data.data || []);
        } catch (e) {
            console.error("Error fetching meta data:", e);
        }
    };

    const fetchAssignments = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page), limit, search: searchTerm,
                ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
            });
            const res = await api.get(`/homework/daily-assignments?${params}`);
            setAssignments(res.data.data);
            setPagination({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                total: res.data.total,
                from: res.data.from,
                to: res.data.to,
            });
        } catch {
            toast({ title: t("error"), description: "Failed to fetch assignments", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchAssignments(1); };

    const openAdd = () => {
        setIsEditing(false);
        setEditId(null);
        setFormData({ ...EMPTY_FORM });
        setAttachmentFile(null);
        setIsDialogOpen(true);
    };

    const openEdit = (item: Assignment) => {
        setIsEditing(true);
        setEditId(item.id);
        setFormData({
            student_id: String(item.student?.id || ""),
            student_ids: [String(item.student?.id || "")],
            class_id: String(item.class?.id || ""),
            section_id: String(item.section?.id || ""),
            subject_id: String(item.subject?.id || ""),
            title: item.title || "",
            description: item.description || "",
            submission_date: item.submission_date ? item.submission_date.split("T")[0] : "",
            evaluation_date: item.evaluation_date ? item.evaluation_date.split("T")[0] : "",
        });
        setAttachmentFile(null);
        setIsDialogOpen(true);
    };

    const openEvaluate = (item: Assignment) => {
        setEvalId(item.id);
        setEvalData({
            marks_obtained: item.marks_obtained != null ? String(item.marks_obtained) : "",
            evaluation_date: item.evaluation_date ? item.evaluation_date.split("T")[0] : new Date().toISOString().split("T")[0],
            teacher_remarks: "",
        });
        setMaxMarks(null);
        setIsEvalOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const data = new FormData();
            Object.entries(formData).forEach(([k, v]) => {
                if (k === "student_ids") {
                    if (formData.student_id === "multiple") {
                        (v as string[]).forEach(id => data.append("student_id[]", id));
                    }
                } else if (k === "student_id") {
                    if (v !== "multiple" && v !== "") {
                        data.append(k, v as string);
                    }
                } else if (v) {
                    data.append(k, v as string);
                }
            });
            if (attachmentFile) data.append("attachment", attachmentFile);

            if (isEditing && editId) {
                data.append("_method", "PUT");
                await api.post(`/homework/daily-assignments/${editId}`, data);
                toast({ title: t("success"), description: "Assignment updated successfully" });
            } else {
                await api.post("/homework/daily-assignments", data);
                toast({ title: t("success"), description: "Assignment created successfully" });
            }
            setIsDialogOpen(false);
            fetchAssignments();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast({ title: t("error"), description: e.response?.data?.message || "Failed to save assignment", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleEvaluate = async () => {
        if (!evalId) return;
        setSaving(true);
        try {
            await api.post(`/homework/daily-assignments/${evalId}/evaluate`, evalData);
            toast({ title: t("success"), description: "Assignment evaluated successfully" });
            setIsEvalOpen(false);
            fetchAssignments();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast({ title: t("error"), description: e.response?.data?.message || "Failed to evaluate", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/homework/daily-assignments/${deleteId}`);
            toast({ title: t("success"), description: "Assignment deleted successfully" });
            setIsDeleteOpen(false);
            fetchAssignments();
        } catch {
            toast({ title: t("error"), description: "Failed to delete assignment", variant: "destructive" });
        }
    };

    const handleCopy = () => {
        const text = assignments.map(a => `${a.student?.name}\t${a.title}\t${a.subject?.name}\t${a.status}`).join("\n");
        navigator.clipboard.writeText(text);
        toast({ title: t("copied"), description: t("data_copied_to_clipboard") });
    };

    const handleExportCSV = () => {
        const headers = ["Student", "Class", "Section", "Subject", "Title", "Submission Date", "Status", "Marks"];
        const rows = assignments.map(a => [a.student?.name, a.class?.name, a.section?.name, a.subject?.name, a.title, a.submission_date, a.status, a.marks_obtained ?? ""]);
        const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "daily_assignments.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toolbarActions = [
        { Icon: Copy, onClick: handleCopy, title: t("copy") },
        { Icon: FileSpreadsheet, onClick: handleExportCSV, title: t("excel") },
        { Icon: FileText, onClick: handleExportCSV, title: t("csv") },
        { Icon: Printer, onClick: () => window.print(), title: t("print") },
        { Icon: Columns, onClick: () => {}, title: t("columns") },
    ];

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">

            {/* Filter Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("select_criteria")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">Filter daily assignments by class, section, subject & date</p>
                    </div>
                </CardHeader>
                <CardContent className="p-5">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">{t("class")}</Label>
                            <Select value={filters.class_id} onValueChange={v => setFilters({ ...filters, class_id: v, section_id: "", subject_group_id: "", subject_id: "" })}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">{t("section")}</Label>
                            <Select value={filters.section_id} onValueChange={v => setFilters({ ...filters, section_id: v })}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sections</SelectItem>
                                    {filteredSections.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">{t("subject_group")}</Label>
                            <Select value={filters.subject_group_id} onValueChange={v => setFilters({ ...filters, subject_group_id: v })}>
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
                            <Select value={filters.subject_id} onValueChange={v => setFilters({ ...filters, subject_id: v })}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredSubjects.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">{t("date")}</Label>
                            <Input type="date" value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })}
                                className="h-9 border-gray-200 text-xs focus-visible:ring-indigo-500 rounded shadow-none" />
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button type="submit" className="btn-gradient gap-2 h-9 px-8 text-[11px] font-bold uppercase rounded-full shadow-md">
                                <Search className="h-3.5 w-3.5" /> {t("search")}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* List Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <ClipboardList className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("daily_assignment")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{pagination?.total ?? assignments.length} {t("records")}</p>
                        </div>
                    </div>
                    <Button onClick={openAdd} className="btn-gradient gap-2 h-8 px-4 text-[10px] font-bold uppercase rounded-full shadow-md">
                        <Plus className="h-3.5 w-3.5" /> Add Assignment
                    </Button>
                </CardHeader>
                <CardContent className="p-5">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4 border-b border-gray-50 pb-4">
                        <div className="relative w-full md:w-64">
                            <Input placeholder={t("search_in_results")} value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="pl-3 h-9 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded-full shadow-none bg-gray-50/50" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={limit} onValueChange={setLimit}>
                                <SelectTrigger className="h-7 w-16 text-[10px] border-gray-200 bg-transparent shadow-none rounded-md px-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                    <SelectItem value="200">200</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-1 text-gray-400">
                                {toolbarActions.map((action, i) => (
                                    <Button key={i} variant="ghost" size="icon" onClick={action.onClick} title={action.title}
                                        className="h-7 w-7 hover:bg-gray-100 rounded">
                                        <action.Icon className="h-3.5 w-3.5" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="rounded border border-gray-50 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">{t("student_name")}</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">{t("class")}</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">{t("section")}</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">{t("subject")}</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">{t("title")}</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">{t("submission_date")}</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Status</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Marks</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? <TableSkeleton rows={5} cols={9} /> :
                                    assignments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-72 text-center py-10">
                                                <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                                                    <Inbox className="h-16 w-16 text-gray-200" />
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-red-400">{t("no_data_available_in_table")}</p>
                                                        <p className="text-[10px] text-indigo-500 font-medium">Add assignments or search with different criteria</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : assignments.map(a => (
                                        <TableRow key={a.id} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 transition-all duration-200 whitespace-nowrap">
                                            <TableCell className="py-3 text-gray-700 font-medium">{a.student?.name}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{a.class?.name}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{a.section?.name}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{a.subject?.name}</TableCell>
                                            <TableCell className="py-3 text-gray-700 font-medium max-w-[160px] truncate">{a.title}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{formatDate(a.submission_date)}</TableCell>
                                            <TableCell className="py-3">
                                                {(() => {
                                                    const s = statusConfig[a.status || "pending"];
                                                    return (
                                                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", s.className)}>
                                                            {s.label}
                                                        </span>
                                                    );
                                                })()}
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-500">
                                                {a.marks_obtained != null ? (
                                                    <span className="font-bold text-green-700">{a.marks_obtained}</span>
                                                ) : "—"}
                                            </TableCell>
                                            <TableCell className="py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button size="icon" variant="ghost" onClick={() => { setViewAssignment(a); setIsViewOpen(true); }}
                                                        className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-sm" title="View">
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={() => openEvaluate(a)}
                                                        className="h-7 w-7 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-sm" title="Evaluate">
                                                        <Star className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={() => openEdit(a)}
                                                        className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-sm" title="Edit">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={() => { setDeleteId(a.id); setIsDeleteOpen(true); }}
                                                        className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-sm" title="Delete">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                }
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-4 border-t border-gray-50">
                        <div>{t("showing_x_to_y_of_z", { from: pagination?.from || 0, to: pagination?.to || 0, total: pagination?.total || 0 })}</div>
                        <div className="flex gap-2 items-center">
                            <Button variant="outline" size="icon" disabled={pagination?.current_page === 1}
                                onClick={() => fetchAssignments(pagination!.current_page - 1)}
                                className="h-7 w-7 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 hover:opacity-90 disabled:opacity-30">
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            {[...Array(pagination?.last_page || 0)].map((_, i) => (
                                <Button key={i + 1} onClick={() => fetchAssignments(i + 1)}
                                    className={cn("h-7 w-7 p-0 text-[11px] font-bold rounded-[10px] shadow-sm",
                                        pagination?.current_page === i + 1
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white"
                                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50")}>
                                    {i + 1}
                                </Button>
                            ))}
                            <Button variant="outline" size="icon" disabled={pagination?.current_page === pagination?.last_page}
                                onClick={() => fetchAssignments(pagination!.current_page + 1)}
                                className="h-7 w-7 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 hover:opacity-90 disabled:opacity-30">
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Add / Edit Assignment Dialog ── */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden">
                    <DialogHeader className="px-6 py-4 bg-gradient-to-r from-[#FF9800] to-[#6366F1]">
                        <DialogTitle className="text-lg font-bold text-white">
                            {isEditing ? "Edit Assignment" : "Add Daily Assignment"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 px-6 py-5 max-h-[75vh] overflow-y-auto">
                        {/* Class */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("class")} <span className="text-red-500">*</span></Label>
                            <Select value={formData.class_id}
                                onValueChange={v => setFormData({ ...formData, class_id: v, section_id: "", subject_id: "", student_id: "" })}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                    <SelectValue placeholder={t("select_class")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Section */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("section")} <span className="text-red-500">*</span></Label>
                            <Select value={formData.section_id}
                                onValueChange={v => setFormData({ ...formData, section_id: v, student_id: "" })}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                    <SelectValue placeholder={t("select_section")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {formFilteredSections.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Student */}
                        <div className="space-y-1.5 col-span-2">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">Student <span className="text-red-500">*</span></Label>
                            
                            <div className="border border-gray-200 rounded-md p-3 max-h-48 overflow-y-auto space-y-3 bg-white">
                                {!formData.class_id || !formData.section_id ? (
                                    <div className="text-sm text-gray-400">Select class & section first</div>
                                ) : (
                                    <>
                                        <div className="flex items-center space-x-2 pb-2 border-b">
                                            <Checkbox 
                                                id="all-students"
                                                checked={formData.student_id === "all"}
                                                onCheckedChange={(c) => {
                                                    if (c) setFormData({ ...formData, student_id: "all", student_ids: [] });
                                                    else setFormData({ ...formData, student_id: "" });
                                                }}
                                            />
                                            <label htmlFor="all-students" className="text-sm font-bold leading-none cursor-pointer">
                                                All Students
                                            </label>
                                        </div>
                                        {students.map(s => (
                                            <div key={s.id} className="flex items-center space-x-2">
                                                <Checkbox 
                                                    id={`student-${s.id}`}
                                                    checked={formData.student_id !== "all" && formData.student_ids?.includes(String(s.id))}
                                                    onCheckedChange={(c) => {
                                                        const current = formData.student_ids || [];
                                                        const next = c
                                                            ? [...current, String(s.id)]
                                                            : current.filter(id => id !== String(s.id));
                                                        setFormData({ 
                                                            ...formData, 
                                                            student_ids: next,
                                                            student_id: next.length > 0 ? "multiple" : "" 
                                                        });
                                                    }}
                                                />
                                                <label htmlFor={`student-${s.id}`} className="text-sm font-medium leading-none cursor-pointer">
                                                    {s.name}
                                                </label>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>
                        {/* Subject */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("subject")} <span className="text-red-500">*</span></Label>
                            <Select value={formData.subject_id} onValueChange={v => setFormData({ ...formData, subject_id: v })}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                    <SelectValue placeholder={t("select_subject")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {formFilteredSubjects.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Title */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("title")} <span className="text-red-500">*</span></Label>
                            <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="h-9 border-gray-200 text-xs shadow-none" placeholder="Assignment title" />
                        </div>
                        {/* Submission Date */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("submission_date")} <span className="text-red-500">*</span></Label>
                            <DatePicker value={formData.submission_date}
                                onChange={d => setFormData({ ...formData, submission_date: d })} />
                        </div>
                        {/* Evaluation Date */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("evaluation_date")}</Label>
                            <DatePicker value={formData.evaluation_date}
                                onChange={d => setFormData({ ...formData, evaluation_date: d })} />
                        </div>
                        {/* Attachment */}
                        <div className="space-y-1.5 col-span-2">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("attachment")}</Label>
                            <Input type="file" onChange={e => setAttachmentFile(e.target.files?.[0] || null)}
                                className="h-9 border-gray-200 text-xs shadow-none cursor-pointer p-1.5"
                                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" />
                        </div>
                        {/* Description */}
                        <div className="space-y-1.5 col-span-2">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">{t("description")}</Label>
                            <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="border-gray-200 text-xs shadow-none min-h-[80px]" placeholder="Assignment instructions..." />
                        </div>
                    </div>
                    <DialogFooter className="px-6 pb-5">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-9 text-[11px] uppercase font-bold rounded-full">{t("cancel")}</Button>
                        <Button onClick={handleSave} disabled={saving} className="btn-gradient h-9 px-8 text-[11px] uppercase font-bold rounded-full">
                            {saving ? "Saving…" : t("save")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Evaluate Dialog ── */}
            <Dialog open={isEvalOpen} onOpenChange={setIsEvalOpen}>
                <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden">
                    <DialogHeader className="px-6 py-4 bg-gradient-to-r from-green-500 to-teal-500">
                        <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" /> Evaluate Assignment
                        </DialogTitle>
                    </DialogHeader>
                    <div className="px-6 py-5 space-y-4">
                        {maxMarks != null && (
                            <p className="text-xs text-gray-500">Max marks: <span className="font-bold text-gray-800">{maxMarks}</span></p>
                        )}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">Marks Obtained <span className="text-red-500">*</span></Label>
                            <Input type="number" min="0" step="0.5"
                                value={evalData.marks_obtained}
                                onChange={e => setEvalData({ ...evalData, marks_obtained: e.target.value })}
                                className="h-9 border-gray-200 text-xs shadow-none" placeholder="Enter marks obtained" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">Evaluation Date <span className="text-red-500">*</span></Label>
                            <DatePicker value={evalData.evaluation_date}
                                onChange={d => setEvalData({ ...evalData, evaluation_date: d })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">Remarks</Label>
                            <Textarea value={evalData.teacher_remarks}
                                onChange={e => setEvalData({ ...evalData, teacher_remarks: e.target.value })}
                                className="border-gray-200 text-xs shadow-none min-h-[70px]" placeholder="Optional teacher remarks…" />
                        </div>
                    </div>
                    <DialogFooter className="px-6 pb-5">
                        <Button variant="outline" onClick={() => setIsEvalOpen(false)} className="h-9 text-[11px] uppercase font-bold rounded-full">{t("cancel")}</Button>
                        <Button onClick={handleEvaluate} disabled={saving}
                            className="h-9 px-8 text-[11px] uppercase font-bold rounded-full bg-green-500 hover:bg-green-600 text-white">
                            {saving ? "Saving…" : "Save Evaluation"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── View Dialog ── */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white">
                    <DialogHeader className="px-6 py-4 bg-gradient-to-r from-[#FF9800] to-[#6366F1]">
                        <DialogTitle className="text-lg font-bold text-white">Daily Assignment Details</DialogTitle>
                    </DialogHeader>
                    {viewAssignment && (
                        <div className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center gap-2 mb-2">
                                {(() => {
                                    const s = statusConfig[viewAssignment.status || "pending"];
                                    return <Badge className={cn("text-[10px] font-bold border", s.className)}>{s.label}</Badge>;
                                })()}
                                {viewAssignment.marks_obtained != null && (
                                    <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] font-bold">
                                        Marks: {viewAssignment.marks_obtained}
                                    </Badge>
                                )}
                            </div>
                            <div className="col-span-2 border-b pb-2">
                                <span className="font-bold text-gray-500 uppercase block mb-1">{t("title")}</span>
                                <span className="text-gray-900 font-bold text-sm">{viewAssignment.title || "—"}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="font-bold text-gray-500 uppercase block mb-1">Student</span>
                                    <span className="text-gray-900 font-medium">{viewAssignment.student?.name || "—"}</span>
                                </div>
                                <div>
                                    <span className="font-bold text-gray-500 uppercase block mb-1">Class / Section</span>
                                    <span className="text-gray-900 font-medium">{(viewAssignment.class?.name || "—")} ({viewAssignment.section?.name || "—"})</span>
                                </div>
                                <div>
                                    <span className="font-bold text-gray-500 uppercase block mb-1">{t("subject")}</span>
                                    <span className="text-gray-900 font-medium">{viewAssignment.subject?.name || "—"}</span>
                                </div>
                                <div>
                                    <span className="font-bold text-gray-500 uppercase block mb-1">{t("submission_date")}</span>
                                    <span className="text-gray-900 font-medium">{viewAssignment.submission_date ? formatDate(viewAssignment.submission_date) : "—"}</span>
                                </div>
                                <div>
                                    <span className="font-bold text-gray-500 uppercase block mb-1">{t("evaluation_date")}</span>
                                    <span className="text-gray-900 font-medium">{viewAssignment.evaluation_date ? formatDate(viewAssignment.evaluation_date) : "—"}</span>
                                </div>
                                <div>
                                    <span className="font-bold text-gray-500 uppercase block mb-1">{t("evaluated_by")}</span>
                                    <span className="text-gray-900 font-medium">{viewAssignment.evaluator?.name || "—"}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="font-bold text-gray-500 uppercase block mb-1">{t("description")}</span>
                                    {viewAssignment.description
                                        ? <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{viewAssignment.description}</p>
                                        : <p className="text-gray-400 italic">No description provided</p>
                                    }
                                </div>
                                {viewAssignment.attachment && (
                                    <div className="col-span-2">
                                        <span className="font-bold text-gray-500 uppercase block mb-1">{t("attachment")}</span>
                                        <a href={getAttachmentUrl(viewAssignment.attachment)} target="_blank" rel="noopener noreferrer"
                                            className="text-indigo-600 hover:underline font-medium inline-flex items-center gap-1">
                                            <Paperclip className="h-3.5 w-3.5" /> Download Attachment
                                        </a>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button onClick={() => { setIsViewOpen(false); openEvaluate(viewAssignment); }}
                                    className="h-8 px-5 text-[11px] rounded-full bg-green-500 hover:bg-green-600 text-white">
                                    <Star className="h-3.5 w-3.5 mr-1" /> Evaluate
                                </Button>
                                <Button onClick={() => setIsViewOpen(false)}
                                    className="h-8 px-5 text-[11px] rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-90">
                                    {t("close")}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirm ── */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
