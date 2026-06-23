"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
    Printer,
    FileText,
    Table as TableIcon,
    Download,
    Columns,
    ChevronDown,
    Pencil,
    X,
    Loader2,
    Trash2,
    Tag
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
    const [searchTerm, setSearchTerm] = useState("");
    const [newCategoryName, setNewCategoryName] = useState("");
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const tt = useTranslateToast();
    const { t } = useTranslation();

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/student-categories");
            setCategories(response.data.data);
            setSelectedIds(new Set());
        } catch (error) {
            console.error("Error fetching categories:", error);
            tt.error("failed_to_fetch_categories");
        } finally {
            setLoading(false);
        }
    }, [tt]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleSave = async () => {
        if (!newCategoryName.trim()) {
            tt.error("category_name_is_required");
            return;
        }

        setLoading(true);
        try {
            if (editingCategory) {
                await api.put(`/student-categories/${editingCategory.id}`, { category_name: newCategoryName });
                tt.success("category_updated_successfully");
            } else {
                await api.post("/student-categories", { category_name: newCategoryName });
                tt.success("category_created_successfully");
            }
            setNewCategoryName("");
            setEditingCategory(null);
            fetchCategories();
        } catch (error) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to save category.";
            tt.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        setLoading(true);
        try {
            await api.delete(`/student-categories/${id}`);
            tt.success("category_deleted_successfully");
            fetchCategories();
        } catch (error) {
            tt.error("failed_to_delete_category");
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;

        setLoading(true);
        try {
            await api.post("/student-categories/bulk-delete", { ids: Array.from(selectedIds) });
            tt.success("selected_categories_deleted_successfully");
            fetchCategories();
        } catch (error) {
            tt.error("failed_to_delete_selected_categories");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (cat: Category) => {
        setEditingCategory(cat);
        setNewCategoryName(cat.category_name);
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
        cat.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.id.toString().includes(searchTerm)
    );

    // Export functions
    const exportToCopy = () => {
        if (categories.length === 0) return;
        const text = ["Category\tCategory ID", ...categories.map(c => `${c.category_name}\t${c.id}`)].join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const exportToExcel = () => {
        if (categories.length === 0) return;
        const worksheet = XLSX.utils.json_to_sheet(categories.map(c => ({ Category: c.category_name, "Category ID": c.id })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Categories");
        XLSX.writeFile(workbook, "student_categories.xlsx");
        tt.success("excel_file_downloaded");
    };

    const exportToPDF = () => {
        if (categories.length === 0) return;
        const doc = new jsPDF();
        autoTable(doc, {
            head: [["Category", "Category ID"]],
            body: categories.map(c => [c.category_name, c.id]),
        });
        doc.save("student_categories.pdf");
        tt.success("pdf_file_downloaded");
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Left Column: Create Category Form */}
                <div className="md:col-span-4">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
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
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                    {t("category")} <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    className="h-11 rounded-lg bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all border-indigo-200"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder={t("enter_category_name")}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                {editingCategory && (
                                    <Button variant="outline" className="h-10 px-6" onClick={() => { setEditingCategory(null); setNewCategoryName(""); }}>
                                        {t("cancel")}
                                    </Button>
                                )}
                                <Button variant="gradient" className="h-10 px-8" onClick={handleSave} disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    {editingCategory ? t("update") : t("save")}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Category List Table */}
                <div className="md:col-span-8">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Tag className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("category_list")}</CardTitle>
                                <p className="text-[11px] text-gray-500 mt-1">{t("count_categories", { count: categories.length })}</p>
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
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <IconButton icon={Printer} onClick={() => window.print()} title={t("print")} />
                                        <IconButton icon={Copy} onClick={exportToCopy} title={t("copy")} />
                                        <IconButton icon={TableIcon} onClick={exportToExcel} title={t("excel")} />
                                        <IconButton icon={FileText} onClick={exportToPDF} title={t("pdf")} />
                                        <IconButton icon={Download} onClick={exportToExcel} title={t("download")} />
                                        <IconButton icon={Columns} title={t("columns")} />
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-hidden rounded-lg border border-muted/50">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        <tr>
                                            <Th className="w-10">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-muted/50 text-primary cursor-pointer"
                                                    checked={filteredCategories.length > 0 && selectedIds.size === filteredCategories.length}
                                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                                />
                                            </Th>
                                            <Th>{t("category")}</Th>
                                            <Th>{t("category_id")}</Th>
                                            <Th className="text-right flex items-center justify-end gap-2">
                                                <span>{t("action")}</span>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <button
                                                            disabled={selectedIds.size === 0}
                                                            className={cn(
                                                                "p-1 rounded transition-all shadow-sm active:scale-90",
                                                                selectedIds.size > 0 ? "bg-red-500 text-white hover:bg-red-600" : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                                                            )}
                                                            title={t("delete_selected")}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>{t("are_you_absolutely_sure")}</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {t("permanently_delete_selected_categories", { count: selectedIds.size })}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                                                            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600">{t("delete_all")}</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </Th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-muted/30">
                                        {loading ? (
                                            <TableSkeleton rows={5} cols={4} />
                                        ) : filteredCategories.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_data_found")}</td>
                                            </tr>
                                        ) : (
                                            filteredCategories.map((cat) => (
                                                <tr key={cat.id} className="hover:bg-muted/10 transition-colors group">
                                                    <Td>
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 rounded border-muted/50 text-primary cursor-pointer"
                                                            checked={selectedIds.has(cat.id)}
                                                            onChange={() => handleSelectOne(cat.id)}
                                                        />
                                                    </Td>
                                                    <Td className="font-semibold text-slate-700">{cat.category_name}</Td>
                                                    <Td className="text-slate-600 font-medium">{cat.id}</Td>
                                                    <Td className="text-right">
                                                        <div className="flex justify-end gap-1 px-2">
                                                            <button
                                                                className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded transition-all shadow-sm active:scale-90"
                                                                onClick={() => handleEdit(cat)}
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </button>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <button className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded transition-all shadow-sm active:scale-90">
                                                                        <X className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>{t("are_you_sure")}</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            {t("permanently_delete_category", { name: cat.category_name })}
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDelete(cat.id)} className="bg-red-500 hover:bg-red-600">{t("delete")}</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </Td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {filteredCategories.length > 0 && (
                                <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-medium">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                        {t("showing_x_to_y_of_z", { from: 1, to: filteredCategories.length, total: filteredCategories.length })}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-card active:scale-95 transition-all">
                                            <ChevronDown className="h-4 w-4 rotate-90" />
                                        </Button>
                                        <Button className="h-8 w-8 rounded-[10px] border-none p-0 text-white font-bold active:scale-95 transition-all shadow-md shadow-orange-500/10 bg-gradient-to-r from-[#FF9800] to-[#6366F1]">1</Button>
                                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-[10px] bg-white border border-gray-200 text-gray-600 hover:bg-card active:scale-95 transition-all">
                                            <ChevronDown className="h-4 w-4 -rotate-90" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Helper Components
function Th({ children, className }: { children: React.ReactNode, className?: string }) {
    return <th className={cn("px-4 py-4 border-b border-muted/50", className)}>{children}</th>;
}

function Td({ children, className, colSpan }: { children: React.ReactNode, className?: string, colSpan?: number }) {
    return <td colSpan={colSpan} className={cn("px-4 py-4 text-sm", className)}>{children}</td>;
}

function IconButton({ icon: Icon, onClick, title }: { icon: React.ElementType, onClick?: () => void, title?: string }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className="p-2 hover:bg-card hover:text-primary rounded-lg transition-all border border-muted/50 bg-muted/10 text-muted-foreground group active:scale-95"
        >
            <Icon className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
        </button>
    );
}

function Copy({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("lucide lucide-copy", className)}>
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
    );
}
