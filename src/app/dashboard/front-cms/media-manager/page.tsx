"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Upload, ImageIcon, FileIcon, Search, Youtube, MoreHorizontal, ChevronRight, ChevronLeft, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";

interface MediaItem {
    id: number;
    file_name: string;
    file_type: string;
    file_path: string;
    file_size: string | null;
}

export default function MediaManagerPage() {
    const { toast } = useToast();
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");

    useEffect(() => {
        fetchMedia();
    }, []);

    const fetchMedia = async () => {
        setLoading(true);
        try {
            const res = await api.get("front-cms/media");
            if (res.data?.status === "Success") {
                setMedia(res.data.data);
            }
        } catch (error) {
            toast("error", "Failed to load media");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            const data = new FormData();
            for (let i = 0; i < files.length; i++) {
                data.append("files[]", files[i]);
            }

            const res = await api.post("front-cms/media", data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data?.status === "Success" || res.status === 201) {
                toast("success", "Media uploaded successfully");
                fetchMedia();
            }
        } catch (error) {
            toast("error", "Failed to upload media");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this file?")) return;
        try {
            const res = await api.delete(`front-cms/media/${id}`);
            if (res.data?.status === "Success") {
                toast("success", "File deleted");
                fetchMedia();
            }
        } catch (error) {
            toast("error", "Delete failed");
        }
    };

    const filteredMedia = media.filter((item) => {
        const matchesSearch = item.file_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === "all" || item.file_type.includes(filterType);
        return matchesSearch && matchesType;
    });

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans text-[11px]">
            <div className="flex justify-between items-center">
                <h1 className="text-lg font-semibold text-gray-800 tracking-tight">Media Manager</h1>
                {uploading && <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />}
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 bg-gradient-to-b from-orange-400 to-indigo-500 h-full" />
                <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] items-center gap-6">
                    {/* File Upload */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Upload Your File</Label>
                        <div className="relative group">
                            <input 
                                type="file" 
                                multiple
                                onChange={(e) => handleFileUpload(e.target.files)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                            />
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all bg-gray-50/30 group-hover:bg-gray-100 group-hover:border-indigo-300">
                                <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Upload className="h-6 w-6 text-indigo-500" />
                                </div>
                                <div className="text-center">
                                    <span className="text-[11px] text-gray-600 font-bold block uppercase tracking-tight">Drag and drop files</span>
                                    <span className="text-[9px] text-gray-400 font-medium">Max size 5MB per file</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <div className="h-8 w-px bg-gray-100" />
                        <span className="text-[10px] font-bold text-gray-300 uppercase">OR</span>
                        <div className="h-8 w-px bg-gray-100" />
                    </div>

                    {/* YouTube Upload */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            YouTube Video Link <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <div className="flex gap-2 p-1 bg-gray-50/50 rounded-lg border border-gray-100">
                            <div className="bg-white p-2 rounded flex items-center justify-center border border-gray-100 shadow-sm">
                                <Youtube className="h-4 w-4 text-red-500" />
                            </div>
                            <Input
                                placeholder="Paste YouTube URL here..."
                                className="h-9 border-0 bg-transparent text-[11px] focus-visible:ring-0 shadow-none flex-1"
                            />
                            <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 h-9 text-[11px] font-bold uppercase transition-all rounded-md shadow-md">
                                Submit
                            </Button>
                        </div>
                        <p className="text-[9px] text-gray-400 pl-1 font-medium italic">Example: https://youtube.com/watch?v=...</p>
                    </div>
                </div>
            </div>

            {/* Library Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-6">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Search Library</Label>
                        <div className="relative">
                            <Input
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-9 pl-9 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none bg-gray-50/50"
                            />
                            <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-2.5" />
                        </div>
                    </div>
                    <div className="w-full md:w-48 space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">File Type</Label>
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="h-9 border-gray-200 text-[11px] focus:ring-indigo-500 rounded shadow-none bg-gray-50/50">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Files</SelectItem>
                                <SelectItem value="image">Images</SelectItem>
                                <SelectItem value="video">Videos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={fetchMedia} variant="outline" size="icon" className="h-9 w-9 border-gray-200 bg-gray-50 text-gray-500">
                        <Loader2 className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                </div>

                {/* Media Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    </div>
                ) : filteredMedia.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                        <ImageIcon className="h-12 w-12 opacity-10" />
                        <p className="text-xs font-medium">No files found in library</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-5">
                        {filteredMedia.map((item) => (
                            <div key={item.id} className="group relative bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300">
                                {/* Thumbnail */}
                                <div className="h-28 bg-[#f8f9fa] flex items-center justify-center overflow-hidden relative border-b border-gray-50">
                                    {item.file_type.includes('image') ? (
                                        <img src={item.file_path} alt={item.file_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-1">
                                            <FileIcon className="h-8 w-8 text-indigo-300" />
                                            <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-tighter">{item.file_type.split('/')[1]}</span>
                                        </div>
                                    )}
                                    
                                    {/* Actions Overlay */}
                                    <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button size="icon" className="h-7 w-7 rounded-full bg-white text-indigo-600 hover:bg-indigo-50 shadow-sm border-0">
                                            <Eye className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button 
                                            onClick={() => handleDelete(item.id)}
                                            size="icon" 
                                            className="h-7 w-7 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-sm border-0"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>

                                    {/* Type Badge */}
                                    <div className="absolute bottom-1 right-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-bold text-gray-400 uppercase shadow-xs">
                                        {item.file_size}
                                    </div>
                                </div>

                                {/* File Name */}
                                <div className="p-2 bg-white">
                                    <p className="text-[9px] font-bold text-gray-700 truncate tracking-tight text-center" title={item.file_name}>
                                        {item.file_name}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <p className="text-[10px] text-gray-400 font-medium italic">Showing {filteredMedia.length} of {media.length} items</p>
                    <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="icon" className="h-7 w-7 rounded-md border-gray-100 text-gray-400 hover:text-indigo-500">
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button className="h-7 w-7 rounded-md bg-indigo-500 text-white text-[10px] font-bold shadow-md hover:bg-indigo-600">1</Button>
                        <Button variant="outline" size="icon" className="h-7 w-7 rounded-md border-gray-100 text-gray-400 hover:text-indigo-500">
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Eye({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
        </svg>
    )
}
