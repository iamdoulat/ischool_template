"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
    FileSpreadsheet,
    FileText,
    FileCode,
    Printer,

    Pencil,
    Trash2,
    LayoutGrid,
    ChevronDown,
    Copy as CopyIcon,
    FolderTree
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
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface FeeGroup {
    id: number;
    name: string;
    description: string | null;
    school_class_id: string | null;
}

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

export default function FeesGroupPage() {
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [feesGroups, setFeesGroups] = useState<FeeGroup[]>([]);
    const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Selection state
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Dialog states
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Form and Editing state
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [formData, setFormData] = useState<Partial<FeeGroup>>({
        name: "",
        description: "",
        school_class_id: "",
    });

    const fetchFeesGroups = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/fees-groups", {
                params: {
                    search: searchQuery
                }
            });
            setFeesGroups(response.data.data.data || response.data.data);
        } catch (error) {
            console.error("Error fetching fees groups:", error);
            tt.error("failed_to_load_fees_groups");
        } finally {
            setLoading(false);
        }
    }, [searchQuery, tt]);

    const fetchClasses = async () => {
        try {
            const res = await api.get("/academics/classes?no_paginate=true");
            setClasses(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch classes", error);
        }
    };

    useEffect(() => {
        fetchFeesGroups();
        fetchClasses();
    }, [fetchFeesGroups]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEdit && editId) {
                await api.put(`/fees-groups/${editId}`, formData);
                tt.success("fees_group_updated_successfully");
            } else {
                await api.post("/fees-groups", formData);
                tt.success("fees_group_added_successfully");
            }
            fetchFeesGroups();
            resetForm();
        } catch (error) {
            console.error("Error saving fees group:", error);
            tt.error("failed_to_save_fees_group");
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/fees-groups/${deleteId}`);
            tt.success("fees_group_deleted_successfully");
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
            fetchFeesGroups();
        } catch (error) {
            console.error("Error deleting fees group:", error);
            tt.error("failed_to_delete_fees_group");
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post("/fees-groups/bulk-delete", { ids: selectedIds });
            tt.success("selected_fees_groups_deleted_successfully");
            setIsBulkDeleteDialogOpen(false);
            setSelectedIds([]);
            fetchFeesGroups();
        } catch (error) {
            console.error("Error bulk deleting fees groups:", error);
            tt.error("failed_to_delete_selected_entries");
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            school_class_id: "",
        });
        setIsEdit(false);
        setEditId(null);
    };

    const startEdit = (group: FeeGroup) => {
        setIsEdit(true);
        setEditId(group.id);
        setFormData({
            name: group.name,
            description: group.description || "",
            school_class_id: group.school_class_id?.toString() || "",
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === feesGroups.length && feesGroups.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(feesGroups.map(g => g.id));
        }
    };

    const toggleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const totalPages = Math.ceil(feesGroups.length / pageSize);
    const paginatedGroups = feesGroups.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleCopy = () => {
        const text = feesGroups.map(g => `${g.name}\t${g.description || ""}`).join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(feesGroups.map(g => ({
            Name: g.name,
            Description: g.description || ""
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Fees Groups");
        XLSX.writeFile(workbook, "fees_groups.xlsx");
        tt.success("exported_to_excel_successfully");
    };

    const handleExportCSV = () => {
        const worksheet = XLSX.utils.json_to_sheet(feesGroups.map(g => ({
            Name: g.name,
            Description: g.description || ""
        })));
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "fees_groups.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        tt.success("exported_to_csv_successfully");
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text(t("fees_groups_report"), 14, 15);

        const tableColumn = ["Name", "Description"];
        const tableRows = feesGroups.map(g => [
            g.name,
            g.description || ""
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });

        doc.save("fees_groups.pdf");
        tt.success("exported_to_pdf_successfully");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-700 pb-20">
            {/* Left Column: Add Fees Group Form */}
            <div className="lg:col-span-1">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <FolderTree className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                {isEdit ? t("edit_fees_group") : t("add_fees_group")}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {isEdit ? t("update_fees_group_details") : t("create_new_fees_group")}
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-5">
                        <form onSubmit={handleSave} className="space-y-4">
                            {/* Name */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    {t("name")} <span className="text-destructive font-black">*</span>
                                </label>
                                <Input
                                    required
                                    placeholder={t("enter_group_name")}
                                    className="h-11 rounded-lg bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium border-[#4F39F6]/20 focus-visible:border-[#4F39F6]"
                                    value={formData.name || ""}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    {t("description")}
                                </label>
                                <Textarea
                                    placeholder={t("enter_description")}
                                    className="min-h-[120px] rounded-lg bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium resize-none text-xs"
                                    value={formData.description || ""}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            {/* Class Assignment */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    {t("assign_to_class")} <span className="text-muted-foreground/50 font-normal normal-case tracking-normal">{t("optional_leave_blank_for_all_classes")}</span>
                                </label>
                                <select
                                    value={formData.school_class_id || ""}
                                    onChange={(e) => setFormData({ ...formData, school_class_id: e.target.value || "" })}
                                    className="flex h-11 w-full rounded-lg border border-muted/50 bg-muted/30 px-4 py-2 text-sm appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all font-medium"
                                >
                                    <option value="">{t("all_classes")}</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 flex justify-end gap-2">
                                {isEdit && (
                                    <Button type="button" variant="outline" className="h-11 px-6 rounded-lg font-bold" onClick={resetForm}>
                                        {t("cancel")}
                                    </Button>
                                )}
                                <Button type="submit" variant="gradient" className="h-11 px-10 rounded-lg font-bold tracking-tight shadow-lg shadow-primary/25">
                                    {isEdit ? t("update_group") : t("save_group")}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Fees Group List */}
            <div className="lg:col-span-2">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <FolderTree className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("fees_group_list")}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{t("x_total_entries", { count: feesGroups.length })}</p>
                        </div>
                    </CardHeader>

                    <div className="p-6 space-y-6">
                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative w-full max-sm group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder={t("search_groups")}
                                    className="pl-10 h-10 rounded-lg bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <select
                                    value={pageSize === Number.MAX_SAFE_INTEGER ? "All" : pageSize}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setPageSize(val === "All" ? Number.MAX_SAFE_INTEGER : Number(val));
                                        setCurrentPage(1);
                                    }}
                                    className="h-10 px-3 rounded-lg border border-muted/50 bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-medium text-muted-foreground"
                                >
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                    <option value="All">All</option>
                                </select>
                                <div className="h-8 w-px bg-muted/50 mx-2" />
                                <div className="flex gap-1">
                                    <IconButton icon={CopyIcon} onClick={handleCopy} title="Copy" />
                                    <IconButton icon={FileSpreadsheet} onClick={handleExportExcel} title="Excel" />
                                    <IconButton icon={FileText} onClick={handleExportCSV} title="CSV" />
                                    <IconButton icon={FileCode} onClick={handleExportPDF} title="PDF" />
                                    <IconButton icon={Printer} onClick={handlePrint} title="Print" />
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="rounded-lg border border-muted/50 overflow-hidden bg-muted/10 shadow-inner">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-muted/30">
                                            <th className="px-4 py-4 w-10 border-b border-muted/50">
                                                <Checkbox
                                                    checked={selectedIds.length === feesGroups.length && feesGroups.length > 0}
                                                    onCheckedChange={toggleSelectAll}
                                                />
                                            </th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 whitespace-nowrap">
                                                {t("name")}
                                            </th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 whitespace-nowrap">
                                                {t("description")}
                                            </th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 whitespace-nowrap">
                                                {t("class")}
                                            </th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 whitespace-nowrap text-right">
                                                <div className="flex justify-end pr-1 text-slate-700">
                                                    {selectedIds.length > 0 ? (
                                                        <button
                                                            onClick={() => setIsBulkDeleteDialogOpen(true)}
                                                            className="bg-red-500 hover:bg-red-600 p-1.5 rounded transition-colors flex items-center gap-1 text-white px-2"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            <span className="text-xs font-bold leading-none translate-y-[1px]">{t("delete")}</span>
                                                        </button>
                                                    ) : (
                                                        t("action")
                                                    )}
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-muted/50">
                                        {loading ? (
                                            <TableSkeleton rows={5} cols={5} />
                                        ) : feesGroups.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data_found")}</td>
                                            </tr>
                                        ) : (
                                            paginatedGroups.map((group) => (
                                                <tr key={group.id} className={cn(
                                                    "hover:bg-muted/20 transition-colors group/row",
                                                    selectedIds.includes(group.id) && "bg-muted/30"
                                                )}>
                                                    <td className="px-4 py-4">
                                                        <Checkbox
                                                            checked={selectedIds.includes(group.id)}
                                                            onCheckedChange={() => toggleSelect(group.id)}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-bold text-foreground">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-1.5 bg-primary/10 rounded-lg group-hover/row:bg-primary/20 transition-colors">
                                                                <LayoutGrid className="h-3.5 w-3.5 text-primary" />
                                                            </div>
                                                            {group.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-medium text-muted-foreground italic">
                                                        {group.description || "—"}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-bold text-muted-foreground">
                                                        {group.school_class_id
                                                            ? classes.find(c => c.id.toString() === group.school_class_id?.toString())?.name || "—"
                                                            : <span className="text-primary/60 italic font-normal">{t("all_classes")}</span>}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-end gap-1.5 pr-2">

                                                            <Button
                                                                size="icon"
                                                                onClick={() => startEdit(group)}
                                                                className="h-8 w-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 active:scale-90 transition-all font-bold"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                onClick={() => { setDeleteId(group.id); setIsDeleteDialogOpen(true); }}
                                                                className="h-8 w-8 rounded-lg bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 active:scale-90 transition-all"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {feesGroups.length > 0 && (
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-medium">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                    {t("showing_x_to_y_of_z", { from: Math.min((currentPage - 1) * pageSize + 1, feesGroups.length), to: Math.min(currentPage * pageSize, feesGroups.length), total: feesGroups.length })}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        className="h-8 w-8 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
                                    >
                                        <ChevronDown className="h-4 w-4 rotate-90" />
                                    </Button>
                                    <Button className="h-8 w-8 rounded-[10px] border-none p-0 text-white font-bold active:scale-95 transition-all shadow-md shadow-orange-500/10 bg-gradient-to-r from-[#FF9800] to-[#6366F1]">
                                        {currentPage}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        disabled={currentPage >= totalPages}
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        className="h-8 w-8 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
                                    >
                                        <ChevronDown className="h-4 w-4 -rotate-90" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Delete Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("are_you_sure")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("delete_fees_group_confirmation")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setDeleteId(null); setIsDeleteDialogOpen(false); }}>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 font-bold active:scale-95 transition-transform">{t("delete")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Delete Dialog */}
            <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("bulk_delete_entries")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("delete_selected_fees_groups_confirmation", { count: selectedIds.length })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsBulkDeleteDialogOpen(false)}>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600 font-bold active:scale-95 transition-transform">{t("delete_selected")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// Helper component for icon buttons
function IconButton({ icon: Icon, onClick, title }: { icon: React.ElementType, onClick?: () => void, title?: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className="p-2 hover:bg-muted rounded-lg transition-colors border border-muted/50 text-muted-foreground hover:text-foreground shadow-sm active:scale-95"
        >
            <Icon className="h-4 w-4" />
        </button>
    );
}
