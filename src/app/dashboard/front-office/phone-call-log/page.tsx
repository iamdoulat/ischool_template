"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Search,
    Printer,
    FileText,
    Download,
    Columns,
    Eye,
    Pencil,
    Trash2,
    Phone,
    FileSpreadsheet,
    Copy as CopyIcon,
    ChevronLeft,
    ChevronRight,
    Loader2,
    CalendarDays,
    Clock,
    PhoneIncoming,
    PhoneOutgoing,
    RefreshCw,
    User
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

interface PhoneCallLog {
    id: number;
    name: string | null;
    phone: string;
    date: string;
    description: string | null;
    next_follow_up_date: string | null;
    call_duration: string | null;
    note: string | null;
    call_type: "Incoming" | "Outgoing";
    created_at?: string;
}

export default function PhoneCallLogPage() {
    const tt = useTranslateToast();
    const ttRef = useRef(tt);
    ttRef.current = tt;
    const { t } = useTranslation();
    const [logs, setLogs] = useState<PhoneCallLog[]>([]);
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
    const [selectedLog, setSelectedLog] = useState<PhoneCallLog | null>(null);

    // Pagination states
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);
    const [total, setTotal] = useState(0);
    const [lastPage, setLastPage] = useState(1);
    const [isBackendPaginated, setIsBackendPaginated] = useState(false);

    const [formData, setFormData] = useState<Partial<PhoneCallLog>>({
        name: "",
        phone: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        next_follow_up_date: "",
        call_duration: "",
        note: "",
        call_type: "Incoming"
    });

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/phone-call-logs", {
                params: {
                    search: searchQuery,
                    page: page,
                    limit: limit
                }
            });
            const resData = response.data?.data;
            if (resData && resData.data) {
                setLogs(resData.data);
                setTotal(resData.total || 0);
                setLastPage(resData.last_page || 1);
                setIsBackendPaginated(true);
            } else {
                const logsList = response.data?.data || [];
                setLogs(logsList);
                setTotal(logsList.length);
                setLastPage(Math.ceil(logsList.length / limit) || 1);
                setIsBackendPaginated(false);
            }
        } catch (error) {
            console.error("Error fetching phone call logs:", error);
            ttRef.current.error("failed_to_load_phone_call_logs");
        } finally {
            setLoading(false);
        }
    }, [searchQuery, page, limit]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.phone || !formData.date) {
            tt.error("phone_and_date_required" || "Phone and Date are required");
            return;
        }
        setSaving(true);
        try {
            if (isEdit && editId) {
                await api.put(`/phone-call-logs/${editId}`, formData);
                tt.success("phone_call_log_updated_successfully");
            } else {
                await api.post("/phone-call-logs", formData);
                tt.success("phone_call_log_added_successfully");
            }
            fetchLogs();
            resetForm();
        } catch (error) {
            console.error("Error saving phone call log:", error);
            const err = error as { response?: { data?: { message?: string } } };
            const message = err.response?.data?.message || "failed_to_save_phone_call_log";
            tt.error(message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/phone-call-logs/${deleteId}`);
            tt.success("phone_call_log_deleted_successfully");
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
            fetchLogs();
        } catch (error) {
            console.error("Error deleting phone call log:", error);
            tt.error("failed_to_delete_phone_call_log");
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post("/phone-call-logs/bulk-delete", { ids: selectedIds });
            tt.success("logs_deleted_successfully", { count: selectedIds.length });
            setIsBulkDeleteDialogOpen(false);
            setSelectedIds([]);
            fetchLogs();
        } catch (error) {
            console.error("Error bulk deleting logs:", error);
            tt.error("failed_to_delete_selected_logs");
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            phone: "",
            date: new Date().toISOString().split("T")[0],
            description: "",
            next_follow_up_date: "",
            call_duration: "",
            note: "",
            call_type: "Incoming"
        });
        setIsEdit(false);
        setEditId(null);
    };

    const startEdit = (log: PhoneCallLog) => {
        setIsEdit(true);
        setEditId(log.id);
        setFormData({
            name: log.name || "",
            phone: log.phone,
            date: log.date ? new Date(log.date).toISOString().split("T")[0] : "",
            description: log.description || "",
            next_follow_up_date: log.next_follow_up_date ? new Date(log.next_follow_up_date).toISOString().split("T")[0] : "",
            call_duration: log.call_duration || "",
            note: log.note || "",
            call_type: log.call_type
        });
    };

    const displayedLogs = isBackendPaginated
        ? logs
        : logs.slice((page - 1) * limit, page * limit);

    const toggleSelectAll = () => {
        if (displayedLogs.length > 0 && displayedLogs.every(l => selectedIds.includes(l.id))) {
            setSelectedIds(selectedIds.filter(id => !displayedLogs.some(l => l.id === id)));
        } else {
            const newSelected = [...selectedIds];
            displayedLogs.forEach(l => {
                if (!newSelected.includes(l.id)) {
                    newSelected.push(l.id);
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
        if (logs.length === 0) return;
        const text = ["Name\tPhone\tDate\tFollow Up\tDuration\tType", ...logs.map(l => `${l.name || "-"}\t${l.phone}\t${l.date}\t${l.next_follow_up_date || "-"}\t${l.call_duration || "-"}\t${l.call_type}`)].join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        if (logs.length === 0) return;
        const worksheet = XLSX.utils.json_to_sheet(logs.map(l => ({
            Name: l.name || "-",
            Phone: l.phone,
            Date: l.date,
            "Next Follow Up": l.next_follow_up_date || "-",
            "Call Duration": l.call_duration || "-",
            Type: l.call_type,
            Description: l.description || "",
            Note: l.note || ""
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Call Logs");
        XLSX.writeFile(workbook, "phone_call_logs.xlsx");
        tt.success("excel_file_downloaded");
    };

    const handleExportPDF = () => {
        if (logs.length === 0) return;
        const doc = new jsPDF();
        autoTable(doc, {
            head: [["Name", "Phone", "Date", "Next Follow Up", "Duration", "Type"]],
            body: logs.map(l => [l.name || "-", l.phone, l.date, l.next_follow_up_date || "-", l.call_duration || "-", l.call_type]),
        });
        doc.save("phone_call_logs.pdf");
        tt.success("pdf_file_downloaded");
    };

    return (
        <div className="space-y-6 font-sans p-3 sm:p-5 bg-gray-50/10 min-h-screen pb-20 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden no-print">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Phone className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 tracking-tight leading-none">{t("phone_call_log")}</h1>
                        <p className="text-[11px] text-gray-500 mt-1">{t("manage_and_track_phone_call_logs") || "Record incoming and outgoing call records"}</p>
                    </div>
                </div>
                <Button
                    className="btn-gradient text-white px-5 h-9 text-xs gap-1.5 shadow-md rounded-full font-bold uppercase tracking-wider cursor-pointer"
                    onClick={() => { setPage(1); fetchLogs(); }}
                    disabled={loading}
                >
                    <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                    {t("refresh")}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Add Phone Call Log Form (Compact 1/3 layout) */}
                <div className="lg:col-span-4 xl:col-span-4">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 dark:border-gray-800">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Phone className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                    {isEdit ? t("edit_phone_call_log") : t("add_phone_call_log")}
                                </CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{isEdit ? t("update_call_record") : t("log_a_new_call")}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-3.5">
                            <form onSubmit={handleSave} className="space-y-3.5">
                                <div className="space-y-1 group">
                                    <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                        {t("name")}
                                    </label>
                                    <Input
                                        className="h-10 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 text-xs font-semibold text-gray-900 dark:text-gray-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={formData.name || ""}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Caller Name"
                                    />
                                </div>

                                <div className="space-y-1 group">
                                    <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                        {t("phone")} <span className="text-destructive font-black">*</span>
                                    </label>
                                    <Input
                                        className="h-10 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 text-xs font-semibold text-gray-900 dark:text-gray-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={formData.phone || ""}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="Phone number"
                                        required
                                    />
                                </div>

                                <div className="space-y-1 group">
                                    <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                        {t("date")} <span className="text-destructive font-black">*</span>
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
                                        placeholder="Brief description"
                                    />
                                </div>

                                <div className="space-y-1 group">
                                    <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                        {t("next_follow_up_date")}
                                    </label>
                                    <DatePicker
                                        value={formData.next_follow_up_date || ""}
                                        onChange={(val) => setFormData({ ...formData, next_follow_up_date: val })}
                                        placeholder="Select Follow Up Date"
                                        className="h-10 bg-gray-50/40 border-gray-200"
                                    />
                                </div>

                                <div className="space-y-1 group">
                                    <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                        {t("call_duration")}
                                    </label>
                                    <Input
                                        className="h-10 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 text-xs font-semibold text-gray-900 dark:text-gray-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={formData.call_duration || ""}
                                        onChange={(e) => setFormData({ ...formData, call_duration: e.target.value })}
                                        placeholder="e.g. 5 mins"
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

                                <div className="space-y-2 group pt-1">
                                    <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5">
                                        {t("call_type")} <span className="text-destructive font-black">*</span>
                                    </label>
                                    <div className="flex gap-6 ml-1">
                                        <label className="flex items-center gap-2 cursor-pointer group/item">
                                            <input
                                                type="radio"
                                                name="callType"
                                                className="w-4 h-4 accent-indigo-600 cursor-pointer"
                                                checked={formData.call_type === "Incoming"}
                                                onChange={() => setFormData({ ...formData, call_type: "Incoming" })}
                                            />
                                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover/item:text-indigo-600 transition-colors flex items-center gap-1">
                                                <PhoneIncoming className="h-3.5 w-3.5 text-indigo-500" />
                                                {t("incoming")}
                                            </span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group/item">
                                            <input
                                                type="radio"
                                                name="callType"
                                                className="w-4 h-4 accent-indigo-600 cursor-pointer"
                                                checked={formData.call_type === "Outgoing"}
                                                onChange={() => setFormData({ ...formData, call_type: "Outgoing" })}
                                            />
                                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover/item:text-indigo-600 transition-colors flex items-center gap-1">
                                                <PhoneOutgoing className="h-3.5 w-3.5 text-amber-500" />
                                                {t("outgoing")}
                                            </span>
                                        </label>
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

                {/* Right Column: Phone Call Log List Table (2/3 layout) */}
                <div className="lg:col-span-8 xl:col-span-8">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 dark:border-gray-800">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Phone className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("phone_call_log_list")}</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{t("total_logs_count", { total })}</p>
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
                                        onChange={(e) => setSearchQuery(e.target.value)}
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
                                                    checked={displayedLogs.length > 0 && displayedLogs.every(l => selectedIds.includes(l.id))}
                                                    onCheckedChange={toggleSelectAll}
                                                    className="border-gray-300"
                                                />
                                            </th>
                                            <Th className="w-12">#</Th>
                                            <Th>{t("name")}</Th>
                                            <Th>{t("phone")}</Th>
                                            <Th>{t("date")}</Th>
                                            <Th>{t("next_follow_up_date")}</Th>
                                            <Th>{t("call_type")}</Th>
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
                                        ) : displayedLogs.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-12 text-center text-xs font-semibold text-gray-400">{t("no_phone_call_logs_found")}</td>
                                            </tr>
                                        ) : (
                                            displayedLogs.map((item, idx) => (
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
                                                    <Td>
                                                        <div className="flex items-center gap-2.5">
                                                            <Avatar className="h-8 w-8 rounded-full border border-indigo-100 dark:border-indigo-900 shadow-2xs shrink-0">
                                                                <AvatarFallback className="bg-gradient-to-br from-[#FF9800]/10 to-[#6366F1]/10 text-indigo-700 font-bold text-[11px]">
                                                                    {item.name ? item.name.substring(0, 2).toUpperCase() : "CL"}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="font-bold text-xs text-gray-900 dark:text-gray-100 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => startEdit(item)}>
                                                                {item.name || "-"}
                                                            </span>
                                                        </div>
                                                    </Td>
                                                    <Td className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                                        <span className="flex items-center gap-1.5">
                                                            <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                            {item.phone}
                                                        </span>
                                                    </Td>
                                                    <Td className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                        <span className="flex items-center gap-1.5">
                                                            <CalendarDays className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                            {item.date ? new Date(item.date).toLocaleDateString() : "-"}
                                                        </span>
                                                    </Td>
                                                    <Td className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                        {item.next_follow_up_date ? (
                                                            <span className="flex items-center gap-1.5">
                                                                <CalendarDays className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                                                {new Date(item.next_follow_up_date).toLocaleDateString()}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-300">-</span>
                                                        )}
                                                    </Td>
                                                    <Td>
                                                        <Badge variant="outline" className={cn(
                                                            "text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border gap-1",
                                                            item.call_type === "Incoming"
                                                                ? "border-indigo-200 text-indigo-700 bg-indigo-50/80 dark:bg-indigo-950 dark:text-indigo-300"
                                                                : "border-amber-200 text-amber-700 bg-amber-50/80 dark:bg-amber-950 dark:text-amber-300"
                                                        )}>
                                                            {item.call_type === "Incoming" ? <PhoneIncoming className="h-2.5 w-2.5" /> : <PhoneOutgoing className="h-2.5 w-2.5" />}
                                                            {item.call_type}
                                                        </Badge>
                                                    </Td>
                                                    <Td className="text-right">
                                                        <div className="flex justify-end gap-1.5">
                                                            <ActionBtn icon={Eye} className="bg-indigo-500 hover:bg-indigo-600" title={t("view")} onClick={() => { setSelectedLog(item); setIsViewDialogOpen(true); }} />
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
                                    {getPageNumbers(page, lastPage).map((p, idx) =>
                                        p === "…" ? (
                                            <span key={`gap-${idx}`} className="px-1.5 text-gray-400 text-xs select-none">…</span>
                                        ) : (
                                            <Button
                                                key={p}
                                                className={cn(
                                                    "h-8 w-8 rounded-lg p-0 text-xs font-bold transition-all shadow-xs cursor-pointer",
                                                    page === p
                                                        ? "btn-gradient text-white"
                                                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                                )}
                                                onClick={() => setPage(p)}
                                            >
                                                {p}
                                            </Button>
                                        )
                                    )}
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
                            {t("permanently_delete_phone_call_log")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-full h-9 text-xs font-bold uppercase" onClick={() => { setDeleteId(null); setIsDeleteDialogOpen(false); }}>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 rounded-full h-9 text-xs font-bold uppercase">{t("delete")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Delete */}
            <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-gray-900">{t("bulk_delete_logs")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-gray-600">
                            {t("confirm_bulk_delete_logs", { count: selectedIds.length })}
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
                <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
                    <DialogHeader className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] p-6 space-y-0">
                        <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            {t("phone_call_log_details")}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6 bg-white dark:bg-gray-900 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                            <DetailItem label={t("name")} value={selectedLog?.name} />
                            <DetailItem label={t("phone")} value={selectedLog?.phone} />
                            <DetailItem label={t("date")} value={selectedLog?.date ? new Date(selectedLog.date).toLocaleDateString() : "-"} />
                            <DetailItem label={t("next_follow_up_date")} value={selectedLog?.next_follow_up_date ? new Date(selectedLog.next_follow_up_date).toLocaleDateString() : "-"} />
                            <DetailItem label={t("call_duration")} value={selectedLog?.call_duration} />
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t("call_type")}</label>
                                <div className="h-10 flex items-center px-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <Badge variant="outline" className={cn(
                                        "text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border gap-1",
                                        selectedLog?.call_type === "Incoming"
                                            ? "border-indigo-200 text-indigo-700 bg-indigo-50/80"
                                            : "border-amber-200 text-amber-700 bg-amber-50/80"
                                    )}>
                                        {selectedLog?.call_type}
                                    </Badge>
                                </div>
                            </div>
                            <div className="col-span-1 sm:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t("description")}</label>
                                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 min-h-[60px]">
                                    {selectedLog?.description || t("no_description_provided")}
                                </p>
                            </div>
                            <div className="col-span-1 sm:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t("note")}</label>
                                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 min-h-[60px]">
                                    {selectedLog?.note || t("no_note_provided")}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
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

// Build a windowed list of page numbers with ellipsis, e.g. [1, '…', 4, 5, 6, '…', 20]
function getPageNumbers(current: number, last: number): (number | "…")[] {
    if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
    const pages: (number | "…")[] = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(last - 1, current + 1);
    if (start > 2) pages.push("…");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < last - 1) pages.push("…");
    pages.push(last);
    return pages;
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
