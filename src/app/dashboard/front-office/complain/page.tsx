"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Search,
    Printer,
    FileText,
    Download,
    Columns,
    ChevronDown,
    Eye,
    Pencil,
    Trash2,
    CloudUpload,
    MessageSquareWarning,
    FileSpreadsheet,
    Copy as CopyIcon,
    ChevronLeft,
    ChevronRight,
    Loader2,
    CalendarDays,
    Phone,
    RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Complaint {
    id: number;
    complaint_id: string | null;
    complaint_type: string | null;
    source: string | null;
    complain_by: string;
    phone: string | null;
    date: string | null;
    description: string | null;
    action_taken: string | null;
    assigned: string | null;
    note: string | null;
    attachment: string | null;
    created_at?: string;
}

export default function ComplainPage() {
    const tt = useTranslateToast();
    const ttRef = useRef(tt);
    ttRef.current = tt;
    const { t } = useTranslation();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [dynamicComplaintTypes, setDynamicComplaintTypes] = useState<{ id: number; name: string }[]>([]);
    const [dynamicSources, setDynamicSources] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

    // Pagination states
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);
    const [total, setTotal] = useState(0);
    const [lastPage, setLastPage] = useState(1);
    const [isBackendPaginated, setIsBackendPaginated] = useState(false);

    const [formData, setFormData] = useState<Partial<Complaint>>({
        complaint_id: "",
        complaint_type: "",
        source: "",
        complain_by: "",
        phone: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        action_taken: "",
        assigned: "",
        note: "",
        attachment: ""
    });

    const fetchComplaints = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/complaints", {
                params: {
                    search: searchQuery,
                    page,
                    limit
                }
            });
            const resData = response.data?.data;
            if (resData && Array.isArray(resData.data)) {
                setComplaints(resData.data);
                setTotal(resData.total || 0);
                setLastPage(resData.last_page || 1);
                setIsBackendPaginated(true);
            } else {
                const list = Array.isArray(resData) ? resData : [];
                setComplaints(list);
                setTotal(list.length);
                setLastPage(Math.ceil(list.length / limit) || 1);
                setIsBackendPaginated(false);
            }
            setSelectedIds([]);
        } catch (error) {
            console.error("Error fetching complaints:", error);
            ttRef.current.error("failed_to_load_complaints");
        } finally {
            setLoading(false);
        }
    }, [searchQuery, page, limit]);

    const fetchComplaintTypes = useCallback(async () => {
        try {
            const response = await api.get("/complaint-types?limit=1000");
            const data = response.data.data?.data || response.data.data || [];
            if (Array.isArray(data)) setDynamicComplaintTypes(data);
        } catch (error) {
            console.error("Error fetching complaint types:", error);
        }
    }, []);

    const fetchSources = useCallback(async () => {
        try {
            const response = await api.get("/front-office-sources?limit=1000");
            const data = response.data.data?.data || response.data.data || [];
            if (Array.isArray(data)) setDynamicSources(data);
        } catch (error) {
            console.error("Error fetching sources:", error);
        }
    }, []);

    useEffect(() => {
        fetchComplaints();
        fetchComplaintTypes();
        fetchSources();
    }, [fetchComplaints, fetchComplaintTypes, fetchSources]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.complain_by) {
            tt.error("complain_by_required" || "Complain By is required");
            return;
        }
        setSaving(true);
        try {
            if (isEdit && editId) {
                await api.put(`/complaints/${editId}`, formData);
                tt.success("complaint_updated_successfully");
            } else {
                await api.post("/complaints", formData);
                tt.success("complaint_added_successfully");
            }
            fetchComplaints();
            resetForm();
        } catch (error) {
            console.error("Error saving complaint:", error);
            const err = error as { response?: { data?: { message?: string } } };
            const message = err.response?.data?.message || "failed_to_save_complaint";
            tt.error(message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setSaving(true);
        try {
            await api.delete(`/complaints/${deleteId}`);
            tt.success("complaint_deleted_successfully");
            fetchComplaints();
        } catch (error) {
            console.error("Error deleting complaint:", error);
            const err = error as { response?: { status?: number } };
            if (err.response?.status === 404) {
                tt.error("complaint_not_found_already_deleted");
            } else {
                tt.error("failed_to_delete_complaint");
            }
            fetchComplaints();
        } finally {
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
            setSaving(false);
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post("/complaints/bulk-delete", { ids: selectedIds });
            tt.success("complaints_deleted_successfully", { count: selectedIds.length });
            setIsBulkDeleteDialogOpen(false);
            setSelectedIds([]);
            fetchComplaints();
        } catch (error) {
            console.error("Error bulk deleting complaints:", error);
            tt.error("failed_to_delete_selected_complaints");
        }
    };

    const resetForm = () => {
        setFormData({
            complaint_id: "",
            complaint_type: "",
            source: "",
            complain_by: "",
            phone: "",
            date: new Date().toISOString().split("T")[0],
            description: "",
            action_taken: "",
            assigned: "",
            note: "",
            attachment: ""
        });
        setIsEdit(false);
        setEditId(null);
    };

    const startEdit = (complaint: Complaint) => {
        setIsEdit(true);
        setEditId(complaint.id);
        setFormData({
            complaint_id: complaint.complaint_id || "",
            complaint_type: complaint.complaint_type || "",
            source: complaint.source || "",
            complain_by: complaint.complain_by,
            phone: complaint.phone || "",
            date: complaint.date ? new Date(complaint.date).toISOString().split("T")[0] : "",
            description: complaint.description || "",
            action_taken: complaint.action_taken || "",
            assigned: complaint.assigned || "",
            note: complaint.note || "",
            attachment: complaint.attachment || ""
        });
    };

    const displayedComplaints = isBackendPaginated
        ? complaints
        : complaints.slice((page - 1) * limit, page * limit);

    const toggleSelectAll = () => {
        const displayedIds = displayedComplaints.map(c => c.id);
        const allDisplayedSelected = displayedIds.every(id => selectedIds.includes(id));
        if (allDisplayedSelected) {
            setSelectedIds(selectedIds.filter(id => !displayedIds.includes(id)));
        } else {
            const newSelected = [...selectedIds];
            displayedIds.forEach(id => {
                if (!newSelected.includes(id)) {
                    newSelected.push(id);
                }
            });
            setSelectedIds(newSelected);
        }
    };

    const toggleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleCopy = () => {
        if (complaints.length === 0) return;
        const text = ["Complaint No\tType\tComplain By\tPhone\tDate", ...complaints.map(c => `${c.complaint_id || c.id}\t${c.complaint_type || "-"}\t${c.complain_by}\t${c.phone || "-"}\t${c.date || "-"}`)].join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        if (complaints.length === 0) return;
        const worksheet = XLSX.utils.json_to_sheet(complaints.map(c => ({
            "Complaint No": c.complaint_id || c.id,
            Type: c.complaint_type || "-",
            "Complain By": c.complain_by,
            Phone: c.phone || "-",
            Date: c.date || "-",
            Source: c.source || "-",
            "Action Taken": c.action_taken || "-",
            Assigned: c.assigned || "-",
            Description: c.description || "",
            Note: c.note || ""
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Complaints");
        XLSX.writeFile(workbook, "complaints_list.xlsx");
        tt.success("excel_file_downloaded");
    };

    const handleExportPDF = () => {
        if (complaints.length === 0) return;
        const doc = new jsPDF();
        autoTable(doc, {
            head: [["Complaint No", "Type", "Complain By", "Phone", "Date"]],
            body: complaints.map(c => [c.complaint_id || c.id, c.complaint_type || "-", c.complain_by, c.phone || "-", c.date || "-"]),
        });
        doc.save("complaints_list.pdf");
        tt.success("pdf_file_downloaded");
    };

    return (
        <div className="space-y-6 font-sans p-3 sm:p-5 bg-gray-50/10 min-h-screen pb-20 animate-in fade-in duration-500">
            {/* Page Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden no-print">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <MessageSquareWarning className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 tracking-tight leading-none">{t("complain")}</h1>
                        <p className="text-[11px] text-gray-500 mt-1">{t("register_a_new_complaint") || "Manage and resolve student/parent complaints"}</p>
                    </div>
                </div>
                <Button
                    className="btn-gradient text-white px-5 h-9 text-xs gap-1.5 shadow-md rounded-full font-bold uppercase tracking-wider cursor-pointer"
                    onClick={() => { setPage(1); fetchComplaints(); }}
                    disabled={loading}
                >
                    <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                    {t("refresh")}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Add Complain Form (Compact 1/3 layout) */}
                <div className="lg:col-span-4 xl:col-span-4">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 dark:border-gray-800">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <MessageSquareWarning className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                    {isEdit ? t("edit_complain") : t("add_complain")}
                                </CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{isEdit ? t("update_complaint_record") : t("register_a_new_complaint")}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-3.5">
                            <form onSubmit={handleSave} className="space-y-3.5">
                                <div className="space-y-1 group">
                                    <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5">
                                        {t("complaint_id")}
                                    </label>
                                    <Input
                                        className="h-10 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-100/60 dark:bg-gray-800/60 text-xs font-semibold text-gray-500 cursor-not-allowed"
                                        value={formData.complaint_id || t("auto_generated")}
                                        disabled
                                    />
                                </div>

                                <div className="space-y-1 group">
                                    <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                        {t("complaint_type")}
                                    </label>
                                    <div className="relative">
                                        <select
                                            className="flex h-10 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 px-3 py-2 text-xs font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-800 appearance-none cursor-pointer transition-all"
                                            value={formData.complaint_type || ""}
                                            onChange={(e) => setFormData({ ...formData, complaint_type: e.target.value })}
                                        >
                                            <option value="" className="text-gray-400">{t("select")}</option>
                                            {dynamicComplaintTypes.map(type => (
                                                <option key={type.id} value={type.name} className="text-gray-900 font-medium">{type.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-1 group">
                                    <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                        {t("source")}
                                    </label>
                                    <div className="relative">
                                        <select
                                            className="flex h-10 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 px-3 py-2 text-xs font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-800 appearance-none cursor-pointer transition-all"
                                            value={formData.source || ""}
                                            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                        >
                                            <option value="" className="text-gray-400">{t("select")}</option>
                                            {dynamicSources.map(source => (
                                                <option key={source.id} value={source.name} className="text-gray-900 font-medium">{source.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-1 group">
                                    <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                        {t("complain_by")} <span className="text-destructive font-black">*</span>
                                    </label>
                                    <Input
                                        className="h-10 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 text-xs font-semibold text-gray-900 dark:text-gray-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={formData.complain_by || ""}
                                        onChange={(e) => setFormData({ ...formData, complain_by: e.target.value })}
                                        placeholder="Complainant Name"
                                        required
                                    />
                                </div>

                                <div className="space-y-1 group">
                                    <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                        {t("phone")}
                                    </label>
                                    <Input
                                        className="h-10 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 text-xs font-semibold text-gray-900 dark:text-gray-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={formData.phone || ""}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="Phone number"
                                    />
                                </div>

                                <div className="space-y-1 group">
                                    <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                        {t("date")}
                                    </label>
                                    <DatePicker
                                        value={formData.date || ""}
                                        onChange={(val) => setFormData({ ...formData, date: val })}
                                        placeholder="Select Date"
                                        className="h-10 bg-gray-50/40 border-gray-200"
                                    />
                                </div>

                                <div className="space-y-1 group">
                                    <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                        {t("description")}
                                    </label>
                                    <Textarea
                                        className="min-h-[70px] rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 text-xs font-medium text-gray-900 dark:text-gray-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 resize-none"
                                        value={formData.description || ""}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Complaint details"
                                    />
                                </div>

                                <div className="space-y-1 group">
                                    <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                        {t("action_taken")}
                                    </label>
                                    <Input
                                        className="h-10 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 text-xs font-semibold text-gray-900 dark:text-gray-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={formData.action_taken || ""}
                                        onChange={(e) => setFormData({ ...formData, action_taken: e.target.value })}
                                        placeholder="Action taken if any"
                                    />
                                </div>

                                <div className="space-y-1 group">
                                    <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                        {t("assigned")}
                                    </label>
                                    <Input
                                        className="h-10 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 text-xs font-semibold text-gray-900 dark:text-gray-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={formData.assigned || ""}
                                        onChange={(e) => setFormData({ ...formData, assigned: e.target.value })}
                                        placeholder="Assigned staff"
                                    />
                                </div>

                                <div className="space-y-1 group">
                                    <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                        {t("note")}
                                    </label>
                                    <Textarea
                                        className="min-h-[70px] rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 text-xs font-medium text-gray-900 dark:text-gray-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 resize-none"
                                        value={formData.note || ""}
                                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                        placeholder="Additional notes"
                                    />
                                </div>

                                <div className="space-y-1 group">
                                    <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5">
                                        {t("attach_document")}
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 bg-gray-50/40 hover:bg-indigo-50/20 hover:border-indigo-400 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 group/upload">
                                        <CloudUpload className="h-6 w-6 text-gray-400 group-hover/upload:text-indigo-600 transition-colors" />
                                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover/upload:text-indigo-600 transition-colors">{t("drag_and_drop_file") || "Upload Attachment"}</p>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                                    {isEdit && (
                                        <Button type="button" variant="outline" className="h-9 px-5 rounded-full text-xs font-bold uppercase border-gray-200" onClick={resetForm}>
                                            {t("cancel")}
                                        </Button>
                                    )}
                                    <Button type="submit" className="btn-gradient text-white h-9 px-6 rounded-full text-xs font-bold uppercase shadow-md cursor-pointer" disabled={saving}>
                                        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                                        {isEdit ? t("update") : t("save")}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Complaint List Table (2/3 layout) */}
                <div className="lg:col-span-8 xl:col-span-8">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 dark:border-gray-800">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <MessageSquareWarning className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("complaint_list")}</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{t("total_complaints_count", { total })}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {/* Toolbar */}
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-5">
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder={t("search")}
                                        className="pl-10 h-10 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus-visible:bg-white focus-visible:ring-indigo-500 shadow-none"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setPage(1);
                                        }}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 mr-2">
                                        <Select
                                            value={String(limit)}
                                            onValueChange={(val) => {
                                                setLimit(Number(val));
                                                setPage(1);
                                            }}
                                        >
                                            <SelectTrigger className="h-9 w-20 text-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl font-bold text-gray-700 dark:text-gray-200">
                                                <SelectValue placeholder={String(limit)} />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-gray-200">
                                                {[20, 50, 100, 500].map((n) => (
                                                    <SelectItem key={n} value={String(n)} className="font-semibold text-xs text-gray-700">
                                                        {n}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex gap-1.5 bg-gray-50 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <IconButton icon={Printer} onClick={handlePrint} title={t("print")} />
                                        <IconButton icon={CopyIcon} onClick={handleCopy} title={t("copy")} />
                                        <IconButton icon={FileSpreadsheet} onClick={handleExportExcel} title={t("excel")} />
                                        <IconButton icon={FileText} onClick={handleExportPDF} title={t("pdf")} />
                                        <IconButton icon={Download} onClick={handleExportExcel} title={t("download")} />
                                        <IconButton icon={Columns} title={t("columns")} />
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 dark:bg-gray-800 text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="px-3.5 py-3 w-10">
                                                <Checkbox
                                                    checked={displayedComplaints.length > 0 && displayedComplaints.every(c => selectedIds.includes(c.id))}
                                                    onCheckedChange={toggleSelectAll}
                                                    className="border-gray-300"
                                                />
                                            </th>
                                            <Th className="w-12">#</Th>
                                            <Th>{t("complain_number")}</Th>
                                            <Th>{t("complaint_type")}</Th>
                                            <Th>{t("name")}</Th>
                                            <Th>{t("phone")}</Th>
                                            <Th>{t("date")}</Th>
                                            <th className="px-3.5 py-3 text-right">
                                                <div className="flex justify-end items-center">
                                                    {selectedIds.length > 0 ? (
                                                        <button
                                                            onClick={() => setIsBulkDeleteDialogOpen(true)}
                                                            className="bg-rose-500 hover:bg-rose-600 p-1.5 rounded-md transition-colors shadow-2xs cursor-pointer"
                                                            title={t("delete_selected")}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5 text-white" />
                                                        </button>
                                                    ) : (
                                                        <span className="font-bold tracking-wider">{t("action")}</span>
                                                    )}
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                                                </td>
                                            </tr>
                                        ) : displayedComplaints.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-12 text-center text-xs font-semibold text-gray-400">{t("no_complaints_found")}</td>
                                            </tr>
                                        ) : (
                                            displayedComplaints.map((item, idx) => (
                                                <tr key={item.id} className={cn(
                                                    "hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors group",
                                                    selectedIds.includes(item.id) && "bg-indigo-50/30 dark:bg-indigo-950/20"
                                                )}>
                                                    <td className="px-3.5 py-3">
                                                        <Checkbox
                                                            checked={selectedIds.includes(item.id)}
                                                            onCheckedChange={() => toggleSelect(item.id)}
                                                            className="border-gray-300"
                                                        />
                                                    </td>
                                                    <Td className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                                        {((page - 1) * limit) + idx + 1}
                                                    </Td>
                                                    <Td className="whitespace-nowrap">
                                                        <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/70 border border-indigo-100 px-2 py-0.5 rounded-md">
                                                            {item.complaint_id || `CMP-${item.id}`}
                                                        </span>
                                                    </Td>
                                                    <Td className="whitespace-nowrap">
                                                        {item.complaint_type ? (
                                                            <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                                                {item.complaint_type}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-gray-300">-</span>
                                                        )}
                                                    </Td>
                                                    <Td>
                                                        <div className="flex items-center gap-2.5">
                                                            <Avatar className="h-8 w-8 rounded-full border border-indigo-100 dark:border-indigo-900 shadow-2xs shrink-0">
                                                                <AvatarFallback className="bg-gradient-to-br from-[#FF9800]/10 to-[#6366F1]/10 text-indigo-700 font-bold text-[11px]">
                                                                    {item.complain_by ? item.complain_by.substring(0, 2).toUpperCase() : "CP"}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="font-bold text-xs text-gray-900 dark:text-gray-100 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => startEdit(item)}>
                                                                {item.complain_by}
                                                            </span>
                                                        </div>
                                                    </Td>
                                                    <Td className="text-xs font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                                                        <span className="flex items-center gap-1.5">
                                                            <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                            {item.phone || "-"}
                                                        </span>
                                                    </Td>
                                                    <Td className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                        <span className="flex items-center gap-1.5">
                                                            <CalendarDays className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                            {item.date ? new Date(item.date).toLocaleDateString() : "-"}
                                                        </span>
                                                    </Td>
                                                    <Td className="text-right whitespace-nowrap">
                                                        <div className="flex justify-end gap-1.5">
                                                            <ActionBtn icon={Eye} className="bg-indigo-500 hover:bg-indigo-600" title={t("view")} onClick={() => { setSelectedComplaint(item); setIsViewDialogOpen(true); }} />
                                                            {item.attachment && <ActionBtn icon={Download} className="bg-emerald-500 hover:bg-emerald-600" title={t("download")} />}
                                                            <ActionBtn icon={Pencil} className="bg-amber-500 hover:bg-amber-600" title={t("edit")} onClick={() => startEdit(item)} />
                                                            <ActionBtn icon={Trash2} className="bg-rose-500 hover:bg-rose-600" title={t("delete")} onClick={() => { setDeleteId(item.id); setIsDeleteDialogOpen(true); }} />
                                                        </div>
                                                    </Td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-medium">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    {t("showing_x_to_y_of_z", { from: total > 0 ? (page - 1) * limit + 1 : 0, to: Math.min(page * limit, total), total })}
                                </p>
                                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                                    <Button
                                        size="icon"
                                        className="h-8 w-8 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer shadow-xs"
                                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                        disabled={page === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    {Array.from({ length: lastPage }, (_, i) => i + 1).map((p) => (
                                        <Button
                                            key={p}
                                            className={cn(
                                                "h-8 w-8 rounded-lg p-0 text-xs font-bold transition-all shadow-xs cursor-pointer",
                                                p === page
                                                    ? "btn-gradient text-white"
                                                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                            )}
                                            onClick={() => setPage(p)}
                                        >
                                            {p}
                                        </Button>
                                    ))}
                                    <Button
                                        size="icon"
                                        className="h-8 w-8 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer shadow-xs"
                                        onClick={() => setPage(prev => Math.min(prev + 1, lastPage))}
                                        disabled={page === lastPage || lastPage === 0}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-gray-900">{t("are_you_sure")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-gray-600">
                            {t("permanently_delete_complaint_entry")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-full h-9 text-xs font-bold uppercase" onClick={() => { setDeleteId(null); setIsDeleteDialogOpen(false); }}>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={saving} className="bg-rose-600 hover:bg-rose-700 rounded-full h-9 text-xs font-bold uppercase">{saving ? t("deleting") : t("delete")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Delete */}
            <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-gray-900">{t("bulk_delete_entries")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-gray-600">
                            {t("confirm_bulk_delete_complaint_entries", { count: selectedIds.length })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-full h-9 text-xs font-bold uppercase" onClick={() => setIsBulkDeleteDialogOpen(false)}>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-rose-600 hover:bg-rose-700 rounded-full h-9 text-xs font-bold uppercase">{t("delete_selected")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* View Details Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="w-[95vw] max-w-2xl p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
                    <DialogHeader className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] p-5 sm:p-6 space-y-0 shrink-0">
                        <DialogTitle className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                            <Eye className="h-5 w-5 shrink-0" />
                            {t("complaint_details")}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto max-h-[70vh] p-5 sm:p-6 bg-white dark:bg-gray-900">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                            <DetailItem label={t("complaint_id")} value={selectedComplaint?.complaint_id || (selectedComplaint ? `CMP-${selectedComplaint.id}` : "-")} />
                            <DetailItem label={t("complaint_type")} value={selectedComplaint?.complaint_type} />
                            <DetailItem label={t("source")} value={selectedComplaint?.source} />
                            <DetailItem label={t("complain_by")} value={selectedComplaint?.complain_by} />
                            <DetailItem label={t("phone")} value={selectedComplaint?.phone} />
                            <DetailItem label={t("date")} value={selectedComplaint?.date ? new Date(selectedComplaint.date).toLocaleDateString() : "-"} />
                            <DetailItem label={t("assigned")} value={selectedComplaint?.assigned} />
                            <DetailItem label={t("action_taken")} value={selectedComplaint?.action_taken} />
                            <div className="col-span-1 sm:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t("description")}</label>
                                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 min-h-[60px] whitespace-pre-wrap break-words">
                                    {selectedComplaint?.description || t("no_description_provided")}
                                </p>
                            </div>
                            <div className="col-span-1 sm:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t("note")}</label>
                                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 min-h-[60px] whitespace-pre-wrap break-words">
                                    {selectedComplaint?.note || t("no_note_provided")}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end mt-6">
                            <Button
                                onClick={() => setIsViewDialogOpen(false)}
                                className="btn-gradient text-white px-8 h-9 text-xs rounded-full font-bold uppercase shadow-md cursor-pointer"
                            >
                                {t("close")}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Helper Components
function Th({ children, className }: { children: React.ReactNode, className?: string }) {
    return <th className={cn("px-3.5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 whitespace-nowrap", className)}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode, className?: string }) {
    return <td className={cn("px-3.5 py-3 text-xs text-gray-900 dark:text-gray-100 whitespace-nowrap", className)}>{children}</td>;
}

function IconButton({ icon: Icon, onClick, title }: { icon: React.ElementType, onClick?: () => void, title?: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className="p-2 hover:bg-card hover:text-indigo-600 rounded-lg transition-all border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 shadow-2xs group active:scale-95 cursor-pointer"
        >
            <Icon className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
        </button>
    );
}

function ActionBtn({ icon: Icon, className, onClick, title }: { icon: React.ElementType, className?: string, onClick?: () => void, title?: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={cn("p-1.5 text-white rounded-md transition-all shadow-2xs hover:shadow-md active:scale-90 cursor-pointer", className)}
        >
            <Icon className="h-3.5 w-3.5" />
        </button>
    );
}

function DetailItem({ label, value }: { label: string, value: string | null | undefined }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>
            <div className="h-10 flex items-center px-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{value || "-"}</span>
            </div>
        </div>
    );
}
