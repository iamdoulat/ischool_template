"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import api from "@/lib/api";
import { sanitizeHtml } from "@/lib/sanitize";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Eye,
    Pencil,
    Trash2,
    X,
    Plus,
    Copy as CopyIcon,
    FileSpreadsheet,
    FileText,
    Printer,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Paperclip,
    CloudUpload,
    Download,
    FileCode,
    Search,
    Mail,
    Loader2
} from "lucide-react";
import { cn, toLocaleNumber } from "@/lib/utils";
import VariablePicker from "@/components/ui/variable-picker";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { renderPdfHeader, renderPdfFooter } from "@/lib/pdf-utils";
import { useSettings } from "@/components/providers/settings-provider";

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-5 py-3.5">
                            <div
                                className="h-4 rounded-md bg-gray-200/70 dark:bg-gray-800 animate-pulse"
                                style={{ width: `${55 + ((i * 5 + j * 11) % 40)}%` }}
                            />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

const CKEditorWrapper = dynamic(() => import("@/components/ui/ckeditor"), { ssr: false });

interface EmailTemplate {
    id: number;
    title: string;
    template_id?: string;
    message: string;
    attachment?: string | null;
    original_filename?: string | null;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

export default function EmailTemplatePage() {
    const { t, language } = useTranslation();
    const tt = useTranslateToast();
    const ttRef = useRef(tt);
    ttRef.current = tt;
    const { settings } = useSettings();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const ckeditorRef = useRef<{ insertText: (text: string) => void }>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [limit, setLimit] = useState("20");
    const [currentPage, setCurrentPage] = useState(1);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [viewMode, setViewMode] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [existingAttachment, setExistingAttachment] = useState<string | null | undefined>(null);
    const [existingFilename, setExistingFilename] = useState<string | null | undefined>(null);
    const [removeAttachment, setRemoveAttachment] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        template_id: "",
        message: "",
    });

    const fetchTemplates = useCallback(async (page = currentPage) => {
        setLoading(true);
        try {
            const response = await api.get(`/communicate/email-templates?page=${page}&limit=${limit}&search=${searchTerm}`);
            setTemplates(response.data?.data || []);
            setPagination({
                current_page: response.data?.current_page || 1,
                last_page: response.data?.last_page || 1,
                total: response.data?.total || 0,
                from: response.data?.from || 0,
                to: response.data?.to || 0
            });
            setCurrentPage(response.data?.current_page || page);
        } catch {
            ttRef.current.toast("error", "failed_to_fetch_email_templates");
        } finally {
            setLoading(false);
        }
    }, [searchTerm, limit, currentPage]);

    useEffect(() => {
        fetchTemplates(1);
    }, [searchTerm, limit]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setRemoveAttachment(false);
        }
    };

    const handleRemoveSelectedFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.message.trim()) {
            tt.toast("error", "fill_all_required_fields");
            return;
        }

        setSaving(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('template_id', formData.template_id);
            data.append('message', formData.message);
            if (selectedFile) {
                data.append('attachment', selectedFile);
            }
            if (editMode && removeAttachment && !selectedFile) {
                data.append('remove_attachment', '1');
            }

            if (editMode && selectedId) {
                data.append('_method', 'PUT');
                await api.post(`/communicate/email-templates/${selectedId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                tt.success("template_updated_successfully");
            } else {
                await api.post('/communicate/email-templates', data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                tt.success("template_added_successfully");
            }
            setIsDialogOpen(false);
            resetForm();
            fetchTemplates(currentPage);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            tt.toast("error", err.response?.data?.message || "failed_to_save_template");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (template: EmailTemplate) => {
        setFormData({ title: template.title, template_id: template.template_id || "", message: template.message });
        setSelectedId(template.id);
        setEditMode(true);
        setViewMode(false);
        setSelectedFile(null);
        setExistingAttachment(template.attachment);
        setExistingFilename(template.original_filename);
        setRemoveAttachment(false);
        setIsDialogOpen(true);
    };

    const handleView = (template: EmailTemplate) => {
        setFormData({ title: template.title, template_id: template.template_id || "", message: template.message });
        setViewMode(true);
        setEditMode(false);
        setSelectedFile(null);
        setExistingAttachment(template.attachment);
        setExistingFilename(template.original_filename);
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({ title: "", template_id: "", message: "" });
        setEditMode(false);
        setViewMode(false);
        setSelectedId(null);
        setSelectedFile(null);
        setExistingAttachment(null);
        setExistingFilename(null);
        setRemoveAttachment(false);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await api.delete(`/communicate/email-templates/${deleteId}`);
            tt.success("template_deleted_successfully");
            setDeleteId(null);
            fetchTemplates(1);
        } catch {
            tt.toast("error", "failed_to_delete_template");
        } finally {
            setDeleting(false);
        }
    };

    const handleVariableSelect = (variable: string) => {
        if (ckeditorRef.current) {
            ckeditorRef.current.insertText(variable);
        }
    };

    const handleDownloadAttachment = async (id: number) => {
        try {
            const response = await api.get(`/communicate/email-templates/${id}/download-attachment`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const template = templates.find(t => t.id === id);
            const filename = template?.original_filename || (template?.attachment ? template.attachment.split('/').pop() || 'attachment' : 'attachment');
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch {
            tt.toast("error", "failed_to_download_attachment");
        }
    };

    const handleCopy = () => {
        const text = templates.map(t => `${t.title}\t${t.template_id || ''}\t${t.message.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')}`).join('\n');
        navigator.clipboard.writeText(text);
        tt.success("data_copied_to_clipboard");
    };

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(templates.map(t => ({
            [t("title") || "Title"]: t.title,
            [t("template_id") || "Template ID"]: t.template_id || '',
            [t("message") || "Message"]: t.message.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, t("email_templates") || "Email Templates");
        XLSX.writeFile(workbook, "email_templates.xlsx");
        tt.success("exported_to_excel_successfully");
    };

    const handleExportCSV = () => {
        const headers = [t("title") || "Title", t("template_id") || "Template ID", t("message") || "Message"];
        const rows = templates.map(t => [t.title, t.template_id || '', t.message.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')]);
        const csvContent = [headers.join(","), ...rows.map(e => e.map(x => `"${(x || '').replace(/"/g, '""')}"`).join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "email_templates.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        tt.success("exported_to_excel_successfully");
    };

    const handleExportPDF = async () => {
        let invoicePrintSettings = {};
        try {
            const res = await api.get("system-setting/print-settings");
            if (res.data?.status === "success") {
                invoicePrintSettings = (res.data.data || []).find((s: Record<string, unknown>) => s.type === "Email") || {};
            }
        } catch (err) {
            console.error("Could not fetch print settings", err);
        }
        const baseApiUrl = api.defaults.baseURL?.replace('/api/v1', '') || "";
        const doc = new jsPDF();
        const startY = await renderPdfHeader(doc, settings, invoicePrintSettings, baseApiUrl, (t("email_templates_report") || "Email Templates Report").toUpperCase());
        const tableColumn = [t("title") || "Title", t("template_id") || "Template ID", t("message") || "Message"];
        const tableRows = templates.map(t => [
            t.title,
            t.template_id || '--',
            t.message.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
        ]);
        autoTable(doc, { head: [tableColumn], body: tableRows, startY, headStyles: { fillColor: [99, 102, 241] } });
        const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
        renderPdfFooter(doc, (invoicePrintSettings as Record<string, unknown>).footer_content as string || "", finalY);
        doc.save("email_templates.pdf");
        tt.success("exported_to_pdf_successfully");
    };

    return (
        <div className="p-4 space-y-5 bg-gray-50/10 min-h-screen font-sans">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md shadow-indigo-100">
                        <Mail className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-base font-bold text-gray-800 tracking-tight leading-none">
                            {t("email_template_list") || "Email Templates"}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {t("email_template_subtitle") || "Manage pre-defined email templates with variables and attachments"}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => { resetForm(); setIsDialogOpen(true); }}
                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f57c00] hover:to-[#4f46e5] text-white font-bold rounded-lg shadow-md shadow-indigo-200/50 transition-all flex items-center gap-2 px-6 h-10 text-xs uppercase tracking-wider shrink-0 active:scale-95 border-none"
                >
                    <Plus className="h-4 w-4" /> {t("add_email_template") || "Add Email Template"}
                </Button>
            </div>

            {/* Main Content Card */}
            <Card className="border border-gray-200/80 shadow-[0_4px_24px_rgb(0,0,0,0.05)] bg-white rounded-xl overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Mail className="h-4 w-4" />
                        </span>
                        <div>
                            <CardTitle className="text-sm font-bold tracking-tight text-slate-800 leading-none">
                                {t("email_templates") || "Email Templates"}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1 font-medium">
                                {toLocaleNumber(pagination?.total || templates.length, language?.short_code)} {t("templates") || "templates"}
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-5 md:p-6 space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                        <div className="relative flex-1 sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder={t("search_templates") || "Search templates..."}
                                className="pl-9 h-9 text-xs border-gray-200 focus-visible:ring-2 focus-visible:ring-indigo-500/20 rounded-lg shadow-none bg-gray-50/50 hover:bg-gray-50 font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
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

                    {/* Template Table */}
                    <div className="rounded-xl border border-gray-200/80 overflow-hidden bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50/90 border-b border-gray-200/80 uppercase text-slate-600 tracking-wider font-bold">
                                        <th className="px-5 py-3.5 min-w-[180px]">{t("title") || "Title"}</th>
                                        <th className="px-5 py-3.5 min-w-[140px]">{t("template_id") || "Template ID"}</th>
                                        <th className="px-5 py-3.5 min-w-[280px]">{t("message") || "Message"}</th>
                                        <th className="px-5 py-3.5 min-w-[120px]">{t("attachment") || "Attachment"}</th>
                                        <th className="px-5 py-3.5 text-right min-w-[120px] pr-6">{t("action") || "Action"}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={5} />
                                    ) : templates.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-14">
                                                <div className="flex flex-col items-center justify-center space-y-2 text-gray-400">
                                                    <Mail className="h-10 w-10 text-gray-300 stroke-[1.5]" />
                                                    <p className="text-xs font-semibold text-gray-600">
                                                        {t("no_email_templates_found") || "No email templates found. Click \"Add Email Template\" to create one."}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        templates.map((template) => (
                                            <tr key={template.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-5 py-3.5 font-bold text-gray-800">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex h-2 w-2 rounded-full bg-indigo-500" />
                                                        <span>{template.title}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {template.template_id ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px] font-mono font-semibold">
                                                            {template.template_id}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300 font-mono">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-500 line-clamp-2 max-w-md leading-relaxed">
                                                    {template.message.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {template.attachment ? (
                                                        <button
                                                            onClick={() => handleDownloadAttachment(template.id)}
                                                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                                                        >
                                                            <Paperclip className="h-3 w-3" />
                                                            <span>{template.original_filename || t("download") || "Download"}</span>
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-300 text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-right whitespace-nowrap pr-6">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            size="icon"
                                                            onClick={() => handleView(template)}
                                                            className="h-7 w-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition-all shadow-xs"
                                                            title={t("view") || "View"}
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            onClick={() => handleEdit(template)}
                                                            className="h-7 w-7 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f57c00] hover:to-[#4f46e5] text-white rounded-md transition-all shadow-xs"
                                                            title={t("edit") || "Edit"}
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            onClick={() => setDeleteId(template.id)}
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

                    {/* Pagination */}
                    {pagination && pagination.total > 0 && (
                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-gray-500">
                            <span>
                                {t("showing_x_to_y_of_z", {
                                    from: toLocaleNumber(pagination.from, language?.short_code),
                                    to: toLocaleNumber(pagination.to, language?.short_code),
                                    total: toLocaleNumber(pagination.total, language?.short_code)
                                }) || `Showing ${pagination.from} to ${pagination.to} of ${pagination.total} entries`}
                            </span>

                            <div className="flex items-center gap-1.5">
                                <Button
                                    size="icon"
                                    variant="outline"
                                    disabled={pagination.current_page <= 1 || loading}
                                    onClick={() => fetchTemplates(1)}
                                    className="h-8 w-8 rounded-lg border-gray-200 text-gray-600 disabled:opacity-30"
                                    title={t("first") || "First"}
                                >
                                    <ChevronsLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    disabled={pagination.current_page <= 1 || loading}
                                    onClick={() => fetchTemplates(pagination.current_page - 1)}
                                    className="h-8 w-8 rounded-lg border-gray-200 text-gray-600 disabled:opacity-30"
                                    title={t("previous") || "Previous"}
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(pagination.last_page, 5) }, (_, i) => {
                                        let pageNum: number;
                                        if (pagination.last_page <= 5) {
                                            pageNum = i + 1;
                                        } else if (pagination.current_page <= 3) {
                                            pageNum = i + 1;
                                        } else if (pagination.current_page >= pagination.last_page - 2) {
                                            pageNum = pagination.last_page - 4 + i;
                                        } else {
                                            pageNum = pagination.current_page - 2 + i;
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                type="button"
                                                onClick={() => fetchTemplates(pageNum)}
                                                className={cn(
                                                    "h-8 min-w-[32px] px-2 text-xs font-bold rounded-lg transition-all",
                                                    pageNum === pagination.current_page
                                                        ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md shadow-indigo-100"
                                                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                                                )}
                                            >
                                                {toLocaleNumber(pageNum, language?.short_code)}
                                            </button>
                                        );
                                    })}
                                </div>

                                <Button
                                    size="icon"
                                    variant="outline"
                                    disabled={pagination.current_page >= pagination.last_page || loading}
                                    onClick={() => fetchTemplates(pagination.current_page + 1)}
                                    className="h-8 w-8 rounded-lg border-gray-200 text-gray-600 disabled:opacity-30"
                                    title={t("next") || "Next"}
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    disabled={pagination.current_page >= pagination.last_page || loading}
                                    onClick={() => fetchTemplates(pagination.last_page)}
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

            {/* Add/Edit/View Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[900px] p-0 rounded-xl border-none shadow-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] p-6 border-b border-gray-100">
                        <DialogHeader className="p-0">
                            <DialogTitle className="text-base font-bold tracking-tight text-slate-800 flex items-center gap-2">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    <Mail className="h-4 w-4" />
                                </span>
                                {viewMode ? (t("view_email_template") || "View Email Template") : editMode ? (t("edit_email_template") || "Edit Email Template") : (t("add_email_template") || "Add Email Template")}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500 mt-1">
                                {viewMode ? (t("review_template_details") || "Review template details and formatted message body") : editMode ? (t("update_existing_email_template") || "Update existing email template content and attachments") : (t("create_new_email_template") || "Create new email template with dynamic variables")}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-4 bg-white overflow-y-auto max-h-[70vh]">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700">
                                {t("title") || "Title"} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                readOnly={viewMode}
                                placeholder={t("email_template_title_placeholder") || "Enter email template title..."}
                                className="h-10 border-gray-200 text-xs shadow-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 rounded-lg"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700">
                                {t("template_id") || "Template ID"} <span className="text-gray-400 font-normal">({t("optional") || "Optional"})</span>
                            </Label>
                            <Input
                                value={formData.template_id}
                                onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                                readOnly={viewMode}
                                placeholder={t("email_template_id_placeholder") || "e.g. TEMPL-001"}
                                className="h-10 border-gray-200 text-xs shadow-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 rounded-lg font-mono"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700">
                                {t("message") || "Message"} <span className="text-red-500">*</span>
                            </Label>
                            {viewMode ? (
                                <div className="border border-gray-100 rounded-lg p-4 min-h-[200px] prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-headings:font-bold prose-a:text-indigo-600 prose-img:max-w-full"
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(formData.message) }}
                                />
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div />
                                        <VariablePicker onSelect={handleVariableSelect} />
                                    </div>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <CKEditorWrapper
                                            ref={ckeditorRef}
                                            value={formData.message}
                                            onChange={(value) => setFormData({ ...formData, message: value })}
                                            placeholder={t("enter_email_template_content") || "Write email template content here..."}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Attachment Section */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700">
                                {t("attachment") || "Attachment"} <span className="text-gray-400 font-normal">({t("optional") || "Optional"})</span>
                            </Label>
                            {viewMode ? (
                                <div>
                                    {existingAttachment ? (
                                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                            <Paperclip className="h-4 w-4 text-amber-500 shrink-0" />
                                            <span className="text-xs text-amber-700 font-medium truncate flex-1">{existingFilename || t("attachment") || "Attachment"}</span>
                                            <button
                                                onClick={() => handleDownloadAttachment(selectedId!)}
                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-800 transition-colors cursor-pointer"
                                            >
                                                <Download className="h-3.5 w-3.5" /> {t("download") || "Download"}
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 italic">{t("no_attachment") || "No Attachment"}</p>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {existingAttachment && !selectedFile && !removeAttachment ? (
                                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-2">
                                            <Paperclip className="h-4 w-4 text-amber-500 shrink-0" />
                                            <span className="text-xs text-amber-700 font-medium truncate flex-1">{existingFilename || t("attachment") || "Attachment"}</span>
                                            <button
                                                type="button"
                                                onClick={() => setRemoveAttachment(true)}
                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                                            >
                                                <X className="h-3.5 w-3.5" /> {t("remove") || "Remove"}
                                            </button>
                                        </div>
                                    ) : selectedFile ? (
                                        <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg mb-2">
                                            <Paperclip className="h-4 w-4 text-indigo-500 shrink-0" />
                                            <span className="text-xs text-indigo-700 font-medium truncate flex-1">{selectedFile.name}</span>
                                            <button
                                                type="button"
                                                onClick={handleRemoveSelectedFile}
                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                                            >
                                                <X className="h-3.5 w-3.5" /> {t("remove") || "Remove"}
                                            </button>
                                        </div>
                                    ) : null}
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-200 rounded-lg p-5 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/20 transition-all"
                                    >
                                        <CloudUpload className="h-6 w-6 text-indigo-400 mx-auto mb-1" />
                                        <p className="text-xs text-gray-600 font-medium">{t("click_to_upload_or_drag_drop") || "Click to upload attachment or drag and drop"}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{t("upload_file_types_hint") || "Supported formats: PDF, JPG, PNG, DOC, DOCX, XLSX (Max: 5MB)"}</p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.pptx,.xlsx,.txt"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50/70 border-t border-gray-100 flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            className="h-9 px-5 text-xs font-bold uppercase rounded-lg border-gray-200 bg-white"
                        >
                            {viewMode ? (t("close") || "Close") : (t("cancel") || "Cancel")}
                        </Button>
                        {!viewMode && (
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f57c00] hover:to-[#4f46e5] text-white h-9 px-6 text-xs font-bold uppercase rounded-lg shadow-md shadow-indigo-200/50 border-none"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                        <span>{t("saving") || "Saving..."}</span>
                                    </>
                                ) : (
                                    editMode ? (t("update_template") || "Update Template") : (t("save_template") || "Save Template")
                                )}
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent className="rounded-xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-bold text-gray-800">{t("delete") || "Delete"}</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-gray-500 leading-relaxed mt-2">
                            {t("delete_template_confirm") || "Are you sure you want to permanently delete this template?"}
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
