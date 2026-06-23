"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Eye,
    Pencil,
    X,
    Plus,
    Copy as CopyIcon,
    FileSpreadsheet,
    FileText,
    Printer,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    Search,
    FileCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import EmojiPicker from "@/components/ui/emoji-picker";
import VariablePicker from "@/components/ui/variable-picker";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

function IconButton({ icon: Icon, onClick, title }: { icon: React.ElementType; onClick?: () => void; title?: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className="p-2 hover:bg-muted rounded-lg transition-colors border border-muted/50 text-muted-foreground hover:text-foreground shadow-sm active:scale-95"
        >
            <Icon className="h-4 w-4" />
        </button>
    );
}

interface WaTemplate {
    id: number;
    title: string;
    template_id?: string;
    message: string;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

export default function WaTemplatePage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [templates, setTemplates] = useState<WaTemplate[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [limit, setLimit] = useState("50");

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [viewMode, setViewMode] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        template_id: "",
        message: "",
    });

    const getWaInfo = (text: string) => {
        if (!text) return { chars: 0 };
        return { chars: text.length };
    };

    const waInfo = getWaInfo(formData.message);

    const fetchTemplates = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/communicate/wa-templates?page=${page}&limit=${limit}&search=${searchTerm}`);
            setTemplates(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
        } catch {
            tt.toast("error", "failed_to_fetch_wa_templates");
        } finally {
            setLoading(false);
        }
    }, [searchTerm, limit, tt]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleSave = async () => {
        try {
            if (editMode && selectedId) {
                await api.put(`/communicate/wa-templates/${selectedId}`, formData);
                tt.success("template_updated_successfully");
            } else {
                await api.post('/communicate/wa-templates', formData);
                tt.success("template_added_successfully");
            }
            setIsDialogOpen(false);
            setFormData({ title: "", template_id: "", message: "" });
            setEditMode(false);
            setSelectedId(null);
            fetchTemplates();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            tt.toast("error", err.response?.data?.message || "failed_to_save_template");
        }
    };

    const handleEdit = (template: WaTemplate) => {
        setFormData({ title: template.title, template_id: template.template_id || "", message: template.message });
        setSelectedId(template.id);
        setEditMode(true);
        setViewMode(false);
        setIsDialogOpen(true);
    };

    const handleView = (template: WaTemplate) => {
        setFormData({ title: template.title, template_id: template.template_id || "", message: template.message });
        setViewMode(true);
        setEditMode(false);
        setSelectedId(template.id);
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({ title: "", template_id: "", message: "" });
        setEditMode(false);
        setViewMode(false);
        setSelectedId(null);
    };

    const handleDelete = async (id: number) => {
        if (confirm(t("delete_template_confirm"))) {
            try {
                await api.delete(`/communicate/wa-templates/${id}`);
                tt.success("template_deleted_successfully");
                fetchTemplates();
            } catch {
                tt.toast("error", "failed_to_delete_template");
            }
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        const textarea = textareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newMessage = formData.message.slice(0, start) + emoji + formData.message.slice(end);
            setFormData({ ...formData, message: newMessage });
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
                textarea.focus();
            }, 0);
        } else {
            setFormData({ ...formData, message: formData.message + emoji });
        }
    };

    const handleVariableSelect = (variable: string) => {
        const textarea = textareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newMessage = formData.message.slice(0, start) + variable + formData.message.slice(end);
            setFormData({ ...formData, message: newMessage });
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + variable.length;
                textarea.focus();
            }, 0);
        } else {
            setFormData({ ...formData, message: formData.message + variable });
        }
    };

    const handleCopy = () => {
        const text = templates.map(t => `${t.title}\t${t.message}`).join('\n');
        navigator.clipboard.writeText(text);
        tt.success("data_copied_to_clipboard");
    };

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(templates.map(t => ({
            Title: t.title,
            'Template ID': t.template_id || '',
            Message: t.message
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "WA Templates");
        XLSX.writeFile(workbook, "wa_templates.xlsx");
        tt.success("exported_to_excel_successfully");
    };

    const handleExportCSV = () => {
        const headers = ["Title", "Message"];
        const rows = templates.map(t => [t.title, t.message]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "wa_templates.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text(t("wa_templates_report"), 14, 15);
        const tableColumn = [t("title"), t("template_id"), t("message")];
        const tableRows = templates.map(t => [
            t.title,
            t.template_id || '--',
            t.message
        ]);
        autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
        doc.save("wa_templates.pdf");
        tt.success("exported_to_pdf_successfully");
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-indigo-500" />
                    </div>
                    <h1 className="text-lg font-bold text-gray-800 tracking-tight uppercase">{t("wa_template_list")}</h1>
                </div>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="btn-gradient gap-2 h-9 px-6 text-[10px] font-bold uppercase transition-all rounded-full shadow-lg shadow-indigo-100">
                    <Plus className="h-4 w-4" /> {t("add_template")}
                </Button>
            </div>

            {/* Main Content Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <MessageSquare className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("wa_templates")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{pagination?.total || 0} {t("templates").toLowerCase()}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full max-w-sm group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder={t("search_templates")}
                                className="pl-10 h-10 rounded-lg bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={limit}
                                onChange={(e) => setLimit(e.target.value)}
                                className="h-10 px-3 rounded-lg border border-muted/50 bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-medium text-muted-foreground"
                            >
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                            </select>
                            <div className="h-8 w-px bg-muted/50 mx-2" />
                            <div className="flex gap-1">
                                <IconButton icon={CopyIcon} onClick={handleCopy} title={t("copy")} />
                                <IconButton icon={FileSpreadsheet} onClick={handleExportExcel} title={t("excel")} />
                                <IconButton icon={FileText} onClick={handleExportCSV} title={t("csv")} />
                                <IconButton icon={FileCode} onClick={handleExportPDF} title={t("pdf")} />
                                <IconButton icon={Printer} onClick={() => window.print()} title={t("print")} />
                            </div>
                        </div>
                    </div>

                    {/* Template Table */}
                    <div className="rounded-lg border border-muted/50 overflow-hidden bg-muted/10 shadow-inner">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-muted/30">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50">{t("title")}</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50">{t("template_id")}</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50">{t("message")}</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 text-right">{t("action")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-muted/50">
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={4} />
                                    ) : templates.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data_found")}</td>
                                        </tr>
                                    ) : (
                                        templates.map((template) => (
                                            <tr key={template.id} className="hover:bg-muted/20 transition-colors group/row">
                                                <td className="px-6 py-4 text-sm font-bold text-foreground">{template.title}</td>
                                                <td className="px-6 py-4 text-xs font-medium text-muted-foreground">{template.template_id || '--'}</td>
                                                <td className="px-6 py-4 text-xs text-muted-foreground truncate max-w-[300px]">{template.message}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-1.5 pr-2">
                                                        <Button size="icon" onClick={() => handleView(template)}
                                                            className="h-8 w-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-90 transition-all" title={t("view")}>
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button size="icon" onClick={() => handleEdit(template)}
                                                            className="h-8 w-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 active:scale-90 transition-all" title={t("edit")}>
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button size="icon" onClick={() => handleDelete(template.id)}
                                                            className="h-8 w-8 rounded-lg bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 active:scale-90 transition-all" title={t("delete")}>
                                                            <X className="h-4 w-4" />
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
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-medium">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                {t("showing_x_to_y_of_z", { from: pagination.from, to: pagination.to, total: pagination.total })}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button size="icon" disabled={pagination.current_page === 1}
                                    onClick={() => fetchTemplates(pagination.current_page - 1)}
                                    className="h-8 w-8 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-card active:scale-95 transition-all">
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                {Array.from({ length: pagination.last_page }, (_, i) => (
                                    <Button key={i + 1} size="icon" onClick={() => fetchTemplates(i + 1)}
                                        className={cn(
                                            "h-8 w-8 rounded-[10px] border-none p-0 font-bold active:scale-95 transition-all",
                                            pagination.current_page === i + 1
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md shadow-orange-500/10"
                                                : "bg-white border border-gray-200 text-gray-600 hover:bg-card"
                                        )}>
                                        {i + 1}
                                    </Button>
                                ))}
                                <Button size="icon" disabled={pagination.current_page === pagination.last_page}
                                    onClick={() => fetchTemplates(pagination.current_page + 1)}
                                    className="h-8 w-8 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-card active:scale-95 transition-all">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit/View Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 rounded-lg border-none shadow-2xl">
                    <div className="bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] p-6">
                        <DialogHeader className="p-0">
                            <DialogTitle className="text-base font-bold tracking-tight text-slate-800 flex items-center gap-2">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    <MessageSquare className="h-4 w-4" />
                                </span>
                                {viewMode ? t("view_wa_template") : editMode ? t("edit_wa_template") : t("add_wa_template")}
                            </DialogTitle>
                            <p className="text-[11px] text-gray-500 mt-1 pl-10">
                                {viewMode ? t("review_template_details") : editMode ? t("update_existing_wa_template") : t("create_new_wa_template")}
                            </p>
                        </DialogHeader>
                    </div>
                    <div className="p-6 space-y-4 bg-white overflow-y-auto max-h-[70vh]">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t("title")} <span className="text-red-500">*</span></Label>
                            {viewMode ? (
                                <p className="text-sm text-gray-700 font-medium px-1">{formData.title}</p>
                            ) : (
                                <Input value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder={t("wa_template_title_placeholder")}
                                    className="h-9 border-gray-200 text-xs shadow-none focus-visible:ring-indigo-500" />
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t("template_id")} <span className="text-gray-300 font-normal normal-case tracking-normal">({t("optional")})</span></Label>
                            <Input value={formData.template_id}
                                onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                                readOnly={viewMode}
                                placeholder={t("wa_template_id_placeholder")}
                                className="h-9 border-gray-200 text-xs shadow-none focus-visible:ring-indigo-500" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t("message")} <span className="text-red-500">*</span></Label>
                            {viewMode ? (
                                <div className="border border-gray-100 rounded-lg p-4 min-h-[120px] text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{formData.message}</div>
                            ) : (
                                <>
                                    <div className="relative">
                                        <Textarea ref={textareaRef}
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            placeholder={t("enter_template_message_content")}
                                            className="border-gray-200 text-xs shadow-none min-h-[120px] focus-visible:ring-indigo-500 leading-relaxed pb-8"
                                            maxLength={65536} />
                                        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
                                            <VariablePicker onSelect={handleVariableSelect} />
                                            <EmojiPicker onSelect={handleEmojiSelect} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-medium">
                                        <MessageSquare className="h-3 w-3 text-indigo-400" />
                                        <span className={cn("transition-colors", waInfo.chars === 0 ? "text-gray-300" : "text-green-600")}>
                                            {waInfo.chars.toLocaleString()} {t("characters")}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                        <DialogFooter className="gap-3">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}
                                className="h-10 text-[10px] uppercase font-bold rounded-full px-8 bg-white border-gray-200">
                                {viewMode ? t("close") : t("cancel")}
                            </Button>
                            {!viewMode && (
                                <Button onClick={handleSave} className="btn-gradient h-10 px-10 text-[10px] uppercase font-bold rounded-full shadow-xl shadow-indigo-100">
                                    {editMode ? t("update_template") : t("save_template")}
                                </Button>
                            )}
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
