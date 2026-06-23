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
    Search, ChevronLeft, ChevronRight, Plus, Eye, Trash2,
    Images, Loader2, FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useImageUrl } from "@/lib/image-url";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";

interface GalleryItem {
    id: number;
    title: string;
    description: string | null;
    image_path: string;
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

export default function GalleryListPage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const resolvedGetImageUrl = useImageUrl();
    const resolveImg = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        return resolvedGetImageUrl(path.replace(/^\/?storage\//, ""));
    };

    const [galleries, setGalleries] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [pageSize, setPageSize] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);

    const [open, setOpen] = useState(false);
    const [viewItem, setViewItem] = useState<GalleryItem | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const [form, setForm] = useState({ title: "", description: "", image: null as File | null });

    const fetchGallery = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("front-cms/gallery");
            setGalleries(res.data?.data ?? []);
        } catch {
            tt.error("failed_to_load_gallery");
        } finally { setLoading(false); }
    }, [toast, tt]);

    useEffect(() => { fetchGallery(); }, [fetchGallery]);

    const openAdd = () => {
        setForm({ title: "", description: "", image: null });
        setOpen(true);
    };

    const handleSave = async () => {
        if (!form.title || !form.image) {
            tt.error("title_and_image_required"); return;
        }
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append("title", form.title);
            fd.append("description", form.description);
            if (form.image) fd.append("image", form.image);
            await api.post("front-cms/gallery", fd, { headers: { "Content-Type": "multipart/form-data" } });
            tt.success("gallery_item_added");
            setOpen(false); fetchGallery();
        } catch {
            tt.error("failed_to_save_gallery_item");
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`front-cms/gallery/${deleteId}`);
            tt.success("gallery_item_deleted"); fetchGallery();
        } catch {
            tt.error("failed_to_delete_item");
        } finally { setDeleteId(null); }
    };

    const filtered = useMemo(() => galleries.filter(g =>
        g.title.toLowerCase().includes(searchTerm.toLowerCase())
    ), [galleries, searchTerm]);

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
                            <Images className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold text-slate-800 leading-none">{t("gallery")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("manage_photo_gallery_albums")}</p>
                        </div>
                    </div>
                    <Button onClick={openAdd} className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all shrink-0">
                        <Plus className="h-4 w-4" /> {t("add_gallery")}
                    </Button>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder={t("search_gallery")} value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
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
                        <Table className="min-w-[560px]">
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="font-semibold text-gray-600 w-[90px]">{t("image")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("title")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right w-[110px]">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? <TableSkeleton cols={3} /> : paginated.length === 0 ? (
                                    <TableRow><TableCell colSpan={3} className="py-14 text-center"><div className="flex flex-col items-center gap-2 text-gray-400"><FolderOpen className="h-8 w-8 opacity-40" /><span className="text-xs">{t("no_gallery_items_found")}</span></div></TableCell></TableRow>
                                ) : paginated.map(item => (
                                    <TableRow key={item.id} className="text-xs hover:bg-gray-50/60 transition-colors">
                                        <TableCell className="py-2">
                                            <div className="h-10 w-14 rounded-md border border-gray-100 bg-gray-50 overflow-hidden">
                                                {resolveImg(item.image_path) && <img src={resolveImg(item.image_path)!} alt={item.title} className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 font-medium text-gray-800">{item.title}</TableCell>
                                        <TableCell className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button onClick={() => setViewItem(item)} size="sm" className="h-7 w-7 p-0 rounded bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm active:scale-95"><Eye className="h-4 w-4" /></Button>
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

            {/* Add Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[460px] p-0 gap-0 overflow-hidden">
                    <DialogHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b">
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm"><Images className="h-4 w-4" /></span>
                            {t("add_gallery_item")}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-5 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600">{t("title")} <span className="text-red-500">*</span></Label>
                            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-9 text-xs" placeholder={t("album_title")} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600">{t("description")}</Label>
                            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="text-xs resize-none" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600">{t("image")} <span className="text-red-500">*</span></Label>
                            <Input type="file" accept="image/*" onChange={e => setForm({ ...form, image: e.target.files?.[0] ?? null })} className="h-9 text-xs" />
                        </div>
                    </div>
                    <DialogFooter className="px-5 py-4 border-t bg-gray-50">
                        <Button variant="ghost" onClick={() => setOpen(false)} className="h-9 px-5 text-xs font-bold">{t("cancel")}</Button>
                        <Button onClick={handleSave} disabled={saving} className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save_item")}
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
                                    <img src={resolveImg(viewItem.image_path)!} alt={viewItem.title} className="w-full h-56 object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                </div>
                            )}
                            {viewItem.description && <div><p className="text-gray-400 font-medium text-xs mb-0.5">{t("description")}</p><p className="text-gray-600 text-xs leading-relaxed">{viewItem.description}</p></div>}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={!!deleteId} onOpenChange={o => { if (!o) setDeleteId(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("delete_gallery_item")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("delete_gallery_item_confirmation")}</AlertDialogDescription>
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
