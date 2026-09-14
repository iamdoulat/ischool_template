"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { toast } from "sonner";
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
    Plus, Search, ChevronLeft, ChevronRight, 
    ArrowUpDown, Video, Copy, FileSpreadsheet,
    FileText, FileCode, Printer, Columns, Pencil, Trash2, Save, X
} from "lucide-react";
import { cn, formatTime, toLocaleNumber, translateClassName, translateSectionName, translateRoleName } from "@/lib/utils";
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
    creator?: { id: number; name: string; last_name: string; role: string };
    staff?: { id: number; name: string; last_name: string; role: string };
    school_class?: { name: string; sections?: any[] };
    section?: { name: string };
}

export default function LiveClassesPage() {
    const { t, language } = useTranslation();
    const shortCode = language?.short_code || "en";
    const { settings } = useSettings();
    const tf = settings?.time_format === "12" ? "12" : "24" as const;
    const [searchTerm, setSearchTerm] = useState("");
    const [classes, setClasses] = useState<GmeetClass[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState("50");
    const [totalEntries, setTotalEntries] = useState(0);

    // Form Criteria
    const [formCriteria, setFormCriteria] = useState<{ classes: any[], staff: any[] }>({ classes: [], staff: [] });
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState("");

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
    }, []);

    useEffect(() => {
        fetchClasses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, itemsPerPage, searchTerm]);

    const fetchCriteria = async () => {
        try {
            const response = await api.get('/conference/gmeet-classes/criteria');
            setFormCriteria(response.data);
        } catch (error) {
            console.error("Failed to fetch criteria", error);
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
            if (response.data && response.data.data) {
                setClasses(response.data.data || []);
                setTotalEntries(response.data.total || 0);
            } else {
                setClasses(response.data || []);
                setTotalEntries(response.data.length || 0);
            }
        } catch (error) {
            console.error("Failed to fetch live classes", error);
            toast.error(t("failed_to_load_live_classes"));
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

    // Extract dynamic unique roles from staff members in criteria
    const uniqueRoles = Array.from(new Set(formCriteria.staff.map(s => s.role).filter(Boolean)));

    // Filter staff members based on selected role
    const filteredStaff = formCriteria.staff.filter(s => !selectedRole || s.role === selectedRole);

    const handleSave = async () => {
        if (!formData.title || !formData.date_time || !formData.class_id || !formData.section_id || !formData.staff_id || !formData.meeting_url) {
            toast.error(t("all_required_fields_must_be_populated"));
            return;
        }

        setSubmitting(true);
        const payload = { 
            ...formData, 
            created_by: formCriteria.staff[0]?.id || 1 
        };

        try {
            if (editMode && selectedId) {
                await api.put(`/conference/gmeet-classes/${selectedId}`, payload);
                toast.success(t("live_class_updated_successfully"));
            } else {
                await api.post('/conference/gmeet-classes', payload);
                toast.success(t("live_class_scheduled_successfully"));
            }
            setOpen(false);
            resetForm();
            fetchClasses();
        } catch (error) {
            console.error("Failed to save live class", error);
            toast.error(t("failed_to_save_live_class_session"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (item: GmeetClass) => {
        setEditMode(true);
        setSelectedId(item.id);
        setSelectedRole(item.staff?.role || "");
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
            toast.success(t("live_class_session_deleted_successfully"));
            fetchClasses();
        } catch (error) {
            console.error("Failed to delete live class", error);
            toast.error(t("failed_to_delete_live_class_session"));
        } finally {
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setEditMode(false);
        setSelectedId(null);
        setSelectedRole("");
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
            toast.success(t("status_updated_successfully"));
            fetchClasses();
        } catch (error) {
            console.error("Failed to update status", error);
            toast.error(t("failed_to_update_class_status"));
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
        [t("class_duration_minutes")]: item.duration,
        [t("created_by")]: item.creator ? `${item.creator.name} ${item.creator.last_name || ""} (${item.creator.role})` : "—",
        [t("created_for")]: item.staff ? `${item.staff.name} ${item.staff.last_name || ""} (${item.staff.role})` : "—",
        [t("class")]: item.school_class?.name || "—",
        [t("status")]: t(item.status || "awaited")
    }));

    const handleCopy = () => {
        if (classes.length === 0) {
            toast.info(t("no_data_found"));
            return;
        }
        const text = classes.map(i => `${i.title}\t${i.description || ""}\t${i.date_time}\t${i.duration}\t${i.creator?.name || ""}\t${i.staff?.name || ""}\t${i.status}`).join('\n');
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
        XLSX.utils.book_append_sheet(wb, ws, t("live_classes") || "LiveClasses");
        XLSX.writeFile(wb, "gmeet_live_classes.xlsx");
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
        link.setAttribute("download", "gmeet_live_classes.csv");
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
            head: [[t("class_title"), t("description"), t("date_time"), t("class_duration_minutes"), t("created_by"), t("created_for"), t("status")]],
            body: classes.map(i => [
                i.title || "—",
                i.description || "—",
                i.date_time || "—",
                i.duration,
                i.creator?.name || "—",
                i.staff?.name || "—",
                t(i.status || "awaited")
            ]),
            startY: 20,
        });
        doc.save("gmeet_live_classes.pdf");
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
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{t("schedule_manage_google_meet_live_classes")}</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => { resetForm(); setOpen(true); }}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white px-5 h-9 text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border-0"
                    >
                        <Plus className="h-4 w-4" />
                        {t("add_live_class")}
                    </Button>
                </div>
            </div>

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

                {/* Live Classes Table */}
                <div className="rounded-md border border-gray-200 dark:border-zinc-800 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1300px]">
                        <TableHeader className="bg-gray-50 dark:bg-zinc-900/50 text-xs uppercase">
                            <TableRow className="hover:bg-transparent whitespace-nowrap text-gray-600 dark:text-gray-300">
                                <TableHead className="py-3 px-4 font-semibold">{t("class_title")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 font-semibold">{t("description")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 font-semibold">{t("date_time")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 font-semibold text-center">{t("class_duration_minutes")}</TableHead>
                                <TableHead className="py-3 px-4 font-semibold">{t("created_by")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 font-semibold">{t("created_for")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 font-semibold">{t("class")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 font-semibold text-center">{t("status")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 font-semibold text-right">{t("action")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i} className="border-b border-gray-50 dark:border-zinc-800/50">
                                        {Array.from({ length: 9 }).map((_, j) => (
                                            <TableCell key={j} className="py-3 px-4">
                                                <div className="h-3 w-full max-w-[120px] rounded bg-gray-200/70 dark:bg-zinc-800 animate-pulse" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : classes.length === 0 ? (
                                <TableRow className="hover:bg-transparent h-64">
                                    <TableCell colSpan={9} className="text-center py-12 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                                        {t("no_live_classes_scheduled_yet")}
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
                                                ? `${item.creator.name} ${item.creator.last_name ?? ''} (${translateRoleName(item.creator.role, shortCode)} : ${toLocaleNumber(item.creator.id, shortCode)})`
                                                : <span className="text-gray-400 italic">—</span>}
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 text-gray-700 dark:text-gray-300">
                                            {item.staff
                                                ? `${item.staff.name} ${item.staff.last_name ?? ''} (${translateRoleName(item.staff.role, shortCode)} : ${toLocaleNumber(item.staff.id, shortCode)})`
                                                : "—"}
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4">
                                            <div className="flex flex-col gap-0.5 text-xs text-gray-700 dark:text-gray-300">
                                                {item.school_class?.sections?.map((sec: any) => {
                                                    const isChecked = sec.id === parseInt(item.section_id, 10);
                                                    return (
                                                        <div key={sec.id} className="flex items-center gap-1.5">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={isChecked} 
                                                                readOnly 
                                                                className="h-3.5 w-3.5 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 pointer-events-none" 
                                                            />
                                                            <span>{translateClassName(item.school_class?.name, shortCode)} ({translateSectionName(sec.name.replace('SECTION - ', ''), shortCode)})</span>
                                                        </div>
                                                    );
                                                })}
                                                {!item.school_class?.sections && item.school_class && (
                                                    <div className="flex items-center gap-1.5">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={true} 
                                                            readOnly 
                                                            className="h-3.5 w-3.5 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 pointer-events-none" 
                                                        />
                                                        <span>{translateClassName(item.school_class?.name, shortCode)} ({translateSectionName(item.section?.name || 'A', shortCode)})</span>
                                                    </div>
                                                )}
                                            </div>
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
                                                <Button 
                                                    onClick={() => {
                                                        if (item.meeting_url) {
                                                            window.open(item.meeting_url, '_blank');
                                                        } else {
                                                            toast.error(t("no_join_meeting_url_configured"));
                                                        }
                                                    }}
                                                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-3 h-7 text-xs font-bold rounded-md shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                                >
                                                    <Video className="h-3.5 w-3.5" />
                                                    {t("start")}
                                                </Button>
                                                <Button 
                                                    onClick={() => handleEdit(item)}
                                                    className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded-md p-0 shadow-sm active:scale-95 transition-all"
                                                    title={t("edit_live_class")}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button 
                                                    onClick={() => setDeleteId(item.id)}
                                                    className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-md p-0 shadow-sm active:scale-95 transition-all"
                                                    title={t("delete_class")}
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
                <DialogContent className="max-w-[560px] p-0 overflow-hidden bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 shadow-2xl rounded-2xl">
                    
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
                                    {t("schedule_manage_google_meet_live_classes")}
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
                    <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                        
                        {/* Class Title */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("class_title")} <span className="text-red-500">*</span></Label>
                            <Input 
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder=""
                                className="h-9 border-gray-200 dark:border-zinc-800 focus-visible:ring-indigo-500 text-xs rounded-lg" 
                            />
                        </div>

                        {/* Class Date & Duration */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("class_date")} <span className="text-red-500">*</span></Label>
                                <DateTimePicker 
                                    value={formData.date_time}
                                    onChange={(val) => setFormData({...formData, date_time: val})}
                                    placeholder={t("select_date_and_time") || "DD/MM/YYYY HH:MM"}
                                    className="h-9 text-xs rounded-lg"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("class_duration_minutes")} <span className="text-red-500">*</span></Label>
                                <Input 
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 0})}
                                    placeholder="45"
                                    className="h-9 border-gray-200 dark:border-zinc-800 focus-visible:ring-indigo-500 text-xs rounded-lg" 
                                />
                            </div>
                        </div>

                        {/* Role Select */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("role")} <span className="text-red-500">*</span></Label>
                            <Select value={selectedRole} onValueChange={(val) => { setSelectedRole(val); setFormData({...formData, staff_id: ""}); }}>
                                <SelectTrigger className="h-9 border-gray-200 dark:border-zinc-800 text-xs rounded-lg shadow-none text-gray-700 dark:text-gray-200 bg-white dark:bg-card">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-xl">
                                    {uniqueRoles.map(role => (
                                        <SelectItem key={role} value={role}>{translateRoleName(role, shortCode) || role}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Staff Select */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("staff")} <span className="text-red-500">*</span></Label>
                            <Select value={formData.staff_id} onValueChange={(val) => setFormData({...formData, staff_id: val})}>
                                <SelectTrigger className="h-9 border-gray-200 dark:border-zinc-800 text-xs rounded-lg shadow-none text-gray-700 dark:text-gray-200 bg-white dark:bg-card">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-xl">
                                    {filteredStaff.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>
                                            {s.name} {s.last_name || ""} ({translateRoleName(s.role, shortCode)} : {toLocaleNumber(s.id, shortCode)})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Class Select */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("class")} <span className="text-red-500">*</span></Label>
                            <Select value={formData.class_id} onValueChange={(val) => setFormData({...formData, class_id: val, section_id: ""})}>
                                <SelectTrigger className="h-9 border-gray-200 dark:border-zinc-800 text-xs rounded-lg shadow-none text-gray-700 dark:text-gray-200 bg-white dark:bg-card">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-xl">
                                    {formCriteria.classes.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            {translateClassName(c.name, shortCode)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Section Select */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("section")} <span className="text-red-500">*</span></Label>
                            <Select value={formData.section_id} onValueChange={(val) => setFormData({...formData, section_id: val})}>
                                <SelectTrigger className="h-9 border-gray-200 dark:border-zinc-800 text-xs rounded-lg shadow-none text-gray-700 dark:text-gray-200 bg-white dark:bg-card">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-xl">
                                    {formSections.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>
                                            {translateSectionName(s.name.replace('SECTION - ', ''), shortCode)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                placeholder=""
                                rows={3}
                                className="border-gray-200 dark:border-zinc-800 text-xs rounded-lg resize-none" 
                            />
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
                        <AlertDialogTitle>{t("delete_class")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("permanently_delete_live_class_session")}
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
        </div>
    );
}
