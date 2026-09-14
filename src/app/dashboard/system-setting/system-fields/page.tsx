"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    FormInput,
    Loader2,
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/components/providers/language-provider";
import { exportData } from "@/lib/export-utils";
import { cn, toLocaleNumber } from "@/lib/utils";

interface SystemField {
    id: number;
    name: string;
    alias: string;
    scope: string;
    is_active: boolean;
}

export default function SystemFieldsPage() {
    const { t } = useTranslation();
    const { language } = useLanguage();
    const [fields, setFields] = useState<SystemField[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("student");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    const fetchFields = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/system-setting/system-fields");
            setFields(res.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch system fields", error);
            toast.error(t("failed_to_load") || "Failed to load system fields");
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchFields();
    }, [fetchFields]);

    const toggleField = async (id: number) => {
        try {
            setUpdatingId(id);
            const res = await api.post(`/system-setting/system-fields/${id}/toggle`);
            const updated = res.data?.data;
            if (updated) {
                setFields((prev) => prev.map((f) => (f.id === id ? updated : f)));
                toast.success(t("system_field_updated"));
            }
        } catch (error) {
            console.error("Failed to update system field", error);
            toast.error(t("failed_to_update_system_field"));
        } finally {
            setUpdatingId(null);
        }
    };

    const translateSystemFieldName = (name: string, alias: string): string => {
        const key = (alias || name || "")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
        const directLookup = t(key);
        if (directLookup && directLookup !== key) return directLookup;
        return name;
    };

    const filtered = useMemo(
        () =>
            fields
                .filter((f) => f.scope === activeTab)
                .filter((f) => {
                    const translated = translateSystemFieldName(f.name, f.alias).toLowerCase();
                    const rawName = (f.name || "").toLowerCase();
                    const rawAlias = (f.alias || "").toLowerCase();
                    const search = searchTerm.toLowerCase();
                    return translated.includes(search) || rawName.includes(search) || rawAlias.includes(search);
                }),
        [fields, activeTab, searchTerm]
    );

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleExport = (type: "copy" | "excel" | "pdf" | "print") => {
        exportData(type, {
            filename: `system-fields-${activeTab}`,
            title: `${t("system_fields")} (${activeTab === "student" ? t("student") : t("staff")})`,
            columns: [t("field_name"), t("status")],
            rows: filtered.map((f) => [
                translateSystemFieldName(f.name, f.alias),
                f.is_active ? t("enabled") : t("disabled")
            ]),
        });
    };

    return (
        <div className="p-4 space-y-5 bg-gray-50/10 min-h-screen font-sans">
            {/* Page Header Banner (Mandatory Rule: Edge-to-edge gradient div, NEVER inside Card) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <FormInput className="h-5 w-5" />
                    </span>
                    <div>
                        <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">
                            {t("system_fields")}
                        </h1>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {t("toggle_student_and_staff_profile_fields")}
                        </p>
                    </div>
                </div>

                {/* Scope Tabs */}
                <div className="flex items-center p-1 rounded-xl bg-white/95 border border-gray-200/80 shadow-xs gap-1">
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab("student");
                            setCurrentPage(1);
                        }}
                        className={cn(
                            "h-8 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer select-none",
                            activeTab === "student"
                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                                : "text-gray-700 hover:text-gray-900 hover:bg-gray-100/80"
                        )}
                    >
                        {t("student")}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab("staff");
                            setCurrentPage(1);
                        }}
                        className={cn(
                            "h-8 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer select-none",
                            activeTab === "staff"
                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-xs"
                                : "text-gray-700 hover:text-gray-900 hover:bg-gray-100/80"
                        )}
                    >
                        {t("staff")}
                    </button>
                </div>
            </div>

            {/* Table Container Card */}
            <Card className="rounded-lg shadow-sm border border-gray-100 overflow-hidden bg-white">
                <CardContent className="p-0">
                    {loading ? (
                        <TableSkeleton rows={8} columns={1} />
                    ) : (
                        <>
                            {/* Toolbar */}
                            <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-3 bg-white border-b border-gray-100">
                                <div className="relative w-full md:w-64">
                                    <Input
                                        placeholder={t("search_system_fields")}
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="h-8 text-[12px] pl-3 border-gray-200 shadow-none rounded-lg bg-gray-50/50 focus:bg-white transition-colors placeholder:text-gray-400"
                                    />
                                </div>

                                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                    <Select
                                        value={itemsPerPage.toString()}
                                        onValueChange={(val) => {
                                            setItemsPerPage(Number(val));
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="h-7 w-16 text-[11px] border-gray-200 shadow-none rounded-lg bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">{toLocaleNumber(10, language?.short_code)}</SelectItem>
                                            <SelectItem value="25">{toLocaleNumber(25, language?.short_code)}</SelectItem>
                                            <SelectItem value="50">{toLocaleNumber(50, language?.short_code)}</SelectItem>
                                            <SelectItem value="100">{toLocaleNumber(100, language?.short_code)}</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg" onClick={() => handleExport("copy")}><Copy className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg" onClick={() => handleExport("excel")}><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg" onClick={() => handleExport("pdf")}><FileText className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg" onClick={() => handleExport("print")}><Printer className="h-3.5 w-3.5" /></Button>
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="p-3 sm:p-4">
                                <div className="border border-gray-100 rounded-lg overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-gray-50/60">
                                            <TableRow className="border-b border-gray-100 hover:bg-transparent text-[11px]">
                                                <TableHead className="h-9 px-4 font-bold text-gray-700 text-[11px] uppercase w-full">
                                                    <div className="flex items-center gap-1">
                                                        {t("field_name")} <ArrowUpDown className="h-3 w-3 opacity-30" />
                                                    </div>
                                                </TableHead>
                                                <TableHead className="h-9 px-4 font-bold text-gray-700 text-[11px] uppercase text-right w-24">
                                                    {t("status")}
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginated.map((item) => (
                                                <TableRow
                                                    key={item.id}
                                                    className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors h-11"
                                                >
                                                    <TableCell className="py-2.5 px-4 text-xs font-medium text-gray-800">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-gray-700">
                                                                {translateSystemFieldName(item.name, item.alias)}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 font-mono">
                                                                ({item.alias})
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-4 text-right">
                                                        <div className="flex justify-end items-center gap-2">
                                                            {updatingId === item.id && (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                                                            )}
                                                            <Switch
                                                                checked={item.is_active}
                                                                disabled={updatingId === item.id}
                                                                onCheckedChange={() => toggleField(item.id)}
                                                                className="data-[state=checked]:bg-[#6366f1] scale-90 transition-all"
                                                            />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {paginated.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={2} className="h-24 text-center text-xs text-gray-400">
                                                        {t("no_records_found")}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                <div className="flex items-center justify-between pt-3 px-1">
                                    <p className="text-[11px] text-gray-500 font-medium">
                                        {t("showing")} {toLocaleNumber(filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1, language?.short_code)} {t("to")} {toLocaleNumber(Math.min(currentPage * itemsPerPage, filtered.length), language?.short_code)} {t("of")} {toLocaleNumber(filtered.length, language?.short_code)} {t("entries")}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-6 w-6 text-gray-400 border-gray-200 hover:text-indigo-600 disabled:opacity-50 rounded"
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-3 w-3" />
                                        </Button>
                                        {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map((pageNum) => (
                                            <Button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                variant={currentPage === pageNum ? "pagination-active" : "pagination-inactive"}
                                                className="h-6 w-6 p-0 text-[10px] rounded"
                                            >
                                                {toLocaleNumber(pageNum, language?.short_code)}
                                            </Button>
                                        ))}
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-6 w-6 text-gray-400 border-gray-200 hover:text-indigo-600 disabled:opacity-50 rounded"
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages || totalPages === 0}
                                        >
                                            <ChevronRight className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
