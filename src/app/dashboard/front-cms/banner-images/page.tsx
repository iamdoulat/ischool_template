"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    Plus, Image as ImageIcon, Trash2, Loader2, X,
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useImageUrl } from "@/lib/image-url";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";

interface Banner {
    id: number;
    title: string | null;
    image_path: string;
}

function GridSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-gray-100 overflow-hidden">
                    <Skeleton className="h-32 rounded-none" />
                    <div className="p-2.5">
                        <Skeleton className="h-3 w-2/3 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function BannerImagesPage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const resolveImg = useImageUrl();

    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ title: "", image: null as File | null });

    const getDisplayUrl = (path: string) => {
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        return resolveImg(path.replace(/^\/?storage\//, ""));
    };

    const fetchBanners = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("front-cms/banners");
            setBanners(res.data?.data ?? []);
        } catch {
            tt.error("failed_to_load_banners");
        } finally { setLoading(false); }
    }, [toast, tt]);

    useEffect(() => { fetchBanners(); }, [fetchBanners]);

    const handleSave = async () => {
        if (!form.image) {
            tt.error("please_select_an_image"); return;
        }
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append("title", form.title);
            fd.append("image", form.image);
            await api.post("front-cms/banners", fd, { headers: { "Content-Type": "multipart/form-data" } });
            tt.success("banner_added");
            setOpen(false); setForm({ title: "", image: null }); fetchBanners();
        } catch {
            tt.error("failed_to_upload_banner");
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`front-cms/banners/${deleteId}`);
            tt.success("banner_deleted");
            fetchBanners();
        } catch {
            tt.error("failed_to_delete_banner");
        } finally { setDeleteId(null); }
    };

    return (
        <div className="p-4 lg:p-6 space-y-5 animate-in fade-in duration-500 pb-20">
            <Card className="border-[0.5px] border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.08)] overflow-hidden pt-0 gap-0">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <ImageIcon className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold text-slate-800 leading-none">{t("banner_images")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("manage_homepage_banner_slides")}</p>
                        </div>
                    </div>
                    <Button onClick={() => { setForm({ title: "", image: null }); setOpen(true); }}
                        className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all shrink-0">
                        <Plus className="h-4 w-4" /> {t("add_banner")}
                    </Button>
                </CardHeader>

                <CardContent className="p-5">
                    {loading ? <GridSkeleton /> : banners.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                            <ImageIcon className="h-10 w-10 opacity-30" />
                            <p className="text-xs font-medium">{t("no_banners_found")}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {banners.map(banner => (
                                <div key={banner.id}
                                    className="group relative bg-white rounded-lg border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300">
                                    {/* Delete Overlay */}
                                    <button
                                        onClick={() => setDeleteId(banner.id)}
                                        className="absolute top-2 right-2 z-10 h-7 w-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600 active:scale-95">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>

                                    {/* Image */}
                                    <div className="h-32 bg-gray-50 flex items-center justify-center overflow-hidden relative">
                                        <img src={getDisplayUrl(banner.image_path)} alt={banner.title || t("banner")}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>

                                    {/* Label */}
                                    <div className="bg-white p-2.5 border-t border-gray-50">
                                        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-tight truncate">
                                            {banner.title || t("untitled_banner")}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[440px] p-0 gap-0 overflow-hidden">
                    <DialogHeader className="px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b">
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm"><ImageIcon className="h-4 w-4" /></span>
                            {t("add_banner_image")}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-5 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600">{t("title_optional")}</Label>
                            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-9 text-xs" placeholder={t("banner_title")} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600">{t("image")} <span className="text-red-500">*</span></Label>
                            <Input type="file" accept="image/*" onChange={e => setForm({ ...form, image: e.target.files?.[0] ?? null })} className="h-9 text-xs" />
                            <p className="text-[10px] text-gray-400">{t("recommended_1920x600px_max_2mb")}</p>
                        </div>
                    </div>
                    <DialogFooter className="px-5 py-4 border-t bg-gray-50">
                        <Button variant="ghost" onClick={() => setOpen(false)} className="h-9 px-5 text-xs font-bold">{t("cancel")}</Button>
                        <Button onClick={handleSave} disabled={saving} className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("upload_banner")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={!!deleteId} onOpenChange={o => { if (!o) setDeleteId(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("delete_banner")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("delete_banner_confirmation")}</AlertDialogDescription>
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
