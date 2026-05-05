"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
    Plus, Search, Eye, ChevronLeft, ChevronRight, 
    Pencil, Trash2, MonitorPlay, RefreshCw,
    Video, Calendar, Clock, User, ShieldCheck,
    Zap, ExternalLink, Info, MoreHorizontal, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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

interface GmeetMeeting {
    id: string;
    title: string;
    description: string;
    date_time: string;
    duration: number;
    created_by: string;
    status: string;
    creator?: { name: string; last_name: string; employee_id: string };
    total_join: number;
    meeting_url?: string;
}

export default function LiveMeetingPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [meetings, setMeetings] = useState<GmeetMeeting[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [totalEntries, setTotalEntries] = useState(0);

    // Form Criteria
    const [criteria, setCriteria] = useState<{ staff: any[] }>({ staff: [] });
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date_time: "",
        duration: 45,
        meeting_url: ""
    });

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchCriteria();
        fetchMeetings();
    }, [currentPage, itemsPerPage, searchTerm]);

    const fetchCriteria = async () => {
        try {
            const response = await api.get('/conference/gmeet-meetings/criteria');
            setCriteria(response.data);
        } catch (error) {
            console.error("Failed to fetch criteria");
        }
    };

    const fetchMeetings = async () => {
        setLoading(true);
        try {
            const response = await api.get('/conference/gmeet-meetings', {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage,
                    search: searchTerm
                }
            });
            setMeetings(response.data.data || []);
            setTotalEntries(response.data.total || 0);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch meetings", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title || !formData.date_time) {
            toast({ title: "Validation", description: "Required fields missing", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        const payload = { ...formData, created_by: criteria.staff[0]?.id || 1 };

        try {
            if (editMode && selectedId) {
                await api.put(`/conference/gmeet-meetings/${selectedId}`, payload);
                toast({ title: "Success", description: "G-Meet meeting updated" });
            } else {
                await api.post('/conference/gmeet-meetings', payload);
                toast({ title: "Success", description: "G-Meet meeting scheduled" });
            }
            setOpen(false);
            resetForm();
            fetchMeetings();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save meeting", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (item: GmeetMeeting) => {
        setEditMode(true);
        setSelectedId(item.id);
        setFormData({
            title: item.title,
            description: item.description || "",
            date_time: item.date_time.replace(' ', 'T').slice(0, 16),
            duration: item.duration,
            meeting_url: item.meeting_url || ""
        });
        setOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/conference/gmeet-meetings/${deleteId}`);
            toast({ title: "Success", description: "G-Meet meeting expunged" });
            fetchMeetings();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete meeting", variant: "destructive" });
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setEditMode(false);
        setSelectedId(null);
        setFormData({
            title: "",
            description: "",
            date_time: "",
            duration: 45,
            meeting_url: ""
        });
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await api.put(`/conference/gmeet-meetings/${id}`, { status: newStatus });
            toast({ title: "Success", description: "Status updated" });
            fetchMeetings();
        } catch (error) {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800">
                <CardHeader className="px-6 py-4 border-b border-muted/50 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-inner">
                            <Video className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg font-bold tracking-tight text-slate-700 uppercase">Live Meeting</CardTitle>
                    </div>
                    <Button 
                        onClick={() => { resetForm(); setOpen(true); }}
                        className="h-10 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        Add Meeting
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-4 flex items-center gap-4 border-b border-muted/20">
                        <div className="relative w-64">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Filter records..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-10 rounded-xl bg-white border-muted/50 focus-visible:ring-blue-500/20 text-xs font-bold uppercase tracking-widest shadow-none"
                            />
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">Temporal Density:</span>
                            <Select value={itemsPerPage.toString()} onValueChange={(val) => setItemsPerPage(parseInt(val))}>
                                <SelectTrigger className="h-9 w-20 text-[10px] font-bold bg-white border-muted/50 rounded-xl">
                                    <SelectValue placeholder="50" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-100">
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-muted/20 bg-muted/5">
                                    <TableHead className="font-bold text-slate-600 text-[10px] uppercase tracking-widest py-4 pl-6">Meeting Title</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-[10px] uppercase tracking-widest py-4">Description</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-[10px] uppercase tracking-widest py-4">Date Time</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-[10px] uppercase tracking-widest py-4 text-center">Duration</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-[10px] uppercase tracking-widest py-4">Created By</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-[10px] uppercase tracking-widest py-4">Status</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-[10px] uppercase tracking-widest py-4 pr-6 text-center">Protocol</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-48 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Syncing G-Meet Registry...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : meetings.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-gray-400 text-[11px] font-bold uppercase tracking-widest italic">
                                            No administrative sessions indexed.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    meetings.map((item, index) => (
                                        <TableRow key={item.id} className={cn(
                                            "hover:bg-blue-50/20 border-b border-muted/10 transition-colors group",
                                            index % 2 === 0 ? 'bg-white' : 'bg-muted/5'
                                        )}>
                                            <TableCell className="text-slate-700 text-xs py-4 pl-6 font-bold uppercase tracking-tight">{item.title}</TableCell>
                                            <TableCell className="text-slate-500 text-[10px] py-4 uppercase font-medium tracking-tighter truncate max-w-[200px]">{item.description || "Official session"}</TableCell>
                                            <TableCell className="text-slate-600 text-xs py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-500">{new Date(item.date_time).toLocaleDateString()}</span>
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{new Date(item.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center py-4">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.duration}m</span>
                                            </TableCell>
                                            <TableCell className="text-slate-700 text-[10px] py-4 font-bold uppercase tracking-tighter">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[9px] text-blue-600 font-bold uppercase">
                                                        {item.creator?.name?.[0]}{item.creator?.last_name?.[0]}
                                                    </div>
                                                    {item.creator ? `${item.creator.name} ${item.creator.last_name}` : "System Admin"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Select defaultValue={item.status || "awaited"} onValueChange={(val) => handleStatusChange(item.id, val)}>
                                                    <SelectTrigger className={cn(
                                                        "h-8 w-[100px] text-[10px] font-black uppercase tracking-widest bg-white border-muted/50 rounded-lg",
                                                        (item.status === 'awaited' || !item.status) && "text-orange-500 border-orange-100 bg-orange-50/50",
                                                        item.status === 'finished' && "text-emerald-500 border-emerald-100 bg-emerald-50/50",
                                                        item.status === 'cancelled' && "text-rose-500 border-rose-100 bg-rose-50/50"
                                                    )}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-gray-100">
                                                        <SelectItem value="awaited">Awaited</SelectItem>
                                                        <SelectItem value="finished">Finished</SelectItem>
                                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="pr-6 py-4">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 duration-300">
                                                    <Button size="icon" className="h-9 w-9 rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-200">
                                                        <MonitorPlay className="h-4.5 w-4.5" />
                                                    </Button>
                                                    <Button onClick={() => handleEdit(item)} size="icon" className="h-9 w-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button onClick={() => setDeleteId(item.id)} size="icon" className="h-9 w-9 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="p-4 border-t border-muted/20 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        <span>Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalEntries)} of {totalEntries} entries</span>
                        <div className="flex items-center gap-2">
                            <Button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                variant="outline" size="icon" className="h-9 w-9 rounded-xl border-muted/50 hover:bg-blue-50 hover:text-blue-600 transition-all"
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button size="icon" className="h-9 w-9 rounded-xl bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md font-bold">
                                {currentPage}
                            </Button>
                            <Button 
                                onClick={() => setCurrentPage(p => p + 1)}
                                variant="outline" size="icon" className="h-9 w-9 rounded-xl border-muted/50 hover:bg-blue-50 hover:text-blue-600 transition-all"
                                disabled={meetings.length < itemsPerPage}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="rounded-[2rem] border-0 shadow-2xl max-w-lg p-0 overflow-hidden bg-white">
                    <div className="bg-blue-500/5 p-8 border-b border-blue-100 flex items-center justify-between">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-gray-800 uppercase tracking-[0.2em] flex items-center gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                    <Video className="h-5 w-5" />
                                </div>
                                {editMode ? "Reschedule Session" : "Initiate Session"}
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="p-10 grid grid-cols-1 gap-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Session Title <span className="text-red-500">*</span></Label>
                            <Input 
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder="e.g. Technical Board Meeting"
                                className="h-14 border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-blue-500 shadow-none text-sm font-bold tracking-tight px-6" 
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Temporal Schedule <span className="text-red-500">*</span></Label>
                            <Input 
                                type="datetime-local"
                                value={formData.date_time}
                                onChange={(e) => setFormData({...formData, date_time: e.target.value})}
                                className="h-14 border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-blue-500 shadow-none px-6 text-sm font-bold" 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Duration (Min) <span className="text-red-500">*</span></Label>
                                <Input 
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                                    placeholder="45"
                                    className="h-14 border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-blue-500 shadow-none px-6 text-sm font-bold" 
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">G-Meet Join URL</Label>
                                <Input 
                                    value={formData.meeting_url}
                                    onChange={(e) => setFormData({...formData, meeting_url: e.target.value})}
                                    placeholder="meet.google.com/..."
                                    className="h-14 border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-blue-500 shadow-none px-6 text-sm font-bold" 
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Technical Agenda</Label>
                            <Textarea 
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Session coordination goals..."
                                className="min-h-[100px] border-gray-100 bg-gray-50/50 rounded-[2rem] focus:ring-blue-500 shadow-none p-6 text-sm resize-none" 
                            />
                        </div>
                    </div>

                    <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-4">
                        <Button variant="ghost" onClick={() => setOpen(false)} className="h-12 px-8 rounded-full text-[10px] font-bold uppercase tracking-widest">Discard</Button>
                        <Button 
                            onClick={handleSave} 
                            disabled={submitting}
                            className="btn-gradient text-white px-12 h-12 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full"
                        >
                            {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : editMode ? "Update Cycle" : "Commit Session"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-[2.5rem] border-0 shadow-2xl p-10">
                    <AlertDialogHeader>
                        <div className="h-16 w-16 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100 mb-6">
                            <ShieldCheck className="h-8 w-8 text-rose-400/50" />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black text-gray-800 uppercase tracking-tight">Expunge G-Meet Session</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-4">
                            Are you sure you want to permanently delete this virtual session? This action will invalidate all join protocols and analytical records associated with this indexed meeting.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-10 gap-4">
                        <AlertDialogCancel className="h-12 px-8 rounded-full text-[10px] font-bold uppercase tracking-widest border-gray-100">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-rose-500 hover:bg-rose-600 h-12 px-10 rounded-full text-[10px] font-bold uppercase tracking-widest border-0 shadow-xl shadow-rose-200">
                            Confirm Expunge
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
