"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    Search, Plus, Video, Copy, FileSpreadsheet, FileText, Printer, 
    Columns, ChevronLeft, ChevronRight, X, CheckSquare,
    VideoIcon, Calendar, Clock, User, Layers, ShieldCheck,
    Zap, MonitorPlay, ExternalLink, Pencil, Trash2,
    CheckCircle2, AlertCircle, Info, MoreHorizontal, Users, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
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

interface LiveMeeting {
    id: string;
    title: string;
    description: string;
    date_time: string;
    duration: number;
    api_used: string;
    created_by: string;
    status: string;
    creator?: { name: string; last_name: string; employee_id: string };
    total_join: number;
}

export default function LiveMeetingPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [meetings, setMeetings] = useState<LiveMeeting[]>([]);
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
        api_used: "Global"
    });

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchCriteria();
        fetchMeetings();
    }, [currentPage, itemsPerPage, searchTerm]);

    const fetchCriteria = async () => {
        try {
            const response = await api.get('/conference/live-meetings/criteria');
            setCriteria(response.data);
        } catch (error) {
            console.error("Failed to fetch criteria");
        }
    };

    const fetchMeetings = async () => {
        setLoading(true);
        try {
            const response = await api.get('/conference/live-meetings', {
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
        // Default to admin user id for meeting creator - in a real app this comes from auth context
        const payload = { ...formData, created_by: criteria.staff[0]?.id || 1 };

        try {
            if (editMode && selectedId) {
                await api.put(`/conference/live-meetings/${selectedId}`, payload);
                toast({ title: "Success", description: "Live meeting updated" });
            } else {
                await api.post('/conference/live-meetings', payload);
                toast({ title: "Success", description: "Live meeting scheduled" });
            }
            setOpen(false);
            resetForm();
            fetchMeetings();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save live meeting", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (item: LiveMeeting) => {
        setEditMode(true);
        setSelectedId(item.id);
        setFormData({
            title: item.title,
            description: item.description || "",
            date_time: item.date_time.replace(' ', 'T').slice(0, 16),
            duration: item.duration,
            api_used: item.api_used
        });
        setOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/conference/live-meetings/${deleteId}`);
            toast({ title: "Success", description: "Live meeting expunged" });
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
            api_used: "Global"
        });
    };

    return (
        <div className="space-y-6 font-sans p-4 bg-gray-50/10 min-h-screen">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                        <Users className="h-6 w-6 text-indigo-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
                            Institutional Live Meetings
                        </h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Coordination of administrative & staff virtual gatherings</p>
                    </div>
                </div>
                <Button 
                    onClick={() => { resetForm(); setOpen(true); }}
                    className="btn-gradient text-white px-8 h-11 text-[11px] font-bold uppercase shadow-xl shadow-orange-200/50 transition-all rounded-full flex gap-2"
                >
                    <Plus className="h-4 w-4" /> Schedule Meeting
                </Button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Filter meeting titles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-12 text-[11px] border-gray-100 bg-gray-50/30 rounded-xl focus:ring-indigo-500 shadow-none uppercase font-bold tracking-widest"
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Temporal Density:</span>
                        <Select value={itemsPerPage.toString()} onValueChange={(val) => setItemsPerPage(parseInt(val))}>
                            <SelectTrigger className="w-[110px] h-10 border-gray-100 bg-gray-50/30 text-[10px] font-bold uppercase rounded-xl shadow-none">
                                <SelectValue placeholder="50" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10 Sessions</SelectItem>
                                <SelectItem value="25">25 Sessions</SelectItem>
                                <SelectItem value="50">50 Sessions</SelectItem>
                                <SelectItem value="100">100 Sessions</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1 text-gray-400">
                            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-xl"><Copy className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-xl"><FileSpreadsheet className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-indigo-50 hover:text-indigo-600 transition-all rounded-xl"><Printer className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-50 overflow-hidden shadow-sm overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50/50 text-[10px] uppercase font-bold text-gray-600">
                            <TableRow className="hover:bg-transparent border-gray-50">
                                <TableHead className="py-5 px-6 min-w-[250px]">Meeting Dimension</TableHead>
                                <TableHead className="py-5 px-6 min-w-[180px]">Temporal Schedule</TableHead>
                                <TableHead className="py-5 px-6 text-center">Duration</TableHead>
                                <TableHead className="py-5 px-6 text-center">Protocol</TableHead>
                                <TableHead className="py-5 px-6 min-w-[180px]">Initiated By</TableHead>
                                <TableHead className="py-5 px-6 text-center">Status</TableHead>
                                <TableHead className="py-5 px-6 text-right min-w-[150px]">Protocol Utility</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Syncing Meeting Registry...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : meetings.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-gray-400 text-[11px] font-bold uppercase tracking-widest italic">
                                        No administrative meetings indexed.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                meetings.map((item) => (
                                    <TableRow key={item.id} className="text-[13px] text-gray-600 hover:bg-gray-50/30 group border-b last:border-0 border-gray-50 transition-colors">
                                        <TableCell className="py-5 px-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-indigo-700 uppercase tracking-tight">{item.title}</span>
                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter truncate max-w-[250px]">{item.description || "Administrative session"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 px-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] font-bold text-gray-500 flex items-center gap-2 uppercase tracking-tighter">
                                                    <Calendar className="h-3.5 w-3.5 text-indigo-500" /> {new Date(item.date_time).toLocaleDateString()}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-5 flex items-center gap-2">
                                                    <Clock className="h-3 w-3" /> {new Date(item.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 px-6 text-center">
                                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{item.duration}m</span>
                                        </TableCell>
                                        <TableCell className="py-5 px-6 text-center">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full font-bold text-[9px] border uppercase tracking-widest",
                                                item.api_used === 'Global' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-purple-50 text-purple-600 border-purple-100"
                                            )}>
                                                {item.api_used}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-5 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                                    {item.creator?.name?.[0]}{item.creator?.last_name?.[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">{item.creator ? `${item.creator.name} ${item.creator.last_name}` : "System Admin"}</span>
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Ref: {item.creator?.employee_id || "System"}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 px-6 text-center">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full font-bold text-[9px] border uppercase tracking-widest",
                                                item.status === 'finished' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                                                item.status === 'cancelled' ? "bg-rose-50 text-rose-600 border-rose-100" : 
                                                "bg-indigo-50 text-indigo-600 border-indigo-100"
                                            )}>
                                                {item.status || "Awaited"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-5 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                <Button size="icon" variant="ghost" className="h-9 w-9 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100" title="Join Protocol">
                                                    <MonitorPlay className="h-4.5 w-4.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => handleEdit(item)} className="h-9 w-9 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => setDeleteId(item.id)} className="h-9 w-9 bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-100">
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

                <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold pt-4 uppercase tracking-tight">
                    <div>
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalEntries)} of {totalEntries} entries
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            variant="outline" size="sm" className="h-9 w-9 p-0 border-gray-200 rounded-xl hover:bg-indigo-50 hover:text-indigo-600" 
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="default" size="sm" className="h-9 w-9 p-0 btn-gradient text-white border-0 rounded-xl shadow-md">
                            {currentPage}
                        </Button>
                        <Button 
                            onClick={() => setCurrentPage(p => p + 1)}
                            variant="outline" size="sm" className="h-9 w-9 p-0 border-gray-200 rounded-xl hover:bg-indigo-50 hover:text-indigo-600" 
                            disabled={meetings.length < itemsPerPage}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="rounded-[2.5rem] border-0 shadow-2xl max-w-lg p-0 overflow-hidden bg-white">
                    <div className="bg-indigo-500/5 p-8 border-b border-indigo-100 flex items-center justify-between">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-gray-800 uppercase tracking-[0.2em] flex items-center gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                    <VideoIcon className="h-5 w-5" />
                                </div>
                                {editMode ? "Reschedule Meeting" : "Initiate Meeting"}
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="p-10 grid grid-cols-1 gap-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Meeting Title <span className="text-red-500">*</span></Label>
                            <Input 
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder="e.g. Weekly Faculty Coordination"
                                className="h-14 border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-indigo-500 shadow-none text-sm font-bold tracking-tight px-6" 
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Temporal Schedule <span className="text-red-500">*</span></Label>
                            <Input 
                                type="datetime-local"
                                value={formData.date_time}
                                onChange={(e) => setFormData({...formData, date_time: e.target.value})}
                                className="h-14 border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-indigo-500 shadow-none px-6 text-sm font-bold" 
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
                                    className="h-14 border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-indigo-500 shadow-none px-6 text-sm font-bold" 
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Network Protocol</Label>
                                <Select value={formData.api_used} onValueChange={(val) => setFormData({...formData, api_used: val})}>
                                    <SelectTrigger className="h-14 border-gray-100 bg-gray-50/50 rounded-2xl shadow-none px-6 text-sm font-bold">
                                        <SelectValue placeholder="Global" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                                        <SelectItem value="Global">Global Protocol</SelectItem>
                                        <SelectItem value="Self">Localized Proxy</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Technical Agenda</Label>
                            <Textarea 
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Administrative coordination goals..."
                                className="min-h-[100px] border-gray-100 bg-gray-50/50 rounded-[2rem] focus:ring-indigo-500 shadow-none p-6 text-sm resize-none" 
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
                            {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : editMode ? "Update Cycle" : "Commit Meeting"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-[2.5rem] border-0 shadow-2xl p-10">
                    <AlertDialogHeader>
                        <div className="h-16 w-16 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100 mb-6">
                            <AlertCircle className="h-8 w-8" />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black text-gray-800 uppercase tracking-tight">Expunge Administrative Session</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-4">
                            Are you sure you want to permanently delete this virtual meeting? This action will invalidate all join protocols and analytical records associated with this session.
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
