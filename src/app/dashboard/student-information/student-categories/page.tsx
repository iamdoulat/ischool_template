"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
    Printer,
    FileText,
    FileSpreadsheet,
    Copy,
    Columns,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Loader2,
    Trash2,
    Tag,
    Sparkles,
    CheckCircle2,
    Bookmark
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

const CATEGORY_PRESETS = [
    "General",
    "OBC",
    "SC",
    "ST",
    "Scholarship / Merit",
    "Special Needs / Quota",
    "Staff Ward / Child",
    "Foreign Student"
];

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

interface Category {
    id: number;
    category_name: string;
}

export default function StudentCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [newCategoryName, setNewCategoryName] = useState("");
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // Single delete dialog
    const [idToDelete, setIdToDelete] = useState<number | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Bulk delete dialog
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

    const tt = useTranslateToast();
    const { t } = useTranslation();

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/student-categories");
            const data = response.data?.data || response.data || [];
            setCategories(Array.isArray(data) ? data : []);
            setSelectedIds(new Set());
        } catch (error) {
            console.error("Error fetching categories:", error);
            tt.error("failed_to_fetch_categories");
            setCategories([]);
        } finally {
            setLoading(false);
        }
    }, [tt]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            tt.error("category_name_is_required");
            return;
        }

        setSaving(true);
        try {
            if (editingCategory) {
                await api.put(`/student-categories/${editingCategory.id}`, { category_name: newCategoryName.trim() });
                tt.success("category_updated_successfully");
            } else {
                await api.post("/student-categories", { category_name: newCategoryName.trim() });
                tt.success("category_created_successfully");
            }
            setNewCategoryName("");
            setEditingCategory(null);
            await fetchCategories();
        } catch (error: any) {
            console.error("Error saving category:", error);
            if (error.response?.status === 422) {
                const validationErrors = error.response?.data?.errors;
                if (validationErrors) {
                    const firstError = Object.values(validationErrors)[0];
                    tt.error(Array.isArray(firstError) ? firstError[0] : firstError);
                } else {
                    tt.error(error.response?.data?.message || "Validation failed");
                }
            } else {
                const message = error.response?.data?.message || error.message || "Failed to save category.";
                tt.error(message);
            }
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (id: number) => {
        setIdToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!idToDelete) return;
        setDeleting(true);
        try {
            await api.delete(`/student-categories/${idToDelete}`);
            tt.success("category_deleted_successfully");
            fetchCategories();
        } catch (error) {
            tt.error("failed_to_delete_category");
        } finally {
            setDeleting(false);
            setIsDeleteDialogOpen(false);
            setIdToDelete(null);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;

        setDeleting(true);
        try {
            await api.post("/student-categories/bulk-delete", { ids: Array.from(selectedIds) });
            tt.success("selected_categories_deleted_successfully");
            fetchCategories();
        } catch (error) {
            tt.error("failed_to_delete_selected_categories");
        } finally {
            setDeleting(false);
            setIsBulkDeleteDialogOpen(false);
        }
    };

    const handleEdit = (cat: Category) => {
        setEditingCategory(cat);
        setNewCategoryName(cat.category_name);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(filteredCategories.map(c => c.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const filteredCategories = categories.filter(cat =>
        cat.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.id.toString().includes(searchTerm)
    );

    // Export functions
    const exportToCopy = () => {
        if (categories.length === 0) return;
        const text = ["#\tCategory Name\tCategory ID\tStatus", ...filteredCategories.map((c, idx) => `${idx + 1}\t${c.category_name}\t${c.id}\tActive`)].join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const exportToExcel = () => {
        if (categories.length === 0) return;
        const worksheet = XLSX.utils.json_to_sheet(filteredCategories.map((c, idx) => ({ "#": idx + 1, "Category Name": c.category_name, "Category ID": c.id, "Status": "Active" })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Categories");
        XLSX.writeFile(workbook, "student_categories.xlsx");
        tt.success("excel_file_downloaded");
    };

    const exportToPDF = () => {
        if (categories.length === 0) return;
        const doc = new jsPDF();
        doc.text("Student Category List", 14, 15);
        autoTable(doc, {
            head: [["#", "Category Name", "Category ID", "Status"]],
            body: filteredCategories.map((c, idx) => [idx + 1, c.category_name, `#${c.id}`, "Active"]),
            startY: 20
        });
        doc.save("student_categories.pdf");
        tt.success("pdf_file_downloaded");
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 font-sans p-3 sm:p-5 bg-gray-50/10 min-h-screen">
            {/* Left Column: Create Category Form */}
            <form onSubmit={handleSave} className="w-full lg:w-1/3">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Tag className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                {editingCategory ? t("edit_category") : t("create_category")}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {editingCategory ? t("update_category_details") : t("add_new_student_category")}
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 space-y-4">
                        {/* Category Name Input */}
                        <div className="space-y-1.5">
                            <Label htmlFor="category" className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {t("category")} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="category"
                                className="h-10 border-gray-200 bg-gray-50/30 text-xs rounded-lg shadow-none focus-visible:ring-indigo-500"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="e.g. General, OBC, Scholarship..."
                                required
                            />
                        </div>

                        {/* Quick Category Presets */}
                        <div className="space-y-1.5 pt-1 border-t border-gray-100 dark:border-gray-800">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-amber-500" /> Quick Category Presets
                            </Label>
                            <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                                {CATEGORY_PRESETS.map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => setNewCategoryName(preset)}
                                        className={cn(
                                            "px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer text-left",
                                            newCategoryName === preset
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                                : "bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 border-gray-200"
                                        )}
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                            {editingCategory && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-9 px-4 rounded-full text-xs font-bold uppercase border-gray-200"
                                    onClick={() => { setEditingCategory(null); setNewCategoryName(""); }}
                                >
                                    {t("cancel")}
                                </Button>
                            )}
                            <Button
                                type="submit"
                                disabled={saving || loading}
                                className="btn-gradient text-white px-8 h-9 text-[11px] font-bold uppercase shadow-lg shadow-orange-200/50 transition-all rounded-full flex items-center gap-2"
                            >
                                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                {editingCategory ? t("update") : t("save")}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>

            {/* Right Column: Category List Table */}
            <div className="w-full lg:w-2/3">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center justify-between gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Tag className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                    {t("category_list")}
                                </CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    {t("count_categories", { count: categories.length })}
                                </p>
                            </div>
                        </div>

                        {/* Export Toolbar */}
                        <div className="flex items-center gap-1 text-gray-400">
                            {selectedIds.size > 0 && (
                                <Button
                                    onClick={() => setIsBulkDeleteDialogOpen(true)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2.5 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center gap-1 font-bold mr-1 cursor-pointer"
                                    title={t("delete_selected")}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete ({selectedIds.size})
                                </Button>
                            )}
                            <Button onClick={exportToCopy} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Copy">
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button onClick={exportToExcel} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Export Excel">
                                <FileSpreadsheet className="h-4 w-4" />
                            </Button>
                            <Button onClick={exportToPDF} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Export PDF">
                                <FileText className="h-4 w-4" />
                            </Button>
                            <Button onClick={() => window.print()} variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Print">
                                <Printer className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer" title="Columns">
                                <Columns className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="px-5 pb-5 space-y-4">
                        {/* Search Bar & Summary Tag */}
                        <div className="flex justify-between items-center gap-4">
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search categories..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-9 text-xs border-gray-200 bg-gray-50/30 rounded-lg focus-visible:ring-indigo-500 shadow-none"
                                />
                            </div>

                            {categories.length > 0 && (
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10.5px] font-bold py-1 px-2.5">
                                    <Bookmark className="h-3 w-3 mr-1" />
                                    {categories.length} Total Categories
                                </Badge>
                            )}
                        </div>

                        {/* Enhanced Table */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xs">
                            <Table>
                                <TableHeader className="bg-gray-50/90 dark:bg-gray-800/80 text-[11px] uppercase font-bold text-gray-600 dark:text-gray-300">
                                    <TableRow className="hover:bg-transparent border-gray-200 dark:border-gray-700">
                                        <TableHead className="w-[45px] pl-4">
                                            <Checkbox
                                                checked={filteredCategories.length > 0 && selectedIds.size === filteredCategories.length}
                                                onCheckedChange={handleSelectAll}
                                                className="h-4 w-4 rounded-md border-gray-300 data-[state=checked]:bg-indigo-600 shadow-2xs"
                                            />
                                        </TableHead>
                                        <TableHead className="py-3 px-3 w-[60px]">#</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[220px]">{t("category")}</TableHead>
                                        <TableHead className="py-3 px-4 min-w-[140px]">{t("category_id")}</TableHead>
                                        <TableHead className="py-3 px-4 w-[120px]">Status</TableHead>
                                        <TableHead className="py-3 px-4 text-right w-[100px]">{t("action")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton rows={4} cols={6} />
                                    ) : filteredCategories.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="px-4 py-16 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
                                                {t("no_data_found")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredCategories.map((cat, idx) => {
                                            const isSelected = selectedIds.has(cat.id);
                                            return (
                                                <TableRow
                                                    key={cat.id}
                                                    className={cn(
                                                        "text-[13px] border-b last:border-0 border-gray-100 dark:border-gray-800 transition-colors group align-middle",
                                                        isSelected ? "bg-indigo-50/40 dark:bg-indigo-950/20" : "hover:bg-indigo-50/20"
                                                    )}
                                                >
                                                    <TableCell className="pl-4 py-3.5">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => handleSelectOne(cat.id)}
                                                            className="h-4 w-4 rounded-md border-gray-300 data-[state=checked]:bg-indigo-600 shadow-2xs"
                                                        />
                                                    </TableCell>

                                                    {/* Serial Number */}
                                                    <TableCell className="py-3.5 px-3 font-bold text-gray-400 text-xs">
                                                        {idx + 1}
                                                    </TableCell>

                                                    {/* Category Name & Avatar */}
                                                    <TableCell className="py-3.5 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                                                                <Tag className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                                                                    {cat.category_name}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Category ID Monospace Tag */}
                                                    <TableCell className="py-3.5 px-4">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 font-mono text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                                            ID: {cat.id}
                                                        </span>
                                                    </TableCell>

                                                    {/* Status */}
                                                    <TableCell className="py-3.5 px-4">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                                                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                            Active
                                                        </span>
                                                    </TableCell>

                                                    {/* Action Buttons */}
                                                    <TableCell className="py-3.5 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button
                                                                onClick={() => handleEdit(cat)}
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all shadow-xs"
                                                                title="Edit Category"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                onClick={() => confirmDelete(cat.id)}
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-7 w-7 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all shadow-xs"
                                                                title="Delete Category"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Footer */}
                        {filteredCategories.length > 0 && (
                            <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold pt-2 uppercase tracking-tight">
                                <div>
                                    {t("showing_x_to_y_of_z", { from: 1, to: filteredCategories.length, total: filteredCategories.length })}
                                </div>
                                <div className="flex gap-1.5">
                                    <Button
                                        size="sm"
                                        className="h-8 w-8 p-0 bg-white border border-gray-200 text-gray-600 rounded-[10px] shadow-sm disabled:opacity-40"
                                        disabled
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-8 w-8 p-0 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white border-0 rounded-[10px] shadow-sm font-black"
                                    >
                                        1
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-8 w-8 p-0 bg-white border border-gray-200 text-gray-600 rounded-[10px] shadow-sm disabled:opacity-40"
                                        disabled
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialogs */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">{t("are_you_sure")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            {t("permanently_delete_category", { name: categories.find(c => c.id === idToDelete)?.category_name || "" })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel disabled={deleting} className="h-9 rounded-full text-[11px] font-bold uppercase tracking-wider border-gray-200">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            className="bg-rose-500 hover:bg-rose-600 h-9 rounded-full text-[11px] font-bold uppercase tracking-wider border-0 shadow-md"
                            disabled={deleting}
                        >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-800">{t("are_you_absolutely_sure")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-gray-500 leading-relaxed mt-2">
                            {t("permanently_delete_selected_categories", { count: selectedIds.size })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel disabled={deleting} className="h-9 rounded-full text-[11px] font-bold uppercase tracking-wider border-gray-200">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleBulkDelete();
                            }}
                            className="bg-rose-500 hover:bg-rose-600 h-9 rounded-full text-[11px] font-bold uppercase tracking-wider border-0 shadow-md"
                            disabled={deleting}
                        >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {t("delete_all")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
