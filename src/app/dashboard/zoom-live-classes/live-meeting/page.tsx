"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Copy, FileSpreadsheet, FileBox, Printer, Columns,
    ChevronLeft, ChevronRight, Search, ArrowUpDown, List, X, Plus, Pencil, Trash2, Calendar, Video
} from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import { useSettings } from "@/components/providers/settings-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
    const [searchTerm, setSearchTerm] = useState("");
    const [meetings, setMeetings] = useState<LiveMeeting[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState("50");
    const [totalEntries, setTotalEntries] = useState(0);

    // Form Modal state
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

    const { t } = useTranslation();
    const { settings } = useSettings();
    const tf = settings?.time_format === "12" ? "12" : "24" as const;

    // Dropdown criteria
    const [criteria, setCriteria] = useState<{ staff: any[] }>({ staff: [] });

    // Delete dialog state
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Join List Modal state
    const [joinModalOpen, setJoinModalOpen] = useState(false);
    const [joinSearchTerm, setJoinSearchTerm] = useState("");
    const [activeJoinList, setActiveJoinList] = useState<any[]>([]);

    useEffect(() => {
        fetchCriteria();
        fetchMeetings();
    }, [currentPage, itemsPerPage, searchTerm]);

    const fetchCriteria = async () => {
        try {
            const response = await api.get('/conference/live-meetings/criteria');
            setCriteria(response.data);
        } catch (error) {
            console.error("Failed to fetch criteria", error);
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
            if (response.data && response.data.data) {
                setMeetings(response.data.data || []);
                setTotalEntries(response.data.total || 0);
            } else {
                setMeetings(response.data || []);
                setTotalEntries(response.data.length || 0);
            }
        } catch (error) {
            console.error("Failed to fetch meetings", error);
            toast.error(t("Failed to load meetings"));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title || !formData.date_time) {
            toast.error(t("Required fields missing"));
            return;
        }

        setSubmitting(true);
        const payload = { ...formData, created_by: criteria.staff?.[0]?.id || 1 };

        try {
            if (editMode && selectedId) {
                await api.put(`/conference/live-meetings/${selectedId}`, payload);
                toast.success(t("Live meeting updated successfully"));
            } else {
                await api.post('/conference/live-meetings', payload);
                toast.success(t("Live meeting scheduled successfully"));
            }
            setOpen(false);
            resetForm();
            fetchMeetings();
        } catch (error) {
            console.error("Failed to save meeting", error);
            toast.error(t("Failed to save meeting"));
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
            duration: item.duration || 45,
            api_used: item.api_used || "Global"
        });
        setOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/conference/live-meetings/${deleteId}`);
            toast.success(t("Live meeting expunged successfully"));
            fetchMeetings();
        } catch (error) {
            console.error("Failed to delete", error);
            toast.error(t("Failed to expunge live meeting"));
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

    const handleOpenJoinList = (item: LiveMeeting) => {
        // Real data only — show creator from DB
        const list: any[] = [];
        if (item.creator) {
            list.push({
                name: `${item.creator.name} ${item.creator.last_name ?? ''}`.trim(),
                role: item.creator.employee_id ? "Host" : "Admin",
                id: item.creator.employee_id || item.created_by,
                last_join: formatDateTime(item.date_time),
            });
        }
        setActiveJoinList(list);
        setJoinModalOpen(true);
    };

    // Date time parser helper to format as MM/DD/YYYY HH:MM:SS
    const formatDateTime = (dtStr: string) => {
        try {
            const d = new Date(dtStr);
            if (isNaN(d.getTime())) return dtStr;
            const pad = (n: number) => n.toString().padStart(2, '0');
            const mm = pad(d.getMonth() + 1);
            const dd = pad(d.getDate());
            const yyyy = d.getFullYear();
            return `${mm}/${dd}/${yyyy} ${formatTime(d, tf)}`;
        } catch {
            return dtStr;
        }
    };

    // Calculate pagination variables
    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;

    const filteredJoinList = activeJoinList.filter(user => 
        user.name.toLowerCase().includes(joinSearchTerm.toLowerCase()) || 
        user.role.toLowerCase().includes(joinSearchTerm.toLowerCase()) ||
        user.id.toString().includes(joinSearchTerm)
    );

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            
            {/* Gradient card header */}
            <div className="rounded-xl border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Video className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("Live Meeting")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{t("Host Zoom meetings with staff")}</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => { resetForm(); setOpen(true); }}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white px-4 h-9 text-xs font-bold rounded-full shadow-[0_4px_12px_rgba(99,102,241,0.25)] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border-0"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        {t("Add")}
                    </Button>
                </div>
            </div>

            {/* Table Card Panel */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden min-h-[500px]">

                {/* Table Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50 pb-3">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <Input
                            placeholder={t("Search")}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-8 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                            <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                <SelectTrigger className="h-7 w-16 text-[10px] border-gray-200 shadow-none rounded font-semibold text-gray-700 bg-white">
                                    <SelectValue placeholder="50" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                            {[Copy, FileSpreadsheet, FileBox, Printer, Columns].map((Icon, i) => (
                                <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                    <Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table Area */}
                <div className="rounded border border-gray-100 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1000px]">
                        <TableHeader className="bg-transparent border-b border-gray-100">
                            <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4">{t("Meeting Title")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">{t("Description")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">{t("Date Time")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">{t("Api Used")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">{t("Created By")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">{t("Total Join")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 text-right">{t("Action")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(6)].map((_, i) => (
                                    <TableRow key={i} className="border-b border-gray-50">
                                        {[...Array(7)].map((_, j) => (
                                            <TableCell key={j} className="py-3 px-4">
                                                <div className="h-3 w-full max-w-[120px] rounded bg-gray-100 animate-pulse" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : meetings.length === 0 ? (
                                <TableRow className="hover:bg-transparent h-64">
                                    <TableCell colSpan={7} className="text-center py-12 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                                        {t("No virtual meeting sessions scheduled.")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                meetings.map((item, idx) => (
                                    <TableRow key={item.id || idx} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap">
                                        <TableCell className="py-3 px-4 text-gray-700 font-medium">{item.title}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500 max-w-[250px] truncate" title={item.description}>{item.description || "-"}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-600">{formatDateTime(item.date_time)}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-600 font-medium">{item.api_used || "Global"}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-600">
                                            {item.creator
                                                ? `${item.creator.name} ${item.creator.last_name ?? ''}`.trim()
                                                : <span className="text-gray-400 italic">—</span>}
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-center text-gray-700 font-semibold">{item.total_join}</TableCell>
                                        <TableCell className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5 ml-auto">
                                                <Button 
                                                    onClick={() => handleOpenJoinList(item)}
                                                    className="bg-[#7e57c2] hover:bg-[#7048b6] text-white p-0 h-6 w-6 rounded shadow-none flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                                                    title={t("View Join List")}
                                                >
                                                    <List className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button 
                                                    onClick={() => handleEdit(item)}
                                                    className="bg-emerald-500 hover:bg-emerald-600 text-white p-0 h-6 w-6 rounded shadow-none flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                                                    title={t("Edit Meeting")}
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                                <Button 
                                                    onClick={() => setDeleteId(item.id)}
                                                    className="bg-rose-500 hover:bg-rose-600 text-white p-0 h-6 w-6 rounded shadow-none flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                                                    title={t("Delete Meeting")}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-4 border-t border-gray-50 mt-2">
                    <div>
                        {t("showing_x_to_y_of_z", {
                            from: totalEntries > 0 ? startIndex + 1 : 0,
                            to: Math.min(startIndex + sizeNum, totalEntries),
                            total: totalEntries
                        })}
                    </div>

                    {totalEntries > 0 && (
                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={safePage === 1}
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "h-8 w-8 transition-all duration-300 text-xs flex items-center justify-center cursor-pointer font-bold",
                                        safePage === page
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-lg shadow-indigo-500/25 rounded-xl hover:scale-105 active:scale-95"
                                            : "bg-white hover:bg-gray-50/80 text-gray-500 hover:text-gray-700 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 border border-gray-100"
                                    )}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                disabled={safePage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                className="h-8 w-8 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl hover:shadow-md hover:shadow-gray-100/50 active:scale-95 transition-all border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

            </div>

            {/* Add / Edit Dialog Modal */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-[650px] p-0 overflow-hidden bg-white border border-gray-200 shadow-2xl rounded text-gray-700">
                    
                    {/* Header */}
                    <div className="bg-[#7e57c2] text-white p-4 font-semibold text-sm flex justify-between items-center">
                        <DialogHeader>
                            <DialogTitle className="text-white text-sm font-semibold tracking-tight">
                                {editMode ? t("Edit Live Meeting") : t("Add Live Meeting")}
                            </DialogTitle>
                        </DialogHeader>
                        <button 
                            onClick={() => setOpen(false)} 
                            className="text-white/80 hover:text-white transition-colors cursor-pointer"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Form Fields */}
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar text-xs">
                        
                        {/* Title */}
                        <div className="space-y-1">
                            <Label className="text-[11px] font-medium text-gray-700">{t("Meeting Title")} <span className="text-red-500">*</span></Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder={t("Enter title")}
                                className="h-9 border-gray-200 focus-visible:ring-indigo-500 rounded text-xs shadow-none w-full"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Date Time */}
                            <div className="space-y-1">
                                <Label className="text-[11px] font-medium text-gray-700">{t("Date Time")} <span className="text-red-500">*</span></Label>
                                <Input
                                    type="datetime-local"
                                    value={formData.date_time}
                                    onChange={(e) => setFormData({...formData, date_time: e.target.value})}
                                    className="h-9 border-gray-200 focus-visible:ring-indigo-500 rounded text-xs shadow-none w-full"
                                />
                            </div>

                            {/* Duration */}
                            <div className="space-y-1">
                                <Label className="text-[11px] font-medium text-gray-700">{t("Duration (Minutes)")} <span className="text-red-500">*</span></Label>
                                <Input
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 45})}
                                    className="h-9 border-gray-200 focus-visible:ring-indigo-500 rounded text-xs shadow-none w-full"
                                />
                            </div>
                        </div>

                        {/* API Used */}
                        <div className="space-y-1">
                            <Label className="text-[11px] font-medium text-gray-700">{t("Api Used")}</Label>
                            <Select value={formData.api_used} onValueChange={(val) => setFormData({...formData, api_used: val})}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded text-gray-700">
                                    <SelectValue placeholder="Global" />
                                </SelectTrigger>
                                <SelectContent className="rounded shadow-xl">
                                    <SelectItem value="Global">Global</SelectItem>
                                    <SelectItem value="Self">Self</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Description / Agenda */}
                        <div className="space-y-1">
                            <Label className="text-[11px] font-medium text-gray-700">{t("Description")}</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder={t("Meeting Agenda")}
                                className="min-h-[100px] border-gray-200 focus-visible:ring-indigo-500 rounded text-xs shadow-none resize-none w-full p-2"
                            />
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2 text-xs">
                        <Button 
                            variant="outline" 
                            onClick={() => setOpen(false)}
                            className="h-8.5 px-4 font-semibold text-gray-500 border-gray-200 hover:bg-gray-100 rounded cursor-pointer"
                        >
                            {t("Cancel")}
                        </Button>
                        <Button 
                            onClick={handleSave}
                            disabled={submitting}
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white px-5 h-8.5 font-bold rounded shadow transition-all active:scale-95 border-0 cursor-pointer"
                        >
                            {t("Save")}
                        </Button>
                    </div>

                </DialogContent>
            </Dialog>

            {/* Join List Dialog Modal */}
            <Dialog open={joinModalOpen} onOpenChange={setJoinModalOpen}>
                <DialogContent className="max-w-[800px] p-0 overflow-hidden bg-white border border-gray-200 shadow-2xl rounded text-gray-700">
                    
                    {/* Header */}
                    <div className="bg-[#7e57c2] text-white p-4 font-semibold text-sm flex justify-between items-center">
                        <DialogHeader>
                            <DialogTitle className="text-white text-sm font-semibold tracking-tight">{t("Join List")}</DialogTitle>
                        </DialogHeader>
                        <button 
                            onClick={() => setJoinModalOpen(false)} 
                            className="text-white/80 hover:text-white transition-colors cursor-pointer"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Table Toolbar */}
                    <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-100">
                        <div className="relative w-full md:w-48">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder={t("Search...")}
                                value={joinSearchTerm}
                                onChange={(e) => setJoinSearchTerm(e.target.value)}
                                className="pl-8 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <Select defaultValue="50">
                                    <SelectTrigger className="h-7 w-16 text-[10px] border-gray-200 shadow-none rounded font-semibold bg-white text-gray-700">
                                        <SelectValue placeholder="50" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                                {[Copy, FileSpreadsheet, FileBox, Printer, Columns].map((Icon, i) => (
                                    <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                        <Icon className="h-3.5 w-3.5" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Modal Grid content */}
                    <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar text-xs">
                        <div className="rounded border border-gray-100 overflow-x-auto">
                            <Table className="min-w-[700px]">
                                <TableHeader className="bg-transparent border-b border-gray-100">
                                    <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-2.5 px-4">{t("Staff / Student")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4 text-right">{t("Last Join")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredJoinList.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-8 text-gray-400 uppercase text-[10px] tracking-wider">
                                                {t("No session join records matching search filter.")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredJoinList.map((user, uidx) => (
                                            <TableRow key={uidx} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap">
                                                <TableCell className="py-2.5 px-4 text-gray-700 font-medium">
                                                    {user.name} ({user.role} : {user.id})
                                                </TableCell>
                                                <TableCell className="py-2.5 px-4 text-right text-gray-600 font-medium">
                                                    {user.last_join}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Modal Footer pagination */}
                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2">
                            <div>
                                {t("showing_x_to_y_of_z", {
                                    from: filteredJoinList.length > 0 ? 1 : 0,
                                    to: filteredJoinList.length,
                                    total: filteredJoinList.length
                                })}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button className="h-7 w-7 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl active:scale-95 border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none" disabled>
                                    <ChevronLeft className="h-3 w-3" />
                                </button>
                                <button className="h-7 w-7 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white text-[10px] flex items-center justify-center font-bold rounded-xl shadow">
                                    1
                                </button>
                                <button className="h-7 w-7 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl active:scale-95 border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none" disabled>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="max-w-[450px] p-6 bg-white border border-gray-200 shadow-2xl rounded text-gray-700 text-xs">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-800 text-sm font-semibold tracking-tight">{t("Expunge Administrative Session")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 text-xs leading-relaxed mt-2">
                            {t("Are you sure you want to permanently delete this virtual meeting? This action will invalidate all join protocols and analytical records associated with this session.")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-2">
                        <AlertDialogCancel className="h-8.5 px-4 font-semibold text-gray-500 border-gray-200 hover:bg-gray-100 rounded cursor-pointer">{t("Cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-rose-500 hover:bg-rose-600 text-white h-8.5 px-4 font-bold rounded shadow transition-all active:scale-95 border-0 cursor-pointer">
                            {t("Confirm Expunge")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}
