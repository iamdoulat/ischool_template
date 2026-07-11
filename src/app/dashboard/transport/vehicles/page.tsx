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
    Columns,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    Bus,
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
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/hooks/use-translation";
import { useTranslateToast } from "@/hooks/use-translate-toast";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
                <TableRow key={i} className="border-b border-gray-50">
                    {Array.from({ length: cols }).map((_, j) => (
                        <TableCell key={j} className="py-3">
                            <div className="h-3 rounded bg-gray-200/70 animate-pulse" style={{ width: `${55 + ((i * 3 + j * 7) % 40)}%` }} />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

const EMPTY_FORM = {
    vehicle_no: "", vehicle_model: "", year_made: "", registration_no: "", chassis_no: "",
    max_seating_capacity: "", driver_name: "", driver_license: "", driver_contact: "", note: ""
};

export default function VehiclePage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const tt = useTranslateToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);
    const [formState, setFormState] = useState({ ...EMPTY_FORM });

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [vehiclesRes, staffRes] = await Promise.all([
                api.get("/transport/vehicles"),
                api.get("/hr/staff-directory")
            ]);
            setVehicles(vehiclesRes.data.data);
            setStaffList(staffRes.data.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            tt.error("failed_to_load_data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => { setFormState({ ...EMPTY_FORM }); setIsEditing(false); setCurrentVehicle(null); };

    const handleSubmit = async () => {
        if (!formState.vehicle_no) {
            toast("error", t("vehicle_number_required"));
            return;
        }
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

    const handleDelete = async (id: number) => {
        if (!confirm(t("delete_vehicle_confirmation"))) return;
        try {
            await api.delete(`/transport/vehicles/${id}`);
            tt.success("vehicle_deleted_successfully");
            fetchData();
        } catch (error) {
            tt.error("failed_to_delete_vehicle");
        }
    };

    const filteredVehicles = vehicles.filter((v) =>
        v.vehicle_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.driver_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredVehicles.slice(startIndex, startIndex + itemsPerPage);

    const exportToExcel = () => {
        const dataToExport = vehicles.map(v => ({
            'Vehicle Number': v.vehicle_no, 'Vehicle Model': v.vehicle_model, 'Year Made': v.year_made,
            'Registration No': v.registration_no, 'Chassis No': v.chassis_no, 'Capacity': v.max_seating_capacity,
            'Driver Name': v.driver_name, 'License': v.driver_license, 'Contact': v.driver_contact
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Vehicles");
        XLSX.writeFile(wb, "transport_vehicles.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF('landscape');
        doc.text("Transport Vehicles List", 14, 15);
        autoTable(doc, {
            head: [['No', 'Model', 'Year', 'Reg No', 'Chassis', 'Capacity', 'Driver', 'License', 'Contact']],
            body: vehicles.map(v => [v.vehicle_no, v.vehicle_model, v.year_made, v.registration_no, v.chassis_no, v.max_seating_capacity, v.driver_name, v.driver_license, v.driver_contact]),
            startY: 20, styles: { fontSize: 8 }
        });
        doc.save("transport_vehicles.pdf");
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(vehicles.map(v => `${v.vehicle_no} - ${v.driver_name}`).join('\n'));
        tt.success("data_copied_to_clipboard");
    };

    const toolbarActions = [
        { Icon: Copy, onClick: copyToClipboard, title: t("copy") },
        { Icon: FileSpreadsheet, onClick: exportToExcel, title: t("excel") },
        { Icon: FileText, onClick: exportToPDF, title: t("pdf") },
        { Icon: Printer, onClick: () => window.print(), title: t("print") },
        { Icon: Columns, onClick: () => {}, title: t("columns") },
    ];

    return (
        <div className="space-y-6">
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <Bus className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{t("vehicle_list")}</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{vehicles.length} {vehicles.length === 1 ? t("vehicle").toLowerCase() : t("vehicles").toLowerCase()}</p>
                    </div>
                    <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="ml-auto h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                        <Plus className="h-4 w-4" /> {t("add")}
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                        <Input placeholder={t("search")} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="h-9 text-xs w-full md:w-64" />
                        <div className="flex items-center gap-2">
                            <Select value={itemsPerPage.toString()} onValueChange={(val) => { setItemsPerPage(parseInt(val)); setCurrentPage(1); }}>
                                <SelectTrigger className="w-[70px] h-9 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center border rounded-md p-1 bg-gray-50 text-gray-500">
                                {toolbarActions.map((action, i) => (
                                    <Button key={i} variant="ghost" size="icon" onClick={action.onClick} title={action.title} className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                        <action.Icon className="h-4 w-4" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-md border overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1200px]">
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="font-semibold text-gray-600">{t("vehicle_number")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600">{t("vehicle_model")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-center">{t("year_made")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-center">{t("reg_number")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-center">{t("chassis_number")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-center">{t("capacity")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-center">{t("driver_name")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-center">{t("driver_license")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-center">{t("driver_contact")}</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">{t("action")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <SkeletonRows rows={6} cols={TABLE_COLS} />
                                ) : paginatedData.length === 0 ? (
                                    <TableRow><TableCell colSpan={TABLE_COLS} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("no_vehicles_found")}</TableCell></TableRow>
                                ) : paginatedData.map((v) => (
                                    <TableRow key={v.id} className="text-xs hover:bg-indigo-50/40 hover:shadow-sm hover:z-10 relative transition-all duration-300 cursor-pointer whitespace-nowrap">
                                        <TableCell className="py-3 text-gray-700 font-medium">{v.vehicle_no}</TableCell>
                                        <TableCell className="py-3 text-gray-500">{v.vehicle_model}</TableCell>
                                        <TableCell className="py-3 text-center text-gray-500">{v.year_made}</TableCell>
                                        <TableCell className="py-3 text-center text-gray-500">{v.registration_no}</TableCell>
                                        <TableCell className="py-3 text-center text-gray-500">{v.chassis_no}</TableCell>
                                        <TableCell className="py-3 text-center text-gray-500">{v.max_seating_capacity}</TableCell>
                                        <TableCell className="py-3 text-center text-gray-500">{v.driver_name}</TableCell>
                                        <TableCell className="py-3 text-center text-gray-500">{v.driver_license}</TableCell>
                                        <TableCell className="py-3 text-center text-gray-500">{v.driver_contact}</TableCell>
                                        <TableCell className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button onClick={() => handleEdit(v)} size="sm" className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Pencil className="h-4 w-4" /></Button>
                                                <Button onClick={() => handleDelete(v.id)} size="sm" className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-2">
                        <div>{t("showing_x_to_y_of_z", { from: filteredVehicles.length === 0 ? 0 : startIndex + 1, to: Math.min(startIndex + itemsPerPage, filteredVehicles.length), total: filteredVehicles.length })}</div>
                        <div className="flex gap-1 items-center">
                            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button key={page} size="sm" onClick={() => setCurrentPage(page)} className={cn("h-8 w-8 p-0 rounded-[10px] text-xs font-bold shadow-sm transition-all", currentPage === page ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md" : "bg-white text-gray-600 border border-gray-200")}>{page}</Button>
                            ))}
                            <Button variant="outline" size="sm" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="h-8 w-8 p-0 rounded-[10px] bg-white border border-gray-200 text-gray-600 shadow-sm disabled:opacity-40"><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Vehicle Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl bg-white">
                    <DialogHeader className="p-6 bg-gradient-to-r from-[#FF9800] to-[#6366F1]">
                        <DialogTitle className="text-white text-xl font-bold tracking-tight">{isEditing ? t("edit_vehicle") : t("add_new_vehicle")}</DialogTitle>
                        <p className="text-indigo-100 text-xs font-medium opacity-90">{t("enter_vehicle_and_driver_info")}</p>
                    </DialogHeader>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("vehicle_no")} <span className="text-red-500">*</span></Label>
                                <Input value={formState.vehicle_no} onChange={(e) => setFormState({ ...formState, vehicle_no: e.target.value })} className="h-9 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg text-xs" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("vehicle_model")}</Label>
                                <Input value={formState.vehicle_model} onChange={(e) => setFormState({ ...formState, vehicle_model: e.target.value })} className="h-9 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg text-xs" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("year_made")}</Label>
                                <Input value={formState.year_made} onChange={(e) => setFormState({ ...formState, year_made: e.target.value })} className="h-9 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg text-xs" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("registration_no")}</Label>
                                <Input value={formState.registration_no} onChange={(e) => setFormState({ ...formState, registration_no: e.target.value })} className="h-9 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg text-xs" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("chassis_number")}</Label>
                                <Input value={formState.chassis_no} onChange={(e) => setFormState({ ...formState, chassis_no: e.target.value })} className="h-9 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg text-xs" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("max_seating_capacity")}</Label>
                                <Input value={formState.max_seating_capacity} onChange={(e) => setFormState({ ...formState, max_seating_capacity: e.target.value })} className="h-9 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg text-xs" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("driver_name")}</Label>
                                <Select value={formState.driver_name} onValueChange={(val) => {
                                    const selectedStaff = staffList.find(s => s.name === val);
                                    if (selectedStaff) {
                                        setFormState({ ...formState, driver_name: selectedStaff.name, driver_contact: selectedStaff.phone || formState.driver_contact });
                                    } else {
                                        setFormState({ ...formState, driver_name: val });
                                    }
                                }}>
                                    <SelectTrigger className="h-9 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg text-xs"><SelectValue placeholder={t("select_driver")} /></SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {staffList.filter(staff => staff.role === 'Driver').map((staff) => (
                                            <SelectItem key={staff.id} value={staff.name}>{staff.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("driver_license")}</Label>
                                <Input value={formState.driver_license} onChange={(e) => setFormState({ ...formState, driver_license: e.target.value })} className="h-9 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg text-xs" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("driver_contact")}</Label>
                                <Input value={formState.driver_contact} onChange={(e) => setFormState({ ...formState, driver_contact: e.target.value })} className="h-9 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg text-xs" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t("note")}</Label>
                            <Input value={formState.note} onChange={(e) => setFormState({ ...formState, note: e.target.value })} className="h-9 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg text-xs" />
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-gray-50/50 block sm:flex sm:justify-end gap-3 border-t border-gray-100">
                        <Button onClick={() => setIsModalOpen(false)} variant="outline" className="w-full sm:w-auto px-6 h-10 text-[11px] font-bold uppercase rounded-lg border-gray-200 hover:bg-gray-100 transition-all shadow-sm">{t("cancel")}</Button>
                        <Button onClick={handleSubmit} className="w-full sm:w-auto px-10 h-10 rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-[11px] font-bold uppercase shadow-lg active:scale-95 transition-all">{isEditing ? t("save_changes") : t("create_vehicle")}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
