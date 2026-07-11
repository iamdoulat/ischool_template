"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
    CloudUpload,
    Search,
    Download,
    Trash2,
    FileText,
    LayoutGrid,
    List,
    ChevronLeft,
    ChevronRight,
    FileIcon
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useImageUrl } from "@/lib/image-url";
import { formatDate, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ContentItem {
    id: number;
    title: string;
    file_path: string;
    file_type: string;
    file_size: number;
    uploader?: { name: string };
    created_at: string;
    content_type?: { name: string };
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

export default function UploadContentPage() {
    const { toast } = useToast();
    const getImageUrl = useImageUrl();
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchTerm, setSearchTerm] = useState("");
    const [contents, setContents] = useState<ContentItem[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [stats, setStats] = useState({ total_documents: 0, total_size: 0 });
    const [loading, setLoading] = useState(false);
    const [contentTypes, setContentTypes] = useState<any[]>([]);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        content_type_id: "",
        description: "",
        file: null as File | null,
    });

    useEffect(() => {
        fetchInitialData();
        fetchContents();
        fetchStats();
    }, [searchTerm]);

    const fetchInitialData = async () => {
        try {
            const response = await api.get('/download-center/content-types');
            setContentTypes(response.data.data || []);
        } catch (error) {
            console.error("Error fetching content types:", error);
        }
    };

    const fetchContents = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(`/download-center/uploaded-contents?page=${page}&limit=12&search=${searchTerm}`);
            setContents(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
        } catch (error) {
            console.error("Error fetching contents:", error);
            toast({ title: "Error", description: "Failed to fetch content list", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/download-center/uploaded-contents/stats');
            setStats(response.data);
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const handleUpload = async () => {
        if (!formData.file || !formData.title || !formData.content_type_id) {
            toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
            return;
        }

        const data = new FormData();
        data.append('title', formData.title);
        data.append('content_type_id', formData.content_type_id);
        data.append('description', formData.description);
        data.append('file', formData.file);

        try {
            await api.post('/download-center/uploaded-contents', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast({ title: "Success", description: "Content uploaded successfully" });
            setIsDialogOpen(false);
            setFormData({ title: "", content_type_id: "", description: "", file: null });
            fetchContents();
            fetchStats();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to upload content",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this content?")) {
            try {
                await api.delete(`/download-center/uploaded-contents/${id}`);
                toast({ title: "Success", description: "Content deleted successfully" });
                fetchContents();
                fetchStats();
            } catch (error) {
                toast({ title: "Error", description: "Failed to delete content", variant: "destructive" });
            }
        }
    };

    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const getFileIcon = (item: ContentItem) => {
        const ext = item.file_type?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
            return (
                <div className="relative h-12 w-12 rounded-lg border border-gray-100 overflow-hidden shrink-0 shadow-sm">
                    <Image src={getImageUrl(item.file_path)} alt={item.title} fill className="object-cover" />
                </div>
            );
        }
        if (ext === 'pdf') {
            return (
                <div className="h-12 w-12 bg-red-50 rounded-lg flex flex-col items-center justify-center border border-red-100 shrink-0 shadow-sm">
                    <FileText className="h-6 w-6 text-red-500" />
                    <span className="text-[8px] font-bold text-red-600 uppercase">pdf</span>
                </div>
            );
        }
        return (
            <div className="h-12 w-12 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100 shrink-0 shadow-sm">
                <FileIcon className="h-6 w-6 text-indigo-400" />
            </div>
        );
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
             {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <CloudUpload className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">Content List</h1>
                        <p className="text-[11px] text-gray-500 mt-1">Uploaded files and document library</p>
                    </div>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="btn-gradient gap-2 h-8 px-4 text-[10px] font-bold uppercase transition-all rounded-full shadow-md">
                    <CloudUpload className="h-4 w-4" /> Upload Content
                </Button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Section: Content Grid */}
                <div className="flex-1 space-y-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        {/* Toolbar */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Input
                                    placeholder="Search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-9 border-gray-200 text-xs pr-10 focus-visible:ring-indigo-500 rounded shadow-none"
                                />
                                <Button className="absolute right-0 top-0 h-9 bg-indigo-500 hover:bg-indigo-600 text-white rounded-l-none px-3">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded border border-gray-100">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setViewMode("list")}
                                    className={cn("h-7 w-7 rounded", viewMode === "list" ? "bg-indigo-500 text-white shadow-sm hover:bg-indigo-600 hover:text-white" : "text-gray-400")}
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setViewMode("grid")}
                                    className={cn("h-7 w-7 rounded", viewMode === "grid" ? "bg-indigo-500 text-white shadow-sm hover:bg-indigo-600 hover:text-white" : "text-gray-400")}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                         {/* Grid of Content */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {contents.length === 0 ? (
                                <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400">
                                    <CloudUpload className="h-12 w-12 mb-2 opacity-20" />
                                    <p className="text-xs">No documents uploaded yet.</p>
                                </div>
                            ) : (
                                contents.map((item) => (
                                    <div key={item.id} className="relative group bg-white border border-gray-100 rounded-lg p-4 hover:shadow-lg hover:border-indigo-100 transition-all duration-300">
                                        <div className="flex items-start gap-4">
                                            {getFileIcon(item)}
                                            <div className="flex-1 min-w-0 pr-6">
                                                <p className="text-[11px] font-bold text-gray-700 uppercase tracking-tight truncate cursor-pointer hover:text-indigo-600 transition-colors" title={item.title}>
                                                    {item.title}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-[9px] px-1.5 py-0.5 bg-indigo-50 text-indigo-500 rounded-full font-bold uppercase">
                                                        {item.content_type?.name}
                                                    </span>
                                                    <span className="text-[9px] text-gray-400 font-medium">{item.uploader?.name}</span>
                                                </div>
                                                <p className="text-[9px] text-gray-300 mt-1">{formatDate(item.created_at)} • {formatBytes(item.file_size)}</p>
                                            </div>
                                        </div>

                                        {/* Item Actions */}
                                        <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-50 pt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                onClick={() => window.open(getImageUrl(item.file_path), '_blank')}
                                                className="h-8 w-8 bg-indigo-50 text-indigo-500 hover:bg-indigo-500 hover:text-white rounded-full transition-all"
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                onClick={() => handleDelete(item.id)}
                                                className="h-8 w-8 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-full transition-all"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                         {/* Pagination */}
                        <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                            <div className="text-[10px] text-gray-400 font-medium italic">
                                Showing {pagination?.from || 0} to {pagination?.to || 0} of {pagination?.total || 0} items
                            </div>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    disabled={pagination?.current_page === 1}
                                    onClick={() => fetchContents(pagination!.current_page - 1)}
                                    className="h-8 px-3 text-[10px] text-gray-400 border-gray-100 hover:bg-gray-50 rounded-full shadow-none"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
                                </Button>
                                <div className="flex items-center gap-1.5">
                                    {[...Array(pagination?.last_page || 0)].map((_, i) => (
                                        <Button
                                            key={i + 1}
                                            onClick={() => fetchContents(i + 1)}
                                            className={cn(
                                                "h-8 w-8 p-0 text-[10px] font-bold rounded-full transition-all duration-300 shadow-sm",
                                                pagination?.current_page === i + 1 
                                                    ? "btn-gradient text-white" 
                                                    : "bg-white text-gray-400 border border-gray-100 hover:bg-gray-50"
                                            )}
                                        >
                                            {i + 1}
                                        </Button>
                                    ))}
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    disabled={pagination?.current_page === pagination?.last_page}
                                    onClick={() => fetchContents(pagination!.current_page + 1)}
                                    className="h-8 px-3 text-[10px] text-gray-400 border-gray-100 hover:bg-gray-50 rounded-full shadow-none"
                                >
                                    Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Statistics */}
                <div className="w-full lg:w-80 space-y-4 shrink-0">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50/50 p-12 flex flex-col items-center justify-center border-b border-gray-100">
                            <div className="relative h-20 w-20 flex items-center justify-center bg-white rounded-lg shadow-lg border border-gray-100 group">
                                <CloudUpload className="h-10 w-10 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                                <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-indigo-500 rounded-full border-4 border-white flex items-center justify-center">
                                    <LayoutGrid className="h-3.5 w-3.5 text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="p-0">
                             <div className="flex justify-between items-center p-4 border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Total Documents</span>
                                <span className="text-[11px] font-bold text-gray-700">{stats.total_documents}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Size</span>
                                <span className="text-[11px] font-bold text-gray-700">{formatBytes(stats.total_size)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload Content Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-gray-800">Upload Content</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">Content Title <span className="text-red-500">*</span></Label>
                            <Input 
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Annual Syllabus 2026"
                                className="h-9 border-gray-200 text-xs shadow-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">Content Type <span className="text-red-500">*</span></Label>
                            <Select value={formData.content_type_id} onValueChange={(v) => setFormData({ ...formData, content_type_id: v })}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                    <SelectValue placeholder="Select Content Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {contentTypes.map(type => (
                                        <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">Select File <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <Input 
                                    type="file"
                                    onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                                    className="h-9 border-gray-200 text-xs shadow-none cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">Description</Label>
                            <Textarea 
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="border-gray-200 text-xs shadow-none min-h-[80px]"
                                placeholder="Optional description..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-9 text-[11px] uppercase font-bold rounded-full">Cancel</Button>
                        <Button onClick={handleUpload} className="btn-gradient h-9 px-8 text-[11px] uppercase font-bold rounded-full">Upload & Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
