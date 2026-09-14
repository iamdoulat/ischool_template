"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Plus, Edit2, Trash2, FileText, Search, Eye,
    Copy as CopyIcon, FileSpreadsheet, Printer, ChevronLeft, ChevronRight,
    FileCode, MessageSquare, Loader2, ChevronsLeft, ChevronsRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import api from "@/lib/api";
import { cn, toLocaleNumber } from "@/lib/utils";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface NotificationTemplate {
    id: number;
    title: string;
    message: string;
    template_id?: string;
    created_at?: string;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

export default function NotificationTemplatePage() {
    const { t, language } = useTranslation();
    const tt = useTranslateToast();

    const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Pagination controls: default 20
    const [limit, setLimit] = useState("20");
    const [currentPage, setCurrentPage] = useState(1);

    // Modal state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
    const [viewingTemplate, setViewingTemplate] = useState<NotificationTemplate | null>(null);
    const [formTitle, setFormTitle] = useState("");
    const [formMessage, setFormMessage] = useState("");
    const [formTemplateId, setFormTemplateId] = useState("");
    const [saving, setSaving] = useState(false);

    // Delete state
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchTemplates = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/communicate/notification-templates?page=${currentPage}&per_page=${limit}`, { skipGlobalErrorHandler: true });
            const data = res.data?.data;
            if (data?.data) {
                setTemplates(data.data);
                setPagination({
                    current_page: data.current_page || 1,
                    last_page: data.last_page || 1,
                    total: data.total || data.data.length,
                    from: data.from || 1,
                    to: data.to || data.data.length,
                });
            } else if (Array.isArray(data)) {
                setTemplates(data);
                setPagination({
                    current_page: 1,
                    last_page: 1,
                    total: data.length,
                    from: data.length > 0 ? 1 : 0,
                    to: data.length,
                });
            } else {
                setTemplates([]);
            }
        } catch {
            setTemplates([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, limit]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleOpenCreate = () => {
        setEditingTemplate(null);
        setViewingTemplate(null);
        setFormTitle("");
        setFormMessage("");
        setFormTemplateId("");
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (template: NotificationTemplate) => {
        setEditingTemplate(template);
        setViewingTemplate(null);
        setFormTitle(template.title);
        setFormMessage(template.message);
        setFormTemplateId(template.template_id || "");
        setIsDialogOpen(true);
    };

    const handleOpenView = (template: NotificationTemplate) => {
        setViewingTemplate(template);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formTitle.trim() || !formMessage.trim()) {
            tt.toast("error", "fill_all_required_fields");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                title: formTitle,
                message: formMessage,
                template_id: formTemplateId,
            };

            if (editingTemplate) {
                await api.put(`/communicate/notification-templates/${editingTemplate.id}`, payload);
                tt.success("notification_template_updated");
            } else {
                await api.post("/communicate/notification-templates", payload);
                tt.success("notification_template_created");
            }

            setIsDialogOpen(false);
            fetchTemplates();
        } catch {
            tt.toast("error", "failed_to_save_notification_template");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await api.delete(`/communicate/notification-templates/${deleteId}`);
            tt.success("notification_template_deleted");
            setDeleteId(null);
            fetchTemplates();
        } catch {
            tt.toast("error", "failed_to_delete_notification_template");
        } finally {
            setDeleting(false);
        }
    };

    // Export Handlers
    const handleCopy = () => {
        const text = templates.map(t => `${t.title}\t${t.template_id || ''}\t${t.message}`).join("\n");
        navigator.clipboard.writeText(text);
        tt.success("data_copied_to_clipboard");
    };

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(templates.map(t => ({
            [t("title") || "Title"]: t.title,
            [t("template_id") || "Template ID"]: t.template_id || '',
            [t("message_body") || "Message Body"]: t.message,
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, t("notification_template_list") || "Notification Templates");
        XLSX.writeFile(workbook, "notification_templates.xlsx");
        tt.success("exported_successfully");
    };

    const handleExportCSV = () => {
        const headers = [t("title") || "Title", t("template_id") || "Template ID", t("message_body") || "Message Body"];
        const rows = templates.map(t => [`"${t.title}"`, `"${t.template_id || ''}"`, `"${t.message.replace(/"/g, '""')}"`]);
        const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "notification_templates.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        tt.success("exported_successfully");
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text(t("notification_templates_report") || "Notification Templates Report", 14, 15);
        const tableColumn = [t("title") || "Title", t("template_id") || "Template ID", t("message_body") || "Message Body"];
        const tableRows = templates.map(t => [t.title, t.template_id || '--', t.message]);
        autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
        doc.save("notification_templates.pdf");
        tt.success("exported_successfully");
    };

    const filteredTemplates = templates.filter((t) =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.message.toLowerCase().includes(search.toLowerCase()) ||
        (t.template_id && t.template_id.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="p-4 space-y-5 bg-gray-50/10 min-h-screen font-sans">
            {/* Page Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md shadow-indigo-100">
                        <MessageSquare className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-base font-bold text-gray-800 tracking-tight leading-none">
                            {t("notification_template_list") || "Notification Templates"}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {t("notification_template_subtitle") || "Manage pre-defined in-app notification templates for quick dispatching"}
                        </p>
                    </div>
                </div>

                <Button
                    onClick={handleOpenCreate}
                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f57c00] hover:to-[#4f46e5] text-white font-bold rounded-lg shadow-md shadow-indigo-200/50 transition-all flex items-center gap-2 px-6 h-10 text-xs uppercase tracking-wider shrink-0 active:scale-95 border-none"
                >
                    <Plus className="h-4 w-4" />
                    {t("add_notification_template") || "Add Notification Template"}
                </Button>
            </div>

            {/* Content Table Card */}
            <Card className="border border-gray-200/80 shadow-[0_4px_24px_rgb(0,0,0,0.05)] bg-white rounded-xl overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <FileText className="h-4 w-4" />
                        </span>
                        <div>
                            <CardTitle className="text-sm font-bold tracking-tight text-slate-800 leading-none">
                                {t("notification_template_list") || "Notification Templates"}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1 font-medium">
                                {toLocaleNumber(pagination?.total || filteredTemplates.length, language?.short_code)} {t("templates") || "templates"}
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-5 md:p-6 space-y-4">
                    {/* Toolbar: Search + Page size + Export Controls */}
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                        <div className="relative flex-1 sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder={t("search_templates") || "Search templates..."}
                                className="pl-9 h-9 text-xs border-gray-200 focus-visible:ring-2 focus-visible:ring-indigo-500/20 rounded-lg shadow-none bg-gray-50/50 hover:bg-gray-50 font-medium"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">{t("per_page") || "Per Page"}:</span>
                                <Select value={limit} onValueChange={(v) => { setLimit(v); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-8 w-[72px] text-xs border-gray-200 bg-white rounded-lg shadow-none px-2.5 font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10" className="text-xs">{toLocaleNumber(10, language?.short_code)}</SelectItem>
                                        <SelectItem value="20" className="text-xs">{toLocaleNumber(20, language?.short_code)}</SelectItem>
                                        <SelectItem value="50" className="text-xs">{toLocaleNumber(50, language?.short_code)}</SelectItem>
                                        <SelectItem value="100" className="text-xs">{toLocaleNumber(100, language?.short_code)}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-1 border-l border-gray-100 pl-3 text-gray-500">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleCopy}
                                    title={t("copy") || "Copy"}
                                    className="h-8 w-8 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-indigo-600"
                                >
                                    <CopyIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleExportExcel}
                                    title={t("excel") || "Excel"}
                                    className="h-8 w-8 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-indigo-600"
                                >
                                    <FileSpreadsheet className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleExportCSV}
                                    title={t("csv") || "CSV"}
                                    className="h-8 w-8 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-indigo-600"
                                >
                                    <FileText className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleExportPDF}
                                    title={t("pdf") || "PDF"}
                                    className="h-8 w-8 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-indigo-600"
                                >
                                    <FileCode className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => window.print()}
                                    title={t("print") || "Print"}
                                    className="h-8 w-8 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-indigo-600"
                                >
                                    <Printer className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="rounded-xl border border-gray-200/80 overflow-hidden bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50/90 border-b border-gray-200/80 uppercase text-slate-600 tracking-wider font-bold">
                                        <th className="px-5 py-3.5 min-w-[200px]">{t("title") || "Title"}</th>
                                        <th className="px-5 py-3.5 min-w-[150px]">{t("template_id") || "Template ID"}</th>
                                        <th className="px-5 py-3.5 min-w-[300px]">{t("message_body") || "Message Body"}</th>
                                        <th className="px-5 py-3.5 text-right min-w-[120px] pr-6">{t("action") || "Action"}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-12 text-gray-400">
                                                <Loader2 className="h-6 w-6 animate-spin inline mr-2 text-indigo-500" />
                                                <span className="text-xs font-medium">{t("loading") || "Loading..."}</span>
                                            </td>
                                        </tr>
                                    ) : filteredTemplates.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-14">
                                                <div className="flex flex-col items-center justify-center space-y-2 text-gray-400">
                                                    <MessageSquare className="h-10 w-10 text-gray-300 stroke-[1.5]" />
                                                    <p className="text-xs font-semibold text-gray-600">
                                                        {t("no_notification_templates_found") || "No notification templates found. Click \"Add Notification Template\" to create one."}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTemplates.map((tmpl) => (
                                            <tr key={tmpl.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-5 py-3.5 font-bold text-gray-800">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex h-2 w-2 rounded-full bg-indigo-500" />
                                                        <span>{tmpl.title}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {tmpl.template_id ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px] font-mono font-semibold">
                                                            {tmpl.template_id}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300 font-mono">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-500 line-clamp-2 max-w-md leading-relaxed">
                                                    {tmpl.message}
                                                </td>
                                                <td className="px-5 py-3.5 text-right whitespace-nowrap pr-6">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            size="icon"
                                                            onClick={() => handleOpenView(tmpl)}
                                                            className="h-7 w-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition-all shadow-xs"
                                                            title={t("view") || "View"}
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            onClick={() => handleOpenEdit(tmpl)}
                                                            className="h-7 w-7 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f57c00] hover:to-[#4f46e5] text-white rounded-md transition-all shadow-xs"
                                                            title={t("edit") || "Edit"}
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            onClick={() => setDeleteId(tmpl.id)}
                                                            className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-md transition-all shadow-xs"
                                                            title={t("delete") || "Delete"}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination Footer */}
                    {pagination && (
                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-gray-500">
                            <span>
                                {t("showing_x_to_y_of_z", {
                                    from: toLocaleNumber(pagination.from || 0, language?.short_code),
                                    to: toLocaleNumber(pagination.to || 0, language?.short_code),
                                    total: toLocaleNumber(pagination.total || 0, language?.short_code)
                                }) || `Showing ${pagination.from || 0} to ${pagination.to || 0} of ${pagination.total || 0} entries`}
                            </span>

                            <div className="flex items-center gap-1.5">
                                <Button
                                    size="icon"
                                    variant="outline"
                                    disabled={currentPage <= 1 || loading}
                                    onClick={() => setCurrentPage(1)}
                                    className="h-8 w-8 rounded-lg border-gray-200 text-gray-600 disabled:opacity-30"
                                    title={t("first") || "First"}
                                >
                                    <ChevronsLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    disabled={currentPage <= 1 || loading}
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    className="h-8 w-8 rounded-lg border-gray-200 text-gray-600 disabled:opacity-30"
                                    title={t("previous") || "Previous"}
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: pagination.last_page || 1 }, (_, i) => i + 1).map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setCurrentPage(p)}
                                            className={cn(
                                                "h-8 min-w-[32px] px-2 text-xs font-bold rounded-lg transition-all",
                                                p === currentPage
                                                    ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md shadow-indigo-100"
                                                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                                            )}
                                        >
                                            {toLocaleNumber(p, language?.short_code)}
                                        </button>
                                    ))}
                                </div>

                                <Button
                                    size="icon"
                                    variant="outline"
                                    disabled={currentPage >= (pagination.last_page || 1) || loading}
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.last_page))}
                                    className="h-8 w-8 rounded-lg border-gray-200 text-gray-600 disabled:opacity-30"
                                    title={t("next") || "Next"}
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    disabled={currentPage >= (pagination.last_page || 1) || loading}
                                    onClick={() => setCurrentPage(pagination.last_page)}
                                    className="h-8 w-8 rounded-lg border-gray-200 text-gray-600 disabled:opacity-30"
                                    title={t("last") || "Last"}
                                >
                                    <ChevronsRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add / Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-xl shadow-2xl p-0 border-none overflow-hidden">
                    <div className="bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] p-6 border-b border-gray-100">
                        <DialogHeader className="p-0">
                            <DialogTitle className="text-base font-bold text-gray-800 tracking-tight flex items-center gap-2">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    <MessageSquare className="h-4 w-4" />
                                </span>
                                {editingTemplate ? (t("edit_notification_template") || "Edit Notification Template") : (t("add_notification_template") || "Add Notification Template")}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500 mt-1">
                                {t("notification_template_dialog_desc") || "Create standard messages to reuse when sending in-app notifications."}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <form onSubmit={handleSave} className="p-6 space-y-4 bg-white">
                        <div className="space-y-1.5">
                            <Label htmlFor="title" className="text-xs font-bold text-gray-700">
                                {t("title") || "Title"} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                placeholder={t("notification_template_title_placeholder") || t("enter_title") || "Enter title..."}
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                className="h-10 text-xs border-gray-200 focus-visible:ring-2 focus-visible:ring-indigo-500/20 rounded-lg shadow-none"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="message" className="text-xs font-bold text-gray-700">
                                {t("message_body") || "Message Body"} <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="message"
                                rows={4}
                                placeholder={t("enter_message") || "Template Content..."}
                                value={formMessage}
                                onChange={(e) => setFormMessage(e.target.value)}
                                className="text-xs border-gray-200 focus-visible:ring-2 focus-visible:ring-indigo-500/20 rounded-lg shadow-none resize-none leading-relaxed"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="template_id" className="text-xs font-bold text-gray-700">
                                {t("template_id_optional") || "Template ID (Optional)"}
                            </Label>
                            <Input
                                id="template_id"
                                placeholder="e.g. NOTIF-001"
                                value={formTemplateId}
                                onChange={(e) => setFormTemplateId(e.target.value)}
                                className="h-10 text-xs border-gray-200 focus-visible:ring-2 focus-visible:ring-indigo-500/20 rounded-lg shadow-none font-mono"
                            />
                        </div>

                        <DialogFooter className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                className="h-9 px-5 text-xs font-bold uppercase rounded-lg border-gray-200"
                            >
                                {t("cancel") || "Cancel"}
                            </Button>
                            <Button
                                type="submit"
                                disabled={saving}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f57c00] hover:to-[#4f46e5] text-white h-9 px-6 text-xs font-bold uppercase rounded-lg shadow-md shadow-indigo-200/50 border-none"
                            >
                                {saving ? (t("saving") || "Saving...") : (t("save_template") || "Save Template")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={!!viewingTemplate} onOpenChange={() => setViewingTemplate(null)}>
                <DialogContent className="sm:max-w-md rounded-xl shadow-2xl p-0 border-none overflow-hidden">
                    <div className="bg-emerald-600 p-6 text-white flex items-center justify-between">
                        <DialogHeader className="p-0">
                            <DialogTitle className="text-base font-bold tracking-tight uppercase flex items-center gap-2">
                                <Eye className="h-5 w-5" />
                                {t("template_details") || "Template Details"}
                            </DialogTitle>
                        </DialogHeader>
                    </div>
                    {viewingTemplate && (
                        <div className="p-6 space-y-4 text-xs bg-white">
                            <div>
                                <span className="font-bold text-gray-400 uppercase text-[10px] tracking-wider">{t("title") || "Title"}</span>
                                <p className="font-bold text-sm text-gray-800 mt-0.5">{viewingTemplate.title}</p>
                            </div>
                            {viewingTemplate.template_id && (
                                <div>
                                    <span className="font-bold text-gray-400 uppercase text-[10px] tracking-wider">{t("template_id") || "Template ID"}</span>
                                    <p className="font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded inline-block mt-0.5">{viewingTemplate.template_id}</p>
                                </div>
                            )}
                            <div>
                                <span className="font-bold text-gray-400 uppercase text-[10px] tracking-wider">{t("message_body") || "Message Body"}</span>
                                <p className="p-3.5 rounded-lg bg-gray-50 text-gray-700 border border-gray-100 whitespace-pre-wrap leading-relaxed mt-0.5">
                                    {viewingTemplate.message}
                                </p>
                            </div>
                        </div>
                    )}
                    <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                        <Button variant="outline" onClick={() => setViewingTemplate(null)} className="h-9 px-6 text-xs font-bold uppercase rounded-lg border-gray-200 bg-white">
                            {t("close") || "Close"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent className="rounded-xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-bold text-gray-800">{t("delete") || "Delete"}</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-gray-500 leading-relaxed mt-2">
                            {t("delete_notification_template_confirm") || "Are you sure you want to permanently delete this notification template?"}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-9 rounded-lg text-xs font-bold uppercase tracking-wider border-gray-200">{t("cancel") || "Cancel"}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-500 hover:bg-red-600 h-9 rounded-lg text-xs font-bold uppercase tracking-wider border-0 shadow-md text-white"
                        >
                            {deleting ? (t("deleting") || "Deleting...") : (t("yes_delete") || "Yes, Delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
