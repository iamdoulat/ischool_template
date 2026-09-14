"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
    Printer,
    FileText,
    FileSpreadsheet,
    Copy,
    Pencil,
    Loader2,
    Trash2,
    ShieldOff,
    Sparkles,
    CheckCircle2,
    UserX,
    Bookmark,
    ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn, translateDisableReason, toLocaleNumber } from "@/lib/utils";
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

const REASON_PRESETS = [
    { key: "reason_preset_absent", fallback: "Long Absent / Irregular" },
    { key: "reason_preset_transfer", fallback: "Transferred to Another School" },
    { key: "reason_preset_financial", fallback: "Financial Hardship / Non-payment" },
    { key: "reason_preset_disciplinary", fallback: "Disciplinary Action" },
    { key: "reason_preset_medical", fallback: "Health / Medical Condition" },
    { key: "reason_preset_relocation", fallback: "Family Relocation" },
    { key: "reason_preset_graduated", fallback: "Graduated / Course Completed" },
    { key: "reason_preset_parent_request", fallback: "Parent / Guardian Request" }
];

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

interface DisableReason {
    id: number;
    reason: string;
}

export default function DisableReasonPage() {
    const [reasons, setReasons] = useState<DisableReason[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [newReason, setNewReason] = useState("");
    const [editingReason, setEditingReason] = useState<DisableReason | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // Single delete dialog
    const [idToDelete, setIdToDelete] = useState<number | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Bulk delete dialog
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

    const tt = useTranslateToast();
    const { t, language } = useTranslation();

    const fetchReasons = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/disable-reasons");
            const data = response.data?.data || response.data || [];
            setReasons(Array.isArray(data) ? data : []);
            setSelectedIds(new Set());
        } catch (error) {
            console.error("Error fetching reasons:", error);
            tt.error("failed_to_fetch_disable_reasons");
            setReasons([]);
        } finally {
            setLoading(false);
        }
    }, [tt]);

    useEffect(() => {
        fetchReasons();
    }, [fetchReasons]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReason.trim()) {
            tt.error("disable_reason_is_required");
            return;
        }

        setSaving(true);
        try {
            if (editingReason) {
                await api.put(`/disable-reasons/${editingReason.id}`, { reason: newReason.trim() });
                tt.success("disable_reason_updated_successfully");
            } else {
                await api.post("/disable-reasons", { reason: newReason.trim() });
                tt.success("disable_reason_added_successfully");
            }
            setNewReason("");
            setEditingReason(null);
            fetchReasons();
        } catch (error: unknown) {
            const err = error as { response?: { status?: number; data?: { errors?: Record<string, string[]>; message?: string } }; message?: string };
            if (err.response?.status === 422) {
                const validationErrors = err.response?.data?.errors;
                if (validationErrors) {
                    const firstError = Object.values(validationErrors)[0];
                    tt.error(Array.isArray(firstError) ? firstError[0] : firstError);
                } else {
                    tt.error(err.response?.data?.message || "Validation failed");
                }
            } else {
                const message = err.response?.data?.message || err.message || "Failed to save reason.";
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
            await api.delete(`/disable-reasons/${idToDelete}`);
            tt.success("disable_reason_deleted_successfully");
            fetchReasons();
        } catch {
            tt.error("failed_to_delete_reason");
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
            await api.post("/disable-reasons/bulk-delete", { ids: Array.from(selectedIds) });
            tt.success("selected_reasons_deleted_successfully");
            fetchReasons();
        } catch {
            tt.error("failed_to_delete_selected_reasons");
        } finally {
            setDeleting(false);
            setIsBulkDeleteDialogOpen(false);
        }
    };

    const handleEdit = (item: DisableReason) => {
        setEditingReason(item);
        setNewReason(item.reason);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(filteredReasons.map(r => r.id)));
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

    const filteredReasons = reasons.filter(r => {
        const transReason = translateDisableReason(r.reason, language?.short_code);
        return (
            r.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transReason.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.id.toString().includes(searchTerm)
        );
    });

    // Export functions
    const exportToCopy = () => {
        if (reasons.length === 0) return;
        const text = [
            "#\t" + t("disable_reason") + "\t" + t("reason_code") + "\t" + t("status"),
            ...filteredReasons.map((r, idx) => `${toLocaleNumber(idx + 1, language?.short_code)}\t${translateDisableReason(r.reason, language?.short_code)}\t#${toLocaleNumber(r.id, language?.short_code)}\t${t("active")}`)
        ].join("\n");
        navigator.clipboard.writeText(text);
        tt.success("copied_to_clipboard");
    };

    const exportToExcel = () => {
        if (reasons.length === 0) return;
        const worksheet = XLSX.utils.json_to_sheet(
            filteredReasons.map((r, idx) => ({
                "#": toLocaleNumber(idx + 1, language?.short_code),
                [t("disable_reason")]: translateDisableReason(r.reason, language?.short_code),
                [t("reason_code")]: `#${toLocaleNumber(r.id, language?.short_code)}`,
                [t("status")]: t("active")
            }))
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, t("disable_reasons"));
        XLSX.writeFile(workbook, "disable_reasons.xlsx");
        tt.success("excel_file_downloaded");
    };

    const exportToPDF = () => {
        if (reasons.length === 0) return;
        const doc = new jsPDF();
        doc.text(t("disable_reason_list"), 14, 15);
        autoTable(doc, {
            head: [["#", t("disable_reason"), t("reason_code"), t("status")]],
            body: filteredReasons.map((r, idx) => [
                toLocaleNumber(idx + 1, language?.short_code),
                translateDisableReason(r.reason, language?.short_code),
                `#${toLocaleNumber(r.id, language?.short_code)}`,
                t("active")
            ]),
            startY: 20
        });
        doc.save("disable_reasons.pdf");
        tt.success("pdf_file_downloaded");
    };

    return (
        <div className="p-3 sm:p-5 pt-1 sm:pt-2 space-y-4 max-w-[1600px] mx-auto animate-in fade-in duration-300 pb-20">
            {/* Top Page Header Banner with Signature Gradient */}
            <div className="bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden px-5 py-4">
                <div className="flex flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <ShieldOff className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800 leading-none">
                                {t("disable_reasons")}
                            </h1>
                            <p className="text-xs text-slate-600 mt-1 font-medium">
                                {t("manage_student_disable_and_dropout_reasons")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stat Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Total Reasons */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#4F46E5] via-[#6366F1] to-[#818CF8] text-white shadow-md flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-white/95 uppercase tracking-wide">
                            {t("total_reasons")}
                        </span>
                        <span className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-xs">
                            <ShieldOff className="h-4 w-4 sm:h-5 sm:w-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                            {toLocaleNumber(reasons.length, language?.short_code)}
                        </div>
                        <p className="text-xs text-white/80 font-semibold mt-1.5">
                            {t("count_reasons", { count: toLocaleNumber(reasons.length, language?.short_code) })}
                        </p>
                    </div>
                </div>

                {/* Active Rules */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#059669] via-[#10B981] to-[#34D399] text-white shadow-md flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-white/95 uppercase tracking-wide flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                            {t("active_reasons")}
                        </span>
                        <span className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-xs">
                            <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                            {toLocaleNumber(reasons.length, language?.short_code)}
                        </div>
                        <p className="text-xs text-white/85 font-semibold mt-1.5">
                            {t("active")}
                        </p>
                    </div>
                </div>

                {/* System Status */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#D97706] via-[#F59E0B] to-[#FBBF24] text-white shadow-md flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-white/95 uppercase tracking-wide">
                            {t("dropout_tracking")}
                        </span>
                        <span className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-xs">
                            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                        </span>
                    </div>
                    <div className="mt-4">
                        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                            {reasons.length > 0 ? t("configured") : t("empty")}
                        </div>
                        <p className="text-xs text-white/85 font-semibold mt-1.5">
                            {t("student_deactivation_ready")}
                        </p>
                    </div>
                </div>
            </div>

            {/* 2-Column Responsive Layout: Left Form (1/3) + Right List (2/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Column: Create / Edit Disable Reason Form */}
                <form onSubmit={handleSave} className="lg:col-span-4">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card overflow-hidden pt-0 sticky top-4">
                        <CardHeader className="flex flex-row items-center gap-3 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-200/70">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <ShieldOff className="h-4 w-4" />
                            </span>
                            <div>
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                    {editingReason ? t("edit_disable_reason") : t("add_disable_reason")}
                                </CardTitle>
                                <p className="text-xs text-slate-500 font-medium mt-1">
                                    {editingReason ? t("update_existing_reason") : t("create_new_disable_reason")}
                                </p>
                            </div>
                        </CardHeader>

                        <CardContent className="p-5 space-y-4">
                            {/* Reason Input */}
                            <div className="space-y-1.5 group">
                                <Label htmlFor="reason" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                    {t("disable_reason")} <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="reason"
                                    className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium focus:ring-2 focus:ring-primary/20"
                                    value={newReason}
                                    onChange={(e) => setNewReason(e.target.value)}
                                    placeholder={t("reason_placeholder")}
                                    required
                                />
                            </div>

                            {/* Quick Reason Presets */}
                            <div className="space-y-2 pt-2 border-t border-border/70">
                                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                    {t("quick_reason_presets")}
                                </Label>
                                <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                                    {REASON_PRESETS.map((preset) => {
                                        const label = t(preset.key) || preset.fallback;
                                        const isSelected = newReason === label;
                                        return (
                                            <button
                                                key={preset.key}
                                                type="button"
                                                onClick={() => setNewReason(label)}
                                                className={cn(
                                                    "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-left",
                                                    isSelected
                                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                                        : "bg-muted/40 hover:bg-indigo-50 text-foreground hover:text-indigo-600 border-border/80"
                                                )}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/70">
                                {editingReason && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-9 px-4 rounded-xl text-xs font-bold cursor-pointer"
                                        onClick={() => { setEditingReason(null); setNewReason(""); }}
                                    >
                                        {t("cancel")}
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    disabled={saving || loading}
                                    className="h-9 px-6 rounded-xl font-bold text-xs bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:opacity-95 text-white shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
                                >
                                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                    <span>{editingReason ? t("update") : t("save")}</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>

                {/* Right Column: Disable Reason List Table */}
                <div className="lg:col-span-8">
                    <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card overflow-hidden pt-0">
                        <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-200/70">
                            <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                    <ShieldOff className="h-4 w-4" />
                                </span>
                                <div>
                                    <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                        {t("disable_reason_list")}
                                    </CardTitle>
                                    <p className="text-xs text-slate-500 font-medium mt-1">
                                        {t("count_reasons", { count: toLocaleNumber(reasons.length, language?.short_code) })}
                                    </p>
                                </div>
                            </div>

                            {/* Export Toolbar */}
                            <div className="flex items-center gap-1">
                                {selectedIds.size > 0 && (
                                    <Button
                                        onClick={() => setIsBulkDeleteDialogOpen(true)}
                                        size="sm"
                                        className="h-8 px-2.5 text-xs text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center gap-1 font-bold mr-1 cursor-pointer border-none"
                                        title={t("delete_selected")}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        <span>{t("delete")} ({toLocaleNumber(selectedIds.size, language?.short_code)})</span>
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
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            {/* Search Bar & Summary Tag */}
                            <div className="p-4 sm:p-5 border-b border-border/70 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder={t("search_disable_reasons")}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8.5 h-9 text-xs rounded-xl bg-background border-border/80"
                                    />
                                </div>

                                {reasons.length > 0 && (
                                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 text-xs font-bold py-1 px-3 self-start sm:self-auto">
                                        <Bookmark className="h-3 w-3 mr-1" />
                                        {t("total_reasons")} ({toLocaleNumber(reasons.length, language?.short_code)})
                                    </Badge>
                                )}
                            </div>

                            {/* Reasons Table */}
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/40 border-b border-border/70 hover:bg-muted/40 text-xs font-bold">
                                            <TableHead className="w-12 pl-5">
                                                <Checkbox
                                                    checked={filteredReasons.length > 0 && selectedIds.size === filteredReasons.length}
                                                    onCheckedChange={handleSelectAll}
                                                    className="h-4 w-4 rounded-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                />
                                            </TableHead>
                                            <TableHead className="py-3 px-3 w-14">#</TableHead>
                                            <TableHead className="py-3 px-4 min-w-[220px]">{t("disable_reason")}</TableHead>
                                            <TableHead className="py-3 px-4 min-w-[130px]">{t("reason_code")}</TableHead>
                                            <TableHead className="py-3 px-4 w-[120px]">{t("status")}</TableHead>
                                            <TableHead className="py-3 px-4 text-right pr-6 w-[110px]">{t("action")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-border/50 text-xs">
                                        {loading ? (
                                            <TableSkeleton rows={4} cols={6} />
                                        ) : filteredReasons.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="px-4 py-16 text-center text-xs font-bold text-muted-foreground">
                                                    {t("no_data_found")}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredReasons.map((item, idx) => {
                                                const isSelected = selectedIds.has(item.id);
                                                return (
                                                    <TableRow
                                                        key={item.id}
                                                        className={cn(
                                                            "hover:bg-muted/20 transition-colors",
                                                            isSelected && "bg-indigo-50/40 dark:bg-indigo-950/20"
                                                        )}
                                                    >
                                                        <TableCell className="pl-5 py-3.5">
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onCheckedChange={() => handleSelectOne(item.id)}
                                                                className="h-4 w-4 rounded-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                            />
                                                        </TableCell>

                                                        {/* Serial Number */}
                                                        <TableCell className="py-3.5 px-3 font-bold text-muted-foreground text-xs">
                                                            {toLocaleNumber(idx + 1, language?.short_code)}
                                                        </TableCell>

                                                        {/* Reason & Avatar */}
                                                        <TableCell className="py-3.5 px-4">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                                                    <UserX className="h-4 w-4" />
                                                                </div>
                                                                <span className="font-bold text-foreground text-sm">
                                                                    {translateDisableReason(item.reason, language?.short_code)}
                                                                </span>
                                                            </div>
                                                        </TableCell>

                                                        {/* Reason Code Tag */}
                                                        <TableCell className="py-3.5 px-4">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-muted/60 font-mono text-xs font-bold text-foreground border border-border/80">
                                                                #{toLocaleNumber(item.id, language?.short_code)}
                                                            </span>
                                                        </TableCell>

                                                        {/* Status */}
                                                        <TableCell className="py-3.5 px-4">
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold uppercase">
                                                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                                                {t("active")}
                                                            </span>
                                                        </TableCell>

                                                        {/* Action Buttons with Gradient Styling */}
                                                        <TableCell className="py-3.5 px-4 text-right pr-6">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <Button
                                                                    onClick={() => handleEdit(item)}
                                                                    size="icon"
                                                                    className="h-7 w-7 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white shadow-xs shadow-amber-500/20 active:scale-95 transition-all cursor-pointer border-none"
                                                                    title={t("edit")}
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    onClick={() => confirmDelete(item.id)}
                                                                    size="icon"
                                                                    className="h-7 w-7 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 hover:opacity-95 text-white shadow-xs shadow-rose-500/20 active:scale-95 transition-all cursor-pointer border-none"
                                                                    title={t("delete")}
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

                            {/* Table Footer */}
                            {filteredReasons.length > 0 && (
                                <div className="p-4 sm:p-5 border-t border-border/70 bg-muted/10 flex items-center justify-between text-xs text-muted-foreground font-semibold">
                                    <div>
                                        {t("showing_x_to_y_of_z", {
                                            from: toLocaleNumber(1, language?.short_code),
                                            to: toLocaleNumber(filteredReasons.length, language?.short_code),
                                            total: toLocaleNumber(filteredReasons.length, language?.short_code)
                                        })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Single Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl border border-border shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-bold text-foreground">{t("are_you_sure")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed mt-2">
                            {t("permanently_delete_reason", { reason: translateDisableReason(reasons.find(r => r.id === idToDelete)?.reason || "", language?.short_code) })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel disabled={deleting} className="h-9 rounded-xl text-xs font-bold">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white h-9 rounded-xl text-xs font-bold border-none"
                            disabled={deleting}
                        >
                            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Delete Confirmation Dialog */}
            <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl border border-border shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-bold text-foreground">{t("are_you_absolutely_sure")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed mt-2">
                            {t("permanently_delete_selected_reasons", { count: toLocaleNumber(selectedIds.size, language?.short_code) })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel disabled={deleting} className="h-9 rounded-xl text-xs font-bold">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleBulkDelete();
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white h-9 rounded-xl text-xs font-bold border-none"
                            disabled={deleting}
                        >
                            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                            {t("delete_all")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
