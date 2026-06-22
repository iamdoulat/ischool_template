"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useImageUrl } from "@/lib/image-url";
import {
    CalendarDays, Calendar, MapPin, FolderOpen,
} from "lucide-react";

interface EventItem {
    id: number;
    title: string;
    venue: string | null;
    start_date: string;
    end_date: string | null;
    description: string | null;
    image_path: string | null;
}

function CardSkeleton() {
    return (
        <div className="rounded-xl border border-gray-200 overflow-hidden animate-pulse">
            <div className="h-40 bg-gray-200/70" />
            <div className="p-4 space-y-2">
                <div className="h-4 w-2/3 rounded bg-gray-200/70" />
                <div className="h-3 w-1/2 rounded bg-gray-200/60" />
                <div className="h-3 w-full rounded bg-gray-200/50" />
            </div>
        </div>
    );
}

export default function UserEventsPage() {
    const resolvedGetImageUrl = useImageUrl();
    const resolveImg = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        return resolvedGetImageUrl(path.replace(/^\/?storage\//, ""));
    };

    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("front-cms/events");
                setEvents(res.data?.data ?? []);
            } catch {
                toast.error("Failed to load events");
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
                            <CalendarDays className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none">School Events</h1>
                            <p className="text-[11px] text-gray-500 mt-1">Upcoming and recent school events</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 lg:p-5">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <CardSkeleton /><CardSkeleton /><CardSkeleton />
                        </div>
                    ) : events.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
                            <FolderOpen className="h-12 w-12 opacity-30" />
                            <p className="text-[12px] font-semibold">No events found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {events.map(item => (
                                <div key={item.id} className="rounded-xl border border-gray-200 overflow-hidden bg-white hover:shadow-lg transition-all duration-300 flex flex-col">
                                    <div className="h-40 bg-gray-50 overflow-hidden relative">
                                        {resolveImg(item.image_path) ? (
                                            <img src={resolveImg(item.image_path)!} alt={item.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                        ) : (
                                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#FF9800]/10 to-[#6366F1]/10">
                                                <CalendarDays className="h-10 w-10 text-indigo-200" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col">
                                        <h2 className="text-[14px] font-bold text-gray-800 leading-tight">{item.title}</h2>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-gray-500 font-medium">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                                                {item.start_date}{item.end_date ? ` – ${item.end_date}` : ""}
                                            </span>
                                            {item.venue && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3.5 w-3.5 text-indigo-400" />{item.venue}
                                                </span>
                                            )}
                                        </div>
                                        {item.description && (
                                            <p className="text-[11px] text-gray-500 mt-2 line-clamp-3 leading-relaxed">{item.description}</p>
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
