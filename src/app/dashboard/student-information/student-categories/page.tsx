"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
    Printer,
    FileText,
    Table as TableIcon,
    FileDown,
    Download,
    Columns,
    ChevronDown,
    Pencil,
    X,
    Loader2,
    AlertCircle,
    Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
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
    const { toast } = useToast();

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/student-categories");
            setCategories(response.data.data);
            setSelectedIds(new Set());
        } catch (error) {
            console.error("Error fetching categories:", error);
            toast("error", "Failed to fetch categories.");
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleSave = async () => {
        if (!newCategoryName.trim()) {
            toast("error", "Category name is required.");
            return;
        }

        setLoading(true);
        try {
            if (editingCategory) {
                await api.put(`/student-categories/${editingCategory.id}`, { category_name: newCategoryName });
                toast("success", "Category updated successfully.");
            } else {
                await api.post("/student-categories", { category_name: newCategoryName });
                toast("success", "Category created successfully.");
            }
            setNewCategoryName("");
            setEditingCategory(null);
            fetchCategories();
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to save category.";
            toast("error", message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        setLoading(true);
        try {
            await api.delete(`/student-categories/${id}`);
            toast("success", "Category deleted successfully.");
            fetchCategories();
        } catch (error) {
            toast("error", "Failed to delete category.");
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;

        setLoading(true);
        try {
            await api.post("/student-categories/bulk-delete", { ids: Array.from(selectedIds) });
            toast("success", "Selected categories deleted successfully.");
            fetchCategories();
        } catch (error) {
            toast("error", "Failed to delete selected categories.");
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
        toast("success", "Copied to clipboard");
    };

    const exportToExcel = () => {
        if (categories.length === 0) return;
        const worksheet = XLSX.utils.json_to_sheet(categories.map(c => ({ Category: c.category_name, "Category ID": c.id })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Categories");
        XLSX.writeFile(workbook, "student_categories.xlsx");
        toast("success", "Excel file downloaded");
    };

    const exportToPDF = () => {
        if (categories.length === 0) return;
        const doc = new jsPDF();
        autoTable(doc, {
            head: [["Category", "Category ID"]],
            body: categories.map(c => [c.category_name, c.id]),
        });
        doc.save("student_categories.pdf");
        toast("success", "PDF file downloaded");
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Left Column: Create Category Form */}
                <div className="md:col-span-4">
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm">
                        <CardHeader className="border-b border-muted/50 pb-4">
                            <CardTitle className="text-xl font-bold tracking-tight text-slate-800">
                                {editingCategory ? "Edit Category" : "Create Category"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1 group-focus-within:text-primary transition-colors">
                                    Category <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    className="h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all border-indigo-200"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="Enter category name"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                {editingCategory && (
                                    <Button variant="outline" className="h-10 px-6" onClick={() => { setEditingCategory(null); setNewCategoryName(""); }}>
                                        Cancel
                                    </Button>
                                )}
                                <Button variant="gradient" className="h-10 px-8" onClick={handleSave} disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    {editingCategory ? "Update" : "Save"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Category List Table */}
                <div className="md:col-span-8">
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm">
                        <CardHeader className="border-b border-muted/50 pb-4">
                            <CardTitle className="text-xl font-bold tracking-tight text-slate-800">Category List</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {/* Toolbar */}
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search"
                                        className="pl-10 h-10 rounded-lg bg-muted/30 border-muted/50"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <IconButton icon={Printer} onClick={() => window.print()} title="Print" />
                                        <IconButton icon={Copy} onClick={exportToCopy} title="Copy" />
                                        <IconButton icon={TableIcon} onClick={exportToExcel} title="Excel" />
                                        <IconButton icon={FileText} onClick={exportToPDF} title="PDF" />
                                        <IconButton icon={Download} onClick={exportToExcel} title="Download" />
                                        <IconButton icon={Columns} title="Columns" />
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-hidden rounded-xl border border-muted/50">
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
                                            <Th>Category</Th>
                                            <Th>Category ID</Th>
                                            <Th className="text-right flex items-center justify-end gap-2">
                                                <span>Action</span>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <button
                                                            disabled={selectedIds.size === 0}
                                                            className={cn(
                                                                "p-1 rounded transition-all shadow-sm active:scale-90",
                                                                selectedIds.size > 0 ? "bg-red-500 text-white hover:bg-red-600" : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                                                            )}
                                                            title="Delete Selected"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently delete {selectedIds.size} selected categories. This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600">Delete All</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </Th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-muted/30">
                                        {filteredCategories.length > 0 ? (
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
                                                                className="p-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded transition-all shadow-sm active:scale-90"
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
                                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            This will permanently delete the category "{cat.category_name}".
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDelete(cat.id)} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </Td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <Td colSpan={4} className="text-center py-8">
                                                    {loading ? (
                                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-2 text-muted-foreground font-medium">
                                                            <AlertCircle className="h-4 w-4" /> No recordings found
                                                        </div>
                                                    )}
                                                </Td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {filteredCategories.length > 0 && (
                                <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-medium">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                        Showing 1 to {filteredCategories.length} of {filteredCategories.length} entries
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all">
                                            <ChevronDown className="h-4 w-4 rotate-90" />
                                        </Button>
                                        <Button className="h-8 w-8 rounded-lg border-none p-0 text-white font-bold active:scale-95 transition-all shadow-md shadow-orange-500/10 bg-gradient-to-br from-[#FF9800] to-[#4F39F6]">1</Button>
                                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-muted/50 text-muted-foreground hover:bg-card active:scale-95 transition-all">
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

function IconButton({ icon: Icon, onClick, title }: { icon: any, onClick?: () => void, title?: string }) {
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
