"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Plus,
    Search,
    PlayCircle,
    Video,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Tutorial {
    id: number;
    title: string;
    video_url: string;
    thumbnail?: string;
    description?: string;
    class_id?: number;
    section_id?: number;
    school_class?: { name: string };
    section?: { name: string };
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

export default function VideoTutorialPage() {
    const { toast } = useToast();
    const [tutorials, setTutorials] = useState<Tutorial[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);

    const [filters, setFilters] = useState({
        class_id: "",
        section_id: "",
        search: "",
    });

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        video_url: "",
        class_id: "",
        section_id: "",
        description: "",
    });

    useEffect(() => {
        fetchInitialData();
        fetchTutorials();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [classesRes, sectionsRes] = await Promise.all([
                api.get('/academics/classes?no_paginate=true'),
                api.get('/academics/sections?no_paginate=true')
            ]);
            setClasses(classesRes.data.data || []);
            setSections(sectionsRes.data.data || []);
        } catch (error) {
            console.error("Error fetching initial data:", error);
        }
    };

    const fetchTutorials = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "12",
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
            });
            const response = await api.get(`/download-center/video-tutorials?${params.toString()}`);
            setTutorials(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
                from: response.data.from,
                to: response.data.to
            });
        } catch (error) {
            console.error("Error fetching tutorials:", error);
            toast({ title: "Error", description: "Failed to fetch video tutorials", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchTutorials(1);
    };

    const handleSave = async () => {
        try {
            await api.post('/download-center/video-tutorials', formData);
            toast({ title: "Success", description: "Video tutorial added successfully" });
            setIsDialogOpen(false);
            setFormData({ title: "", video_url: "", class_id: "", section_id: "", description: "" });
            fetchTutorials();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to save tutorial",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
             {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-sm font-medium text-gray-800">Video Tutorial List</h1>
                <Button onClick={() => setIsDialogOpen(true)} className="btn-gradient gap-2 h-8 px-4 text-[10px] font-bold uppercase transition-all rounded-full shadow-md">
                    <Plus className="h-3.5 w-3.5" /> Add Video
                </Button>
            </div>

            {/* Filter Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-500 uppercase">Class</Label>
                        <Select value={filters.class_id} onValueChange={(v) => setFilters({ ...filters, class_id: v })}>
                            <SelectTrigger className="h-8 border-gray-200 text-xs focus:ring-indigo-500 rounded shadow-none">
                                <SelectValue placeholder="Select Class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-500 uppercase">Section</Label>
                        <Select value={filters.section_id} onValueChange={(v) => setFilters({ ...filters, section_id: v })}>
                            <SelectTrigger className="h-8 border-gray-200 text-xs focus:ring-indigo-500 rounded shadow-none">
                                <SelectValue placeholder="Select Section" />
                            </SelectTrigger>
                            <SelectContent>
                                {sections.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-500 uppercase">Search By Title</Label>
                        <Input
                            placeholder="Title..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="h-8 border-gray-200 text-xs focus-visible:ring-indigo-500 rounded shadow-none"
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" className="btn-gradient gap-2 h-8 px-6 text-[10px] font-bold uppercase transition-all rounded-full shadow-md">
                            <Search className="h-3.5 w-3.5" /> Search
                        </Button>
                    </div>
                </form>
            </div>

             <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {tutorials.length === 0 ? (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400">
                            <Video className="h-12 w-12 mb-2 opacity-20" />
                            <p className="text-xs">No video tutorials found.</p>
                        </div>
                    ) : (
                        tutorials.map((video) => (
                            <div key={video.id} className="group cursor-pointer flex flex-col h-full">
                                <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                                    {video.thumbnail ? (
                                        <>
                                            <Image
                                                src={video.thumbnail}
                                                alt={video.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 scale-90 group-hover:scale-100 transition-transform">
                                                    <PlayCircle className="h-8 w-8 text-white fill-white/20" />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center">
                                                <Video className="h-6 w-6 text-indigo-200" />
                                            </div>
                                            <span className="text-[8px] text-gray-300 font-bold uppercase tracking-widest">Preview Unavailable</span>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-3 flex-1 flex flex-col">
                                    <h3 className="text-[10px] font-bold text-gray-700 uppercase tracking-tight line-clamp-2 leading-relaxed group-hover:text-indigo-600 transition-colors" title={video.title}>
                                        {video.title}
                                    </h3>
                                    {(video.school_class || video.section) && (
                                        <div className="mt-1 flex items-center gap-1">
                                            <span className="text-[8px] px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded-full border border-gray-100 font-medium uppercase tracking-tighter">
                                                {video.school_class?.name} {video.section?.name}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                 {/* Pagination */}
                <div className="flex items-center justify-between mt-8 border-t border-gray-50 pt-4">
                    <div className="text-[10px] text-gray-400 font-medium italic">
                        Showing {pagination?.from || 0} to {pagination?.to || 0} of {pagination?.total || 0} tutorials
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={pagination?.current_page === 1}
                            onClick={() => fetchTutorials(pagination!.current_page - 1)}
                            className="h-7 px-3 text-[10px] text-gray-400 border-gray-100 hover:bg-gray-50 rounded-full shadow-none"
                        >
                            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
                        </Button>
                        <div className="flex items-center gap-1">
                            {[...Array(pagination?.last_page || 0)].map((_, i) => (
                                <Button 
                                    key={i + 1}
                                    onClick={() => fetchTutorials(i + 1)}
                                    className={cn(
                                        "h-7 w-7 p-0 text-[10px] font-bold rounded-full transition-all duration-300 shadow-sm",
                                        pagination?.current_page === i + 1 
                                            ? "btn-gradient" 
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
                            onClick={() => fetchTutorials(pagination!.current_page + 1)}
                            className="h-7 px-3 text-[10px] text-gray-400 border-gray-100 hover:bg-gray-50 rounded-full shadow-none"
                        >
                            Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Add Tutorial Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-gray-800">Add Video Tutorial</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">Title <span className="text-red-500">*</span></Label>
                            <Input 
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Enter tutorial title"
                                className="h-9 border-gray-200 text-xs shadow-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">Class</Label>
                                <Select value={formData.class_id} onValueChange={(v) => setFormData({ ...formData, class_id: v })}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">Section</Label>
                                <Select value={formData.section_id} onValueChange={(v) => setFormData({ ...formData, section_id: v })}>
                                    <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none">
                                        <SelectValue placeholder="Select Section" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sections.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase">Video URL <span className="text-red-500">*</span></Label>
                            <Input 
                                value={formData.video_url}
                                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                                placeholder="YouTube/Vimeo link"
                                className="h-9 border-gray-200 text-xs shadow-none"
                            />
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
                        <Button onClick={handleSave} className="btn-gradient h-9 px-8 text-[11px] uppercase font-bold rounded-full">Save Tutorial</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
