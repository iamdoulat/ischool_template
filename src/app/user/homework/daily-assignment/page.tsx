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
    pending:   { label: "Pending",     className: "bg-amber-100 text-amber-700 border-amber-200" },
    submitted: { label: "Submitted",   className: "bg-blue-100 text-blue-700 border-blue-200" },
    evaluated: { label: "Evaluated",   className: "bg-green-100 text-green-700 border-green-200" },
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
        } catch (err: any) {
            toast({ variant: "destructive", title: t("error"), description: err.response?.data?.message || "Failed to submit assignment" });
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

    const statusBadge = (status: string) => {
        const s = statusConfig[status || "pending"];
        return (
            <Badge className={cn("border font-medium", s?.className)}>
                {s?.label || status}
            </Badge>
        );
    };

    return (
        <div className="p-4 lg:p-6 animate-in fade-in duration-500">
            <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden p-0 gap-0">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <ClipboardList className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none truncate">My Daily Assignments</h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {loading ? t("loading") : `${total} assignment${total === 1 ? "" : "s"}`}
                            </p>
                        </div>
                    </div>
                </div>

                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4 print:hidden">
                        <div className="relative w-full sm:w-64 group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            </div>
                            <Input
                                placeholder={t("search")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-9 text-xs border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium text-gray-500 uppercase hidden sm:inline">Rows per page:</span>
                                <Select value={limit.toString()} onValueChange={(v) => setLimit(Number(v))}>
                                    <SelectTrigger className="h-7 w-[60px] text-xs border-gray-200 bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PAGE_SIZES.map((s) => (
                                            <SelectItem key={s} value={s.toString()} className="text-xs">{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button variant="ghost" size="icon" onClick={copyToClipboard} title="Copy" className="h-7 w-7 hover:bg-gray-100 rounded">
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={exportToExcel} title="Excel" className="h-7 w-7 hover:bg-gray-100 rounded">
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={exportToPDF} title="PDF" className="h-7 w-7 hover:bg-gray-100 rounded">
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto min-h-[400px]">
                        <Table>
                            <TableHeader className="bg-gray-50/80">
                                <TableRow className="hover:bg-transparent border-b border-gray-100">
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-500 py-3">{t("class")}</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-500 py-3">{t("subject")}</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-500 py-3">{t("title")}</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-500 py-3">{t("submission_date")}</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-500 py-3">Status</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-500 py-3">Marks</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-500 py-3 text-right">{t("action") || "Action"}</TableHead>
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
                                        <td colSpan={7} className="py-20 text-center text-[11px] font-medium text-gray-400">
                                            {searchTerm ? "No assignments found matching your search." : "No daily assignments found."}
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) => (
                                        <TableRow key={item.id} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 transition-colors">
                                            <TableCell className="py-3 text-gray-600 font-medium">
                                                {item.class?.name} ({item.section?.name})
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-600">{item.subject?.name}</TableCell>
                                            <TableCell className="py-3 text-gray-800 font-medium max-w-[200px] truncate">{item.title}</TableCell>
                                            <TableCell className="py-3 text-gray-500">{fmt(item.submission_date)}</TableCell>
                                            <TableCell className="py-3">
                                                {statusBadge(item.status)}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                {item.marks_obtained != null ? (
                                                    <span className="font-bold text-green-700">{item.marks_obtained}</span>
                                                ) : "—"}
                                            </TableCell>
                                            <TableCell className="py-3 text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => openView(item)}
                                                    className="h-7 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 text-[10px] font-bold rounded shadow-sm px-3"
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
                    
                    {/* Pagination */}
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                        <div className="text-[10px] text-gray-500 font-medium">
                            Total {total} items
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" disabled={page === 1}
                                onClick={() => fetchAssignments(page - 1, limit)}
                                className="h-7 w-7 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 hover:opacity-90 disabled:opacity-30">
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            {pageNumbers.map((p, i) => (
                                <Button key={i} onClick={() => p !== "…" && fetchAssignments(p as number, limit)}
                                    className={cn("h-7 w-7 p-0 text-[11px] font-bold rounded-[10px] shadow-sm",
                                        page === p ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50",
                                        p === "…" && "pointer-events-none bg-transparent border-0 shadow-none text-gray-400"
                                    )}>
                                    {p}
                                </Button>
                            ))}
                            <Button variant="outline" size="icon" disabled={page === lastPage}
                                onClick={() => fetchAssignments(page + 1, limit)}
                                className="h-7 w-7 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 hover:opacity-90 disabled:opacity-30">
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
                    <DialogHeader className="px-6 py-4 bg-gradient-to-r from-[#FF9800] to-[#6366F1]">
                        <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                            {selected?.title}
                            {selected && statusBadge(selected.status)}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="p-6 max-h-[75vh] overflow-y-auto">
                        {selected && (
                            <div className="space-y-6">
                                {/* Assignment Details */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Subject</div>
                                        <div className="text-xs font-semibold text-gray-700">{selected.subject?.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Due Date</div>
                                        <div className="text-xs font-semibold text-gray-700">{fmt(selected.submission_date)}</div>
                                    </div>
                                    {selected.attachment && (
                                        <div className="col-span-2 md:col-span-2 flex items-center justify-end">
                                            <a href={getAttachmentUrl(selected.attachment)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors">
                                                <Paperclip className="h-3.5 w-3.5" />
                                                Download Assignment
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Layers className="h-3.5 w-3.5" /> Assignment Instructions
                                    </div>
                                    <div className="text-sm text-gray-600 leading-relaxed bg-white p-4 rounded-xl border border-gray-100 whitespace-pre-wrap">
                                        {selected.description || "No description provided."}
                                    </div>
                                </div>

                                {/* Evaluation Details (if evaluated) */}
                                {selected.status === 'evaluated' && (
                                    <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                                        <h3 className="text-sm font-bold text-green-800 flex items-center gap-2 mb-3">
                                            <Star className="h-4 w-4" /> Evaluation Result
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-[10px] uppercase font-bold text-green-600/70 mb-1">Marks Obtained</div>
                                                <div className="text-xl font-black text-green-700">{selected.marks_obtained}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase font-bold text-green-600/70 mb-1">Evaluated On</div>
                                                <div className="text-xs font-medium text-green-800">{fmt(selected.evaluation_date)}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Student Submission Area */}
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <User className="h-3.5 w-3.5" /> Your Submission
                                    </div>
                                    
                                    {selected.status === 'evaluated' ? (
                                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                                            {selected.student_answer && (
                                                <div className="text-sm text-gray-600 whitespace-pre-wrap">{selected.student_answer}</div>
                                            )}
                                            {selected.submission_file && (
                                                <a href={getAttachmentUrl(selected.submission_file)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:underline">
                                                    <Paperclip className="h-3.5 w-3.5" /> View Submitted File
                                                </a>
                                            )}
                                        </div>
                                    ) : (
                                        <form onSubmit={handleFormSubmit} className="space-y-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-gray-600">Answer Text</Label>
                                                <Textarea 
                                                    value={studentAnswer}
                                                    onChange={e => setStudentAnswer(e.target.value)}
                                                    placeholder="Type your answer here..."
                                                    className="min-h-[120px] text-sm rounded-xl"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-gray-600">Attach File (Optional)</Label>
                                                <div className="flex items-center gap-3">
                                                    <Input 
                                                        type="file" 
                                                        onChange={e => setSubmissionFile(e.target.files?.[0] || null)}
                                                        className="text-xs file:bg-indigo-50 file:text-indigo-700 file:border-0 file:mr-4 file:px-4 file:py-1 file:rounded-full hover:file:bg-indigo-100 file:transition-colors file:text-xs file:font-bold h-10 w-full rounded-xl"
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
