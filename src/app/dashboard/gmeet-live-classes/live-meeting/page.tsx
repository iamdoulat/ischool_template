"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
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
    Search, ChevronLeft, ChevronRight,
    ArrowUpDown, List, Plus, X, Copy, FileSpreadsheet,
    FileBox, Printer, Columns, ExternalLink, Video
} from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import { useSettings } from "@/components/providers/settings-provider";
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
    const { t } = useTranslation();
    const { settings } = useSettings();
    const tf = settings?.time_format === "12" ? "12" : "24" as const;
    const [searchTerm, setSearchTerm] = useState("");
    const [meetings, setMeetings] = useState<GmeetMeeting[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState("50");
    const [totalEntries, setTotalEntries] = useState(0);

    // Form Modal State
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
    const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);

    // Delete Confirmation State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Join List Modal State
    const [joinModalOpen, setJoinModalOpen] = useState(false);
    const [joinSearchTerm, setJoinSearchTerm] = useState("");
    const [activeJoinList, setActiveJoinList] = useState<any[]>([]);

    useEffect(() => {
        fetchCriteria();
    }, []);

    useEffect(() => {
        fetchMeetings();
    }, [currentPage, itemsPerPage, searchTerm]);

    const fetchCriteria = async () => {
        try {
            const response = await api.get('/conference/gmeet-meetings/criteria');
            setCriteria(response.data);
        } catch (error) {
            console.error("Failed to fetch criteria", error);
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
            if (response.data && response.data.data) {
                setMeetings(response.data.data || []);
                setTotalEntries(response.data.total || 0);
            } else {
                setMeetings(response.data || []);
                setTotalEntries(response.data.length || 0);
            }
        } catch (error) {
            console.error("Failed to fetch meetings", error);
            toast.error(t("failed_to_load_live_meetings"));
        } finally {
            setLoading(false);
        }
    };

    // Staff List selector — real DB criteria only
    const getResolvedStaffList = () => {
        return (criteria.staff || []).map(s => ({
            id: s.id,
            name: `${s.name} ${s.last_name ?? ''}`.trim(),
            role: s.role || "Teacher",
            code: s.employee_id || s.id
        }));
    };

    const handleToggleStaff = (id: number) => {
        if (selectedStaffIds.includes(id)) {
            setSelectedStaffIds(selectedStaffIds.filter(x => x !== id));
        } else {
            setSelectedStaffIds([...selectedStaffIds, id]);
        }
    };

    const handleSave = async () => {
        if (!formData.title || !formData.date_time) {
            toast.error(t("please_fill_in_all_required_fields"));
            return;
        }
        if (selectedStaffIds.length === 0) {
            toast.error(t("please_select_at_least_one_staff_member"));
            return;
        }

        setSubmitting(true);
        const payload = { 
            ...formData, 
            created_by: selectedStaffIds[0],
            total_join: 1,
            status: "awaited"
        };

        try {
            if (editMode && selectedId) {
                await api.put(`/conference/gmeet-meetings/${selectedId}`, payload);
                toast.success(t("meeting_updated_successfully"));
            } else {
                await api.post('/conference/gmeet-meetings', payload);
                toast.success(t("meeting_created_successfully"));
            }
            setOpen(false);
            resetForm();
            fetchMeetings();
        } catch (error) {
            console.error("Failed to save meeting", error);
            toast.error(t("failed_to_save_meeting"));
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
            duration: item.duration || 45,
            meeting_url: item.meeting_url || ""
        });
        setSelectedStaffIds([parseInt(item.created_by, 10) || 1]);
        setOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/conference/gmeet-meetings/${deleteId}`);
            toast.success(t("meeting_deleted_successfully"));
            fetchMeetings();
        } catch (error) {
            console.error("Failed to delete meeting", error);
            toast.error(t("failed_to_delete_meeting"));
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
        setSelectedStaffIds([]);
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await api.put(`/conference/gmeet-meetings/${id}`, { status: newStatus });
            toast.success(t("meeting_status_updated"));
            fetchMeetings();
        } catch (error) {
            console.error("Failed to update status", error);
            toast.error(t("failed_to_update_status"));
        }
    };

    const handleOpenJoinList = (item: GmeetMeeting) => {
        // Real data only — host/creator joined record from DB
        const list: any[] = [];
        if (item.creator) {
            list.push({
                name: `${item.creator.name} ${item.creator.last_name ?? ''}`.trim(),
                role: t("host"),
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

    const resolvedStaffList = getResolvedStaffList();

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
                            <h1 className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("live_meeting")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{t("host_google_meet_sessions_with_staff")}</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => { resetForm(); setOpen(true); }}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white px-4 h-9 text-xs font-bold rounded-full shadow-[0_4px_12px_rgba(99,102,241,0.25)] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border-0"
                    >
                        <Plus className="h-4 w-4" />
                        {t("add")}
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
                            placeholder={t("search")}
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
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{t("rows")}</span>
                            <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                <SelectTrigger className="h-7 w-16 text-[10px] border-gray-200 shadow-none rounded font-semibold">
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

                {/* Table */}
                <div className="rounded border border-gray-100 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1100px]">
                        <TableHeader className="bg-transparent border-b border-gray-100">
                            <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4">{t("meeting_title")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">{t("description")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">{t("date_time")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">{t("class_duration_minutes")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">{t("created_by")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">{t("status")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 text-right">{t("action")}</TableHead>
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
                                        {t("no_live_meetings_indexed")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                meetings.map((item, idx) => (
                                    <TableRow key={item.id || idx} className="text-[11px] border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap">
                                        <TableCell className="py-3 px-4 text-gray-700 font-medium">{item.title}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500 max-w-[250px] truncate" title={item.description}>{item.description || "-"}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-600">{formatDateTime(item.date_time)}</TableCell>
                                        <TableCell className="py-3 px-4 text-center text-gray-700 font-medium">{item.duration}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-600">{t("self")}</TableCell>
                                        <TableCell className="py-3 px-4">
                                            <Select defaultValue={item.status || "awaited"} onValueChange={(val) => handleStatusChange(item.id, val)}>
                                                <SelectTrigger className="h-7 w-24 text-[10px] border-gray-200 text-gray-700 bg-white rounded">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="awaited">{t("awaited")}</SelectItem>
                                                    <SelectItem value="finished">{t("finished")}</SelectItem>
                                                    <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {/* Start Meeting */}
                                                <Button 
                                                    onClick={() => {
                                                        if (item.meeting_url) {
                                                            window.open(item.meeting_url, '_blank');
                                                        } else {
                                                            toast.error(t("no_join_meeting_url_configured"));
                                                        }
                                                    }}
                                                    className="bg-[#4caf50] hover:bg-[#43a047] text-white px-2.5 h-6 text-[10px] font-bold rounded shadow-none flex items-center gap-1 active:scale-95 transition-all"
                                                    title={t("start_live_session")}
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                    {t("start")}
                                                </Button>

                                                {/* Join List */}
                                                <Button
                                                    onClick={() => handleOpenJoinList(item)}
                                                    className="bg-[#7e57c2] hover:bg-[#7048b6] text-white p-0 h-6 w-6 rounded shadow-none flex items-center justify-center transition-all active:scale-95"
                                                    title={t("view_join_list")}
                                                >
                                                    <List className="h-3.5 w-3.5" />
                                                </Button>

                                                {/* Delete */}
                                                <Button 
                                                    onClick={() => setDeleteId(item.id)}
                                                    className="bg-[#6366F1] hover:bg-[#5558e6] text-white p-0 h-6 w-6 rounded shadow-none flex items-center justify-center active:scale-95 transition-all"
                                                    title={t("delete_meeting")}
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-4 border-t border-gray-50 mt-2">
                    <div>
                        {t("showing_x_to_y_of_z", { from: totalEntries > 0 ? startIndex + 1 : 0, to: Math.min(startIndex + sizeNum, totalEntries), total: totalEntries })}
                        {searchTerm && ` (${t("filtered_from_x_total_entries", { total: totalEntries })})`}
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

            {/* Add/Edit Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="rounded border border-gray-100 shadow-2xl max-w-4xl p-0 overflow-hidden bg-white">
                    <div className="bg-[#7e57c2] text-white p-4 font-semibold text-sm flex justify-between items-center">
                        <DialogHeader>
                            <DialogTitle className="text-white text-sm font-semibold tracking-tight">
                                {editMode ? t("edit_live_meeting") : t("add_live_meeting")}
                            </DialogTitle>
                        </DialogHeader>
                        <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white transition-colors cursor-pointer">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Dual panel Grid matching screenshot exactly */}
                    <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-6 text-xs text-gray-700">
                        
                        {/* Left Column - Form Fields (3/5) */}
                        <div className="md:col-span-3 space-y-4">
                            {/* Title */}
                            <div className="space-y-1">
                                <Label className="text-[11px] font-semibold text-gray-600">{t("meeting_title")} <span className="text-red-500">*</span></Label>
                                <Input 
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    className="h-9 border-gray-200 rounded text-xs shadow-none" 
                                />
                            </div>

                            {/* Date/Time + Duration */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-semibold text-gray-600">{t("meeting_date_time")} <span className="text-red-500">*</span></Label>
                                    <Input 
                                        type="datetime-local"
                                        value={formData.date_time}
                                        onChange={(e) => setFormData({...formData, date_time: e.target.value})}
                                        className="h-9 border-gray-200 rounded text-xs shadow-none" 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-semibold text-gray-600">{t("meeting_duration_minutes")} <span className="text-red-500">*</span></Label>
                                    <Input 
                                        type="number"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 0})}
                                        className="h-9 border-gray-200 rounded text-xs shadow-none" 
                                    />
                                </div>
                            </div>

                            {/* Gmeet URL */}
                            <div className="space-y-1">
                                <Label className="text-[11px] font-semibold text-gray-600">
                                    {t("gmeet_url")} ({t("how_to_get")} <span className="text-indigo-600 hover:underline cursor-pointer font-medium">{t("gmeet_url_question")}</span>) <span className="text-red-500">*</span>
                                </Label>
                                <Input 
                                    value={formData.meeting_url}
                                    onChange={(e) => setFormData({...formData, meeting_url: e.target.value})}
                                    placeholder=""
                                    className="h-9 border-gray-200 rounded text-xs shadow-none" 
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-1">
                                <Label className="text-[11px] font-semibold text-gray-600">{t("description")}</Label>
                                <Textarea 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    className="min-h-[80px] border-gray-200 rounded text-xs shadow-none resize-none p-3" 
                                />
                            </div>
                        </div>

                        {/* Right Column - Staff List (2/5) */}
                        <div className="md:col-span-2 space-y-2 flex flex-col">
                            <Label className="text-[11px] font-semibold text-gray-600">{t("staff_list")} <span className="text-red-500">*</span></Label>
                            
                            <div className="border border-gray-200 rounded p-3 flex-1 min-h-[220px] max-h-[260px] overflow-y-auto space-y-2.5 custom-scrollbar bg-white">
                                {resolvedStaffList.map((staff, idx) => (
                                    <label key={staff.id || idx} className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedStaffIds.includes(staff.id)}
                                            onChange={() => handleToggleStaff(staff.id)}
                                            className="h-3.5 w-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 accent-indigo-600 mt-0.5 cursor-pointer"
                                        />
                                        <span>{staff.name} ({staff.role} : {staff.code})</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                    </div>

                    <div className="p-4 bg-gray-50 border-t border-gray-150 flex justify-end">
                        <Button 
                            onClick={handleSave} 
                            disabled={submitting}
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-5 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-sm"
                        >
                            {submitting ? t("saving") : t("save")}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded border border-gray-150 shadow-2xl p-6 bg-white max-w-sm text-xs text-gray-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-sm font-bold text-gray-800">{t("delete_live_meeting")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-gray-500 mt-2 leading-relaxed">
                            {t("are_you_sure_permanently_delete_meeting")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-2">
                        <AlertDialogCancel className="h-8 border-gray-200 text-xs rounded">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-rose-600 hover:bg-rose-700 text-white h-8 text-xs font-bold rounded border-0">
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Join List Modal */}
            <Dialog open={joinModalOpen} onOpenChange={setJoinModalOpen}>
                <DialogContent className="max-w-[800px] p-0 overflow-hidden bg-white border border-gray-200 shadow-2xl rounded">
                    
                    {/* Header */}
                    <div className="bg-[#7e57c2] text-white p-4 font-semibold text-sm flex justify-between items-center">
                        <DialogHeader>
                            <DialogTitle className="text-white text-sm font-semibold tracking-tight">{t("join_list")}</DialogTitle>
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
                                placeholder={t("search")}
                                value={joinSearchTerm}
                                onChange={(e) => setJoinSearchTerm(e.target.value)}
                                className="pl-8 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <Select defaultValue="50">
                                    <SelectTrigger className="h-7 w-16 text-[10px] border-gray-200 shadow-none rounded font-semibold">
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
                    <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
                        <div className="rounded border border-gray-100 overflow-x-auto">
                            <Table className="min-w-[700px]">
                                <TableHeader className="bg-transparent border-b border-gray-100">
                                    <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                        <TableHead className="py-2.5 px-4">{t("staff")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-2.5 px-4 text-right">{t("last_join")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredJoinList.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-8 text-gray-400 uppercase text-[10px] tracking-wider">
                                                {t("no_session_join_records")}
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
                                {t("showing_x_to_y_of_z", { from: 1, to: filteredJoinList.length, total: filteredJoinList.length })}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button className="h-7 w-7 bg-white hover:bg-gray-50/80 text-gray-400 rounded-xl active:scale-95 border border-gray-100 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:pointer-events-none" disabled>
                                    <ChevronLeft className="h-3.5 w-3.5" />
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

        </div>
    );
}
