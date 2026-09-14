/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Plus,
    Eye,
    Trash2,
    Calendar,
    MapPin,
    CalendarDays,
    Loader2,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
} from "lucide-react";
import { cn, toLocaleNumber } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useImageUrl } from "@/lib/image-url";
import { useLanguage } from "@/components/providers/language-provider";
import { useTranslateToast } from "@/hooks/use-translate-toast";

interface EventItem {
    id: number;
    title: string;
    venue: string | null;
    start_date: string;
    end_date: string | null;
    description: string | null;
    image_path: string | null;
}

const PAGE_SIZES = [10, 20, 50, 100];

function TableSkeleton({ cols }: { cols: number }) {
    return (
        <>
            {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3">
                            <Skeleton
                                className="h-4 rounded"
                                style={{ width: `${55 + ((i * 3 + j * 7) % 35)}%` }}
                            />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function EventPage() {
    const { toast } = useToast();
    const { t, language } = useLanguage();
    const langCode = language?.short_code || "en";
    const tt = useTranslateToast();
    const resolvedGetImageUrl = useImageUrl();
    const resolveImg = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        return resolvedGetImageUrl(path.replace(/^\/?storage\//, ""));
    };

    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [pageSize, setPageSize] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);

    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [viewItem, setViewItem] = useState<EventItem | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const [form, setForm] = useState({
        title: "",
        venue: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        description: "",
        image: null as File | null,
    });

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("front-cms/events");
            setEvents(res.data?.data ?? []);
        } catch {
            tt.error("failed_to_load_events");
        } finally {
            setLoading(false);
        }
    }, [tt]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const openAdd = () => {
        setEditingId(null);
        setForm({
            title: "",
            venue: "",
            start_date: new Date().toISOString().split("T")[0],
            end_date: "",
            description: "",
            image: null,
        });
        setOpen(true);
    };

    const openEdit = (item: EventItem) => {
        setEditingId(item.id);
        setForm({
            title: item.title,
            venue: item.venue ?? "",
            start_date: item.start_date,
            end_date: item.end_date ?? "",
            description: item.description ?? "",
            image: null,
        });
        setOpen(true);
    };

    const handleSave = async () => {
        if (!form.title || !form.start_date) {
            tt.error("title_and_start_date_required");
            return;
        }
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append("title", form.title);
            fd.append("venue", form.venue);
            fd.append("start_date", form.start_date);
            fd.append("end_date", form.end_date);
            fd.append("description", form.description);
            if (form.image) fd.append("image", form.image);

            if (editingId) {
                fd.append("_method", "PUT");
                await api.post(`front-cms/events/${editingId}`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } else {
                await api.post("front-cms/events", fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }
            tt.success(editingId ? "event_updated" : "event_created");
            setOpen(false);
            fetchEvents();
        } catch {
            tt.error("failed_to_save_event");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`front-cms/events/${deleteId}`);
            tt.success("event_deleted");
            fetchEvents();
        } catch {
            tt.error("failed_to_delete_event");
        } finally {
            setDeleteId(null);
        }
    };

    const filtered = useMemo(
        () =>
            events.filter(
                (e) =>
                    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (e.venue ?? "").toLowerCase().includes(searchTerm.toLowerCase())
            ),
        [events, searchTerm]
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const to = Math.min(currentPage * pageSize, filtered.length);

    const handleCopy = () => {
        navigator.clipboard.writeText(
            filtered
                .map((e) => `${e.title}\t${e.start_date}${e.end_date ? ` - ${e.end_date}` : ""}\t${e.venue || ""}`)
                .join("\n")
        );
        toast({
            title: t("copied"),
            description: t("copied_to_clipboard") || "Copied to clipboard",
        });
    };

    const handleExportCSV = () => {
        const rows = [
            ["Title", "Start Date", "End Date", "Venue", "Description"],
            ...filtered.map((e) => [
                e.title,
                e.start_date,
                e.end_date || "",
                e.venue || "",
                e.description || "",
            ]),
        ];
        const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], {
            type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "events.csv";
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
                        <CalendarDays className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                            {t("events")}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">
                            {t("manage_school_events_and_activities")}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={openAdd}
                    className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
                >
                    <Plus className="h-4 w-4" /> {t("add_event")}
                </Button>
            </div>

            {/* Content Table Card */}
            <div className="rounded-xl border border-gray-200/80 bg-white shadow-xs overflow-hidden p-5 space-y-4">
                {/* Search, Filter & Export Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                        <Input
                            placeholder={t("search_events")}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-9 h-9 text-xs border-gray-200 focus-visible:ring-indigo-500 rounded-full shadow-none bg-gray-50/60"
                        />
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-500">{t("show")}</span>
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
                        </div>

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

                {/* Table */}
                <div className="rounded-xl border border-gray-100 overflow-x-auto custom-scrollbar bg-white shadow-2xs">
                    <Table className="min-w-[680px]">
                        <TableHeader className="bg-gray-50/80 text-xs">
                            <TableRow className="border-b border-gray-100 whitespace-nowrap">
                                <TableHead className="font-bold text-gray-700 py-3 pl-4">
                                    {t("title")}
                                </TableHead>
                                <TableHead className="font-bold text-gray-700 py-3">
                                    {t("date")}
                                </TableHead>
                                <TableHead className="font-bold text-gray-700 py-3">
                                    {t("venue")}
                                </TableHead>
                                <TableHead className="font-bold text-gray-700 py-3 pr-4 text-right w-[110px]">
                                    {t("action")}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableSkeleton cols={4} />
                            ) : paginated.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="py-14 text-center text-xs font-semibold text-gray-400"
                                    >
                                        {t("no_events_found")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginated.map((item) => (
                                    <TableRow
                                        key={item.id}
                                        className="text-xs border-b border-gray-50 hover:bg-indigo-50/30 transition-colors whitespace-nowrap cursor-pointer"
                                        onClick={() => setViewItem(item)}
                                    >
                                        <TableCell className="py-3 pl-4 font-semibold text-gray-800">
                                            {item.title}
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-500">
                                            <span className="flex items-center gap-1.5 font-medium">
                                                <Calendar className="h-3.5 w-3.5 text-[#6366f1]" />
                                                <span>{toLocaleNumber(item.start_date, langCode)}</span>
                                                {item.end_date && (
                                                    <span> – {toLocaleNumber(item.end_date, langCode)}</span>
                                                )}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-500">
                                            <span className="flex items-center gap-1.5">
                                                <MapPin className="h-3.5 w-3.5 text-amber-500" />
                                                <span>{item.venue || "—"}</span>
                                            </span>
                                        </TableCell>
                                        <TableCell
                                            className="py-3 pr-4 text-right"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button
                                                    size="icon"
                                                    onClick={() => setViewItem(item)}
                                                    className="h-7 w-7 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xs shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                                                    title={t("view")}
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    onClick={() => openEdit(item)}
                                                    className="h-7 w-7 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xs shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                                                    title={t("edit")}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    onClick={() => setDeleteId(item.id)}
                                                    className="h-7 w-7 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-xs shadow-rose-500/20 active:scale-95 transition-all cursor-pointer"
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

            {/* Add / Edit Event Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 rounded-2xl overflow-hidden border-none shadow-2xl bg-white">
                    <DialogHeader className="p-5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 flex flex-row items-center gap-3 space-y-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <CalendarDays className="h-5 w-5" />
                        </span>
                        <div>
                            <DialogTitle className="text-base font-bold text-gray-800 leading-none">
                                {editingId ? t("edit_event") : t("add_event")}
                            </DialogTitle>
                            <p className="text-[11px] text-gray-500 mt-1 font-medium">
                                {t("manage_school_events_and_activities")}
                            </p>
                        </div>
                    </DialogHeader>

                    <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700">
                                {t("title")} <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="h-9 text-xs rounded-lg border-gray-200 focus-visible:ring-indigo-500"
                                placeholder={t("event_title")}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("start_date")} <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={form.start_date}
                                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                    className="h-9 text-xs rounded-lg border-gray-200 focus-visible:ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-700">
                                    {t("end_date")}
                                </Label>
                                <Input
                                    type="date"
                                    value={form.end_date}
                                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                    className="h-9 text-xs rounded-lg border-gray-200 focus-visible:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700">
                                {t("venue")}
                            </Label>
                            <Input
                                value={form.venue}
                                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                                className="h-9 text-xs rounded-lg border-gray-200 focus-visible:ring-indigo-500"
                                placeholder={t("school_hall_ground")}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700">
                                {t("description")}
                            </Label>
                            <Textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                rows={3}
                                className="text-xs rounded-lg resize-none border-gray-200 focus-visible:ring-indigo-500"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700">
                                {t("image")}
                            </Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setForm({ ...form, image: e.target.files?.[0] ?? null })}
                                className="h-9 text-xs rounded-lg border-gray-200"
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-4 px-6 bg-gray-50/80 border-t border-gray-100 flex sm:justify-between items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="h-9 px-5 text-xs font-bold rounded-full border-gray-200 hover:bg-gray-100"
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                        >
                            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {editingId ? t("update") : t("save_event")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Event Dialog */}
            <Dialog open={!!viewItem} onOpenChange={(o) => { if (!o) setViewItem(null); }}>
                <DialogContent className="sm:max-w-[480px] p-0 rounded-2xl overflow-hidden border-none shadow-2xl bg-white">
                    <DialogHeader className="p-5 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 flex flex-row items-center gap-3 space-y-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <CalendarDays className="h-5 w-5" />
                        </span>
                        <div>
                            <DialogTitle className="text-base font-bold text-gray-800 leading-none">
                                {viewItem?.title}
                            </DialogTitle>
                            <p className="text-[11px] text-gray-500 mt-1 font-medium">
                                {t("event_details")}
                            </p>
                        </div>
                    </DialogHeader>
                    {viewItem && (
                        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            {resolveImg(viewItem.image_path) && (
                                <div className="rounded-xl overflow-hidden border border-gray-100 shadow-2xs max-h-52 bg-gray-50">
                                    <img
                                        src={resolveImg(viewItem.image_path)!}
                                        alt={viewItem.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = "none";
                                        }}
                                    />
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50/60 p-3.5 rounded-xl border border-gray-100">
                                <div>
                                    <p className="text-gray-400 font-medium mb-0.5">{t("start_date")}</p>
                                    <p className="font-bold text-gray-800 flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-[#6366f1]" />
                                        <span>{toLocaleNumber(viewItem.start_date, langCode)}</span>
                                    </p>
                                </div>
                                {viewItem.end_date && (
                                    <div>
                                        <p className="text-gray-400 font-medium mb-0.5">{t("end_date")}</p>
                                        <p className="font-bold text-gray-800 flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-[#6366f1]" />
                                            <span>{toLocaleNumber(viewItem.end_date, langCode)}</span>
                                        </p>
                                    </div>
                                )}
                                {viewItem.venue && (
                                    <div className="col-span-2 pt-2 border-t border-gray-100">
                                        <p className="text-gray-400 font-medium mb-0.5">{t("venue")}</p>
                                        <p className="font-bold text-gray-800 flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 text-amber-500" />
                                            <span>{viewItem.venue}</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                            {viewItem.description && (
                                <div className="p-3.5 rounded-xl bg-gray-50/60 border border-gray-100">
                                    <p className="text-gray-400 font-medium text-xs mb-1">
                                        {t("description")}
                                    </p>
                                    <p className="text-gray-700 text-xs leading-relaxed whitespace-pre-wrap">
                                        {viewItem.description}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter className="p-4 px-6 bg-gray-50/80 border-t border-gray-100">
                        <Button
                            variant="outline"
                            onClick={() => setViewItem(null)}
                            className="h-8 px-5 text-xs font-bold rounded-full border-gray-200 hover:bg-gray-100"
                        >
                            {t("close")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-gray-900">
                            {t("delete_event")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-gray-500">
                            {t("delete_event_confirm")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="h-9 text-xs font-bold rounded-full">
                            {t("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
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
