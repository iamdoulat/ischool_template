/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    Save,
    Route as RouteIcon,
    Search,
    X,
    Milestone,
    XCircle,
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

interface Route {
    id: number;
    title: string;
    description?: string;
}

const TABLE_COLS = 3;

function SkeletonRows({ rows = 5, cols = TABLE_COLS }: { rows?: number; cols?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i} className="border-b border-gray-100 dark:border-gray-800">
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3">
                            <div
                                className="h-3.5 rounded bg-gray-200/70 dark:bg-gray-700/70 animate-pulse"
                                style={{ width: `${50 + ((i * 7 + j * 13) % 40)}%` }}
                            />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export default function RoutePage() {
    const { t, language } = useTranslation();
    const tt = useTranslateToast();
    const shortCode = language?.short_code || "en";

    const [searchTerm, setSearchTerm] = useState("");
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
    const [formState, setFormState] = useState({ title: "" });

    // Delete confirmation
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get("/transport/routes");
            const data = response.data?.data || response.data || [];
            setRoutes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching routes:", error);
            tt.error("failed_to_load_routes");
            setRoutes([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => {
        setIsEditing(false);
        setCurrentRoute(null);
        setFormState({ title: "" });
    };

    const handleSubmit = async () => {
        if (!formState.title.trim()) {
            tt.error("route_title_required");
            return;
        }
        setSaving(true);
        try {
            if (isEditing && currentRoute) {
                await api.put(`/transport/routes/${currentRoute.id}`, formState);
                tt.success("route_updated_successfully");
            } else {
                await api.post("/transport/routes", formState);
                tt.success("route_created_successfully");
            }
            resetForm();
            fetchData();
        } catch (error: any) {
            tt.error("failed_to_save_route");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (route: Route) => {
        setCurrentRoute(route);
        setFormState({ title: route.title || "" });
        setIsEditing(true);
    };

    const confirmDelete = (id: number) => {
        setDeleteId(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/transport/routes/${deleteId}`);
            tt.success("route_deleted_successfully");
            fetchData();
        } catch (error) {
            tt.error("failed_to_delete_route");
        } finally {
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    const filteredRoutes = routes.filter((r) =>
        r.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredRoutes.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredRoutes.slice(startIndex, startIndex + itemsPerPage);

    const exportToExcel = () => {
        const dataToExport = routes.map((r, i) => ({
            "SL": i + 1,
            "Route Title": r.title,
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Routes");
        XLSX.writeFile(wb, "transport_routes.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Transport Routes List", 14, 15);
        autoTable(doc, {
            head: [["#", "Route Title"]],
            body: routes.map((r, i) => [i + 1, r.title]),
            startY: 20,
        });
        doc.save("transport_routes.pdf");
    };

    const copyToClipboard = () => {
        const text = routes.map((r, i) => `${i + 1}. ${r.title}`).join("\n");
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
        <div className="space-y-6 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Form Card (4 cols) */}
                <Card className="lg:col-span-4 border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-4">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 dark:border-gray-800">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <RouteIcon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
                                {isEditing ? t("edit_route") : t("create_route")}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1 truncate">
                                {t("configure_transport_routes")}
                            </p>
                        </div>
                    </CardHeader>

                    <CardContent className="p-5 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                <span>{t("route_title")}</span>
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={formState.title}
                                onChange={(e) => setFormState({ title: e.target.value })}
                                placeholder={t("enter_route_title")}
                                className="h-9 text-xs rounded-lg border-gray-200 dark:border-gray-700 bg-background focus-visible:ring-indigo-500 shadow-none"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            {isEditing && (
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
                                onClick={handleSubmit}
                                disabled={saving}
                                className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white font-bold text-xs shadow-md active:scale-95 transition-all gap-2 cursor-pointer"
                            >
                                <Save className="h-4 w-4" />
                                <span>{saving ? t("saving") : isEditing ? t("update") : t("save")}</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Right: Table Card (8 cols) */}
                <Card className="lg:col-span-8 border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Milestone className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
                                        {t("route_list")}
                                    </CardTitle>
                                    <Badge variant="outline" className="bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 border-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        {toLocaleNumber(routes.length, shortCode)} {routes.length === 1 ? t("route") : t("routes")}
                                    </Badge>
                                </div>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    {t("configure_transport_routes")}
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-5 space-y-4">
                        {/* Search & Tool Bar */}
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                            {/* Search */}
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                                <Input
                                    placeholder={t("search_routes")}
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

                            {/* Page Size & Export */}
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
                            <Table className="min-w-[500px]">
                                <TableHeader className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-14 py-3 px-3 text-center font-bold text-gray-600 dark:text-gray-400">#</TableHead>
                                        <TableHead className="font-semibold text-gray-600 dark:text-gray-400 py-3 px-4">{t("route_title")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600 dark:text-gray-400 py-3 px-4 text-right w-24">{t("action")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {loading ? (
                                        <SkeletonRows rows={5} cols={TABLE_COLS} />
                                    ) : paginatedData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={TABLE_COLS} className="px-4 py-12 text-center text-xs font-bold uppercase tracking-wider text-gray-400">
                                                {t("no_routes_found")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedData.map((route, idx) => {
                                            const serialNumber = startIndex + idx + 1;
                                            return (
                                                <TableRow
                                                    key={route.id}
                                                    className="text-xs hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all cursor-pointer"
                                                >
                                                    {/* Serial Number */}
                                                    <TableCell className="py-3 px-3 text-center text-gray-500 font-mono text-[11px]">
                                                        {toLocaleNumber(String(serialNumber).padStart(2, "0"), shortCode)}
                                                    </TableCell>

                                                    {/* Route Title */}
                                                    <TableCell className="py-3 px-4 text-gray-700 dark:text-gray-200 font-medium">
                                                        {route.title}
                                                    </TableCell>

                                                    {/* Action Buttons */}
                                                    <TableCell className="py-3 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                onClick={() => handleEdit(route)}
                                                                size="sm"
                                                                title={t("edit")}
                                                                className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded p-0 shadow-xs active:scale-95 transition-all"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                onClick={() => confirmDelete(route.id)}
                                                                size="sm"
                                                                title={t("delete")}
                                                                className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded p-0 shadow-xs active:scale-95 transition-all"
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

                        {/* Pagination Footer */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-1">
                            <div>
                                {t("showing_x_to_y_of_z", {
                                    from: toLocaleNumber(filteredRoutes.length === 0 ? 0 : startIndex + 1, shortCode),
                                    to: toLocaleNumber(Math.min(startIndex + itemsPerPage, filteredRoutes.length), shortCode),
                                    total: toLocaleNumber(filteredRoutes.length, shortCode),
                                })}
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    className="h-8 w-8 p-0 rounded-lg bg-background border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        size="sm"
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "h-8 w-8 p-0 rounded-lg text-xs font-bold transition-all",
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
                                    className="h-8 w-8 p-0 rounded-lg bg-background border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40"
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
                <AlertDialogContent className="rounded-2xl border-gray-200 bg-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base font-bold text-foreground">
                            {t("delete")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground">
                            {t("delete_route_confirmation")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-lg border-gray-200 text-xs font-medium">
                            {t("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                        >
                            {t("delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
