"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
    Youtube, ChevronLeft, ChevronRight, PlayCircle, Play,
    Loader2, Search, X, ExternalLink, Video as VideoIcon,
} from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { toast } from "sonner";

interface Video {
    id: number;
    title: string;
    videoUrl: string;
    thumbnail: string;
    description: string;
}

const PAGE_SIZES = ["12", "24", "48", "96"];

/** Extract a YouTube video id from common URL shapes. */
function youtubeId(url: string): string | null {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/,
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
}

/** Extract a Vimeo video id from common URL shapes. */
function vimeoId(url: string): string | null {
    if (!url) return null;
    const match = url.match(/(?:vimeo\.com\/|video\/)(\d+)/);
    return match ? match[1] : null;
}

/** Best available thumbnail: explicit DB value, else derived YouTube/Vimeo thumbnail. */
function thumbFor(video: Video): string | null {
    if (video.thumbnail) return video.thumbnail;
    
    const ytId = youtubeId(video.videoUrl);
    if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    
    const vimId = vimeoId(video.videoUrl);
    if (vimId) return `https://vumbnail.com/${vimId}.jpg`;
    
    return null;
}

export default function UserVideoTutorialPage() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState("12");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [active, setActive] = useState<Video | null>(null);
    const { t } = useTranslation();

    const fetchData = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const perPage = parseInt(itemsPerPage, 10) || 12;
            const response = await api.get("/user/video-tutorials", {
                params: { page, per_page: perPage, search: searchTerm || undefined },
            });
            const res = response.data?.data || response.data || {};
            const dataArr = Array.isArray(res) ? res : (res.data || []);
            setVideos(dataArr);
            setTotalEntries(res.total || dataArr.length);
            setTotalPages(res.last_page || Math.ceil((res.total || dataArr.length) / perPage) || 1);
            setCurrentPage(res.current_page || page);
        } catch (error) {
            console.error("Error fetching video tutorials:", error);
            toast.error(t("failed_to_load_video_tutorials"));
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage, searchTerm]);

    useEffect(() => {
        fetchData(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemsPerPage]);

    // Close lightbox on Escape
    useEffect(() => {
        if (!active) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setActive(null); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [active]);

    const handleSearch = () => {
        setCurrentPage(1);
        fetchData(1);
    };

    const sizeNum = parseInt(itemsPerPage, 10) || 12;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;

    const activeId = active ? youtubeId(active.videoUrl) : null;

    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
        .reduce<(number | "…")[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
            acc.push(p);
            return acc;
        }, []);

    return (
        <div className="p-4 lg:p-6 animate-in fade-in duration-500">
            <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden p-0 gap-0">
                {/* ── Header ── */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <PlayCircle className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none truncate">{t("video_tutorial")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {loading ? t("loading") : `${totalEntries} video${totalEntries === 1 ? "" : "s"} available`}
                            </p>
                        </div>
                    </div>
                </div>

                <CardContent className="p-4">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder={t("search")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                                className="pl-8 h-9 text-sm rounded-[10px]"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[12px] text-gray-500 hidden sm:inline">{t("show")}</span>
                            <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
                                <SelectTrigger className="h-9 w-[72px] text-[12px] border border-gray-200 bg-white rounded-[10px]">
                                    <SelectValue placeholder="12" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAGE_SIZES.map((s) => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                onClick={handleSearch}
                                className="h-9 px-3.5 gap-1.5 rounded-[10px] text-white text-[12px] font-semibold bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity active:scale-95"
                            >
                                <Search className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{t("search")}</span>
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span>{t("loading_video_tutorials")}</span>
                        </div>
                    ) : videos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <VideoIcon className="h-12 w-12 opacity-30 mb-3" />
                            <p className="text-base font-medium text-gray-500">{t("no_video_tutorials_found")}</p>
                            <p className="text-sm mt-1">{t("try_different_search")}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {videos.map((video) => {
                                const thumb = thumbFor(video);
                                return (
                                    <button
                                        key={video.id}
                                        onClick={() => setActive(video)}
                                        className="group text-left border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
                                    >
                                        <div className="relative aspect-video bg-gray-100 overflow-hidden">
                                            {thumb ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={thumb}
                                                    alt={video.title}
                                                    loading="lazy"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-300">
                                                    <Youtube className="h-10 w-10" />
                                                </div>
                                            )}
                                            {/* Play overlay */}
                                            <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <span className="h-12 w-12 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center border border-white/40 scale-90 group-hover:scale-100 transition-transform">
                                                    <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                                                </span>
                                            </div>
                                            <span className="absolute top-2 right-2 bg-red-600 p-1 rounded-md shadow-sm">
                                                <Youtube className="h-3.5 w-3.5 text-white" strokeWidth={2} />
                                            </span>
                                        </div>
                                        <div className="p-3 border-t border-gray-100 flex-1 flex flex-col">
                                            <h3 className="text-[13px] font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-[#6366F1] transition-colors" title={video.title}>
                                                {video.title}
                                            </h3>
                                            {video.description && (
                                                <p className="text-[11px] text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                                                    {video.description}
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Footer Pagination */}
                    {!loading && videos.length > 0 && (
                        <div className="flex items-center justify-between mt-5 gap-3 flex-wrap">
                            <span className="text-[12px] text-gray-500">
                                {t("showing")} {totalEntries > 0 ? startIndex + 1 : 0} {t("to")}{" "}
                                {Math.min(startIndex + sizeNum, totalEntries)} {t("of")} {totalEntries} {t("entries")}
                            </span>

                            {totalPages > 1 && (
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        size="icon"
                                        disabled={safePage === 1}
                                        onClick={() => fetchData(safePage - 1)}
                                        className="h-8 w-8 rounded-[10px] text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity disabled:opacity-40"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    {pageNumbers.map((p, i) =>
                                        p === "…" ? (
                                            <span key={`e-${i}`} className="text-gray-400 text-[12px] px-1">…</span>
                                        ) : (
                                            <Button
                                                key={p}
                                                size="icon"
                                                onClick={() => fetchData(p as number)}
                                                className={cn(
                                                    "h-8 w-8 rounded-[10px] text-[12px] font-medium transition-opacity",
                                                    safePage === p
                                                        ? "text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90"
                                                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                                )}
                                            >
                                                {p}
                                            </Button>
                                        )
                                    )}
                                    <Button
                                        size="icon"
                                        disabled={safePage === totalPages}
                                        onClick={() => fetchData(safePage + 1)}
                                        className="h-8 w-8 rounded-[10px] text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity disabled:opacity-40"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Lightbox player ── */}
            {active && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-200"
                    onClick={() => setActive(null)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-3 px-5 py-3.5 border-b border-gray-100">
                            <h2 className="text-[14px] font-bold text-gray-800 leading-snug line-clamp-2">{active.title}</h2>
                            <button
                                onClick={() => setActive(null)}
                                className="shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="relative aspect-video bg-black w-full">
                            {(() => {
                                const ytId = youtubeId(active.videoUrl);
                                const vimId = vimeoId(active.videoUrl);
                                
                                if (ytId) {
                                    return (
                                        <iframe
                                            className="absolute inset-0 w-full h-full"
                                            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
                                            title={active.title}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    );
                                } else if (vimId) {
                                    return (
                                        <iframe
                                            className="absolute inset-0 w-full h-full"
                                            src={`https://player.vimeo.com/video/${vimId}?autoplay=1`}
                                            title={active.title}
                                            allow="autoplay; fullscreen; picture-in-picture"
                                            allowFullScreen
                                        />
                                    );
                                } else {
                                    return (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-300">
                                            <VideoIcon className="h-12 w-12" />
                                            <a
                                                href={active.videoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-[13px] text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
                                            >
                                                <ExternalLink className="h-4 w-4" /> {t("open_video_in_new_tab")}
                                            </a>
                                        </div>
                                    );
                                }
                            })()}
                        </div>

                        {(active.description || active.videoUrl) && (
                            <div className="px-5 py-4 overflow-y-auto">
                                {active.description && (
                                    <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap">{active.description}</p>
                                )}
                                {active.videoUrl && (
                                    <a
                                        href={active.videoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 mt-3 text-[13px] text-[#6366F1] hover:underline"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" /> {t("watch_on_youtube")}
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
