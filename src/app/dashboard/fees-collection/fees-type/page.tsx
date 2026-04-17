"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Plus,
    Search,
    FileSpreadsheet,
    FileText,
    FileCode,
    Printer,
    Eye,
    Pencil,
    Trash2,
    LayoutGrid,
    Wallet,
    ChevronDown,
    Copy as CopyIcon,
    Download
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
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
import "jspdf-autotable";

interface FeeType {
    id: number;
    name: string;
    code: string;
    description: string | null;
}

export default function FeesTypePage() {
    const { toast } = useToast();
    const [feesTypes, setFeesTypes] = useState<FeeType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Selection state
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Dialog states
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Form and Editing state
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [formData, setFormData] = useState<Partial<FeeType>>({
        name: "",
        code: "",
        description: "",
    });

    const fetchFeesTypes = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/fees-types", {
                params: {
                    search: searchQuery
                }
            });
            setFeesTypes(response.data.data.data || response.data.data);
        } catch (error) {
            console.error("Error fetching fees types:", error);
            toast("error", "Failed to load fees types");
        } finally {
            setLoading(false);
        }
    }, [searchQuery, toast]);

    useEffect(() => {
        fetchFeesTypes();
    }, [fetchFeesTypes]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEdit && editId) {
                await api.put(`/fees-types/${editId}`, formData);
                toast("success", "Fees type updated successfully");
            } else {
                await api.post("/fees-types", formData);
                toast("success", "Fees type added successfully");
            }
            fetchFeesTypes();
            resetForm();
        } catch (error: any) {
            console.error("Error saving fees type:", error);
            const message = error.response?.data?.message || "Failed to save fees type";
            toast("error", message);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/fees-types/${deleteId}`);
            toast("success", "Fees type deleted successfully");
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
            fetchFeesTypes();
        } catch (error) {
            console.error("Error deleting fees type:", error);
            toast("error", "Failed to delete fees type");
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post("/fees-types/bulk-delete", { ids: selectedIds });
            toast("success", "Selected fees types deleted successfully");
            setIsBulkDeleteDialogOpen(false);
            setSelectedIds([]);
            fetchFeesTypes();
        } catch (error) {
            console.error("Error bulk deleting fees types:", error);
            toast("error", "Failed to delete selected entries");
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            code: "",
            description: "",
        });
        setIsEdit(false);
        setEditId(null);
    };

    const startEdit = (type: FeeType) => {
        setIsEdit(true);
        setEditId(type.id);
        setFormData({
            name: type.name,
            code: type.code,
            description: type.description || "",
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === feesTypes.length && feesTypes.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(feesTypes.map(f => f.id));
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
        const text = feesTypes.map(t => `${t.name}\t${t.code}`).join("\n");
        navigator.clipboard.writeText(text);
        toast("success", "Copied to clipboard");
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(feesTypes.map(t => ({
            Name: t.name,
            'Fees Code': t.code,
            Description: t.description || ""
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Fees Types");
        XLSX.writeFile(workbook, "fees_types.xlsx");
        toast("success", "Exported to Excel successfully");
    };

    const handleExportCSV = () => {
        const worksheet = XLSX.utils.json_to_sheet(feesTypes.map(t => ({
            Name: t.name,
            'Fees Code': t.code,
            Description: t.description || ""
        })));
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "fees_types.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast("success", "Exported to CSV successfully");
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text("Fees Types Report", 14, 15);

        const tableColumn = ["Name", "Fees Code", "Description"];
        const tableRows = feesTypes.map(t => [
            t.name,
            t.code,
            t.description || ""
        ]);

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });

        doc.save("fees_types.pdf");
        toast("success", "Exported to PDF successfully");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-700 pb-20">
            {/* Left Column: Add Fees Type Form */}
            <div className="lg:col-span-1">
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden sticky top-24">
                    <div className="px-6 py-4 border-b border-muted/50 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            {isEdit ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                        </div>
                        <h2 className="font-bold text-lg tracking-tight">
                            {isEdit ? "Edit Fees Type" : "Add Fees Type"}
                        </h2>
                    </div>
                    <CardContent className="p-6 space-y-5">
                        <form onSubmit={handleSave} className="space-y-4">
                            {/* Name */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    Name <span className="text-destructive font-black">*</span>
                                </label>
                                <Input
                                    required
                                    placeholder="Enter fees type name"
                                    className="h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium border-[#4F39F6]/20 focus-visible:border-[#4F39F6]"
                                    value={formData.name || ""}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            {/* Fees Code */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    Fees Code <span className="text-destructive font-black">*</span>
                                </label>
                                <Input
                                    required
                                    placeholder="Enter fees code"
                                    className="h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                    value={formData.code || ""}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    Description
                                </label>
                                <Textarea
                                    placeholder="Enter description"
                                    className="min-h-[120px] rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium resize-none text-xs"
                                    value={formData.description || ""}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-2">
                                {isEdit && (
                                    <Button type="button" variant="outline" className="h-11 px-6 rounded-xl font-bold" onClick={resetForm}>
                                        Cancel
                                    </Button>
                                )}
                                <Button type="submit" variant="gradient" className="h-11 px-10 rounded-xl font-bold tracking-tight shadow-lg shadow-primary/25">
                                    {isEdit ? "Update Fees Type" : "Save Fees Type"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Fees Type List */}
            <div className="lg:col-span-2">
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-muted/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Wallet className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="font-bold text-lg tracking-tight">Fees Type List</h2>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative w-full max-w-sm group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Search by name or code..."
                                    className="pl-10 h-10 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                    <IconButton icon={CopyIcon} onClick={handleCopy} />
                                    <IconButton icon={FileSpreadsheet} onClick={handleExportExcel} />
                                    <IconButton icon={FileText} onClick={handleExportCSV} />
                                    <IconButton icon={FileCode} onClick={handleExportPDF} />
                                    <IconButton icon={Printer} onClick={handlePrint} />
                                </div>
                                <div className="h-8 w-px bg-muted/50 mx-2" />
                                <select className="h-10 px-3 rounded-xl border border-muted/50 bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                                    <option>50</option>
                                    <option>100</option>
                                    <option>All</option>
                                </select>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="rounded-2xl border border-muted/50 overflow-hidden bg-muted/10 shadow-inner">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-muted/30">
                                            <th className="px-4 py-4 w-10 border-b border-muted/50">
                                                <Checkbox
                                                    checked={selectedIds.length === feesTypes.length && feesTypes.length > 0}
                                                    onCheckedChange={toggleSelectAll}
                                                />
                                            </th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 whitespace-nowrap">
                                                Name
                                            </th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 whitespace-nowrap">
                                                Fees Code
                                            </th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 whitespace-nowrap text-right">
                                                <div className="flex justify-end pr-1 text-slate-700">
                                                    {selectedIds.length > 0 ? (
                                                        <button
                                                            onClick={() => setIsBulkDeleteDialogOpen(true)}
                                                            className="bg-red-500 hover:bg-red-600 p-1.5 rounded transition-colors flex items-center gap-1 text-white px-2"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            <span className="text-xs font-bold leading-none translate-y-[1px]">Delete</span>
                                                        </button>
                                                    ) : (
                                                        "Action"
                                                    )}
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-muted/50">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground font-medium">Loading fees types...</td>
                                            </tr>
                                        ) : feesTypes.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground font-medium">No fees types found</td>
                                            </tr>
                                        ) : (
                                            feesTypes.map((type) => (
                                                <tr key={type.id} className={cn(
                                                    "hover:bg-muted/20 transition-colors group/row",
                                                    selectedIds.includes(type.id) && "bg-muted/30"
                                                )}>
                                                    <td className="px-4 py-4">
                                                        <Checkbox
                                                            checked={selectedIds.includes(type.id)}
                                                            onCheckedChange={() => toggleSelect(type.id)}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-bold text-foreground">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-1.5 bg-primary/10 rounded-lg group-hover/row:bg-primary/20 transition-colors">
                                                                <LayoutGrid className="h-3.5 w-3.5 text-primary" />
                                                            </div>
                                                            {type.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-tight">
                                                        {type.code}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-end gap-1.5 pr-2">
                                                            <Button
                                                                size="icon"
                                                                onClick={() => { /* View logic */ }}
                                                                className="h-8 w-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-90 transition-all font-bold"
                                                            >
                                                                <Eye className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                onClick={() => startEdit(type)}
                                                                className="h-8 w-8 rounded-lg bg-[#4F39F6] hover:bg-[#4F39F6]/90 text-white shadow-lg shadow-indigo-500/20 active:scale-90 transition-all"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                onClick={() => { setDeleteId(type.id); setIsDeleteDialogOpen(true); }}
                                                                className="h-8 w-8 rounded-lg bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20 active:scale-90 transition-all"
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

                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-medium">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                Showing {feesTypes.length > 0 ? 1 : 0} to {feesTypes.length} of {feesTypes.length} entries
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Delete Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the fees type.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setDeleteId(null); setIsDeleteDialogOpen(false); }}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 font-bold active:scale-95 transition-transform">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Delete Dialog */}
            <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bulk Delete Entries</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {selectedIds.length} selected fees types? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsBulkDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600 font-bold active:scale-95 transition-transform">Delete Selected</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// Helper component for icon buttons
function IconButton({ icon: Icon, onClick }: { icon: any, onClick?: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="p-2 hover:bg-muted rounded-lg transition-colors border border-muted/50 text-muted-foreground hover:text-foreground shadow-sm active:scale-95"
        >
            <Icon className="h-4 w-4" />
        </button>
    );
}
