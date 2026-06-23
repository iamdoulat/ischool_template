"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import {
    Megaphone, X, Calendar, Users, Loader2, ChevronLeft, ChevronRight,
    Search, Send, Bell, ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

type Notice = {
    id: number;
    title: string;
    message: string;
    publish_date: string;
    notice_date: string;
    is_published: boolean;
    message_to: string | null;
    notify_to: string | null;
};

// Accent palette cycled per card (border + icon tint)
const ACCENTS = [
    { bar: "bg-indigo-500", icon: "text-indigo-600", soft: "bg-indigo-50" },
    { bar: "bg-sky-500", icon: "text-sky-600", soft: "bg-sky-50" },
    { bar: "bg-emerald-500", icon: "text-emerald-600", soft: "bg-emerald-50" },
    { bar: "bg-amber-500", icon: "text-amber-600", soft: "bg-amber-50" },
    { bar: "bg-rose-500", icon: "text-rose-600", soft: "bg-rose-50" },
    { bar: "bg-violet-500", icon: "text-violet-600", soft: "bg-violet-50" },
];

const PER_PAGE = 12;

const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";

/** Strip HTML tags to a plain-text preview snippet. */
const toPreview = (html: string) => {
    if (!html) return "";
    if (typeof window === "undefined") return html.replace(/<[^>]+>/g, " ");
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || "").replace(/\s+/g, " ").trim();
};

const splitTo = (s: string | null) =>
    s ? s.split(",").map((x) => x.trim()).filter(Boolean) : [];

