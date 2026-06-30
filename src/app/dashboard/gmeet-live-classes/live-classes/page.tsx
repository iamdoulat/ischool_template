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
import { 
    Plus, Search, ChevronLeft, ChevronRight, 
    ArrowUpDown, Video, Copy, FileSpreadsheet,
    FileBox, Printer, Columns, Calendar, X
} from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import { useSettings } from "@/components/providers/settings-provider";
import {
    Dialog,
    DialogContent,
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
    creator?: { id: number; name: string; last_name: string; role: string };
    staff?: { id: number; name: string; last_name: string; role: string };
    school_class?: { name: string; sections?: any[] };
    section?: { name: string };
}

export default function LiveClassesPage() {
    const { t } = useTranslation();
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
        // Default creator id
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

    // Date time parser helper to format as MM/DD/YYYY HH:MM:SS
    const formatDateTime = (dtStr: string) => {
        try {
            const d = new Date(dtStr);
            if (isNaN(d.getTime())) return dtStr;
            const pad = (n: number) => n.toString().padStart(2, '0');
            const mm = pad(d.getMonth() + 1);
            const dd = pad(d.getDate());
            const yyyy = d.getFullYear();
            const timeStr = formatTime(d, tf);
            return (
                <div className="flex flex-col text-slate-600 text-[11px] leading-tight">
                    <span>{`${mm}/${dd}/${yyyy}`}</span>
                    <span className="text-gray-400 mt-0.5">{timeStr}</span>
                </div>
            );
        } catch {
            return dtStr;
        }
    };

    // Calculate pagination variables
    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;

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
                            <h1 className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("live_classes")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{t("schedule_manage_google_meet_live_classes")}</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => { resetForm(); setOpen(true); }}
                        className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white px-4 h-9 text-xs font-bold rounded-full shadow-[0_4px_12px_rgba(99,102,241,0.25)] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border-0"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        {t("add")}
                    </Button>
                </div>
            </div>

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

                {/* Live Classes Table */}
                <div className="rounded border border-gray-100 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1300px]">
                        <TableHeader className="bg-transparent border-b border-gray-100">
                            <TableRow className="hover:bg-transparent whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4">{t("class_title")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">{t("description")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">{t("date_time")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 text-center">{t("class_duration_minutes")}</TableHead>
                                <TableHead className="py-3 px-4">{t("created_by")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">{t("created_for")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4">{t("class")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 text-center">{t("status")} <ArrowUpDown className="h-2.5 w-2.5 inline ml-1 opacity-30" /></TableHead>
                                <TableHead className="py-3 px-4 text-right">{t("action")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(6)].map((_, i) => (
                                    <TableRow key={i} className="border-b border-gray-50">
                                        {[...Array(9)].map((_, j) => (
                                            <TableCell key={j} className="py-3 px-4">
                                                <div className="h-3 w-full max-w-[120px] rounded bg-gray-100 animate-pulse" />
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
                                    <TableRow key={item.id || idx} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors whitespace-nowrap">
                                        <TableCell className="py-3 px-4 text-gray-700 font-medium cursor-pointer hover:underline" onClick={() => handleEdit(item)}>{item.title}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-500 max-w-[200px] truncate" title={item.description}>{item.description || "-"}</TableCell>
                                        <TableCell className="py-3 px-4">{formatDateTime(item.date_time)}</TableCell>
                                        <TableCell className="py-3 px-4 text-center text-gray-700 font-medium">{item.duration}</TableCell>
                                        <TableCell className="py-3 px-4 text-gray-600">
                                            {item.creator
                                                ? `${item.creator.name} ${item.creator.last_name ?? ''} (${item.creator.role} : ${item.creator.id})`
                                                : <span className="text-gray-400 italic">—</span>}
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-gray-600">
                                            {item.staff
                                                ? `${item.staff.name} ${item.staff.last_name} (${item.staff.role} : ${item.staff.id})`
                                                : "-"}
                                        </TableCell>
                                        <TableCell className="py-3 px-4">
                                            <div className="flex flex-col gap-0.5 text-[10px] text-gray-700">
                                                {item.school_class?.sections?.map((sec: any) => {
                                                    const isChecked = sec.id === parseInt(item.section_id, 10);
                                                    return (
                                                        <div key={sec.id} className="flex items-center gap-1.5">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={isChecked} 
                                                                readOnly 
                                                                className="h-3 w-3 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 pointer-events-none" 
                                                            />
                                                            <span>{item.school_class?.name} ({sec.name.replace('SECTION - ', '')})</span>
                                                        </div>
                                                    );
                                                })}
                                                {!item.school_class?.sections && item.school_class && (
                                                    <div className="flex items-center gap-1.5">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={true} 
                                                            readOnly 
                                                            className="h-3 w-3 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500 accent-indigo-600 pointer-events-none" 
                                                        />
                                                        <span>{item.school_class?.name} ({item.section?.name || 'A'})</span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-center">
                                            <Select value={item.status || "awaited"} onValueChange={(val) => handleStatusChange(item.id, val)}>
                                                <SelectTrigger className="h-7 w-24 text-[10px] font-semibold bg-white border-gray-200 rounded mx-auto shadow-none">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded shadow-xl">
                                                    <SelectItem value="awaited">{t("awaited")}</SelectItem>
                                                    <SelectItem value="finished">{t("finished")}</SelectItem>
                                                    <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button 
                                                    onClick={() => {
                                                        if (item.meeting_url) {
                                                            window.open(item.meeting_url, '_blank');
                                                        } else {
                                                            toast.error(t("no_join_meeting_url_configured"));
                                                        }
                                                    }}
                                                    className="bg-[#4caf50] hover:bg-[#43a047] text-white px-2.5 h-6 text-[10px] font-bold rounded shadow-none flex items-center gap-1 transition-all active:scale-95"
                                                >
                                                    <Video className="h-3 w-3" />
                                                    {t("start")}
                                                </Button>
                                                <Button 
                                                    onClick={() => setDeleteId(item.id)}
                                                    className="bg-[#7e57c2] hover:bg-[#7048b6] text-white p-0 h-6 w-6 rounded shadow-none flex items-center justify-center transition-all active:scale-95"
                                                    title={t("delete_class")}
                                                >
                                                    <span className="font-bold text-[10px]">X</span>
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
                        {searchTerm && ` (${t("filtered_from_total_entries", { total: totalEntries })})`}
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
                <DialogContent className="max-w-[500px] p-0 overflow-hidden bg-white border border-gray-200 shadow-2xl rounded">
                    
                    {/* Header */}
                    <div className="bg-[#7e57c2] text-white p-4 font-semibold text-sm flex justify-between items-center">
                        <span>{editMode ? t("edit_live_class") : t("add_live_class")}</span>
                        <button 
                            onClick={() => setOpen(false)} 
                            className="text-white/80 hover:text-white transition-colors cursor-pointer"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Form Fields */}
                    <div className="p-4 space-y-3.5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                        
                        {/* Class Title */}
                        <div className="space-y-1">
                            <Label className="text-[11px] font-medium text-gray-700">{t("class_title")} <span className="text-red-500">*</span></Label>
                            <Input 
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder=""
                                className="h-9 border-gray-200 focus-visible:ring-indigo-500 text-xs rounded" 
                            />
                        </div>

                        {/* Class Date & Duration */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-[11px] font-medium text-gray-700">{t("class_date")} <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <Input 
                                        type="datetime-local"
                                        value={formData.date_time}
                                        onChange={(e) => setFormData({...formData, date_time: e.target.value})}
                                        className="h-9 border-gray-200 focus-visible:ring-indigo-500 text-xs rounded pr-8" 
                                    />
                                    <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[11px] font-medium text-gray-700">{t("class_duration_minutes")} <span className="text-red-500">*</span></Label>
                                <Input 
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 0})}
                                    placeholder=""
                                    className="h-9 border-gray-200 focus-visible:ring-indigo-500 text-xs rounded" 
                                />
                            </div>
                        </div>

                        {/* Role Select */}
                        <div className="space-y-1">
                            <Label className="text-[11px] font-medium text-gray-700">{t("role")} <span className="text-red-500">*</span></Label>
                            <Select value={selectedRole} onValueChange={(val) => { setSelectedRole(val); setFormData({...formData, staff_id: ""}); }}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded shadow-none text-gray-700">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent className="rounded shadow-xl">
                                    {uniqueRoles.map(role => (
                                        <SelectItem key={role} value={role}>{role}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Staff Select */}
                        <div className="space-y-1">
                            <Label className="text-[11px] font-medium text-gray-700">{t("staff")} <span className="text-red-500">*</span></Label>
                            <Select value={formData.staff_id} onValueChange={(val) => setFormData({...formData, staff_id: val})}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded shadow-none text-gray-700">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent className="rounded shadow-xl">
                                    {filteredStaff.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>{s.name} {s.last_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Class Select */}
                        <div className="space-y-1">
                            <Label className="text-[11px] font-medium text-gray-700">{t("class")} <span className="text-red-500">*</span></Label>
                            <Select value={formData.class_id} onValueChange={(val) => setFormData({...formData, class_id: val, section_id: ""})}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded shadow-none text-gray-700">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent className="rounded shadow-xl">
                                    {formCriteria.classes.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Section Select */}
                        <div className="space-y-1">
                            <Label className="text-[11px] font-medium text-gray-700">{t("section")} <span className="text-red-500">*</span></Label>
                            <Select value={formData.section_id} onValueChange={(val) => setFormData({...formData, section_id: val})}>
                                <SelectTrigger className="h-9 border-gray-200 text-xs rounded shadow-none text-gray-700">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent className="rounded shadow-xl">
                                    {formSections.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>{s.name.replace('SECTION - ', '')}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Gmeet URL */}
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <Label className="text-[11px] font-medium text-gray-700">{t("gmeet_url")} ({t("how_to_get")} <span className="text-[#7e57c2] hover:underline cursor-pointer font-bold" onClick={() => window.open('https://meet.google.com/', '_blank')}>{t("gmeet_url")}</span>? ) <span className="text-red-500">*</span></Label>
                            </div>
                            <Input 
                                value={formData.meeting_url}
                                onChange={(e) => setFormData({...formData, meeting_url: e.target.value})}
                                placeholder=""
                                className="h-9 border-gray-200 focus-visible:ring-indigo-500 text-xs rounded" 
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-1">
                            <Label className="text-[11px] font-medium text-gray-700">{t("description")}</Label>
                            <Textarea 
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder=""
                                className="min-h-[70px] border-gray-200 text-xs rounded resize-none" 
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50/50 p-4 border-t border-gray-150 flex justify-end">
                        <Button 
                            onClick={handleSave} 
                            disabled={submitting}
                            className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-90 text-white px-5 h-8 text-[11px] font-bold rounded shadow-sm"
                        >
                            {submitting ? t("saving") : t("save")}
                        </Button>
                    </div>

                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("are_you_absolutely_sure")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("permanently_delete_live_class_session")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded text-xs h-9">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-red-500 hover:bg-red-600 rounded text-xs h-9 text-white">
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
