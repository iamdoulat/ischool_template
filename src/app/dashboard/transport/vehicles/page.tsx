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
    Plus,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    Bus,
    Search,
    X,
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
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

interface Vehicle {
    id: number;
    vehicle_no: string;
    vehicle_model: string;
    year_made: string;
    registration_no: string;
    chassis_no: string;
    max_seating_capacity: string;
    driver_name: string;
    driver_license: string;
    driver_contact: string;
    note?: string;
}

const TABLE_COLS = 10;

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
    vehicle_no: "",
    vehicle_model: "",
    year_made: "",
    registration_no: "",
    chassis_no: "",
    max_seating_capacity: "",
    driver_name: "",
    driver_license: "",
    driver_contact: "",
    note: ""
};

export default function VehiclePage() {
    const { t, language } = useTranslation();
    const tt = useTranslateToast();
    const shortCode = language?.short_code || "en";

    const [searchTerm, setSearchTerm] = useState("");
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);
    const [formState, setFormState] = useState({ ...EMPTY_FORM });

    // Delete confirmation
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [vehiclesRes, staffRes] = await Promise.all([
                api.get("/transport/vehicles"),
                api.get("/hr/staff-directory")
            ]);
            const vData = vehiclesRes.data?.data || vehiclesRes.data || [];
            const sData = staffRes.data?.data || staffRes.data || [];
            setVehicles(Array.isArray(vData) ? vData : []);
            setStaffList(Array.isArray(sData) ? sData : []);
        } catch (error) {
            console.error("Error fetching data:", error);
            tt.error("failed_to_load_vehicles");
            setVehicles([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => {
        setFormState({ ...EMPTY_FORM });
        setIsEditing(false);
        setCurrentVehicle(null);
    };

    const handleSubmit = async () => {
        if (!formState.vehicle_no.trim()) {
            tt.error("vehicle_number_required");
            return;
        }
        setSaving(true);
        try {
            if (isEditing && currentVehicle) {
                await api.put(`/transport/vehicles/${currentVehicle.id}`, formState);
                tt.success("vehicle_updated_successfully");
            } else {
                await api.post("/transport/vehicles", formState);
                tt.success("vehicle_created_successfully");
            }
            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            tt.error("failed_to_save_vehicle");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (vehicle: Vehicle) => {
        setCurrentVehicle(vehicle);
        setFormState({
            vehicle_no: vehicle.vehicle_no || "",
            vehicle_model: vehicle.vehicle_model || "",
            year_made: vehicle.year_made || "",
            registration_no: vehicle.registration_no || "",
            chassis_no: vehicle.chassis_no || "",
            max_seating_capacity: vehicle.max_seating_capacity || "",
            driver_name: vehicle.driver_name || "",
            driver_license: vehicle.driver_license || "",
            driver_contact: vehicle.driver_contact || "",
            note: vehicle.note || ""
        });
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const confirmDelete = (id: number) => {
        setDeleteId(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/transport/vehicles/${deleteId}`);
            tt.success("vehicle_deleted_successfully");
            fetchData();
        } catch (error) {
            tt.error("failed_to_delete_vehicle");
        } finally {
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    const filteredVehicles = vehicles.filter((v) =>
        (v.vehicle_no && v.vehicle_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.vehicle_model && v.vehicle_model.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.driver_name && v.driver_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.registration_no && v.registration_no.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredVehicles.slice(startIndex, startIndex + itemsPerPage);

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(vehicles.map((v, i) => ({
            "SL": i + 1,
            "Vehicle No": v.vehicle_no,
            "Model": v.vehicle_model,
            "Year": v.year_made,
            "Registration No": v.registration_no,
            "Chassis No": v.chassis_no,
            "Capacity": v.max_seating_capacity,
            "Driver Name": v.driver_name,
            "Driver License": v.driver_license,
            "Driver Contact": v.driver_contact,
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Vehicles");
        XLSX.writeFile(wb, "transport_vehicles.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF("landscape");
        doc.text("Transport Vehicles List", 14, 15);
        autoTable(doc, {
            head: [["#", "Vehicle No", "Model", "Year", "Reg No", "Chassis", "Capacity", "Driver", "License", "Contact"]],
            body: vehicles.map((v, i) => [
                i + 1,
                v.vehicle_no,
                v.vehicle_model || "-",
                v.year_made || "-",
                v.registration_no || "-",
                v.chassis_no || "-",
                v.max_seating_capacity || "-",
                v.driver_name || "-",
                v.driver_license || "-",
                v.driver_contact || "-",
            ]),
            startY: 20,
            styles: { fontSize: 8 }
        });
        doc.save("transport_vehicles.pdf");
    };

    const copyToClipboard = () => {
        const text = vehicles.map((v, i) => `${i + 1}. ${v.vehicle_no} - ${v.driver_name || "-"}`).join("\n");
        navigator.clipboard.writeText(text);
        tt.success("data_copied_to_clipboard");
    };

    const toolbarActions = [
        { Icon: Copy, onClick: copyToClipboard, title: t("copy") },
        { Icon: FileSpreadsheet, onClick: exportToExcel, title: t("excel") },
        { Icon: FileText, onClick: exportToPDF, title: t("pdf") },
        { Icon: Printer, onClick: () => window.print(), title: t("print") },
    ];

    const cleanDisplay = (val?: string) => {
        if (!val || val.toLowerCase() === "none") return "-";
        return val;
    };

    return (
        <div className="space-y-6 w-full pb-12 animate-in fade-in duration-500">
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD] border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Bus className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <CardTitle className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 leading-none">
                                    {t("vehicle_list")}
                                </CardTitle>
                                <Badge variant="outline" className="bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 border-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-500" />
                                    {toLocaleNumber(vehicles.length, shortCode)} {vehicles.length === 1 ? t("vehicle") : t("vehicles")}
                                </Badge>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {t("enter_vehicle_and_driver_info")}
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={() => {
                            resetForm();
                            setIsModalOpen(true);
                        }}
                        className="h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        <span>{t("add_vehicle")}</span>
                    </Button>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                    {/* Search & Tool Bar */}
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                        <div className="relative w-full md:w-64">
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
                        <Table className="min-w-[1100px]">
                            <TableHeader className="bg-gray-50 dark:bg-gray-800/60 text-xs">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="w-14 py-3 px-3 text-center font-bold text-gray-600 dark:text-gray-400">#</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-400 py-3 px-4">{t("vehicle_number")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-400 py-3 px-4">{t("vehicle_model")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-400 text-center py-3 px-4">{t("year_made")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-400 text-center py-3 px-4">{t("registration_no")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-400 text-center py-3 px-4">{t("chassis_number")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-400 text-center py-3 px-4">{t("capacity")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-400 text-center py-3 px-4">{t("driver_name")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-400 text-center py-3 px-4">{t("driver_license")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-400 text-center py-3 px-4">{t("driver_contact")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 dark:text-gray-400 text-right py-3 px-4 w-24">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading ? (
                                    <SkeletonRows rows={6} cols={TABLE_COLS + 1} />
                                ) : paginatedData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={TABLE_COLS + 1} className="px-4 py-12 text-center text-xs font-bold uppercase tracking-wider text-gray-400">
                                            {t("no_vehicles_found")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedData.map((v, idx) => {
                                        const serialNumber = startIndex + idx + 1;
                                        return (
                                            <TableRow
                                                key={v.id}
                                                className="text-xs hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all cursor-pointer whitespace-nowrap"
                                            >
                                                {/* Serial Number */}
                                                <TableCell className="py-3 px-3 text-center text-gray-500 font-mono text-[11px]">
                                                    {toLocaleNumber(String(serialNumber).padStart(2, "0"), shortCode)}
                                                </TableCell>

                                                <TableCell className="py-3 px-4 text-gray-800 dark:text-gray-100 font-bold">
                                                    {v.vehicle_no}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-gray-600 dark:text-gray-300">
                                                    {cleanDisplay(v.vehicle_model)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center text-gray-600 dark:text-gray-300 font-mono">
                                                    {v.year_made && v.year_made.toLowerCase() !== "none" ? toLocaleNumber(v.year_made, shortCode) : "-"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center text-gray-600 dark:text-gray-300">
                                                    {cleanDisplay(v.registration_no)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center text-gray-600 dark:text-gray-300">
                                                    {cleanDisplay(v.chassis_no)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center text-gray-600 dark:text-gray-300 font-mono">
                                                    {v.max_seating_capacity && v.max_seating_capacity.toLowerCase() !== "none" ? toLocaleNumber(v.max_seating_capacity, shortCode) : "-"}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center text-gray-700 dark:text-gray-200 font-medium">
                                                    {cleanDisplay(v.driver_name)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center text-gray-600 dark:text-gray-300 font-mono">
                                                    {cleanDisplay(v.driver_license)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-center text-gray-600 dark:text-gray-300 font-mono">
                                                    {cleanDisplay(v.driver_contact)}
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            onClick={() => handleEdit(v)}
                                                            size="sm"
                                                            title={t("edit")}
                                                            className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded p-0 shadow-xs active:scale-95 transition-all"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => confirmDelete(v.id)}
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
                                from: toLocaleNumber(filteredVehicles.length === 0 ? 0 : startIndex + 1, shortCode),
                                to: toLocaleNumber(Math.min(startIndex + itemsPerPage, filteredVehicles.length), shortCode),
                                total: toLocaleNumber(filteredVehicles.length, shortCode),
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

            {/* Vehicle Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-card">
                    <DialogHeader className="p-6 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white">
                        <DialogTitle className="text-white text-xl font-bold tracking-tight">
                            {isEditing ? t("edit_vehicle") : t("add_new_vehicle")}
                        </DialogTitle>
                        <p className="text-white/90 text-xs font-medium mt-0.5">
                            {t("enter_vehicle_and_driver_info")}
                        </p>
                    </DialogHeader>

                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                                    <span>{t("vehicle_no")}</span>
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={formState.vehicle_no}
                                    onChange={(e) => setFormState({ ...formState, vehicle_no: e.target.value })}
                                    className="h-10 border-border bg-background focus-visible:ring-primary rounded-xl text-xs font-bold"
                                    placeholder={t("vehicle_no")}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-foreground">
                                    {t("vehicle_model")}
                                </Label>
                                <Input
                                    value={formState.vehicle_model}
                                    onChange={(e) => setFormState({ ...formState, vehicle_model: e.target.value })}
                                    className="h-10 border-border bg-background focus-visible:ring-primary rounded-xl text-xs font-medium"
                                    placeholder={t("vehicle_model")}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-foreground">
                                    {t("year_made")}
                                </Label>
                                <Input
                                    value={formState.year_made}
                                    onChange={(e) => setFormState({ ...formState, year_made: e.target.value })}
                                    className="h-10 border-border bg-background focus-visible:ring-primary rounded-xl text-xs font-mono font-medium"
                                    placeholder="2024"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-foreground">
                                    {t("registration_no")}
                                </Label>
                                <Input
                                    value={formState.registration_no}
                                    onChange={(e) => setFormState({ ...formState, registration_no: e.target.value })}
                                    className="h-10 border-border bg-background focus-visible:ring-primary rounded-xl text-xs font-medium"
                                    placeholder={t("registration_no")}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-foreground">
                                    {t("chassis_number")}
                                </Label>
                                <Input
                                    value={formState.chassis_no}
                                    onChange={(e) => setFormState({ ...formState, chassis_no: e.target.value })}
                                    className="h-10 border-border bg-background focus-visible:ring-primary rounded-xl text-xs font-mono font-medium"
                                    placeholder={t("chassis_number")}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-foreground">
                                    {t("max_seating_capacity")}
                                </Label>
                                <Input
                                    value={formState.max_seating_capacity}
                                    onChange={(e) => setFormState({ ...formState, max_seating_capacity: e.target.value })}
                                    className="h-10 border-border bg-background focus-visible:ring-primary rounded-xl text-xs font-mono font-medium"
                                    placeholder="30"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-foreground">
                                    {t("driver_name")}
                                </Label>
                                <Select
                                    value={formState.driver_name}
                                    onValueChange={(val) => {
                                        const selectedStaff = staffList.find((s) => s.name === val);
                                        if (selectedStaff) {
                                            setFormState({
                                                ...formState,
                                                driver_name: selectedStaff.name,
                                                driver_contact: selectedStaff.phone || formState.driver_contact,
                                            });
                                        } else {
                                            setFormState({ ...formState, driver_name: val });
                                        }
                                    }}
                                >
                                    <SelectTrigger className="h-10 border-border bg-background focus-visible:ring-primary rounded-xl text-xs font-medium">
                                        <SelectValue placeholder={t("select_driver")} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px] rounded-xl">
                                        {staffList
                                            .filter((staff) => staff.role === "Driver")
                                            .map((staff) => (
                                                <SelectItem key={staff.id} value={staff.name} className="text-xs">
                                                    {staff.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-foreground">
                                    {t("driver_license")}
                                </Label>
                                <Input
                                    value={formState.driver_license}
                                    onChange={(e) => setFormState({ ...formState, driver_license: e.target.value })}
                                    className="h-10 border-border bg-background focus-visible:ring-primary rounded-xl text-xs font-medium"
                                    placeholder={t("driver_license")}
                                />
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                                <Label className="text-xs font-bold text-foreground">
                                    {t("driver_contact")}
                                </Label>
                                <Input
                                    value={formState.driver_contact}
                                    onChange={(e) => setFormState({ ...formState, driver_contact: e.target.value })}
                                    className="h-10 border-border bg-background focus-visible:ring-primary rounded-xl text-xs font-mono font-medium"
                                    placeholder="+880 1XXXXXXXXX"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-foreground">
                                {t("note")}
                            </Label>
                            <Input
                                value={formState.note}
                                onChange={(e) => setFormState({ ...formState, note: e.target.value })}
                                className="h-10 border-border bg-background focus-visible:ring-primary rounded-xl text-xs font-medium"
                                placeholder={t("note")}
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-4 sm:p-6 bg-muted/30 border-t border-border flex flex-col sm:flex-row sm:justify-end gap-2.5">
                        <Button
                            onClick={() => setIsModalOpen(false)}
                            variant="outline"
                            className="h-10 px-6 rounded-xl border-border text-xs font-bold"
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="h-10 px-8 rounded-xl bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#4f46e5] text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all gap-2 cursor-pointer"
                        >
                            <span>{saving ? t("saving") : isEditing ? t("save_changes") : t("create_vehicle")}</span>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-3xl border-border bg-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-black tracking-tight text-foreground">
                            {t("delete")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground font-medium leading-relaxed">
                            {t("delete_vehicle_confirmation")}
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
