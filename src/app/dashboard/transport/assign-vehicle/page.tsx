/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
    Bus,
    Search,
    X,
    Sparkles,
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

interface RouteAssignment {
    id: number;
    title: string;
    vehicles: { id: number; vehicle_no: string }[];
}

const TABLE_COLS = 4;

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

export default function AssignVehiclePage() {
    const { t, language } = useTranslation();
    const tt = useTranslateToast();
    const shortCode = language?.short_code || "en";

    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [routes, setRoutes] = useState<any[]>([]);
    const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<RouteAssignment[]>([]);

    const [selectedRouteId, setSelectedRouteId] = useState("");
    const [selectedVehicleIds, setSelectedVehicleIds] = useState<number[]>([]);
    const [isEditing, setIsEditing] = useState(false);

    // Delete confirmation
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    const fetchData = async () => {
        setFetching(true);
        try {
            const [routesRes, vehiclesRes, assignmentsRes] = await Promise.all([
                api.get("/transport/routes"),
                api.get("/transport/vehicles"),
                api.get("/transport/route-vehicles")
            ]);
            const rData = routesRes.data?.data || routesRes.data || [];
            const vData = vehiclesRes.data?.data || vehiclesRes.data || [];
            const aData = assignmentsRes.data?.data || assignmentsRes.data || [];

            setRoutes(Array.isArray(rData) ? rData : []);
            setAvailableVehicles(Array.isArray(vData) ? vData : []);
            setAssignments(Array.isArray(aData) ? aData.filter((r: any) => r.vehicles && r.vehicles.length > 0) : []);
        } catch (error) {
            tt.error("failed_to_load_mapping_data");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleVehicle = (vehicleId: number) => {
        setSelectedVehicleIds((prev) =>
            prev.includes(vehicleId) ? prev.filter((v) => v !== vehicleId) : [...prev, vehicleId]
        );
    };

    const resetForm = () => {
        setIsEditing(false);
        setSelectedRouteId("");
        setSelectedVehicleIds([]);
    };

    const handleSave = async () => {
        if (!selectedRouteId || selectedVehicleIds.length === 0) {
            tt.error("select_route_and_vehicle");
            return;
        }
        setLoading(true);
        try {
            await api.post("/transport/route-vehicles", {
                route_id: selectedRouteId,
                vehicle_ids: selectedVehicleIds
            });
            tt.success(isEditing ? "assignment_updated_successfully" : "vehicles_assigned_successfully");
            resetForm();
            fetchData();
        } catch (error) {
            tt.error("failed_to_save_assignment");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (assignment: RouteAssignment) => {
        setSelectedRouteId(assignment.id.toString());
        setSelectedVehicleIds(assignment.vehicles.map((v) => v.id));
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const confirmDelete = (id: number) => {
        setDeleteId(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/transport/route-vehicles/${deleteId}`);
            tt.success("assignments_removed_successfully");
            fetchData();
        } catch (error) {
            tt.error("failed_to_remove_assignments");
        } finally {
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    const filteredAssignments = assignments.filter((a) =>
        (a.title && a.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (a.vehicles && a.vehicles.some((v) => v.vehicle_no && v.vehicle_no.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedAssignments = filteredAssignments.slice(startIndex, startIndex + itemsPerPage);

    const exportToExcel = () => {
        const data = filteredAssignments.map((a, i) => ({
            "SL": i + 1,
            "Route": a.title,
            "Assigned Vehicles": a.vehicles.map((v) => v.vehicle_no).join(", ")
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Vehicle Assignments");
        XLSX.writeFile(wb, "vehicle_assignments.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Vehicle Route Assignments", 14, 15);
        autoTable(doc, {
            head: [["#", "Route", "Assigned Vehicles"]],
            body: filteredAssignments.map((a, i) => [i + 1, a.title, a.vehicles.map((v) => v.vehicle_no).join(", ")]),
            startY: 20
        });
        doc.save("vehicle_assignments.pdf");
    };

    const copyToClipboard = () => {
        const text = filteredAssignments
            .map((a, i) => `${i + 1}. ${a.title} -> ${a.vehicles.map((v) => v.vehicle_no).join(", ")}`)
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
                            <Bus className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
                                {isEditing ? t("update_assignment") : t("assign_vehicle_on_route")}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1 truncate">
                                {t("map_vehicles_to_route")}
                            </p>
                        </div>
                    </CardHeader>

                    <CardContent className="p-5 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                <span>{t("route")}</span>
                                <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedRouteId} onValueChange={setSelectedRouteId} disabled={isEditing}>
                                <SelectTrigger className="h-9 text-xs border-gray-200 dark:border-gray-700 rounded-lg">
                                    <SelectValue placeholder={t("select_route")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {routes.map((r) => (
                                        <SelectItem key={r.id} value={r.id.toString()} className="text-xs">
                                            {r.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2.5">
                            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                <span>{t("vehicle")}</span>
                                <span className="text-red-500">*</span>
                            </Label>
                            <div className="space-y-2 border border-gray-100 dark:border-gray-800 rounded-xl p-3 max-h-60 overflow-y-auto custom-scrollbar bg-background/50">
                                {availableVehicles.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic py-2 text-center">
                                        {t("no_vehicles_found")}
                                    </p>
                                ) : (
                                    availableVehicles.map((v) => (
                                        <div
                                            key={v.id}
                                            onClick={() => toggleVehicle(v.id)}
                                            className="flex items-center space-x-2.5 group cursor-pointer hover:bg-muted/40 p-1.5 rounded-lg transition-colors"
                                        >
                                            <Checkbox
                                                id={`v-${v.id}`}
                                                checked={selectedVehicleIds.includes(v.id)}
                                                onCheckedChange={() => toggleVehicle(v.id)}
                                                className="h-4 w-4 border-gray-300 accent-indigo-500 rounded"
                                            />
                                            <Label
                                                htmlFor={`v-${v.id}`}
                                                className="text-xs text-gray-700 dark:text-gray-200 font-medium cursor-pointer group-hover:text-indigo-600 transition-colors flex-1"
                                            >
                                                {v.vehicle_no} {v.vehicle_model ? `(${v.vehicle_model})` : ""}
                                            </Label>
                                        </div>
                                    ))
                                )}
                            </div>
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
                                disabled={loading}
                                onClick={handleSave}
                                className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white font-bold text-xs shadow-md active:scale-95 transition-all gap-2 cursor-pointer"
                            >
                                <Save className="h-4 w-4" />
                                <span>{loading ? t("saving") : isEditing ? t("update") : t("save")}</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Right: Table Card (8 cols) */}
                <Card className="lg:col-span-8 border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                                <Bus className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <CardTitle className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
                                        {t("vehicle_route_list")}
                                    </CardTitle>
                                    <Badge variant="outline" className="bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 border-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-500" />
                                        {toLocaleNumber(filteredAssignments.length, shortCode)} {filteredAssignments.length === 1 ? t("assignment") : t("assignments")}
                                    </Badge>
                                </div>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    {t("map_vehicles_to_route")}
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-5 space-y-4">
                        {/* Search & Tool Bar */}
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
                            <Table className="min-w-[600px]">
                                <TableHeader className="bg-gray-50 dark:bg-gray-800/60 text-xs">
                                    <TableRow className="hover:bg-transparent whitespace-nowrap">
                                        <TableHead className="w-14 py-3 px-3 text-center font-bold text-gray-600 dark:text-gray-400">#</TableHead>
                                        <TableHead className="font-semibold text-gray-600 dark:text-gray-400 py-3 px-4">{t("route")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600 dark:text-gray-400 py-3 px-4">{t("vehicle")}</TableHead>
                                        <TableHead className="font-semibold text-gray-600 dark:text-gray-400 py-3 px-4 text-right w-24">{t("action")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {fetching ? (
                                        <SkeletonRows rows={5} cols={TABLE_COLS} />
                                    ) : paginatedAssignments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={TABLE_COLS} className="px-4 py-12 text-center text-xs font-bold uppercase tracking-wider text-gray-400">
                                                {t("no_assignments_found")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedAssignments.map((assignment, idx) => {
                                            const serialNumber = startIndex + idx + 1;
                                            return (
                                                <TableRow
                                                    key={assignment.id}
                                                    className="text-xs hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all cursor-pointer"
                                                >
                                                    {/* Serial Number */}
                                                    <TableCell className="py-3 px-3 text-center text-gray-500 font-mono text-[11px]">
                                                        {toLocaleNumber(String(serialNumber).padStart(2, "0"), shortCode)}
                                                    </TableCell>

                                                    <TableCell className="py-3 px-4 text-gray-800 dark:text-gray-100 font-bold">
                                                        {assignment.title}
                                                    </TableCell>

                                                    <TableCell className="py-3 px-4 text-gray-600 dark:text-gray-300">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {assignment.vehicles.map((v) => (
                                                                <Badge
                                                                    key={v.id}
                                                                    variant="secondary"
                                                                    className="text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                                                                >
                                                                    {v.vehicle_no}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="py-3 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                onClick={() => handleEdit(assignment)}
                                                                size="sm"
                                                                title={t("edit")}
                                                                className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded p-0 shadow-xs active:scale-95 transition-all"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                onClick={() => confirmDelete(assignment.id)}
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
                                    from: toLocaleNumber(filteredAssignments.length === 0 ? 0 : startIndex + 1, shortCode),
                                    to: toLocaleNumber(Math.min(startIndex + itemsPerPage, filteredAssignments.length), shortCode),
                                    total: toLocaleNumber(filteredAssignments.length, shortCode),
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
                            {t("delete_assignment_confirmation")}
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
