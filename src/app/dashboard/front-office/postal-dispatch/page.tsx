"use client";

import { useState, useEffect, useCallback } from "react";
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
    const { t } = useTranslation();
    const [dispatches, setDispatches] = useState<PostalDispatch[]>([]);
    const [loading, setLoading] = useState(true);
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
            tt.error("failed_to_load_postal_dispatches");
        } finally {
            setLoading(false);
        }
    }, [searchQuery, page, limit, tt]);

    useEffect(() => {
        fetchDispatches();
    }, [fetchDispatches]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
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
        const text = dispatches.map(d => `${d.to_title}\t${d.reference_no}\t${d.from_title}\t${d.date}`).join("\n");
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

                {/* Left Column: Add Postal Dispatch Form */}
                <div className="md:col-span-4">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
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
                        <CardContent className="p-6 space-y-4">
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">
                                        {t("to_title")} <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        className="h-10 rounded-lg bg-muted/30 border-muted/50 transition-all hover:border-indigo-200"
                                        value={formData.to_title || ""}
                                        onChange={(e) => setFormData({ ...formData, to_title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("reference_no")}</label>
                                    <Input
                                        className="h-10 rounded-lg bg-muted/30 border-muted/50"
                                        value={formData.reference_no || ""}
                                        onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("address")}</label>
                                    <Textarea
                                        className="min-h-[80px] rounded-lg bg-muted/30 border-muted/50 resize-none"
                                        value={formData.address || ""}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("from_title")}</label>
                                    <Input
                                        className="h-10 rounded-lg bg-muted/30 border-muted/50"
                                        value={formData.from_title || ""}
                                        onChange={(e) => setFormData({ ...formData, from_title: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5 group">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{t("date")}</label>
                                    <div className="relative">
                                        <Input
                                            type="date"
                                            className="h-10 rounded-lg bg-muted/30 border-muted/50 pr-10"
                                            value={formData.date || ""}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
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

                {/* Right Column: Postal Dispatch List Table */}
                <div className="md:col-span-8">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
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
                                        <IconButton icon={CopyIcon} onClick={handleCopy} />
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
                                                    checked={displayedDispatches.length > 0 && displayedDispatches.every(d => selectedIds.includes(d.id))}
                                                    onCheckedChange={toggleSelectAll}
                                                />
                                            </th>
                                            <Th>{t("to_title")}</Th>
                                            <Th>{t("reference_no")}</Th>
                                            <Th>{t("from_title")}</Th>
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
                                                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t("loading_dispatches")}</td>
                                            </tr>
                                        ) : displayedDispatches.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t("no_postal_dispatches_found")}</td>
                                            </tr>
                                        ) : (
                                            displayedDispatches.map((item) => (
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
                                                    <Td className="font-semibold text-slate-700">{item.to_title}</Td>
                                                    <Td className="text-slate-600 font-medium">{item.reference_no || "-"}</Td>
                                                    <Td className="text-slate-600 font-medium">{item.from_title || "-"}</Td>
                                                    <Td className="text-slate-600 font-medium">{item.date ? new Date(item.date).toLocaleDateString() : "-"}</Td>
                                                    <Td className="text-right">
                                                        <div className="flex justify-end gap-1 px-2">
                                                            <ActionBtn icon={Eye} className="bg-indigo-500" onClick={() => { setSelectedDispatch(item); setIsViewDialogOpen(true); }} />
                                                            {item.attachment && <ActionBtn icon={Download} className="bg-indigo-500" />}
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
                            {t("permanently_delete_postal_dispatch_entry")}
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
                            {t("confirm_bulk_delete_postal_dispatch_entries", { count: selectedIds.length })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsBulkDeleteDialogOpen(false)}>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600">{t("delete_selected")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="bg-gradient-to-r from-[#FF9800] to-[#6366F1] p-6">
                        <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            {t("postal_dispatch_details")}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6">
                        <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                            <DetailItem label={t("to_title")} value={selectedDispatch?.to_title} />
                            <DetailItem label={t("from_title")} value={selectedDispatch?.from_title} />
                            <DetailItem label={t("reference_no")} value={selectedDispatch?.reference_no} />
                            <DetailItem label={t("date")} value={selectedDispatch?.date ? new Date(selectedDispatch.date).toLocaleDateString() : "-"} />
                            <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("address")}</label>
                                <p className="text-sm text-slate-700 bg-muted/30 p-3 rounded-lg border border-muted/50 min-h-[60px]">
                                    {selectedDispatch?.address || t("no_address_provided")}
                                </p>
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t("note")}</label>
                                <p className="text-sm text-slate-700 bg-muted/30 p-3 rounded-lg border border-muted/50 min-h-[60px]">
                                    {selectedDispatch?.note || t("no_note_provided")}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end mt-8">
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
