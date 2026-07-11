"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "@/hooks/use-translation";
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
    Columns,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    ShieldCheck,
    Loader2,
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { exportData } from "@/lib/export-utils";

interface CaptchaSetting {
    id: number;
    name: string;
    alias: string;
    is_active: boolean;
}

export default function CaptchaSettingPage() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [settings, setSettings] = useState<CaptchaSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get("/system-setting/captcha-settings");
            setSettings(res.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch captcha settings", error);
            toast("error", t("failed_to_fetch_captcha_settings"));
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const toggleSetting = async (id: number) => {
        try {
            setUpdatingId(id);
            const res = await api.post(`/system-setting/captcha-settings/${id}/toggle`);
            const updated = res.data?.data;
            if (updated) {
                setSettings((prev) => prev.map((s) => (s.id === id ? updated : s)));
                toast("success", t("captcha_setting_updated"));
            }
        } catch (error) {
            console.error("Failed to update captcha setting", error);
            toast("error", t("failed_to_update_captcha_setting"));
        } finally {
            setUpdatingId(null);
        }
    };

    const filtered = useMemo(
        () =>
            settings.filter((item) =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
            ),
        [settings, searchTerm]
    );

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleExport = (type: "copy" | "excel" | "pdf" | "print") => {
        exportData(type, {
            filename: "captcha-settings",
            title: t("captcha_setting"),
            columns: [t("name"), t("status")],
            rows: filtered.map((s) => [s.name, s.is_active ? t("enabled") : t("disabled")]),
        });
    };

    return (
        <div className="p-4 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <Card className="pt-0 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <ShieldCheck className="h-5 w-5" />
                        </span>
                        <div>
                            <h1 className="text-[15px] font-bold text-gray-800 tracking-tight leading-none">{t("captcha_setting")}</h1>
                            <p className="text-[11px] text-gray-500 mt-1">{t("captcha_setting_subtitle")}</p>
                        </div>
                    </div>
                </div>
                <CardContent className="p-0">
                    {loading ? (
                        <TableSkeleton rows={6} columns={1} />
                    ) : (
                        <>
                            {/* Toolbar */}
                            <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-white border-b border-gray-50/50">
                                <div className="relative w-full md:w-64">
                                    <Input
                                        placeholder={t("search")}
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="h-8 text-[12px] pl-3 border-gray-200 shadow-none rounded bg-gray-50/50 focus:bg-white transition-colors placeholder:text-gray-400"
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <Select
                                        value={itemsPerPage.toString()}
                                        onValueChange={(val) => {
                                            setItemsPerPage(Number(val));
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="h-7 w-16 text-[11px] border-gray-200 shadow-none rounded bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50" onClick={() => handleExport("copy")}><Copy className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50" onClick={() => handleExport("excel")}><FileSpreadsheet className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50" onClick={() => handleExport("pdf")}><FileText className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50" onClick={() => handleExport("print")}><Printer className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50"><Columns className="h-3.5 w-3.5" /></Button>
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="p-4">
                                <div className="border border-gray-100 rounded overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-gray-50/40">
                                            <TableRow className="border-b border-gray-100 hover:bg-transparent text-[11px]">
                                                <TableHead className="h-10 px-4 font-bold text-gray-600 text-[11px] uppercase w-full group">
                                                    <div className="flex items-center gap-1">{t("name")} <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100" /></div>
                                                </TableHead>
                                                <TableHead className="h-10 px-4 font-bold text-gray-600 text-[11px] uppercase text-right w-24">{t("action")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginated.map((item) => (
                                                <TableRow key={item.id} className="border-b border-gray-50 hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer h-11 group">
                                                    <TableCell className="py-2 px-4 text-[12px] text-gray-600 font-medium">{item.name}</TableCell>
                                                    <TableCell className="py-2 px-4 text-right">
                                                        <div className="flex justify-end items-center gap-2">
                                                            {updatingId === item.id && <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />}
                                                            <Switch
                                                                checked={item.is_active}
                                                                disabled={updatingId === item.id}
                                                                onCheckedChange={() => toggleSetting(item.id)}
                                                                className="data-[state=checked]:bg-[#6366f1] scale-90 transition-all"
                                                            />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {paginated.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={2} className="h-24 text-center text-[12px] text-gray-400">
                                                        {t("no_records_found")}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                <div className="flex items-center justify-between pt-4 px-1">
                                    <p className="text-[10px] text-gray-500 font-medium">
                                        {t("showing")} {filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} {t("to")} {Math.min(currentPage * itemsPerPage, filtered.length)} {t("of")} {filtered.length} {t("entries")}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-6 w-6 text-gray-400 border-gray-200 hover:text-indigo-600 disabled:opacity-50"
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
                                                className="h-6 w-6 p-0 text-[10px]"
                                            >
                                                {pageNum}
                                            </Button>
                                        ))}
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-6 w-6 text-gray-400 border-gray-200 hover:text-indigo-600 disabled:opacity-50"
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
