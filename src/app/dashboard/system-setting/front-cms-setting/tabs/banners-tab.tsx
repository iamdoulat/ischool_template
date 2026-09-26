"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Plus,
    Image as ImageIcon,
    Trash2,
    Loader2,
    Eye,
    Pencil,
    RotateCcw,
    Sparkles,
    Check,
    Upload,
    Link as LinkIcon,
} from "lucide-react";
import api from "@/lib/api";
import { useImageUrl } from "@/lib/image-url";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";

interface Banner {
    id: number;
    title: string | null;
    image_path: string;
}

const MADRASHA_GALLERY_PRESETS = [
    { title: "দাওরায়ে হাদিস ক্লাস", url: "/madrasha/Dawra-Class.jpg" },
    { title: "দরসে হাদিস ও কিতাব অধ্যায়ন", url: "/madrasha/dawra-daras.jpg" },
    { title: "মাদ্রাসার নির্মাণাধীন বহুতল ভবন", url: "/madrasha/Building-under-construction.jpg" },
    { title: "মাদরাসার প্রধান ফটক", url: "/madrasha/Madrasah-gate-update.jpg" },
    { title: "কৃতী ছাত্রীদের পুরস্কার ও হাদিয়া প্রদান", url: "/madrasha/hdiya-prodan.jpg" },
    { title: "বার্ষিক ক্রীড়া ও ইসলামিক প্রতিযোগিতা", url: "/madrasha/events-5-300x300.jpg" },
    { title: "কম্পিউটার ল্যাব ও ডিজিটাল আইটি শিক্ষা", url: "/madrasha/it_Computer-300x300.jpg" },
    { title: "কারিগরি ও সেলাই প্রশিক্ষণ বিভাগ", url: "/madrasha/sewing-machine-1369658_1920-300x300.jpg" },
];

function GridSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-100 overflow-hidden bg-white shadow-xs">
                    <Skeleton className="h-44 w-full rounded-none" />
                    <div className="p-3.5 space-y-2">
                        <Skeleton className="h-4 w-3/4 rounded" />
                        <Skeleton className="h-3 w-1/2 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function BannersTab() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const resolveImg = useImageUrl();

    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [restoring, setRestoring] = useState(false);

    // Dialog States
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
    const [viewingImage, setViewingImage] = useState<{ url: string; title: string } | null>(null);

    // Form State
    const [sourceMode, setSourceMode] = useState<"gallery" | "upload" | "url">("gallery");
    const [formTitle, setFormTitle] = useState("");
    const [selectedPresetUrl, setSelectedPresetUrl] = useState("");
    const [formFile, setFormFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string>("");
    const [formUrl, setFormUrl] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    const getDisplayUrl = useCallback((path: string) => {
        if (!path) return "";
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        if (path.startsWith("/") && !path.startsWith("/storage/") && !path.startsWith("/uploads/")) {
            return path;
        }
        return resolveImg(path.replace(/^\/?storage\//, ""));
    }, [resolveImg]);

    const fetchBanners = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("front-cms/banners");
            const data = res.data?.data ?? [];
            setBanners(Array.isArray(data) ? data : []);
        } catch {
            tt.error("failed_to_load_banners");
        } finally {
            setLoading(false);
        }
    }, [tt]);

    useEffect(() => {
        fetchBanners();
    }, [fetchBanners]);

    const openAddModal = () => {
        setEditingBanner(null);
        setFormTitle("");
        setSelectedPresetUrl(MADRASHA_GALLERY_PRESETS[0]?.url || "");
        setFormFile(null);
        setFilePreview("");
        setFormUrl("");
        setSourceMode("gallery");
        setModalOpen(true);
    };

    const openEditModal = (banner: Banner) => {
        setEditingBanner(banner);
        setFormTitle(banner.title || "");
        const isPreset = MADRASHA_GALLERY_PRESETS.some((p) => p.url === banner.image_path);
        if (isPreset) {
            setSelectedPresetUrl(banner.image_path);
            setSourceMode("gallery");
        } else if (banner.image_path.startsWith("http://") || banner.image_path.startsWith("https://") || banner.image_path.startsWith("/")) {
            setFormUrl(banner.image_path);
            setSourceMode("url");
        } else {
            setSourceMode("upload");
        }
        setFormFile(null);
        setFilePreview(getDisplayUrl(banner.image_path));
        setModalOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormFile(file);
            setFilePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append("title", formTitle);

            if (editingBanner) {
                // When editing, if user didn't change image source or file, we can preserve current image
                if (sourceMode === "upload") {
                    if (formFile) {
                        fd.append("image", formFile);
                    }
                } else if (sourceMode === "gallery") {
                    if (selectedPresetUrl) {
                        fd.append("image_url", selectedPresetUrl);
                    }
                } else if (sourceMode === "url") {
                    if (formUrl) {
                        fd.append("image_url", formUrl);
                    }
                }

                await api.post(`front-cms/banners/${editingBanner.id}`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                tt.success("banner_updated");
            } else {
                if (sourceMode === "upload") {
                    if (!formFile) {
                        tt.error("please_select_an_image");
                        setSaving(false);
                        return;
                    }
                    fd.append("image", formFile);
                } else if (sourceMode === "gallery") {
                    if (!selectedPresetUrl) {
                        tt.error("please_select_an_image");
                        setSaving(false);
                        return;
                    }
                    fd.append("image_url", selectedPresetUrl);
                } else if (sourceMode === "url") {
                    if (!formUrl) {
                        tt.error("please_select_an_image");
                        setSaving(false);
                        return;
                    }
                    fd.append("image_url", formUrl);
                }

                await api.post("front-cms/banners", fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                tt.success("banner_added");
            }

            setModalOpen(false);
            fetchBanners();
        } catch {
            tt.error(editingBanner ? "failed_to_save" : "failed_to_upload_banner");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`front-cms/banners/${deleteId}`);
            tt.success("banner_deleted");
            fetchBanners();
        } catch {
            tt.error("failed_to_delete_banner");
        } finally {
            setDeleteId(null);
        }
    };

    const handleRestoreDefaults = async () => {
        setRestoring(true);
        try {
            await api.post("front-cms/banners/restore-defaults");
            tt.success("banner_restored_successfully");
            setRestoreDialogOpen(false);
            fetchBanners();
        } catch {
            tt.error("failed_to_save");
        } finally {
            setRestoring(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* MANDATORY AGENTS.md RULE: Standalone edge-to-edge gradient header banner, NEVER wrap in Card/CardHeader */}
            <div className="bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <ImageIcon className="h-5 w-5" />
                        </span>
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 leading-none">
                                {t("animated_slider_banners")}
                            </h2>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {t("manage_animated_slider_banners_desc")}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRestoreDialogOpen(true)}
                            className="h-8 px-3 rounded-full border-gray-200 text-gray-700 hover:text-slate-900 hover:bg-white text-xs font-semibold gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
                        >
                            <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
                            {t("restore_default_banners")}
                        </Button>

                        <Button
                            onClick={openAddModal}
                            className="h-8 px-4 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                        >
                            <Plus className="h-3.5 w-3.5" /> {t("add_banner")}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Banner Slides Content */}
            <Card className="rounded-xl border border-gray-100 bg-white shadow-xs overflow-hidden">
                <CardContent className="p-5">
                    {loading ? (
                        <GridSkeleton />
                    ) : banners.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                            <div className="h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                                <ImageIcon className="h-8 w-8 opacity-70" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-sm font-bold text-gray-700">{t("no_banners_found")}</p>
                                <p className="text-xs text-gray-400 max-w-sm">
                                    Click &apos;Restore Default Madrasa Banners&apos; to load all 5 authentic animated banner slides with 1 click!
                                </p>
                            </div>
                            <Button
                                onClick={handleRestoreDefaults}
                                disabled={restoring}
                                className="mt-2 h-8 px-4 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-xs font-bold shadow-sm cursor-pointer"
                            >
                                {restoring ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <RotateCcw className="h-3.5 w-3.5 mr-1.5" />}
                                {t("restore_default_banners")}
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                            {banners.map((banner, index) => {
                                const displayUrl = getDisplayUrl(banner.image_path);
                                return (
                                    <div
                                        key={banner.id}
                                        className="group relative bg-white rounded-xl border border-gray-200/80 hover:border-indigo-300 shadow-2xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
                                    >
                                        {/* Aspect Ratio Preview Container */}
                                        <div className="h-44 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                                            <img
                                                src={displayUrl}
                                                alt={banner.title || t("banner")}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src =
                                                        "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600&auto=format&fit=crop";
                                                }}
                                            />

                                            {/* Dark gradient for text visibility */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/20" />

                                            {/* Slide Badge */}
                                            <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#014739]/90 text-amber-300 border border-amber-400/40 shadow-xs flex items-center gap-1">
                                                    <Sparkles className="h-2.5 w-2.5" />
                                                    {t("slide_number")} #{index + 1}
                                                </span>
                                            </div>

                                            {/* Mandatory Radiant Action Buttons Overlay (top-right) */}
                                            <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                                                {/* View button */}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setViewingImage({
                                                            url: displayUrl,
                                                            title: banner.title || `${t("slide_number")} #${index + 1}`,
                                                        })
                                                    }
                                                    title={t("view_banner")}
                                                    className="h-7 w-7 rounded-lg text-white shadow-xs active:scale-95 transition-all bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 flex items-center justify-center cursor-pointer"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </button>

                                                {/* Edit button */}
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(banner)}
                                                    title={t("edit_banner")}
                                                    className="h-7 w-7 rounded-lg text-white shadow-xs active:scale-95 transition-all bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 flex items-center justify-center cursor-pointer"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>

                                                {/* Delete button */}
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteId(banner.id)}
                                                    title={t("delete_banner")}
                                                    className="h-7 w-7 rounded-lg text-white shadow-xs active:scale-95 transition-all bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 flex items-center justify-center cursor-pointer"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>

                                            {/* Bottom Title on Image */}
                                            <div className="absolute bottom-0 inset-x-0 p-3 z-10">
                                                <p className="text-xs font-bold text-white line-clamp-2 drop-shadow-md leading-snug">
                                                    {banner.title || t("untitled_banner")}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Bottom Card Footer with Actions & Info */}
                                        <div className="p-3 bg-white border-t border-gray-100 flex items-center justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[10px] text-gray-400 font-medium truncate block">
                                                    {banner.image_path.split("/").pop() || banner.image_path}
                                                </span>
                                            </div>

                                            {/* Quick Action Footer buttons */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(banner)}
                                                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline px-1.5 py-0.5 rounded cursor-pointer"
                                                >
                                                    {t("edit")}
                                                </button>
                                                <span className="text-gray-300">|</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteId(banner.id)}
                                                    className="text-[11px] font-bold text-rose-500 hover:text-rose-700 hover:underline px-1.5 py-0.5 rounded cursor-pointer"
                                                >
                                                    {t("delete")}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add / Edit Modal Dialog */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden border-none shadow-2xl rounded-2xl">
                    <DialogHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b">
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <ImageIcon className="h-4 w-4" />
                            </span>
                            {editingBanner ? t("edit_banner") : t("add_banner")}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            {editingBanner ? t("edit_banner") : t("add_banner")}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                        {/* Title Field */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-700">
                                {t("banner_title")} <span className="text-gray-400 font-normal">({t("title_optional")})</span>
                            </Label>
                            <Input
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                className="h-9 text-xs rounded-lg border-gray-200"
                                placeholder="যেমন: দাওরায়ে হাদিস ক্লাস / মাদ্রাসার বহুতল ভবন"
                            />
                        </div>

                        {/* Current Image Display if Editing */}
                        {editingBanner && (
                            <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200/80 space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                                    <span>বর্তমান ছবি (Current Image):</span>
                                    <span className="font-mono text-[10px] text-gray-400 truncate max-w-[200px]">
                                        {editingBanner.image_path}
                                    </span>
                                </div>
                                <div className="h-28 w-full bg-slate-900 rounded-md overflow-hidden relative">
                                    <img
                                        src={filePreview || getDisplayUrl(editingBanner.image_path)}
                                        alt="Current Banner"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Image Source Selection Tabs */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-700">
                                {editingBanner ? "ছবি পরিবর্তন করুন (Change Image)" : t("image")}{" "}
                                {!editingBanner && <span className="text-red-500">*</span>}
                            </Label>

                            <Tabs
                                value={sourceMode}
                                onValueChange={(val) => setSourceMode(val as "gallery" | "upload" | "url")}
                                className="w-full"
                            >
                                <TabsList className="bg-gray-100 p-1 rounded-lg h-9 w-full grid grid-cols-3">
                                    <TabsTrigger value="gallery" className="text-xs font-bold gap-1">
                                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                        {t("preset_gallery")}
                                    </TabsTrigger>
                                    <TabsTrigger value="upload" className="text-xs font-bold gap-1">
                                        <Upload className="h-3.5 w-3.5 text-indigo-500" />
                                        {t("upload_new_image")}
                                    </TabsTrigger>
                                    <TabsTrigger value="url" className="text-xs font-bold gap-1">
                                        <LinkIcon className="h-3.5 w-3.5 text-emerald-500" />
                                        URL
                                    </TabsTrigger>
                                </TabsList>

                                {/* Tab 1: Campus Gallery Presets */}
                                <TabsContent value="gallery" className="pt-3 space-y-3">
                                    <p className="text-[11px] text-gray-500">
                                        {t("select_from_madrasa_gallery")}:
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                        {MADRASHA_GALLERY_PRESETS.map((preset, idx) => {
                                            const isSelected = selectedPresetUrl === preset.url;
                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => {
                                                        setSelectedPresetUrl(preset.url);
                                                        setFilePreview(preset.url);
                                                        if (!formTitle) setFormTitle(preset.title);
                                                    }}
                                                    className={`group relative rounded-lg border-2 overflow-hidden cursor-pointer transition-all aspect-video flex flex-col justify-end p-1.5 ${
                                                        isSelected
                                                            ? "border-amber-500 ring-2 ring-amber-300/60 shadow-sm"
                                                            : "border-gray-200 hover:border-amber-300"
                                                    }`}
                                                >
                                                    <img
                                                        src={preset.url}
                                                        alt={preset.title}
                                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors" />

                                                    {isSelected && (
                                                        <div className="absolute top-1.5 right-1.5 z-10 h-5 w-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                                                            <Check className="h-3 w-3 stroke-[3]" />
                                                        </div>
                                                    )}

                                                    <span className="relative z-10 text-[9px] font-bold text-white leading-tight drop-shadow truncate">
                                                        {preset.title}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </TabsContent>

                                {/* Tab 2: Upload File */}
                                <TabsContent value="upload" className="pt-3 space-y-3">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="h-36 border-2 border-dashed border-gray-200 hover:border-indigo-400 rounded-xl bg-gray-50/50 hover:bg-indigo-50/20 flex flex-col items-center justify-center p-4 cursor-pointer transition-all group overflow-hidden relative"
                                    >
                                        {filePreview && sourceMode === "upload" ? (
                                            <div className="w-full h-full relative">
                                                <img
                                                    src={filePreview}
                                                    alt="Selected Preview"
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity rounded-lg">
                                                    {t("change_image")}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center space-y-1.5">
                                                <div className="h-10 w-10 mx-auto rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <Upload className="h-5 w-5" />
                                                </div>
                                                <p className="text-xs font-bold text-gray-700">
                                                    {t("click_to_upload_image")}
                                                </p>
                                                <p className="text-[10px] text-gray-400">
                                                    {t("recommended_1920x600px_max_2mb")}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </TabsContent>

                                {/* Tab 3: Custom URL */}
                                <TabsContent value="url" className="pt-3 space-y-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-gray-600">
                                            Image URL
                                        </Label>
                                        <Input
                                            value={formUrl}
                                            onChange={(e) => {
                                                setFormUrl(e.target.value);
                                                setFilePreview(e.target.value);
                                            }}
                                            className="h-9 text-xs rounded-lg border-gray-200"
                                            placeholder="https://... or /madrasha/..."
                                        />
                                    </div>
                                    {formUrl && (
                                        <div className="h-28 rounded-lg border border-gray-200 overflow-hidden bg-slate-900 relative">
                                            <img
                                                src={getDisplayUrl(formUrl)}
                                                alt="URL Preview"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = "none";
                                                }}
                                            />
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    <DialogFooter className="px-5 py-3 border-t bg-gray-50 flex items-center justify-end gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setModalOpen(false)}
                            className="h-8 px-4 text-xs font-bold rounded-full cursor-pointer"
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="h-8 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                        >
                            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {editingBanner ? t("save_changes") : t("upload_banner")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Image Preview Dialog */}
            <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
                <DialogContent className="sm:max-w-[800px] p-0 gap-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-black text-white">
                    <DialogHeader className="p-4 bg-slate-900/90 border-b border-white/10 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#014739] text-amber-300 border border-amber-400">
                                জামিয়ার কার্যক্রম
                            </span>
                            <DialogTitle className="text-sm font-bold text-white truncate max-w-lg">
                                {viewingImage?.title || t("view_banner")}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="sr-only">
                            {viewingImage?.title || t("view_banner")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[70vh] bg-black flex items-center justify-center p-2 overflow-hidden">
                        {viewingImage && (
                            <img
                                src={viewingImage.url}
                                alt={viewingImage.title}
                                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Restore Defaults Confirmation Dialog */}
            <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <RotateCcw className="h-4 w-4 text-amber-500" />
                            {t("restore_default_banners")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-gray-500">
                            {t("confirm_restore_default_banners")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="h-8 text-xs font-bold rounded-full cursor-pointer">
                            {t("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRestoreDefaults}
                            disabled={restoring}
                            className="h-8 text-xs font-bold rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white cursor-pointer"
                        >
                            {restoring && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                            {t("confirm")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Alert Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <Trash2 className="h-4 w-4 text-rose-500" />
                            {t("delete_banner")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-gray-500">
                            {t("confirm_delete_banner_desc")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="h-8 text-xs font-bold rounded-full cursor-pointer">
                            {t("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="h-8 text-xs font-bold rounded-full bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                        >
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
