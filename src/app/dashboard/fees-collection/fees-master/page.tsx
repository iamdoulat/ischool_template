"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Search,
    FileSpreadsheet,
    FileText,
    FileCode,
    Printer,
    Pencil,
    Trash2,
    ChevronDown,
    LayoutGrid,
    X,
    Plus,
    Calendar,
    Layers,
    DollarSign,
    SlidersHorizontal,
    Copy
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn, formatDate, translateFeeItemName, toLocaleNumber } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import { useCurrencyFormatter } from "@/hooks/use-currency-formatter";
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
import autoTable from "jspdf-autotable";

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3.5">
                            <div
                                className="h-4 rounded-md bg-muted/60 animate-pulse"
                                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }}
                            />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

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
    const { t, language } = useTranslation();
    const tt = useTranslateToast();
    const [feeMasters, setFeeMasters] = useState<FeeMaster[]>([]);
    const [feeGroups, setFeeGroups] = useState<FeeGroup[]>([]);
    const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
    const [sessionName, setSessionName] = useState("2025-26");
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const { symbol, formatCurrency } = useCurrencyFormatter();

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

    // Pagination states
    const [pageSize, setPageSize] = useState(50);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [mastersRes, groupsRes, typesRes, sessionsRes] = await Promise.all([
                api.get("/fees-masters", { params: { search: searchQuery } }),
                api.get("/fees-groups"),
                api.get("/fees-types"),
                api.get("/system-setting/sessions")
            ]);
            setFeeMasters(mastersRes.data.data || []);
            setFeeGroups(groupsRes.data.data || []);
            setFeeTypes(typesRes.data.data || []);
            const sessions = sessionsRes.data.data || [];
            sessions.sort((a: { is_active?: boolean }, b: { is_active?: boolean }) => (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0));
            if (sessions.length > 0) setSessionName(sessions[0].session);
        } catch (error) {
            console.error("Error fetching data:", error);
            tt.error("failed_to_load_data");
        } finally {
            setLoading(false);
        }
    }, [searchQuery, tt]);

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
                tt.success("fees_master_updated_successfully");
            } else {
                await api.post("/fees-masters", data);
                tt.success("fees_master_added_successfully");
            }
            fetchData();
            resetForm();
        } catch (error) {
            console.error("Error saving fees master:", error);
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            const message = err.response?.data?.message || "Failed to save fees master";
            tt.error(message);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/fees-masters/${deleteId}`);
            tt.success("fees_master_deleted_successfully");
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
            fetchData();
        } catch (error) {
            console.error("Error deleting fees master:", error);
            tt.error("failed_to_delete_fees_master");
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Filtered masters by search query
    const filteredMasters = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return feeMasters;
        return feeMasters.filter(m =>
            (m.fee_group?.name || '').toLowerCase().includes(q) ||
            (m.fee_type?.name || '').toLowerCase().includes(q) ||
            (m.fee_type?.code || '').toLowerCase().includes(q) ||
            (m.fine_type || '').toLowerCase().includes(q)
        );
    }, [feeMasters, searchQuery]);

    // Grouping logic for the table
    const groupedData = useMemo(() => {
        const groups: { [key: number]: GroupedFeeMaster } = {};

        filteredMasters.forEach(master => {
            const groupId = master.fee_group_id;
            const groupName = master.fee_group?.name || t("general_payment");

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
    }, [filteredMasters, t]);

    const handleCopy = () => {
        const text = filteredMasters.map(m =>
            `${m.fee_group?.name || ''}\t${m.fee_type?.name || ''}\t${m.fee_type?.code || ''}\t${m.amount}\t${m.fine_type}\t${m.due_date}`
        ).join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const handlePrint = () => { window.print(); };

    const handleExportExcel = () => {
        const data = filteredMasters.map(m => ({
            [t("fees_group")]: m.fee_group?.name || '',
            [t("fees_type")]: m.fee_type?.name || '',
            [t("fees_code")]: m.fee_type?.code || '',
            [`${t("amount")} (${symbol})`]: m.amount || '0',
            [t("fine_type")]: m.fine_type || '',
            [t("due_date")]: m.due_date || '',
            [t("per_day")]: m.fine_per_day ? t("yes") : t("no"),
            [t("fine_detail")]: m.fine_type === 'percentage' ? `${m.fine_percentage}%` : (m.fine_amount || "0.00")
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Fees Master");
        XLSX.writeFile(workbook, `fees_master_${sessionName}.xlsx`);
        tt.success("exported_to_excel");
    };

    const handleExportCSV = () => {
        const data = filteredMasters.map(m => ({
            [t("fees_group")]: m.fee_group?.name || '',
            [t("fees_type")]: m.fee_type?.name || '',
            [t("fees_code")]: m.fee_type?.code || '',
            [`${t("amount")} (${symbol})`]: m.amount || '0',
            [t("fine_type")]: m.fine_type || '',
            [t("due_date")]: m.due_date || '',
            [t("per_day")]: m.fine_per_day ? t("yes") : t("no"),
            [t("fine_detail")]: m.fine_type === 'percentage' ? `${m.fine_percentage}%` : (m.fine_amount || "0.00")
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `fees_master_${sessionName}.csv`;
        link.click();
        tt.success("exported_to_csv");
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text(`${t("fees_master")} (${sessionName})`, 14, 15);
        const tableColumn = [t("fees_group"), t("fees_type"), t("fees_code"), `${t("amount")} (${symbol})`, t("fine_type"), t("due_date")];
        const tableRows = filteredMasters.map(m => [
            m.fee_group?.name ?? "",
            m.fee_type?.name ?? "",
            m.fee_type?.code ?? "",
            m.amount ? `${symbol}${m.amount}` : "",
            m.fine_type ?? "",
            m.due_date ?? ""
        ]);
        autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
        doc.save(`fees_master_${sessionName}.pdf`);
        tt.success("exported_to_pdf");
    };

    return (
        <div className="p-3 sm:p-5 pt-1 sm:pt-2 space-y-4 max-w-[1600px] mx-auto animate-in fade-in duration-300 pb-20">
            {/* Main Responsive Grid Layout (1/3 Form + 2/3 List) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                {/* Left: Add / Edit Fees Master Form */}
                <div className="lg:col-span-1">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card overflow-hidden pt-0 sticky top-4">
                        <CardHeader className="flex flex-row items-center gap-3 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-200/70">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                    {isEdit ? t("edit_fees_master") : t("add_fees_master")} : <span className="text-primary font-bold">{toLocaleNumber(sessionName, language?.short_code)}</span>
                                </CardTitle>
                                <p className="text-xs text-slate-500 font-medium mt-1">
                                    {isEdit ? t("update_fee_record") : t("create_new_fee_record")}
                                </p>
                            </div>
                        </CardHeader>

                        <CardContent className="p-5 sm:p-6 space-y-4">
                            <form onSubmit={handleSave} className="space-y-4">
                                {/* Fees Group */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                        <Layers className="h-3.5 w-3.5 text-indigo-600" />
                                        {t("fees_group")} <span className="text-destructive">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            required
                                            className="flex h-10 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs sm:text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                                            value={formData.fee_group_id || ""}
                                            onChange={(e) => setFormData({ ...formData, fee_group_id: Number(e.target.value) })}
                                        >
                                            <option value="">{t("select_fees_group")}</option>
                                            {feeGroups.map(group => (
                                                <option key={group.id} value={group.id}>{translateFeeItemName(group.name, language?.short_code)}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>

                                {/* Fees Type */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                        <FileText className="h-3.5 w-3.5 text-indigo-600" />
                                        {t("fees_type")} <span className="text-destructive">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            required
                                            className="flex h-10 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-xs sm:text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                                            value={formData.fee_type_id || ""}
                                            onChange={(e) => setFormData({ ...formData, fee_type_id: Number(e.target.value) })}
                                        >
                                            <option value="">{t("select_fees_type")}</option>
                                            {feeTypes.map(type => (
                                                <option key={type.id} value={type.id}>{translateFeeItemName(type.name, language?.short_code)} ({type.code})</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>

                                {/* Due Date */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                                        {t("due_date")}
                                    </label>
                                    <DatePicker
                                        value={formData.due_date || ""}
                                        onChange={(val) => setFormData({ ...formData, due_date: val })}
                                    />
                                </div>

                                {/* Amount */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                        <DollarSign className="h-3.5 w-3.5 text-indigo-600" />
                                        {t("amount")} ({symbol}) <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        placeholder={`0.00 (${symbol})`}
                                        required
                                        className="h-10 rounded-xl bg-background border-border/80 focus-visible:ring-primary/20 font-semibold text-sm"
                                        value={formData.amount || ""}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>

                                {/* Fine Type */}
                                <div className="space-y-2 pt-1 border-t border-border/60">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                        <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-600" />
                                        {t("fine_type")}
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: "none", label: t("fine_none") },
                                            { id: "percentage", label: t("fine_percentage") },
                                            { id: "fix", label: t("fine_fix_amount") },
                                            { id: "cumulative", label: t("fine_cumulative") }
                                        ].map((type) => (
                                            <label
                                                key={type.id}
                                                className={cn(
                                                    "flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all text-xs font-bold",
                                                    formData.fine_type === type.id
                                                        ? "bg-indigo-50/80 border-indigo-300 text-indigo-900 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 shadow-2xs"
                                                        : "bg-background border-border/70 text-slate-600 hover:bg-muted/40"
                                                )}
                                            >
                                                <input
                                                    type="radio"
                                                    name="fineType"
                                                    value={type.id}
                                                    className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500"
                                                    checked={formData.fine_type === type.id}
                                                    onChange={(e) => setFormData({ ...formData, fine_type: e.target.value })}
                                                />
                                                <span className="truncate">{type.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Fine Details (Per Day and Tiers) */}
                                {formData.fine_type !== 'none' && (
                                    <div className="space-y-3.5 p-3.5 rounded-xl bg-muted/30 border border-border/70">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <label className="text-xs font-bold text-foreground">
                                                    {t("per_day")}
                                                </label>
                                                <p className="text-[11px] text-muted-foreground">{t("apply_fine_for_each_day_late")}</p>
                                            </div>
                                            <Switch
                                                checked={formData.fine_per_day}
                                                onCheckedChange={(checked) => setFormData({ ...formData, fine_per_day: checked })}
                                            />
                                        </div>

                                        {formData.fine_type === 'cumulative' ? (
                                            <div className="space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-bold text-foreground">
                                                        {t("fine_tiers")}
                                                    </label>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={addFineTier}
                                                        className="h-7 px-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold cursor-pointer"
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" /> {t("add_fine_tier")}
                                                    </Button>
                                                </div>

                                                <div className="rounded-xl border border-border/70 overflow-hidden bg-background">
                                                    <table className="w-full text-xs">
                                                        <thead className="bg-muted/40 border-b border-border/70">
                                                            <tr>
                                                                <th className="px-2.5 py-2 text-left font-bold text-muted-foreground">{t("total_overdue")}</th>
                                                                <th className="px-2.5 py-2 text-left font-bold text-muted-foreground">{t("fine_amount")}</th>
                                                                <th className="px-2 py-2 text-center w-8"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border/50">
                                                            {(formData.fine_tiers || []).length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={3} className="px-3 py-3 text-center text-muted-foreground italic">
                                                                        {t("no_fine_tiers_added")}
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                (formData.fine_tiers || []).map((tier, idx) => (
                                                                    <tr key={idx}>
                                                                        <td className="p-1.5">
                                                                            <Input
                                                                                value={tier.total_overdue}
                                                                                onChange={(e) => updateFineTier(idx, 'total_overdue', e.target.value)}
                                                                                className="h-8 rounded-lg bg-muted/30 border-border/60 text-xs"
                                                                                placeholder={t("days")}
                                                                            />
                                                                        </td>
                                                                        <td className="p-1.5">
                                                                            <Input
                                                                                value={tier.fine_amount}
                                                                                onChange={(e) => updateFineTier(idx, 'fine_amount', e.target.value)}
                                                                                className="h-8 rounded-lg bg-muted/30 border-border/60 text-xs"
                                                                                placeholder={`${symbol} 0.00`}
                                                                            />
                                                                        </td>
                                                                        <td className="p-1.5 text-center">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeFineTier(idx)}
                                                                                className="p-1 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-md transition-all cursor-pointer"
                                                                            >
                                                                                <X className="h-3.5 w-3.5" />
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
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-bold text-muted-foreground">
                                                        {t("percentage_symbol")}
                                                    </label>
                                                    <Input
                                                        placeholder="0"
                                                        disabled={formData.fine_type !== 'percentage'}
                                                        className="h-9 rounded-xl bg-background border-border/80 text-xs font-semibold"
                                                        value={formData.fine_percentage || ""}
                                                        onChange={(e) => setFormData({ ...formData, fine_percentage: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-bold text-muted-foreground">
                                                        {t("fix_amount_with_currency", { symbol })}
                                                    </label>
                                                    <Input
                                                        placeholder="0.00"
                                                        disabled={formData.fine_type === 'none' || formData.fine_type === 'percentage'}
                                                        className="h-9 rounded-xl bg-background border-border/80 text-xs font-semibold"
                                                        value={formData.fine_amount || ""}
                                                        onChange={(e) => setFormData({ ...formData, fine_amount: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="pt-2 flex items-center justify-end gap-2">
                                    {isEdit && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={resetForm}
                                            className="h-10 px-4 rounded-xl font-bold text-xs cursor-pointer"
                                        >
                                            {t("cancel")}
                                        </Button>
                                    )}
                                    <Button
                                        type="submit"
                                        className="h-10 px-6 rounded-xl font-bold text-xs bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer border-none"
                                    >
                                        {isEdit ? t("update_fees_master") : t("save_fees_master")}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Fees Master List */}
                <div className="lg:col-span-2">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card overflow-hidden pt-0">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-200/70">
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    <FileSpreadsheet className="h-4 w-4" />
                                </span>
                                <div>
                                    <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                        {t("fees_master_list")} : <span className="text-primary font-bold">{toLocaleNumber(sessionName, language?.short_code)}</span>
                                    </CardTitle>
                                    <p className="text-xs text-slate-500 font-medium mt-1">
                                        {t("x_results_found", { count: toLocaleNumber(filteredMasters.length, language?.short_code) })}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>

                        <div className="p-4 sm:p-6 space-y-4">
                            {/* Toolbar: Search, Rows, Export */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div className="relative w-full max-w-sm">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t("search_by_group_or_code")}
                                        className="pl-10 pr-9 h-10 rounded-xl bg-background border-border/80 focus-visible:ring-primary/20 text-xs sm:text-sm"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 self-end md:self-auto">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                        <span>{t("show")}:</span>
                                        <select
                                            value={pageSize}
                                            onChange={(e) => setPageSize(Number(e.target.value))}
                                            className="h-9 px-2.5 rounded-lg border border-border/80 bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                        >
                                            <option value="25">{toLocaleNumber(25, language?.short_code)}</option>
                                            <option value="50">{toLocaleNumber(50, language?.short_code)}</option>
                                            <option value="100">{toLocaleNumber(100, language?.short_code)}</option>
                                        </select>
                                    </div>

                                    <div className="h-6 w-px bg-border/60 mx-1" />

                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={handleCopy}
                                            className="h-9 w-9 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg border-border/80 cursor-pointer"
                                            title={t("copy")}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={handleExportExcel}
                                            className="h-9 w-9 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg border-border/80 cursor-pointer"
                                            title={t("excel")}
                                        >
                                            <FileSpreadsheet className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={handleExportCSV}
                                            className="h-9 w-9 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg border-border/80 cursor-pointer"
                                            title={t("csv")}
                                        >
                                            <FileText className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={handleExportPDF}
                                            className="h-9 w-9 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg border-border/80 cursor-pointer"
                                            title={t("pdf")}
                                        >
                                            <FileCode className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={handlePrint}
                                            className="h-9 w-9 text-muted-foreground hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg border-border/80 cursor-pointer"
                                            title={t("print")}
                                        >
                                            <Printer className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="rounded-xl border border-border/70 overflow-hidden bg-background shadow-2xs">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-muted/40 border-b border-border/70">
                                                <th className="px-4 py-3.5 text-xs font-bold text-foreground uppercase tracking-wider text-center w-36">
                                                    {t("fees_group")}
                                                </th>
                                                <th className="px-4 py-3.5 text-xs font-bold text-foreground uppercase tracking-wider">
                                                    {t("fees_code")}
                                                </th>
                                                <th className="px-4 py-3.5 text-xs font-bold text-foreground uppercase tracking-wider text-right">
                                                    {t("amount")} ({symbol})
                                                </th>
                                                <th className="px-4 py-3.5 text-xs font-bold text-foreground uppercase tracking-wider text-center">
                                                    {t("fine_type")}
                                                </th>
                                                <th className="px-4 py-3.5 text-xs font-bold text-foreground uppercase tracking-wider text-center">
                                                    {t("due_date")}
                                                </th>
                                                <th className="px-4 py-3.5 text-xs font-bold text-foreground uppercase tracking-wider text-center">
                                                    {t("per_day")}
                                                </th>
                                                <th className="px-4 py-3.5 text-xs font-bold text-foreground uppercase tracking-wider text-center">
                                                    {t("fine_amount")}
                                                </th>
                                                <th className="px-4 py-3.5 text-xs font-bold text-foreground uppercase tracking-wider text-center w-24">
                                                    {t("action")}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50 text-xs">
                                            {loading ? (
                                                <TableSkeleton rows={5} cols={8} />
                                            ) : groupedData.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground font-semibold">
                                                        {t("no_data_found")}
                                                    </td>
                                                </tr>
                                            ) : (
                                                groupedData.map((group) => (
                                                    group.items.map((item, iIdx) => (
                                                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                                                            {iIdx === 0 && (
                                                                <td
                                                                    rowSpan={group.items.length}
                                                                    className="px-4 py-4 text-xs font-bold text-foreground border-r border-border/60 bg-muted/10 align-middle text-center"
                                                                >
                                                                    <div className="flex flex-col items-center gap-1.5">
                                                                        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                                                            <LayoutGrid className="h-4 w-4" />
                                                                        </div>
                                                                        <span className="font-bold text-xs">{translateFeeItemName(group.group, language?.short_code)}</span>
                                                                    </div>
                                                                </td>
                                                            )}
                                                            <td className="px-4 py-3.5 font-bold text-foreground">
                                                                <div className="space-y-0.5">
                                                                    <span className="text-xs block font-bold text-foreground">{translateFeeItemName(item.fee_type?.name, language?.short_code) || 'N/A'}</span>
                                                                    <span className="text-[10px] font-mono text-muted-foreground block bg-muted/60 px-1.5 py-0.2 rounded w-fit">{item.fee_type?.code || 'N/A'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-right font-black text-sm text-foreground">
                                                                {toLocaleNumber(formatCurrency(parseFloat(item.amount || '0')), language?.short_code)}
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center">
                                                                <span className={cn(
                                                                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                                                    item.fine_type === "none"
                                                                        ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                                                        : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                                                                )}>
                                                                    {item.fine_type === 'none' ? t("fine_none") : item.fine_type === 'percentage' ? t("fine_percentage") : item.fine_type === 'fix' ? t("fine_fix_amount") : t("fine_cumulative")}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center text-muted-foreground font-semibold">
                                                                {item.due_date ? toLocaleNumber(formatDate(item.due_date), language?.short_code) : 'N/A'}
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center">
                                                                <span className={cn(
                                                                    "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                                                    item.fine_per_day
                                                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                                                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                                                )}>
                                                                    {item.fine_per_day ? t("yes") : t("no")}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center text-muted-foreground font-semibold">
                                                                {item.fine_type === 'percentage' ? (
                                                                    <span className="font-bold text-foreground">{toLocaleNumber(item.fine_percentage || '0', language?.short_code)}%</span>
                                                                ) : item.fine_type === 'fix' ? (
                                                                    <span className="font-bold text-foreground">{toLocaleNumber(formatCurrency(parseFloat(item.fine_amount || '0')), language?.short_code)}</span>
                                                                ) : item.fine_type === 'cumulative' ? (
                                                                    <div className="flex flex-col gap-0.5">
                                                                        {(item.fine_tiers || []).map((tItem, idx) => (
                                                                            <span key={idx} className="text-[10px] whitespace-nowrap block">
                                                                                {toLocaleNumber(tItem.total_overdue, language?.short_code)} {t("days")}: {toLocaleNumber(formatCurrency(parseFloat(tItem.fine_amount || '0')), language?.short_code)}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <span>-</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center">
                                                                <div className="flex items-center justify-center gap-1.5">
                                                                    <Button
                                                                        size="icon"
                                                                        onClick={() => startEdit(item)}
                                                                        className="h-8 w-8 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white shadow-xs shadow-amber-500/20 active:scale-95 transition-all cursor-pointer border-none"
                                                                        title={t("edit")}
                                                                    >
                                                                        <Pencil className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                    <Button
                                                                        size="icon"
                                                                        onClick={() => { setDeleteId(item.id); setIsDeleteDialogOpen(true); }}
                                                                        className="h-8 w-8 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 hover:opacity-95 text-white shadow-xs shadow-rose-500/20 active:scale-95 transition-all cursor-pointer border-none"
                                                                        title={t("delete")}
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

                            {/* Pagination Summary */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                                <p className="text-xs text-muted-foreground font-medium">
                                    {t("showing_x_to_y_of_z", {
                                        from: toLocaleNumber(filteredMasters.length > 0 ? 1 : 0, language?.short_code),
                                        to: toLocaleNumber(filteredMasters.length, language?.short_code),
                                        total: toLocaleNumber(filteredMasters.length, language?.short_code)
                                    })}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Delete Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("are_you_sure")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("delete_confirmation_desc")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setDeleteId(null); setIsDeleteDialogOpen(false); }}>
                            {t("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 font-bold">
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
