"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Calendar, Mail, Loader2, Eye, X } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Notice {
    id: number;
    title: string;
    message: string;
    notice_date: string;
    publish_date: string;
    message_to: string | null;
    notify_to: string | null;
    is_published?: boolean;
}

export function NoticeBoardSection() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewNotice, setViewNotice] = useState<Notice | null>(null);

    useEffect(() => {
        const fetchNotices = async () => {
            try {
                const response = await api.get('/communicate/notices');
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (notices.length === 0) {
        return (
            <div className="text-center py-20 text-gray-400">
                <Mail className="h-16 w-16 mx-auto opacity-20 mb-4" />
                <p className="text-lg font-bold uppercase tracking-tight">No notices available</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {notices.map((notice) => {
                    const messageTo = notice.message_to ? notice.message_to.split(',').map(s => s.trim()).filter(Boolean) : [];
                    const notifyTo = notice.notify_to ? notice.notify_to.split(',').map(s => s.trim()).filter(Boolean) : [];
                    return (
                        <div
                            key={notice.id}
                            className="p-6 rounded-lg border border-gray-200 shadow-sm bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                            onClick={() => setViewNotice(notice)}
                        >
                            <div className="space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                    <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">
                                        {notice.title}
                                    </h3>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setViewNotice(notice); }}
                                        className="shrink-0 p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-4 w-4" />
                                        {format(new Date(notice.notice_date), 'dd/MM/yyyy')}
                                    </div>
                                    {notice.is_published !== undefined && (
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                            notice.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {notice.is_published ? 'Published' : 'Pending'}
                                        </span>
                                    )}
                                    {messageTo.map((to, i) => (
                                        <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-xs font-semibold">
                                            {to}
                                        </span>
                                    ))}
                                    {notifyTo.map((ch, i) => (
                                        <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-orange-100 text-orange-700 text-xs font-semibold">
                                            {ch}
                                        </span>
                                    ))}
                                </div>

                                <div className="text-gray-700 leading-relaxed">
                                    {notice.message.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Dialog open={!!viewNotice} onOpenChange={(open) => !open && setViewNotice(null)}>
                <DialogContent className="sm:max-w-[700px] p-0 rounded-lg border-none shadow-2xl">
                    <div className="bg-emerald-600 p-6 text-white flex items-center justify-between">
                        <DialogHeader className="p-0">
                            <DialogTitle className="text-xl font-bold tracking-tight uppercase flex items-center gap-2">
                                <Eye className="h-5 w-5" />
                                {viewNotice?.title}
                            </DialogTitle>
                        </DialogHeader>
                        <button onClick={() => setViewNotice(null)} className="text-white/80 hover:text-white transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    {viewNotice && (
                        <div className="p-8 space-y-6 bg-white overflow-y-auto max-h-[65vh]">
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    Notice: {format(new Date(viewNotice.notice_date), 'dd/MM/yyyy')}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    Publish: {format(new Date(viewNotice.publish_date), 'dd/MM/yyyy')}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {viewNotice.is_published !== undefined && (
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                        viewNotice.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {viewNotice.is_published ? 'Published' : 'Pending'}
                                    </span>
                                )}
                                {(viewNotice.message_to ? viewNotice.message_to.split(',').map(s => s.trim()).filter(Boolean) : []).map((to, i) => (
                                    <span key={i} className="inline-flex items-center px-3 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs font-semibold">
                                        {to}
                                    </span>
                                ))}
                                {(viewNotice.notify_to ? viewNotice.notify_to.split(',').map(s => s.trim()).filter(Boolean) : []).map((ch, i) => (
                                    <span key={i} className="inline-flex items-center px-3 py-1 rounded-md bg-orange-100 text-orange-700 text-xs font-semibold">
                                        {ch}
                                    </span>
                                ))}
                            </div>

                            <div className="border-t border-gray-100 pt-6">
                                <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-headings:font-bold prose-a:text-indigo-600 prose-img:max-w-full prose-img:h-auto prose-table:w-full prose-pre:overflow-x-auto"
                                    dangerouslySetInnerHTML={{ __html: viewNotice.message }}
                                />
                            </div>
                        </div>
                    )}
                    <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setViewNotice(null)} className="h-10 text-[10px] uppercase font-bold rounded-full px-8 bg-white border-gray-200">
                                Close
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
