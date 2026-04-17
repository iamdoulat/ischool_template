"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Search,
    Plus,
    FileSpreadsheet,
    FileText,
    FileCode,
    Printer,
    Eye,
    Pencil,
    Trash2,
    ChevronDown,
    LayoutGrid,
    Wallet,
    X
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface FeeGroup {
    id: number;
    name: string;
}

interface FeeType {
    id: number;
    name: string;
    code: string;
}

interface FeeMaster {
    id: number;
    fee_group_id: number;
    fee_type_id: number;
    due_date: string;
    amount: string;
    fine_type: string;
    fine_percentage: string | null;
    fine_amount: string | null;
    fine_per_day: boolean;
    fine_tiers: { total_overdue: string; fine_amount: string }[] | null;
    session_id: number | null;
    fee_group?: FeeGroup;
    fee_type?: FeeType;
}

interface GroupedFeeMaster {
    group: string;
    groupId: number;
    items: FeeMaster[];
}

export default function FeesMasterPage() {
    const { toast } = useToast();
    const [feeMasters, setFeeMasters] = useState<FeeMaster[]>([]);
    const [feeGroups, setFeeGroups] = useState<FeeGroup[]>([]);
    const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Form and Editing state
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [formData, setFormData] = useState<Partial<FeeMaster>>({
        fee_group_id: undefined,
        fee_type_id: undefined,
        due_date: "",
        amount: "",
        fine_type: "none",
        fine_percentage: "",
        fine_amount: "",
        fine_per_day: false,
        fine_tiers: [],
    });

    // Dialog states
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [mastersRes, groupsRes, typesRes] = await Promise.all([
                api.get("/fees-masters", { params: { search: searchQuery } }),
                api.get("/fees-groups"),
                api.get("/fees-types")
            ]);
            setFeeMasters(mastersRes.data.data);
            setFeeGroups(groupsRes.data.data);
            setFeeTypes(typesRes.data.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast("error", "Failed to load data");
        } finally {
            setLoading(false);
        }
    }, [searchQuery, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                fine_percentage: formData.fine_type === 'percentage' ? formData.fine_percentage : null,
                fine_amount: (formData.fine_type === 'fix' || formData.fine_type === 'cumulative') ? formData.fine_amount : null,
                fine_per_day: formData.fine_per_day,
                fine_tiers: formData.fine_type === 'cumulative' ? formData.fine_tiers : null,
            };

            if (isEdit && editId) {
                await api.put(`/fees-masters/${editId}`, data);
                toast("success", "Fees master updated successfully");
            } else {
                await api.post("/fees-masters", data);
                toast("success", "Fees master added successfully");
            }
            fetchData();
            resetForm();
        } catch (error: any) {
            console.error("Error saving fees master:", error);
            const message = error.response?.data?.message || "Failed to save fees master";
            toast("error", message);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/fees-masters/${deleteId}`);
            toast("success", "Fees master deleted successfully");
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
            fetchData();
        } catch (error) {
            console.error("Error deleting fees master:", error);
            toast("error", "Failed to delete fees master");
        }
    };

    const resetForm = () => {
        setFormData({
            fee_group_id: undefined,
            fee_type_id: undefined,
            due_date: "",
            amount: "",
            fine_type: "none",
            fine_percentage: "",
            fine_amount: "",
            fine_per_day: false,
            fine_tiers: [],
        });
        setIsEdit(false);
        setEditId(null);
    };

    const addFineTier = () => {
        const newTiers = [...(formData.fine_tiers || []), { total_overdue: "", fine_amount: "" }];
        setFormData({ ...formData, fine_tiers: newTiers });
    };

    const removeFineTier = (index: number) => {
        const newTiers = (formData.fine_tiers || []).filter((_, i) => i !== index);
        setFormData({ ...formData, fine_tiers: newTiers });
    };

    const updateFineTier = (index: number, field: 'total_overdue' | 'fine_amount', value: string) => {
        const newTiers = [...(formData.fine_tiers || [])];
        newTiers[index] = { ...newTiers[index], [field]: value };
        setFormData({ ...formData, fine_tiers: newTiers });
    };

    const startEdit = (master: FeeMaster) => {
        setIsEdit(true);
        setEditId(master.id);
        setFormData({
            fee_group_id: master.fee_group_id,
            fee_type_id: master.fee_type_id,
            due_date: master.due_date,
            amount: master.amount,
            fine_type: master.fine_type,
            fine_percentage: master.fine_percentage || "",
            fine_amount: master.fine_amount || "",
            fine_per_day: !!master.fine_per_day,
            fine_tiers: master.fine_tiers || [],
        });
    };

    // Grouping logic for the table
    const groupedData = useMemo(() => {
        const groups: { [key: number]: GroupedFeeMaster } = {};

        feeMasters.forEach(master => {
            const groupId = master.fee_group_id;
            const groupName = master.fee_group?.name || "Unknown Group";

            if (!groups[groupId]) {
                groups[groupId] = {
                    group: groupName,
                    groupId: groupId,
                    items: []
                };
            }
            groups[groupId].items.push(master);
        });

        return Object.values(groups);
    }, [feeMasters]);

    const handleCopy = () => {
        const text = feeMasters.map(m =>
            `${m.fee_group?.name}\t${m.fee_type?.name}\t${m.amount}\t${m.fine_type}\t${m.due_date}`
        ).join("\n");
        navigator.clipboard.writeText(text);
        toast("success", "Copied to clipboard");
    };

    const handlePrint = () => { window.print(); };

    const handleExportExcel = () => {
        const data = feeMasters.map(m => ({
            "Fees Group": m.fee_group?.name,
            "Fees Type": m.fee_type?.name,
            "Amount": m.amount,
            "Fine Type": m.fine_type,
            "Due Date": m.due_date,
            "Fine Detail": m.fine_type === 'percentage' ? `${m.fine_percentage}%` : (m.fine_amount || "0.00")
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Fees Master");
        XLSX.writeFile(workbook, "fees_master.xlsx");
        toast("success", "Exported to Excel");
    };

    const handleExportCSV = () => {
        const data = feeMasters.map(m => ({
            "Fees Group": m.fee_group?.name,
            "Fees Type": m.fee_type?.name,
            "Amount": m.amount,
            "Fine Type": m.fine_type,
            "Due Date": m.due_date,
            "Fine Detail": m.fine_type === 'percentage' ? `${m.fine_percentage}%` : (m.fine_amount || "0.00")
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "fees_master.csv";
        link.click();
        toast("success", "Exported to CSV");
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text("Fees Master Report", 14, 15);
        const tableColumn = ["Fees Group", "Fees Type", "Amount", "Fine Type", "Due Date"];
        const tableRows = feeMasters.map(m => [
            m.fee_group?.name,
            m.fee_type?.name,
            m.amount,
            m.fine_type,
            m.due_date
        ]);
        (doc as any).autoTable({ head: [tableColumn], body: tableRows, startY: 20 });
        doc.save("fees_master.pdf");
        toast("success", "Exported to PDF");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-700 pb-20">
            {/* Left: Add Fees Master Form */}
            <div className="lg:col-span-1 space-y-6">
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden sticky top-24">
                    <div className="px-6 py-4 border-b border-muted/50 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            {isEdit ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                        </div>
                        <h2 className="font-bold text-lg tracking-tight">
                            {isEdit ? "Edit Fees Master" : "Add Fees Master"} : 2025-26
                        </h2>
                    </div>
                    <CardContent className="p-6 space-y-5">
                        <form onSubmit={handleSave} className="space-y-4">
                            {/* Fees Group */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    Fees Group <span className="text-destructive font-black">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        required
                                        className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all"
                                        value={formData.fee_group_id || ""}
                                        onChange={(e) => setFormData({ ...formData, fee_group_id: Number(e.target.value) })}
                                    >
                                        <option value="">Select</option>
                                        {feeGroups.map(group => (
                                            <option key={group.id} value={group.id}>{group.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>

                            {/* Fees Type */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    Fees Type <span className="text-destructive font-black">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        required
                                        className="flex h-11 w-full rounded-xl border border-muted/50 bg-muted/30 px-4 py-2 text-sm ring-offset-background appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card focus-visible:border-primary transition-all"
                                        value={formData.fee_type_id || ""}
                                        onChange={(e) => setFormData({ ...formData, fee_type_id: Number(e.target.value) })}
                                    >
                                        <option value="">Select</option>
                                        {feeTypes.map(type => (
                                            <option key={type.id} value={type.id}>{type.name} ({type.code})</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>

                            {/* Due Date */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    Due Date
                                </label>
                                <Input
                                    type="date"
                                    required
                                    className="h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                    value={formData.due_date || ""}
                                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                />
                            </div>

                            {/* Amount */}
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    Amount ($) <span className="text-destructive font-black">*</span>
                                </label>
                                <Input
                                    placeholder="0.00"
                                    required
                                    className="h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                    value={formData.amount || ""}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>

                            {/* Fine Type */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">
                                    Fine Type
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { id: "none", label: "None" },
                                        { id: "percentage", label: "Percentage" },
                                        { id: "fix", label: "Fix Amount" },
                                        { id: "cumulative", label: "Cumulative" }
                                    ].map((type) => (
                                        <label key={type.id} className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-primary/5 transition-all group",
                                            formData.fine_type === type.id ? "bg-primary/10 border-primary" : "bg-muted/20 border-muted/50"
                                        )}>
                                            <input
                                                type="radio"
                                                name="fineType"
                                                value={type.id}
                                                className="w-4 h-4 text-primary bg-muted border-muted focus:ring-primary/20"
                                                checked={formData.fine_type === type.id}
                                                onChange={(e) => setFormData({ ...formData, fine_type: e.target.value })}
                                            />
                                            <span className={cn(
                                                "text-xs font-bold transition-colors",
                                                formData.fine_type === type.id ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                                            )}>{type.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Fine Details (Per Day and Tiers) */}
                            {formData.fine_type !== 'none' && (
                                <div className="space-y-4 pt-2 border-t border-muted/30">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="space-y-0.5">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                Per Day
                                            </label>
                                            <p className="text-[10px] text-muted-foreground/60">Apply fine for each day late</p>
                                        </div>
                                        <Switch
                                            checked={formData.fine_per_day}
                                            onCheckedChange={(checked) => setFormData({ ...formData, fine_per_day: checked })}
                                        />
                                    </div>

                                    {formData.fine_type === 'cumulative' ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between px-1">
                                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                                    Fine Tiers
                                                </label>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={addFineTier}
                                                    className="h-7 px-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold"
                                                >
                                                    Add Fine
                                                </Button>
                                            </div>

                                            <div className="rounded-xl border border-muted/50 overflow-hidden bg-muted/5">
                                                <table className="w-full text-[10px]">
                                                    <thead className="bg-muted/30">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left font-bold text-muted-foreground uppercase tracking-tighter">Total Overdue</th>
                                                            <th className="px-3 py-2 text-left font-bold text-muted-foreground uppercase tracking-tighter">Fine Amount</th>
                                                            <th className="px-3 py-2 text-center w-10">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-muted/50">
                                                        {(formData.fine_tiers || []).length === 0 ? (
                                                            <tr>
                                                                <td colSpan={3} className="px-3 py-4 text-center text-muted-foreground italic bg-card/30">
                                                                    No tiers added.
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            (formData.fine_tiers || []).map((tier, idx) => (
                                                                <tr key={idx} className="bg-card/50">
                                                                    <td className="p-1">
                                                                        <Input
                                                                            value={tier.total_overdue}
                                                                            onChange={(e) => updateFineTier(idx, 'total_overdue', e.target.value)}
                                                                            className="h-8 rounded-md bg-transparent border-muted/30 focus-visible:bg-white transition-all text-[11px]"
                                                                            placeholder="Days"
                                                                        />
                                                                    </td>
                                                                    <td className="p-1">
                                                                        <Input
                                                                            value={tier.fine_amount}
                                                                            onChange={(e) => updateFineTier(idx, 'fine_amount', e.target.value)}
                                                                            className="h-8 rounded-md bg-transparent border-muted/30 focus-visible:bg-white transition-all text-[11px]"
                                                                            placeholder="$ 0.00"
                                                                        />
                                                                    </td>
                                                                    <td className="p-1 text-center">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeFineTier(idx)}
                                                                            className="p-1.5 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-md transition-all active:scale-90"
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2 group">
                                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                                    Percentage (%)
                                                </label>
                                                <Input
                                                    placeholder="0"
                                                    disabled={formData.fine_type !== 'percentage'}
                                                    className="h-10 rounded-lg bg-muted/30 border-muted/50 focus-visible:bg-card"
                                                    value={formData.fine_percentage || ""}
                                                    onChange={(e) => setFormData({ ...formData, fine_percentage: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                                    Fix Amount ($)
                                                </label>
                                                <Input
                                                    placeholder="0.00"
                                                    disabled={formData.fine_type === 'none' || formData.fine_type === 'percentage'}
                                                    className="h-10 rounded-lg bg-muted/30 border-muted/50 focus-visible:bg-card"
                                                    value={formData.fine_amount || ""}
                                                    onChange={(e) => setFormData({ ...formData, fine_amount: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="pt-4 flex justify-end gap-2">
                                {isEdit && (
                                    <Button type="button" variant="outline" className="h-11 px-6 rounded-xl font-bold" onClick={resetForm}>
                                        Cancel
                                    </Button>
                                )}
                                <Button type="submit" variant="gradient" className="h-11 px-10 rounded-xl font-bold tracking-tight shadow-lg shadow-primary/25">
                                    {isEdit ? "Update Master" : "Save Fees Master"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Right: Fees Master List */}
            <div className="lg:col-span-2">
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-card/50 backdrop-blur-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-muted/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Wallet className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="font-bold text-lg tracking-tight">Fees Master List : 2025-26</h2>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative w-full max-w-sm group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Search by group or code..."
                                    className="pl-10 h-10 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex gap-1">
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
                                            {[
                                                "Fees Group", "Fees Code", "Amount", "Fine Type",
                                                "Due Date", "Per Day", "Days-Fine Amount", "Action"
                                            ].map((header) => (
                                                <th key={header} className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 border-b border-muted/50 whitespace-nowrap text-center">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-muted/50">
                                        {loading ? (
                                            <tr><td colSpan={8} className="px-6 py-8 text-center text-muted-foreground font-medium">Loading...</td></tr>
                                        ) : groupedData.length === 0 ? (
                                            <tr><td colSpan={8} className="px-6 py-8 text-center text-muted-foreground font-medium">No results found</td></tr>
                                        ) : (
                                            groupedData.map((group, gIdx) => (
                                                group.items.map((item, iIdx) => (
                                                    <tr key={item.id} className="hover:bg-muted/20 transition-colors group/row">
                                                        {iIdx === 0 && (
                                                            <td rowSpan={group.items.length} className="px-4 py-6 text-sm font-black text-foreground border-r border-muted/50 w-32 bg-muted/5">
                                                                <div className="flex flex-col items-center gap-2">
                                                                    <div className="p-2 bg-primary/10 rounded-full">
                                                                        <LayoutGrid className="h-3 w-3 text-primary" />
                                                                    </div>
                                                                    <span className="text-center leading-tight tracking-tight uppercase text-[10px]">{group.group}</span>
                                                                </div>
                                                            </td>
                                                        )}
                                                        <td className="px-4 py-4 text-xs font-medium text-muted-foreground">
                                                            {item.fee_type?.name} ({item.fee_type?.code})
                                                        </td>
                                                        <td className="px-4 py-4 text-sm font-black text-foreground text-center">${item.amount}</td>
                                                        <td className="px-4 py-4 text-center">
                                                            <span className={cn(
                                                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm",
                                                                item.fine_type === "none" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                                                            )}>
                                                                {item.fine_type}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-center text-xs text-muted-foreground font-bold tracking-tight">{item.due_date}</td>
                                                        <td className="px-4 py-4 text-center">
                                                            <span className={cn(
                                                                "text-[10px] font-black uppercase tracking-widest",
                                                                item.fine_per_day ? "text-emerald-500" : "text-destructive/50"
                                                            )}>
                                                                {item.fine_per_day ? "Yes" : "No"}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-[10px] font-bold text-muted-foreground leading-relaxed w-48 italic text-center">
                                                            {item.fine_type === 'percentage' ? `Fine: ${item.fine_percentage}%` :
                                                                item.fine_type === 'fix' ? `Fine: ${item.fine_amount}` :
                                                                    item.fine_type === 'cumulative' ? (
                                                                        <div className="flex flex-col gap-0.5">
                                                                            {(item.fine_tiers || []).map((t, idx) => (
                                                                                <span key={idx} className="block whitespace-nowrap">
                                                                                    {t.total_overdue} days: {t.fine_amount}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    ) : "None"}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center justify-center gap-1.5 transition-transform">
                                                                <Button
                                                                    size="icon"
                                                                    onClick={() => { /* View logic could go here */ }}
                                                                    className="h-8 w-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-90 transition-all"
                                                                >
                                                                    <Eye className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    onClick={() => startEdit(item)}
                                                                    className="h-8 w-8 rounded-lg bg-[#4F39F6] hover:bg-[#4F39F6]/90 text-white shadow-lg shadow-indigo-500/20 active:scale-90"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    onClick={() => { setDeleteId(item.id); setIsDeleteDialogOpen(true); }}
                                                                    className="h-8 w-8 rounded-lg bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20 active:scale-90"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between pt-4">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                Showing {feeMasters.length > 0 ? 1 : 0} to {feeMasters.length} of {feeMasters.length} entries
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
                            This action cannot be undone. This will permanently delete the fees master entry.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setDeleteId(null); setIsDeleteDialogOpen(false); }}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 font-bold active:scale-95 transition-transform">Delete</AlertDialogAction>
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
