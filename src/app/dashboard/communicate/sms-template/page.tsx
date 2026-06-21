"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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

interface SMSTemplate {
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

export default function SMSTemplatePage() {
    const { toast } = useToast();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [templates, setTemplates] = useState<SMSTemplate[]>([]);
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

    const GSM7_REGEX = /^[\x00-\x7F]*$/;
    const SMS_LIMIT_GSM7 = 160;
    const SMS_LIMIT_UNICODE = 70;
    const SMS_MULTI_GSM7 = 153;
    const SMS_MULTI_UNICODE = 67;

    const getSmsInfo = (text: string) => {
        if (!text) return { chars: 0, segments: 0, perSegment: SMS_LIMIT_GSM7, isUnicode: false };
        const isGsm = GSM7_REGEX.test(text);
        const maxLen = isGsm ? SMS_LIMIT_GSM7 : SMS_LIMIT_UNICODE;
        const multiLen = isGsm ? SMS_MULTI_GSM7 : SMS_MULTI_UNICODE;
        const len = text.length;
        if (len <= maxLen) return { chars: len, segments: len > 0 ? 1 : 0, perSegment: maxLen, isUnicode: !isGsm };
        return { chars: len, segments: Math.ceil(len / multiLen), perSegment: maxLen, isUnicode: !isGsm };
    };

    const smsInfo = getSmsInfo(formData.message);

    const fetchTemplates = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/communicate/sms-templates?page=${page}&limit=${limit}&search=${searchTerm}`);
            setTemplates(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch SMS templates", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [searchTerm, limit, toast]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleSave = async () => {
        try {
            if (editMode && selectedId) {
                await api.put(`/communicate/sms-templates/${selectedId}`, formData);
                toast({ title: "Success", description: "Template updated successfully" });
            } else {
                await api.post('/communicate/sms-templates', formData);
                toast({ title: "Success", description: "Template added successfully" });
            }
            setIsDialogOpen(false);
            setFormData({ title: "", template_id: "", message: "" });
            setEditMode(false);
            setSelectedId(null);
            fetchTemplates();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast({
                title: "Error",
                description: err.response?.data?.message || "Failed to save template",
                variant: "destructive",
            });
        }
    };

    const handleEdit = (template: SMSTemplate) => {
        setFormData({ title: template.title, template_id: template.template_id || "", message: template.message });
        setSelectedId(template.id);
        setEditMode(true);
        setViewMode(false);
        setIsDialogOpen(true);
    };

    const handleView = (template: SMSTemplate) => {
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
        if (confirm("Are you sure you want to delete this template?")) {
            try {
                await api.delete(`/communicate/sms-templates/${id}`);
                toast({ title: "Success", description: "Template deleted successfully" });
                fetchTemplates();
            } catch (error) {
                toast({ title: "Error", description: "Failed to delete template", variant: "destructive" });
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
        toast({ title: "Copied", description: "Data copied to clipboard" });
    };

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(templates.map(t => ({
            Title: t.title,
            'Template ID': t.template_id || '',
            Message: t.message
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "SMS Templates");
        XLSX.writeFile(workbook, "sms_templates.xlsx");
        toast({ title: "Success", description: "Exported to Excel successfully" });
    };

    const handleExportCSV = () => {
        const headers = ["Title", "Message"];
        const rows = templates.map(t => [t.title, t.message]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "sms_templates.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text("SMS Templates Report", 14, 15);
        const tableColumn = ["Title", "Template ID", "Message"];
        const tableRows = templates.map(t => [
            t.title,
            t.template_id || '--',
            t.message
        ]);
        autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
        doc.save("sms_templates.pdf");
        toast({ title: "Success", description: "Exported to PDF successfully" });
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-indigo-500" />
                    </div>
                    <h1 className="text-lg font-bold text-gray-800 tracking-tight uppercase">SMS Template List</h1>
                </div>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="btn-gradient gap-2 h-9 px-6 text-[10px] font-bold uppercase transition-all rounded-full shadow-lg shadow-indigo-100">
                    <Plus className="h-4 w-4" /> Add Template
                </Button>
            </div>

            {/* Main Content Card */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <MessageSquare className="h-5 w-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">SMS Templates</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{pagination?.total || 0} template(s)</p>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full max-w-sm group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search templates..."
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
                                <IconButton icon={CopyIcon} onClick={handleCopy} title="Copy" />
                                <IconButton icon={FileSpreadsheet} onClick={handleExportExcel} title="Excel" />
                                <IconButton icon={FileText} onClick={handleExportCSV} title="CSV" />
                                <IconButton icon={FileCode} onClick={handleExportPDF} title="PDF" />
                                <IconButton icon={Printer} onClick={() => window.print()} title="Print" />
                            </div>
                        </div>
                    </div>

                    {/* Template Table */}
                    <div className="rounded-lg border border-muted/50 overflow-hidden bg-muted/10 shadow-inner">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-muted/30">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50">Title</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50">Template ID</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50">Message</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-muted/50">
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={4} />
                                    ) : templates.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">No data found</td>
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
                                                            className="h-8 w-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-90 transition-all" title="View">
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button size="icon" onClick={() => handleEdit(template)}
                                                            className="h-8 w-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 active:scale-90 transition-all" title="Edit">
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button size="icon" onClick={() => handleDelete(template.id)}
                                                            className="h-8 w-8 rounded-lg bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 active:scale-90 transition-all" title="Delete">
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
                                Showing {pagination.from} to {pagination.to} of {pagination.total} entries
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
                                {viewMode ? "View SMS Template" : editMode ? "Edit SMS Template" : "Add SMS Template"}
                            </DialogTitle>
                            <p className="text-[11px] text-gray-500 mt-1 pl-10">
                                {viewMode ? "Review template details" : editMode ? "Update an existing SMS template" : "Create a new SMS template"}
                            </p>
                        </DialogHeader>
                    </div>
                    <div className="p-6 space-y-4 bg-white overflow-y-auto max-h-[70vh]">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Title <span className="text-red-500">*</span></Label>
                            {viewMode ? (
                                <p className="text-sm text-gray-700 font-medium px-1">{formData.title}</p>
                            ) : (
                                <Input value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Fees Reminder"
                                    className="h-9 border-gray-200 text-xs shadow-none focus-visible:ring-indigo-500" />
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Template ID <span className="text-gray-300 font-normal normal-case tracking-normal">(optional)</span></Label>
                            <Input value={formData.template_id}
                                onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                                readOnly={viewMode}
                                placeholder="e.g. DLT Template ID"
                                className="h-9 border-gray-200 text-xs shadow-none focus-visible:ring-indigo-500" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Message <span className="text-red-500">*</span></Label>
                            {viewMode ? (
                                <div className="border border-gray-100 rounded-lg p-4 min-h-[120px] text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{formData.message}</div>
                            ) : (
                                <>
                                    <div className="relative">
                                        <Textarea ref={textareaRef}
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            placeholder="Enter template message content..."
                                            className="border-gray-200 text-xs shadow-none min-h-[120px] focus-visible:ring-indigo-500 leading-relaxed pb-8"
                                            maxLength={smsInfo.isUnicode ? 918 : 4590} />
                                        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
                                            <VariablePicker onSelect={handleVariableSelect} />
                                            <EmojiPicker onSelect={handleEmojiSelect} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-medium">
                                        <MessageSquare className="h-3 w-3 text-indigo-400" />
                                        <span className={cn(
                                            "transition-colors",
                                            smsInfo.chars === 0 ? "text-gray-300" :
                                            smsInfo.segments <= 1 ? "text-green-600" :
                                            smsInfo.segments <= 3 ? "text-amber-600" :
                                            "text-red-600"
                                        )}>
                                            {smsInfo.chars.toLocaleString()} Characters ({smsInfo.segments} SMS{smsInfo.segments !== 1 ? 'es' : ''})
                                            {smsInfo.chars > 0 && (
                                                <span className="text-gray-400 ml-1">— {smsInfo.perSegment} per segment{smsInfo.isUnicode ? ' (Unicode)' : ''}</span>
                                            )}
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
                                {viewMode ? "Close" : "Cancel"}
                            </Button>
                            {!viewMode && (
                                <Button onClick={handleSave} className="btn-gradient h-10 px-10 text-[10px] uppercase font-bold rounded-full shadow-xl shadow-indigo-100">
                                    {editMode ? "Update Template" : "Save Template"}
                                </Button>
                            )}
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
