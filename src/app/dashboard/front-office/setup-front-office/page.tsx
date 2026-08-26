"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Search,
    Printer,
    FileText,
    Download,
    Columns,
    Pencil,
    Trash2,
    Copy,
    Settings2,
    List,
    FileSpreadsheet,
    ChevronLeft,
    ChevronRight,
    Loader2,
    RefreshCw,
    Bookmark,
    AlertCircle,
    Radio,
    FileText as FileTextIcon,
    LucideIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
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

const tabs = [
    { id: "purpose", label: "Purpose", endpoint: "/front-office-purposes", icon: Bookmark },
    { id: "complaint-type", label: "Complaint Type", endpoint: "/complaint-types", icon: AlertCircle },
    { id: "source", label: "Source", endpoint: "/front-office-sources", icon: Radio },
    { id: "reference", label: "Reference", endpoint: "/front-office-references", icon: FileTextIcon },
];

interface TabItem {
    id: number;
    name: string;
    description: string | null;
}

export default function SetupFrontOfficePage() {
    const tt = useTranslateToast();
    const ttRef = useRef(tt);
    ttRef.current = tt;
    const { t } = useTranslation();
    const [activeTabId, setActiveTabId] = useState("purpose");
    const [items, setItems] = useState<TabItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);
    const [total, setTotal] = useState(0);
    const [lastPage, setLastPage] = useState(1);
    const [isBackendPaginated, setIsBackendPaginated] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        description: ""
    });

    const activeTab = tabs.find(t => t.id === activeTabId)!;
    const currentTabLabel = activeTab.label;

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get(activeTab.endpoint, {
                params: {
                    search: searchQuery,
                    page: page,
                    limit: limit
                }
            });
            const resData = response.data?.data;
            if (resData && resData.data) {
                setItems(resData.data);
                setTotal(resData.total || 0);
                setLastPage(resData.last_page || 1);
                setIsBackendPaginated(true);
            } else {
                const list = Array.isArray(resData) ? resData : [];
                setItems(list);
                setTotal(list.length);
                setLastPage(Math.ceil(list.length / limit) || 1);
                setIsBackendPaginated(false);
            }
            setSelectedIds([]);
        } catch (error) {
            console.error("Error fetching items:", error);
            ttRef.current.error("failed_to_load_x_list", { label: currentTabLabel });
        } finally {
            setLoading(false);
        }
    }, [activeTab.endpoint, searchQuery, page, limit, currentTabLabel]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            tt.error("name_required" || "Name is required");
            return;
        }
        setSaving(true);
        try {
            if (isEdit && editId) {
                await api.put(`${activeTab.endpoint}/${editId}`, formData);
                tt.success("x_updated_successfully", { label: currentTabLabel });
            } else {
                await api.post(activeTab.endpoint, formData);
                tt.success("x_added_successfully", { label: currentTabLabel });
            }
            fetchItems();
            resetForm();
        } catch (error) {
            console.error("Error saving item:", error);
            const err = error as { response?: { data?: { message?: string } } };
            const message = err.response?.data?.message || `Failed to save ${currentTabLabel}`;
            tt.error(message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setSaving(true);
        try {
            await api.delete(`${activeTab.endpoint}/${deleteId}`);
            tt.success("x_deleted_successfully", { label: currentTabLabel });
            fetchItems();
        } catch (error) {
            console.error("Error deleting item:", error);
            tt.error("failed_to_delete_x", { label: currentTabLabel });
        } finally {
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
            setSaving(false);
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post(`${activeTab.endpoint}/bulk-delete`, { ids: selectedIds });
            tt.success("items_deleted_successfully", { count: selectedIds.length });
            setIsBulkDeleteDialogOpen(false);
            setSelectedIds([]);
            fetchItems();
        } catch (error) {
            console.error("Error bulk deleting items:", error);
            tt.error("failed_to_delete_selected_x_list", { label: currentTabLabel });
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: ""
        });
        setIsEdit(false);
        setEditId(null);
    };

    const startEdit = (item: TabItem) => {
        setIsEdit(true);
        setEditId(item.id);
        setFormData({
            name: item.name,
            description: item.description || ""
        });
    };

    const displayedItems = isBackendPaginated ? items : items.slice((page - 1) * limit, page * limit);

    const toggleSelectAll = () => {
        const displayedIds = displayedItems.map(p => p.id);
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
        if (items.length === 0) return;
        const text = items.map(p => `${p.name}\t${p.description || "-"}`).join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        if (items.length === 0) return;
        const worksheet = XLSX.utils.json_to_sheet(items.map(item => ({
            [currentTabLabel]: item.name,
            Description: item.description || "-"
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, currentTabLabel);
        XLSX.writeFile(workbook, `${activeTabId}_list.xlsx`);
        tt.success("excel_file_downloaded");
    };

    const handleExportPDF = () => {
        if (items.length === 0) return;
        const doc = new jsPDF();
        autoTable(doc, {
            head: [[currentTabLabel, "Description"]],
            body: items.map(item => [item.name, item.description || "-"]),
        });
        doc.save(`${activeTabId}_list.pdf`);
        tt.success("pdf_file_downloaded");
    };

    return (
        <div className="space-y-6 font-sans p-3 sm:p-5 bg-gray-50/10 min-h-screen pb-20 animate-in fade-in duration-500">
            {/* Page Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden no-print">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Settings2 className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 dark:text-gray-100 tracking-tight leading-none">{t("setup_front_office")}</h1>
                        <p className="text-[11px] text-gray-500 mt-1">{t("manage_front_office_master_data") || "Configure purposes, complaint types, sources, and references"}</p>
                    </div>
                </div>
                <Button
                    className="btn-gradient text-white px-5 h-9 text-xs gap-1.5 shadow-md rounded-full font-bold uppercase tracking-wider cursor-pointer"
                    onClick={() => { setPage(1); fetchItems(); }}
                    disabled={loading}
                >
                    <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                    {t("refresh")}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Column 1: Vertical Tabs */}
                <div className="lg:col-span-3 xl:col-span-2">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden sticky top-6 rounded-2xl">
                        <div className="flex flex-col p-1.5 space-y-1">
                            {tabs.map((tab) => {
                                const TabIcon = tab.icon;
                                const isActive = activeTabId === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveTabId(tab.id);
                                            setSearchQuery("");
                                            setPage(1);
                                            resetForm();
                                        }}
                                        className={cn(
                                            "flex items-center gap-2.5 px-3.5 py-3 text-xs font-bold rounded-xl transition-all text-left cursor-pointer",
                                            isActive
                                                ? "btn-gradient text-white shadow-sm"
                                                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 hover:text-gray-900"
                                        )}
                                    >
                                        <TabIcon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-gray-400")} />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* Column 2: Add Form */}
                <div className="lg:col-span-4 xl:col-span-4">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 dark:border-gray-800">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Settings2 className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                    {isEdit ? `${t("edit")} ${currentTabLabel}` : `${t("add")} ${currentTabLabel}`}
                                </CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{isEdit ? t("update_entry") : t("create_a_new_entry")}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-3.5">
                            <form onSubmit={handleSave} className="space-y-3.5">
                                <div className="space-y-1 group">
                                    <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                        {currentTabLabel} <span className="text-destructive font-black">*</span>
                                    </label>
                                    <Input
                                        className="h-10 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 text-xs font-semibold text-gray-900 dark:text-gray-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder={`Enter ${currentTabLabel.toLowerCase()} name`}
                                        required
                                    />
                                </div>

                                <div className="space-y-1 group">
                                    <label className="text-[11.5px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider ml-0.5 group-focus-within:text-indigo-600 transition-colors">
                                        {t("description")}
                                    </label>
                                    <Textarea
                                        className="min-h-[100px] rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 text-xs font-medium text-gray-900 dark:text-gray-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 resize-none"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Optional description"
                                    />
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

                {/* Column 3: List Table */}
                <div className="lg:col-span-5 xl:col-span-6">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 dark:border-gray-800">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <List className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{`${currentTabLabel} ${t("list")}`}</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{t("total_entries_count", { count: total })}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {/* Toolbar */}
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-5">
                                <div className="relative w-full md:w-64">
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
                                        <IconButton icon={Copy} onClick={handleCopy} title={t("copy")} />
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
                                                    checked={displayedItems.length > 0 && displayedItems.every(item => selectedIds.includes(item.id))}
                                                    onCheckedChange={toggleSelectAll}
                                                    className="border-gray-300"
                                                />
                                            </th>
                                            <Th className="w-12">#</Th>
                                            <Th>{currentTabLabel}</Th>
                                            <Th>{t("description")}</Th>
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
                                                <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                                                </td>
                                            </tr>
                                        ) : displayedItems.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-12 text-center text-xs font-semibold text-gray-400">{t("no_data_found")}</td>
                                            </tr>
                                        ) : (
                                            displayedItems.map((item, idx) => (
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
                                                                    {item.name ? item.name.substring(0, 2).toUpperCase() : "FO"}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="font-bold text-xs text-gray-900 dark:text-gray-100 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => startEdit(item)}>
                                                                {item.name}
                                                            </span>
                                                        </div>
                                                    </Td>
                                                    <Td className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                                        {item.description || <span className="text-gray-300">-</span>}
                                                    </Td>
                                                    <Td className="text-right whitespace-nowrap">
                                                        <div className="flex justify-end gap-1.5">
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
                                        disabled={page === 1}
                                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    
                                    {Array.from({ length: lastPage }).map((_, i) => {
                                        const p = i + 1;
                                        const isCurrent = p === page;
                                        const isAdjacent = Math.abs(p - page) <= 1;
                                        const isEdge = p === 1 || p === lastPage;

                                        if (isCurrent || isAdjacent || isEdge) {
                                            return (
                                                <Button
                                                    key={p}
                                                    className={cn(
                                                        "h-8 w-8 rounded-lg p-0 text-xs font-bold transition-all shadow-xs cursor-pointer",
                                                        isCurrent
                                                            ? "btn-gradient text-white"
                                                            : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                                    )}
                                                    onClick={() => setPage(p)}
                                                >
                                                    {p}
                                                </Button>
                                            );
                                        } else if (p === 2 && page > 3) {
                                            return <span key={p} className="text-gray-400 text-xs">…</span>;
                                        } else if (p === lastPage - 1 && page < lastPage - 2) {
                                            return <span key={p} className="text-gray-400 text-xs">…</span>;
                                        }
                                        return null;
                                    })}

                                    <Button
                                        size="icon"
                                        className="h-8 w-8 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 cursor-pointer shadow-xs"
                                        disabled={page === lastPage || lastPage === 0}
                                        onClick={() => setPage(prev => Math.min(prev + 1, lastPage))}
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
                            {t("permanently_delete_x_entry", { label: currentTabLabel })}
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
                            {t("confirm_bulk_delete_items", { count: selectedIds.length })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-full h-9 text-xs font-bold uppercase" onClick={() => setIsBulkDeleteDialogOpen(false)}>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-rose-600 hover:bg-rose-700 rounded-full h-9 text-xs font-bold uppercase">{t("delete_selected")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// Helper Components
function Th({ children, className }: { children: React.ReactNode, className?: string }) {
    return <th className={cn("px-3.5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 whitespace-nowrap", className)}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode, className?: string }) {
    return <td className={cn("px-3.5 py-3 text-xs text-gray-900 dark:text-gray-100", className)}>{children}</td>;
}

function IconButton({ icon: Icon, onClick, title }: { icon: LucideIcon, onClick?: () => void, title?: string }) {
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

function ActionBtn({ icon: Icon, className, onClick, title }: { icon: LucideIcon, className?: string, onClick?: () => void, title?: string }) {
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
