"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/components/providers/language-provider";
import {
    translateContentType,
    toLocaleNumber,
    cn,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    Eye,
    Loader2,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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
    const { t, language } = useLanguage();
    const langCode = language?.short_code || "en";
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState("");
    const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [limit, setLimit] = useState("50");
    const [isEditing, setIsEditing] = useState<number | null>(null);
    const [viewType, setViewType] = useState<ContentType | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
    });

    const fetchContentTypes = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(limit),
            });
            if (searchTerm.trim()) {
                params.append("search", searchTerm.trim());
            }

            const response = await api.get(`/download-center/content-types?${params.toString()}`);
            const data = response.data;
            setContentTypes(data.data || []);
            setPagination({
                current_page: data.current_page || 1,
                last_page: data.last_page || 1,
                total: data.total || 0,
                from: data.from || 0,
                to: data.to || 0,
            });
        } catch (error) {
            console.error("Error fetching content types:", error);
            toast({
                title: t("error"),
                description: t("failed_to_fetch_data") || "Failed to fetch content types",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [limit, searchTerm, t, toast]);

    useEffect(() => {
        fetchContentTypes(1);
    }, [fetchContentTypes]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast({
                title: t("error"),
                description: t("please_fill_all_required_fields") || "Please enter a name",
                variant: "destructive",
            });
            return;
        }

        setSaving(true);
        try {
            if (isEditing) {
                await api.put(`/download-center/content-types/${isEditing}`, formData);
                toast({
                    title: t("success"),
                    description: t("content_type_updated_successfully"),
                });
            } else {
                await api.post("/download-center/content-types", formData);
                toast({
                    title: t("success"),
                    description: t("content_type_created_successfully"),
                });
            }
            setFormData({ name: "", description: "" });
            setIsEditing(null);
            fetchContentTypes(pagination?.current_page || 1);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast({
                title: t("error"),
                description: err.response?.data?.message || t("failed_to_save_data") || "Failed to save content type",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (type: ContentType) => {
        setIsEditing(type.id);
        setFormData({ name: type.name, description: type.description || "" });
    };

    const handleCancelEdit = () => {
        setIsEditing(null);
        setFormData({ name: "", description: "" });
    };

    const promptDelete = (id: number) => {
        setDeleteId(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/download-center/content-types/${deleteId}`);
            toast({
                title: t("success"),
                description: t("content_type_deleted_successfully"),
            });
            fetchContentTypes(pagination?.current_page || 1);
        } catch (error) {
            console.error("Error deleting content type:", error);
            toast({
                title: t("error"),
                description: t("failed_to_delete_data") || "Failed to delete content type",
                variant: "destructive",
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    const handleCopy = () => {
        const text = contentTypes.map((t) => `${t.name}\t${t.description || ""}`).join("\n");
        navigator.clipboard.writeText(text);
        toast({ title: t("copied"), description: t("copied_to_clipboard") || "Data copied to clipboard" });
    };

    const handleExportCSV = () => {
        const headers = ["Name", "Description"];
        const rows = contentTypes.map((t) => [t.name, t.description || ""]);
        const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "content_types.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toolbarActions = [
        { Icon: Copy, onClick: handleCopy, title: t("copy") },
        { Icon: FileSpreadsheet, onClick: handleExportCSV, title: t("excel") },
        { Icon: FileText, onClick: handleExportCSV, title: t("csv") },
        { Icon: Printer, onClick: () => window.print(), title: t("print") },
    ];

    return (
        <div className="space-y-6">
            {/* Header Banner - Standalone edge-to-edge gradient */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <FileText className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                            {t("content_type")}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">
                            {t("manage_download_content_categories")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Standard 2-Column CRUD Layout: Left 1/3 Form + Right 2/3 Table (No extra cards) */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Left Section: Add/Edit Content Type Form (1/3) */}
                <div className="w-full lg:w-1/3">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden p-5">
                        <div className="border-b border-gray-100 pb-3 mb-4">
                            <h2 className="text-sm font-bold text-gray-800 tracking-tight">
                                {isEditing ? t("edit_content_type") : t("add_content_type")}
                            </h2>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            {/* Name */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                    {t("name")} <span className="text-rose-500 font-bold">*</span>
                                </Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder={t("enter_name") || "Enter content type name..."}
                                    className="h-9 border-gray-200 focus-visible:ring-indigo-500 rounded-lg text-xs shadow-none bg-white"
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
                                    className="min-h-[110px] border-gray-200 focus-visible:ring-indigo-500 rounded-lg text-xs shadow-none resize-none bg-white"
                                    placeholder={t("optional_description") || "Enter description..."}
                                />
                            </div>

                            {/* Form Actions */}
                            <div className="flex items-center justify-end pt-2 gap-2">
                                {isEditing && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCancelEdit}
                                        className="h-9 px-4 text-xs font-bold rounded-full"
                                    >
                                        {t("cancel")}
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("saving")}...
                                        </>
                                    ) : isEditing ? (
                                        t("update")
                                    ) : (
                                        t("save")
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>

                {/* Right Section: Content Type List Table (2/3) */}
                <div className="w-full lg:w-2/3">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-sm font-bold text-gray-800 tracking-tight">
                                {t("content_type_list")}
                            </h2>
                        </div>

                        {/* Search & Export Toolbar */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-b border-gray-100 pb-3">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                                <Input
                                    placeholder={t("search_content_types")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-9 text-xs border-gray-200 focus-visible:ring-indigo-500 rounded-full shadow-none bg-gray-50/60"
                                />
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                {/* Limit Selector */}
                                <div className="flex items-center gap-1.5">
                                    <Select value={limit} onValueChange={setLimit}>
                                        <SelectTrigger className="h-8 w-20 text-xs border-gray-200 bg-white shadow-2xs rounded-lg px-2">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {["10", "25", "50", "100"].map((n) => (
                                                <SelectItem key={n} value={n} className="text-xs">
                                                    {toLocaleNumber(Number(n), langCode)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Export Tools */}
                                <div className="flex items-center gap-1 text-gray-400">
                                    {toolbarActions.map((action, i) => (
                                        <Button
                                            key={i}
                                            variant="ghost"
                                            size="icon"
                                            onClick={action.onClick}
                                            title={action.title}
                                            className="h-8 w-8 hover:bg-gray-100 rounded-lg"
                                        >
                                            <action.Icon className="h-4 w-4" />
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="rounded-xl border border-gray-100 overflow-hidden bg-white shadow-2xs">
                            <Table>
                                <TableHeader className="bg-gray-50/80">
                                    <TableRow className="border-b border-gray-100">
                                        <TableHead className="text-xs font-bold text-gray-600 py-3 pl-4">
                                            {t("name")}
                                        </TableHead>
                                        <TableHead className="text-xs font-bold text-gray-600 py-3">
                                            {t("description")}
                                        </TableHead>
                                        <TableHead className="text-xs font-bold text-gray-600 py-3 pr-4 text-right">
                                            {t("action")}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-32 text-center text-gray-400 text-xs">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin text-[#6366f1]" />
                                                    <span>{t("loading")}...</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : contentTypes.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-32 text-center text-gray-400 text-xs">
                                                {t("no_content_types_found")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        contentTypes.map((type) => (
                                            <TableRow
                                                key={type.id}
                                                className="text-xs border-b border-gray-50 hover:bg-indigo-50/30 transition-colors"
                                            >
                                                <TableCell className="py-3 pl-4 font-semibold text-gray-800">
                                                    {translateContentType(type.name, langCode)}
                                                </TableCell>
                                                <TableCell className="py-3 text-gray-500 max-w-xs truncate">
                                                    {type.description || "-"}
                                                </TableCell>
                                                <TableCell className="py-3 pr-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            size="icon"
                                                            onClick={() => setViewType(type)}
                                                            className="h-7 w-7 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xs shadow-emerald-500/20 active:scale-95 transition-all"
                                                            title={t("view")}
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            onClick={() => handleEdit(type)}
                                                            className="h-7 w-7 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xs shadow-amber-500/20 active:scale-95 transition-all"
                                                            title={t("edit")}
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            onClick={() => promptDelete(type.id)}
                                                            className="h-7 w-7 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-xs shadow-rose-500/20 active:scale-95 transition-all"
                                                            title={t("delete")}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-3 border-t border-gray-100">
                            <div>
                                {t("showing_x_to_y_of_z", {
                                    from: toLocaleNumber(pagination?.from || 0, langCode),
                                    to: toLocaleNumber(pagination?.to || 0, langCode),
                                    total: toLocaleNumber(pagination?.total || 0, langCode),
                                })}
                            </div>
                            <div className="flex gap-2 items-center">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!pagination || pagination.current_page <= 1}
                                    onClick={() => fetchContentTypes((pagination?.current_page || 2) - 1)}
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
                                                onClick={() => fetchContentTypes(pageNum)}
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
                                    onClick={() => fetchContentTypes((pagination?.current_page || 1) + 1)}
                                    className="h-8 px-3 text-xs text-gray-600 border-gray-200 hover:bg-gray-50 rounded-full shadow-2xs gap-1"
                                >
                                    {t("next")} <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* View Dialog */}
            <Dialog open={!!viewType} onOpenChange={(open) => !open && setViewType(null)}>
                <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden bg-white shadow-2xl border-none">
                    <DialogHeader className="px-6 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 flex flex-row items-center gap-3 space-y-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm">
                            <Eye className="h-4 w-4" />
                        </span>
                        <div>
                            <DialogTitle className="text-base font-bold text-gray-800 leading-none">
                                {t("view_content_type")}
                            </DialogTitle>
                            <p className="text-[11px] text-gray-500 mt-1 font-medium">
                                {t("detailed_content_type_information")}
                            </p>
                        </div>
                    </DialogHeader>
                    <div className="space-y-4 px-6 py-5 text-xs">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                                {t("name")}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 block bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                {translateContentType(viewType?.name, langCode)}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                                {t("description")}
                            </span>
                            <span className="text-xs font-medium text-gray-700 block bg-gray-50 p-2.5 rounded-lg border border-gray-100 whitespace-pre-wrap min-h-[80px]">
                                {viewType?.description || "-"}
                            </span>
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-3 bg-gray-50/80 border-t border-gray-100">
                        <Button
                            onClick={() => setViewType(null)}
                            variant="outline"
                            className="h-9 px-5 text-xs font-bold rounded-full"
                        >
                            {t("close")}
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
                            {t("delete_content_type_confirm")}
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
