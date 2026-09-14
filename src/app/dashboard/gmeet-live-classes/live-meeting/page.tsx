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
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
    Search, ChevronLeft, ChevronRight,
    ArrowUpDown, List, Plus, X, Copy, FileSpreadsheet,
    FileText, FileCode, Printer, Columns, Video, Pencil, Trash2, Save, Users
} from "lucide-react";
import { cn, formatTime, toLocaleNumber, translateRoleName } from "@/lib/utils";
import { useSettings } from "@/components/providers/settings-provider";
import {
    Dialog,
    DialogContent,
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface GmeetMeeting {
    id: string;
    title: string;
    description: string;
    date_time: string;
    duration: number;
    created_by: string;
    status: string;
    creator?: { id?: number; name: string; last_name: string; role?: string; employee_id: string };
    total_join: number;
    meeting_url?: string;
}

export default function LiveMeetingPage() {
    const { t, language } = useTranslation();
    const shortCode = language?.short_code || "en";
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Staff List selector — real DB criteria
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

    const handleSelectAllStaff = () => {
        const staffList = getResolvedStaffList();
        if (selectedStaffIds.length === staffList.length) {
            setSelectedStaffIds([]);
        } else {
            setSelectedStaffIds(staffList.map(s => s.id));
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
        const list: any[] = [];
        if (item.creator) {
            list.push({
                name: `${item.creator.name} ${item.creator.last_name ?? ''}`.trim(),
                role: item.creator.role || t("host"),
                id: item.creator.employee_id || item.created_by,
                last_join: formatDisplayDateTime(item.date_time),
            });
        }
        setActiveJoinList(list);
        setJoinModalOpen(true);
    };

    // Date time parser helper to format as DD/MM/YYYY HH:MM
    const formatDisplayDateTime = (dtStr: string) => {
        try {
            const d = new Date(dtStr);
            if (isNaN(d.getTime())) return dtStr;
            const pad = (n: number) => n.toString().padStart(2, '0');
            const dd = toLocaleNumber(pad(d.getDate()), shortCode);
            const mm = toLocaleNumber(pad(d.getMonth() + 1), shortCode);
            const yyyy = toLocaleNumber(d.getFullYear().toString(), shortCode);
            const timeStr = toLocaleNumber(formatTime(d, tf), shortCode);
            return (
                <div className="flex flex-col text-slate-700 dark:text-slate-200 text-xs font-medium leading-tight">
                    <span>{`${dd}/${mm}/${yyyy}`}</span>
                    <span className="text-gray-400 dark:text-gray-400 text-[11px] mt-0.5">{timeStr}</span>
                </div>
            );
        } catch {
            return dtStr;
        }
    };

    // Export helpers
    const exportData = meetings.map(item => ({
        [t("meeting_title")]: item.title || "—",
        [t("description")]: item.description || "—",
        [t("meeting_date_time")]: item.date_time || "—",
        [t("meeting_duration_minutes")]: item.duration,
        [t("created_by")]: item.creator ? `${item.creator.name} ${item.creator.last_name || ""} (${item.creator.role || ""})` : t("self"),
        [t("status")]: t(item.status || "awaited")
    }));

    const handleCopy = () => {
        if (meetings.length === 0) {
            toast.info(t("no_data_found"));
            return;
        }
        const text = meetings.map(i => `${i.title}\t${i.description || ""}\t${i.date_time}\t${i.duration}\t${i.creator?.name || t("self")}\t${i.status}`).join('\n');
        navigator.clipboard.writeText(text);
        toast.success(t("data_copied_to_clipboard"));
    };

    const handleExportExcel = () => {
        if (meetings.length === 0) {
            toast.info(t("no_data_found"));
            return;
        }
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, t("live_meeting") || "LiveMeetings");
        XLSX.writeFile(wb, "gmeet_live_meetings.xlsx");
        toast.success(t("exported_to_excel"));
    };

    const handleExportCSV = () => {
        if (meetings.length === 0) {
            toast.info(t("no_data_found"));
            return;
        }
        const ws = XLSX.utils.json_to_sheet(exportData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "gmeet_live_meetings.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t("exported_to_csv"));
    };

    const handleExportPDF = () => {
        if (meetings.length === 0) {
            toast.info(t("no_data_found"));
            return;
        }
        const doc = new jsPDF("landscape");
        doc.text(t("live_meeting"), 14, 15);
        autoTable(doc, {
            head: [[t("meeting_title"), t("description"), t("meeting_date_time"), t("meeting_duration_minutes"), t("created_by"), t("status")]],
            body: meetings.map(i => [
                i.title || "—",
                i.description || "—",
                i.date_time || "—",
                i.duration,
                i.creator ? `${i.creator.name} ${i.creator.last_name || ""}` : t("self"),
                t(i.status || "awaited")
            ]),
            startY: 20,
        });
        doc.save("gmeet_live_meetings.pdf");
        toast.success(t("exported_to_pdf"));
    };

    const toolbarActions = [
        { Icon: Copy, onClick: handleCopy, title: t("copy") },
        { Icon: FileSpreadsheet, onClick: handleExportExcel, title: t("excel") },
        { Icon: FileText, onClick: handleExportCSV, title: t("csv") },
        { Icon: FileCode, onClick: handleExportPDF, title: t("pdf") || "PDF" },
        { Icon: Printer, onClick: () => window.print(), title: t("print") },
        { Icon: Columns, onClick: () => {}, title: t("columns") },
    ];

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
        <div className="space-y-6">
            
            {/* Gradient card header */}
            <div className="rounded-xl border-[0.5px] border-gray-300 dark:border-zinc-800 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-zinc-900 dark:to-zinc-950 dark:border-b dark:border-zinc-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Video className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">{t("live_meeting")}</h1>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{t("host_google_meet_sessions_with_staff")}</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => { resetForm(); setOpen(true); }}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-5 h-9 text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border-0"
                    >
                        <Plus className="h-4 w-4" />
                        {t("add_live_meeting")}
                    </Button>
                </div>
            </div>

            {/* Table Card Panel */}
            <div className="bg-white dark:bg-card/40 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-5 space-y-4 overflow-hidden min-h-[500px]">

                {/* Table Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 border-b border-gray-100 dark:border-zinc-800 pb-4">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <Input
                            placeholder={t("search_placeholder") || t("search")}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-9 h-9 text-xs border-gray-200 dark:border-zinc-800 focus-visible:ring-indigo-500 rounded-md"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{t("rows")}</span>
                            <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                <SelectTrigger className="w-[72px] h-9 text-xs bg-white dark:bg-card border border-gray-200 dark:border-zinc-800">
                                    <SelectValue placeholder={toLocaleNumber("50", shortCode)}>
                                        {toLocaleNumber(itemsPerPage, shortCode)}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">{toLocaleNumber("10", shortCode)}</SelectItem>
                                    <SelectItem value="25">{toLocaleNumber("25", shortCode)}</SelectItem>
                                    <SelectItem value="50">{toLocaleNumber("50", shortCode)}</SelectItem>
                                    <SelectItem value="100">{toLocaleNumber("100", shortCode)}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center border rounded-md p-0.5 bg-white/90 dark:bg-card border-gray-200 dark:border-zinc-800 shadow-xs text-gray-500">
                            {toolbarActions.map((action, i) => (
                                <Button key={i} variant="ghost" size="icon" onClick={action.onClick} title={action.title} className="h-7 w-7 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded">
                                    <action.Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-md border border-gray-200 dark:border-zinc-800 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1100px]">
                        <TableHeader className="bg-gray-50 dark:bg-zinc-900/50 text-xs uppercase">
                            <TableRow className="hover:bg-transparent whitespace-nowrap text-gray-600 dark:text-gray-300">
                                <TableHead className="py-3 px-4 font-semibold">{t("meeting_title")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 font-semibold">{t("description")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 font-semibold">{t("meeting_date_time")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 font-semibold text-center">{t("meeting_duration_minutes")}</TableHead>
                                <TableHead className="py-3 px-4 font-semibold">{t("created_by")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 font-semibold text-center">{t("status")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 font-semibold text-right">{t("action")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i} className="border-b border-gray-50 dark:border-zinc-800/50">
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <TableCell key={j} className="py-3 px-4">
                                                <div className="h-3 w-full max-w-[120px] rounded bg-gray-200/70 dark:bg-zinc-800 animate-pulse" />
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
                                    <TableRow key={item.id || idx} className="text-xs border-b border-gray-100 dark:border-zinc-800/60 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap">
                                        <TableCell className="py-3.5 px-4 text-gray-800 dark:text-gray-200 font-semibold cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" onClick={() => handleEdit(item)}>
                                            {item.title}
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 text-gray-500 dark:text-gray-400 max-w-[250px] truncate" title={item.description}>
                                            {item.description || "—"}
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4">{formatDisplayDateTime(item.date_time)}</TableCell>
                                        <TableCell className="py-3.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                                            {toLocaleNumber(item.duration, shortCode)}
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 text-gray-700 dark:text-gray-300">
                                            {item.creator
                                                ? `${item.creator.name} ${item.creator.last_name ?? ''} (${translateRoleName(item.creator.role || "Staff", shortCode)} : ${toLocaleNumber(item.creator.employee_id || item.created_by, shortCode)})`
                                                : t("self")}
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 text-center">
                                            <Select value={item.status || "awaited"} onValueChange={(val) => handleStatusChange(item.id, val)}>
                                                <SelectTrigger className="h-7 w-28 text-xs font-semibold bg-white dark:bg-card border-gray-200 dark:border-zinc-800 rounded mx-auto shadow-none">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded shadow-xl">
                                                    <SelectItem value="awaited" className="text-amber-600 dark:text-amber-400 font-medium">{t("awaited")}</SelectItem>
                                                    <SelectItem value="finished" className="text-emerald-600 dark:text-emerald-400 font-medium">{t("finished")}</SelectItem>
                                                    <SelectItem value="cancelled" className="text-rose-600 dark:text-rose-400 font-medium">{t("cancelled")}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 text-right">
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
                                                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-3 h-7 text-xs font-bold rounded-md shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                                    title={t("start")}
                                                >
                                                    <Video className="h-3.5 w-3.5" />
                                                    {t("start")}
                                                </Button>

                                                {/* Join List */}
                                                <Button
                                                    onClick={() => handleOpenJoinList(item)}
                                                    className="h-7 w-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md p-0 shadow-sm active:scale-95 transition-all"
                                                    title={t("view_join_list")}
                                                >
                                                    <List className="h-3.5 w-3.5" />
                                                </Button>

                                                {/* Edit */}
                                                <Button 
                                                    onClick={() => handleEdit(item)}
                                                    className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded-md p-0 shadow-sm active:scale-95 transition-all"
                                                    title={t("edit_live_meeting")}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>

                                                {/* Delete */}
                                                <Button 
                                                    onClick={() => setDeleteId(item.id)}
                                                    className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-md p-0 shadow-sm active:scale-95 transition-all"
                                                    title={t("delete_live_meeting")}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-3 border-t border-gray-100 dark:border-zinc-800">
                    <div>
                        {t("showing_x_to_y_of_z", { 
                            from: toLocaleNumber(totalEntries > 0 ? startIndex + 1 : 0, shortCode), 
                            to: toLocaleNumber(Math.min(startIndex + sizeNum, totalEntries), shortCode), 
                            total: toLocaleNumber(totalEntries, shortCode) 
                        })}
                        {searchTerm && ` (${t("filtered_from_total_entries", { total: toLocaleNumber(totalEntries, shortCode) })})`}
                    </div>

                    {totalEntries > 0 && (
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={safePage === 1}
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                className="h-8 w-8 p-0 rounded-[10px] bg-white dark:bg-card border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-300 shadow-sm disabled:opacity-40"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <Button
                                    key={page}
                                    size="sm"
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "h-8 w-8 p-0 rounded-[10px] text-xs font-bold shadow-sm transition-all",
                                        safePage === page
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md"
                                            : "bg-white dark:bg-card text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800"
                                    )}
                                >
                                    {toLocaleNumber(page, shortCode)}
                                </Button>
                            ))}

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={safePage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                className="h-8 w-8 p-0 rounded-[10px] bg-white dark:bg-card border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-300 shadow-sm disabled:opacity-40"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-[780px] p-0 overflow-hidden bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 shadow-2xl rounded-2xl">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-zinc-900 dark:to-zinc-950 border-b border-gray-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Video className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                                <DialogTitle className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
                                    {editMode ? t("edit_live_meeting") : t("add_live_meeting")}
                                </DialogTitle>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                    {t("host_google_meet_sessions_with_staff")}
                                </p>
                            </div>
                        </div>
                        <Button 
                            variant="ghost"
                            size="icon"
                            onClick={() => setOpen(false)} 
                            className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Dual panel Grid */}
                    <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-6 text-xs max-h-[75vh] overflow-y-auto custom-scrollbar">
                        
                        {/* Left Column - Form Fields (3/5) */}
                        <div className="md:col-span-3 space-y-4">
                            {/* Title */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("meeting_title")} <span className="text-red-500">*</span></Label>
                                <Input 
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    className="h-9 border-gray-200 dark:border-zinc-800 focus-visible:ring-indigo-500 text-xs rounded-lg" 
                                />
                            </div>

                            {/* Date/Time + Duration */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("meeting_date_time")} <span className="text-red-500">*</span></Label>
                                    <DateTimePicker 
                                        value={formData.date_time}
                                        onChange={(val) => setFormData({...formData, date_time: val})}
                                        placeholder={t("select_date_and_time") || "DD/MM/YYYY HH:MM"}
                                        className="h-9 text-xs rounded-lg"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("meeting_duration_minutes")} <span className="text-red-500">*</span></Label>
                                    <Input 
                                        type="number"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 0})}
                                        placeholder="45"
                                        className="h-9 border-gray-200 dark:border-zinc-800 focus-visible:ring-indigo-500 text-xs rounded-lg" 
                                    />
                                </div>
                            </div>

                            {/* Gmeet URL */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                                    <span>
                                        {t("gmeet_url")} ({t("how_to_get")}{" "}
                                        <a href="https://meet.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold">
                                            {t("gmeet_url")}
                                        </a>? ) <span className="text-red-500">*</span>
                                    </span>
                                </div>
                                <Input 
                                    value={formData.meeting_url}
                                    onChange={(e) => setFormData({...formData, meeting_url: e.target.value})}
                                    placeholder="https://meet.google.com/..."
                                    className="h-9 border-gray-200 dark:border-zinc-800 focus-visible:ring-indigo-500 text-xs rounded-lg" 
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("description")}</Label>
                                <Textarea 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    rows={3}
                                    className="border-gray-200 dark:border-zinc-800 text-xs rounded-lg resize-none p-3" 
                                />
                            </div>
                        </div>

                        {/* Right Column - Staff List (2/5) */}
                        <div className="md:col-span-2 space-y-2 flex flex-col">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("staff_list")} <span className="text-red-500">*</span></Label>
                                {resolvedStaffList.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleSelectAllStaff}
                                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
                                    >
                                        {selectedStaffIds.length === resolvedStaffList.length ? t("deselect_all") || "Deselect All" : t("select_all") || "Select All"}
                                    </button>
                                )}
                            </div>
                            
                            <div className="border border-gray-200 dark:border-zinc-800 rounded-xl p-3.5 flex-1 min-h-[220px] max-h-[300px] overflow-y-auto space-y-2.5 custom-scrollbar bg-gray-50/50 dark:bg-card/50">
                                {resolvedStaffList.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full py-8 text-gray-400 text-xs">
                                        <Users className="h-6 w-6 mb-1 opacity-50" />
                                        <span>{t("no_staff_members_found") || "No staff members found"}</span>
                                    </div>
                                ) : (
                                    resolvedStaffList.map((staff, idx) => (
                                        <label key={staff.id || idx} className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-gray-200 cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-zinc-800/60 p-1.5 rounded-lg transition-colors">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedStaffIds.includes(staff.id)}
                                                onChange={() => handleToggleStaff(staff.id)}
                                                className="h-3.5 w-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 accent-indigo-600 mt-0.5 cursor-pointer"
                                            />
                                            <span className="leading-tight">
                                                {staff.name} <span className="text-gray-500 dark:text-gray-400 font-normal">({translateRoleName(staff.role, shortCode)} : {toLocaleNumber(staff.code, shortCode)})</span>
                                            </span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50/80 dark:bg-zinc-900 px-5 py-3.5 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-2">
                        <Button 
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="h-9 px-5 rounded-full text-xs font-bold"
                        >
                            {t("cancel")}
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            disabled={submitting}
                            className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all"
                        >
                            <Save className="h-4 w-4" /> {submitting ? t("saving") : (editMode ? t("update") : t("save"))}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(isOpen) => !isOpen && setDeleteId(null)}>
                <AlertDialogContent className="sm:max-w-[400px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("delete_live_meeting")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("are_you_sure_permanently_delete_meeting")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full text-xs h-9 px-5">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-red-500 hover:bg-red-600 rounded-full text-xs h-9 px-5 text-white">
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Join List Modal */}
            <Dialog open={joinModalOpen} onOpenChange={setJoinModalOpen}>
                <DialogContent className="max-w-[800px] p-0 overflow-hidden bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 shadow-2xl rounded-2xl">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-zinc-900 dark:to-zinc-950 border-b border-gray-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Users className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                                <DialogTitle className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
                                    {t("join_list")}
                                </DialogTitle>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                    {t("live_meeting")}
                                </p>
                            </div>
                        </div>
                        <Button 
                            variant="ghost"
                            size="icon"
                            onClick={() => setJoinModalOpen(false)} 
                            className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Table Toolbar */}
                    <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-100 dark:border-zinc-800">
                        <div className="relative w-full md:w-56">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                                placeholder={t("search_placeholder") || t("search")}
                                value={joinSearchTerm}
                                onChange={(e) => setJoinSearchTerm(e.target.value)}
                                className="pl-9 h-9 text-xs border-gray-200 dark:border-zinc-800 focus-visible:ring-indigo-500 rounded-md"
                            />
                        </div>
                    </div>

                    {/* Modal Grid content */}
                    <div className="p-5 space-y-4 max-h-[55vh] overflow-y-auto custom-scrollbar">
                        <div className="rounded-md border border-gray-200 dark:border-zinc-800 overflow-x-auto">
                            <Table className="min-w-[700px]">
                                <TableHeader className="bg-gray-50 dark:bg-zinc-900/50 text-xs uppercase">
                                    <TableRow className="hover:bg-transparent whitespace-nowrap text-gray-600 dark:text-gray-300">
                                        <TableHead className="py-3 px-4 font-semibold">{t("staff")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                        <TableHead className="py-3 px-4 font-semibold text-right">{t("last_join")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredJoinList.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-10 text-gray-400 uppercase text-[10px] tracking-wider">
                                                {t("no_session_join_records")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredJoinList.map((user, uidx) => (
                                            <TableRow key={uidx} className="text-xs border-b border-gray-100 dark:border-zinc-800/60 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 whitespace-nowrap">
                                                <TableCell className="py-3 px-4 text-gray-800 dark:text-gray-200 font-semibold">
                                                    {user.name} <span className="text-gray-500 dark:text-gray-400 font-normal">({translateRoleName(user.role, shortCode)} : {toLocaleNumber(user.id, shortCode)})</span>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right text-gray-600 dark:text-gray-300 font-medium">
                                                    {user.last_join}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Modal Footer pagination */}
                        <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2">
                            <div>
                                {t("showing_x_to_y_of_z", { 
                                    from: toLocaleNumber(filteredJoinList.length > 0 ? 1 : 0, shortCode), 
                                    to: toLocaleNumber(filteredJoinList.length, shortCode), 
                                    total: toLocaleNumber(filteredJoinList.length, shortCode) 
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50/80 dark:bg-zinc-900 px-5 py-3 border-t border-gray-100 dark:border-zinc-800 flex justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setJoinModalOpen(false)}
                            className="h-8 px-4 rounded-full text-xs font-semibold"
                        >
                            {t("close")}
                        </Button>
                    </div>

                </DialogContent>
            </Dialog>

        </div>
    );
}
