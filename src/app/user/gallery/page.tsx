"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useImageUrl } from "@/lib/image-url";
import {
    Dialog, DialogContent,
} from "@/components/ui/dialog";
import {
    Images, FolderOpen,
} from "lucide-react";

interface GalleryItem {
    id: number;
    title: string;
    description: string | null;
    image_path: string;
}

function GridSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                    <div className="h-36 bg-gray-200/70" />
                    <div className="p-2.5">
                        <div className="h-3 w-2/3 rounded bg-gray-200/70" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function UserGalleryPage() {
    const resolvedGetImageUrl = useImageUrl();
    const resolveImg = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        return resolvedGetImageUrl(path.replace(/^\/?storage\//, ""));
    };

    const [gallery, setGallery] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [active, setActive] = useState<GalleryItem | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("front-cms/gallery");
                setGallery(res.data?.data ?? []);
            } catch {
                toast.error("Failed to load gallery");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <div className="p-4 lg:p-6 space-y-5 min-h-screen font-sans animate-in fade-in duration-500">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Images className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none">Photo Gallery</h1>
                            <p className="text-[11px] text-gray-500 mt-1">School photo albums and memories</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 lg:p-5">
                    {loading ? (
                        <GridSkeleton />
                    ) : gallery.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
                            <FolderOpen className="h-12 w-12 opacity-30" />
                            <p className="text-[12px] font-semibold">No photos found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {gallery.map(item => (
                                <button key={item.id} onClick={() => setActive(item)}
                                    className="group rounded-xl border border-gray-200 overflow-hidden bg-white hover:shadow-lg transition-all duration-300 text-left">
                                    <div className="h-36 bg-gray-50 overflow-hidden">
                                        {resolveImg(item.image_path) ? (
                                            <img src={resolveImg(item.image_path)!} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                        ) : (
                                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#FF9800]/10 to-[#6366F1]/10">
                                                <Images className="h-8 w-8 text-indigo-200" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-2.5">
                                        <p className="text-[11px] font-semibold text-gray-700 truncate">{item.title}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Lightbox */}
            <Dialog open={!!active} onOpenChange={o => { if (!o) setActive(null); }}>
                <DialogContent className="sm:max-w-[640px] p-0 gap-0 overflow-hidden">
                    {active && (
                        <div>
                            {resolveImg(active.image_path) && (
                                <img src={resolveImg(active.image_path)!} alt={active.title} className="w-full max-h-[70vh] object-contain bg-black" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            )}
                            <div className="p-4">
                                <h2 className="text-[14px] font-bold text-gray-800">{active.title}</h2>
                                {active.description && <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{active.description}</p>}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
