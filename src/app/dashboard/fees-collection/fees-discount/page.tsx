"use client";

import {
    Plus,
    Search,
    FileSpreadsheet,
    FileText,
    FileCode,
    Printer,
    Pencil,
    Trash2,
    Tag,
    LayoutGrid,
    BadgePercent,
    ChevronDown,
    Loader2,
    X,
    Copy
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Discount {
    id?: number;
    name: string;
    code: string;
    type: "percentage" | "fix";
    amount: number | null;
    percentage: number | null;
    use_count: number;
    expiry_date: string | null;
    description: string | null;
}

export default function FeesDiscountPage() {
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const { toast } = useToast();

    const [formData, setFormData] = useState<Discount>({
        name: "",
        code: "",
        type: "fix",
        amount: null,
        percentage: null,
        use_count: 0,
        expiry_date: null,
        description: "",
    });

    useEffect(() => {
        fetchDiscounts();
    }, []);

    const fetchDiscounts = async () => {
        setLoading(true);
        try {
            const res = await api.get("/fee-discounts");
            setDiscounts(res.data.data || []);
        } catch (error) {
            toast("error", "Failed to fetch discounts");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTypeChange = (type: "percentage" | "fix") => {
        setFormData(prev => ({ 
            ...prev, 
            type,
            amount: type === "percentage" ? null : prev.amount,
            percentage: type === "fix" ? null : prev.percentage
        }));
    };

    const resetForm = () => {
        setFormData({
            name: "",
            code: "",
            type: "fix",
            amount: null,
            percentage: null,
            use_count: 0,
            expiry_date: null,
            description: "",
        });
        setEditingId(null);
    };

    const handleEdit = (discount: Discount) => {
        setFormData({
            ...discount,
            expiry_date: discount.expiry_date ? new Date(discount.expiry_date).toISOString().split('T')[0] : null
        });
        setEditingId(discount.id!);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this discount?")) return;
        
        try {
            await api.delete(`/fee-discounts/${id}`);
            toast("success", "Discount deleted successfully");
            fetchDiscounts();
        } catch (error) {
            toast("error", "Failed to delete discount");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingId) {
                await api.put(`/fee-discounts/${editingId}`, formData);
                toast("success", "Discount updated successfully");
            } else {
                await api.post("/fee-discounts", formData);
                toast("success", "Discount created successfully");
            }
            resetForm();
            fetchDiscounts();
        } catch (error: any) {
            toast("error", error.response?.data?.message || "Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    const exportData = discounts.map(d => ({
        Name: d.name,
        'Discount Code': d.code,
        Percentage: d.type === 'percentage' ? `${d.percentage}%` : '-',
        Amount: d.type === 'fix' ? `$${d.amount?.toFixed(2)}` : '-',
        'Use Count': d.use_count,
        'Expiry Date': d.expiry_date ? new Date(d.expiry_date).toLocaleDateString() : '-',
        Description: d.description || '-'
    }));

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "FeesDiscounts");
        XLSX.writeFile(wb, "fees_discounts.xlsx");
    };

    const exportToCSV = () => {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "fees_discounts.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Fees Discount List", 14, 15);
        autoTable(doc, {
            head: [['Name', 'Discount Code', 'Percentage', 'Amount', 'Use Count', 'Expiry Date']],
            body: discounts.map(d => [
                d.name, 
                d.code, 
                d.type === 'percentage' ? `${d.percentage}%` : '-',
                d.type === 'fix' ? `$${d.amount?.toFixed(2)}` : '-',
                d.use_count.toString(),
                d.expiry_date ? new Date(d.expiry_date).toLocaleDateString() : '-'
            ]),
            startY: 20,
        });
        doc.save("fees_discounts.pdf");
    };

    const copyToClipboard = () => {
        const text = exportData.map(d => Object.values(d).join('\t')).join('\n');
        navigator.clipboard.writeText(Object.keys(exportData[0] || {}).join('\t') + '\n' + text);
        toast("success", "Copied to clipboard");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-700 p-6">
            {/* Left Column: Add/Edit Fees Discount Form */}
            <div className="lg:col-span-1">
                <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md overflow-hidden sticky top-24">
                    <div className="px-6 py-4 border-b border-muted/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                {editingId ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                            </div>
                            <h2 className="font-bold text-lg tracking-tight">
                                {editingId ? "Edit Fees Discount" : "Add Fees Discount"}
                            </h2>
                        </div>
                        {editingId && (
                            <Button variant="ghost" size="icon" onClick={resetForm} className="h-8 w-8 rounded-full">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Name */}
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    Name <span className="text-destructive font-black">*</span>
                                </label>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter discount name"
                                    required
                                    className="h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                />
                            </div>

                            {/* Discount Code */}
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    Discount Code <span className="text-destructive font-black">*</span>
                                </label>
                                <Input
                                    name="code"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    placeholder="Enter discount code"
                                    required
                                    className="h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                />
                            </div>

                            {/* Discount Type */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                                    Discount Type
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { id: "percentage", label: "Percentage" },
                                        { id: "fix", label: "Fix Amount" }
                                    ].map((type) => (
                                        <label 
                                            key={type.id} 
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all group",
                                                formData.type === type.id 
                                                    ? "bg-primary/10 border-primary shadow-sm" 
                                                    : "bg-muted/20 border-muted/50 hover:bg-primary/5"
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                name="discountType"
                                                checked={formData.type === type.id}
                                                onChange={() => handleTypeChange(type.id as any)}
                                                className="w-4 h-4 text-primary bg-muted border-muted focus:ring-primary/20"
                                            />
                                            <span className={cn(
                                                "text-xs font-bold transition-colors",
                                                formData.type === type.id ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                                            )}>{type.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Value Row */}
                            <div className="grid grid-cols-2 gap-4">
                                {formData.type === "percentage" ? (
                                    <div className="space-y-2 group col-span-2">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                            Percentage (%) <span className="text-destructive font-black">*</span>
                                        </label>
                                        <Input
                                            name="percentage"
                                            type="number"
                                            value={formData.percentage || ""}
                                            onChange={handleInputChange}
                                            placeholder="0"
                                            required
                                            className="h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-2 group col-span-2">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                            Amount ($) <span className="text-destructive font-black">*</span>
                                        </label>
                                        <Input
                                            name="amount"
                                            type="number"
                                            value={formData.amount || ""}
                                            onChange={handleInputChange}
                                            placeholder="0.00"
                                            required
                                            className="h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Use Count / Expiry Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 group">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors leading-none">
                                        Max Use Count <span className="text-destructive font-black">*</span>
                                    </label>
                                    <Input
                                        name="use_count"
                                        type="number"
                                        value={formData.use_count}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                        required
                                        className="h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-2 group">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                        Expiry Date
                                    </label>
                                    <Input
                                        name="expiry_date"
                                        type="date"
                                        value={formData.expiry_date || ""}
                                        onChange={handleInputChange}
                                        className="h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2 group">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">
                                    Description
                                </label>
                                <Textarea
                                    name="description"
                                    value={formData.description || ""}
                                    onChange={handleInputChange}
                                    placeholder="Enter description"
                                    className="min-h-[100px] rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium resize-none text-xs"
                                />
                            </div>

                            <div className="pt-2">
                                <Button 
                                    type="submit"
                                    disabled={saving}
                                    className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : editingId ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                    {saving ? "Processing..." : editingId ? "Update Discount" : "Save Discount"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Fees Discount List */}
            <div className="lg:col-span-2">
                <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-muted/20 bg-muted/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                <BadgePercent className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg tracking-tight">Fees Discount List</h2>
                                <p className="text-xs text-muted-foreground italic font-medium">Manage all active fee discounts</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative w-full max-w-sm group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Search by name or code..."
                                    className="pl-10 h-11 rounded-xl bg-muted/30 border-muted/50 focus-visible:bg-card focus-visible:ring-primary/20 transition-all font-medium"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Button onClick={copyToClipboard} variant="outline" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary transition-all rounded-xl border-muted/50 shadow-sm bg-card">
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button onClick={exportToExcel} variant="outline" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary transition-all rounded-xl border-muted/50 shadow-sm bg-card">
                                        <FileSpreadsheet className="h-4 w-4" />
                                    </Button>
                                    <Button onClick={exportToCSV} variant="outline" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary transition-all rounded-xl border-muted/50 shadow-sm bg-card">
                                        <FileText className="h-4 w-4" />
                                    </Button>
                                    <Button onClick={exportToPDF} variant="outline" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary transition-all rounded-xl border-muted/50 shadow-sm bg-card">
                                        <FileCode className="h-4 w-4" />
                                    </Button>
                                    <Button onClick={() => window.print()} variant="outline" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary transition-all rounded-xl border-muted/50 shadow-sm bg-card">
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="h-8 w-px bg-muted/50 mx-2" />
                                <select className="h-11 px-4 rounded-xl border border-muted/50 bg-card text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-foreground shadow-sm">
                                    <option>50</option>
                                    <option>100</option>
                                    <option>All</option>
                                </select>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="rounded-2xl border border-muted/20 overflow-hidden bg-card shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-muted/10">
                                            {[
                                                "Name", "Discount Code", "Percentage", "Amount", "Use Count", "Expiry Date", "Action"
                                            ].map((header) => (
                                                <th key={header} className={cn(
                                                    "px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-foreground border-b border-muted/20 whitespace-nowrap",
                                                    header === "Action" ? "text-center w-36" : "",
                                                    ["Percentage", "Amount", "Use Count", "Expiry Date"].includes(header) ? "text-center" : ""
                                                )}>
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-muted/10">
                                        {loading ? (
                                            Array.from({ length: 3 }).map((_, i) => (
                                                <tr key={i} className="animate-pulse">
                                                    <td colSpan={7} className="px-6 py-8">
                                                        <div className="h-8 bg-muted/20 rounded-xl" />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : discounts.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-3 opacity-30">
                                                        <BadgePercent className="h-12 w-12" />
                                                        <p className="font-bold tracking-tight">No discounts found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            discounts.map((discount) => (
                                                <tr key={discount.id} className="hover:bg-muted/10 transition-colors group/row">
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-primary/5 rounded-lg group-hover/row:bg-primary/20 transition-colors">
                                                                <LayoutGrid className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-foreground">{discount.name}</span>
                                                                {discount.description && <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{discount.description}</span>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className="px-2 py-1 rounded bg-muted text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                            {discount.code}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-sm font-bold text-primary text-center">
                                                        {discount.type === "percentage" ? `${discount.percentage}%` : "-"}
                                                    </td>
                                                    <td className="px-6 py-5 text-sm font-bold text-primary text-center">
                                                        {discount.type === "fix" ? `$${discount.amount?.toFixed(2)}` : "-"}
                                                    </td>
                                                    <td className="px-6 py-5 text-sm font-bold text-center">
                                                        {discount.use_count}
                                                    </td>
                                                    <td className="px-6 py-5 text-xs font-bold text-muted-foreground text-center">
                                                        {discount.expiry_date ? new Date(discount.expiry_date).toLocaleDateString() : "-"}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                size="icon"
                                                                onClick={() => handleEdit(discount)}
                                                                className="h-8 w-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-md active:scale-90"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                onClick={() => handleDelete(discount.id!)}
                                                                className="h-8 w-8 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-md active:scale-90"
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

                        <div className="flex items-center justify-between pt-4">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] italic">
                                Total {discounts.length} {discounts.length === 1 ? 'Entry' : 'Entries'}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button variant="pagination-inactive" size="icon" className="h-10 w-10">
                                    <ChevronDown className="h-5 w-5 rotate-90" />
                                </Button>
                                <Button variant="pagination-active" size="icon" className="h-11 w-11 text-lg">1</Button>
                                <Button variant="pagination-inactive" size="icon" className="h-10 w-10">
                                    <ChevronDown className="h-5 w-5 -rotate-90" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

