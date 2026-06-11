"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
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
    Paperclip,
    CloudUpload,
    Download,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import VariablePicker from "@/components/ui/variable-picker";

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
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const ckeditorRef = useRef<{ insertText: (text: string) => void }>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [limit, setLimit] = useState("50");

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [viewMode, setViewMode] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [existingAttachment, setExistingAttachment] = useState<string | null | undefined>(null);
    const [existingFilename, setExistingFilename] = useState<string | null | undefined>(null);
    const [removeAttachment, setRemoveAttachment] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        template_id: "",
        message: "",
    });

    useEffect(() => {
        fetchTemplates();
    }, [searchTerm, limit]);

    const fetchTemplates = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/communicate/email-templates?page=${page}&limit=${limit}&search=${searchTerm}`);
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
            toast({ title: "Error", description: "Failed to fetch email templates", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

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
                toast({ title: "Success", description: "Template updated successfully" });
            } else {
                await api.post('/communicate/email-templates', data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast({ title: "Success", description: "Template added successfully" });
            }
            setIsDialogOpen(false);
            resetForm();
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

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this template?")) {
            try {
                await api.delete(`/communicate/email-templates/${id}`);
                toast({ title: "Success", description: "Template deleted successfully" });
                fetchTemplates();
            } catch (error) {
                toast({ title: "Error", description: "Failed to delete template", variant: "destructive" });
            }
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
            const filename = template?.original_filename || 'attachment';
            link.setAttribute('download', filename);
            link.click();
            window.URL.revokeObjectURL(url);
        } catch {
            toast({ title: "Error", description: "Failed to download attachment", variant: "destructive" });
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
        link.setAttribute("download", "email_templates.csv");
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
                <h1 className="text-sm font-medium text-gray-800">Email Template List</h1>
                <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="btn-gradient gap-2 h-8 px-4 text-[10px] font-bold uppercase transition-all rounded-full shadow-md">
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
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 w-[200px]">Title</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 w-[150px]">Template ID</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Message</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 w-[80px]">Attach</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right w-[120px]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                         <TableBody>
                            {templates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-gray-400 text-xs italic">
                                        No email templates found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                templates.map((template) => (
                                    <TableRow key={template.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                                        <TableCell className="py-4 text-gray-700 font-bold uppercase tracking-tight align-top w-[200px]">{template.title}</TableCell>
                                        <TableCell className="py-4 text-gray-500 font-medium align-top w-[150px]">{template.template_id || '--'}</TableCell>
                                        <TableCell className="py-4 text-gray-500 leading-relaxed font-normal align-top truncate max-w-[300px]">
                                            {template.message}
                                        </TableCell>
                                        <TableCell className="py-4 align-top w-[80px]">
                                            {template.attachment ? (
                                                <button
                                                    onClick={() => handleDownloadAttachment(template.id)}
                                                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-md transition-colors"
                                                    title={template.original_filename || 'Download attachment'}
                                                >
                                                    <Paperclip className="h-3 w-3" />
                                                    File
                                                </button>
                                            ) : (
                                                <span className="text-gray-300 text-[10px]">--</span>
                                            )}
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
                <DialogContent className="sm:max-w-[900px]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-gray-800">
                            {viewMode ? "View Email Template" : editMode ? "Edit Email Template" : "Add Email Template"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Title <span className="text-red-500">*</span></Label>
                            <Input 
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                readOnly={viewMode}
                                placeholder="e.g. Annual Day Celebration Notification"
                                className="h-9 border-gray-200 text-xs shadow-none focus-visible:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Template ID <span className="text-gray-300 font-normal normal-case tracking-normal">(optional)</span></Label>
                            <Input 
                                value={formData.template_id}
                                onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                                readOnly={viewMode}
                                placeholder="e.g. SendGrid Template ID"
                                className="h-9 border-gray-200 text-xs shadow-none focus-visible:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Message <span className="text-red-500">*</span></Label>
                            {viewMode ? (
                                <div className="border border-gray-100 rounded-lg p-4 min-h-[200px] prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-headings:font-bold prose-a:text-indigo-600 prose-img:max-w-full prose-img:h-auto prose-table:w-full prose-pre:overflow-x-auto"
                                    dangerouslySetInnerHTML={{ __html: formData.message }}
                                />
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div />
                                        <VariablePicker onSelect={handleVariableSelect} />
                                    </div>
                                    <div className="border border-gray-100 rounded-lg overflow-hidden">
                                        <CKEditorWrapper
                                            ref={ckeditorRef}
                                            value={formData.message}
                                            onChange={(value) => setFormData({ ...formData, message: value })}
                                            placeholder="Enter email template content..."
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Attachment Section */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                Attachment <span className="text-gray-300 font-normal normal-case tracking-normal">(optional)</span>
                            </Label>
                            {viewMode ? (
                                <div>
                                    {existingAttachment ? (
                                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                            <Paperclip className="h-4 w-4 text-amber-500 shrink-0" />
                                            <span className="text-xs text-amber-700 font-medium truncate flex-1">{existingFilename || 'Attachment'}</span>
                                            <button
                                                onClick={() => handleDownloadAttachment(selectedId!)}
                                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 hover:text-amber-800 transition-colors"
                                            >
                                                <Download className="h-3 w-3" /> Download
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 italic">No attachment</p>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {existingAttachment && !selectedFile && !removeAttachment ? (
                                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-2">
                                            <Paperclip className="h-4 w-4 text-amber-500 shrink-0" />
                                            <span className="text-xs text-amber-700 font-medium truncate flex-1">{existingFilename || 'Attachment'}</span>
                                            <button
                                                type="button"
                                                onClick={() => setRemoveAttachment(true)}
                                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-500 hover:text-red-700 transition-colors"
                                            >
                                                <X className="h-3 w-3" /> Remove
                                            </button>
                                        </div>
                                    ) : selectedFile ? (
                                        <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg mb-2">
                                            <Paperclip className="h-4 w-4 text-indigo-500 shrink-0" />
                                            <span className="text-xs text-indigo-700 font-medium truncate flex-1">{selectedFile.name}</span>
                                            <button
                                                type="button"
                                                onClick={handleRemoveSelectedFile}
                                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-500 hover:text-red-700 transition-colors"
                                            >
                                                <X className="h-3 w-3" /> Remove
                                            </button>
                                        </div>
                                    ) : null}
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
                                    >
                                        <CloudUpload className="h-5 w-5 text-gray-300 mx-auto mb-1" />
                                        <p className="text-[11px] text-gray-400 font-medium">
                                            Click to upload or drag and drop
                                        </p>
                                        <p className="text-[9px] text-gray-300 mt-0.5">
                                            PDF, JPG, PNG, DOC, DOCX, PPTX, XLSX, TXT (max 5MB)
                                        </p>
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
