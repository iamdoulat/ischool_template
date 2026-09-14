"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/components/providers/language-provider";
import {
    translateClassName,
    translateSectionName,
    toLocaleNumber,
    cn,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Plus,
    Search,
    PlayCircle,
    Video,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    GraduationCap,
    Layers,
    Loader2,
} from "lucide-react";

interface SchoolClass {
    id: number;
    name: string;
}

interface Section {
    id: number;
    name: string;
}

interface Tutorial {
    id: number;
    title: string;
    video_url: string;
    thumbnail?: string;
    description?: string;
    class_id?: number | null;
    section_id?: number | null;
    school_class?: { id?: number; name: string };
    section?: { id?: number; name: string };
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

const getVideoThumbnail = (video: Tutorial) => {
    if (video.thumbnail) return video.thumbnail;
    const url = video.video_url || "";

    // YouTube detection
    const ytMatch = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    if (ytMatch && ytMatch[2].length === 11) {
        return `https://img.youtube.com/vi/${ytMatch[2]}/mqdefault.jpg`;
    }

    const ytShortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (ytShortsMatch) {
        return `https://img.youtube.com/vi/${ytShortsMatch[1]}/mqdefault.jpg`;
    }

    // Vimeo detection
    const vimeoMatch = url.match(/(?:vimeo\.com\/|video\/)(\d+)/);
    if (vimeoMatch) {
        return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
    }

    return null;
};

const getEmbedUrl = (url: string) => {
    if (!url) return "";

    // YouTube
    const ytMatch = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    if (ytMatch && ytMatch[2].length === 11) {
        return `https://www.youtube.com/embed/${ytMatch[2]}?autoplay=1`;
    }

    const ytShortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (ytShortsMatch) {
        return `https://www.youtube.com/embed/${ytShortsMatch[1]}?autoplay=1`;
    }

    // Vimeo
    const vimeoMatch = url.match(/(?:vimeo\.com\/|video\/)(\d+)/);
    if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }

    return url;
};

