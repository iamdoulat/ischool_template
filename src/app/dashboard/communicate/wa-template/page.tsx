"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Eye,
    Pencil,
    X,
    Plus,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    MessageSquare,
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
    const { toast } = useToast();
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

    useEffect(() => {
        fetchTemplates();
    }, [searchTerm, limit]);

    const fetchTemplates = async (page = 1) => {
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
        } catch (error) {
            console.error("Error fetching templates:", error);
            toast({ title: "Error", description: "Failed to fetch WA Templates", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (editMode && selectedId) {
                await api.put(`/communicate/wa-templates/${selectedId}`, formData);
                toast({ title: "Success", description: "Template updated successfully" });
            } else {
                await api.post('/communicate/wa-templates', formData);
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

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this template?")) {
            try {
                await api.delete(`/communicate/wa-templates/${id}`);
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

    const toolbarActions = [
        { Icon: Copy, onClick: handleCopy, title: "Copy" },
        { Icon: FileSpreadsheet, onClick: handleExportCSV, title: "Excel" },
        { Icon: FileText, onClick: handleExportCSV, title: "CSV" },
        { Icon: Printer, onClick: () => window.print(), title: "Print" },
        { Icon: Columns, onClick: () => {}, title: "Columns" },
    ];

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
             {/* Header Section */}
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-sm font-medium text-gray-800">WA Template List</h1>
                <Button onClick={() => { setEditMode(false); setViewMode(false); setSelectedId(null); setFormData({ title: "", template_id: "", message: "" }); setIsDialogOpen(true); }} className="btn-gradient gap-2 h-8 px-4 text-[10px] font-bold uppercase transition-all rounded-full shadow-md">
                    <Plus className="h-4 w-4" /> Add Template
                </Button>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50 pb-4">
                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder="Search templates..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-3 h-9 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded-full shadow-none bg-gray-50/50"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                            <Select value={limit} onValueChange={setLimit}>
                                <SelectTrigger className="h-7 w-16 text-[10px] border-gray-200 bg-transparent shadow-none rounded-md px-2">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                            <ChevronLeft className="h-3 w-3 text-gray-400 rotate-90" />
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                            {toolbarActions.map((action, i) => (
                                <Button 
                                    key={i} 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={action.onClick}
                                    title={action.title}
                                    className="h-7 w-7 hover:bg-gray-100 rounded"
                                >
                                    <action.Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Template Table */}
                <div className="rounded border border-gray-50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100">
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 w-[200px]">
                                    <div className="flex items-center gap-1 cursor-pointer">
                                        Title <ArrowUpDown className="h-2.5 w-2.5" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 w-[150px]">Template ID</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">
                                        Message <ArrowUpDown className="h-2.5 w-2.5" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right w-[120px]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                         <TableBody>
                            {templates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-gray-400 text-xs italic">
                                        No templates found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                templates.map((template) => (
                                    <TableRow key={template.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                                        <TableCell className="py-4 text-gray-700 font-bold uppercase tracking-tight align-top w-[200px]">{template.title}</TableCell>
                                        <TableCell className="py-4 text-gray-500 font-medium align-top w-[150px]">{template.template_id || '--'}</TableCell>
                                        <TableCell className="py-4 text-gray-500 leading-relaxed font-normal align-top">
                                            {template.message}
                                        </TableCell>
                                        <TableCell className="py-4 text-right align-top w-[120px]">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button size="icon" variant="ghost" onClick={() => handleView(template)} className="h-7 w-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition-all shadow-sm">
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleEdit(template)} className="h-7 w-7 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-all shadow-sm">
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleDelete(template.id)} className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-md transition-all shadow-sm">
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                 {/* Footer / Pagination */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-4 border-t border-gray-50">
                    <div>
                        Showing {pagination?.from || 0} to {pagination?.to || 0} of {pagination?.total || 0} entries
                    </div>
                    <div className="flex gap-2 items-center">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={pagination?.current_page === 1}
                            onClick={() => fetchTemplates(pagination!.current_page - 1)}
                            className="h-7 w-7 rounded-lg border-gray-100 hover:bg-gray-50 transition-colors shadow-none disabled:opacity-30"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        {[...Array(pagination?.last_page || 0)].map((_, i) => (
                            <Button 
                                key={i + 1}
                                onClick={() => fetchTemplates(i + 1)}
                                className={cn(
                                    "h-7 w-7 p-0 text-[11px] font-bold rounded-lg shadow-sm transition-all duration-300",
                                    pagination?.current_page === i + 1 
                                        ? "btn-gradient" 
                                        : "bg-white text-gray-400 hover:bg-gray-50 border border-gray-100"
                                )}
                            >
                                {i + 1}
                            </Button>
                        ))}
                        <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={pagination?.current_page === pagination?.last_page}
                            onClick={() => fetchTemplates(pagination!.current_page + 1)}
                            className="h-7 w-7 rounded-lg border-gray-100 hover:bg-gray-50 transition-colors shadow-none disabled:opacity-30"
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Add/Edit/View Template Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-gray-800">
                            {viewMode ? "View WA Template" : editMode ? "Edit WA Template" : "Add WA Template"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Title <span className="text-red-500">*</span></Label>
                            {viewMode ? (
                                <p className="text-sm text-gray-700 font-medium px-1">{formData.title}</p>
                            ) : (
                                <Input 
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    readOnly={viewMode}
                                    placeholder="e.g. Fees Reminder"
                                    className="h-9 border-gray-200 text-xs shadow-none focus-visible:ring-indigo-500"
                                />
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Template ID <span className="text-gray-300 font-normal normal-case tracking-normal">(optional)</span></Label>
                            <Input 
                                value={formData.template_id}
                                onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                                readOnly={viewMode}
                                placeholder="e.g. Meta Template ID"
                                className="h-9 border-gray-200 text-xs shadow-none focus-visible:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Message <span className="text-red-500">*</span></Label>
                            {viewMode ? (
                                <div className="border border-gray-100 rounded-lg p-4 min-h-[120px] text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {formData.message}
                                </div>
                            ) : (
                                <>
                                    <div className="relative">
                                        <Textarea 
                                            ref={textareaRef}
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            placeholder="Enter template message content..."
                                            className="border-gray-200 text-xs shadow-none min-h-[120px] focus-visible:ring-indigo-500 leading-relaxed pb-8"
                                            maxLength={65536}
                                        />
                                        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
                                            <VariablePicker onSelect={handleVariableSelect} />
                                            <EmojiPicker onSelect={handleEmojiSelect} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-medium">
                                        <MessageSquare className="h-3 w-3 text-indigo-400" />
                                        <span className={cn(
                                            "transition-colors",
                                            waInfo.chars === 0 ? "text-gray-300" :
                                            "text-green-600"
                                        )}>
                                            {waInfo.chars.toLocaleString()} Characters
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-9 text-[11px] uppercase font-bold rounded-full px-6">
                            {viewMode ? "Close" : "Cancel"}
                        </Button>
                        {!viewMode && (
                            <Button onClick={handleSave} className="btn-gradient h-9 px-8 text-[11px] uppercase font-bold rounded-full shadow-lg">
                                {editMode ? "Update Template" : "Save Template"}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
