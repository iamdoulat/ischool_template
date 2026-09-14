/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    Building2,
    Save,
    X,
    XCircle,
    Sparkles,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { cn, toLocaleNumber } from "@/lib/utils";
import api from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface HostelMaster {
    id: number;
    name: string;
    type: string;
    address: string;
    intake: number | null;
    description: string;
}

const TABLE_COLS = 6;

function SkeletonRows({ rows = 6, cols = TABLE_COLS }: { rows?: number; cols?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i} className="border-b border-gray-100 dark:border-gray-800">
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3.5">
                            <div
                                className="h-3.5 rounded bg-gray-200/70 dark:bg-gray-700/70 animate-pulse"
                                style={{ width: `${50 + ((i * 3 + j * 7) % 40)}%` }}
                            />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

const EMPTY_FORM = {
    id: null as number | null,
    name: "",
    type: "",
    address: "",
    intake: "" as string | number,
    description: "",
};

export default function HostelMasterPage() {
    const { t, language } = useTranslation();
    const tt = useTranslateToast();
    const shortCode = language?.short_code || "en";

    const [hostels, setHostels] = useState<HostelMaster[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [form, setForm] = useState({ ...EMPTY_FORM });

    // Delete confirmation
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    const fetchHostels = async () => {
        setFetching(true);
        try {
            const res = await api.get("/hostels");
            const data = res.data?.data || res.data || [];
            setHostels(Array.isArray(data) ? data : []);
        } catch (error) {
            tt.error("failed_to_fetch_hostels");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchHostels();
    }, []);

    const resetForm = () => {
        setForm({ ...EMPTY_FORM });
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.type) {
            tt.error("fill_required_fields");
            return;
        }

        setLoading(true);
        const submitData = {
            ...form,
            intake: form.intake !== "" && form.intake !== null ? Number(form.intake) : null,
        };

        try {
            if (form.id) {
                await api.put(`/hostels/${form.id}`, submitData);
                tt.success("hostel_updated_successfully");
            } else {
                await api.post("/hostels", submitData);
                tt.success("hostel_created_successfully");
            }
            resetForm();
            fetchHostels();
        } catch (error) {
            tt.error("failed_to_save_hostel");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (hostel: HostelMaster) => {
        setForm({
            id: hostel.id,
            name: hostel.name,
            type: hostel.type,
            address: hostel.address || "",
            intake: hostel.intake !== null ? hostel.intake.toString() : "",
            description: hostel.description || "",
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const confirmDelete = (id: number) => {
        setDeleteId(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/hostels/${deleteId}`);
            tt.success("hostel_deleted_successfully");
            fetchHostels();
        } catch (error) {
            tt.error("failed_to_delete_hostel");
        } finally {
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    const formatHostelType = (type: string) => {
        const lower = (type || "").toLowerCase();
        if (lower === "boys") return t("boys");
        if (lower === "girls") return t("girls");
        if (lower === "combine") return t("combine");
        return type || "—";
    };

    const filteredHostels = hostels.filter(
        (h) =>
            (h.name && h.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (h.type && h.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (h.address && h.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredHostels.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedHostels = filteredHostels.slice(startIndex, startIndex + itemsPerPage);

    const exportToExcel = () => {
        const data = filteredHostels.map((h, i) => ({
            SL: i + 1,
            "Hostel Name": h.name,
            Type: formatHostelType(h.type),
            Address: h.address || "",
            "Intake / Capacity": h.intake ?? "",
            Description: h.description || "",
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Hostels");
        XLSX.writeFile(wb, "hostels.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Hostel List", 14, 15);
        autoTable(doc, {
            head: [["#", "Hostel Name", "Type", "Address", "Intake", "Description"]],
            body: filteredHostels.map((h, i) => [
                i + 1,
                h.name,
                formatHostelType(h.type),
                h.address || "-",
                h.intake ?? "-",
                h.description || "-",
            ]),
            startY: 20,
        });
        doc.save("hostels.pdf");
    };

    const copyToClipboard = () => {
        const text = filteredHostels
            .map(
                (h, i) =>
                    `${i + 1}. ${h.name}\t${formatHostelType(h.type)}\t${h.address || "-"}\t${h.intake ?? "-"}\t${h.description || "-"}`
            )
            .join("\n");
        navigator.clipboard.writeText(text);
        tt.success("data_copied_to_clipboard");
    };

    const toolbarActions = [
        { Icon: Copy, onClick: copyToClipboard, title: t("copy") },
        { Icon: FileSpreadsheet, onClick: exportToExcel, title: t("excel") },
        { Icon: FileText, onClick: exportToPDF, title: t("pdf") },
        { Icon: Printer, onClick: () => window.print(), title: t("print") },
    ];

    return (
        <div className="space-y-6 w-full pb-12 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Form Card (4 cols) */}
                <Card className="lg:col-span-4 border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-4">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 dark:border-gray-800">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Building2 className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
                                {form.id ? t("edit_hostel") : t("add_hostel")}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1 truncate">
                                {t("hostel_master_record")}
                            </p>
                        </div>
                    </CardHeader>

                    <CardContent className="p-5 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                <span>{t("hostel_name")}</span>
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="h-9 border-gray-200 dark:border-gray-700 text-xs focus-visible:ring-indigo-500 rounded-lg shadow-none"
                                placeholder={t("hostel_name")}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                <span>{t("type")}</span>
                                <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={form.type}
                                onValueChange={(val) => setForm({ ...form, type: val })}
                            >
                                <SelectTrigger className="h-9 border-gray-200 dark:border-gray-700 text-xs focus:ring-indigo-500 rounded-lg shadow-none">
                                    <SelectValue placeholder={t("select")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="boys" className="text-xs">
                                        {t("boys")}
                                    </SelectItem>
                                    <SelectItem value="girls" className="text-xs">
                                        {t("girls")}
                                    </SelectItem>
                                    <SelectItem value="combine" className="text-xs">
                                        {t("combine")}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {t("address")}
                            </Label>
                            <Input
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                className="h-9 border-gray-200 dark:border-gray-700 text-xs focus-visible:ring-indigo-500 rounded-lg shadow-none"
                                placeholder={t("address")}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {t("intake")}
                            </Label>
                            <Input
                                type="number"
                                value={form.intake ?? ""}
                                onChange={(e) => setForm({ ...form, intake: e.target.value })}
                                className="h-9 border-gray-200 dark:border-gray-700 text-xs focus-visible:ring-indigo-500 rounded-lg shadow-none font-mono"
                                placeholder="100"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {t("description")}
                            </Label>
                            <Textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="min-h-[85px] border-gray-200 dark:border-gray-700 text-xs focus-visible:ring-indigo-500 rounded-lg shadow-none resize-none"
                                placeholder={t("description")}
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            {form.id && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetForm}
                                    className="h-9 px-4 rounded-full text-xs font-bold gap-1.5 cursor-pointer"
                                >
                                    <XCircle className="h-3.5 w-3.5" />
                                    <span>{t("cancel")}</span>
                                </Button>
                            )}
                            <Button
                                onClick={handleSave}
                                disabled={loading}
                                className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white font-bold text-xs shadow-md active:scale-95 transition-all gap-2 cursor-pointer"
                            >
                                <Save className="h-4 w-4" />
                                <span>{loading ? t("saving") : form.id ? t("update") : t("save")}</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Right: Table Card (8 cols) */}
                <Card className="lg:col-span-8 border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Building2 className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <CardTitle className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
                                        {t("hostel_list")}
                                    </CardTitle>
                                    <Badge variant="outline" className="bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 border-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-500" />
                                        {toLocaleNumber(filteredHostels.length, shortCode)} {filteredHostels.length === 1 ? t("hostel") : t("hostels")}
                                    </Badge>
                                </div>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    {t("hostel_master_record")}
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-5 space-y-4">
                        {/* Search & Toolbar */}
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                                <Input
                                    placeholder={t("search")}
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="h-9 pl-8 pr-8 text-xs rounded-lg border-gray-200 dark:border-gray-700 bg-background focus-visible:ring-indigo-500 shadow-none"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-2">
                                <Select
                                    value={itemsPerPage.toString()}
                                    onValueChange={(val) => {
                                        setItemsPerPage(parseInt(val));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <SelectTrigger className="w-[75px] h-9 text-xs border-gray-200 dark:border-gray-700 rounded-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10" className="text-xs font-bold">{toLocaleNumber("10", shortCode)}</SelectItem>
                                        <SelectItem value="25" className="text-xs font-bold">{toLocaleNumber("25", shortCode)}</SelectItem>
                                        <SelectItem value="50" className="text-xs font-bold">{toLocaleNumber("50", shortCode)}</SelectItem>
                                        <SelectItem value="100" className="text-xs font-bold">{toLocaleNumber("100", shortCode)}</SelectItem>
                                    </SelectContent>
                                </Select>

                                <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg p-0.5 bg-gray-50 dark:bg-gray-800/50">
                                    {toolbarActions.map((action, i) => (
                                        <Button
                                            key={i}
                                            variant="ghost"
                                            size="icon"
                                            onClick={action.onClick}
                                            title={action.title}
                                            className="h-7 w-7 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all cursor-pointer"
                                        >
                                            <action.Icon className="h-3.5 w-3.5" />
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[700px]">
                                <TableHeader className="bg-gray-50 dark:bg-gray-800/60 text-xs">
                                    <TableRow className="hover:bg-transparent whitespace-nowrap">
                                        <TableHead className="w-14 py-3 px-3 text-center font-bold text-gray-600 dark:text-gray-400">#</TableHead>
                                        <TableHead className="font-semibold text-gray-600 dark:text-gray-400 py-3 px-4">{t("hostel_name")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600 dark:text-gray-400 py-3 px-4">{t("type")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600 dark:text-gray-400 py-3 px-4">{t("address")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600 dark:text-gray-400 py-3 px-4 text-center">{t("intake")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600 dark:text-gray-400 py-3 px-4">{t("description")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600 dark:text-gray-400 py-3 px-4 text-right w-24">{t("action")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {fetching ? (
                                        <SkeletonRows rows={5} cols={TABLE_COLS + 1} />
                                    ) : paginatedHostels.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={TABLE_COLS + 1} className="px-4 py-12 text-center text-xs font-bold uppercase tracking-wider text-gray-400">
                                                {t("no_hostels_found")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedHostels.map((hostel, idx) => {
                                            const serialNumber = startIndex + idx + 1;
                                            return (
                                                <TableRow
                                                    key={hostel.id}
                                                    className="text-xs hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all cursor-pointer whitespace-nowrap"
                                                >
                                                    <TableCell className="py-3 px-3 text-center text-gray-500 font-mono text-[11px]">
                                                        {toLocaleNumber(String(serialNumber).padStart(2, "0"), shortCode)}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-800 dark:text-gray-100 font-bold">
                                                        {hostel.name}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4">
                                                        <Badge
                                                            variant="secondary"
                                                            className={cn(
                                                                "text-[11px] font-medium border",
                                                                hostel.type === "boys" && "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
                                                                hostel.type === "girls" && "bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800",
                                                                hostel.type === "combine" && "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                                                            )}
                                                        >
                                                            {formatHostelType(hostel.type)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-600 dark:text-gray-300">
                                                        {hostel.address || "—"}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-center text-gray-700 dark:text-gray-300 font-mono font-medium">
                                                        {hostel.intake !== null && hostel.intake !== undefined
                                                            ? toLocaleNumber(hostel.intake, shortCode)
                                                            : "—"}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-gray-600 dark:text-gray-300 max-w-[200px] truncate">
                                                        {hostel.description || "—"}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                onClick={() => handleEdit(hostel)}
                                                                size="sm"
                                                                title={t("edit")}
                                                                className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded p-0 shadow-xs active:scale-95 transition-all cursor-pointer"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                onClick={() => confirmDelete(hostel.id)}
                                                                size="sm"
                                                                title={t("delete")}
                                                                className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded p-0 shadow-xs active:scale-95 transition-all cursor-pointer"
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

                        {/* Pagination Footer with Gradient System */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-1">
                            <div>
                                {t("showing_x_to_y_of_z", {
                                    from: toLocaleNumber(filteredHostels.length === 0 ? 0 : startIndex + 1, shortCode),
                                    to: toLocaleNumber(Math.min(startIndex + itemsPerPage, filteredHostels.length), shortCode),
                                    total: toLocaleNumber(filteredHostels.length, shortCode),
                                })}
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    className="h-8 w-8 p-0 rounded-lg bg-background border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 cursor-pointer"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        size="sm"
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "h-8 w-8 p-0 rounded-lg text-xs font-bold transition-all cursor-pointer",
                                            currentPage === page
                                                ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-xs"
                                                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                                        )}
                                    >
                                        {toLocaleNumber(page, shortCode)}
                                    </Button>
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    className="h-8 w-8 p-0 rounded-lg bg-background border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 cursor-pointer"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Alert Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-3xl border-border bg-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-black tracking-tight text-foreground">
                            {t("delete")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground font-medium leading-relaxed">
                            {t("delete_hostel_confirmation")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl border-border text-xs font-bold">
                            {t("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                        >
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}