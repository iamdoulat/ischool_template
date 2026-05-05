"use client";

import { useState, useEffect } from "react";
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
import { Mail, Plus, Trash2, Pencil, X, Calendar, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Notice {
    id: number;
    title: string;
    message: string;
    notice_date: string;
    publish_date: string;
    message_to: string | null;
}

export default function NoticeBoardPage() {
    const { toast } = useToast();
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        message: "",
        notice_date: format(new Date(), "yyyy-MM-dd"),
        publish_date: format(new Date(), "yyyy-MM-dd"),
        message_to: [] as string[]
    });

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        setLoading(true);
        try {
            const response = await api.get('/communicate/notices');
            setNotices(response.data);
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
                message_to: formData.message_to.join(',')
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
            fetchNotices();
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
            message_to: []
        });
        setEditMode(false);
        setSelectedId(null);
    };

    const handleEdit = (notice: Notice) => {
        setFormData({
            title: notice.title,
            message: notice.message,
            notice_date: notice.notice_date,
            publish_date: notice.publish_date,
            message_to: notice.message_to ? notice.message_to.split(',') : []
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
            fetchNotices();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete notice", variant: "destructive" });
        } finally {
            setDeleteId(null);
        }
    };

    const executeDeleteAll = async () => {
        try {
            await api.delete('/communicate/notices/destroy-all');
            toast({ title: "Success", description: "Notice board cleared" });
            fetchNotices();
        } catch (error) {
            toast({ title: "Error", description: "Failed to clear notice board", variant: "destructive" });
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

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
             {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-xl">
                        <Megaphone className="h-5 w-5 text-indigo-500" />
                    </div>
                    <h1 className="text-lg font-bold text-gray-800 tracking-tight uppercase">Notice Board</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="btn-gradient gap-2 h-9 px-6 text-[10px] font-bold uppercase transition-all rounded-full shadow-lg shadow-indigo-100">
                        <Plus className="h-4 w-4" /> Post New Message
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={() => setDeleteAllConfirm(true)}
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 gap-2 h-9 px-6 text-[10px] font-bold uppercase transition-all rounded-full border border-rose-100"
                    >
                        <Trash2 className="h-4 w-4" /> Delete All
                    </Button>
                </div>
            </div>

             {/* Notice List Container */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
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
                    notices.map((notice, index) => (
                        <div
                            key={notice.id}
                            className={cn(
                                "flex items-center justify-between p-4 group hover:bg-indigo-50/20 transition-all duration-300",
                                index !== notices.length - 1 && "border-b border-gray-50"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Mail className="h-4 w-4 text-indigo-500" />
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-sm text-gray-800 font-bold hover:text-indigo-600 transition-colors cursor-pointer block uppercase tracking-tight">
                                        {notice.title}
                                    </span>
                                    <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(notice.notice_date), 'dd/MM/yyyy')}
                                        </div>
                                        {notice.message_to && (
                                            <div className="flex items-center gap-1.5 uppercase tracking-tighter">
                                                <span className="h-1 w-1 rounded-full bg-gray-300" />
                                                To: {notice.message_to}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                <Button size="icon" variant="ghost" onClick={() => handleEdit(notice)} className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-all shadow-sm">
                                    <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => setDeleteId(notice.id)} className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-md transition-all shadow-sm">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Post/Edit Notice Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                    <div className="bg-indigo-600 p-6 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold tracking-tight uppercase flex items-center gap-2">
                                <Megaphone className="h-5 w-5" />
                                {editMode ? "Edit Notice" : "Post New Message"}
                            </DialogTitle>
                            <p className="text-indigo-100 text-[11px] font-medium uppercase tracking-widest mt-1">Broadcast information to the school community</p>
                        </DialogHeader>
                    </div>
                    
                    <div className="p-8 space-y-6 bg-white">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Title <span className="text-red-500">*</span></Label>
                            <Input 
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Annual Sports Day 2026"
                                className="h-11 border-gray-100 bg-gray-50/30 text-sm shadow-none focus-visible:ring-indigo-500 rounded-xl"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Notice Date <span className="text-red-500">*</span></Label>
                                <Input 
                                    type="date"
                                    value={formData.notice_date}
                                    onChange={(e) => setFormData({ ...formData, notice_date: e.target.value })}
                                    className="h-11 border-gray-100 bg-gray-50/30 text-sm shadow-none focus-visible:ring-indigo-500 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Publish Date <span className="text-red-500">*</span></Label>
                                <Input 
                                    type="date"
                                    value={formData.publish_date}
                                    onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                                    className="h-11 border-gray-100 bg-gray-50/30 text-sm shadow-none focus-visible:ring-indigo-500 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Message To</Label>
                            <div className="flex flex-wrap gap-4 pt-1">
                                {['Student', 'Parent', 'Staff'].map((role) => (
                                    <div key={role} className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full hover:bg-indigo-50 transition-colors cursor-pointer group" onClick={() => toggleMessageTo(role.toLowerCase())}>
                                        <Checkbox 
                                            id={role} 
                                            checked={formData.message_to.includes(role.toLowerCase())}
                                            onCheckedChange={() => toggleMessageTo(role.toLowerCase())}
                                            className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                                        />
                                        <label htmlFor={role} className="text-[11px] font-bold text-gray-600 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{role}</label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Message <span className="text-red-500">*</span></Label>
                            <Textarea 
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                placeholder="Write the notice content here..."
                                className="border-gray-100 bg-gray-50/30 text-sm shadow-none min-h-[150px] focus-visible:ring-indigo-500 leading-relaxed rounded-2xl p-4"
                            />
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

            {/* Single Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">Delete Notice</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            Are you sure you want to delete this notice? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-10 rounded-xl text-[10px] font-bold uppercase tracking-wider border-gray-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-red-500 hover:bg-red-600 h-10 rounded-xl text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            Yes, Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete All Confirmation Dialog */}
            <AlertDialog open={deleteAllConfirm} onOpenChange={setDeleteAllConfirm}>
                <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800 text-red-500">Clear Notice Board</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            Are you absolutely sure you want to clear the entire notice board? This action is permanent and will delete all notices.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="h-10 rounded-xl text-[10px] font-bold uppercase tracking-wider border-gray-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDeleteAll} className="bg-red-500 hover:bg-red-600 h-10 rounded-xl text-[10px] font-bold uppercase tracking-wider border-0 shadow-md">
                            Yes, Clear All
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
