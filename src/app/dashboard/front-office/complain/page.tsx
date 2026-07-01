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
    Copy,
    FileSpreadsheet,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/complaints/${deleteId}`);
            tt.success("complaint_deleted_successfully");
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
            fetchComplaints();
        } catch (error) {
            console.error("Error deleting complaint:", error);
            const err = error as { response?: { status?: number } };
            if (err.response?.status === 404) {
                tt.error("complaint_not_found_already_deleted");
            } else {
                tt.error("failed_to_delete_complaint");
            }
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
            fetchComplaints();
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
        if (displayedComplaints.length > 0 && displayedComplaints.every(c => selectedIds.includes(c.id))) {
            setSelectedIds(selectedIds.filter(id => !displayedComplaints.some(c => c.id === id)));
        } else {
            const newSelected = [...selectedIds];
            displayedComplaints.forEach(c => {
                if (!newSelected.includes(c.id)) {
                    newSelected.push(c.id);
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
        const text = complaints.map(c => `${c.id}\t${c.complaint_type}\t${c.complain_by}\t${c.phone}\t${c.date}`).join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        tt.success("exporting_to_excel");
    };

    const handleExportPDF = () => {
        tt.success("exporting_to_pdf");
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Left Column: Add Complain Form */}
                <div className="md:col-span-4">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
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
                        <CardContent className="p-6 space-y-4">
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("complaint_id")}</label>
                                    <Input
                                        className="h-10 rounded-lg bg-muted/50 border-muted/50 text-slate-500 cursor-not-allowed"
                                        value={formData.complaint_id || t("auto_generated")}
                                        disabled
                                    />
                                </div>
                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("complaint_type")}</label>
                                    <div className="relative">
                                        <select
                                            className="flex h-10 w-full rounded-lg border border-muted/50 bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer group-hover:border-indigo-200 transition-colors font-medium text-slate-700"
                                            value={formData.complaint_type || ""}
                                            onChange={(e) => setFormData({ ...formData, complaint_type: e.target.value })}
                                        >
                                            <option value="">{t("select")}</option>
                                            {dynamicComplaintTypes.map(type => (
                                                <option key={type.id} value={type.name}>{type.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("source")}</label>
                                    <div className="relative">
                                        <select
                                            className="flex h-10 w-full rounded-lg border border-muted/50 bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer group-hover:border-indigo-200 transition-colors font-medium text-slate-700"
                                            value={formData.source || ""}
                                            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                        >
                                            <option value="">{t("select")}</option>
                                            {dynamicSources.map(source => (
                                                <option key={source.id} value={source.name}>{source.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                                        {t("complain_by")} <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        className="h-10 rounded-lg bg-muted/30 border-muted/50 transition-all hover:border-indigo-200"
                                        value={formData.complain_by || ""}
                                        onChange={(e) => setFormData({ ...formData, complain_by: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("phone")}</label>
                                    <Input
                                        className="h-10 rounded-lg bg-muted/30 border-muted/50"
                                        value={formData.phone || ""}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("date")}</label>
                                    <Input
                                        type="date"
                                        className="h-10 rounded-lg bg-muted/30 border-muted/50"
                                        value={formData.date || ""}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("description")}</label>
                                    <Textarea
                                        className="min-h-[80px] rounded-lg bg-muted/30 border-muted/50 resize-none"
                                        value={formData.description || ""}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("action_taken")}</label>
                                    <Input
                                        className="h-10 rounded-lg bg-muted/30 border-muted/50"
                                        value={formData.action_taken || ""}
                                        onChange={(e) => setFormData({ ...formData, action_taken: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("assigned")}</label>
                                    <Input
                                        className="h-10 rounded-lg bg-muted/30 border-muted/50"
                                        value={formData.assigned || ""}
                                        onChange={(e) => setFormData({ ...formData, assigned: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("note")}</label>
                                    <Textarea
                                        className="min-h-[80px] rounded-lg bg-muted/30 border-muted/50 resize-none"
                                        value={formData.note || ""}
                                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("attach_document")}</label>
                                    <div className="border-2 border-dashed border-muted/50 rounded-lg p-6 bg-muted/10 group-hover:bg-muted/20 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group-hover:border-indigo-300">
                                        <div className="p-2 rounded-full bg-muted/30">
                                            <CloudUpload className="h-5 w-5 text-muted-foreground group-hover:text-indigo-500 transition-colors" />
                                        </div>
                                        <p className="text-xs font-semibold text-muted-foreground group-hover:text-slate-900 transition-colors">{t("drag_and_drop_file")}</p>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    {isEdit && (
                                        <Button type="button" variant="outline" className="h-10 px-6" onClick={resetForm}>
                                            {t("cancel")}
                                        </Button>
                                    )}
                                    <Button type="submit" variant="gradient" className="h-10 px-8">
                                        {t("save")}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Complaint List Table */}
                <div className="md:col-span-8">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
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
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t("search")}
                                        className="pl-10 h-10 rounded-lg bg-muted/30 border-muted/50"
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
                                            <SelectTrigger className="h-8 w-16 text-xs border border-muted/50 bg-muted/30 hover:bg-muted/50 transition-colors shadow-none rounded-lg font-semibold text-muted-foreground">
                                                <SelectValue placeholder={String(limit)} />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-lg border-muted/50">
                                                {[20, 50, 100, 500].map((n) => (
                                                    <SelectItem key={n} value={String(n)} className="font-medium text-slate-700">
                                                        {n}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex gap-1">
                                        <IconButton icon={Printer} onClick={handlePrint} />
                                        <IconButton icon={Copy} onClick={handleCopy} />
                                        <IconButton icon={FileSpreadsheet} onClick={handleExportExcel} />
                                        <IconButton icon={FileText} onClick={handleExportPDF} />
                                        <IconButton icon={Download} onClick={() => tt.success("downloading")} />
                                        <IconButton icon={Columns} />
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto rounded-lg border border-muted/50">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-muted/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-4 w-10 border-b border-muted/50">
                                                <Checkbox
                                                    checked={displayedComplaints.length > 0 && displayedComplaints.every(c => selectedIds.includes(c.id))}
                                                    onCheckedChange={toggleSelectAll}
                                                />
                                            </th>
                                            <Th>{t("complain_number")}</Th>
                                            <Th>{t("complaint_type")}</Th>
                                            <Th>{t("name")}</Th>
                                            <Th>{t("phone")}</Th>
                                            <Th>{t("date")}</Th>
                                            <th className="px-4 py-4 border-b border-muted/50 text-right">
                                                <div className="flex justify-end pr-1 text-slate-700">
                                                    {selectedIds.length > 0 ? (
                                                        <button
                                                            onClick={() => setIsBulkDeleteDialogOpen(true)}
                                                            className="bg-red-500 hover:bg-red-600 p-1.5 rounded transition-colors"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5 text-white" />
                                                        </button>
                                                    ) : (
                                                        t("action")
                                                    )}
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-muted/30">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">{t("loading_complaints")}</td>
                                            </tr>
                                        ) : displayedComplaints.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">{t("no_complaints_found")}</td>
                                            </tr>
                                        ) : (
                                            displayedComplaints.map((item) => (
                                                <tr key={item.id} className={cn(
                                                    "hover:bg-muted/10 transition-colors group",
                                                    selectedIds.includes(item.id) && "bg-muted/30"
                                                )}>
                                                    <td className="px-4 py-4">
                                                        <Checkbox
                                                            checked={selectedIds.includes(item.id)}
                                                            onCheckedChange={() => toggleSelect(item.id)}
                                                        />
                                                    </td>
                                                    <Td className="text-slate-600 font-medium">{item.complaint_id || item.id}</Td>
                                                    <Td className="text-slate-600 font-medium">{item.complaint_type || "-"}</Td>
                                                    <Td className="font-semibold text-slate-700">{item.complain_by}</Td>
                                                    <Td className="text-slate-600 font-medium">{item.phone || "-"}</Td>
                                                    <Td className="text-slate-600 font-medium">{item.date ? new Date(item.date).toLocaleDateString() : "-"}</Td>
                                                    <Td className="text-right">
                                                        <div className="flex justify-end gap-1 px-2">
                                                            <ActionBtn icon={Eye} className="bg-indigo-500" onClick={() => { setSelectedComplaint(item); setIsViewDialogOpen(true); }} />
                                                            <ActionBtn icon={Pencil} className="bg-amber-500" onClick={() => startEdit(item)} />
                                                            <ActionBtn icon={Trash2} className="bg-red-500" onClick={() => { setDeleteId(item.id); setIsDeleteDialogOpen(true); }} />
                                                        </div>
                                                    </Td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-medium">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                    {t("showing_x_to_y_of_z", { from: total > 0 ? (page - 1) * limit + 1 : 0, to: Math.min(page * limit, total), total })}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all disabled:opacity-50"
                                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                        disabled={page === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    {Array.from({ length: lastPage }, (_, i) => i + 1).map((p) => (
                                        <Button
                                            key={p}
                                            className={cn(
                                                "h-8 w-8 rounded-lg border-none p-0 font-bold active:scale-95 transition-all shadow-md",
                                                p === page
                                                    ? "text-white shadow-orange-500/10 bg-gradient-to-r from-[#FF9800] to-[#6366F1]"
                                                    : "bg-white border border-gray-200 hover:bg-muted text-gray-600"
                                            )}
                                            onClick={() => setPage(p)}
                                        >
                                            {p}
                                        </Button>
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all disabled:opacity-50"
                                        onClick={() => setPage(prev => Math.min(prev + 1, lastPage))}
                                        disabled={page === lastPage}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("are_you_sure")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("permanently_delete_complaint_entry")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setDeleteId(null); setIsDeleteDialogOpen(false); }}>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">{t("delete")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("bulk_delete_entries")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("confirm_bulk_delete_complaint_entries", { count: selectedIds.length })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsBulkDeleteDialogOpen(false)}>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600">{t("delete_selected")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="w-[95vw] max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] p-5 sm:p-6 shrink-0">
                        <DialogTitle className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                            <Eye className="h-5 w-5 shrink-0" />
                            {t("complaint_details")}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto max-h-[70vh] p-5 sm:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 sm:gap-y-6 sm:gap-x-8">
                            <DetailItem label={t("complaint_id")} value={selectedComplaint?.complaint_id} />
                            <DetailItem label={t("complaint_type")} value={selectedComplaint?.complaint_type} />
                            <DetailItem label={t("source")} value={selectedComplaint?.source} />
                            <DetailItem label={t("complain_by")} value={selectedComplaint?.complain_by} />
                            <DetailItem label={t("phone")} value={selectedComplaint?.phone} />
                            <DetailItem label={t("date")} value={selectedComplaint?.date ? new Date(selectedComplaint.date).toLocaleDateString() : "-"} />
                            <DetailItem label={t("assigned")} value={selectedComplaint?.assigned} />
                            <DetailItem label={t("action_taken")} value={selectedComplaint?.action_taken} />
                            <div className="col-span-1 sm:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("description")}</label>
                                <p className="text-sm text-slate-700 bg-muted/30 p-3 rounded-lg border border-muted/50 min-h-[60px] whitespace-pre-wrap break-words">
                                    {selectedComplaint?.description || t("no_description_provided")}
                                </p>
                            </div>
                            <div className="col-span-1 sm:col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("note")}</label>
                                <p className="text-sm text-slate-700 bg-muted/30 p-3 rounded-lg border border-muted/50 min-h-[60px] whitespace-pre-wrap break-words">
                                    {selectedComplaint?.note || t("no_note_provided")}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end mt-6">
                            <Button
                                onClick={() => setIsViewDialogOpen(false)}
                                variant="gradient"
                                className="px-8 h-10 rounded-lg shadow-lg shadow-indigo-200 transition-all active:scale-95 text-white"
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
    return <th className={cn("px-4 py-4 border-b border-muted/50 whitespace-nowrap", className)}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode, className?: string }) {
    return <td className={cn("px-4 py-4 text-sm whitespace-nowrap", className)}>{children}</td>;
}

function IconButton({ icon: Icon, onClick }: { icon: React.ElementType, onClick?: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="p-2 hover:bg-muted rounded-lg transition-colors border border-muted/50 text-muted-foreground hover:text-foreground shadow-sm"
        >
            <Icon className="h-4 w-4" />
        </button>
    );
}

function ActionBtn({ icon: Icon, className, onClick }: { icon: React.ElementType, className?: string, onClick?: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn("p-1.5 text-white rounded transition-all hover:shadow-md active:scale-90", className)}
        >
            <Icon className="h-3 w-3" />
        </button>
    );
}

function DetailItem({ label, value }: { label: string, value: string | null | undefined }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
            <div className="h-10 flex items-center px-3 bg-muted/30 rounded-lg border border-muted/50">
                <span className="text-sm font-semibold text-slate-700">{value || "-"}</span>
            </div>
        </div>
    );
}
