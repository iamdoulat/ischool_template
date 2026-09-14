"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Copy, FileSpreadsheet, FileText, FileCode, Printer, Columns,
    ChevronLeft, ChevronRight, Search, ArrowUpDown, List, X, Plus, Pencil, Trash2, Video, Users
} from "lucide-react";
import { cn, formatTime, toLocaleNumber, translateClassName, translateSectionName, translateRoleName } from "@/lib/utils";
import { useSettings } from "@/components/providers/settings-provider";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface LiveClass {
    id: string;
    title: string;
    description: string;
    date_time: string;
    duration: number;
    api_used: string;
    created_by: string;
    staff_id: string;
    class_id: string;
    section_id: string;
    status: string;
    creator?: { name: string; last_name: string; employee_id?: string; role?: string; id?: number };
    staff?: { name: string; last_name: string; employee_id?: string; role?: string; id?: number };
    school_class?: { id: number; name: string; sections?: any[] };
    section?: { id: number; name: string };
    total_join?: number;
    join_url?: string;
}

export default function LiveClassesPage() {
    const { t, language } = useTranslation();
    const shortCode = language?.short_code || "en";
    const { settings } = useSettings();
    const tf = settings?.time_format === "12" ? "12" : "24" as const;

    const [searchTerm, setSearchTerm] = useState("");
    const [classes, setClasses] = useState<LiveClass[]>([]);
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
        class_id: "",
        section_id: "",
        staff_id: "",
        api_used: "Global"
    });

    // Dropdown criteria
    const [criteria, setCriteria] = useState<{ classes: any[], staff: any[] }>({ classes: [], staff: [] });

    // Delete dialog state
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Join List Modal state
    const [joinModalOpen, setJoinModalOpen] = useState(false);
    const [joinSearchTerm, setJoinSearchTerm] = useState("");
    const [activeJoinList, setActiveJoinList] = useState<any[]>([]);

    useEffect(() => {
        fetchCriteria();
    }, []);

    useEffect(() => {
        fetchClasses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, itemsPerPage, searchTerm]);

    const fetchCriteria = async () => {
        try {
            const response = await api.get('/conference/live-classes/criteria');
            setCriteria(response.data || { classes: [], staff: [] });
        } catch (error) {
            console.error("Failed to fetch criteria", error);
        }
    };

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const response = await api.get('/conference/live-classes', {
                params: {
                    page: currentPage,
                    per_page: itemsPerPage,
                    search: searchTerm
                }
            });
            if (response.data && response.data.data) {
                setClasses(response.data.data || []);
                setTotalEntries(response.data.total || 0);
            } else {
                setClasses(response.data || []);
                setTotalEntries(response.data.length || 0);
            }
        } catch (error) {
            console.error("Failed to fetch classes", error);
            toast.error(t("failed_to_load_live_classes"));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title || !formData.date_time || !formData.class_id || !formData.section_id || !formData.staff_id) {
            toast.error(t("please_fill_in_all_required_fields") || t("required"));
            return;
        }

        setSubmitting(true);
        try {
            if (editMode && selectedId) {
                await api.put(`/conference/live-classes/${selectedId}`, formData);
                toast.success(t("live_class_updated_successfully"));
            } else {
                await api.post('/conference/live-classes', formData);
                toast.success(t("live_class_scheduled_successfully"));
            }
            setOpen(false);
            resetForm();
            fetchClasses();
        } catch (error) {
            console.error("Failed to save class", error);
            toast.error(t("failed_to_save_live_class"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (item: LiveClass) => {
        setEditMode(true);
        setSelectedId(item.id);
        setFormData({
            title: item.title,
            description: item.description || "",
            date_time: item.date_time,
            duration: item.duration || 45,
            class_id: item.class_id ? item.class_id.toString() : "",
            section_id: item.section_id ? item.section_id.toString() : "",
            staff_id: item.staff_id ? item.staff_id.toString() : "",
            api_used: item.api_used || "Global"
        });
        setOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/conference/live-classes/${deleteId}`);
            toast.success(t("live_class_expunged_successfully"));
            fetchClasses();
        } catch (error) {
            console.error("Failed to delete", error);
            toast.error(t("failed_to_expunge_live_class"));
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
            class_id: "",
            section_id: "",
            staff_id: "",
            api_used: "Global"
        });
    };

    const handleOpenJoinList = (item: LiveClass) => {
        const list: any[] = [];
        if (item.staff) {
            list.push({
                name: `${item.staff.name} ${item.staff.last_name ?? ''}`.trim(),
                role: item.staff.role || t("teacher"),
                id: item.staff.employee_id || item.staff.id || item.staff_id,
                last_join: formatDisplayDateTime(item.date_time),
            });
        }
        if (item.creator) {
            list.push({
                name: `${item.creator.name} ${item.creator.last_name ?? ''}`.trim(),
                role: item.creator.role || (item.creator.employee_id ? t("host") : t("admin")),
                id: item.creator.employee_id || item.creator.id || item.created_by,
                last_join: formatDisplayDateTime(item.date_time),
            });
        }
        setActiveJoinList(list);
        setJoinModalOpen(true);
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await api.put(`/conference/live-classes/${id}`, { status: newStatus });
            toast.success(t("status_updated_successfully") || t("success"));
            setClasses(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
        } catch (error) {
            console.error("Failed to update status", error);
            toast.error(t("failed_to_update_status"));
        }
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
    const exportData = classes.map(item => ({
        [t("class_title")]: item.title || "—",
        [t("description")]: item.description || "—",
        [t("date_time")]: item.date_time || "—",
        [t("class_duration_minutes")]: item.duration || 45,
        [t("created_by")]: item.creator ? `${item.creator.name} ${item.creator.last_name || ""}` : "—",
        [t("teacher")]: item.staff ? `${item.staff.name} ${item.staff.last_name || ""}` : "—",
        [t("class")]: item.school_class ? `${item.school_class.name} (${item.section?.name || ""})` : "—",
        [t("api_used")]: item.api_used === "Global" ? t("global") : t("self"),
        [t("status")]: t(item.status || "awaited")
    }));

    const handleCopy = () => {
        if (classes.length === 0) {
            toast.info(t("no_data_found"));
            return;
        }
        const text = classes.map(i => `${i.title}\t${i.description || ""}\t${i.date_time}\t${i.duration}\t${i.school_class?.name || ""}\t${i.staff?.name || ""}\t${i.api_used}\t${i.status}`).join('\n');
        navigator.clipboard.writeText(text);
        toast.success(t("data_copied_to_clipboard"));
    };

    const handleExportExcel = () => {
        if (classes.length === 0) {
            toast.info(t("no_data_found"));
            return;
        }
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, t("live_classes") || "Classes");
        XLSX.writeFile(wb, "zoom_live_classes.xlsx");
        toast.success(t("exported_to_excel"));
    };

    const handleExportCSV = () => {
        if (classes.length === 0) {
            toast.info(t("no_data_found"));
            return;
        }
        const ws = XLSX.utils.json_to_sheet(exportData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "zoom_live_classes.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t("exported_to_csv"));
    };

    const handleExportPDF = () => {
        if (classes.length === 0) {
            toast.info(t("no_data_found"));
            return;
        }
        const doc = new jsPDF("landscape");
        doc.text(t("live_classes"), 14, 15);
        autoTable(doc, {
            head: [[t("class_title"), t("description"), t("date_time"), t("class_duration_minutes"), t("created_by"), t("class"), t("api_used"), t("status")]],
            body: classes.map(i => [
                i.title || "—",
                i.description || "—",
                i.date_time || "—",
                i.duration || 45,
                i.creator?.name || "—",
                i.school_class?.name || "—",
                i.api_used === "Global" ? t("global") : t("self"),
                t(i.status || "awaited")
            ]),
            startY: 20,
        });
        doc.save("zoom_live_classes.pdf");
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

    const selectedClassObj = criteria.classes.find(c => c.id.toString() === formData.class_id);
    const classSections = selectedClassObj?.sections || [];

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
                            <h1 className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">{t("live_classes")}</h1>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{t("schedule_and_manage_zoom_live_classes")}</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => { resetForm(); setOpen(true); }}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-5 h-9 text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border-0"
                    >
                        <Plus className="h-4 w-4" />
                        {t("add_live_class") || t("add")}
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

                {/* Table Area */}
                <div className="rounded-md border border-gray-200 dark:border-zinc-800 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1200px]">
                        <TableHeader className="bg-gray-50 dark:bg-zinc-900/50 text-xs uppercase">
                            <TableRow className="hover:bg-transparent whitespace-nowrap text-gray-600 dark:text-gray-300">
                                <TableHead className="py-3 px-4 font-semibold">{t("class_title")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 font-semibold">{t("description")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 font-semibold">{t("date_time")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 font-semibold text-center">{t("class_duration_minutes")}</TableHead>
                                <TableHead className="py-3 px-4 font-semibold">{t("created_by")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 font-semibold">{t("teacher")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 font-semibold">{t("class")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 font-semibold">{t("api_used")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 font-semibold text-center">{t("status")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 font-semibold text-right">{t("action")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i} className="border-b border-gray-50 dark:border-zinc-800/50">
                                        {Array.from({ length: 10 }).map((_, j) => (
                                            <TableCell key={j} className="py-3 px-4">
                                                <div className="h-3 w-full max-w-[120px] rounded bg-gray-200/70 dark:bg-zinc-800 animate-pulse" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : classes.length === 0 ? (
                                <TableRow className="hover:bg-transparent h-64">
                                    <TableCell colSpan={10} className="text-center py-12 text-gray-400 font-bold uppercase text-xs tracking-widest">
                                        {t("no_virtual_class_sessions_scheduled")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                classes.map((item, idx) => (
                                    <TableRow key={item.id || idx} className="text-xs border-b border-gray-100 dark:border-zinc-800/60 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap">
                                        <TableCell className="py-3.5 px-4 text-gray-800 dark:text-gray-200 font-semibold cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" onClick={() => handleEdit(item)}>
                                            {item.title}
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 text-gray-500 dark:text-gray-400 max-w-[200px] truncate" title={item.description}>
                                            {item.description || "—"}
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4">{formatDisplayDateTime(item.date_time)}</TableCell>
                                        <TableCell className="py-3.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                                            {toLocaleNumber(item.duration, shortCode)}
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 text-gray-700 dark:text-gray-300">
                                            {item.creator
                                                ? `${item.creator.name} ${item.creator.last_name ?? ''} (${translateRoleName(item.creator.role || "Admin", shortCode)} : ${toLocaleNumber(item.creator.employee_id || item.creator.id || item.created_by, shortCode)})`
                                                : <span className="text-gray-400 italic">—</span>}
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 text-gray-700 dark:text-gray-300">
                                            {item.staff
                                                ? `${item.staff.name} ${item.staff.last_name ?? ''} (${translateRoleName(item.staff.role || "Teacher", shortCode)} : ${toLocaleNumber(item.staff.employee_id || item.staff.id || item.staff_id, shortCode)})`
                                                : <span className="text-gray-400 italic">—</span>}
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4">
                                            <div className="flex flex-col gap-0.5 text-xs text-gray-700 dark:text-gray-300 font-medium">
                                                <span>{translateClassName(item.school_class?.name, shortCode)} {item.section?.name && `(${translateSectionName(item.section.name.replace('SECTION - ', ''), shortCode)})`}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 text-gray-700 dark:text-gray-300 font-medium">
                                            {item.api_used === "Global" ? t("global") : t("self")}
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
                                            <div className="flex items-center justify-end gap-1.5 ml-auto">
                                                {/* Start Meeting */}
                                                <Button 
                                                    onClick={() => {
                                                        if (item.join_url) {
                                                            window.open(item.join_url, '_blank');
                                                        } else {
                                                            toast.error(t("no_join_meeting_url_configured") || "No meeting URL");
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
                                                    title={t("edit_live_class")}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>

                                                {/* Delete */}
                                                <Button 
                                                    onClick={() => setDeleteId(item.id)}
                                                    className="h-7 w-7 bg-rose-500 hover:bg-rose-600 text-white rounded-md p-0 shadow-sm active:scale-95 transition-all"
                                                    title={t("delete")}
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

                {/* Footer Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-3 border-t border-gray-100 dark:border-zinc-800 mt-2">
                    <div>
                        {t("showing_x_to_y_of_z", {
                            from: toLocaleNumber(totalEntries > 0 ? startIndex + 1 : 0, shortCode),
                            to: toLocaleNumber(Math.min(startIndex + sizeNum, totalEntries), shortCode),
                            total: toLocaleNumber(totalEntries, shortCode)
                        })}
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={safePage === 1 || totalEntries === 0}
                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                            className="h-8 w-8 p-0 rounded-[10px] bg-white dark:bg-card border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-300 shadow-sm disabled:opacity-40"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i + 1).map(page => (
                            <Button
                                key={page}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className={cn(
                                    "h-8 w-8 p-0 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer",
                                    safePage === page
                                        ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95 border-0"
                                        : "bg-white dark:bg-card text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800"
                                )}
                            >
                                {toLocaleNumber(page, shortCode)}
                            </Button>
                        ))}

                        <Button
                            variant="outline"
                            size="sm"
                            disabled={safePage === totalPages || totalEntries === 0}
                            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                            className="h-8 w-8 p-0 rounded-[10px] bg-white dark:bg-card border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-300 shadow-sm disabled:opacity-40"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

            </div>

            {/* Add / Edit Dialog Modal */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-[650px] p-0 overflow-hidden bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 shadow-2xl rounded-2xl">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-zinc-900 dark:to-zinc-950 border-b border-gray-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Video className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                                <DialogTitle className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
                                    {editMode ? t("edit_live_class") : t("add_live_class")}
                                </DialogTitle>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                    {t("schedule_and_manage_zoom_live_classes")}
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

                    {/* Form Fields */}
                    <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar text-xs">
                        
                        {/* Title */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {t("class_title")} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder={t("enter_title") || t("class_title")}
                                className="h-9 border-gray-200 dark:border-zinc-800 focus-visible:ring-indigo-500 rounded-lg text-xs"
                            />
                        </div>

                        {/* Date Time & Duration */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    {t("date_time")} <span className="text-red-500">*</span>
                                </Label>
                                <DateTimePicker
                                    value={formData.date_time}
                                    onChange={(val) => setFormData({...formData, date_time: val})}
                                    placeholder={t("select_date_time") || "dd/MM/yyyy hh:mm a"}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    {t("duration_minutes") || t("class_duration_minutes")} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 45})}
                                    className="h-9 border-gray-200 dark:border-zinc-800 focus-visible:ring-indigo-500 rounded-lg text-xs"
                                />
                            </div>
                        </div>

                        {/* Assigned Instructor / Teacher */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {t("assigned_instructor")} <span className="text-red-500">*</span>
                            </Label>
                            <Select value={formData.staff_id} onValueChange={(val) => setFormData({...formData, staff_id: val})}>
                                <SelectTrigger className="h-9 border-gray-200 dark:border-zinc-800 text-xs rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-card">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-xl">
                                    {criteria.staff.map(st => (
                                        <SelectItem key={st.id} value={st.id.toString()}>
                                            {st.name} {st.last_name || ""} ({translateRoleName(st.role || "Teacher", shortCode)} : {toLocaleNumber(st.employee_id || st.id, shortCode)})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Class & Section Dropdowns */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    {t("class")} <span className="text-red-500">*</span>
                                </Label>
                                <Select 
                                    value={formData.class_id} 
                                    onValueChange={(val) => setFormData({...formData, class_id: val, section_id: ""})}
                                >
                                    <SelectTrigger className="h-9 border-gray-200 dark:border-zinc-800 text-xs rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-card">
                                        <SelectValue placeholder={t("select")}>
                                            {selectedClassObj ? translateClassName(selectedClassObj.name, shortCode) : t("select")}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-xl">
                                        {criteria.classes.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>
                                                {translateClassName(c.name, shortCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    {t("section")} <span className="text-red-500">*</span>
                                </Label>
                                <Select 
                                    value={formData.section_id} 
                                    onValueChange={(val) => setFormData({...formData, section_id: val})}
                                    disabled={!formData.class_id}
                                >
                                    <SelectTrigger className="h-9 border-gray-200 dark:border-zinc-800 text-xs rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-card">
                                        <SelectValue placeholder={t("select")}>
                                            {classSections.find(s => s.id.toString() === formData.section_id)
                                                ? translateSectionName(classSections.find(s => s.id.toString() === formData.section_id)?.name?.replace('SECTION - ', ''), shortCode)
                                                : t("select")}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-xl">
                                        {classSections.map(s => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {translateSectionName(s.name.replace('SECTION - ', ''), shortCode)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* API Used */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {t("api_used")}
                            </Label>
                            <Select value={formData.api_used} onValueChange={(val) => setFormData({...formData, api_used: val})}>
                                <SelectTrigger className="h-9 border-gray-200 dark:border-zinc-800 text-xs rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-card">
                                    <SelectValue placeholder={t("global")}>
                                        {formData.api_used === "Global" ? t("global") : t("self")}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-xl">
                                    <SelectItem value="Global">{t("global")}</SelectItem>
                                    <SelectItem value="Self">{t("self")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Description / Objectives */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t("description")}</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder={t("session_objectives") || t("description")}
                                className="min-h-[90px] border-gray-200 dark:border-zinc-800 focus-visible:ring-indigo-500 rounded-lg text-xs resize-none w-full p-2.5"
                            />
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 bg-gray-50/80 dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-2 text-xs">
                        <Button 
                            variant="outline" 
                            onClick={() => setOpen(false)}
                            className="h-9 px-4 font-semibold text-gray-600 dark:text-gray-300 border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full cursor-pointer"
                        >
                            {t("cancel")}
                        </Button>
                        <Button 
                            onClick={handleSave}
                            disabled={submitting}
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-6 h-9 font-bold rounded-full shadow-lg transition-all active:scale-95 border-0 cursor-pointer"
                        >
                            {submitting ? t("saving") : t("save")}
                        </Button>
                    </div>

                </DialogContent>
            </Dialog>

            {/* Join List Dialog Modal */}
            <Dialog open={joinModalOpen} onOpenChange={setJoinModalOpen}>
                <DialogContent className="max-w-[800px] p-0 overflow-hidden bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 shadow-2xl rounded-2xl">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] dark:from-zinc-900 dark:to-zinc-950 border-b border-gray-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Users className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                                <DialogTitle className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">{t("join_list")}</DialogTitle>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                    {t("live_classes")}
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
                    <div className="p-5 space-y-4 max-h-[55vh] overflow-y-auto custom-scrollbar text-xs">
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
                                                {t("no_session_join_records_matching_search_filter")}
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="max-w-[450px] p-6 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 shadow-2xl rounded-2xl text-gray-700 dark:text-gray-200 text-xs">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-800 dark:text-slate-100 text-base font-bold tracking-tight">
                            {t("delete_class") || t("delete")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed mt-2">
                            {t("are_you_sure_you_want_to_delete_this_class") || t("confirm_delete")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-2">
                        <AlertDialogCancel className="h-9 px-5 font-semibold text-gray-600 dark:text-gray-300 border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full cursor-pointer">
                            {t("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-rose-500 hover:bg-rose-600 text-white h-9 px-5 font-bold rounded-full shadow-lg transition-all active:scale-95 border-0 cursor-pointer">
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}
