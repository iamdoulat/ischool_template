"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Search, ChevronLeft, ChevronRight, Pencil, Plus, Eye, Trash2,
    Calendar, MapPin, Image as ImageIcon, CalendarDays, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useImageUrl } from "@/lib/image-url";
import { useTranslation } from "@/hooks/use-translation";
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
                            <Skeleton className="h-4 rounded" style={{ width: `${55 + ((i * 3 + j * 7) % 35)}%` }} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function EventPage() {
    const { toast } = useToast();
    const { t } = useTranslation();
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
        title: "", venue: "", start_date: new Date().toISOString().split("T")[0],
        end_date: "", description: "", image: null as File | null,
    });

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("front-cms/events");
            setEvents(res.data?.data ?? []);
        } catch {
            tt.error("failed_to_load_events");
        } finally { setLoading(false); }
    }, [toast, tt]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const openAdd = () => {
        setEditingId(null);
        setForm({ title: "", venue: "", start_date: new Date().toISOString().split("T")[0], end_date: "", description: "", image: null });
        setOpen(true);
    };
    const openEdit = (item: EventItem) => {
        setEditingId(item.id);
        setForm({ title: item.title, venue: item.venue ?? "", start_date: item.start_date, end_date: item.end_date ?? "", description: item.description ?? "", image: null });
        setOpen(true);
    };

    const handleSave = async () => {
        if (!form.title || !form.start_date) {
            tt.error("title_and_start_date_required"); return;
        }
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append("title", form.title); fd.append("venue", form.venue);
            fd.append("start_date", form.start_date); fd.append("end_date", form.end_date);
            fd.append("description", form.description);
            if (form.image) fd.append("image", form.image);
            if (editingId) { fd.append("_method", "PUT"); await api.post(`front-cms/events/${editingId}`, fd, { headers: { "Content-Type": "multipart/form-data" } }); }
            else { await api.post("front-cms/events", fd, { headers: { "Content-Type": "multipart/form-data" } }); }
            tt.success(editingId ? "event_updated" : "event_created");
            setOpen(false); fetchEvents();
        } catch {
            tt.error("failed_to_save_event");
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`front-cms/events/${deleteId}`);
            tt.success("event_deleted"); fetchEvents();
        } catch {
            tt.error("failed_to_delete_event");
        } finally { setDeleteId(null); }
    };

    const filtered = useMemo(() => events.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.venue ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    ), [events, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const from = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const to = Math.min(currentPage * pageSize, filtered.length);

    return (
        <div className="p-4 lg:p-6 space-y-5 animate-in fade-in duration-500 pb-20">
            <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] overflow-hidden pt-0 gap-0">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <CalendarDays className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold text-slate-800 leading-none">{t("events")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("manage_school_events_and_activities")}</p>
                        </div>
                    </div>
                    <Button onClick={openAdd} className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all shrink-0">
                        <Plus className="h-4 w-4" /> {t("add_event")}
                    </Button>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder={t("search_events")} value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{t("show")}</span>
                            <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setCurrentPage(1); }}>
                                <SelectTrigger className="h-9 w-[70px] text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {PAGE_SIZES.map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="rounded-md border overflow-x-auto">
                        <Table className="min-w-[640px]">
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="font-semibold text-gray-600">{t("title")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("date")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("venue")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right w-[110px]">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? <TableSkeleton cols={4} /> : paginated.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="py-14 text-center text-xs text-gray-400">{t("no_events_found")}</TableCell></TableRow>
                                ) : paginated.map(item => (
                                    <TableRow key={item.id} className="text-xs hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                        <TableCell className="py-3 font-medium text-gray-800">{item.title}</TableCell>
                                        <TableCell className="py-3 text-gray-500">
                                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{item.start_date}{item.end_date ? ` – ${item.end_date}` : ""}</span>
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-500">
                                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.venue || "—"}</span>
                                        </TableCell>
                                        <TableCell className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button onClick={() => setViewItem(item)} size="sm" className="h-7 w-7 p-0 rounded bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm active:scale-95"><Eye className="h-4 w-4" /></Button>
                                                <Button onClick={() => openEdit(item)} size="sm" className="h-7 w-7 p-0 rounded bg-amber-500 hover:bg-amber-600 text-white shadow-sm active:scale-95"><Pencil className="h-4 w-4" /></Button>
                                                <Button onClick={() => setDeleteId(item.id)} size="sm" className="h-7 w-7 p-0 rounded bg-red-500 hover:bg-red-600 text-white shadow-sm active:scale-95"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium">
                        <div>{t("showing_x_to_y_of_z", { from, to, total: filtered.length })}</div>
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

            {/* Add/Edit Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
                    <DialogHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b">
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm"><CalendarDays className="h-4 w-4" /></span>
                            {editingId ? t("edit_event") : t("add_event")}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600">{t("title")} <span className="text-red-500">*</span></Label>
                            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-9 text-xs" placeholder={t("event_title")} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600">{t("start_date")} <span className="text-red-500">*</span></Label>
                                <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="h-9 text-xs" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600">{t("end_date")}</Label>
                                <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="h-9 text-xs" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600">{t("venue")}</Label>
                            <Input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} className="h-9 text-xs" placeholder={t("school_hall_ground")} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600">{t("description")}</Label>
                            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="text-xs resize-none" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600">{t("image")}</Label>
                            <Input type="file" accept="image/*" onChange={e => setForm({ ...form, image: e.target.files?.[0] ?? null })} className="h-9 text-xs" />
                        </div>
                    </div>
                    <DialogFooter className="px-5 py-4 border-t bg-gray-50">
                        <Button variant="ghost" onClick={() => setOpen(false)} className="h-9 px-5 text-xs font-bold">{t("cancel")}</Button>
                        <Button onClick={handleSave} disabled={saving} className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save_event")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={!!viewItem} onOpenChange={o => { if (!o) setViewItem(null); }}>
                <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
                    <DialogHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b">
                        <DialogTitle className="text-base font-bold text-slate-800">{viewItem?.title}</DialogTitle>
                    </DialogHeader>
                    {viewItem && (
                        <div className="p-5 space-y-4">
                            {resolveImg(viewItem.image_path) && (
                                <div className="rounded-lg overflow-hidden border border-gray-100">
                                    <img src={resolveImg(viewItem.image_path)!} alt={viewItem.title} className="w-full h-48 object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div><p className="text-gray-400 font-medium mb-0.5">{t("start_date")}</p><p className="font-semibold text-gray-700 flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-indigo-400" />{viewItem.start_date}</p></div>
                                {viewItem.end_date && <div><p className="text-gray-400 font-medium mb-0.5">{t("end_date")}</p><p className="font-semibold text-gray-700 flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-indigo-400" />{viewItem.end_date}</p></div>}
                                {viewItem.venue && <div className="col-span-2"><p className="text-gray-400 font-medium mb-0.5">{t("venue")}</p><p className="font-semibold text-gray-700 flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-indigo-400" />{viewItem.venue}</p></div>}
                            </div>
                            {viewItem.description && <div><p className="text-gray-400 font-medium text-xs mb-0.5">{t("description")}</p><p className="text-gray-600 text-xs leading-relaxed">{viewItem.description}</p></div>}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={!!deleteId} onOpenChange={o => { if (!o) setDeleteId(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("delete_event")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("delete_event_confirmation")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">{t("delete")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
