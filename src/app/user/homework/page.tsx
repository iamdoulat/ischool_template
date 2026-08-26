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
    AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { cn, formatDate } from "@/lib/utils";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Homework = {
    id: number;
    class: string;
    section: string;
    subject: string;
    title?: string;
    homework_date: string;
    submission_date: string;
    evaluation_date: string;
    max_marks?: number | null;
    marks_obtained?: number | null;
    teacher_remarks?: string;
    description: string;
    attachment: string;
    created_by: string;
    status: string;
    submission_status?: string;
};

type Submission = {
    id?: number;
    status: "pending" | "submitted" | "evaluated";
    student_answer?: string;
    submission_file?: string;
    submitted_at?: string;
    marks_obtained?: number | null;
    evaluation_date?: string;
    teacher_remarks?: string;
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

const submissionStatusConfig: Record<string, { label: string; className: string }> = {
    pending:   { label: "Not Submitted", className: "bg-amber-100 text-amber-700 border-amber-200" },
    submitted: { label: "Submitted",     className: "bg-blue-100 text-blue-700 border-blue-200" },
    evaluated: { label: "Evaluated",     className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

export default function UserHomeworkPage() {
    const { t } = useTranslation();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState<"upcoming" | "closed">("upcoming");
    const [items, setItems] = useState<Homework[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [limit, setLimit] = useState(10);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [from, setFrom] = useState(0);
    const [to, setTo] = useState(0);

    // View detail
    const [selected, setSelected] = useState<Homework | null>(null);

    // Submission state
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [loadingSubmission, setLoadingSubmission] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [studentAnswer, setStudentAnswer] = useState("");
    const [submissionFile, setSubmissionFile] = useState<File | null>(null);
    const [showSubmitForm, setShowSubmitForm] = useState(false);

    const fetchHomework = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/user/homework", {
                params: { type: activeTab, page, limit },
            });
            if (res.data.success) {
                const d = res.data.data;
                setItems(d?.data ?? []);
                setLastPage(d?.last_page ?? 1);
                setTotal(d?.total ?? 0);
                setFrom(d?.from ?? 0);
                setTo(d?.to ?? 0);
            } else {
                toast({ variant: "destructive", title: t("error"), description: res.data.message });
            }
        } catch {
            toast({ variant: "destructive", title: t("error"), description: t("failed_to_load_homework") });
        } finally {
            setLoading(false);
        }
    }, [activeTab, page, limit, toast, t]);

    useEffect(() => {
        fetchHomework();
    }, [fetchHomework]);

    // When a homework is selected, fetch submission status
    useEffect(() => {
        if (!selected) {
            setSubmission(null);
            setShowSubmitForm(false);
            setStudentAnswer("");
            setSubmissionFile(null);
            return;
        }
        const fetchSubmission = async () => {
            setLoadingSubmission(true);
            try {
                const res = await api.get(`/user/homework/${selected.id}/submission`);
                setSubmission(res.data.data || null);
            } catch {
                setSubmission(null);
            } finally {
                setLoadingSubmission(false);
            }
        };
        fetchSubmission();
    }, [selected]);

    const switchTab = (tab: "upcoming" | "closed") => {
        setActiveTab(tab);
        setPage(1);
        setSearchTerm("");
    };

    const handleSubmit = async () => {
        if (!selected) return;
        setSubmitting(true);
        try {
            const formData = new FormData();
            if (studentAnswer) formData.append("student_answer", studentAnswer);
            if (submissionFile) formData.append("submission_file", submissionFile);

            const res = await api.post(`/user/homework/${selected.id}/submit`, formData);
            setSubmission(res.data.data);
            setShowSubmitForm(false);
            toast({ title: t("success"), description: "Homework submitted successfully!" });
            fetchHomework();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            toast({ variant: "destructive", title: t("error"), description: e.response?.data?.message || "Submission failed" });
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = items.filter((h) => {
        const s = searchTerm.toLowerCase();
        return (
            h.subject.toLowerCase().includes(s) ||
            h.class.toLowerCase().includes(s) ||
            h.section.toLowerCase().includes(s) ||
            h.created_by.toLowerCase().includes(s)
        );
    });

    const exportRows = () =>
        filtered.map((h) => ({
            "Class": h.class,
            "Section": h.section,
            "Subject": h.subject,
            "Title": h.title || "—",
            "Homework Date": fmt(h.homework_date),
            "Submission Date": fmt(h.submission_date),
            "Max Marks": h.max_marks !== null && h.max_marks !== undefined ? String(h.max_marks) : "—",
            "Marks Obtained": h.marks_obtained !== null && h.marks_obtained !== undefined ? String(h.marks_obtained) : "—",
            "Created By": h.created_by,
            "Status": h.status,
        }));

    const copyToClipboard = useCallback(() => {
        const text = exportRows().map((r) => Object.values(r).join("\t")).join("\n");
        navigator.clipboard.writeText(text);
        toast({ title: t("copied_to_clipboard") });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtered, toast]);

    const exportToExcel = useCallback(() => {
        const ws = XLSX.utils.json_to_sheet(exportRows());
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Homework");
        XLSX.writeFile(wb, "homework.xlsx");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtered]);

    const exportToPDF = useCallback(() => {
        const doc = new jsPDF("l");
        doc.text("Homework", 14, 16);
        autoTable(doc, {
            head: [["Class", "Section", "Subject", "Title", "HW Date", "Submission", "Max Marks", "Marks", "Status"]],
            body: filtered.map((h) => [
                h.class, h.section, h.subject, h.title || "—", fmt(h.homework_date),
                fmt(h.submission_date), h.max_marks != null ? String(h.max_marks) : "—",
                h.marks_obtained != null ? String(h.marks_obtained) : "—", h.status,
            ]),
            startY: 22,
            styles: { fontSize: 8 },
        });
        doc.save("homework.pdf");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtered]);

    const pageNumbers = Array.from({ length: lastPage }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === lastPage || Math.abs(p - page) <= 1)
        .reduce<(number | "…")[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
            acc.push(p);
            return acc;
        }, []);

    const statusBadge = (status: string, marks?: number | null, maxMarks?: number | null) => {
        if (status === "Completed" || status === "Closed") {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed
                </span>
            );
        }
        if (status === "Evaluated") {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                    Evaluated {marks !== null && marks !== undefined ? `(${marks}${maxMarks ? `/${maxMarks}` : ""})` : ""}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Pending
            </span>
        );
    };

    const submissionBadge = (sub: Submission | null) => {
        const cfg = submissionStatusConfig[sub?.status || "pending"];
        return (
            <span className={cn("text-[11px] font-bold px-2.5 py-0.5 rounded-full border", cfg.className)}>
                {cfg.label}
            </span>
        );
    };

    return (
        /* pb-32 sm:pb-16 ensures bottom content and pagination controls are completely clear of the mobile navbar */
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
                                {t("homework")}
                            </h1>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                {loading ? t("loading") : `${total} ${activeTab} assignment${total === 1 ? "" : "s"}`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-800 px-3 sm:px-4 print:hidden bg-gray-50/40 dark:bg-gray-900">
                    {(["upcoming", "closed"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => switchTab(tab)}
                            className={cn(
                                "px-4 sm:px-5 py-3 text-[13px] font-semibold transition-colors border-b-2 -mb-px capitalize flex items-center gap-2",
                                activeTab === tab
                                    ? "border-[#6366F1] text-[#6366F1] font-bold"
                                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            )}
                        >
                            {t(tab)} {t("homework")}
                            {activeTab === tab && total > 0 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1]">
                                    {total}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <CardContent className="p-3 sm:p-5 space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder={t("search")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 h-9 text-sm rounded-[10px]"
                            />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
                            <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                                <SelectTrigger className="h-9 w-[70px] text-[12px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-[10px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAGE_SIZES.map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-[10px] overflow-hidden bg-white dark:bg-gray-800">
                                {[
                                    { icon: Copy, label: t("copy"), action: copyToClipboard },
                                    { icon: FileSpreadsheet, label: t("excel"), action: exportToExcel },
                                    { icon: FileDown, label: t("pdf"), action: exportToPDF },
                                    { icon: Printer, label: t("print"), action: () => window.print() },
                                ].map(({ icon: Icon, label, action }, i, arr) => (
                                    <Button key={label} variant="ghost" size="icon" title={label} onClick={action}
                                        className={cn("h-9 w-9 rounded-none hover:bg-gray-100 dark:hover:bg-gray-700", i < arr.length - 1 && "border-r border-gray-200 dark:border-gray-700")}>
                                        <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto print:hidden">
                        <Table className="min-w-[960px]">
                            <TableHeader>
                                <TableRow className="bg-gray-50/90 dark:bg-gray-800/80 hover:bg-gray-50/90 border-b border-gray-200 dark:border-gray-700">
                                    <TableHead className="py-3 px-4 font-bold text-gray-700 dark:text-gray-300">{t("class")}</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700 dark:text-gray-300">{t("section")}</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700 dark:text-gray-300">{t("subject")}</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700 dark:text-gray-300">{t("title") || "Title"}</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700 dark:text-gray-300">{t("homework_date")}</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700 dark:text-gray-300">{t("submission_date")}</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700 dark:text-gray-300 text-center">{t("max_marks") || "Max Marks"}</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700 dark:text-gray-300 text-center">Marks</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700 dark:text-gray-300 text-center">{t("status")}</TableHead>
                                    <TableHead className="py-3 px-4 font-bold text-gray-700 dark:text-gray-300 text-center">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-32 text-center">
                                            <div className="flex items-center justify-center gap-2 text-gray-400">
                                                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                                                <span>{t("loading")}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-32 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                                                <BookOpen className="h-8 w-8 opacity-30" />
                                                <span className="text-sm">{t("no_homework_found")}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((h) => (
                                        <TableRow key={h.id}
                                            className="text-[13px] border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors whitespace-nowrap text-gray-600 dark:text-gray-300">
                                            <TableCell className="py-3 px-4 font-medium text-gray-800 dark:text-gray-200">{h.class}</TableCell>
                                            <TableCell className="py-3 px-4">{h.section || "—"}</TableCell>
                                            <TableCell className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">{h.subject}</TableCell>
                                            <TableCell className="py-3 px-4 font-medium text-gray-700 dark:text-gray-300">{h.title || "—"}</TableCell>
                                            <TableCell className="py-3 px-4">{fmt(h.homework_date)}</TableCell>
                                            <TableCell className="py-3 px-4">{fmt(h.submission_date)}</TableCell>
                                            <TableCell className="py-3 px-4 text-center">{h.max_marks != null ? h.max_marks : "—"}</TableCell>
                                            <TableCell className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                                                {h.marks_obtained != null ? h.marks_obtained : "—"}
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-center">
                                                {statusBadge(h.status, h.marks_obtained, h.max_marks)}
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-center">
                                                <Button size="icon" onClick={() => setSelected(h)} title={t("view")}
                                                    className="h-7 w-7 rounded-[10px] text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90">
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden space-y-3 print:hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
                                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                                <span>Loading...</span>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                                <BookOpen className="h-8 w-8 opacity-30" />
                                <span className="text-sm">{t("no_homework_found")}</span>
                            </div>
                        ) : (
                            filtered.map((h) => (
                                <button key={h.id} onClick={() => setSelected(h)}
                                    className="w-full text-left rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3.5 shadow-xs hover:shadow-md active:scale-[0.99] transition-all">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800]/10 to-[#6366F1]/10">
                                                <BookOpen className="h-4 w-4 text-[#6366F1]" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-[13.5px] font-bold text-gray-800 dark:text-gray-100 truncate">{h.subject}</p>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                                    <Layers className="h-3 w-3" />
                                                    {h.class}{h.section ? ` · ${h.section}` : ""}
                                                </p>
                                            </div>
                                        </div>
                                        {statusBadge(h.status, h.marks_obtained, h.max_marks)}
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11.5px] text-gray-500 dark:text-gray-400 bg-gray-50/80 dark:bg-gray-800/40 rounded-lg p-2.5 border border-gray-100 dark:border-gray-800">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                            HW: <span className="font-semibold text-gray-700 dark:text-gray-200">{fmt(h.homework_date)}</span>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                            Due: <span className="font-semibold text-gray-700 dark:text-gray-200">{fmt(h.submission_date)}</span>
                                        </span>
                                        <span className="flex items-center gap-1.5 col-span-2">
                                            <User className="h-3.5 w-3.5 text-gray-400" />
                                            By: <span className="font-semibold text-gray-700 dark:text-gray-200">{h.created_by || "—"}</span>
                                        </span>
                                        {h.status === "Evaluated" && h.marks_obtained !== null && (
                                            <span className="flex items-center gap-1.5 col-span-2 text-emerald-700 dark:text-emerald-400 font-bold">
                                                <Star className="h-3.5 w-3.5 fill-emerald-500" />
                                                Marks Obtained: {h.marks_obtained} {h.max_marks ? `/ ${h.max_marks}` : ""}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                        <span className="text-[11px] text-gray-400">
                                            {h.attachment ? t("has_attachment") : t("tap_to_view_details")}
                                        </span>
                                        <span className="flex items-center gap-1 text-[11.5px] font-bold text-[#6366F1]">
                                            <Eye className="h-3.5 w-3.5" /> {t("view")}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {!loading && (
                        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3 print:hidden">
                            <span className="text-[12px] text-gray-500 dark:text-gray-400">
                                {total === 0 ? t("no_entries") : `${t("showing")} ${from} ${t("to")} ${to} ${t("of")} ${total} ${t("entries")}`}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <Button size="icon" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    className="h-8 w-8 rounded-[10px] text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 disabled:opacity-40">
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                {pageNumbers.map((p, i) =>
                                    p === "…" ? (
                                        <span key={`e-${i}`} className="text-gray-400 text-[12px] px-1">…</span>
                                    ) : (
                                        <Button key={p} size="icon" onClick={() => setPage(p as number)}
                                            className={cn("h-8 w-8 rounded-[10px] text-[12px] font-medium",
                                                page === p
                                                    ? "text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90"
                                                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50")}>
                                            {p}
                                        </Button>
                                    )
                                )}
                                <Button size="icon" disabled={page >= lastPage} onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                                    className="h-8 w-8 rounded-[10px] text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 disabled:opacity-40">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Detail + Submission Modal ── */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 animate-in fade-in" onClick={() => setSelected(null)}>
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>

                        {/* Modal header */}
                        <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10 rounded-t-xl">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-[#FF9800]/20 to-[#6366F1]/20 shrink-0">
                                    <BookOpen className="h-5 w-5 text-[#6366F1]" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 leading-snug truncate">
                                        {selected.title || selected.subject}
                                    </h2>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                        {selected.subject} · {selected.class}{selected.section ? ` · ${selected.section}` : ""}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelected(null)}
                                className="shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {/* Key info grid */}
                            <div className="grid grid-cols-2 gap-3 px-4 sm:px-5 pt-4 text-[12px] text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                                    <span>HW: <span className="font-semibold text-gray-700 dark:text-gray-200">{fmt(selected.homework_date)}</span></span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-rose-500" />
                                    <span>Due: <span className="font-semibold text-gray-700 dark:text-gray-200">{fmt(selected.submission_date)}</span></span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <ClipboardList className="h-3.5 w-3.5 text-amber-500" />
                                    <span>Max Marks: <span className="font-semibold text-gray-700 dark:text-gray-200">{selected.max_marks != null ? selected.max_marks : "—"}</span></span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-sky-500" />
                                    <span>By: <span className="font-semibold text-gray-700 dark:text-gray-200">{selected.created_by || "—"}</span></span>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="px-4 sm:px-5 py-4">
                                <p className="text-[12px] font-bold text-gray-600 dark:text-gray-300 mb-1">{t("description")}</p>
                                {selected.description ? (
                                    <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap bg-gray-50/70 dark:bg-gray-800/40 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                        {selected.description}
                                    </p>
                                ) : (
                                    <p className="text-[13px] text-gray-400 italic">{t("no_description_provided")}</p>
                                )}
                                {selected.attachment && (
                                    <a href={getAttachmentUrl(selected.attachment)} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 mt-3 text-[13px] text-[#6366F1] font-semibold hover:underline">
                                        <Paperclip className="h-3.5 w-3.5" /> {t("view_attachment")}
                                    </a>
                                )}
                            </div>

                            {/* Submission status section */}
                            <div className="px-4 sm:px-5 pb-4 border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-[12px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                                        Evaluation & Submission Status
                                    </p>
                                    {loadingSubmission ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                    ) : (
                                        submissionBadge(submission || (selected.status === "Evaluated" ? { status: "evaluated" } : selected.status === "Submitted" ? { status: "submitted" } : null))
                                    )}
                                </div>

                                {/* Evaluated result */}
                                {(submission?.status === "evaluated" || selected.status === "Evaluated") && (
                                    <div className="rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3.5 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                                                <Star className="h-5 w-5 fill-emerald-500 text-emerald-500" />
                                                <span className="text-[14px] font-black">
                                                    Marks: {submission?.marks_obtained ?? selected.marks_obtained ?? "—"}
                                                    {selected.max_marks != null ? ` / ${selected.max_marks}` : ""}
                                                </span>
                                            </div>
                                            <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                                                Teacher Evaluated
                                            </Badge>
                                        </div>
                                        {(submission?.teacher_remarks || selected.teacher_remarks) && (
                                            <p className="text-[12px] text-emerald-800 dark:text-emerald-300 italic bg-white/70 dark:bg-gray-900/60 p-2 rounded-lg">
                                                Remarks: "{submission?.teacher_remarks || selected.teacher_remarks}"
                                            </p>
                                        )}
                                        {(submission?.evaluation_date || selected.evaluation_date) && (
                                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                                                Evaluated on: {fmt(submission?.evaluation_date || selected.evaluation_date)}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Already submitted info */}
                                {submission?.status === "submitted" && selected.status !== "Evaluated" && (
                                    <div className="rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3.5 flex items-center gap-2.5 text-blue-700 dark:text-blue-300">
                                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                                        <div>
                                            <p className="text-[12.5px] font-bold">Assignment Submitted</p>
                                            <p className="text-[11px] text-blue-600/80 dark:text-blue-400">
                                                Submitted on {submission.submitted_at ? fmt(submission.submitted_at.split("T")[0]) : "—"}. Waiting for teacher evaluation.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Submit form toggle */}
                                {(!submission || submission.status === "pending") && selected.status !== "Evaluated" && (
                                    <>
                                        {!showSubmitForm ? (
                                            <Button onClick={() => setShowSubmitForm(true)}
                                                className="w-full h-9 text-[12px] font-bold rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-90">
                                                <Send className="h-3.5 w-3.5 mr-2" /> Submit Homework
                                            </Button>
                                        ) : (
                                            <div className="space-y-3 border border-indigo-100 dark:border-indigo-900 rounded-xl p-3.5 bg-indigo-50/30 dark:bg-indigo-950/20">
                                                <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">Submit Your Work</p>
                                                <div className="space-y-1">
                                                    <Label className="text-[11px] font-bold text-gray-500 uppercase">Answer / Notes</Label>
                                                    <Textarea
                                                        value={studentAnswer}
                                                        onChange={(e) => setStudentAnswer(e.target.value)}
                                                        className="text-[12px] min-h-[80px] border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                                                        placeholder="Write your answer or notes here..." />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[11px] font-bold text-gray-500 uppercase">Attachment (optional)</Label>
                                                    <Input type="file" onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                                                        className="text-[11px] border-gray-200 dark:border-gray-700 cursor-pointer p-1.5 h-9 bg-white dark:bg-gray-800"
                                                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" onClick={() => setShowSubmitForm(false)}
                                                        className="flex-1 h-8 text-[11px] rounded-[8px]">Cancel</Button>
                                                    <Button onClick={handleSubmit} disabled={submitting}
                                                        className="flex-1 h-8 text-[11px] rounded-[8px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-90">
                                                        {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Send className="h-3.5 w-3.5 mr-1" /> Submit</>}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Modal footer */}
                        <div className="px-4 sm:px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-end bg-gray-50/80 dark:bg-gray-900 rounded-b-xl">
                            <Button onClick={() => setSelected(null)}
                                className="px-4 py-1.5 h-auto text-[13px] rounded-[10px] text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90">
                                {t("close")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
