"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/components/providers/language-provider";
import {
    formatDate,
    toLocaleNumber,
    translateSendTo,
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
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    ChevronLeft,
    ChevronRight,
    Eye,
    Trash2,
    ArrowUpDown,
    Share2,
    Calendar,
    User,
    Users,
    Clock,
    Loader2,
} from "lucide-react";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

interface SharedContent {
    id: number;
    title: string;
    send_to: string;
    share_date: string;
    valid_upto?: string;
    sender?: { name: string };
    description: string;
}

interface PaginationData {
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

export default function ContentShareListPage() {
    const { t, language } = useLanguage();
    const langCode = language?.short_code || "en";
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState("");
    const [sharedContent, setSharedContent] = useState<SharedContent[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [limit, setLimit] = useState("50");

    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [viewItem, setViewItem] = useState<SharedContent | null>(null);

    const fetchSharedContent = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get(
                `/download-center/shared-contents?page=${page}&limit=${limit}&search=${encodeURIComponent(searchTerm)}`
            );
            const data = response.data;
            setSharedContent(data.data || []);
            setPagination({
                current_page: data.current_page || 1,
                last_page: data.last_page || 1,
                total: data.total || 0,
                from: data.from || 0,
                to: data.to || 0,
            });
        } catch (error) {
            console.error("Error fetching shared content:", error);
            toast({
                title: t("error"),
                description: t("failed_to_fetch_shared_content"),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [limit, searchTerm, t, toast]);

    useEffect(() => {
        fetchSharedContent(1);
    }, [fetchSharedContent]);

    const promptDelete = (id: number) => {
        setDeleteId(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/download-center/shared-contents/${deleteId}`);
            toast({
                title: t("success"),
                description: t("shared_content_deleted_successfully"),
            });
            fetchSharedContent(pagination?.current_page || 1);
        } catch (error) {
            console.error("Error deleting shared content:", error);
            toast({
                title: t("error"),
                description: t("failed_to_delete_shared_content"),
                variant: "destructive",
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    const handleCopy = () => {
        const text = sharedContent
            .map((item) => `${item.title}\t${translateSendTo(item.send_to, langCode)}\t${formatDate(item.share_date)}\t${item.valid_upto ? formatDate(item.valid_upto) : "-"}\t${item.sender?.name || "-"}`)
            .join("\n");
        navigator.clipboard.writeText(text);
        toast({
            title: t("success"),
            description: t("copied_to_clipboard") || "Data copied to clipboard",
        });
    };

    const handleExportCSV = () => {
        const headers = [
            t("title"),
            t("send_to"),
            t("share_date"),
            t("valid_upto"),
            t("shared_by"),
            t("description"),
        ];
        const rows = sharedContent.map((item) => [
            item.title,
            translateSendTo(item.send_to, langCode),
            toLocaleNumber(formatDate(item.share_date), langCode),
            item.valid_upto ? toLocaleNumber(formatDate(item.valid_upto), langCode) : "-",
            item.sender?.name || "-",
            item.description || "-",
        ]);
        const csvContent = [headers, ...rows].map((e) => e.map((cell) => `"${cell}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "content_share_list.csv");
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

    const isExpired = (dateStr?: string) => {
        if (!dateStr) return false;
        return new Date(dateStr).getTime() < new Date().setHours(0, 0, 0, 0);
    };

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Share2 className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                            {t("content_share_list")}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">
                            {t("shared_documents_and_recipient_records")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden p-4 space-y-4">
                {/* Search & Export Toolbar */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pb-4 border-b border-gray-100">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder={t("search_shared_content")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-9 pl-9 pr-4 text-xs bg-white border-gray-200 focus-visible:ring-indigo-500 rounded-lg shadow-2xs"
                        />
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <div className="flex items-center gap-1.5">
                            <Select value={limit} onValueChange={setLimit}>
                                <SelectTrigger className="h-8 w-20 text-xs bg-white border-gray-200 rounded-lg shadow-2xs">
                                    <SelectValue placeholder={toLocaleNumber(limit, langCode)} />
                                </SelectTrigger>
                                <SelectContent>
                                    {["10", "25", "50", "100"].map((n) => (
                                        <SelectItem key={n} value={n} className="text-xs">
                                            {toLocaleNumber(n, langCode)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-gray-50/60 shadow-2xs">
                            {toolbarActions.map((action, i) => (
                                <Button
                                    key={i}
                                    variant="ghost"
                                    size="icon"
                                    onClick={action.onClick}
                                    title={action.title}
                                    className="h-7 w-7 text-gray-500 hover:text-[#6366f1] hover:bg-white rounded-md transition-all"
                                >
                                    <action.Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-lg border border-gray-200/80 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/80 hover:bg-gray-50 text-xs">
                                <TableHead className="font-semibold text-gray-600 py-3">
                                    <div className="flex items-center gap-1">
                                        {t("title")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold text-gray-600 py-3">
                                    <div className="flex items-center gap-1">
                                        {t("send_to")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold text-gray-600 py-3">
                                    <div className="flex items-center gap-1">
                                        {t("share_date")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold text-gray-600 py-3">
                                    <div className="flex items-center gap-1">
                                        {t("valid_upto")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold text-gray-600 py-3">
                                    <div className="flex items-center gap-1">
                                        {t("shared_by")} <ArrowUpDown className="h-2.5 w-2.5 opacity-30" />
                                    </div>
                                </TableHead>
                                <TableHead className="font-semibold text-gray-600 py-3">{t("description")}</TableHead>
                                <TableHead className="text-right font-semibold text-gray-600 py-3">{t("action")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-40 text-center text-gray-400 text-xs">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="h-6 w-6 animate-spin text-[#6366f1]" />
                                            <span>{t("loading")}...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : sharedContent.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center text-gray-400 text-xs">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-400 mb-1">
                                                <Share2 className="h-6 w-6 opacity-50" />
                                            </div>
                                            <p className="font-semibold text-gray-500">{t("no_shared_content_found")}</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sharedContent.map((item) => {
                                    const expired = isExpired(item.valid_upto);
                                    return (
                                        <TableRow
                                            key={item.id}
                                            className="text-xs hover:bg-indigo-50/30 transition-colors"
                                        >
                                            <TableCell className="py-3 font-semibold text-gray-800">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-[#6366f1] shrink-0">
                                                        <FileText className="h-3.5 w-3.5" />
                                                    </span>
                                                    <span className="truncate max-w-[200px]" title={item.title}>
                                                        {item.title}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 border-indigo-100 rounded-full"
                                                >
                                                    <Users className="h-2.5 w-2.5 mr-1" />
                                                    {translateSendTo(item.send_to, langCode)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-600">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3 w-3 text-gray-400" />
                                                    <span>{toLocaleNumber(formatDate(item.share_date), langCode)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-600">
                                                {item.valid_upto ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className={cn("h-3 w-3", expired ? "text-rose-500" : "text-gray-400")} />
                                                        <span className={cn(expired && "text-rose-600 font-semibold")}>
                                                            {toLocaleNumber(formatDate(item.valid_upto), langCode)}
                                                        </span>
                                                        {expired && (
                                                            <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[8px] font-bold px-1.5 py-0 uppercase">
                                                                {t("expired") || "Expired"}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-600">
                                                <div className="flex items-center gap-1.5">
                                                    <User className="h-3 w-3 text-gray-400" />
                                                    <span>{item.sender?.name || "-"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-500 max-w-[220px]">
                                                <span className="truncate block" title={item.description}>
                                                    {item.description || "-"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        size="icon"
                                                        onClick={() => setViewItem(item)}
                                                        className="h-7 w-7 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xs shadow-emerald-500/20 active:scale-95 transition-all"
                                                        title={t("view")}
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
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
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer & Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100">
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
                            onClick={() => fetchSharedContent((pagination?.current_page || 2) - 1)}
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
                                        onClick={() => fetchSharedContent(pageNum)}
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
                            onClick={() => fetchSharedContent((pagination?.current_page || 1) + 1)}
                            className="h-8 px-3 text-xs text-gray-600 border-gray-200 hover:bg-gray-50 rounded-full shadow-2xs gap-1"
                        >
                            {t("next")} <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </Card>

            {/* View Shared Content Details Dialog */}
            <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
                <DialogContent className="sm:max-w-[480px] rounded-2xl p-0 overflow-hidden">
                    <DialogHeader className="px-6 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-xs">
                                <Share2 className="h-4 w-4" />
                            </span>
                            <DialogTitle className="text-base font-bold text-gray-800">
                                {t("shared_content")}
                            </DialogTitle>
                        </div>
                    </DialogHeader>

                    {viewItem && (
                        <div className="px-6 py-4 space-y-3.5 text-xs">
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-0.5">
                                    {t("title")}
                                </span>
                                <p className="font-bold text-gray-800 text-sm">{viewItem.title}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-0.5">
                                        {t("send_to")}
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 border-indigo-100"
                                    >
                                        {translateSendTo(viewItem.send_to, langCode)}
                                    </Badge>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-0.5">
                                        {t("shared_by")}
                                    </span>
                                    <p className="font-semibold text-gray-700">{viewItem.sender?.name || "-"}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-0.5">
                                        {t("share_date")}
                                    </span>
                                    <p className="text-gray-700">
                                        {toLocaleNumber(formatDate(viewItem.share_date), langCode)}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-0.5">
                                        {t("valid_upto")}
                                    </span>
                                    <p className="text-gray-700">
                                        {viewItem.valid_upto ? toLocaleNumber(formatDate(viewItem.valid_upto), langCode) : "-"}
                                    </p>
                                </div>
                            </div>

                            {viewItem.description && (
                                <div className="pt-2 border-t border-gray-100">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block mb-0.5">
                                        {t("description")}
                                    </span>
                                    <p className="text-gray-600 bg-gray-50/70 p-3 rounded-lg border border-gray-100 leading-relaxed">
                                        {viewItem.description}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="px-6 py-3 bg-gray-50/80 border-t border-gray-100">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setViewItem(null)}
                            className="h-8 px-4 text-xs font-bold rounded-full"
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
                            {t("delete_shared_content_confirm")}
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
