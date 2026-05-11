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
    Zap, ExternalLink, Info, MoreHorizontal, Users,
    GraduationCap, BookOpen, Layers
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

interface GmeetClass {
    id: string;
    title: string;
    description: string;
    date_time: string;
    duration: number;
    created_by: string;
    staff_id: string;
    class_id: string;
    section_id: string;
    status: string;
    meeting_url?: string;
    creator?: { name: string; last_name: string };
    staff?: { name: string; last_name: string; employee_id: string };
    school_class?: { name: string };
    section?: { name: string };
}

export default function LiveClassesPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [classes, setClasses] = useState<GmeetClass[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [totalEntries, setTotalEntries] = useState(0);

    // Form Criteria
    const [formCriteria, setFormCriteria] = useState<{ classes: any[], staff: any[] }>({ classes: [], staff: [] });
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date_time: "",
        duration: 45,
        staff_id: "",
        class_id: "",
        section_id: "",
        meeting_url: ""
    });

    // Sections for form
    const [formSections, setFormSections] = useState<any[]>([]);

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchCriteria();
        fetchClasses();
    }, [currentPage, itemsPerPage, searchTerm]);

    const fetchCriteria = async () => {
        try {
            const response = await api.get('/conference/gmeet-classes/criteria');
            setFormCriteria(response.data);
        } catch (error) {
            console.error("Failed to fetch criteria");
        }
    };

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const response = await api.get('/conference/gmeet-classes', {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage,
                    search: searchTerm
                }
            });
            setClasses(response.data.data || []);
            setTotalEntries(response.data.total || 0);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch classes", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (formData.class_id) {
            const cls = formCriteria.classes.find(c => c.id.toString() === formData.class_id);
            setFormSections(cls?.sections || []);
        } else {
            setFormSections([]);
        }
    }, [formData.class_id, formCriteria.classes]);

    const handleSave = async () => {
        if (!formData.title || !formData.date_time || !formData.class_id || !formData.section_id || !formData.staff_id) {
            toast({ title: "Validation", description: "All required fields must be populated", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        // Default creator id - in real app from auth
        const payload = { ...formData, created_by: formCriteria.staff[0]?.id || 1 };

        try {
            if (editMode && selectedId) {
                await api.put(`/conference/gmeet-classes/${selectedId}`, payload);
                toast({ title: "Success", description: "G-Meet class updated" });
            } else {
                await api.post('/conference/gmeet-classes', payload);
                toast({ title: "Success", description: "G-Meet class scheduled" });
            }
            setOpen(false);
            resetForm();
            fetchClasses();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save curriculum session", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (item: GmeetClass) => {
        setEditMode(true);
        setSelectedId(item.id);
        setFormData({
            title: item.title,
            description: item.description || "",
            date_time: item.date_time.replace(' ', 'T').slice(0, 16),
            duration: item.duration,
            staff_id: item.staff_id.toString(),
            class_id: item.class_id.toString(),
            section_id: item.section_id.toString(),
            meeting_url: item.meeting_url || ""
        });
        setOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/conference/gmeet-classes/${deleteId}`);
            toast({ title: "Success", description: "Curriculum session expunged" });
            fetchClasses();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete session", variant: "destructive" });
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
            staff_id: "",
            class_id: "",
            section_id: "",
            meeting_url: ""
        });
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await api.put(`/conference/gmeet-classes/${id}`, { status: newStatus });
            toast({ title: "Success", description: "Status updated" });
            fetchClasses();
        } catch (error) {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden text-slate-800 rounded-lg">
                <CardHeader className="px-8 py-6 border-b border-muted/50 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black tracking-tight text-slate-700 uppercase">G-Meet Live Classes</CardTitle>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Management of curriculum-linked Google virtual classrooms</p>
                        </div>
                    </div>
                    <Button 
                        onClick={() => { resetForm(); setOpen(true); }}
                        className="h-11 px-8 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-[11px] font-bold uppercase gap-2 shadow-xl shadow-orange-200/40 active:scale-95 transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        Initiate Session
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-6 flex items-center gap-6 border-b border-muted/20">
                        <div className="relative w-80">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Filter curriculum sessions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 rounded-lg bg-white border-muted/50 focus-visible:ring-blue-500/20 text-[10px] font-bold uppercase tracking-[0.2em] shadow-none"
                            />
                        </div>
                        <div className="flex items-center gap-4 ml-auto">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">Page Density:</span>
                            <Select value={itemsPerPage.toString()} onValueChange={(val) => setItemsPerPage(parseInt(val))}>
                                <SelectTrigger className="h-10 w-24 text-[10px] font-bold bg-white border-muted/50 rounded-lg uppercase tracking-widest">
                                    <SelectValue placeholder="50" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-gray-100">
                                    <SelectItem value="10">10 Rows</SelectItem>
                                    <SelectItem value="25">25 Rows</SelectItem>
                                    <SelectItem value="50">50 Rows</SelectItem>
                                    <SelectItem value="100">100 Rows</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-muted/20 bg-muted/5">
                                    <TableHead className="font-bold text-slate-600 text-[10px] uppercase tracking-widest py-5 pl-8">Class Title</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-[10px] uppercase tracking-widest py-5">Curriculum Target</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-[10px] uppercase tracking-widest py-5">Temporal Schedule</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-[10px] uppercase tracking-widest py-5 text-center">Duration</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-[10px] uppercase tracking-widest py-5">Instructor</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-[10px] uppercase tracking-widest py-5 text-center">Status</TableHead>
                                    <TableHead className="font-bold text-slate-600 text-[10px] uppercase tracking-widest py-5 pr-8 text-center">Utility Protocol</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-48 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Syncing Virtual Curriculum Registry...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : classes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-gray-400 text-[11px] font-bold uppercase tracking-widest italic">
                                            No curriculum-linked G-Meet sessions indexed.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    classes.map((item, index) => (
                                        <TableRow key={item.id} className={cn(
                                            "hover:bg-blue-50/20 border-b border-muted/10 transition-colors group",
                                            index % 2 === 0 ? 'bg-white' : 'bg-muted/5'
                                        )}>
                                            <TableCell className="text-slate-700 text-xs py-5 pl-8 font-bold uppercase tracking-tight">
                                                <div className="flex flex-col">
                                                    <span>{item.title}</span>
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter truncate max-w-[180px]">{item.description || "Official curriculum session"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold text-[9px] border border-blue-100 uppercase tracking-tighter shadow-sm">
                                                        {item.school_class?.name}
                                                    </span>
                                                    <span className="bg-gray-50 text-gray-500 px-2 py-1 rounded-full font-bold text-[9px] border border-gray-100 uppercase tracking-tighter">
                                                        {item.section?.name}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-600 text-xs py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-500 flex items-center gap-2">
                                                        <Calendar className="h-3.5 w-3.5 text-blue-500" /> {new Date(item.date_time).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-5">{new Date(item.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center py-5">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.duration}m</span>
                                            </TableCell>
                                            <TableCell className="text-slate-700 text-[10px] py-5 font-bold uppercase tracking-tighter">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[9px] text-blue-600 font-bold uppercase shadow-inner">
                                                        {item.staff?.name?.[0]}{item.staff?.last_name?.[0]}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span>{item.staff ? `${item.staff.name} ${item.staff.last_name}` : "Pending Assign"}</span>
                                                        <span className="text-[8px] text-gray-400 tracking-tighter italic">Ref: {item.staff?.employee_id || "SYS"}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 text-center">
                                                <Select defaultValue={item.status || "awaited"} onValueChange={(val) => handleStatusChange(item.id, val)}>
                                                    <SelectTrigger className={cn(
                                                        "h-8 w-[105px] text-[9px] font-black uppercase tracking-widest bg-white border-muted/50 rounded-lg mx-auto shadow-sm",
                                                        (item.status === 'awaited' || !item.status) && "text-orange-500 border-orange-100 bg-orange-50/50",
                                                        item.status === 'finished' && "text-emerald-500 border-emerald-100 bg-emerald-50/50",
                                                        item.status === 'cancelled' && "text-rose-500 border-rose-100 bg-rose-50/50"
                                                    )}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-lg border-gray-100 shadow-xl">
                                                        <SelectItem value="awaited">Awaited</SelectItem>
                                                        <SelectItem value="finished">Finished</SelectItem>
                                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="pr-8 py-5 text-center">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 duration-300">
                                                    <Button size="icon" className="h-9 w-9 rounded-lg bg-blue-500 hover:bg-blue-600 text-white shadow-xl shadow-blue-200 transition-all active:scale-90">
                                                        <MonitorPlay className="h-4.5 w-4.5" />
                                                    </Button>
                                                    <Button onClick={() => handleEdit(item)} size="icon" className="h-9 w-9 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-200 transition-all active:scale-90">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button onClick={() => setDeleteId(item.id)} size="icon" className="h-9 w-9 rounded-lg bg-rose-500 hover:bg-rose-600 text-white shadow-xl shadow-rose-200 transition-all active:scale-90">
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

                    <div className="p-6 border-t border-muted/20 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        <span>Index: {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalEntries)} of {totalEntries} node entries</span>
                        <div className="flex items-center gap-2">
                            <Button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                variant="outline" size="icon" className="h-10 w-10 rounded-lg border-muted/50 hover:bg-blue-50 hover:text-blue-600 transition-all"
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button size="icon" className="h-10 w-10 rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-lg font-black text-xs">
                                {currentPage}
                            </Button>
                            <Button 
                                onClick={() => setCurrentPage(p => p + 1)}
                                variant="outline" size="icon" className="h-10 w-10 rounded-lg border-muted/50 hover:bg-blue-50 hover:text-blue-600 transition-all"
                                disabled={classes.length < itemsPerPage}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="rounded-[2.5rem] border-0 shadow-2xl max-w-2xl p-0 overflow-hidden bg-white">
                    <div className="bg-blue-500/5 p-10 border-b border-blue-100 flex items-center justify-between">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-gray-800 uppercase tracking-[0.2em] flex items-center gap-5">
                                <div className="h-14 w-14 rounded-[1.8rem] bg-blue-500 flex items-center justify-center text-white shadow-2xl shadow-blue-200 transform rotate-3">
                                    <GraduationCap className="h-7 w-7" />
                                </div>
                                <div>
                                    {editMode ? "Reschedule Curriculum" : "Initiate Curriculum"}
                                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1 italic">Synchronization of virtual workspace nodes</p>
                                </div>
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="p-12 grid grid-cols-2 gap-10">
                        <div className="space-y-4 col-span-2">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                <Info className="h-3 w-3" /> Session Title <span className="text-red-500">*</span>
                            </Label>
                            <Input 
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder="e.g. Advanced Calculus - Virtual Module"
                                className="h-14 border-gray-100 bg-gray-50/50 rounded-lg focus:ring-blue-500 shadow-none text-sm font-bold tracking-tight px-6" 
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Temporal Schedule <span className="text-red-500">*</span></Label>
                            <Input 
                                type="datetime-local"
                                value={formData.date_time}
                                onChange={(e) => setFormData({...formData, date_time: e.target.value})}
                                className="h-14 border-gray-100 bg-gray-50/50 rounded-lg focus:ring-blue-500 shadow-none px-6 text-sm font-bold" 
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Assigned Instructor <span className="text-red-500">*</span></Label>
                            <Select value={formData.staff_id} onValueChange={(val) => setFormData({...formData, staff_id: val})}>
                                <SelectTrigger className="h-14 border-gray-100 bg-gray-50/50 rounded-lg shadow-none px-6 text-sm font-bold">
                                    <SelectValue placeholder="Select Staff Member" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-gray-100 shadow-2xl">
                                    {formCriteria.staff.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name} {s.last_name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Institutional Class <span className="text-red-500">*</span></Label>
                            <Select value={formData.class_id} onValueChange={(val) => setFormData({...formData, class_id: val})}>
                                <SelectTrigger className="h-14 border-gray-100 bg-gray-50/50 rounded-lg shadow-none px-6 text-sm font-bold">
                                    <SelectValue placeholder="Select Target Class" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-gray-100 shadow-2xl">
                                    {formCriteria.classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Academic Section <span className="text-red-500">*</span></Label>
                            <Select value={formData.section_id} onValueChange={(val) => setFormData({...formData, section_id: val})}>
                                <SelectTrigger className="h-14 border-gray-100 bg-gray-50/50 rounded-lg shadow-none px-6 text-sm font-bold">
                                    <SelectValue placeholder="Select Section" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-gray-100 shadow-2xl">
                                    {formSections.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Duration (Min)</Label>
                            <Input 
                                type="number"
                                value={formData.duration}
                                onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                                placeholder="45"
                                className="h-14 border-gray-100 bg-gray-50/50 rounded-lg focus:ring-blue-500 shadow-none px-6 text-sm font-bold" 
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">G-Meet Join URL</Label>
                            <Input 
                                value={formData.meeting_url}
                                onChange={(e) => setFormData({...formData, meeting_url: e.target.value})}
                                placeholder="meet.google.com/..."
                                className="h-14 border-gray-100 bg-gray-50/50 rounded-lg focus:ring-blue-500 shadow-none px-6 text-sm font-bold" 
                            />
                        </div>

                        <div className="space-y-4 col-span-2">
                            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Session Agenda / Methodology</Label>
                            <Textarea 
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Learning outcomes and session structure..."
                                className="min-h-[120px] border-gray-100 bg-gray-50/50 rounded-[2.5rem] focus:ring-blue-500 shadow-none p-8 text-sm resize-none tracking-tight leading-relaxed" 
                            />
                        </div>
                    </div>

                    <div className="p-10 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-5">
                        <Button variant="ghost" onClick={() => setOpen(false)} className="h-14 px-10 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-white transition-all">Discard Protocol</Button>
                        <Button 
                            onClick={handleSave} 
                            disabled={submitting}
                            className="btn-gradient text-white px-16 h-14 text-[12px] font-black uppercase shadow-2xl shadow-orange-200/50 transition-all rounded-full flex gap-3 active:scale-95"
                        >
                            {submitting ? <RefreshCw className="h-5 w-5 animate-spin" /> : editMode ? "Update Curriculum Node" : "Commit Curriculum Session"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-[3rem] border-0 shadow-2xl p-12">
                    <AlertDialogHeader>
                        <div className="h-20 w-20 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100 mb-8 transform -rotate-6 shadow-inner">
                            <ShieldCheck className="h-10 w-10" />
                        </div>
                        <AlertDialogTitle className="text-3xl font-black text-gray-800 uppercase tracking-tight">Expunge Curriculum Session</AlertDialogTitle>
                        <AlertDialogDescription className="text-base text-gray-500 leading-relaxed mt-6">
                            Are you sure you want to permanently invalidate this curriculum-linked virtual session? This protocol will expunge all join history and indexed engagement records from the institutional registry.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-12 gap-5">
                        <AlertDialogCancel className="h-14 px-10 rounded-full text-[11px] font-bold uppercase tracking-widest border-gray-100 hover:bg-gray-50 transition-all">Cancel Protocol</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-rose-500 hover:bg-rose-600 h-14 px-12 rounded-full text-[11px] font-black uppercase tracking-widest border-0 shadow-2xl shadow-rose-200 active:scale-95 transition-all">
                            Confirm Expunge
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
