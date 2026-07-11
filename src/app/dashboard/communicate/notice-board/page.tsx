"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import {
    Search,
    FileSpreadsheet,
    FileText,
    FileCode,
    Printer,
    Pencil,
    Trash2,
    Megaphone,
    Calendar,
    Eye,
    X,
    Copy as CopyIcon,
    ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
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
import { format } from "date-fns";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { renderPdfHeader, renderPdfFooter } from "@/lib/pdf-utils";
import { useSettings } from "@/components/providers/settings-provider";

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div
                                className="h-4 rounded-md bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }}
                            />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

interface Notice {
    id: number;
    title: string;
    message: string;
    notice_date: string;
    publish_date: string;
    message_to: string | null;
    notify_to: string | null;
    is_published?: boolean;
}

export default function NoticeBoardPage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const ttRef = useRef(tt);
    ttRef.current = tt;
    const { settings } = useSettings();
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [pageSize, setPageSize] = useState(20);

    // Selection state
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Dialog states
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [viewNotice, setViewNotice] = useState<Notice | null>(null);

    // Form and Editing state
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        message: "",
        notice_date: format(new Date(), "yyyy-MM-dd"),
        publish_date: format(new Date(), "yyyy-MM-dd"),
        message_to: [] as string[],
        notify_to: [] as string[]
    });
    const [showHtml, setShowHtml] = useState(false);

    const ReactQuill = useMemo(() => dynamic(() => import("react-quill-new"), { ssr: false }), []);

    const quillModules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ align: [] }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['blockquote', 'code-block'],
            ['link', 'image'],
            ['clean'],
        ],
    };

    const fetchNotices = useCallback(async (page: number = 1) => {
        setLoading(true);
        try {
            const response = await api.get('/communicate/notices', {
                params: { page, search: searchQuery, per_page: pageSize }
            });
            const result = response.data?.data || response.data || [];
            setNotices(Array.isArray(result) ? result : []);
            setCurrentPage(response.data?.current_page || page);
            setLastPage(response.data?.last_page || 1);
            setTotal(response.data?.total || 0);
        } catch {
            ttRef.current.error("failed_to_fetch_notices");
        } finally {
            setLoading(false);
        }
    }, [searchQuery, pageSize]);

    useEffect(() => {
        fetchNotices(1);
    }, [fetchNotices]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, pageSize]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                message_to: formData.message_to.join(','),
                notify_to: formData.notify_to.join(',')
            };
            if (isEdit && editId) {
                await api.put(`/communicate/notices/${editId}`, payload);
                tt.success("notice_updated_successfully");
            } else {
                await api.post('/communicate/notices', payload);
                tt.success("notice_posted_successfully");
            }
            resetForm();
            fetchNotices(1);
        } catch {
            tt.error("failed_to_save_notice");
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            message: "",
            notice_date: format(new Date(), "yyyy-MM-dd"),
            publish_date: format(new Date(), "yyyy-MM-dd"),
            message_to: [],
            notify_to: []
        });
        setIsEdit(false);
        setEditId(null);
    };

    const startEdit = (notice: Notice) => {
        setFormData({
            title: notice.title,
            message: notice.message,
            notice_date: notice.notice_date ? notice.notice_date.substring(0, 10) : '',
            publish_date: notice.publish_date ? notice.publish_date.substring(0, 10) : '',
            message_to: notice.message_to ? notice.message_to.split(',') : [],
            notify_to: notice.notify_to ? notice.notify_to.split(',') : []
        });
        setEditId(notice.id);
        setIsEdit(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/communicate/notices/${deleteId}`);
            tt.success("notice_deleted_successfully");
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
            fetchNotices(1);
        } catch {
            tt.error("failed_to_delete_notice");
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.delete('/communicate/notices/destroy-all', { data: { ids: selectedIds } });
            tt.success("notices_deleted_successfully", { count: selectedIds.length });
            setIsBulkDeleteDialogOpen(false);
            setSelectedIds([]);
            fetchNotices(1);
        } catch {
            tt.error("failed_to_delete_notices");
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === notices.length && notices.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(notices.map(n => n.id));
        }
    };

    const toggleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const toggleMessageTo = (role: string) => {
        setFormData(prev => ({
            ...prev,
            message_to: prev.message_to.includes(role)
                ? prev.message_to.filter(r => r !== role)
                : [...prev.message_to, role]
        }));
    };

    const toggleNotifyTo = (channel: string) => {
        setFormData(prev => ({
            ...prev,
            notify_to: prev.notify_to.includes(channel)
                ? prev.notify_to.filter(c => c !== channel)
                : [...prev.notify_to, channel]
        }));
    };

    // Export functions
    const handleCopy = () => {
        const text = notices.map(n =>
            `${n.title}\t${n.notice_date}\t${n.publish_date}\t${n.is_published ? 'Published' : 'Pending'}\t${n.message_to || ''}`
        ).join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const handlePrint = () => window.print();

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(notices.map(n => ({
            Title: n.title,
            'Notice Date': n.notice_date,
            'Publish Date': n.publish_date,
            Status: n.is_published ? 'Published' : 'Pending',
            'Message To': n.message_to || ''
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Notices");
        XLSX.writeFile(workbook, "notices.xlsx");
        tt.success("exported_to_excel_successfully");
    };

    const handleExportCSV = () => {
        const worksheet = XLSX.utils.json_to_sheet(notices.map(n => ({
            Title: n.title,
            'Notice Date': n.notice_date,
            'Publish Date': n.publish_date,
            Status: n.is_published ? 'Published' : 'Pending',
            'Message To': n.message_to || ''
        })));
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "notices.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        tt.success("exported_to_csv_successfully");
    };

    const handleExportPDF = async () => {
        let invoicePrintSettings = {};
        try {
            const res = await api.get("system-setting/print-settings");
            if (res.data?.status === "success") {
                invoicePrintSettings = (res.data.data || []).find((s: any) => s.type === "General Purpose") || {};
            }
        } catch (err) {
            console.error("Could not fetch print settings", err);
        }
        const baseApiUrl = api.defaults.baseURL?.replace('/api/v1', '') || "";
        const doc = new jsPDF();
        const startY = await renderPdfHeader(doc, settings, invoicePrintSettings, baseApiUrl, "NOTICES REPORT");
        const tableColumn = ["Title", "Notice Date", "Publish Date", "Status", "Message To"];
        const tableRows = notices.map(n => [
            n.title,
            n.notice_date,
            n.publish_date,
            n.is_published ? 'Published' : 'Pending',
            n.message_to || ''
        ]);
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY,
            headStyles: { fillColor: [99, 102, 241] },
        });
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        renderPdfFooter(doc, (invoicePrintSettings as any).footer_content || "", finalY);
        doc.save("notices.pdf");
        tt.success("exported_to_pdf_successfully");
    };

    const startIndex = (currentPage - 1) * pageSize + 1;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-700 pb-20">
            {/* Left Column: Notice Form */}
            <div className="lg:col-span-1">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Megaphone className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                {isEdit ? t("edit_notice") : t("post_notice")}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {isEdit ? t("update_existing_notice") : t("broadcast_to_school_community")}
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-5">
                        <form onSubmit={handleSave} className="space-y-4">
                            {/* Title */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    {t("title")} <span className="text-destructive font-black">*</span>
                                </label>
                                <Input
                                    required
                                    placeholder={t("notice_title_placeholder")}
                                    className="h-11 rounded-lg bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                        {t("notice_date")} <span className="text-destructive font-black">*</span>
                                    </label>
                                    <Input
                                        type="date"
                                        required
                                        className="h-11 rounded-lg bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                        value={formData.notice_date}
                                        onChange={(e) => setFormData({ ...formData, notice_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                        {t("publish_date")} <span className="text-destructive font-black">*</span>
                                    </label>
                                    <Input
                                        type="date"
                                        required
                                        className="h-11 rounded-lg bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                        value={formData.publish_date}
                                        onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Message To */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    {t("message_to")}
                                </label>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {['Student', 'Parent', 'Staff'].map((role) => (
                                        <label
                                            key={role}
                                            className="flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer group/label"
                                        >
                                            <Checkbox
                                                checked={formData.message_to.includes(role.toLowerCase())}
                                                onCheckedChange={() => toggleMessageTo(role.toLowerCase())}
                                                className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                                            />
                                            <span className="text-[11px] font-bold text-muted-foreground group-hover/label:text-indigo-600 transition-colors">
                                                {role}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Notify To */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    {t("notify_via")}
                                </label>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {['Email', 'SMS', 'WhatsApp', 'Notification'].map((ch) => (
                                        <label
                                            key={ch}
                                            className="flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer group/label"
                                        >
                                            <Checkbox
                                                checked={formData.notify_to.includes(ch.toLowerCase())}
                                                onCheckedChange={() => toggleNotifyTo(ch.toLowerCase())}
                                                className="border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                                            />
                                            <span className="text-[11px] font-bold text-muted-foreground group-hover/label:text-orange-600 transition-colors">
                                                {ch}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Message */}
                            <div className="space-y-2 group">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 transition-colors">
                                        {t("message")} <span className="text-destructive font-black">*</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowHtml(!showHtml)}
                                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-indigo-600 transition-colors uppercase tracking-wider"
                                    >
                                        {showHtml ? "Visual" : "HTML"}
                                    </button>
                                </div>
                                {showHtml ? (
                                    <Textarea
                                        required
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder={t("write_notice_content_here")}
                                        className="min-h-[150px] rounded-lg bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium resize-none text-xs font-mono"
                                    />
                                ) : (
                                    <div className="border border-muted/50 rounded-lg overflow-hidden bg-muted/30 [&_.ql-toolbar]:border-muted/50 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[150px] [&_.ql-editor]:text-sm">
                                        <ReactQuill
                                            value={formData.message}
                                            onChange={(value) => setFormData({ ...formData, message: value })}
                                            modules={quillModules}
                                            theme="snow"
                                            placeholder={t("write_notice_content_here")}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex justify-end gap-2">
                                {isEdit && (
                                    <Button type="button" variant="outline" className="h-11 px-6 rounded-lg font-bold" onClick={resetForm}>
                                        {t("cancel")}
                                    </Button>
                                )}
                                <Button type="submit" variant="gradient" className="h-11 px-10 rounded-lg font-bold tracking-tight shadow-lg shadow-primary/25">
                                    {isEdit ? t("update_notice") : t("publish_notice")}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Notice List */}
            <div className="lg:col-span-2">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Megaphone className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("notice_board")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{total} {t(total === 1 ? "notice" : "notices")}</p>
                        </div>
                    </CardHeader>

                    <div className="p-6 space-y-6">
                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative w-full max-w-sm group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder={t("search") + "..."}
                                    className="pl-10 h-10 rounded-full bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={pageSize}
                                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                    className="h-10 px-3 rounded-lg border border-muted/50 bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-medium text-muted-foreground"
                                >
                                    <option value="20">20</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                                <div className="h-8 w-px bg-muted/50 mx-2" />
                                <div className="flex gap-1">
                                    <IconButton icon={CopyIcon} onClick={handleCopy} />
                                    <IconButton icon={FileSpreadsheet} onClick={handleExportExcel} />
                                    <IconButton icon={FileText} onClick={handleExportCSV} />
                                    <IconButton icon={FileCode} onClick={handleExportPDF} />
                                    <IconButton icon={Printer} onClick={handlePrint} />
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="rounded-lg border border-muted/50 overflow-hidden bg-muted/10 shadow-inner">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-muted/30">
                                            <th className="px-4 py-4 w-10 border-b border-muted/50">
                                                <Checkbox
                                                    checked={selectedIds.length === notices.length && notices.length > 0}
                                                    onCheckedChange={toggleSelectAll}
                                                />
                                            </th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 whitespace-nowrap">{t("sr_no")}</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 whitespace-nowrap">{t("title")}</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 whitespace-nowrap">{t("notice_date")}</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 whitespace-nowrap">{t("publish_date")}</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 whitespace-nowrap">{t("status")}</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 whitespace-nowrap">{t("message_to")}</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 whitespace-nowrap text-right">
                                                <div className="flex justify-end pr-1">
                                                    {selectedIds.length > 0 ? (
                                                        <button
                                                            onClick={() => setIsBulkDeleteDialogOpen(true)}
                                                            className="bg-red-500 hover:bg-red-600 p-1.5 rounded transition-colors flex items-center gap-1 text-white px-2"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            <span className="text-xs font-bold leading-none translate-y-[1px]">{t("delete")}</span>
                                                        </button>
                                                    ) : (
                                                        t("action")
                                                    )}
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-muted/50">
                                        {loading ? (
                                            <TableSkeleton rows={5} cols={8} />
                                        ) : notices.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data_found")}</td>
                                            </tr>
                                        ) : (
                                            notices.map((notice, idx) => {
                                                const messageTo = notice.message_to ? notice.message_to.split(',').map(s => s.trim()).filter(Boolean) : [];
                                                return (
                                                    <tr key={notice.id} className={cn(
                                                        "hover:bg-muted/20 transition-colors group/row",
                                                        selectedIds.includes(notice.id) && "bg-muted/30"
                                                    )}>
                                                        <td className="px-4 py-4">
                                                            <Checkbox
                                                                checked={selectedIds.includes(notice.id)}
                                                                onCheckedChange={() => toggleSelect(notice.id)}
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-medium text-muted-foreground">{startIndex + idx}</td>
                                                        <td className="px-6 py-4 text-sm font-bold text-foreground whitespace-nowrap">{notice.title}</td>
                                                        <td className="px-6 py-4 text-xs font-medium text-muted-foreground whitespace-nowrap">
                                                            {notice.notice_date ? format(new Date(notice.notice_date), 'dd/MM/yyyy') : '-'}
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-medium text-muted-foreground whitespace-nowrap">
                                                            {notice.publish_date ? format(new Date(notice.publish_date), 'dd/MM/yyyy') : '-'}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={cn(
                                                                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
                                                                notice.is_published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                                            )}>
                                                                {notice.is_published ? t("published") : t("pending")}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-1 flex-wrap">
                                                                {messageTo.map((to, i) => (
                                                                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-semibold">
                                                                        {to}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center justify-end gap-1.5 pr-2">
                                                                <Button
                                                                    size="icon"
                                                                    onClick={() => setViewNotice(notice)}
                                                                    className="h-8 w-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-90 transition-all"
                                                                    title={t("view")}
                                                                >
                                                                    <Eye className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    onClick={() => startEdit(notice)}
                                                                    className="h-8 w-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 active:scale-90 transition-all"
                                                                    title={t("edit")}
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    onClick={() => { setDeleteId(notice.id); setIsDeleteDialogOpen(true); }}
                                                                    className="h-8 w-8 rounded-lg bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 active:scale-90 transition-all"
                                                                    title={t("delete")}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {total > 0 && (
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-medium">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                    {t("showing")} {Math.min((currentPage - 1) * pageSize + 1, total)} {t("to")} {Math.min(currentPage * pageSize, total)} {t("of")} {total} {t("entries")}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="icon"
                                        disabled={currentPage === 1}
                                        onClick={() => fetchNotices(currentPage - 1)}
                                        className="h-8 w-8 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-card active:scale-95 transition-all"
                                    >
                                        <ChevronDown className="h-4 w-4 rotate-90" />
                                    </Button>
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
                                            <Button
                                                key={pageNum}
                                                size="icon"
                                                onClick={() => fetchNotices(pageNum)}
                                                className={cn(
                                                    "h-8 w-8 rounded-[10px] border-none p-0 font-bold active:scale-95 transition-all",
                                                    pageNum === currentPage
                                                        ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md shadow-orange-500/10"
                                                        : "bg-white border border-gray-200 text-gray-600 hover:bg-card"
                                                )}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                    <Button
                                        size="icon"
                                        disabled={currentPage >= lastPage}
                                        onClick={() => fetchNotices(currentPage + 1)}
                                        className="h-8 w-8 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-card active:scale-95 transition-all"
                                    >
                                        <ChevronDown className="h-4 w-4 -rotate-90" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* View Notice Dialog */}
            <Dialog open={!!viewNotice} onOpenChange={(open) => !open && setViewNotice(null)}>
                <DialogContent className="sm:max-w-[700px] p-0 rounded-lg border-none shadow-2xl">
                    <div className="bg-emerald-600 p-6 text-white flex items-center justify-between">
                        <DialogHeader className="p-0">
                            <DialogTitle className="text-xl font-bold tracking-tight uppercase flex items-center gap-2">
                                <Eye className="h-5 w-5" />
                                {viewNotice?.title}
                            </DialogTitle>
                        </DialogHeader>
                        <button onClick={() => setViewNotice(null)} className="text-white/80 hover:text-white transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    {viewNotice && (
                        <div className="p-8 space-y-6 bg-white overflow-y-auto max-h-[65vh]">
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    {t("notice")}: {format(new Date(viewNotice.notice_date), 'dd/MM/yyyy')}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    {t("publish")}: {format(new Date(viewNotice.publish_date), 'dd/MM/yyyy')}
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={cn(
                                    "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold",
                                    viewNotice.is_published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                )}>
                                    {viewNotice.is_published ? t("published") : t("pending")}
                                </span>
                                {(viewNotice.message_to ? viewNotice.message_to.split(',').map(s => s.trim()).filter(Boolean) : []).map((to, i) => (
                                    <span key={i} className="inline-flex items-center px-3 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs font-semibold">{to}</span>
                                ))}
                                {(viewNotice.notify_to ? viewNotice.notify_to.split(',').map(s => s.trim()).filter(Boolean) : []).map((ch, i) => (
                                    <span key={i} className="inline-flex items-center px-3 py-1 rounded-md bg-orange-100 text-orange-700 text-xs font-semibold">{ch}</span>
                                ))}
                            </div>
                            <div className="border-t border-gray-100 pt-6">
                                <div
                                    className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-headings:font-bold prose-a:text-indigo-600 prose-img:max-w-full"
                                    dangerouslySetInnerHTML={{ __html: viewNotice.message }}
                                />
                            </div>
                        </div>
                    )}
                    <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setViewNotice(null)} className="h-10 text-[10px] uppercase font-bold rounded-full px-8 bg-white border-gray-200">{t("close")}</Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Single Delete Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("are_you_sure")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("this_action_cannot_be_undone")}. {t("permanently_delete_notice")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setDeleteId(null); setIsDeleteDialogOpen(false); }}>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 font-bold active:scale-95 transition-transform">{t("delete")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Delete Dialog */}
            <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("delete_selected_notices")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("delete_selected_notices_confirm", { count: selectedIds.length })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsBulkDeleteDialogOpen(false)}>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600 font-bold active:scale-95 transition-transform">{t("delete_selected")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// Helper component for icon buttons
function IconButton({ icon: Icon, onClick }: { icon: React.ElementType; onClick?: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="p-2 hover:bg-muted rounded-lg transition-colors border border-muted/50 text-muted-foreground hover:text-foreground shadow-sm active:scale-95"
        >
            <Icon className="h-4 w-4" />
        </button>
    );
}
