"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useImageUrl } from "@/lib/image-url";
import {
    Newspaper, Calendar, FolderOpen,
} from "lucide-react";

interface NewsItem {
    id: number;
    title: string;
    date: string;
    description: string | null;
    image_path: string | null;
}

function CardSkeleton() {
    return (
        <div className="flex gap-4 rounded-xl border border-gray-200 p-4 animate-pulse">
            <div className="h-20 w-28 rounded-lg bg-gray-200/70 shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded bg-gray-200/70" />
                <div className="h-3 w-1/3 rounded bg-gray-200/60" />
                <div className="h-3 w-full rounded bg-gray-200/50" />
            </div>
        </div>
    );
}

export default function UserNewsPage() {
    const resolvedGetImageUrl = useImageUrl();
    const resolveImg = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        return resolvedGetImageUrl(path.replace(/^\/?storage\//, ""));
    };

    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("front-cms/news");
                setNews(res.data?.data ?? []);
            } catch {
                toast.error("Failed to load news");
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
                            <Newspaper className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none">School News</h1>
                            <p className="text-[11px] text-gray-500 mt-1">Latest news and announcements</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 lg:p-5">
                    {loading ? (
                        <div className="space-y-3">
                            <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
                        </div>
                    ) : news.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
                            <FolderOpen className="h-12 w-12 opacity-30" />
                            <p className="text-[12px] font-semibold">No news found.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {news.map(item => (
                                <div key={item.id} className="flex flex-col sm:flex-row gap-4 rounded-xl border border-gray-200 p-4 bg-white hover:shadow-md transition-all duration-300">
                                    <div className="h-36 sm:h-20 w-full sm:w-28 rounded-lg bg-gray-50 overflow-hidden shrink-0">
                                        {resolveImg(item.image_path) ? (
                                            <img src={resolveImg(item.image_path)!} alt={item.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                        ) : (
                                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#FF9800]/10 to-[#6366F1]/10">
                                                <Newspaper className="h-8 w-8 text-indigo-200" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-[14px] font-bold text-gray-800 leading-tight">{item.title}</h2>
                                        <span className="flex items-center gap-1 mt-1.5 text-[11px] text-gray-500 font-medium">
                                            <Calendar className="h-3.5 w-3.5 text-indigo-400" />{item.date}
                                        </span>
                                        {item.description && (
                                            <p className="text-[11px] text-gray-500 mt-2 line-clamp-2 leading-relaxed">{item.description}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
