"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
    FileIcon,
    Pencil,
    FileSpreadsheet,
    FileImage,
    HardDrive,
    Layers,
    User,
    Calendar,
    UploadCloud,
    X,
    File as FileGenericIcon,
    Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/components/providers/language-provider";
import { useImageUrl } from "@/lib/image-url";
import {
    formatDate,
    toLocaleNumber,
    translateContentType,
    cn,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
    content_type_id?: number;
    content_type?: { id: number; name: string };
    description?: string;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

export default function UploadContentPage() {
    const { t, language } = useLanguage();
    const langCode = language?.short_code || "en";
    const { toast } = useToast();
    const getImageUrl = useImageUrl();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
    const [contents, setContents] = useState<ContentItem[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [stats, setStats] = useState({ total_documents: 0, total_size: 0 });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [contentTypes, setContentTypes] = useState<{ id: number; name: string }[]>([]);
    const [isEditing, setIsEditing] = useState<number | null>(null);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        content_type_id: "",
        description: "",
        file: null as File | null,
    });

    const fetchInitialData = async () => {
        try {
            const response = await api.get("/download-center/content-types");
            setContentTypes(response.data.data || []);
        } catch (error) {
            console.error("Error fetching content types:", error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get("/download-center/uploaded-contents/stats");
            setStats(response.data || { total_documents: 0, total_size: 0 });
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const fetchContents = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(
                `/download-center/uploaded-contents?page=${page}&limit=12&search=${encodeURIComponent(searchTerm)}`
            );
            const data = response.data;
            setContents(data.data || []);
            setPagination({
                current_page: data.current_page || 1,
                last_page: data.last_page || 1,
                total: data.total || 0,
                from: data.from || 0,
                to: data.to || 0,
            });
        } catch (error) {
            console.error("Error fetching contents:", error);
            toast({
                title: t("error"),
                description: t("failed_to_fetch_content_list") || "Failed to fetch content list",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [searchTerm, t, toast]);

    useEffect(() => {
        fetchInitialData();
        fetchStats();
    }, []);

    useEffect(() => {
        fetchContents(1);
    }, [fetchContents]);

    const handleUpload = async () => {
        if (!isEditing && !formData.file) {
            toast({
                title: t("error"),
                description: t("please_upload_a_file"),
                variant: "destructive",
            });
            return;
        }
        if (!formData.title.trim() || !formData.content_type_id) {
            toast({
                title: t("error"),
                description: t("please_fill_all_required_fields") || "Please fill all required fields",
                variant: "destructive",
            });
            return;
        }

        setSaving(true);
        const data = new FormData();
        data.append("title", formData.title);
        data.append("content_type_id", formData.content_type_id);
        data.append("description", formData.description);
        if (formData.file) {
            data.append("file", formData.file);
        }

        try {
            if (isEditing) {
                data.append("_method", "PUT");
                await api.post(`/download-center/uploaded-contents/${isEditing}`, data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast({
                    title: t("success"),
                    description: t("content_updated_successfully"),
                });
            } else {
                await api.post("/download-center/uploaded-contents", data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast({
                    title: t("success"),
                    description: t("content_uploaded_successfully"),
                });
            }
            setIsDialogOpen(false);
            setIsEditing(null);
            setFormData({ title: "", content_type_id: "", description: "", file: null });
            fetchContents(pagination?.current_page || 1);
            fetchStats();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast({
                title: t("error"),
                description: err.response?.data?.message || t("failed_to_save_content") || "Failed to save content",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item: ContentItem) => {
        setIsEditing(item.id);
        setFormData({
            title: item.title,
            content_type_id: String(item.content_type_id || item.content_type?.id || ""),
            description: item.description || "",
            file: null,
        });
        setIsDialogOpen(true);
    };

    const promptDelete = (id: number) => {
        setDeleteId(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/download-center/uploaded-contents/${deleteId}`);
            toast({
                title: t("success"),
                description: t("content_deleted_successfully"),
            });
            fetchContents(pagination?.current_page || 1);
            fetchStats();
        } catch {
            toast({
                title: t("error"),
                description: t("failed_to_delete_content") || "Failed to delete content",
                variant: "destructive",
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    const formatBytes = (bytes: number, code = langCode, decimals = 2) => {
        if (!bytes || bytes <= 0) return `${toLocaleNumber(0, code)} Bytes`;
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const num = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
        return `${toLocaleNumber(num, code)} ${sizes[i]}`;
    };

    const getFileIcon = (item: ContentItem, isLarge = true) => {
        const ext = item.file_type?.toLowerCase() || "";
        const boxClass = isLarge
            ? "h-12 w-12 rounded-xl shrink-0 flex flex-col items-center justify-center shadow-xs border"
            : "h-8 w-8 rounded-lg shrink-0 flex items-center justify-center border";

        if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
            return (
                <div className={cn(boxClass, "relative overflow-hidden border-indigo-100 bg-indigo-50/50")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={getImageUrl(item.file_path)}
                        alt={item.title}
                        className="object-cover w-full h-full"
                    />
                </div>
            );
        }
        if (ext === "pdf") {
            return (
                <div className={cn(boxClass, "bg-rose-50 border-rose-100 text-rose-600")}>
                    <FileText className={isLarge ? "h-5 w-5" : "h-4 w-4"} />
                    {isLarge && <span className="text-[8px] font-black uppercase tracking-wider">PDF</span>}
                </div>
            );
        }
        if (["xls", "xlsx", "csv"].includes(ext)) {
            return (
                <div className={cn(boxClass, "bg-emerald-50 border-emerald-100 text-emerald-600")}>
                    <FileSpreadsheet className={isLarge ? "h-5 w-5" : "h-4 w-4"} />
                    {isLarge && <span className="text-[8px] font-black uppercase tracking-wider">XLS</span>}
                </div>
            );
        }
        if (["doc", "docx"].includes(ext)) {
            return (
                <div className={cn(boxClass, "bg-blue-50 border-blue-100 text-blue-600")}>
                    <FileText className={isLarge ? "h-5 w-5" : "h-4 w-4"} />
                    {isLarge && <span className="text-[8px] font-black uppercase tracking-wider">DOC</span>}
                </div>
            );
        }
        return (
            <div className={cn(boxClass, "bg-indigo-50 border-indigo-100 text-[#6366f1]")}>
                <FileGenericIcon className={isLarge ? "h-5 w-5" : "h-4 w-4"} />
                {isLarge && ext && <span className="text-[7px] font-black uppercase tracking-wider">{ext.slice(0, 3)}</span>}
            </div>
        );
    };

    // Filter contents by type if selected
    const filteredContents = useMemo(() => {
        if (selectedTypeFilter === "all") return contents;
        return contents.filter(
            (c) => String(c.content_type_id || c.content_type?.id) === selectedTypeFilter
        );
    }, [contents, selectedTypeFilter]);

    // Format breakdown counts
    const typeBreakdown = useMemo(() => {
        const counts: Record<string, number> = {
            pdf: 0,
            images: 0,
            docs: 0,
            others: 0,
        };
        contents.forEach((c) => {
            const ext = c.file_type?.toLowerCase() || "";
            if (ext === "pdf") counts.pdf++;
            else if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) counts.images++;
            else if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)) counts.docs++;
            else counts.others++;
        });
        return counts;
    }, [contents]);

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <CloudUpload className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                            {t("content_list")}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">
                            {t("uploaded_files_and_document_library")}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => {
                        setIsEditing(null);
                        setFormData({ title: "", content_type_id: "", description: "", file: null });
                        setIsDialogOpen(true);
                    }}
                    className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all"
                >
                    <CloudUpload className="h-4 w-4" /> {t("upload_content")}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* Main Content Area (3 cols) */}
                <div className="lg:col-span-3 space-y-4">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden p-4">
                        {/* Toolbar: Search, Filter, View Toggles */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-gray-100">
                            <div className="flex flex-1 w-full sm:w-auto items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder={t("search")}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="h-9 pl-9 pr-4 text-xs bg-white border-gray-200 focus-visible:ring-indigo-500 rounded-lg shadow-2xs"
                                    />
                                </div>
                                <div className="w-40 shrink-0">
                                    <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
                                        <SelectTrigger className="h-9 text-xs bg-white border-gray-200 rounded-lg shadow-2xs">
                                            <SelectValue placeholder={t("all")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t("all")}</SelectItem>
                                            {contentTypes.map((type) => (
                                                <SelectItem key={type.id} value={String(type.id)}>
                                                    {translateContentType(type.name, langCode)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-lg border border-gray-200/60 self-end sm:self-auto">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setViewMode("grid")}
                                    className={cn(
                                        "h-7 w-7 rounded-md transition-all",
                                        viewMode === "grid"
                                            ? "bg-white text-[#6366f1] shadow-xs font-bold"
                                            : "text-gray-400 hover:text-gray-700"
                                    )}
                                    title={t("grid_view") || "Grid"}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setViewMode("list")}
                                    className={cn(
                                        "h-7 w-7 rounded-md transition-all",
                                        viewMode === "list"
                                            ? "bg-white text-[#6366f1] shadow-xs font-bold"
                                            : "text-gray-400 hover:text-gray-700"
                                    )}
                                    title={t("list_view") || "List"}
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Content Presentation */}
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-[#6366f1]" />
                                <p className="text-xs font-medium">{t("loading")}...</p>
                            </div>
                        ) : filteredContents.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
                                <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-400">
                                    <CloudUpload className="h-8 w-8 opacity-60" />
                                </div>
                                <p className="text-xs font-bold text-gray-500">{t("no_documents_uploaded_yet")}</p>
                                <Button
                                    onClick={() => setIsDialogOpen(true)}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs font-semibold text-[#6366f1] border-indigo-200 hover:bg-indigo-50 rounded-full mt-1"
                                >
                                    <CloudUpload className="h-3.5 w-3.5 mr-1" /> {t("upload_content")}
                                </Button>
                            </div>
                        ) : viewMode === "grid" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-4">
                                {filteredContents.map((item) => (
                                    <div
                                        key={item.id}
                                        className="group relative flex flex-col justify-between bg-white border border-gray-150 hover:border-indigo-200 rounded-xl p-4 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3">
                                                {getFileIcon(item, true)}
                                                <div className="min-w-0 flex-1">
                                                    <h3
                                                        className="text-xs font-bold text-gray-800 truncate group-hover:text-[#6366f1] transition-colors"
                                                        title={item.title}
                                                    >
                                                        {item.title}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[9px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 border-indigo-100 rounded-full"
                                                        >
                                                            {translateContentType(item.content_type?.name, langCode)}
                                                        </Badge>
                                                        {item.uploader?.name && (
                                                            <span className="inline-flex items-center gap-1 text-[9px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-150">
                                                                <User className="h-2.5 w-2.5 text-gray-400" />
                                                                {item.uploader.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium pt-1">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {toLocaleNumber(formatDate(item.created_at), langCode)}
                                                </span>
                                                <span>•</span>
                                                <span className="font-semibold text-gray-600">
                                                    {formatBytes(item.file_size, langCode)}
                                                </span>
                                            </div>

                                            {item.description && (
                                                <p
                                                    className="text-[11px] text-gray-500 font-normal line-clamp-2 bg-gray-50/70 p-2 rounded-lg border border-gray-100"
                                                    title={item.description}
                                                >
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-1.5">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleEdit(item)}
                                                className="h-7 w-7 text-amber-600 hover:bg-amber-50 hover:text-amber-700 rounded-full"
                                                title={t("edit")}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => window.open(getImageUrl(item.file_path), "_blank")}
                                                className="h-7 w-7 text-[#6366f1] hover:bg-indigo-50 hover:text-indigo-700 rounded-full"
                                                title={t("download")}
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => promptDelete(item.id)}
                                                className="h-7 w-7 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-full"
                                                title={t("delete")}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* List View */
                            <div className="rounded-lg border border-gray-200/80 overflow-hidden mt-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50/80 hover:bg-gray-50 text-xs">
                                            <TableHead className="font-semibold text-gray-600">{t("content_title")}</TableHead>
                                            <TableHead className="font-semibold text-gray-600">{t("content_type")}</TableHead>
                                            <TableHead className="font-semibold text-gray-600">{t("uploader")}</TableHead>
                                            <TableHead className="font-semibold text-gray-600">{t("date")}</TableHead>
                                            <TableHead className="font-semibold text-gray-600">{t("file_size")}</TableHead>
                                            <TableHead className="text-right font-semibold text-gray-600">{t("action")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredContents.map((item) => (
                                            <TableRow
                                                key={item.id}
                                                className="text-xs hover:bg-indigo-50/30 transition-colors"
                                            >
                                                <TableCell className="py-3 font-medium text-gray-800">
                                                    <div className="flex items-center gap-2.5">
                                                        {getFileIcon(item, false)}
                                                        <span className="truncate max-w-[220px]" title={item.title}>
                                                            {item.title}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[9px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 border-indigo-100 rounded-full"
                                                    >
                                                        {translateContentType(item.content_type?.name, langCode)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-3 text-gray-500 font-medium">
                                                    {item.uploader?.name || "-"}
                                                </TableCell>
                                                <TableCell className="py-3 text-gray-500">
                                                    {toLocaleNumber(formatDate(item.created_at), langCode)}
                                                </TableCell>
                                                <TableCell className="py-3 text-gray-600 font-medium">
                                                    {formatBytes(item.file_size, langCode)}
                                                </TableCell>
                                                <TableCell className="py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            size="icon"
                                                            onClick={() => handleEdit(item)}
                                                            className="h-7 w-7 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xs shadow-amber-500/20 active:scale-95 transition-all"
                                                            title={t("edit")}
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            onClick={() => window.open(getImageUrl(item.file_path), "_blank")}
                                                            className="h-7 w-7 rounded-lg bg-gradient-to-r from-[#6366f1] to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-xs shadow-indigo-500/20 active:scale-95 transition-all"
                                                            title={t("download")}
                                                        >
                                                            <Download className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            onClick={() => promptDelete(item.id)}
                                                            className="h-7 w-7 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-xs shadow-rose-500/20 active:scale-95 transition-all"
                                                            title={t("delete")}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* Pagination */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 mt-4 border-t border-gray-100">
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
                                    onClick={() => fetchContents((pagination?.current_page || 2) - 1)}
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
                                                onClick={() => fetchContents(pageNum)}
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
                                    onClick={() => fetchContents((pagination?.current_page || 1) + 1)}
                                    className="h-8 px-3 text-xs text-gray-600 border-gray-200 hover:bg-gray-50 rounded-full shadow-2xs gap-1"
                                >
                                    {t("next")} <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Section: Statistics & Storage */}
                <div className="w-full space-y-4 shrink-0">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden p-0">
                        <div className="p-6 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-orange-50/40 border-b border-gray-100 flex flex-col items-center text-center">
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] flex items-center justify-center text-white shadow-md mb-3">
                                <HardDrive className="h-8 w-8" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-800">
                                {t("storage_used")}
                            </h3>
                            <p className="text-2xl font-black text-indigo-700 tracking-tight mt-1">
                                {formatBytes(stats.total_size, langCode)}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-1 font-medium">
                                {t("total_documents")}: <span className="font-bold text-gray-700">{toLocaleNumber(stats.total_documents, langCode)}</span>
                            </p>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5 text-rose-500" /> PDF
                                </span>
                                <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 text-rose-700 border-rose-100">
                                    {toLocaleNumber(typeBreakdown.pdf, langCode)}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <FileImage className="h-3.5 w-3.5 text-emerald-500" /> Images
                                </span>
                                <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-100">
                                    {toLocaleNumber(typeBreakdown.images, langCode)}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <FileSpreadsheet className="h-3.5 w-3.5 text-blue-500" /> Documents / Office
                                </span>
                                <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-100">
                                    {toLocaleNumber(typeBreakdown.docs, langCode)}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs py-1.5">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <Layers className="h-3.5 w-3.5 text-indigo-500" /> {t("others") || "Others"}
                                </span>
                                <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 border-indigo-100">
                                    {toLocaleNumber(typeBreakdown.others, langCode)}
                                </Badge>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Upload & Edit Dialog */}
            <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) {
                        setIsEditing(null);
                        setFormData({ title: "", content_type_id: "", description: "", file: null });
                    }
                }}
            >
                <DialogContent className="sm:max-w-[520px] rounded-2xl p-0 overflow-hidden">
                    <DialogHeader className="px-6 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                <CloudUpload className="h-4 w-4" />
                            </span>
                            <DialogTitle className="text-base font-bold text-gray-800">
                                {isEditing ? t("edit_content") : t("upload_content")}
                            </DialogTitle>
                        </div>
                    </DialogHeader>

                    <div className="px-6 py-4 space-y-4">
                        {/* Title */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                {t("content_title")} <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder={t("content_title_placeholder")}
                                className="h-9 border-gray-200 text-xs shadow-none rounded-lg focus-visible:ring-indigo-500"
                            />
                        </div>

                        {/* Content Type */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                {t("content_type")} <span className="text-rose-500">*</span>
                            </Label>
                            <Select
                                value={formData.content_type_id}
                                onValueChange={(v) => setFormData({ ...formData, content_type_id: v })}
                            >
                                <SelectTrigger className="h-9 border-gray-200 text-xs shadow-none rounded-lg focus-visible:ring-indigo-500">
                                    <SelectValue placeholder={t("select_content_type")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {contentTypes.map((type) => (
                                        <SelectItem key={type.id} value={String(type.id)}>
                                            {translateContentType(type.name, langCode)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* File Upload Area */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                {t("select_file")} {!isEditing && <span className="text-rose-500">*</span>}
                            </Label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
                                    formData.file
                                        ? "border-emerald-300 bg-emerald-50/40"
                                        : "border-gray-200 hover:border-indigo-300 bg-gray-50/50 hover:bg-indigo-50/20"
                                )}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                                    className="hidden"
                                />
                                {formData.file ? (
                                    <div className="flex items-center justify-between w-full px-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                                <FileIcon className="h-5 w-5" />
                                            </div>
                                            <div className="text-left min-w-0">
                                                <p className="text-xs font-bold text-gray-800 truncate">
                                                    {formData.file.name}
                                                </p>
                                                <p className="text-[10px] text-gray-500">
                                                    {formatBytes(formData.file.size, langCode)}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFormData({ ...formData, file: null });
                                                if (fileInputRef.current) fileInputRef.current.value = "";
                                            }}
                                            className="h-7 w-7 text-gray-400 hover:text-rose-600 rounded-full"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <UploadCloud className="h-8 w-8 text-indigo-400 mb-1" />
                                        <p className="text-xs font-bold text-gray-700">
                                            {t("drag_drop_file")}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-1 max-w-[280px]">
                                            {t("file_support_hint")}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700">
                                {t("description")}
                            </Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="border-gray-200 text-xs shadow-none min-h-[75px] rounded-lg focus-visible:ring-indigo-500"
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
                            onClick={handleUpload}
                            disabled={saving}
                            className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("saving")}...
                                </>
                            ) : isEditing ? (
                                t("update_and_save")
                            ) : (
                                t("upload_and_save")
                            )}
                        </Button>
                    </DialogFooter>
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
                            {t("delete_content_confirm")}
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
