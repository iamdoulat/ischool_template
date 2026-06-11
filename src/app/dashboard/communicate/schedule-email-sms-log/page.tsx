"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
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
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    const { toast } = useToast();
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
            toast({ title: "Error", description: "Failed to fetch scheduled logs", variant: "destructive" });
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
            toast({ title: "Success", description: "Scheduled log deleted" });
            fetchLogs(currentPage);
        } catch {
            toast({ title: "Error", description: "Failed to delete scheduled log", variant: "destructive" });
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

            const promises: Promise<any>[] = [];
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

            toast({ title: "Success", description: `${selectedIds.size} scheduled log(s) deleted` });
            setSelectedIds(new Set());
            setDeleteConfirm(false);
            fetchLogs(1);
        } catch {
            toast({ title: "Error", description: "Failed to delete scheduled logs", variant: "destructive" });
        }
    };

    const handleDeleteAll = async () => {
        try {
            await api.post('/communicate/logs/delete-bulk', { type: 'all' });
            toast({ title: "Success", description: "All scheduled logs cleared" });
            setDeleteAllConfirm(false);
            setSelectedIds(new Set());
            fetchLogs(1);
        } catch {
            toast({ title: "Error", description: "Failed to clear scheduled logs", variant: "destructive" });
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
        toast({ title: "Copied", description: "Data copied to clipboard" });
    };

    const handleExportCSV = () => {
        const headers = ["Title", "Message", "Date", "Schedule Date", "Email", "SMS", "WhatsApp", "Group", "Individual", "Class"];
        const rows = filteredLogs.map(l => [l.title, stripHtml(l.message), l.date, l.scheduleDate || '-', l.isEmail ? 'Yes' : 'No', l.isSms ? 'Yes' : 'No', l.isWa ? 'Yes' : 'No', l.isGroup ? 'Yes' : 'No', l.isIndividual ? 'Yes' : 'No', l.isClass ? 'Yes' : 'No']);
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <Mail className="h-5 w-5 text-indigo-500" />
                    </div>
                    <h1 className="text-lg font-bold text-gray-800 tracking-tight uppercase">Schedule Email / SMS / WA Logs</h1>
                </div>
                <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteConfirm(true)}
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 gap-2 h-9 px-6 text-[10px] font-bold uppercase rounded-full border border-rose-100"
                        >
                            <Trash2 className="h-4 w-4" /> Delete Selected ({selectedIds.size})
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        onClick={() => setDeleteAllConfirm(true)}
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 gap-2 h-9 px-6 text-[10px] font-bold uppercase rounded-full border border-rose-100"
                    >
                        <Trash2 className="h-4 w-4" /> Delete All
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
                                placeholder="Search logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-9 text-xs border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg shadow-none"
                            />
                        </div>
                        <div className="flex bg-gray-50/80 rounded-lg border border-gray-100 p-0.5">
                            {(["all", "email", "sms", "wa"] as const).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTypeFilter(t)}
                                    className={cn(
                                        "px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all tracking-wider",
                                        typeFilter === t
                                            ? "bg-indigo-500 text-white shadow-sm"
                                            : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    {t === "all" ? "All" : t === "email" ? "Email" : t === "wa" ? "WhatsApp" : "SMS"}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 font-medium">Per page:</span>
                            <Select value={String(perPage)} onValueChange={(v) => setPerPage(Number(v))}>
                                <SelectTrigger className="h-7 w-16 text-[10px] border-gray-100 bg-gray-50/30 rounded-lg shadow-none px-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                    <SelectItem value="500">500</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy" className="h-7 w-7 hover:bg-gray-100 rounded">
                                <Copy className="h-3.5 w-3.5 text-gray-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleExportCSV} title="CSV" className="h-7 w-7 hover:bg-gray-100 rounded">
                                <FileSpreadsheet className="h-3.5 w-3.5 text-gray-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleExportCSV} title="Excel" className="h-7 w-7 hover:bg-gray-100 rounded">
                                <FileText className="h-3.5 w-3.5 text-gray-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => window.print()} title="Print" className="h-7 w-7 hover:bg-gray-100 rounded">
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
                        {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select All"}
                    </span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                            <MessageSquare className="h-16 w-16 opacity-20" />
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-tight mt-4">No scheduled logs found</p>
                            <p className="text-[10px] text-gray-400 mt-1">No scheduled email, SMS, or WhatsApp logs have been recorded yet</p>
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
                                                        {log.isEmail ? "Email" : log.isWa ? "WhatsApp" : "SMS"}
                                                    </span>
                                                    {log.hasAttachment && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold">
                                                            <Paperclip className="h-3 w-3" /> Attach
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 leading-relaxed">
                                                    {plainMessage.length > 200 ? plainMessage.slice(0, 200) + '...' : plainMessage}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-400 font-medium">
                                                    <span>Sent: {log.date}</span>
                                                    {log.scheduleDate && log.scheduleDate !== '-' && (
                                                        <span>Scheduled: {log.scheduleDate}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <Button size="icon" variant="ghost" onClick={() => setViewLog(log)} className="h-7 w-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition-all shadow-sm">
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleDelete(log.id)} className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-md transition-all shadow-sm">
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
                            Showing {(currentPage - 1) * perPage + 1}-{Math.min(currentPage * perPage, total)} of {total} entries
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
                                                ? "bg-indigo-500 text-white shadow-md"
                                                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                                        )}
                                    >
                                        {pageNum}
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
                        Showing all {total} entr{total === 1 ? 'y' : 'ies'}
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
                                    {viewLog.isEmail ? "Email" : viewLog.isWa ? "WhatsApp" : "SMS"}
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
                                                toast({ title: "Error", description: "Failed to download attachment", variant: "destructive" });
                                            }
                                        }}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs font-semibold transition-colors cursor-pointer"
                                    >
                                        <Paperclip className="h-3.5 w-3.5" /> Download Attachment
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                                <span>Sent: {viewLog.date}</span>
                                {viewLog.scheduleDate && viewLog.scheduleDate !== '-' && (
                                    <span>Scheduled: {viewLog.scheduleDate}</span>
                                )}
                            </div>

                            {viewLog.recipients && viewLog.recipients.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Receivers</h4>
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
                                    dangerouslySetInnerHTML={{ __html: viewLog.message }}
                                />
                            </div>
                        </div>
                    )}
                    <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setViewLog(null)} className="h-10 text-[10px] uppercase font-bold rounded-full px-8 bg-white border-gray-200">
                                Close
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Selected Confirmation */}
            <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
                <AlertDialogContent className="rounded-lg border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">Delete Selected Scheduled Logs</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            Are you sure you want to delete {selectedIds.size} selected scheduled log(s)? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-10 rounded-lg text-[10px] font-bold uppercase tracking-wider border-gray-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSelected} className="bg-red-500 hover:bg-red-600 h-10 rounded-lg text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            Yes, Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete All Confirmation */}
            <AlertDialog open={deleteAllConfirm} onOpenChange={setDeleteAllConfirm}>
                <AlertDialogContent className="rounded-lg border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800 text-red-500">Clear All Scheduled Logs</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            Are you absolutely sure you want to delete all scheduled email, SMS, and WhatsApp logs? This will also remove all attachments from storage. This action is permanent.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-10 rounded-lg text-[10px] font-bold uppercase tracking-wider border-gray-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAll} className="bg-red-500 hover:bg-red-600 h-10 rounded-lg text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            Yes, Clear All
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