export default function UserNoticeBoardPage() {
    const { t } = useTranslation();
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Notice | null>(null);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        const fetchNotices = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/communicate/notices?per_page=${PER_PAGE}&page=${page}`);
                const raw = response.data;
                const items: Notice[] = raw?.data ?? raw ?? [];
                setNotices(items.filter((n: Notice) => n.is_published));
                setLastPage(raw?.last_page ?? 1);
                setTotal(raw?.total ?? items.length);
            } catch {
                toast({ variant: "destructive", title: t("error"), description: t("failed_to_load_notices") });
            } finally {
                setLoading(false);
            }
        };
        fetchNotices();
    }, [page, toast]);

    // Close modal on Escape
    useEffect(() => {
        if (!selected) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [selected]);

    const visible = useMemo(() => {
        const term = searchTerm.toLowerCase();
        if (!term) return notices;
        return notices.filter(
            (n) =>
                n.title.toLowerCase().includes(term) ||
                toPreview(n.message).toLowerCase().includes(term)
        );
    }, [notices, searchTerm]);

    return (
        <div className="p-4 lg:p-6 animate-in fade-in duration-500">
            <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden p-0 gap-0">
                {/* ── Header ── */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Megaphone className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-[16px] font-bold text-gray-800 tracking-tight leading-none truncate">{t("notice_board")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {loading ? `${t("loading")}…` : `${total} ${total === 1 ? t("published_notice") : t("published_notices")}`}
                            </p>
                        </div>
                    </div>
                    <div className="relative w-40 sm:w-64 shrink-0">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <Input
                            placeholder={t("search_notices")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 h-9 text-sm rounded-[10px] bg-white"
                        />
                    </div>
                </div>

                <CardContent className="p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span>{t("loading_notices")}</span>
                        </div>
                    ) : visible.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Bell className="h-12 w-12 opacity-30 mb-3" />
                            <p className="text-base font-medium text-gray-500">
                                {searchTerm ? t("no_matching_notices") : t("no_notices_available")}
                            </p>
                            <p className="text-sm mt-1">
                                {searchTerm ? t("try_a_different_search_term") : t("new_announcements_will_appear_here")}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {visible.map((notice, index) => {
                                const accent = ACCENTS[index % ACCENTS.length];
                                const recipients = [...splitTo(notice.message_to), ...splitTo(notice.notify_to)];
                                const preview = toPreview(notice.message);
                                return (
                                    <button
                                        key={notice.id}
                                        onClick={() => setSelected(notice)}
                                        className="group relative text-left rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col"
                                    >
                                        <span className={cn("absolute left-0 top-0 h-full w-1", accent.bar)} />
                                        <div className="p-4 pl-5 flex-1 flex flex-col">
                                            <div className="flex items-start gap-2.5">
                                                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", accent.soft)}>
                                                    <Megaphone className={cn("h-4 w-4", accent.icon)} />
                                                </span>
                                                <h3 className="text-[14px] font-bold text-gray-800 leading-snug line-clamp-2 group-hover:text-[#6366F1] transition-colors">
                                                    {notice.title}
                                                </h3>
                                            </div>

                                            {preview && (
                                                <p className="text-[12px] text-gray-500 mt-2.5 line-clamp-3 leading-relaxed flex-1">
                                                    {preview}
                                                </p>
                                            )}

                                            {recipients.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-3">
                                                    {recipients.slice(0, 3).map((r, i) => (
                                                        <span key={i} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">
                                                            {r}
                                                        </span>
                                                    ))}
                                                    {recipients.length > 3 && (
                                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">
                                                            +{recipients.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between gap-2 px-4 pl-5 py-2.5 border-t border-gray-100 bg-gray-50/50">
                                            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(notice.notice_date || notice.publish_date)}
                                            </span>
                                            <span className="flex items-center gap-1 text-[11px] font-semibold text-[#6366F1] opacity-0 group-hover:opacity-100 transition-opacity">
                                                {t("read")} <ArrowRight className="h-3 w-3" />
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && total > 0 && lastPage > 1 && (
                        <div className="flex items-center justify-between gap-3 mt-5">
                            <span className="text-[12px] text-gray-500">
                                {t("page")} {page} {t("of")} {lastPage} · {total} {total === 1 ? t("notice") : t("notices")}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <Button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="h-8 px-3 gap-1 text-[12px] rounded-[10px] text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 disabled:opacity-40 transition-opacity"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" /> {t("prev")}
                                </Button>
                                <Button
                                    onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                                    disabled={page >= lastPage}
                                    className="h-8 px-3 gap-1 text-[12px] rounded-[10px] text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 disabled:opacity-40 transition-opacity"
                                >
                                    {t("next")} <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detail Modal */}
            {selected && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200"
                    onClick={() => setSelected(null)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#FF9800]/10 to-[#6366F1]/10">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] shrink-0">
                                    <Megaphone className="h-5 w-5 text-white" />
                                </div>
                                <h2 className="text-[16px] font-bold text-gray-800 leading-snug">
                                    {selected.title}
                                </h2>
                            </div>
                            <button
                                onClick={() => setSelected(null)}
                                className="shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Meta */}
                        <div className="flex flex-wrap gap-x-4 gap-y-2 px-5 pt-4 pb-1 text-[12px] text-gray-500">
                            {selected.notice_date && (
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{t("notice_date")}: <span className="font-medium text-gray-700">{formatDate(selected.notice_date)}</span></span>
                                </div>
                            )}
                            {selected.publish_date && (
                                <div className="flex items-center gap-1.5">
                                    <Send className="h-3.5 w-3.5" />
                                    <span>{t("published")}: <span className="font-medium text-gray-700">{formatDate(selected.publish_date)}</span></span>
                                </div>
                            )}
                            {(selected.notify_to || selected.message_to) && (
                                <div className="flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>{t("to")}: <span className="font-medium text-gray-700 capitalize">{selected.notify_to || selected.message_to}</span></span>
                                </div>
                            )}
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            <div
                                className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-headings:font-bold prose-a:text-indigo-600 prose-img:max-w-full prose-img:h-auto prose-img:rounded-lg prose-table:w-full prose-pre:overflow-x-auto break-words"
                                dangerouslySetInnerHTML={{ __html: selected.message }}
                            />
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
                            <Button
                                onClick={() => setSelected(null)}
                                className="h-9 px-4 text-[13px] rounded-[10px] text-white bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 transition-opacity"
                            >
                                {t("close")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
