"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Search, ChevronLeft, ChevronRight, Copy, FileSpreadsheet,
    FileDown, Printer, Eye, Loader2, BookOpen, X, Calendar, User,
    Paperclip, ClipboardList, Layers, Send, CheckCircle2, Star,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { cn, formatDate } from "@/lib/utils";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type DailyAssignment = {
    id: number;
    class: { name: string };
    section: { name: string };
    subject: { name: string };
    title: string;
    description: string;
    submission_date: string;
    evaluation_date: string;
    marks_obtained?: number | null;
    attachment: string;
    evaluator?: { name: string };
    status: "pending" | "submitted" | "evaluated";
    student_answer?: string;
    submission_file?: string;
    submitted_at?: string;
};

const PAGE_SIZES = [10, 25, 50, 100];
const fmt = (d: string) => (d ? formatDate(d) : "—");

const getAttachmentUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
    const origin = baseApiUrl.replace(/\/api\/v1\/?$/, "").replace(/\/api\/?$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${origin}${normalizedPath}`;
};

const statusConfig: Record<string, { label: string; className: string }> = {
    pending:   { label: "Pending",     className: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800" },
    submitted: { label: "Submitted",   className: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
    evaluated: { label: "Evaluated",   className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
};

export default function StudentDailyAssignmentPage() {
    const { t } = useTranslation();
    const { toast } = useToast();

    const [items, setItems] = useState<DailyAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [limit, setLimit] = useState(25);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);

    // View / Submit state
    const [selected, setSelected] = useState<DailyAssignment | null>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);
    
    const [submitting, setSubmitting] = useState(false);
    const [studentAnswer, setStudentAnswer] = useState("");
    const [submissionFile, setSubmissionFile] = useState<File | null>(null);

    const fetchAssignments = useCallback(async (p: number = page, l: number = limit) => {
        setLoading(true);
        try {
            const res = await api.get("/homework/daily-assignments", {
                params: { page: p, limit: l, search: searchTerm },
            });
            const d = res.data;
            setItems(d?.data ?? []);
            setLastPage(d?.last_page ?? 1);
            setTotal(d?.total ?? 0);
            setPage(p);
        } catch {
            toast({ variant: "destructive", title: t("error"), description: "Failed to load daily assignments" });
        } finally {
            setLoading(false);
        }
    }, [searchTerm, page, limit, toast, t]);

    useEffect(() => {
        fetchAssignments(1, limit);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [limit]);

    // Re-fetch on search debounced
    useEffect(() => {
        const to = setTimeout(() => {
            fetchAssignments(1, limit);
        }, 500);
        return () => clearTimeout(to);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    const openView = (item: DailyAssignment) => {
        setSelected(item);
        setStudentAnswer(item.student_answer || "");
        setSubmissionFile(null);
        setIsViewOpen(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected) return;

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("student_answer", studentAnswer);
            if (submissionFile) {
                formData.append("submission_file", submissionFile);
            }

            const res = await api.post(`/homework/daily-assignments/${selected.id}/submit`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            
            toast({ title: t("success"), description: "Assignment submitted successfully!" });
            
            // Update local item
            setItems(prev => prev.map(i => i.id === selected.id ? res.data.data : i));
            setSelected(res.data.data);
            setIsViewOpen(false);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast({ variant: "destructive", title: t("error"), description: e.response?.data?.message || "Failed to submit assignment" });
        } finally {
            setSubmitting(false);
        }
    };

    const exportRows = useCallback(() => {
        return items.map((h) => ({
            [t("class")]: h.class?.name,
            [t("section")]: h.section?.name,
            [t("subject")]: h.subject?.name,
            [t("title") || "Title"]: h.title || "—",
            [t("submission_date")]: fmt(h.submission_date),
            ["Status"]: h.status,
            ["Marks"]: h.marks_obtained != null ? h.marks_obtained : "—",
        }));
    }, [items, t]);

    const copyToClipboard = useCallback(() => {
        const text = exportRows().map((r) => Object.values(r).join("\t")).join("\n");
        navigator.clipboard.writeText(text);
        toast({ title: t("copied_to_clipboard") });
    }, [exportRows, toast, t]);

    const exportToExcel = useCallback(() => {
        const ws = XLSX.utils.json_to_sheet(exportRows());
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "DailyAssignments");
        XLSX.writeFile(wb, "daily_assignments.xlsx");
    }, [exportRows]);

    const exportToPDF = useCallback(() => {
        const doc = new jsPDF("l");
        doc.text("Daily Assignments", 14, 16);
        autoTable(doc, {
            head: [["Class", "Section", "Subject", "Title", "Submission Date", "Status", "Marks"]],
            body: items.map((h) => [
                h.class?.name, h.section?.name, h.subject?.name, h.title || "—", 
                fmt(h.submission_date), h.status, h.marks_obtained != null ? String(h.marks_obtained) : "—",
            ]),
            startY: 22,
            styles: { fontSize: 8 },
        });
        doc.save("daily_assignments.pdf");
    }, [items]);

    const pageNumbers = Array.from({ length: lastPage }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === lastPage || Math.abs(p - page) <= 1)
        .reduce<(number | "…")[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
            acc.push(p);
            return acc;
        }, []);

    const statusBadge = (status: string, marks?: number | null) => {
        const s = statusConfig[status || "pending"];
        return (
            <Badge className={cn("border font-semibold text-[11px] gap-1", s?.className)}>
                {status === "evaluated" && <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" />}
                {status === "submitted" && <CheckCircle2 className="h-3 w-3" />}
                {s?.label || status} {marks != null ? `(${marks})` : ""}
            </Badge>
        );
    };

    return (
        /* pb-32 sm:pb-16 ensures mobile navbar never overlaps daily assignment cards / table */
        <div className="p-3 sm:p-5 lg:p-6 animate-in fade-in duration-500 max-w-7xl mx-auto space-y-6 pb-32 sm:pb-16">
            <Card className="shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden p-0 gap-0">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <ClipboardList className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-[16px] font-bold text-gray-800 dark:text-gray-100 tracking-tight leading-none truncate">
                                My Daily Assignments
                            </h1>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                {loading ? t("loading") : `${total} assignment${total === 1 ? "" : "s"}`}
                            </p>
                        </div>
                    </div>
                </div>

                <CardContent className="p-3 sm:p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-3 print:hidden">
                        <div className="relative w-full sm:w-64 group">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder={t("search")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 h-9 text-sm rounded-[10px]"
                            />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
                            <Select value={limit.toString()} onValueChange={(v) => setLimit(Number(v))}>
                                <SelectTrigger className="h-9 w-[70px] text-[12px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-[10px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAGE_SIZES.map((s) => (
                                        <SelectItem key={s} value={s.toString()} className="text-xs">{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-[10px] overflow-hidden bg-white dark:bg-gray-800">
                                <Button variant="ghost" size="icon" onClick={copyToClipboard} title="Copy" className="h-9 w-9 rounded-none hover:bg-gray-100 dark:hover:bg-gray-700 border-r border-gray-200 dark:border-gray-700">
                                    <Copy className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={exportToExcel} title="Excel" className="h-9 w-9 rounded-none hover:bg-gray-100 dark:hover:bg-gray-700 border-r border-gray-200 dark:border-gray-700">
                                    <FileSpreadsheet className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={exportToPDF} title="PDF" className="h-9 w-9 rounded-none hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <Printer className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto print:hidden">
                        <Table>
                            <TableHeader className="bg-gray-50/90 dark:bg-gray-800/80">
                                <TableRow className="hover:bg-transparent border-b border-gray-200 dark:border-gray-700">
                                    <TableHead className="text-[11px] font-bold uppercase text-gray-600 dark:text-gray-300 py-3">{t("class")}</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase text-gray-600 dark:text-gray-300 py-3">{t("subject")}</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase text-gray-600 dark:text-gray-300 py-3">{t("title")}</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase text-gray-600 dark:text-gray-300 py-3">{t("submission_date")}</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase text-gray-600 dark:text-gray-300 py-3 text-center">Status</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase text-gray-600 dark:text-gray-300 py-3 text-center">Marks</TableHead>
                                    <TableHead className="text-[11px] font-bold uppercase text-gray-600 dark:text-gray-300 py-3 text-right">{t("action") || "Action"}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                                                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                                                <span className="text-xs">Loading assignments...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : items.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center text-[12px] font-medium text-gray-400">
                                            {searchTerm ? "No assignments found matching your search." : "No daily assignments found."}
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) => (
                                        <TableRow key={item.id} className="text-[13px] border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                                            <TableCell className="py-3.5 text-gray-700 dark:text-gray-300 font-medium">
                                                {item.class?.name} ({item.section?.name})
                                            </TableCell>
                                            <TableCell className="py-3.5 text-gray-800 dark:text-gray-200 font-semibold">{item.subject?.name}</TableCell>
                                            <TableCell className="py-3.5 text-gray-800 dark:text-gray-200 font-medium max-w-[200px] truncate">{item.title}</TableCell>
                                            <TableCell className="py-3.5 text-gray-500 dark:text-gray-400">{fmt(item.submission_date)}</TableCell>
                                            <TableCell className="py-3.5 text-center">
                                                {statusBadge(item.status, item.marks_obtained)}
                                            </TableCell>
                                            <TableCell className="py-3.5 text-center">
                                                {item.marks_obtained != null ? (
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{item.marks_obtained}</span>
                                                ) : "—"}
                                            </TableCell>
                                            <TableCell className="py-3.5 text-right">
                                                <Button
                                                    size="sm"
                                                    onClick={() => openView(item)}
                                                    className="h-7 bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 text-[11px] font-bold rounded-lg px-3 shadow-xs"
                                                >
                                                    {item.status === 'evaluated' ? 'View Result' : 'View / Submit'}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3 print:hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
                                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                                <span>Loading...</span>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                                <BookOpen className="h-8 w-8 opacity-30" />
                                <span className="text-sm">No daily assignments found</span>
                            </div>
                        ) : (
                            items.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => openView(item)}
                                    className="w-full text-left rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3.5 shadow-xs hover:shadow-md active:scale-[0.99] transition-all"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800]/10 to-[#6366F1]/10">
                                                <BookOpen className="h-4 w-4 text-[#6366F1]" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-[13.5px] font-bold text-gray-800 dark:text-gray-100 truncate">{item.title}</p>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                                    <Layers className="h-3 w-3" />
                                                    {item.subject?.name} · {item.class?.name} ({item.section?.name})
                                                </p>
                                            </div>
                                        </div>
                                        {statusBadge(item.status, item.marks_obtained)}
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11.5px] text-gray-500 dark:text-gray-400 bg-gray-50/80 dark:bg-gray-800/40 rounded-lg p-2.5 border border-gray-100 dark:border-gray-800">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                            Due: <span className="font-semibold text-gray-700 dark:text-gray-200">{fmt(item.submission_date)}</span>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Star className="h-3.5 w-3.5 text-gray-400" />
                                            Marks: <span className="font-bold text-emerald-600 dark:text-emerald-400">{item.marks_obtained != null ? item.marks_obtained : "—"}</span>
                                        </span>
                                    </div>
                                    <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                        <span className="text-[11px] text-gray-400">
                                            {item.attachment ? t("has_attachment") : t("tap_to_view_details")}
                                        </span>
                                        <span className="flex items-center gap-1 text-[11.5px] font-bold text-[#6366F1]">
                                            <Eye className="h-3.5 w-3.5" /> {item.status === 'evaluated' ? 'View Result' : 'View / Submit'}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                    
                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3 print:hidden">
                        <div className="text-[12px] text-gray-500 dark:text-gray-400">
                            Total {total} items
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" disabled={page === 1}
                                onClick={() => fetchAssignments(page - 1, limit)}
                                className="h-8 w-8 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 hover:opacity-90 disabled:opacity-30">
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            {pageNumbers.map((p, i) => (
                                <Button key={i} onClick={() => p !== "…" && fetchAssignments(p as number, limit)}
                                    className={cn("h-8 w-8 p-0 text-[11px] font-bold rounded-[10px] shadow-sm",
                                        page === p ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50",
                                        p === "…" && "pointer-events-none bg-transparent border-0 shadow-none text-gray-400"
                                    )}>
                                    {p}
                                </Button>
                            ))}
                            <Button variant="outline" size="icon" disabled={page === lastPage}
                                onClick={() => fetchAssignments(page + 1, limit)}
                                className="h-8 w-8 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 hover:opacity-90 disabled:opacity-30">
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                    <DialogHeader className="px-6 py-4 bg-gradient-to-r from-[#FF9800] to-[#6366F1]">
                        <DialogTitle className="text-lg font-bold text-white flex items-center justify-between gap-2">
                            <span className="truncate">{selected?.title}</span>
                            {selected && statusBadge(selected.status, selected.marks_obtained)}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="p-6 max-h-[75vh] overflow-y-auto">
                        {selected && (
                            <div className="space-y-6">
                                {/* Assignment Details */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Subject</div>
                                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">{selected.subject?.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Due Date</div>
                                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">{fmt(selected.submission_date)}</div>
                                    </div>
                                    {selected.attachment && (
                                        <div className="col-span-2 md:col-span-2 flex items-center justify-end">
                                            <a href={getAttachmentUrl(selected.attachment)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors">
                                                <Paperclip className="h-3.5 w-3.5" />
                                                Download Assignment
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Layers className="h-3.5 w-3.5 text-indigo-500" /> Assignment Instructions
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed bg-white dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800 whitespace-pre-wrap">
                                        {selected.description || "No description provided."}
                                    </div>
                                </div>

                                {/* Evaluation Details (if evaluated) */}
                                {selected.status === 'evaluated' && (
                                    <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                                        <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 mb-3">
                                            <Star className="h-4 w-4 fill-emerald-500 text-emerald-500" /> Evaluation Result
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-[10px] uppercase font-bold text-emerald-600/80 dark:text-emerald-400 mb-1">Marks Obtained</div>
                                                <div className="text-xl font-black text-emerald-700 dark:text-emerald-300">{selected.marks_obtained}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase font-bold text-emerald-600/80 dark:text-emerald-400 mb-1">Evaluated On</div>
                                                <div className="text-xs font-medium text-emerald-800 dark:text-emerald-200">{fmt(selected.evaluation_date)}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Student Submission Area */}
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <User className="h-3.5 w-3.5 text-sky-500" /> Your Submission
                                    </div>
                                    
                                    {selected.status === 'evaluated' ? (
                                        <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-3">
                                            {selected.student_answer && (
                                                <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{selected.student_answer}</div>
                                            )}
                                            {selected.submission_file && (
                                                <a href={getAttachmentUrl(selected.submission_file)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                                    <Paperclip className="h-3.5 w-3.5" /> View Submitted File
                                                </a>
                                            )}
                                        </div>
                                    ) : (
                                        <form onSubmit={handleFormSubmit} className="space-y-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-gray-600 dark:text-gray-300">Answer Text</Label>
                                                <Textarea 
                                                    value={studentAnswer}
                                                    onChange={e => setStudentAnswer(e.target.value)}
                                                    placeholder="Type your answer here..."
                                                    className="min-h-[120px] text-sm rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-gray-600 dark:text-gray-300">Attach File (Optional)</Label>
                                                <div className="flex items-center gap-3">
                                                    <Input 
                                                        type="file" 
                                                        onChange={e => setSubmissionFile(e.target.files?.[0] || null)}
                                                        className="text-xs file:bg-indigo-50 file:text-indigo-700 file:border-0 file:mr-4 file:px-4 file:py-1 file:rounded-full hover:file:bg-indigo-100 file:transition-colors file:text-xs file:font-bold h-10 w-full rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                                                    />
                                                    {selected.submission_file && !submissionFile && (
                                                        <a href={getAttachmentUrl(selected.submission_file)} target="_blank" rel="noreferrer" className="shrink-0 text-[10px] font-bold text-indigo-600 underline">
                                                            Current File
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex justify-end pt-2">
                                                <Button type="submit" disabled={submitting} className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-90 rounded-full shadow-md px-6">
                                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                                    Submit Assignment
                                                </Button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
