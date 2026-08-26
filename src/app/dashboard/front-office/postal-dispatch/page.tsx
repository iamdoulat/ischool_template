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
    CloudUpload,
    Send,
    FileSpreadsheet,
    Copy as CopyIcon,
    ChevronLeft,
    ChevronRight,
    Loader2,
    CalendarDays,
    RefreshCw,
    Mail,
    FileCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

interface PostalDispatch {
    id: number;
    to_title: string;
    reference_no: string | null;
    address: string | null;
    note: string | null;
    from_title: string | null;
    date: string | null;
    attachment: string | null;
    created_at?: string;
}

export default function PostalDispatchPage() {
    const tt = useTranslateToast();
    const ttRef = useRef(tt);
    ttRef.current = tt;
    const { t } = useTranslation();
    const [dispatches, setDispatches] = useState<PostalDispatch[]>([]);
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
    const [selectedDispatch, setSelectedDispatch] = useState<PostalDispatch | null>(null);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);
    const [total, setTotal] = useState(0);
    const [lastPage, setLastPage] = useState(1);
    const [isBackendPaginated, setIsBackendPaginated] = useState(false);

    const [formData, setFormData] = useState<Partial<PostalDispatch>>({
        to_title: "",
        reference_no: "",
        address: "",
        note: "",
        from_title: "",
        date: new Date().toISOString().split("T")[0],
        attachment: ""
    });

    const fetchDispatches = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/postal-dispatches", {
                params: {
                    search: searchQuery,
                    page: page,
                    limit: limit
                }
            });
            const resData = response.data?.data;
            if (resData && Array.isArray(resData.data)) {
                setDispatches(resData.data);
                setTotal(resData.total || 0);
                setLastPage(resData.last_page || 1);
                setIsBackendPaginated(true);
            } else {
                const list = Array.isArray(resData) ? resData : (Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []));
                setDispatches(list);
                setTotal(list.length);
                setLastPage(Math.ceil(list.length / limit) || 1);
                setIsBackendPaginated(false);
            }
            setSelectedIds([]);
        } catch (error) {
            console.error("Error fetching postal dispatches:", error);
            ttRef.current.error("failed_to_load_postal_dispatches");
        } finally {
            setLoading(false);
        }
    }, [searchQuery, page, limit]);

    useEffect(() => {
        fetchDispatches();
    }, [fetchDispatches]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.to_title) {
            tt.error("to_title_required" || "To Title is required");
            return;
        }
        setSaving(true);
        try {
            if (isEdit && editId) {
                await api.put(`/postal-dispatches/${editId}`, formData);
                tt.success("postal_dispatch_updated_successfully");
            } else {
                await api.post("/postal-dispatches", formData);
                tt.success("postal_dispatch_added_successfully");
            }
            fetchDispatches();
            resetForm();
        } catch (error) {
            console.error("Error saving postal dispatch:", error);
            const err = error as { response?: { data?: { message?: string } } };
            const message = err.response?.data?.message || "failed_to_save_postal_dispatch";
            tt.error(message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/postal-dispatches/${deleteId}`);
            tt.success("postal_dispatch_deleted_successfully");
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
            fetchDispatches();
        } catch (error) {
            console.error("Error deleting postal dispatch:", error);
            tt.error("failed_to_delete_postal_dispatch");
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post("/postal-dispatches/bulk-delete", { ids: selectedIds });
            tt.success("entries_deleted_successfully", { count: selectedIds.length });
            setIsBulkDeleteDialogOpen(false);
            setSelectedIds([]);
            fetchDispatches();
        } catch (error) {
            console.error("Error bulk deleting dispatches:", error);
            tt.error("failed_to_delete_selected_entries");
        }
    };

    const resetForm = () => {
        setFormData({
            to_title: "",
            reference_no: "",
            address: "",
            note: "",
            from_title: "",
            date: new Date().toISOString().split("T")[0],
            attachment: ""
        });
        setIsEdit(false);
        setEditId(null);
    };

    const startEdit = (dispatch: PostalDispatch) => {
        setIsEdit(true);
        setEditId(dispatch.id);
        setFormData({
            to_title: dispatch.to_title,
            reference_no: dispatch.reference_no || "",
            address: dispatch.address || "",
            note: dispatch.note || "",
            from_title: dispatch.from_title || "",
            date: dispatch.date ? new Date(dispatch.date).toISOString().split("T")[0] : "",
            attachment: dispatch.attachment || ""
        });
    };

    const displayedDispatches = isBackendPaginated ? dispatches : dispatches.slice((page - 1) * limit, page * limit);

    const toggleSelectAll = () => {
        const displayedIds = displayedDispatches.map(d => d.id);
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
        if (dispatches.length === 0) return;
        const text = ["To Title\tReference No\tFrom Title\tDate", ...dispatches.map(d => `${d.to_title}\t${d.reference_no || "-"}\t${d.from_title || "-"}\t${d.date || "-"}`)].join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        if (dispatches.length === 0) return;
        const worksheet = XLSX.utils.json_to_sheet(dispatches.map(d => ({
            "To Title": d.to_title,
            "Reference No": d.reference_no || "-",
            "From Title": d.from_title || "-",
            Date: d.date || "-",
            Address: d.address || "",
            Note: d.note || ""
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Postal Dispatches");
        XLSX.writeFile(workbook, "postal_dispatches.xlsx");
        tt.success("excel_file_downloaded");
    };

    const handleExportPDF = () => {
        if (dispatches.length === 0) return;
        const doc = new jsPDF();
        autoTable(doc, {
            head: [["To Title", "Reference No", "From Title", "Date"]],
            body: dispatches.map(d => [d.to_title, d.reference_no || "-", d.from_title || "-", d.date || "-"]),
        });
        doc.save("postal_dispatches.pdf");
        tt.success("pdf_file_downloaded");
    };

    return (
        <div className="space-y-6 font-sans p-3 sm:p-5 bg-gray-50/10 min-h-screen pb-20 animate-in fade-in duration-500">
            {/* Page Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden no-print">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Send className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 tracking-tight leading-none">{t("postal_dispatch")}</h1>
                        <p className="text-[11px] text-gray-500 mt-1">{t("record_an_outgoing_dispatch") || "Manage and record outgoing postal packages"}</p>
                    </div>
                </div>
                <Button
                    className="btn-gradient text-white px-5 h-9 text-xs gap-1.5 shadow-md rounded-full font-bold uppercase tracking-wider cursor-pointer"
                    onClick={() => { setPage(1); fetchDispatches(); }}
                    disabled={loading}
                >
                    <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                    {t("refresh")}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Add Postal Dispatch Form (Compact 1/3 layout) */}
                <div className="lg:col-span-4 xl:col-span-4">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 dark:border-gray-800">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Send className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                    {isEdit ? t("edit_postal_dispatch") : t("add_postal_dispatch")}
                                </CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{isEdit ? t("update_dispatch_record") : t("record_an_outgoing_dispatch")}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-3.5">
                            <form onSubmit={handleSave} className="space-y-3.5">
                                <div className="space-y-1 group">
                                    <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                        {t("to_title")} <span className="text-destructive font-black">*</span>
                                    </label>
                                    <Input
                                        className="h-10 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 text-xs font-semibold text-gray-900 dark:text-gray-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={formData.to_title || ""}
                                        onChange={(e) => setFormData({ ...formData, to_title: e.target.value })}
                                        placeholder="Recipient / To Title"
                                        required
                                    />
                                </div>

                                <div className="space-y-1 group">
                                    <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                        {t("reference_no")}
                                    </label>
                                    <Input
                                        className="h-10 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 text-xs font-semibold text-gray-900 dark:text-gray-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={formData.reference_no || ""}
                                        onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                                        placeholder="Reference Number"
                                    />
                                </div>

                                <div className="space-y-1 group">
                                    <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                        {t("address")}
                                    </label>
                                    <Textarea
                                        className="min-h-[70px] rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 text-xs font-medium text-gray-900 dark:text-gray-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 resize-none"
                                        value={formData.address || ""}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Delivery Address"
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
                                        placeholder="Dispatch notes"
                                    />
                                </div>

                                <div className="space-y-1 group">
                                    <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                        {t("from_title")}
                                    </label>
                                    <Input
                                        className="h-10 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 text-xs font-semibold text-gray-900 dark:text-gray-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={formData.from_title || ""}
                                        onChange={(e) => setFormData({ ...formData, from_title: e.target.value })}
                                        placeholder="Sender / From Title"
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

                {/* Right Column: Postal Dispatch List Table (2/3 layout) */}
                <div className="lg:col-span-8 xl:col-span-8">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 dark:border-gray-800">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Send className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("postal_dispatch_list")}</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{t("total_entries_count", { count: total })}</p>
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
                                                    checked={displayedDispatches.length > 0 && displayedDispatches.every(d => selectedIds.includes(d.id))}
                                                    onCheckedChange={toggleSelectAll}
                                                    className="border-gray-300"
                                                />
                                            </th>
                                            <Th className="w-12">#</Th>
                                            <Th>{t("to_title")}</Th>
                                            <Th>{t("reference_no")}</Th>
                                            <Th>{t("from_title")}</Th>
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
                                                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                                                </td>
                                            </tr>
                                        ) : displayedDispatches.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-12 text-center text-xs font-semibold text-gray-400">{t("no_postal_dispatches_found")}</td>
                                            </tr>
                                        ) : (
                                            displayedDispatches.map((item, idx) => (
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
                                                                    {item.to_title ? item.to_title.substring(0, 2).toUpperCase() : "PD"}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="font-bold text-xs text-gray-900 dark:text-gray-100 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => startEdit(item)}>
                                                                {item.to_title}
                                                            </span>
                                                        </div>
                                                    </Td>
                                                    <Td className="whitespace-nowrap">
                                                        {item.reference_no ? (
                                                            <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/70 border border-indigo-100 px-2 py-0.5 rounded-md">
                                                                {item.reference_no}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-300">-</span>
                                                        )}
                                                    </Td>
                                                    <Td className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                                        {item.from_title || "-"}
                                                    </Td>
                                                    <Td className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                        <span className="flex items-center gap-1.5">
                                                            <CalendarDays className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                            {item.date ? new Date(item.date).toLocaleDateString() : "-"}
                                                        </span>
                                                    </Td>
                                                    <Td className="text-right whitespace-nowrap">
                                                        <div className="flex justify-end gap-1.5">
                                                            <ActionBtn icon={Eye} className="bg-indigo-500 hover:bg-indigo-600" title={t("view")} onClick={() => { setSelectedDispatch(item); setIsViewDialogOpen(true); }} />
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
                            {t("permanently_delete_postal_dispatch_entry")}
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
                        <AlertDialogTitle className="text-base font-bold text-gray-900">{t("bulk_delete_entries")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-gray-600">
                            {t("confirm_bulk_delete_postal_dispatch_entries", { count: selectedIds.length })}
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
                            {t("postal_dispatch_details")}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6 bg-white dark:bg-gray-900 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                            <DetailItem label={t("to_title")} value={selectedDispatch?.to_title} />
                            <DetailItem label={t("from_title")} value={selectedDispatch?.from_title} />
                            <DetailItem label={t("reference_no")} value={selectedDispatch?.reference_no} />
                            <DetailItem label={t("date")} value={selectedDispatch?.date ? new Date(selectedDispatch.date).toLocaleDateString() : "-"} />
                            <div className="col-span-1 sm:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t("address")}</label>
                                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 min-h-[60px]">
                                    {selectedDispatch?.address || t("no_address_provided")}
                                </p>
                            </div>
                            <div className="col-span-1 sm:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t("note")}</label>
                                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 min-h-[60px]">
                                    {selectedDispatch?.note || t("no_note_provided")}
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
