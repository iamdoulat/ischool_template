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
    Tag,
    ChevronDown,
    Copy as CopyIcon
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

interface FeeGroup {
    id: number;
    name: string;
    description: string | null;
}

export default function FeesGroupPage() {
    const { toast } = useToast();
    const [feesGroups, setFeesGroups] = useState<FeeGroup[]>([]);
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
    const [formData, setFormData] = useState<Partial<FeeGroup>>({
        name: "",
        description: "",
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
            toast("error", "Failed to load fees groups");
        } finally {
            setLoading(false);
        }
    }, [searchQuery, toast]);

    useEffect(() => {
        fetchFeesGroups();
    }, [fetchFeesGroups]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEdit && editId) {
                await api.put(`/fees-groups/${editId}`, formData);
                toast("success", "Fees group updated successfully");
            } else {
                await api.post("/fees-groups", formData);
                toast("success", "Fees group added successfully");
            }
            fetchFeesGroups();
            resetForm();
        } catch (error: any) {
            console.error("Error saving fees group:", error);
            const message = error.response?.data?.message || "Failed to save fees group";
            toast("error", message);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/fees-groups/${deleteId}`);
            toast("success", "Fees group deleted successfully");
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
            fetchFeesGroups();
        } catch (error) {
            console.error("Error deleting fees group:", error);
            toast("error", "Failed to delete fees group");
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.post("/fees-groups/bulk-delete", { ids: selectedIds });
            toast("success", "Selected fees groups deleted successfully");
            setIsBulkDeleteDialogOpen(false);
            setSelectedIds([]);
            fetchFeesGroups();
        } catch (error) {
            console.error("Error bulk deleting fees groups:", error);
            toast("error", "Failed to delete selected entries");
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
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

    const handleCopy = () => {
        const text = feesGroups.map(g => `${g.name}\t${g.description || ""}`).join("\n");
        navigator.clipboard.writeText(text);
        toast("success", "Copied to clipboard");
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
        toast("success", "Exported to Excel successfully");
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
        toast("success", "Exported to CSV successfully");
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text("Fees Groups Report", 14, 15);

        const tableColumn = ["Name", "Description"];
        const tableRows = feesGroups.map(g => [
            g.name,
            g.description || ""
        ]);

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });

        doc.save("fees_groups.pdf");
        toast("success", "Exported to PDF successfully");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-700 pb-20">
            {/* Left Column: Add Fees Group Form */}
            <div className="lg:col-span-1">
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden sticky top-24">
                    <div className="px-6 py-4 border-b border-muted/50 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            {isEdit ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                        </div>
                        <h2 className="font-bold text-lg tracking-tight">
                            {isEdit ? "Edit Fees Group" : "Add Fees Group"}
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
                                    placeholder="Enter group name"
                                    className="h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium border-[#4F39F6]/20 focus-visible:border-[#4F39F6]"
                                    value={formData.name || ""}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                                    {isEdit ? "Update Group" : "Save Group"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Fees Group List */}
            <div className="lg:col-span-2">
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-muted/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Tag className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="font-bold text-lg tracking-tight">Fees Group List</h2>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative w-full max-sm group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Search groups..."
                                    className="pl-10 h-10 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                    <IconButton icon={CopyIcon} onClick={handleCopy} title="Copy" />
                                    <IconButton icon={FileSpreadsheet} onClick={handleExportExcel} title="Excel" />
                                    <IconButton icon={FileText} onClick={handleExportCSV} title="CSV" />
                                    <IconButton icon={FileCode} onClick={handleExportPDF} title="PDF" />
                                    <IconButton icon={Printer} onClick={handlePrint} title="Print" />
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
                                                    checked={selectedIds.length === feesGroups.length && feesGroups.length > 0}
                                                    onCheckedChange={toggleSelectAll}
                                                />
                                            </th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 whitespace-nowrap">
                                                Name
                                            </th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 whitespace-nowrap">
                                                Description
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
                                                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground font-medium">Loading fees groups...</td>
                                            </tr>
                                        ) : feesGroups.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground font-medium">No fees groups found</td>
                                            </tr>
                                        ) : (
                                            feesGroups.map((group) => (
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
                                                                onClick={() => startEdit(group)}
                                                                className="h-8 w-8 rounded-lg bg-[#4F39F6] hover:bg-[#4F39F6]/90 text-white shadow-lg shadow-indigo-500/20 active:scale-90 transition-all font-bold"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                onClick={() => { setDeleteId(group.id); setIsDeleteDialogOpen(true); }}
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
                                Showing {feesGroups.length > 0 ? 1 : 0} to {feesGroups.length} of {feesGroups.length} entries
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
                    </div>
                </Card>
            </div>

            {/* Delete Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the fees group.
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
                            Are you sure you want to delete {selectedIds.length} selected fees groups? This action cannot be undone.
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
function IconButton({ icon: Icon, onClick, title }: { icon: any, onClick?: () => void, title?: string }) {
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
