"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Mail, Plus, Trash2, Pencil, X, Calendar, Megaphone, Code, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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

export default function NoticeBoardPage() {
    const { toast } = useToast();
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [viewNotice, setViewNotice] = useState<Notice | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [formData, setFormData] = useState({
        title: "",
        message: "",
        notice_date: format(new Date(), "yyyy-MM-dd"),
        publish_date: format(new Date(), "yyyy-MM-dd"),
        message_to: [] as string[],
        notify_to: [] as string[]
    });

    const [showHtml, setShowHtml] = useState(false);

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

    useEffect(() => {
        fetchNotices(1);
    }, []);

    const fetchNotices = async (page: number = currentPage) => {
        setLoading(true);
        try {
            const response = await api.get(`/communicate/notices?page=${page}`);
            const result = response.data?.data || response.data || [];
            setNotices(Array.isArray(result) ? result : []);
            setCurrentPage(response.data?.current_page || page);
            setLastPage(response.data?.last_page || 1);
            setTotal(response.data?.total || 0);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch notices", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const payload = {
                ...formData,
                message_to: formData.message_to.join(','),
                notify_to: formData.notify_to.join(',')
            };
            if (editMode && selectedId) {
                await api.put(`/communicate/notices/${selectedId}`, payload);
                toast({ title: "Success", description: "Notice updated successfully" });
            } else {
                await api.post('/communicate/notices', payload);
                toast({ title: "Success", description: "Notice posted successfully" });
            }
            setIsDialogOpen(false);
            resetForm();
            fetchNotices(1);
        } catch (error) {
            toast({ title: "Error", description: "Failed to save notice", variant: "destructive" });
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            message: "",
            notice_date: format(new Date(), "yyyy-MM-dd"),
            publish_date: format(new Date(), "yyyy-MM-dd"),
            message_to: [],
            notify_to: []
        });
        setEditMode(false);
        setSelectedId(null);
    };

    const handleEdit = (notice: Notice) => {
        setFormData({
            title: notice.title,
            message: notice.message,
            notice_date: notice.notice_date ? notice.notice_date.substring(0, 10) : '',
            publish_date: notice.publish_date ? notice.publish_date.substring(0, 10) : '',
            message_to: notice.message_to ? notice.message_to.split(',') : [],
            notify_to: notice.notify_to ? notice.notify_to.split(',') : []
        });
        setSelectedId(notice.id);
        setEditMode(true);
        setIsDialogOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/communicate/notices/${deleteId}`);
            toast({ title: "Success", description: "Notice deleted successfully" });
            fetchNotices(1);
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete notice", variant: "destructive" });
        } finally {
            setDeleteId(null);
        }
    };

    const executeDeleteAll = async () => {
        try {
            if (selectedIds.size > 0) {
                await api.delete('/communicate/notices/destroy-all', { data: { ids: Array.from(selectedIds) } });
                toast({ title: "Success", description: `${selectedIds.size} notice(s) deleted` });
                setSelectedIds(new Set());
            } else {
                await api.delete('/communicate/notices/destroy-all');
                toast({ title: "Success", description: "Notice board cleared" });
            }
            fetchNotices(1);
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete notices", variant: "destructive" });
        } finally {
            setDeleteAllConfirm(false);
        }
    };

    const toggleMessageTo = (role: string) => {
        setFormData(prev => ({
            ...prev,
            message_to: prev.message_to.includes(role)
                ? prev.message_to.filter(r => r !== role)
                : [...prev.message_to, role]
        }));
    };

    const toggleNotifyTo = (channel: string) => {
        setFormData(prev => ({
            ...prev,
            notify_to: prev.notify_to.includes(channel)
                ? prev.notify_to.filter(c => c !== channel)
                : [...prev.notify_to, channel]
        }));
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === notices.length && notices.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(notices.map(n => n.id)));
        }
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
             {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <Megaphone className="h-5 w-5 text-indigo-500" />
                    </div>
                    <h1 className="text-lg font-bold text-gray-800 tracking-tight uppercase">Notice Board</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="btn-gradient gap-2 h-9 px-6 text-[10px] font-bold uppercase transition-all rounded-full shadow-lg shadow-indigo-100">
                        <Plus className="h-4 w-4" /> New Notice
                    </Button>
                </div>
            </div>

             {/* Notice List Container */}
            <div className="flex items-center justify-between px-1 py-2 mb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox 
                        checked={notices.length > 0 && selectedIds.size === notices.length}
                        onCheckedChange={toggleSelectAll}
                        className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                    />
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select All"}
                    </span>
                </label>
                {selectedIds.size > 0 && (
                    <Button
                        onClick={() => setDeleteAllConfirm(true)}
                        className="h-8 px-4 text-[10px] font-bold uppercase bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-sm transition-all gap-1.5"
                    >
                        <Trash2 className="h-3.5 w-3.5" /> Delete Selected
                    </Button>
                )}
            </div>
            <div className="space-y-3 min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-gray-400 space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                        <p className="text-[11px] font-medium uppercase tracking-widest">Loading Notices...</p>
                    </div>
                ) : notices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-gray-300 space-y-4">
                        <Mail className="h-16 w-16 opacity-20" />
                        <div className="text-center">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-tight">Notice Board is empty</p>
                            <p className="text-[10px] text-gray-400">Post a new message to get started</p>
                        </div>
                    </div>
                ) : (
                    notices.map((notice) => {
                        const messageTo = notice.message_to ? notice.message_to.split(',').map(s => s.trim()).filter(Boolean) : [];
                        const notifyTo = notice.notify_to ? notice.notify_to.split(',').map(s => s.trim()).filter(Boolean) : [];
                        return (
                        <div
                            key={notice.id}
                            className="p-4 group rounded-lg border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 bg-white"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <Checkbox 
                                        checked={selectedIds.has(notice.id)}
                                        onCheckedChange={() => toggleSelect(notice.id)}
                                        className="mt-1.5 border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 shrink-0"
                                    />
                                    <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                                        <Mail className="h-4 w-4 text-indigo-500" />
                                    </div>
                                    <div className="space-y-1.5 flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm text-black font-bold uppercase tracking-tight">
                                                {notice.title}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-400 font-medium">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                Notice: {format(new Date(notice.notice_date), 'dd/MM/yyyy')}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                Publish: {format(new Date(notice.publish_date), 'dd/MM/yyyy')}
                                            </div>
                                            <span className="h-3 w-px bg-gray-200" />
                                            <span className={cn(
                                                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
                                                notice.is_published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                            )}>
                                                {notice.is_published ? "Published" : "Pending"}
                                            </span>
                                            {messageTo.map((to, i) => (
                                                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-semibold">
                                                    {to}
                                                </span>
                                            ))}
                                            {notifyTo.map((ch, i) => (
                                                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 text-[10px] font-semibold">
                                                    {ch}
                                                </span>
                                            ))}
                                        </div>

                                        <p className="text-xs text-gray-700 leading-relaxed">
                                            {notice.message.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    <Button size="icon" variant="ghost" onClick={() => setViewNotice(notice)} className="h-7 w-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition-all shadow-sm">
                                        <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => handleEdit(notice)} className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-all shadow-sm">
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(notice.id)} className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-md transition-all shadow-sm">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                        );
                    })
                )}
            </div>

            {total > 20 && (
                <div className="flex items-center justify-between pt-2">
                    <p className="text-[11px] text-gray-400 font-medium">
                        Showing {(currentPage - 1) * 20 + 1}-{Math.min(currentPage * 20, total)} of {total} notices
                    </p>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => fetchNotices(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className="px-3 py-1.5 text-[11px] font-bold uppercase rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Prev
                        </button>
                        {Array.from({ length: lastPage }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => fetchNotices(p)}
                                className={cn(
                                    "w-8 h-8 text-[11px] font-bold rounded-lg transition-all",
                                    p === currentPage
                                        ? "bg-indigo-500 text-white shadow-md"
                                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                                )}
                            >
                                {p}
                            </button>
                        ))}
                        <button
                            onClick={() => fetchNotices(currentPage + 1)}
                            disabled={currentPage >= lastPage}
                            className="px-3 py-1.5 text-[11px] font-bold uppercase rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Post/Edit Notice Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 rounded-lg border-none shadow-2xl">
                    <div className="bg-indigo-600 p-6 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold tracking-tight uppercase flex items-center gap-2">
                                <Megaphone className="h-5 w-5" />
                                {editMode ? "Edit Notice" : "New Notice"}
                            </DialogTitle>
                            <p className="text-indigo-100 text-[11px] font-medium uppercase tracking-widest mt-1">Broadcast information to the school community</p>
                        </DialogHeader>
                    </div>
                    
                    <div className="p-8 space-y-6 bg-white overflow-y-auto max-h-[60vh]">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Title <span className="text-red-500">*</span></Label>
                            <Input 
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Annual Sports Day 2026"
                                className="h-11 border-gray-100 bg-gray-50/30 text-sm shadow-none focus-visible:ring-indigo-500 rounded-lg"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Notice Date <span className="text-red-500">*</span></Label>
                                <Input 
                                    type="date"
                                    value={formData.notice_date}
                                    onChange={(e) => setFormData({ ...formData, notice_date: e.target.value })}
                                    className="h-11 border-gray-100 bg-gray-50/30 text-sm shadow-none focus-visible:ring-indigo-500 rounded-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Publish Date <span className="text-red-500">*</span></Label>
                                <Input 
                                    type="date"
                                    value={formData.publish_date}
                                    onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                                    className="h-11 border-gray-100 bg-gray-50/30 text-sm shadow-none focus-visible:ring-indigo-500 rounded-lg"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Message To</Label>
                            <div className="flex flex-wrap gap-4 pt-1">
                                {['Student', 'Parent', 'Staff'].map((role) => (
                                    <label key={role} className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full hover:bg-indigo-50 transition-colors cursor-pointer group">
                                        <Checkbox 
                                            checked={formData.message_to.includes(role.toLowerCase())}
                                            onCheckedChange={() => toggleMessageTo(role.toLowerCase())}
                                            className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                                        />
                                        <span className="text-[11px] font-bold text-gray-600 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{role}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Notify To</Label>
                            <div className="flex flex-wrap gap-4 pt-1">
                                {['Email', 'SMS', 'WhatsApp', 'Notification'].map((ch) => (
                                    <label key={ch} className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full hover:bg-orange-50 transition-colors cursor-pointer group">
                                        <Checkbox 
                                            checked={formData.notify_to.includes(ch.toLowerCase())}
                                            onCheckedChange={() => toggleNotifyTo(ch.toLowerCase())}
                                            className="border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                                        />
                                        <span className="text-[11px] font-bold text-gray-600 group-hover:text-orange-600 transition-colors uppercase tracking-tight">{ch}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Message <span className="text-red-500">*</span></Label>
                                <button 
                                    type="button"
                                    onClick={() => setShowHtml(!showHtml)}
                                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-indigo-600 transition-colors uppercase tracking-wider"
                                >
                                    <Code className="h-3 w-3" />
                                    {showHtml ? "Visual" : "HTML"}
                                </button>
                            </div>
                            {showHtml ? (
                                <Textarea 
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="Write the notice content here..."
                                    className="border-gray-100 bg-gray-50/30 text-sm shadow-none min-h-[200px] focus-visible:ring-indigo-500 leading-relaxed rounded-lg p-4 font-mono"
                                />
                            ) : (
                                <div className="border border-gray-100 rounded-lg overflow-hidden [&_.ql-toolbar]:border-gray-100 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-sm [&_.ql-editor]:leading-relaxed">
                                    <ReactQuill 
                                        value={formData.message}
                                        onChange={(value) => setFormData({ ...formData, message: value })}
                                        modules={quillModules}
                                        theme="snow"
                                        placeholder="Write the notice content here..."
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                        <DialogFooter className="gap-3">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-10 text-[10px] uppercase font-bold rounded-full px-8 bg-white border-gray-200">Cancel</Button>
                            <Button onClick={handleSave} className="btn-gradient h-10 px-10 text-[10px] uppercase font-bold rounded-full shadow-xl shadow-indigo-100">
                                {editMode ? "Update Notice" : "Publish Notice"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* View Notice Dialog */}
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
                                <span className={cn(
                                    "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold",
                                    viewNotice.is_published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                )}>
                                    {viewNotice.is_published ? "Published" : "Pending"}
                                </span>
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

            {/* Single Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-lg border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">Delete Notice</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            Are you sure you want to delete this notice? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-10 rounded-lg text-[10px] font-bold uppercase tracking-wider border-gray-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-red-500 hover:bg-red-600 h-10 rounded-lg text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            Yes, Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete All Confirmation Dialog */}
            <AlertDialog open={deleteAllConfirm} onOpenChange={setDeleteAllConfirm}>
                <AlertDialogContent className="rounded-lg border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800 text-red-500">
                            {selectedIds.size > 0 ? "Delete Selected Notices" : "Clear Notice Board"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            {selectedIds.size > 0
                                ? `Are you sure you want to delete ${selectedIds.size} selected notice(s)? This action cannot be undone.`
                                : "Are you absolutely sure you want to clear the entire notice board? This action is permanent and will delete all notices."
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-10 rounded-lg text-[10px] font-bold uppercase tracking-wider border-gray-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDeleteAll} className="bg-red-500 hover:bg-red-600 h-10 rounded-lg text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            Yes, Clear All
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
