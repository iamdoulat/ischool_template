"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
    Search,
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
    Eye,
    ArrowUpDown,
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

export default function VehiclePage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);
    const [formState, setFormState] = useState({
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
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get("/transport/vehicles");
            setVehicles(response.data.data);
        } catch (error) {
            console.error("Error fetching vehicles:", error);
            toast("error", "Failed to load vehicles");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async () => {
        if (!formState.vehicle_no) {
            toast("error", "Vehicle number is required");
            return;
        }

        try {
            if (isEditing && currentVehicle) {
                await api.put(`/transport/vehicles/${currentVehicle.id}`, formState);
                toast("success", "Vehicle updated successfully");
            } else {
                await api.post("/transport/vehicles", formState);
                toast("success", "Vehicle created successfully");
            }
            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            toast("error", error.response?.data?.message || "Failed to save vehicle");
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
        if (!confirm("Are you sure you want to delete this vehicle?")) return;
        try {
            await api.delete(`/transport/vehicles/${id}`);
            toast("success", "Vehicle deleted successfully");
            fetchData();
        } catch (error) {
            toast("error", "Failed to delete vehicle");
        }
    };

    const resetForm = () => {
        setFormState({
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
        });
        setIsEditing(false);
        setCurrentVehicle(null);
    };

    const filteredVehicles = vehicles.filter((v) =>
        v.vehicle_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.driver_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredVehicles.slice(startIndex, startIndex + itemsPerPage);

    // Export Functions
    const exportToExcel = () => {
        const dataToExport = vehicles.map(v => ({
            'Vehicle Number': v.vehicle_no,
            'Vehicle Model': v.vehicle_model,
            'Year Made': v.year_made,
            'Registration No': v.registration_no,
            'Chassis No': v.chassis_no,
            'Capacity': v.max_seating_capacity,
            'Driver Name': v.driver_name,
            'License': v.driver_license,
            'Contact': v.driver_contact
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
            body: vehicles.map(v => [
                v.vehicle_no, v.vehicle_model, v.year_made, v.registration_no,
                v.chassis_no, v.max_seating_capacity, v.driver_name, v.driver_license, v.driver_contact
            ]),
            startY: 20,
            styles: { fontSize: 8 }
        });
        doc.save("transport_vehicles.pdf");
    };

    const copyToClipboard = () => {
        const text = vehicles.map(v => `${v.vehicle_no} - ${v.driver_name}`).join('\n');
        navigator.clipboard.writeText(text);
        toast("success", "Data copied to clipboard");
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-sm font-medium text-gray-800 tracking-tight">Vehicle List</h2>
                    <Button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        variant="gradient"
                        className="px-4 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-sm flex items-center gap-1.5"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                    </Button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{itemsPerPage}</span>
                                <Select
                                    value={itemsPerPage.toString()}
                                    onValueChange={(val) => {
                                        setItemsPerPage(parseInt(val));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <SelectTrigger className="h-7 w-14 text-[10px] border-none bg-gray-50 hover:bg-gray-100 transition-colors shadow-none rounded-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded" onClick={copyToClipboard}>
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded" onClick={exportToExcel}>
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded" onClick={exportToPDF}>
                                    <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded" onClick={() => window.print()}>
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                    <Columns className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1200px]">
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Vehicle Number</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Vehicle Model</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">Year Made</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">Reg Number</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">Chassis Number</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">Capacity</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">Driver Name</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">Driver License</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-center">Driver Contact</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center py-10 text-gray-400 italic">Loading vehicles...</TableCell>
                                    </TableRow>
                                ) : paginatedData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center py-10 text-gray-400 italic">No vehicles found</TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedData.map((v) => (
                                        <TableRow key={v.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap font-medium">
                                            <TableCell className="py-3 text-gray-700">{v.vehicle_no}</TableCell>
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
                                                    <Button onClick={() => handleEdit(v)} size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded">
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                    <Button onClick={() => handleDelete(v.id)} size="icon" variant="ghost" className="h-6 w-6 bg-red-500 hover:bg-red-600 text-white rounded">
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination UI */}
                    <div className="flex justify-center items-center gap-2 py-4 border-t border-gray-50">
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className="h-8 w-8 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-30"
                        >
                            <ChevronLeft className="h-4 w-4 text-gray-600" />
                        </Button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                variant={currentPage === page ? "gradient" : "outline"}
                                onClick={() => setCurrentPage(page)}
                                className={cn(
                                    "h-8 w-8 rounded-xl text-[10px] font-bold p-0 transition-all",
                                    currentPage === page ? "shadow-md scale-105" : "border-gray-100 text-gray-400 hover:text-indigo-600"
                                )}
                            >
                                {page}
                            </Button>
                        ))}

                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            className="h-8 w-8 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-30"
                        >
                            <ChevronRight className="h-4 w-4 text-gray-600" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Vehicle Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl bg-white">
                    <DialogHeader className="p-6 bg-gradient-to-r from-indigo-600 to-violet-600">
                        <DialogTitle className="text-white text-xl font-bold tracking-tight">
                            {isEditing ? "Edit Vehicle" : "Add New Vehicle"}
                        </DialogTitle>
                        <p className="text-indigo-100 text-xs font-medium opacity-90">Enter the vehicle and driver information below.</p>
                    </DialogHeader>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Vehicle No <span className="text-red-500">*</span></Label>
                                <Input
                                    value={formState.vehicle_no}
                                    onChange={(e) => setFormState({ ...formState, vehicle_no: e.target.value })}
                                    className="h-9 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg text-xs"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Vehicle Model</Label>
                                <Input
                                    value={formState.vehicle_model}
                                    onChange={(e) => setFormState({ ...formState, vehicle_model: e.target.value })}
                                    className="h-9 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg text-xs"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Year Made</Label>
                                <Input
                                    value={formState.year_made}
                                    onChange={(e) => setFormState({ ...formState, year_made: e.target.value })}
                                    className="h-9 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg text-xs"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Registration No</Label>
                                <Input
                                    value={formState.registration_no}
                                    onChange={(e) => setFormState({ ...formState, registration_no: e.target.value })}
                                    className="h-9 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg text-xs"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Chassis Number</Label>
                                <Input
                                    value={formState.chassis_no}
                                    onChange={(e) => setFormState({ ...formState, chassis_no: e.target.value })}
                                    className="h-9 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg text-xs"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Max Seating Capacity</Label>
                                <Input
                                    value={formState.max_seating_capacity}
                                    onChange={(e) => setFormState({ ...formState, max_seating_capacity: e.target.value })}
                                    className="h-9 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg text-xs"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Driver Name</Label>
                                <Input
                                    value={formState.driver_name}
                                    onChange={(e) => setFormState({ ...formState, driver_name: e.target.value })}
                                    className="h-9 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg text-xs"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Driver License</Label>
                                <Input
                                    value={formState.driver_license}
                                    onChange={(e) => setFormState({ ...formState, driver_license: e.target.value })}
                                    className="h-9 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg text-xs"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Driver Contact</Label>
                                <Input
                                    value={formState.driver_contact}
                                    onChange={(e) => setFormState({ ...formState, driver_contact: e.target.value })}
                                    className="h-9 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg text-xs"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Note</Label>
                            <Input
                                value={formState.note}
                                onChange={(e) => setFormState({ ...formState, note: e.target.value })}
                                className="h-9 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-lg text-xs"
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-gray-50/50 block sm:flex sm:justify-end gap-3 border-t border-gray-100">
                        <Button
                            onClick={() => setIsModalOpen(false)}
                            variant="outline"
                            className="w-full sm:w-auto px-6 h-10 text-[11px] font-bold uppercase rounded-xl border-gray-200 hover:bg-gray-100 transition-all shadow-sm"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            variant="gradient"
                            className="w-full sm:w-auto px-10 h-10 text-[11px] font-bold uppercase transition-all rounded-xl shadow-lg hover:shadow-indigo-200"
                        >
                            {isEditing ? "Save Changes" : "Create Vehicle"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
