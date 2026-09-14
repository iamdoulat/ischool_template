/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
    Search,
    Upload,
    FileIcon,
    ImageIcon,
    Film,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Loader2,
    FolderOpen,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Link as LinkIcon,
} from "lucide-react";
import { cn, toLocaleNumber } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useImageUrl } from "@/lib/image-url";
import { useLanguage } from "@/components/providers/language-provider";
import { useTranslateToast } from "@/hooks/use-translate-toast";

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
                <div key={i} className="rounded-xl border border-gray-100 overflow-hidden shadow-2xs">
                    <Skeleton className="h-28 rounded-none" />
                    <div className="p-2.5 space-y-1.5 bg-white">
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
    const { t, language } = useLanguage();
    const langCode = language?.short_code || "en";
    const tt = useTranslateToast();
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
            const extractedData = res.data?.data?.data || res.data?.data || res.data || [];
            setMedia(Array.isArray(extractedData) ? extractedData : []);
        } catch {
            tt.error("failed_to_load_media");
        } finally {
            setLoading(false);
        }
    }, [tt]);

    useEffect(() => {
        fetchMedia();
    }, [fetchMedia]);

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            const data = new FormData();
            for (let i = 0; i < files.length; i++) data.append("files[]", files[i]);
            await api.post("front-cms/media", data, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast({
                title: t("success"),
                description: `${files.length} file(s) uploaded successfully`,
            });
            fetchMedia();
        } catch {
            tt.error("failed_to_upload_media");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await api.delete(`front-cms/media/${deleteId}`);
            toast({
                title: t("success"),
                description: t("file_deleted") || "File deleted successfully",
            });
            fetchMedia();
        } catch {
            tt.error("failed_to_delete_file");
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    const getDisplayUrl = (path: string) => {
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        return resolveImg(path.replace(/^\/?storage\//, ""));
    };

    const filtered = useMemo(() => {
        return media.filter((item) => {
            const matchesSearch = item.file_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === "all" || item.file_type.startsWith(filterType);
            return matchesSearch && matchesType;
        });
    }, [media, searchTerm, filterType]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const to = Math.min(currentPage * pageSize, filtered.length);

    const handleCopy = () => {
        navigator.clipboard.writeText(
            filtered.map((item) => `${item.file_name}\t${item.file_type}\t${item.file_size || ""}`).join("\n")
        );
        toast({
            title: t("copied"),
            description: t("copied_to_clipboard") || "Copied to clipboard",
        });
    };

    const handleExportCSV = () => {
        const rows = [
            ["File Name", "File Type", "Size", "File Path"],
            ...filtered.map((item) => [
                item.file_name,
                item.file_type,
                item.file_size || "",
                item.file_path,
            ]),
        ];
        const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], {
            type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "media_library.csv";
        link.click();
    };

    const toolbarActions = [
        { Icon: Copy, onClick: handleCopy, title: t("copy") },
        { Icon: FileSpreadsheet, onClick: handleExportCSV, title: t("excel") },
        { Icon: FileText, onClick: handleExportCSV, title: t("csv") },
        { Icon: Printer, onClick: () => window.print(), title: t("print") },
    ];

    return (
        <div className="space-y-6">
            {/* Standalone Edge-to-Edge Gradient Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <ImageIcon className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                            {t("media_manager")}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">
                            {t("upload_images_videos_and_documents")}
                        </p>
                    </div>
                </div>
                {uploading && (
                    <div className="flex items-center gap-2 text-xs font-bold text-[#6366f1] bg-white px-3 py-1.5 rounded-full border border-indigo-100 shadow-2xs">
                        <Loader2 className="h-4 w-4 animate-spin text-[#6366f1]" />
                        <span>Uploading files...</span>
                    </div>
                )}
            </div>

            {/* Upload Dropzone Container */}
            <div className="rounded-xl border border-gray-200/80 bg-white shadow-xs overflow-hidden p-5">
                <div className="relative group">
                    <input
                        type="file"
                        multiple
                        onChange={(e) => handleFileUpload(e.target.files)}
                        disabled={uploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                    />
                    <div className="border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center justify-center gap-2.5 transition-all bg-gray-50/50 group-hover:bg-indigo-50/20 group-hover:border-indigo-300">
                        <div className="h-11 w-11 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                            {uploading ? (
                                <Loader2 className="h-5 w-5 animate-spin text-[#6366f1]" />
                            ) : (
                                <Upload className="h-5 w-5 text-[#6366f1]" />
                            )}
                        </div>
                        <div className="text-center space-y-0.5">
                            <span className="text-xs text-gray-700 font-bold block">
                                {t("drop_files_here_or_click_to_browse")}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium block">
                                {t("supports_images_videos_pdfs_documents")}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Media Library Card */}
            <div className="rounded-xl border border-gray-200/80 bg-white shadow-xs overflow-hidden p-5 space-y-4">
                {/* Search, Filter & Export Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                        <Input
                            placeholder={t("search_files")}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-9 h-9 text-xs border-gray-200 focus-visible:ring-indigo-500 rounded-full shadow-none bg-gray-50/60"
                        />
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                        <Select
                            value={filterType}
                            onValueChange={(v) => {
                                setFilterType(v);
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger className="h-8 w-[125px] text-xs border-gray-200 bg-white shadow-2xs rounded-lg px-2.5 font-medium">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all" className="text-xs">{t("all_files")}</SelectItem>
                                <SelectItem value="image" className="text-xs">{t("images")}</SelectItem>
                                <SelectItem value="video" className="text-xs">{t("videos")}</SelectItem>
                                <SelectItem value="application" className="text-xs">{t("documents") || "Documents"}</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={String(pageSize)}
                            onValueChange={(v) => {
                                setPageSize(Number(v));
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger className="w-[75px] h-8 text-xs border-gray-200 bg-white shadow-2xs rounded-lg px-2 font-medium">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PAGE_SIZES.map((n) => (
                                    <SelectItem key={n} value={String(n)} className="text-xs">
                                        {toLocaleNumber(n, langCode)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Export Toolbar */}
                        <div className="flex items-center border border-gray-200/80 rounded-lg p-0.5 bg-gray-50/80 text-gray-500">
                            {toolbarActions.map((a, i) => (
                                <Button
                                    key={i}
                                    variant="ghost"
                                    size="icon"
                                    onClick={a.onClick}
                                    title={a.title}
                                    className="h-7 w-7 text-gray-500 hover:text-gray-800 hover:bg-white rounded-md transition-all shadow-none"
                                >
                                    <a.Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Media Grid */}
                {loading ? (
                    <GridSkeleton />
                ) : paginated.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                        <FolderOpen className="h-10 w-10 opacity-30" />
                        <p className="text-xs font-semibold">{t("no_files_found")}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {paginated.map((item) => {
                            const typeGroup = getTypeGroup(item.file_type);
                            const isImage = typeGroup === "image";
                            const gradient = FILE_TYPE_COLORS[typeGroup] || FILE_TYPE_COLORS.default;
                            const fullUrl = getDisplayUrl(item.file_path);

                            return (
                                <div
                                    key={item.id}
                                    className="group relative bg-white rounded-xl border border-gray-200/70 overflow-hidden flex flex-col hover:shadow-md hover:border-indigo-200 transition-all duration-300"
                                >
                                    {/* Thumbnail Preview */}
                                    <div
                                        className={cn(
                                            "h-28 flex items-center justify-center overflow-hidden relative",
                                            isImage ? "bg-gray-50" : `bg-gradient-to-br ${gradient}`
                                        )}
                                    >
                                        {isImage ? (
                                            <img
                                                src={fullUrl}
                                                alt={item.file_name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = "none";
                                                }}
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-1 text-white/90">
                                                {typeGroup === "video" ? (
                                                    <Film className="h-8 w-8" />
                                                ) : (
                                                    <FileIcon className="h-8 w-8" />
                                                )}
                                                <span className="text-[8px] font-bold uppercase opacity-80">
                                                    {item.file_type.split("/").pop()}
                                                </span>
                                            </div>
                                        )}

                                        {/* Hover Overlay Actions */}
                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Button
                                                size="icon"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(fullUrl);
                                                    toast({
                                                        title: t("copied"),
                                                        description: "File URL copied to clipboard!",
                                                    });
                                                }}
                                                className="h-7 w-7 rounded-lg bg-gradient-to-r from-[#6366f1] to-indigo-600 text-white shadow-xs active:scale-95 transition-all cursor-pointer"
                                                title="Copy URL"
                                            >
                                                <LinkIcon className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                onClick={() => setDeleteId(item.id)}
                                                className="h-7 w-7 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-xs active:scale-95 transition-all cursor-pointer"
                                                title={t("delete")}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>

                                        {/* Size Badge */}
                                        {item.file_size && (
                                            <div className="absolute bottom-1 right-1 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded text-[8px] font-bold text-gray-500 uppercase shadow-2xs border border-gray-100">
                                                {item.file_size}
                                            </div>
                                        )}
                                    </div>

                                    {/* File Name Info */}
                                    <div className="p-2.5 bg-white border-t border-gray-50">
                                        <p
                                            className="text-[10px] font-bold text-gray-800 truncate leading-tight"
                                            title={item.file_name}
                                        >
                                            {item.file_name}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-3 border-t border-gray-100">
                    <div>
                        {t("showing_x_to_y_of_z", {
                            from: toLocaleNumber(from, langCode),
                            to: toLocaleNumber(to, langCode),
                            total: toLocaleNumber(filtered.length, langCode),
                        })}
                    </div>
                    <div className="flex gap-2 items-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="h-8 px-3 text-xs text-gray-600 border-gray-200 hover:bg-gray-50 rounded-full shadow-2xs gap-1 cursor-pointer disabled:opacity-40"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" /> {t("previous")}
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .slice(Math.max(0, currentPage - 3), currentPage + 2)
                                .map((page) => {
                                    const isActive = currentPage === page;
                                    return (
                                        <Button
                                            key={page}
                                            size="sm"
                                            onClick={() => setCurrentPage(page)}
                                            className={cn(
                                                "h-8 w-8 p-0 text-xs font-bold rounded-full transition-all cursor-pointer",
                                                isActive
                                                    ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                                                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                            )}
                                        >
                                            {toLocaleNumber(page, langCode)}
                                        </Button>
                                    );
                                })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="h-8 px-3 text-xs text-gray-600 border-gray-200 hover:bg-gray-50 rounded-full shadow-2xs gap-1 cursor-pointer disabled:opacity-40"
                        >
                            {t("next")} <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Alert Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-gray-900">
                            {t("delete_file")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-gray-500">
                            {t("delete_media_confirm")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="h-9 text-xs font-bold rounded-full">
                            {t("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="h-9 text-xs font-bold rounded-full bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
