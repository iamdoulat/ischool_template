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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    Inbox,
    Filter,
    ClipboardList
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

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
    student?: { name: string };
    class?: { name: string };
    section?: { name: string };
    subject?: { name: string };
    evaluator?: { name: string };
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
}

export default function DailyAssignmentPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [limit, setLimit] = useState("50");

    const [classes, setClasses] = useState<OptionItem[]>([]);
    const [sections, setSections] = useState<OptionItem[]>([]);
    const [subjectGroups, setSubjectGroups] = useState<OptionItem[]>([]);
    const [subjects, setSubjects] = useState<OptionItem[]>([]);

    const [filters, setFilters] = useState({
        class_id: "",
        section_id: "",
        subject_group_id: "",
        subject_id: "",
        date: new Date().toISOString().split('T')[0]
    });

    const filteredSections = filters.class_id
        ? sections.filter(s => String(s.school_class_id) === filters.class_id)
        : sections;
    const filteredSubjectGroups = filters.class_id
        ? subjectGroups.filter(sg => String(sg.school_class_id) === filters.class_id)
        : subjectGroups;
    const filteredSubjects = filters.class_id
        ? subjects.filter(s => String(s.school_class_id) === filters.class_id)
        : subjects;

    const { t } = useTranslation();

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchAssignments(1);
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

    const fetchAssignments = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit,
                search: searchTerm,
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
            });
            const response = await api.get(`/homework/daily-assignments?${params.toString()}`);
            setAssignments(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
        } catch (error) {
            console.error("Error fetching assignments:", error);
            toast({ title: t("error"), description: t("failed_to_fetch_assignments"), variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchAssignments(1);
    };

    const handleCopy = () => {
        const text = assignments.map(a => `${a.student?.name}\t${a.title}\t${a.subject?.name}`).join('\n');
        navigator.clipboard.writeText(text);
        toast({ title: t("copied"), description: t("data_copied_to_clipboard") });
    };

    const handleExportCSV = () => {
        const headers = [t("student_name"), t("class"), t("section"), t("subject"), t("title"), t("submission_date")];
        const rows = assignments.map(a => [a.student?.name, a.class?.name, a.section?.name, a.subject?.name, a.title, a.submission_date]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "daily_assignments.csv");
        link.style.visibility = 'hidden';
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
            {/* Select Criteria Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Filter className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("select_criteria")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{t("filter_daily_assignments")}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
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
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                {t("section")} <span className="text-red-500">*</span>
                            </Label>
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
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                {t("subject_group")} <span className="text-red-500">*</span>
                            </Label>
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
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                {t("subject")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={filters.subject_id} onValueChange={(v) => setFilters({ ...filters, subject_id: v })}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredSubjects.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                {t("date")} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="date"
                                value={filters.date}
                                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                                className="h-9 border-gray-200 text-xs focus-visible:ring-indigo-500 rounded shadow-none"
                            />
                        </div>

                        <div className="flex justify-end pt-2 md:col-span-5">
                            <Button type="submit" className="btn-gradient gap-2 h-9 px-8 text-[11px] font-bold uppercase transition-all rounded-full shadow-md">
                                <Search className="h-3.5 w-3.5" /> {t("search")}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Daily Assignment List Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <ClipboardList className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("daily_assignment")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{pagination?.total ?? assignments.length} {t("records")}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-5">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4 border-b border-gray-50 pb-4">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder={t("search_in_results")}
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
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">{t("evaluation_date")}</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">{t("evaluated_by")}</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableSkeleton rows={5} cols={9} />
                                ) : assignments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-72 text-center py-10">
                                            <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                                                <Inbox className="h-16 w-16 text-gray-200" />
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-red-400">{t("no_data_available_in_table")}</p>
                                                    <p className="text-[10px] text-indigo-500 font-medium">{t("search_with_criteria_to_see_results")}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    assignments.map((a) => (
                                        <TableRow key={a.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                            <TableCell className="py-3 text-gray-700 font-medium">{a.student?.name}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{a.class?.name}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{a.section?.name}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{a.subject?.name}</TableCell>
                                            <TableCell className="py-3 text-gray-700">{a.title}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{formatDate(a.submission_date)}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{a.evaluation_date ? formatDate(a.evaluation_date) : "-"}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{a.evaluator?.name || "-"}</TableCell>
                                            <TableCell className="py-3 text-right">
                                                <Button size="icon" variant="ghost" className="h-7 w-7 bg-indigo-500 text-white rounded-full shadow-md hover:bg-indigo-600">
                                                    <Search className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
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
                                onClick={() => fetchAssignments(pagination!.current_page - 1)}
                                className="h-7 w-7 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shadow-none disabled:opacity-30"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            {[...Array(pagination?.last_page || 0)].map((_, i) => (
                                <Button
                                    key={i + 1}
                                    onClick={() => fetchAssignments(i + 1)}
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
                                onClick={() => fetchAssignments(pagination!.current_page + 1)}
                                className="h-7 w-7 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shadow-none disabled:opacity-30"
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
