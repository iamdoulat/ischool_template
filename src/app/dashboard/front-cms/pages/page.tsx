"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import "react-quill-new/dist/quill.snow.css";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
    Search, ChevronLeft, ChevronRight, Pencil, Plus, Eye, Trash2,
    Globe, Loader2, FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";

interface PageItem {
    id: number;
    title: string;
    url: string | null;
    page_type: string;
    is_system: boolean;
    content: string | null;
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

export default function PagesListPage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [pages, setPages] = useState<PageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [pageSize, setPageSize] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);
    const appUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || (typeof window !== 'undefined' ? window.location.origin : '');

    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showHtml, setShowHtml] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    const ReactQuill = useMemo(() => dynamic(() => import("react-quill-new"), { ssr: false }), []);

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'align': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['blockquote', 'code-block'],
            ['link', 'image'],
            ['clean'],
        ],
    };

    const [form, setForm] = useState({ title: "", url: "", page_type: "Standard", content: "" });

    const fetchPages = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("front-cms/pages");
            setPages(res.data?.data ?? []);
        } catch {
            tt.error("failed_to_load_pages");
        } finally { setLoading(false); }
    }, [toast, tt]);

    useEffect(() => { fetchPages(); }, [fetchPages]);

    const openAdd = () => {
        setEditingId(null);
        setForm({ title: "", url: "", page_type: "Standard", content: "" });
        setShowHtml(false);
        setOpen(true);
    };
    const openEdit = (item: PageItem) => {
        setEditingId(item.id);
        setForm({ title: item.title, url: item.url || "", page_type: item.page_type, content: item.content || "" });
        setShowHtml(false);
        setOpen(true);
    };

    const handleSave = async () => {
        if (!form.title) {
            tt.error("title_is_required"); return;
        }
        setSaving(true);
        try {
            if (editingId) await api.put(`front-cms/pages/${editingId}`, form);
            else await api.post("front-cms/pages", form);
            tt.success(editingId ? "page_updated" : "page_created");
            setOpen(false); fetchPages();
        } catch {
            tt.error("failed_to_save_page");
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await api.delete(`front-cms/pages/${deleteId}`);
            tt.success("page_deleted");
            fetchPages();
        } catch {
            tt.error("failed_to_delete_page");
        } finally { setDeleting(false); setDeleteId(null); }
    };

    const handleViewPage = (url: string | null) => {
        const fullUrl = `${appUrl.replace(/\/$/, '')}/${(url || '').replace(/^\//, '')}`;
        window.open(fullUrl, '_blank');
    };

    const getBadgeStyle = (type: string) => {
        switch (type?.toLowerCase()) {
            case "gallery": return "bg-lime-500 text-white";
            case "event": return "bg-cyan-500 text-white";
            default: return "bg-gray-400 text-white";
        }
    };

    const filtered = useMemo(() => pages.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.url && p.url.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [pages, searchTerm]);

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
                            <Globe className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold text-slate-800 leading-none">{t("pages")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("manage_front_end_cms_pages")}</p>
                        </div>
                    </div>
                    <Button onClick={openAdd} className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all shrink-0">
                        <Plus className="h-4 w-4" /> {t("add_page")}
                    </Button>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder={t("search_pages")} value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-9 h-9 text-xs" />
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
                        <Table className="min-w-[720px]">
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="font-semibold text-gray-600">{t("title")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("url")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("type")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right w-[110px]">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? <TableSkeleton cols={4} /> : paginated.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="py-14 text-center"><div className="flex flex-col items-center gap-2 text-gray-400"><FolderOpen className="h-8 w-8 opacity-40" /><span className="text-xs">{t("no_pages_found")}</span></div></TableCell></TableRow>
                                ) : paginated.map(page => (
                                    <TableRow key={page.id} className="text-xs hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer">
                                        <TableCell className="py-3 font-medium text-gray-800">{page.title}</TableCell>
                                        <TableCell
                                            className="py-3 text-indigo-500 font-medium hover:underline cursor-pointer"
                                            onClick={() => handleViewPage(page.url)}
                                        >/{page.url?.replace(/^\//, '') || ''}</TableCell>
                                        <TableCell className="py-3">
                                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight shadow-sm", getBadgeStyle(page.page_type))}>{page.page_type}</span>
                                        </TableCell>
                                        <TableCell className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button onClick={() => handleViewPage(page.url)} size="sm" className="h-7 w-7 p-0 rounded bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm active:scale-95"><Eye className="h-4 w-4" /></Button>
                                                <Button onClick={() => openEdit(page)} size="sm" className="h-7 w-7 p-0 rounded bg-amber-500 hover:bg-amber-600 text-white shadow-sm active:scale-95"><Pencil className="h-4 w-4" /></Button>
                                                {!page.is_system && (
                                                    <Button onClick={() => setDeleteId(page.id)} size="sm" className="h-7 w-7 p-0 rounded bg-red-500 hover:bg-red-600 text-white shadow-sm active:scale-95"><Trash2 className="h-4 w-4" /></Button>
                                                )}
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
                <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
                    <DialogHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b">
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm"><Globe className="h-4 w-4" /></span>
                            {editingId ? t("edit_page") : t("add_page")}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600">{t("title")} <span className="text-red-500">*</span></Label>
                                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-9 text-xs" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600">{t("page_type")}</Label>
                                <Select value={form.page_type} onValueChange={v => setForm({ ...form, page_type: v })}>
                                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Standard">Standard</SelectItem>
                                        <SelectItem value="Gallery">Gallery</SelectItem>
                                        <SelectItem value="Event">Event</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600">{t("url_optional")}</Label>
                            <Input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} className="h-9 text-xs" placeholder="/my-page" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-gray-600">{t("content")}</Label>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setShowHtml(!showHtml)} className="h-6 px-2 text-[10px] font-bold text-gray-400 hover:text-indigo-500 uppercase">
                                    {showHtml ? t("rich_text") : t("html")}
                                </Button>
                            </div>
                            <div className="min-h-[200px] border border-gray-200 rounded-md overflow-hidden">
                                {showHtml ? (
                                    <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                                        className="w-full min-h-[200px] p-3 text-xs font-mono border-0 focus:outline-none resize-y" placeholder={t("your_html_content_here")} />
                                ) : (
                                    <ReactQuill theme="snow" value={form.content} onChange={content => setForm({ ...form, content })}
                                        modules={quillModules} className="h-full bg-white" />
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="px-5 py-4 border-t bg-gray-50">
                        <Button variant="ghost" onClick={() => setOpen(false)} className="h-9 px-5 text-xs font-bold">{t("cancel")}</Button>
                        <Button onClick={handleSave} disabled={saving} className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save_page")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={!!deleteId} onOpenChange={o => { if (!o) setDeleteId(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("delete_page")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("delete_page_confirmation")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-500 hover:bg-red-600">
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
