"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
    Plus, Edit2, Trash2, FileText, RefreshCw, Search, Eye,
    Copy as CopyIcon, FileSpreadsheet, Printer, ChevronLeft, ChevronRight,
    FileCode, MessageSquare
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
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import api from "@/lib/api";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function IconButton({ icon: Icon, onClick, title }: { icon: React.ElementType; onClick?: () => void; title?: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className="p-2 hover:bg-muted rounded-lg transition-colors border border-muted/50 text-muted-foreground hover:text-foreground shadow-sm active:scale-95 bg-background"
        >
            <Icon className="h-4 w-4" />
        </button>
    );
}

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
    const { t } = useTranslation();
    const { toast } = useToast();

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
            const res = await api.get(`/communicate/notification-templates?page=${currentPage}&per_page=${limit}`);
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
        } catch (error) {
            console.error("Failed to fetch notification templates", error);
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
            toast({
                title: "Validation Error",
                description: "Title and message are required.",
                variant: "destructive",
            });
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
                toast({ title: "Success", description: "Notification template updated successfully!" });
            } else {
                await api.post("/communicate/notification-templates", payload);
                toast({ title: "Success", description: "Notification template created successfully!" });
            }

            setIsDialogOpen(false);
            fetchTemplates();
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.response?.data?.message || "Failed to save notification template.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await api.delete(`/communicate/notification-templates/${deleteId}`);
            toast({ title: "Success", description: "Notification template deleted successfully!" });
            setDeleteId(null);
            fetchTemplates();
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.response?.data?.message || "Failed to delete notification template.",
                variant: "destructive",
            });
        } finally {
            setDeleting(false);
        }
    };

    // Export Handlers
    const handleCopy = () => {
        const text = templates.map(t => `${t.title}\t${t.template_id || ''}\t${t.message}`).join("\n");
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard" });
    };

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(templates.map(t => ({
            Title: t.title,
            TemplateID: t.template_id || '',
            Message: t.message,
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Notification Templates");
        XLSX.writeFile(workbook, "notification_templates.xlsx");
        toast({ title: "Exported to Excel" });
    };

    const handleExportCSV = () => {
        const headers = ["Title", "Template ID", "Message"];
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
        toast({ title: "Exported to CSV" });
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text("Notification Templates Report", 14, 15);
        const tableColumn = ["Title", "Template ID", "Message"];
        const tableRows = templates.map(t => [t.title, t.template_id || '--', t.message]);
        autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
        doc.save("notification_templates.pdf");
        toast({ title: "Exported to PDF" });
    };

    const filteredTemplates = templates.filter((t) =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.message.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6 p-4 lg:p-6 animate-in fade-in duration-300">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl">
                        <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground uppercase">
                            {t("notification_template") || "Notification Template List"}
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Manage pre-defined in-app notification templates for quick dispatching.
                        </p>
                    </div>
                </div>

                <Button
                    onClick={handleOpenCreate}
                    className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 px-5 h-10 text-xs uppercase tracking-wide"
                >
                    <Plus className="h-4 w-4" />
                    Add Notification Template
                </Button>
            </div>

            {/* Content Table Card */}
            <Card className="border shadow-sm overflow-hidden pt-0">
                {/* Fully top-filled gradient header from #FEF4E7 to #EFF0FC */}
                <CardHeader className="flex flex-row items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#FEF4E7] to-[#EFF0FC] dark:from-[#29221a] dark:to-[#1a1b2d] border-b">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <FileText className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-foreground leading-none">
                                Notification Templates
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1 font-medium">
                                {pagination?.total || filteredTemplates.length} {t("templates").toLowerCase()}
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                    {/* Toolbar: Search + Page size + Export Controls */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full max-w-sm group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder={t("search_templates") || "Search templates..."}
                                className="pl-10 h-10 rounded-lg bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium text-xs"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-auto">
                            {/* Page size selector dropdown: 10, 20, 50, 100 (Default 20) */}
                            <select
                                value={limit}
                                onChange={(e) => {
                                    setLimit(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-9 px-3 rounded-lg border border-muted/50 bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-bold text-foreground"
                            >
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>

                            <div className="h-7 w-px bg-muted/50 mx-1" />

                            <div className="flex gap-1">
                                <IconButton icon={CopyIcon} onClick={handleCopy} title={t("copy") || "Copy"} />
                                <IconButton icon={FileSpreadsheet} onClick={handleExportExcel} title={t("excel") || "Excel"} />
                                <IconButton icon={FileText} onClick={handleExportCSV} title={t("csv") || "CSV"} />
                                <IconButton icon={FileCode} onClick={handleExportPDF} title={t("pdf") || "PDF"} />
                                <IconButton icon={Printer} onClick={() => window.print()} title={t("print") || "Print"} />
                            </div>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="rounded-xl border border-muted/50 overflow-hidden bg-muted/10 shadow-inner">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-muted/30 border-b border-muted/50 font-black uppercase text-muted-foreground/70 tracking-wider">
                                        <th className="px-5 py-3.5 min-w-[200px]">Title</th>
                                        <th className="px-5 py-3.5 min-w-[150px]">Template ID</th>
                                        <th className="px-5 py-3.5 min-w-[300px]">Message Body</th>
                                        <th className="px-5 py-3.5 text-right min-w-[120px]">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-10 text-muted-foreground">
                                                <RefreshCw className="h-5 w-5 animate-spin inline mr-2 text-primary" />
                                                Loading templates...
                                            </td>
                                        </tr>
                                    ) : filteredTemplates.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-10 text-muted-foreground italic">
                                                No notification templates found. Click "Add Notification Template" to create one.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTemplates.map((tmpl) => (
                                            <tr key={tmpl.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-5 py-3.5 font-bold text-foreground">{tmpl.title}</td>
                                                <td className="px-5 py-3.5 font-mono text-xs">{tmpl.template_id || "—"}</td>
                                                <td className="px-5 py-3.5 text-muted-foreground line-clamp-2 max-w-md">{tmpl.message}</td>
                                                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            size="icon"
                                                            onClick={() => handleOpenView(tmpl)}
                                                            className="h-8 w-8 bg-gradient-to-r from-sky-400 to-blue-500 hover:opacity-90 text-white border-0 shadow-sm rounded-lg"
                                                            title="View Template"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            onClick={() => handleOpenEdit(tmpl)}
                                                            className="h-8 w-8 bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white border-0 shadow-sm rounded-lg"
                                                            title="Edit Template"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            onClick={() => setDeleteId(tmpl.id)}
                                                            className="h-8 w-8 bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-90 text-white border-0 shadow-sm rounded-lg"
                                                            title="Delete Template"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
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
                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-black tracking-wider text-muted-foreground/70 uppercase">
                            <span>
                                SHOWING {pagination.from || 0} TO {pagination.to || 0} OF {pagination.total || 0} ENTRIES
                            </span>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    disabled={currentPage <= 1 || loading}
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    className="h-8 w-8 rounded-full border border-muted/60 flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors shadow-sm"
                                    title="Previous"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: pagination.last_page || 1 }, (_, i) => i + 1).map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setCurrentPage(p)}
                                            className={`h-8 w-8 rounded-xl text-xs font-bold transition-all shadow-sm ${
                                                p === currentPage
                                                    ? "bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-indigo-200/50"
                                                    : "border border-muted/40 hover:bg-muted text-muted-foreground"
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    disabled={currentPage >= (pagination.last_page || 1) || loading}
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.last_page))}
                                    className="h-8 w-8 rounded-full border border-muted/60 flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors shadow-sm"
                                    title="Next"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add / Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingTemplate ? "Edit Notification Template" : "Add Notification Template"}
                        </DialogTitle>
                        <DialogDescription>
                            Create standard messages to reuse when sending in-app notifications.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSave} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="title" className="text-xs font-semibold">Title *</Label>
                            <Input
                                id="title"
                                placeholder="Template Title"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="message" className="text-xs font-semibold">Message Body *</Label>
                            <Textarea
                                id="message"
                                rows={4}
                                placeholder="Template Content..."
                                value={formMessage}
                                onChange={(e) => setFormMessage(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="template_id" className="text-xs font-semibold">Template ID (Optional)</Label>
                            <Input
                                id="template_id"
                                placeholder="e.g. NOTIF-001"
                                value={formTemplateId}
                                onChange={(e) => setFormTemplateId(e.target.value)}
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground font-bold">
                                {saving ? "Saving..." : "Save Template"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={!!viewingTemplate} onOpenChange={() => setViewingTemplate(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Template Details</DialogTitle>
                    </DialogHeader>
                    {viewingTemplate && (
                        <div className="space-y-3 py-2 text-xs">
                            <div>
                                <span className="font-semibold text-muted-foreground uppercase text-[10px]">Title</span>
                                <p className="font-bold text-sm text-foreground">{viewingTemplate.title}</p>
                            </div>
                            {viewingTemplate.template_id && (
                                <div>
                                    <span className="font-semibold text-muted-foreground uppercase text-[10px]">Template ID</span>
                                    <p className="font-mono text-foreground">{viewingTemplate.template_id}</p>
                                </div>
                            )}
                            <div>
                                <span className="font-semibold text-muted-foreground uppercase text-[10px]">Message Content</span>
                                <p className="p-3 rounded-lg bg-muted/40 text-foreground whitespace-pre-wrap leading-relaxed">
                                    {viewingTemplate.message}
                                </p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewingTemplate(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this notification template.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground font-bold hover:bg-destructive/90"
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
