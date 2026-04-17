"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    Eye,
    ArrowUpDown,
    Save,
    X,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Stop {
    id: number;
    route_id: number;
    pickup_point_id: number;
    monthly_fees: string;
    distance: string;
    pickup_time: string;
    pickup_point?: {
        name: string;
    };
}

interface RouteMapping {
    id: number;
    title: string;
    pickup_points: Stop[];
}

export default function RoutePickupPointPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [mappings, setMappings] = useState<RouteMapping[]>([]);
    const [loading, setLoading] = useState(true);
    const [routes, setRoutes] = useState<any[]>([]);
    const [pickupPoints, setPickupPoints] = useState<any[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMapping, setEditingMapping] = useState<any>(null);
    const [formState, setFormState] = useState({
        route_id: "",
        pickup_point_id: "",
        monthly_fees: "",
        distance: "",
        pickup_time: "",
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [mappingsRes, routesRes, pointsRes] = await Promise.all([
                api.get("/transport/route-pickup-points"),
                api.get("/transport/routes"),
                api.get("/transport/pickup-points"),
            ]);
            setMappings(mappingsRes.data.data);
            setRoutes(routesRes.data.data);
            setPickupPoints(pointsRes.data.data);
        } catch (error) {
            console.error("Error fetching transport data:", error);
            toast("error", "Failed to load transport data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async () => {
        if (!formState.route_id || !formState.pickup_point_id || !formState.monthly_fees) {
            toast("error", "Please fill in required fields");
            return;
        }

        try {
            if (isEditModalOpen && editingMapping) {
                await api.put(`/transport/route-pickup-points/${editingMapping.id}`, formState);
                toast("success", "Mapping updated successfully");
            } else {
                await api.post("/transport/route-pickup-points", formState);
                toast("success", "Mapping added successfully");
            }
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            setFormState({
                route_id: "",
                pickup_point_id: "",
                monthly_fees: "",
                distance: "",
                pickup_time: "",
            });
            fetchData();
        } catch (error: any) {
            toast("error", error.response?.data?.message || "Failed to save mapping");
        }
    };

    const handleEdit = (mapping: any, stop: any) => {
        setEditingMapping(stop);
        setFormState({
            route_id: mapping.id.toString(),
            pickup_point_id: stop.pickup_point_id.toString(),
            monthly_fees: stop.monthly_fees.toString(),
            distance: stop.distance?.toString() || "",
            pickup_time: stop.pickup_time || "",
        });
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this mapping?")) return;
        try {
            await api.delete(`/transport/route-pickup-points/${id}`);
            toast("success", "Mapping deleted successfully");
            fetchData();
        } catch (error) {
            toast("error", "Failed to delete mapping");
        }
    };

    const allFilteredData = mappings.filter((item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(allFilteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = allFilteredData.slice(startIndex, startIndex + itemsPerPage);

    // Export Functions
    const exportToExcel = () => {
        const dataToExport = mappings.flatMap(route =>
            route.pickup_points.map((stop, index) => ({
                'Route': route.title,
                'Pickup Point': stop.pickup_point?.name || `Point ${index + 1}`,
                'Monthly Fees': stop.monthly_fees,
                'Distance (km)': stop.distance,
                'Pickup Time': stop.pickup_time
            }))
        );
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Route Mappings");
        XLSX.writeFile(wb, "route_pickup_points.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Route Pickup Point Mappings", 14, 15);
        const tableData = mappings.flatMap(route =>
            route.pickup_points.map((stop, index) => [
                route.title,
                stop.pickup_point?.name || `Point ${index + 1}`,
                stop.monthly_fees,
                stop.distance,
                stop.pickup_time
            ])
        );
        autoTable(doc, {
            head: [['Route', 'Pickup Point', 'Monthly Fees', 'Distance (km)', 'Pickup Time']],
            body: tableData,
            startY: 20,
        });
        doc.save("route_pickup_points.pdf");
    };

    const copyToClipboard = () => {
        const text = mappings.flatMap(route =>
            route.pickup_points.map((stop, index) =>
                `${route.title}\t${stop.pickup_point?.name}\t${stop.monthly_fees}\t${stop.distance}\t${stop.pickup_time}`
            )
        ).join('\n');
        navigator.clipboard.writeText(text);
        toast("success", "Data copied to clipboard");
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-sm font-medium text-gray-800 tracking-tight">Route Pickup Point</h2>
                    <Button
                        onClick={() => {
                            setFormState({ route_id: "", pickup_point_id: "", monthly_fees: "", distance: "", pickup_time: "" });
                            setIsAddModalOpen(true);
                        }}
                        variant="gradient"
                        className="px-6 h-9 text-[11px] font-bold uppercase transition-all rounded-full shadow-lg flex items-center gap-1.5"
                    >
                        <Plus className="h-4 w-4" />
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
                                        <SelectItem value="100">100</SelectItem>
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
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Route</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Pickup Point</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Monthly Fees (₹)</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Distance (km)</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Pickup Time</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-gray-400">Loading mappings...</TableCell>
                                    </TableRow>
                                ) : allFilteredData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-gray-400">No mappings found</TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedData.map((item) => (
                                        <TableRow key={item.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors align-top">
                                            <TableCell className="py-4 text-gray-700 font-medium">{item.title}</TableCell>
                                            <TableCell className="py-4">
                                                <div className="space-y-1">
                                                    {item.pickup_points.map((stop, i) => (
                                                        <div key={i} className="flex items-center gap-2">
                                                            <span className="text-gray-400 font-bold w-4">{i + 1}</span>
                                                            <span className="text-gray-600 font-medium">{stop.pickup_point?.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="space-y-1">
                                                    {item.pickup_points.map((stop, i) => (
                                                        <div key={i} className="flex items-center h-4 text-gray-600">{stop.monthly_fees}</div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="space-y-1">
                                                    {item.pickup_points.map((stop, i) => (
                                                        <div key={i} className="flex items-center h-4 text-gray-600">{stop.distance || '-'}</div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="space-y-1">
                                                    {item.pickup_points.map((stop, i) => (
                                                        <div key={i} className="flex items-center h-4 text-gray-600">{stop.pickup_time || '-'}</div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 text-right">
                                                <div className="space-y-1">
                                                    {item.pickup_points.map((stop, i) => (
                                                        <div key={i} className="flex items-center justify-end gap-1">
                                                            <Button onClick={() => handleEdit(item, stop)} size="icon" variant="ghost" className="h-5 w-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded">
                                                                <Pencil className="h-2.5 w-2.5" />
                                                            </Button>
                                                            <Button onClick={() => handleDelete(stop.id)} size="icon" variant="ghost" className="h-5 w-5 bg-red-500 hover:bg-red-600 text-white rounded">
                                                                <Trash2 className="h-2.5 w-2.5" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium pt-4 border-t border-gray-100">
                            <div>
                                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, allFilteredData.length)} of {allFilteredData.length} entries
                            </div>
                            <div className="flex gap-1.5 items-center">
                                <Button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-30"
                                >
                                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                                </Button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? "gradient" : "ghost"}
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                            "h-9 w-9 rounded-xl text-[12px] font-bold p-0 transition-all shadow-sm",
                                            currentPage === page ? "scale-105 border-0" : "border border-gray-50 text-gray-400 hover:text-indigo-600"
                                        )}
                                    >
                                        {page}
                                    </Button>
                                ))}

                                <Button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-30"
                                >
                                    <ChevronRight className="h-5 w-5 text-gray-600" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if (!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); } }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{isEditModalOpen ? "Edit Mapping" : "Add Route Mapping"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="route">Route <span className="text-red-500">*</span></Label>
                            <Select
                                value={formState.route_id}
                                onValueChange={(val) => setFormState({ ...formState, route_id: val })}
                            >
                                <SelectTrigger className="h-8 text-[11px]">
                                    <SelectValue placeholder="Select Route" />
                                </SelectTrigger>
                                <SelectContent>
                                    {routes.map((r) => (
                                        <SelectItem key={r.id} value={r.id.toString()}>{r.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="point">Pickup Point <span className="text-red-500">*</span></Label>
                            <Select
                                value={formState.pickup_point_id}
                                onValueChange={(val) => setFormState({ ...formState, pickup_point_id: val })}
                            >
                                <SelectTrigger className="h-8 text-[11px]">
                                    <SelectValue placeholder="Select Point" />
                                </SelectTrigger>
                                <SelectContent>
                                    {pickupPoints.map((p) => (
                                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="fees">Monthly Fees <span className="text-red-500">*</span></Label>
                            <Input
                                id="fees"
                                type="number"
                                value={formState.monthly_fees}
                                onChange={(e) => setFormState({ ...formState, monthly_fees: e.target.value })}
                                className="h-8 text-[11px]"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="distance">Distance (km)</Label>
                            <Input
                                id="distance"
                                type="number"
                                value={formState.distance}
                                onChange={(e) => setFormState({ ...formState, distance: e.target.value })}
                                className="h-8 text-[11px]"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="time">Pickup Time</Label>
                            <Input
                                id="time"
                                value={formState.pickup_time}
                                onChange={(e) => setFormState({ ...formState, pickup_time: e.target.value })}
                                className="h-8 text-[11px]"
                                placeholder="e.g. 9:00 AM"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-3 pt-2">
                        <Button
                            variant="gradient"
                            onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                            className="h-10 px-8 text-[11px] font-bold uppercase rounded-full shadow-lg opacity-80 hover:opacity-100"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="gradient"
                            onClick={handleSubmit}
                            className="h-10 px-8 text-[11px] font-bold uppercase rounded-full shadow-lg"
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
