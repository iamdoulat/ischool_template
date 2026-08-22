"use client";

import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import {
    Calendar,
    Loader2,
    Eye,
    X,
    Search,
    Bell,
    Filter,
    Printer,
    FileText,
    Users,
    ChevronRight,
    Megaphone
} from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Notice {
    id: number;
    title: string;
    message: string;
    notice_date: string;
    publish_date?: string;
    message_to?: string | null;
    notify_to?: string | null;
    is_published?: boolean;
}

export function NoticeBoardSection() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [viewNotice, setViewNotice] = useState<Notice | null>(null);

    useEffect(() => {
        const fetchNotices = async () => {
            try {
                const response = await api.get("/communicate/notices");
                const result = response.data?.data || response.data || [];
                setNotices(Array.isArray(result) ? result : []);
            } catch {
                setNotices([]);
            } finally {
                setLoading(false);
            }
        };
        fetchNotices();
    }, []);

    // Filter notices
    const filteredNotices = useMemo(() => {
        return notices.filter((notice) => {
            const matchesSearch =
                notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                notice.message.toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;

            if (selectedCategory === "all") return true;

            const targets = (notice.message_to || "").toLowerCase();
            if (selectedCategory === "student" && targets.includes("student")) return true;
            if (selectedCategory === "parent" && (targets.includes("parent") || targets.includes("guardian"))) return true;
            if (selectedCategory === "staff" && (targets.includes("staff") || targets.includes("teacher"))) return true;

            return false;
        });
    }, [notices, searchTerm, selectedCategory]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                <p className="text-sm font-medium text-slate-500">Loading notices...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Search & Filter Toolbar */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
                
                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                    <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search notices by keyword..."
                        className="pl-10 h-10 text-sm border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus-visible:ring-indigo-500 rounded-xl"
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                    {[
                        { id: "all", label: "All Notices" },
                        { id: "student", label: "Students" },
                        { id: "parent", label: "Guardians" },
                        { id: "staff", label: "Staff & Faculty" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedCategory(tab.id)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                                selectedCategory === tab.id
                                    ? "bg-indigo-600 text-white shadow-xs"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Empty State */}
            {filteredNotices.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
                    <div className="h-16 w-16 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 rounded-2xl mx-auto flex items-center justify-center mb-4">
                        <Megaphone className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {searchTerm ? "No matching notices found" : "No notices available"}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                        {searchTerm ? "Try searching with different keywords or clearing filters." : "New circulars and announcements will appear here once published."}
                    </p>
                    {searchTerm && (
                        <Button
                            variant="outline"
                            onClick={() => setSearchTerm("")}
                            className="mt-4 h-9 text-xs font-semibold rounded-lg"
                        >
                            Clear Search
                        </Button>
                    )}
                </div>
            ) : (
                /* Notices Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredNotices.map((notice) => {
                        const messageTo = notice.message_to ? notice.message_to.split(',').map(s => s.trim()).filter(Boolean) : [];
                        const plainText = notice.message
                            .replace(/<[^>]*>/g, '')
                            .replace(/&nbsp;/g, ' ')
                            .replace(/&amp;/g, '&')
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .replace(/&#39;/g, "'")
                            .trim();

                        return (
                            <div
                                key={notice.id}
                                onClick={() => setViewNotice(notice)}
                                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/60 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                            >
                                <div className="space-y-3.5">
                                    {/* Header Badges */}
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 px-2.5 py-1 rounded-md">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>
                                                {notice.notice_date ? format(new Date(notice.notice_date), 'dd MMM yyyy') : "Recent"}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {messageTo.map((target, idx) => (
                                                <Badge
                                                    key={idx}
                                                    variant="secondary"
                                                    className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-none"
                                                >
                                                    {target}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Notice Title */}
                                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                                        {notice.title}
                                    </h3>

                                    {/* Excerpt */}
                                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                                        {plainText || "Click to view full notice announcement."}
                                    </p>
                                </div>

                                {/* Card Footer */}
                                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                    <span className="flex items-center gap-1 group-hover:underline">
                                        Read Announcement
                                    </span>
                                    <div className="h-7 w-7 rounded-full bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Notice Detail Dialog */}
            <Dialog open={!!viewNotice} onOpenChange={(open) => !open && setViewNotice(null)}>
                <DialogContent className="sm:max-w-2xl p-0 rounded-2xl border-none shadow-2xl overflow-hidden">
                    {/* Dialog Header */}
                    <div className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] p-6 text-white flex items-start justify-between gap-4">
                        <DialogHeader className="p-0 text-left space-y-1">
                            <span className="text-[11px] uppercase tracking-wider font-extrabold text-white/80 flex items-center gap-1.5">
                                <Bell className="h-3.5 w-3.5" /> Official School Notice
                            </span>
                            <DialogTitle className="text-xl sm:text-2xl font-black text-white leading-snug">
                                {viewNotice?.title}
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    {viewNotice && (
                        <div className="p-6 sm:p-8 space-y-6 bg-white dark:bg-slate-900 max-h-[70vh] overflow-y-auto">
                            {/* Meta Info Bar */}
                            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                                        <span><strong>Date:</strong> {viewNotice.notice_date ? format(new Date(viewNotice.notice_date), 'dd/MM/yyyy') : "—"}</span>
                                    </div>
                                    {viewNotice.publish_date && (
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                                            <span><strong>Published:</strong> {format(new Date(viewNotice.publish_date), 'dd/MM/yyyy')}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Target audience */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {(viewNotice.message_to ? viewNotice.message_to.split(',').map(s => s.trim()).filter(Boolean) : []).map((target, i) => (
                                        <span key={i} className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">
                                            {target}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Message Body */}
                            <div className="prose prose-indigo dark:prose-invert prose-sm sm:prose-base max-w-none leading-relaxed text-slate-700 dark:text-slate-300 break-words"
                                dangerouslySetInnerHTML={{ __html: viewNotice.message }}
                            />
                        </div>
                    )}

                    {/* Dialog Footer */}
                    <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                            className="text-xs font-semibold gap-1.5 border-slate-300 dark:border-slate-700"
                        >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Print Notice</span>
                        </Button>
                        <Button
                            onClick={() => setViewNotice(null)}
                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold px-6 h-9 rounded-lg"
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
