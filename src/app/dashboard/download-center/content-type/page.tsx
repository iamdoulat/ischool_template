"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    Eye,
    X,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ContentType {
    id: number;
    name: string;
    description: string;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

export default function ContentTypePage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [limit, setLimit] = useState("50");
    const [isEditing, setIsEditing] = useState<number | null>(null);
    const [viewType, setViewType] = useState<ContentType | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
    });

    useEffect(() => {
        fetchContentTypes();
    }, [searchTerm, limit]);

    const fetchContentTypes = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/download-center/content-types?page=${page}&limit=${limit}&search=${searchTerm}`);
            setContentTypes(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
        } catch (error) {
            console.error("Error fetching content types:", error);
            toast({ title: "Error", description: "Failed to fetch content types", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/download-center/content-types/${isEditing}`, formData);
                toast({ title: "Success", description: "Content Type updated successfully" });
            } else {
                await api.post('/download-center/content-types', formData);
                toast({ title: "Success", description: "Content Type created successfully" });
            }
            setFormData({ name: "", description: "" });
            setIsEditing(null);
            fetchContentTypes();
        } catch (error: any) {
            toast({ 
                title: "Error", 
                description: error.response?.data?.message || "Failed to save content type", 
                variant: "destructive" 
            });
        }
    };

    const handleEdit = (type: ContentType) => {
        setIsEditing(type.id);
        setFormData({ name: type.name, description: type.description || "" });
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this content type?")) {
            try {
                await api.delete(`/download-center/content-types/${id}`);
                toast({ title: "Success", description: "Content Type deleted successfully" });
                fetchContentTypes();
            } catch (error) {
                toast({ title: "Error", description: "Failed to delete content type", variant: "destructive" });
            }
        }
    };

    const handleCopy = () => {
        const text = contentTypes.map(t => `${t.name}\t${t.description}`).join('\n');
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Data copied to clipboard" });
    };

    const handleExportCSV = () => {
        const headers = ["Name", "Description"];
        const rows = contentTypes.map(t => [t.name, t.description]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "content_types.csv");
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
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <FileText className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">Content Type</h1>
                        <p className="text-[11px] text-gray-500 mt-1">Manage download content categories</p>
                    </div>
                </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Section: Add Content Type */}
                <div className="w-full lg:w-1/3 xl:w-1/4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h2 className="text-sm font-medium text-gray-800">{isEditing ? "Edit" : "Add"} Content Type</h2>
                        </div>
                        <form onSubmit={handleSave} className="p-4 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                    Name <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Input 
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="h-9 border-gray-200 focus-visible:ring-indigo-500 rounded text-xs shadow-none" 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                                    Description
                                </Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="min-h-[100px] border-gray-200 focus-visible:ring-indigo-500 rounded text-xs shadow-none resize-none"
                                    placeholder=""
                                />
                            </div>
                            <div className="flex justify-end pt-2 gap-2">
                                {isEditing && (
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => { setIsEditing(null); setFormData({ name: "", description: "" }); }}
                                        className="h-8 text-[11px] font-bold uppercase rounded shadow-sm"
                                    >
                                        Cancel
                                    </Button>
                                )}
                                <Button type="submit" className="btn-gradient text-white px-6 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-sm">
                                    {isEditing ? "Update" : "Save"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Section: Content Type List */}
                <div className="flex-1">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-sm font-medium text-gray-800">Content Type List</h2>
                        </div>

                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50 pb-4">
                            <div className="relative w-full md:w-64">
                                <Input
                                    placeholder="Search content types..."
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

                        {/* Table */}
                        <div className="rounded border border-gray-50 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-100">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100">
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Name</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Description</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {contentTypes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-32 text-center text-gray-400 text-xs">
                                                No content types found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        contentTypes.map((type) => (
                                            <TableRow key={type.id} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 whitespace-nowrap group cursor-pointer">
                                                <TableCell className="py-3 text-gray-700 font-medium">{type.name}</TableCell>
                                                <TableCell className="py-3 text-gray-500">{type.description || "-"}</TableCell>
                                                <TableCell className="py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5 pr-2">
                                                        <Button 
                                                            size="icon" 
                                                            onClick={() => setViewType(type)}
                                                            className="h-8 w-8 rounded-lg bg-[#00B578] hover:bg-[#00A068] text-white shadow-md shadow-[#00B578]/20 transition-all hover:scale-105 active:scale-95"
                                                            title="View"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button 
                                                            size="icon" 
                                                            onClick={() => handleEdit(type)}
                                                            className="h-8 w-8 rounded-lg bg-[#FFA000] hover:bg-[#E69000] text-white shadow-md shadow-[#FFA000]/20 transition-all hover:scale-105 active:scale-95"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button 
                                                            size="icon" 
                                                            onClick={() => handleDelete(type.id)}
                                                            className="h-8 w-8 rounded-lg bg-[#FF3B30] hover:bg-[#E0342B] text-white shadow-md shadow-[#FF3B30]/20 transition-all hover:scale-105 active:scale-95"
                                                            title="Delete"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
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
                                    onClick={() => fetchContentTypes(pagination!.current_page - 1)}
                                    className="h-7 w-7 rounded-lg border-gray-100 hover:bg-gray-50 transition-colors shadow-none disabled:opacity-30"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                {[...Array(pagination?.last_page || 0)].map((_, i) => (
                                    <Button 
                                        key={i + 1}
                                        onClick={() => fetchContentTypes(i + 1)}
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
                                    onClick={() => fetchContentTypes(pagination!.current_page + 1)}
                                    className="h-7 w-7 rounded-lg border-gray-100 hover:bg-gray-50 transition-colors shadow-none disabled:opacity-30"
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Dialog */}
            <Dialog open={!!viewType} onOpenChange={(open) => !open && setViewType(null)}>
                <DialogContent className="max-w-md rounded-xl p-6 border-[0.5px] border-gray-200 bg-white shadow-2xl">
                    <DialogHeader className="border-b border-muted pb-4 flex flex-row items-center gap-3 space-y-0">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                            <Eye className="h-5 w-5" />
                        </span>
                        <div>
                            <DialogTitle className="text-base font-bold text-slate-800 leading-none">
                                View Content Type
                            </DialogTitle>
                            <p className="text-[11px] text-gray-500 mt-1">
                                Detailed content type information
                            </p>
                        </div>
                    </DialogHeader>
                    <div className="space-y-4 py-4 text-xs">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Name</span>
                            <span className="text-sm font-semibold text-foreground block bg-muted/20 p-2.5 rounded-lg border border-muted/50">{viewType?.name}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Description</span>
                            <span className="text-sm font-medium text-foreground block bg-muted/20 p-2.5 rounded-lg border border-muted/50 whitespace-pre-wrap min-h-[80px]">
                                {viewType?.description || "No description provided."}
                            </span>
                        </div>
                    </div>
                    <DialogFooter className="border-t border-muted pt-4">
                        <Button 
                            onClick={() => setViewType(null)} 
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold active:scale-95 transition-transform"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
