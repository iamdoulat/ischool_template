"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Search, Upload, FileIcon, ImageIcon, Film, ChevronLeft, ChevronRight,
    Trash2, Loader2, FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useImageUrl } from "@/lib/image-url";

interface MediaItem {
    id: number;
    file_name: string;
    file_type: string;
    file_path: string;
    file_size: string | null;
}

const PAGE_SIZES = [12, 24, 48, 96];

const FILE_TYPE_COLORS: Record<string, string> = {
    image: "from-pink-500 to-rose-500",
    video: "from-violet-500 to-purple-500",
    application: "from-blue-500 to-cyan-500",
    text: "from-emerald-500 to-teal-500",
    default: "from-gray-400 to-slate-500",
};

function getTypeGroup(mime: string): string {
    if (mime.startsWith("image")) return "image";
    if (mime.startsWith("video")) return "video";
    return mime.split("/")[0] || "unknown";
}

function GridSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-gray-100 overflow-hidden">
                    <Skeleton className="h-28 rounded-none" />
                    <div className="p-2.5 space-y-1.5">
                        <Skeleton className="h-3 w-3/4 rounded" />
                        <Skeleton className="h-2.5 w-1/2 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function MediaManagerPage() {
    const { toast } = useToast();
    const resolveImg = useImageUrl();

    const [media, setMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [pageSize, setPageSize] = useState(24);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchMedia = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("front-cms/media");
            setMedia(res.data?.data ?? []);
        } catch {
            toast({ title: "Error", description: "Failed to load media", variant: "destructive" });
        } finally { setLoading(false); }
    }, [toast]);

    useEffect(() => { fetchMedia(); }, [fetchMedia]);

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            const data = new FormData();
            for (let i = 0; i < files.length; i++) data.append("files[]", files[i]);
            await api.post("front-cms/media", data, { headers: { "Content-Type": "multipart/form-data" } });
            toast({ title: "Success", description: `${files.length} file(s) uploaded` });
            fetchMedia();
        } catch {
            toast({ title: "Error", description: "Failed to upload media", variant: "destructive" });
        } finally { setUploading(false); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await api.delete(`front-cms/media/${deleteId}`);
            toast({ title: "Success", description: "File deleted" });
            fetchMedia();
        } catch {
            toast({ title: "Error", description: "Failed to delete file", variant: "destructive" });
        } finally { setDeleting(false); setDeleteId(null); }
    };

    const getDisplayUrl = (path: string) => {
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        return resolveImg(path.replace(/^\/?storage\//, ""));
    };

    const filtered = useMemo(() => media.filter(item => {
        const matchesSearch = item.file_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === "all" || item.file_type.startsWith(filterType);
        return matchesSearch && matchesType;
    }), [media, searchTerm, filterType]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const to = Math.min(currentPage * pageSize, filtered.length);

    return (
        <div className="p-4 lg:p-6 space-y-5 animate-in fade-in duration-500 pb-20">
            {/* Upload Card */}
            <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] overflow-hidden pt-0 gap-0">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Upload className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold text-slate-800 leading-none">Upload Media</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">Upload images, videos, and documents (max 5MB per file)</p>
                        </div>
                    </div>
                    {uploading && <Loader2 className="h-5 w-5 animate-spin text-indigo-500 shrink-0" />}
                </CardHeader>

                <CardContent className="p-5">
                    <div className="relative group">
                        <input
                            type="file"
                            multiple
                            onChange={(e) => handleFileUpload(e.target.files)}
                            disabled={uploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                        />
                        <div className="border-2 border-dashed border-gray-200 rounded-lg py-8 flex flex-col items-center justify-center gap-2 transition-all bg-gray-50/30 group-hover:bg-gray-100 group-hover:border-indigo-300">
                            <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Upload className="h-5 w-5 text-indigo-500" />
                            </div>
                            <div className="text-center">
                                <span className="text-xs text-gray-600 font-bold block">Drop files here or click to browse</span>
                                <span className="text-[10px] text-gray-400 mt-0.5">Supports images, videos, PDFs, documents</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Library Card */}
            <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] overflow-hidden pt-0 gap-0">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <ImageIcon className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold text-slate-800 leading-none">Media Library</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{media.length} file(s) in library</p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Search files..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
                        </div>
                        <div className="flex items-center gap-3">
                            <Select value={filterType} onValueChange={v => { setFilterType(v); setCurrentPage(1); }}>
                                <SelectTrigger className="h-9 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Files</SelectItem>
                                    <SelectItem value="image">Images</SelectItem>
                                    <SelectItem value="video">Videos</SelectItem>
                                    <SelectItem value="application">Documents</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setCurrentPage(1); }}>
                                <SelectTrigger className="h-9 w-[70px] text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {PAGE_SIZES.map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Grid */}
                    {loading ? <GridSkeleton /> : paginated.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                            <FolderOpen className="h-10 w-10 opacity-30" />
                            <p className="text-xs font-medium">No files found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {paginated.map(item => {
                                const typeGroup = getTypeGroup(item.file_type);
                                const isImage = typeGroup === "image";
                                const gradient = FILE_TYPE_COLORS[typeGroup] || FILE_TYPE_COLORS.default;
                                return (
                                    <div key={item.id} className="group relative bg-white rounded-lg border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300">
                                        {/* Thumbnail */}
                                        <div className={cn("h-28 flex items-center justify-center overflow-hidden relative", isImage ? "bg-gray-50" : `bg-gradient-to-br ${gradient}`)}>
                                            {isImage ? (
                                                <img src={getDisplayUrl(item.file_path)} alt={item.file_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 text-white/90">
                                                    {typeGroup === "video" ? <Film className="h-8 w-8" /> : <FileIcon className="h-8 w-8" />}
                                                    <span className="text-[8px] font-bold uppercase opacity-80">{item.file_type.split("/").pop()}</span>
                                                </div>
                                            )}
                                            {/* Delete Overlay */}
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button onClick={() => setDeleteId(item.id)} size="sm" className="h-7 w-7 p-0 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-sm">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                            {/* Size Badge */}
                                            {item.file_size && (
                                                <div className="absolute bottom-1 right-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-bold text-gray-400 uppercase shadow-xs">
                                                    {item.file_size}
                                                </div>
                                            )}
                                        </div>
                                        {/* File Name */}
                                        <div className="p-2.5 bg-white">
                                            <p className="text-[10px] font-semibold text-gray-700 truncate" title={item.file_name}>{item.file_name}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-2">
                        <div>Showing {from} to {to} of {filtered.length} entries</div>
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), currentPage + 2).map(page => (
                                <Button key={page} size="sm" onClick={() => setCurrentPage(page)} className={cn("h-8 w-8 p-0 rounded-[10px] text-xs font-bold", currentPage === page ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md" : "bg-white text-gray-600 border border-gray-200")}>{page}</Button>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Delete Alert */}
            <AlertDialog open={!!deleteId} onOpenChange={o => { if (!o) setDeleteId(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete File</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. The file will be permanently deleted from the media library.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-500 hover:bg-red-600">
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
