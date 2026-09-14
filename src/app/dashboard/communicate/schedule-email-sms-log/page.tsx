"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
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
    Mail,
    MessageSquare,
    Trash2,
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Eye,
    Paperclip,
    ChevronLeft,
    ChevronRight,
    X,
} from "lucide-react";
import { cn, toLocaleNumber } from "@/lib/utils";
import { CardListSkeleton } from "@/components/ui/table-skeleton";

interface ScheduledLog {
    id: string;
    title: string;
    message: string;
    date: string;
    scheduleDate?: string;
    isEmail: boolean;
    isSms: boolean;
    isWa: boolean;
    hasAttachment: boolean;
    attachment?: string;
    original_filename?: string;
    recipients?: string[];
    isGroup: boolean;
    isIndividual: boolean;
    isClass: boolean;
}

export default function ScheduleEmailSmsLogPage() {
    const { t, language } = useTranslation();
    const tt = useTranslateToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [logs, setLogs] = useState<ScheduledLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
    const [viewLog, setViewLog] = useState<ScheduledLog | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [perPage, setPerPage] = useState(20);
    const [typeFilter, setTypeFilter] = useState<"all" | "email" | "sms" | "wa">("all");

    useEffect(() => {
        fetchLogs(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [perPage]);

    const fetchLogs = async (page: number = currentPage) => {
        setLoading(true);
        try {
            const response = await api.get(`/communicate/scheduled-logs?page=${page}&per_page=${perPage}`);
            const result = response.data?.data || response.data || [];
            setLogs(Array.isArray(result) ? result : []);
            setCurrentPage(response.data?.current_page || page);
            setLastPage(response.data?.last_page || 1);
            setTotal(response.data?.total || 0);
        } catch {
            tt.toast("error", "failed_to_fetch_scheduled_logs");
        } finally {
            setLoading(false);
        }
    };

    const getNumericId = (rawId: string) => {
        return parseInt(rawId.replace('sms_', '').replace('email_', '').replace('wa_', ''), 10);
    };

    const handleDelete = async (rawId: string) => {
        const numericId = getNumericId(rawId);
        const type = rawId.startsWith('email_') ? 'email' : rawId.startsWith('wa_') ? 'wa' : 'sms';
        try {
            await api.delete(`/communicate/logs/${numericId}?type=${type}`);
            tt.success("scheduled_log_deleted");
            fetchLogs(currentPage);
        } catch {
            tt.toast("error", "failed_to_delete_scheduled_log");
        }
    };

    const handleDeleteSelected = async () => {
        try {
            const emailIds: number[] = [];
            const smsIds: number[] = [];
            const waIds: number[] = [];
            selectedIds.forEach(id => {
                const numericId = getNumericId(id);
                if (id.startsWith('email_')) emailIds.push(numericId);
                else if (id.startsWith('wa_')) waIds.push(numericId);
                else smsIds.push(numericId);
            });

            const promises: Promise<unknown>[] = [];
            if (emailIds.length > 0) {
                promises.push(api.post('/communicate/logs/delete-bulk', { ids: emailIds, type: 'email' }));
            }
            if (smsIds.length > 0) {
                promises.push(api.post('/communicate/logs/delete-bulk', { ids: smsIds, type: 'sms' }));
            }
            if (waIds.length > 0) {
                promises.push(api.post('/communicate/logs/delete-bulk', { ids: waIds, type: 'wa' }));
            }
            await Promise.all(promises);

            tt.success("scheduled_logs_deleted", { count: toLocaleNumber(selectedIds.size, language?.short_code) });
            setSelectedIds(new Set());
            setDeleteConfirm(false);
            fetchLogs(1);
        } catch {
            tt.toast("error", "failed_to_delete_scheduled_logs");
        }
    };

    const handleDeleteAll = async () => {
        try {
            await api.post('/communicate/logs/delete-bulk', { type: 'all' });
            tt.success("all_scheduled_logs_cleared");
            setDeleteAllConfirm(false);
            setSelectedIds(new Set());
            fetchLogs(1);
        } catch {
            tt.toast("error", "failed_to_clear_scheduled_logs");
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === logs.length && logs.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(logs.map(l => l.id)));
        }
    };

    const stripHtml = (html: string) => {
        return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    };

    const filteredLogs = logs.filter(log => {
        if (typeFilter === 'email' && !log.isEmail) return false;
        if (typeFilter === 'sms' && !log.isSms) return false;
        if (typeFilter === 'wa' && !log.isWa) return false;
        return log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            stripHtml(log.message).toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleCopy = () => {
        const text = logs.map(l => `${l.title}\t${stripHtml(l.message)}\t${l.date}\t${l.scheduleDate}`).join('\n');
        navigator.clipboard.writeText(text);
        tt.success("data_copied_to_clipboard");
    };

    const handleExportCSV = () => {
        const headers = [
            t("title") || "Title", 
            t("message") || "Message", 
            t("date") || "Date", 
            t("schedule_date") || "Schedule Date", 
            t("email") || "Email", 
            t("sms") || "SMS", 
            t("whatsapp") || "WhatsApp", 
            t("group") || "Group", 
            t("individual") || "Individual", 
            t("class") || "Class"
        ];
        const yesText = t("yes") || "Yes";
        const noText = t("no") || "No";
        const rows = filteredLogs.map(l => [
            l.title, 
            stripHtml(l.message), 
            l.date, 
            l.scheduleDate || '-', 
            l.isEmail ? yesText : noText, 
            l.isSms ? yesText : noText, 
            l.isWa ? yesText : noText, 
            l.isGroup ? yesText : noText, 
            l.isIndividual ? yesText : noText, 
            l.isClass ? yesText : noText
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "scheduled_logs.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Mail className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("schedule_email_sms_wa_logs") || "Schedule Email / SMS / WhatsApp Logs"}</h1>
                        <p className="text-[11px] text-gray-500 mt-1">{t("scheduled_message_queue") || "Scheduled Message Queue"}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                        <Button
                            onClick={() => setDeleteConfirm(true)}
                            className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white gap-2 h-9 px-5 text-[10px] font-bold uppercase rounded-lg shadow-md shadow-rose-200/50 border-none transition-all active:scale-95"
                        >
                            <Trash2 className="h-4 w-4" /> {t("delete_selected") || "Delete Selected"} ({toLocaleNumber(selectedIds.size, language?.short_code)})
                        </Button>
                    )}
                    <Button
                        onClick={() => setDeleteAllConfirm(true)}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f57c00] hover:to-[#4f46e5] text-white gap-2 h-9 px-5 text-[10px] font-bold uppercase rounded-lg shadow-md shadow-indigo-200/50 border-none transition-all active:scale-95"
                    >
                        <Trash2 className="h-4 w-4" /> {t("delete_all") || "Delete All"}
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                {/* Header Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder={t("search_logs") || "Search logs..."}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-9 text-xs border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg shadow-none"
                            />
                        </div>
                        <div className="flex bg-gray-50/80 rounded-lg border border-gray-100 p-0.5">
                            {(["all", "email", "sms", "wa"] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setTypeFilter(type)}
                                    className={cn(
                                        "px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all tracking-wider",
                                        typeFilter === type
                                            ? "bg-indigo-500 text-white shadow-sm"
                                            : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    {type === "all" ? (t("all") || "All") : type === "email" ? (t("email") || "Email") : type === "wa" ? (t("whatsapp") || "WhatsApp") : (t("sms") || "SMS")}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 font-medium">{t("per_page") || "Per Page"}:</span>
                            <Select value={String(perPage)} onValueChange={(v) => setPerPage(Number(v))}>
                                <SelectTrigger className="h-7 w-16 text-[10px] border-gray-100 bg-gray-50/30 rounded-lg shadow-none px-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="20">{toLocaleNumber(20, language?.short_code)}</SelectItem>
                                    <SelectItem value="50">{toLocaleNumber(50, language?.short_code)}</SelectItem>
                                    <SelectItem value="100">{toLocaleNumber(100, language?.short_code)}</SelectItem>
                                    <SelectItem value="500">{toLocaleNumber(500, language?.short_code)}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={handleCopy} title={t("copy") || "Copy"} className="h-7 w-7 hover:bg-gray-100 rounded">
                                <Copy className="h-3.5 w-3.5 text-gray-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleExportCSV} title={t("csv") || "CSV"} className="h-7 w-7 hover:bg-gray-100 rounded">
                                <FileSpreadsheet className="h-3.5 w-3.5 text-gray-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleExportCSV} title={t("excel") || "Excel"} className="h-7 w-7 hover:bg-gray-100 rounded">
                                <FileText className="h-3.5 w-3.5 text-gray-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => window.print()} title={t("print") || "Print"} className="h-7 w-7 hover:bg-gray-100 rounded">
                                <Printer className="h-3.5 w-3.5 text-gray-500" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Select All */}
                <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                    <Checkbox
                        checked={logs.length > 0 && selectedIds.size === logs.length}
                        onCheckedChange={toggleSelectAll}
                        className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                    />
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        {selectedIds.size > 0 ? `${toLocaleNumber(selectedIds.size, language?.short_code)} ${t("selected") || "Selected"}` : (t("select_all") || "Select All")}
                    </span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                    {loading ? (
                        <CardListSkeleton count={4} />
                    ) : filteredLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                            <MessageSquare className="h-16 w-16 opacity-20" />
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-tight mt-4">{t("no_scheduled_logs_found") || "No Scheduled Logs Found"}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{t("no_scheduled_logs_recorded_yet") || "No scheduled logs recorded yet"}</p>
                        </div>
                    ) : (
                        filteredLogs.map((log) => {
                            const plainMessage = stripHtml(log.message);
                            return (
                                <div
                                    key={log.id}
                                    className="p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 bg-white"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <Checkbox
                                                checked={selectedIds.has(log.id)}
                                                onCheckedChange={() => toggleSelect(log.id)}
                                                className="mt-1 border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 shrink-0"
                                            />
                                            <div className={`p-2 rounded-lg shrink-0 ${log.isEmail ? 'bg-indigo-50' : log.isWa ? 'bg-orange-50' : 'bg-emerald-50'}`}>
                                                {log.isEmail ? (
                                                    <Mail className="h-4 w-4 text-indigo-500" />
                                                ) : log.isWa ? (
                                                    <MessageSquare className="h-4 w-4 text-orange-500" />
                                                ) : (
                                                    <MessageSquare className="h-4 w-4 text-emerald-500" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm text-gray-800 font-bold uppercase tracking-tight">
                                                        {log.title}
                                                    </span>
                                                    <span className={cn(
                                                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
                                                        log.isEmail ? "bg-indigo-100 text-indigo-700" : log.isWa ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                                                    )}>
                                                        {log.isEmail ? (t("email") || "Email") : log.isWa ? (t("whatsapp") || "WhatsApp") : (t("sms") || "SMS")}
                                                    </span>
                                                    {log.hasAttachment && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold">
                                                            <Paperclip className="h-3 w-3" /> {t("attachment") || "Attachment"}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 leading-relaxed">
                                                    {plainMessage.length > 200 ? plainMessage.slice(0, 200) + '...' : plainMessage}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-400 font-medium">
                                                    <span>{t("sent") || "Sent"}: {log.date}</span>
                                                    {log.scheduleDate && log.scheduleDate !== '-' && (
                                                        <span>{t("scheduled") || "Scheduled"}: {log.scheduleDate}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <Button size="icon" variant="ghost" onClick={() => setViewLog(log)} title={t("view") || "View"} className="h-7 w-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition-all shadow-sm">
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleDelete(log.id)} title={t("delete") || "Delete"} className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-md transition-all shadow-sm">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Pagination Footer */}
                {total > perPage && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                        <p className="text-[11px] text-gray-400 font-medium">
                            {t("showing_x_to_y_of_z", {
                                from: toLocaleNumber((currentPage - 1) * perPage + 1, language?.short_code),
                                to: toLocaleNumber(Math.min(currentPage * perPage, total), language?.short_code),
                                total: toLocaleNumber(total, language?.short_code),
                            }) || `Showing ${(currentPage - 1) * perPage + 1} to ${Math.min(currentPage * perPage, total)} of ${total} entries`}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => fetchLogs(currentPage - 1)}
                                disabled={currentPage <= 1}
                                className="px-3 py-1.5 text-[11px] font-bold uppercase rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            {Array.from({ length: Math.min(lastPage, 5) }, (_, i) => {
                                let pageNum: number;
                                if (lastPage <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= lastPage - 2) {
                                    pageNum = lastPage - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => fetchLogs(pageNum)}
                                        className={cn(
                                            "w-8 h-8 text-[11px] font-bold rounded-lg transition-all",
                                            pageNum === currentPage
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md"
                                                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                                        )}
                                    >
                                        {toLocaleNumber(pageNum, language?.short_code)}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => fetchLogs(currentPage + 1)}
                                disabled={currentPage >= lastPage}
                                className="px-3 py-1.5 text-[11px] font-bold uppercase rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                )}
                {total <= perPage && total > 0 && (
                    <div className="flex items-center text-[11px] text-gray-400 font-medium pt-2 border-t border-gray-50">
                        {t("showing_all_x_entries", { total: toLocaleNumber(total, language?.short_code) }) || `Showing all ${total} entries`}
                    </div>
                )}
            </div>

            {/* View Log Dialog */}
            <Dialog open={!!viewLog} onOpenChange={(open) => !open && setViewLog(null)}>
                <DialogContent className="sm:max-w-[700px] p-0 rounded-lg border-none shadow-2xl">
                    <div className="bg-emerald-600 p-6 text-white flex items-center justify-between">
                        <DialogHeader className="p-0">
                            <DialogTitle className="text-xl font-bold tracking-tight uppercase flex items-center gap-2">
                                <Eye className="h-5 w-5" />
                                {viewLog?.title}
                            </DialogTitle>
                        </DialogHeader>
                        <button onClick={() => setViewLog(null)} className="text-white/80 hover:text-white transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    {viewLog && (
                        <div className="p-8 space-y-6 bg-white overflow-y-auto max-h-[65vh]">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={cn(
                                    "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold",
                                    viewLog.isEmail ? "bg-indigo-100 text-indigo-700" : viewLog.isWa ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                                )}>
                                    {viewLog.isEmail ? (t("email") || "Email") : viewLog.isWa ? (t("whatsapp") || "WhatsApp") : (t("sms") || "SMS")}
                                </span>
                                {viewLog.hasAttachment && viewLog.attachment && (
                                    <button
                                        onClick={async () => {
                                            const numericId = parseInt(viewLog.id.replace('sms_', '').replace('email_', ''), 10);
                                            try {
                                                const response = await api.get(`/communicate/logs/${numericId}/attachment`, {
                                                    responseType: 'blob'
                                                });
                                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                                const link = document.createElement('a');
                                                link.href = url;
                                                const filename = viewLog.original_filename || (viewLog.attachment ? viewLog.attachment.split('/').pop() || 'attachment' : 'attachment');
                                                link.setAttribute('download', filename);
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                                window.URL.revokeObjectURL(url);
                                            } catch {
                                                tt.toast("error", "failed_to_download_attachment");
                                            }
                                        }}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs font-semibold transition-colors cursor-pointer"
                                    >
                                        <Paperclip className="h-3.5 w-3.5" /> {t("download_attachment") || "Download Attachment"}
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                                <span>{t("sent") || "Sent"}: {viewLog.date}</span>
                                {viewLog.scheduleDate && viewLog.scheduleDate !== '-' && (
                                    <span>{t("scheduled") || "Scheduled"}: {viewLog.scheduleDate}</span>
                                )}
                            </div>

                            {viewLog.recipients && viewLog.recipients.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t("receivers") || "Receivers"}</h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {viewLog.recipients.map((r, i) => (
                                            <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                                                {r}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-gray-100 pt-6">
                                <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-headings:font-bold prose-a:text-indigo-600 prose-img:max-w-full prose-img:h-auto prose-table:w-full prose-pre:overflow-x-auto"
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(viewLog.message) }}
                                />
                            </div>
                        </div>
                    )}
                    <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setViewLog(null)} className="h-10 text-[10px] uppercase font-bold rounded-full px-8 bg-white border-gray-200">
                                {t("close") || "Close"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Selected Confirmation */}
            <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
                <AlertDialogContent className="rounded-lg border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">{t("delete_selected_scheduled_logs") || "Delete Selected Scheduled Logs"}</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            {t("delete_selected_scheduled_logs_confirm", { count: toLocaleNumber(selectedIds.size, language?.short_code) }) || `Are you sure you want to delete ${selectedIds.size} selected scheduled logs?`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-10 rounded-lg text-[10px] font-bold uppercase tracking-wider border-gray-200">{t("cancel") || "Cancel"}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSelected} className="bg-red-500 hover:bg-red-600 h-10 rounded-lg text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            {t("yes_delete") || "Yes, Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete All Confirmation */}
            <AlertDialog open={deleteAllConfirm} onOpenChange={setDeleteAllConfirm}>
                <AlertDialogContent className="rounded-lg border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800 text-red-500">{t("clear_all_scheduled_logs") || "Clear All Scheduled Logs"}</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            {t("clear_all_scheduled_logs_confirm") || "Are you sure you want to clear all scheduled logs? This action cannot be undone."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-10 rounded-lg text-[10px] font-bold uppercase tracking-wider border-gray-200">{t("cancel") || "Cancel"}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAll} className="bg-red-500 hover:bg-red-600 h-10 rounded-lg text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            {t("yes_clear_all") || "Yes, Clear All"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