export default function VideoTutorialPage() {
    const { t, language } = useLanguage();
    const langCode = language?.short_code || "en";
    const { toast } = useToast();

    const [tutorials, setTutorials] = useState<Tutorial[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [previewVideo, setPreviewVideo] = useState<Tutorial | null>(null);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [sections, setSections] = useState<Section[]>([]);

    const [filters, setFilters] = useState({
        class_id: "",
        section_id: "",
        search: "",
    });

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        video_url: "",
        class_id: "",
        section_id: "",
        description: "",
    });

    const fetchInitialData = async () => {
        try {
            const [classesRes, sectionsRes] = await Promise.all([
                api.get("/academics/classes?no_paginate=true"),
                api.get("/academics/sections?no_paginate=true"),
            ]);
            setClasses(classesRes.data.data || []);
            setSections(sectionsRes.data.data || []);
        } catch (error) {
            console.error("Error fetching initial data:", error);
        }
    };

    const fetchTutorials = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const cleanFilters: Record<string, string> = {};
            if (filters.class_id && filters.class_id !== "all") cleanFilters.class_id = filters.class_id;
            if (filters.section_id && filters.section_id !== "all") cleanFilters.section_id = filters.section_id;
            if (filters.search.trim()) cleanFilters.search = filters.search.trim();

            const params = new URLSearchParams({
                page: String(page),
                limit: "12",
                ...cleanFilters,
            });
            const response = await api.get(`/download-center/video-tutorials?${params.toString()}`);
            const data = response.data;
            setTutorials(data.data || []);
            setPagination({
                current_page: data.current_page || 1,
                last_page: data.last_page || 1,
                total: data.total || 0,
                from: data.from || 0,
                to: data.to || 0,
            });
        } catch (error) {
            console.error("Error fetching tutorials:", error);
            toast({
                title: t("error"),
                description: t("failed_to_load_video_tutorials") || "Failed to fetch video tutorials",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [filters, t, toast]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchTutorials(1);
    }, [fetchTutorials]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchTutorials(1);
    };

    const handleOpenAdd = () => {
        setEditingId(null);
        setFormData({
            title: "",
            video_url: "",
            class_id: "",
            section_id: "",
            description: "",
        });
        setIsDialogOpen(true);
    };

    const handleEdit = (video: Tutorial) => {
        setEditingId(video.id);
        setFormData({
            title: video.title || "",
            video_url: video.video_url || "",
            class_id: video.class_id ? String(video.class_id) : "",
            section_id: video.section_id ? String(video.section_id) : "",
            description: video.description || "",
        });
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.video_url.trim()) {
            toast({
                title: t("error"),
                description: t("please_fill_all_required_fields") || "Please fill all required fields",
                variant: "destructive",
            });
            return;
        }

        setSaving(true);
        const payload = {
            title: formData.title,
            video_url: formData.video_url,
            class_id: formData.class_id && formData.class_id !== "all" ? Number(formData.class_id) : null,
            section_id: formData.section_id && formData.section_id !== "all" ? Number(formData.section_id) : null,
            description: formData.description,
        };

        try {
            if (editingId) {
                await api.put(`/download-center/video-tutorials/${editingId}`, payload);
                toast({
                    title: t("success"),
                    description: t("video_tutorial_updated_successfully"),
                });
            } else {
                await api.post("/download-center/video-tutorials", payload);
                toast({
                    title: t("success"),
                    description: t("video_tutorial_added_successfully"),
                });
            }
            setIsDialogOpen(false);
            setEditingId(null);
            setFormData({ title: "", video_url: "", class_id: "", section_id: "", description: "" });
            fetchTutorials(pagination?.current_page || 1);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast({
                title: t("error"),
                description: err.response?.data?.message || t("failed_to_save_tutorial") || "Failed to save tutorial",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const promptDelete = (id: number) => {
        setDeleteId(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/download-center/video-tutorials/${deleteId}`);
            toast({
                title: t("success"),
                description: t("video_tutorial_deleted_successfully"),
            });
            fetchTutorials(pagination?.current_page || 1);
        } catch (error) {
            console.error("Error deleting tutorial:", error);
            toast({
                title: t("error"),
                description: t("failed_to_delete_video_tutorial") || "Failed to delete tutorial",
                variant: "destructive",
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Video className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                            {t("video_tutorial_list")}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">
                            {t("manage_class_video_tutorials")}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={handleOpenAdd}
                    className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all"
                >
                    <Plus className="h-4 w-4" /> {t("add_video")}
                </Button>
            </div>

            {/* Filter Section */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden p-4">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    {/* Class */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-600">{t("class")}</Label>
                        <Select
                            value={filters.class_id}
                            onValueChange={(v) => setFilters({ ...filters, class_id: v })}
                        >
                            <SelectTrigger className="h-9 border-gray-200 text-xs bg-white rounded-lg shadow-2xs focus:ring-indigo-500">
                                <SelectValue placeholder={t("select_class")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("all_classes") || t("all")}</SelectItem>
                                {classes.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                                        {translateClassName(c.name, langCode)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Section */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-600">{t("section")}</Label>
                        <Select
                            value={filters.section_id}
                            onValueChange={(v) => setFilters({ ...filters, section_id: v })}
                        >
                            <SelectTrigger className="h-9 border-gray-200 text-xs bg-white rounded-lg shadow-2xs focus:ring-indigo-500">
                                <SelectValue placeholder={t("select_section")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("all_sections") || t("all")}</SelectItem>
                                {sections.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)} className="text-xs">
                                        {translateSectionName(s.name, langCode)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Search by title */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-600">{t("search_by_title")}</Label>
                        <Input
                            placeholder={t("title_placeholder")}
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="h-9 border-gray-200 text-xs bg-white rounded-lg shadow-2xs focus-visible:ring-indigo-500"
                        />
                    </div>

                    {/* Search Button */}
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            className="w-full sm:w-auto h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all"
                        >
                            <Search className="h-3.5 w-3.5" /> {t("search")}
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Video Cards Grid */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden p-4 space-y-4">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-[#6366f1]" />
                        <span className="text-xs font-medium">{t("loading")}...</span>
                    </div>
                ) : tutorials.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-400">
                            <Video className="h-7 w-7 opacity-60" />
                        </div>
                        <p className="text-xs font-bold text-gray-500">{t("no_video_tutorials_found")}</p>
                        <Button
                            onClick={handleOpenAdd}
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-semibold text-[#6366f1] border-indigo-200 hover:bg-indigo-50 rounded-full mt-1"
                        >
                            <Plus className="h-3.5 w-3.5 mr-1" /> {t("add_video")}
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {tutorials.map((video) => {
                            const thumbnailUrl = getVideoThumbnail(video);
                            return (
                                <div
                                    key={video.id}
                                    className="group relative flex flex-col justify-between bg-white border border-gray-150 hover:border-indigo-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300"
                                >
                                    {/* Thumbnail container */}
                                    <div
                                        onClick={() => setPreviewVideo(video)}
                                        className="relative aspect-video w-full bg-slate-900 overflow-hidden cursor-pointer flex items-center justify-center"
                                    >
                                        {thumbnailUrl ? (
                                            <>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={thumbnailUrl}
                                                    alt={video.title}
                                                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 flex items-center justify-center transition-colors duration-300">
                                                    <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 scale-90 group-hover:scale-110 transition-transform shadow-lg">
                                                        <PlayCircle className="h-8 w-8 text-white fill-white/30" />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-white/50">
                                                <Video className="h-8 w-8 text-indigo-300" />
                                                <span className="text-[9px] uppercase tracking-widest font-bold">
                                                    {t("watch_tutorial")}
                                                </span>
                                            </div>
                                        )}

                                        {/* Academic Badge Overlay */}
                                        {(video.school_class || video.section) && (
                                            <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
                                                <span className="text-[9px] px-2 py-0.5 bg-black/60 backdrop-blur-md text-white rounded-full font-bold shadow-xs">
                                                    {video.school_class?.name ? translateClassName(video.school_class.name, langCode) : ""}
                                                    {video.school_class && video.section ? " - " : ""}
                                                    {video.section?.name ? translateSectionName(video.section.name, langCode) : ""}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                        <div className="space-y-1.5">
                                            <h3
                                                onClick={() => setPreviewVideo(video)}
                                                className="text-xs font-bold text-gray-800 line-clamp-2 cursor-pointer group-hover:text-[#6366f1] transition-colors leading-relaxed"
                                                title={video.title}
                                            >
                                                {video.title}
                                            </h3>
                                            {video.description && (
                                                <p
                                                    className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed"
                                                    title={video.description}
                                                >
                                                    {video.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Card Footer Actions */}
                                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setPreviewVideo(video)}
                                                className="h-7 px-2 text-[11px] font-bold text-[#6366f1] hover:bg-indigo-50 rounded-full gap-1"
                                            >
                                                <PlayCircle className="h-3.5 w-3.5" /> {t("watch_tutorial")}
                                            </Button>

                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleEdit(video)}
                                                    className="h-7 w-7 text-amber-600 hover:bg-amber-50 rounded-full"
                                                    title={t("edit")}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => promptDelete(video.id)}
                                                    className="h-7 w-7 text-rose-500 hover:bg-rose-50 rounded-full"
                                                    title={t("delete")}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-gray-100 mt-4">
                    <div className="text-[11px] text-gray-500 font-medium">
                        {t("showing_x_to_y_of_z", {
                            from: toLocaleNumber(pagination?.from || 0, langCode),
                            to: toLocaleNumber(pagination?.to || 0, langCode),
                            total: toLocaleNumber(pagination?.total || 0, langCode),
                        })}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!pagination || pagination.current_page <= 1}
                            onClick={() => fetchTutorials((pagination?.current_page || 2) - 1)}
                            className="h-8 px-3 text-xs text-gray-600 border-gray-200 hover:bg-gray-50 rounded-full shadow-2xs gap-1"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" /> {t("previous")}
                        </Button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: pagination?.last_page || 1 }).map((_, i) => {
                                const pageNum = i + 1;
                                const isActive = pagination?.current_page === pageNum;
                                return (
                                    <Button
                                        key={pageNum}
                                        size="sm"
                                        onClick={() => fetchTutorials(pageNum)}
                                        className={cn(
                                            "h-8 w-8 p-0 text-xs font-bold rounded-full transition-all",
                                            isActive
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                        )}
                                    >
                                        {toLocaleNumber(pageNum, langCode)}
                                    </Button>
                                );
                            })}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!pagination || pagination.current_page >= pagination.last_page}
                            onClick={() => fetchTutorials((pagination?.current_page || 1) + 1)}
                            className="h-8 px-3 text-xs text-gray-600 border-gray-200 hover:bg-gray-50 rounded-full shadow-2xs gap-1"
                        >
                            {t("next")} <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Add / Edit Video Tutorial Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-2xl p-0 overflow-hidden">
                    <DialogHeader className="px-6 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                <Video className="h-4 w-4" />
                            </span>
                            <DialogTitle className="text-base font-bold text-gray-800">
                                {editingId ? t("edit_video_tutorial") : t("add_video_tutorial")}
                            </DialogTitle>
                        </div>
                    </DialogHeader>

                    <div className="px-6 py-4 space-y-4">
                        {/* Title */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                {t("title")} <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder={t("title_placeholder")}
                                className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus-visible:ring-indigo-500"
                            />
                        </div>

                        {/* Class and Section */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                    <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
                                    {t("class")}
                                </Label>
                                <Select
                                    value={formData.class_id}
                                    onValueChange={(v) => setFormData({ ...formData, class_id: v })}
                                >
                                    <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-indigo-500">
                                        <SelectValue placeholder={t("select_class")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t("all_classes") || t("all")}</SelectItem>
                                        {classes.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                                                {translateClassName(c.name, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                    <Layers className="h-3.5 w-3.5 text-gray-400" />
                                    {t("section")}
                                </Label>
                                <Select
                                    value={formData.section_id}
                                    onValueChange={(v) => setFormData({ ...formData, section_id: v })}
                                >
                                    <SelectTrigger className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus:ring-indigo-500">
                                        <SelectValue placeholder={t("select_section")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t("all_sections") || t("all")}</SelectItem>
                                        {sections.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)} className="text-xs">
                                                {translateSectionName(s.name, langCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Video URL */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                {t("video_url")} <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                value={formData.video_url}
                                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                                placeholder={t("video_url_placeholder")}
                                className="h-9 border-gray-200 text-xs rounded-lg shadow-none focus-visible:ring-indigo-500"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700">
                                {t("description")}
                            </Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="border-gray-200 text-xs shadow-none min-h-[80px] rounded-lg focus-visible:ring-indigo-500"
                                placeholder={t("optional_description")}
                            />
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-3 bg-gray-50/80 border-t border-gray-100 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            className="h-9 px-4 text-xs font-bold rounded-full"
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("saving")}...
                                </>
                            ) : editingId ? (
                                t("update_tutorial")
                            ) : (
                                t("save_tutorial")
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Video Player Preview Dialog */}
            <Dialog open={!!previewVideo} onOpenChange={(open) => !open && setPreviewVideo(null)}>
                <DialogContent className="sm:max-w-[820px] p-0 overflow-hidden bg-black border-none rounded-2xl shadow-2xl">
                    <DialogHeader className="sr-only">
                        <DialogTitle>{previewVideo?.title || "Video Preview"}</DialogTitle>
                    </DialogHeader>
                    <div className="relative aspect-video w-full bg-black">
                        {previewVideo && (() => {
                            const embedUrl = getEmbedUrl(previewVideo.video_url);
                            const isEmbeddable = embedUrl.includes("youtube.com") || embedUrl.includes("vimeo.com");

                            if (isEmbeddable) {
                                return (
                                    <iframe
                                        src={embedUrl}
                                        title={previewVideo.title}
                                        className="w-full h-full border-none"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                );
                            } else {
                                return (
                                    <video
                                        src={previewVideo.video_url}
                                        controls
                                        autoPlay
                                        className="w-full h-full"
                                    />
                                );
                            }
                        })()}
                    </div>
                    <div className="p-4 bg-gray-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold truncate">{previewVideo?.title}</h3>
                                {(previewVideo?.school_class || previewVideo?.section) && (
                                    <Badge variant="outline" className="text-[9px] font-bold text-indigo-300 border-indigo-700 bg-indigo-950/60 shrink-0">
                                        {previewVideo.school_class?.name ? translateClassName(previewVideo.school_class.name, langCode) : ""}
                                        {previewVideo.school_class && previewVideo.section ? " - " : ""}
                                        {previewVideo.section?.name ? translateSectionName(previewVideo.section.name, langCode) : ""}
                                    </Badge>
                                )}
                            </div>
                            {previewVideo?.description && (
                                <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                                    {previewVideo.description}
                                </p>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            onClick={() => setPreviewVideo(null)}
                            className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-full h-8 px-4 text-xs font-bold transition-all shrink-0"
                        >
                            {t("close")}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl max-w-[400px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-gray-900">
                            {t("delete")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-gray-500">
                            {t("delete_video_tutorial_confirm")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="h-9 text-xs font-bold rounded-full">
                            {t("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="h-9 text-xs font-bold rounded-full bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
