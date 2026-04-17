"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    ArrowUpDown,
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
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RouteAssignment {
    id: number;
    title: string;
    vehicles: { id: number; vehicle_no: string }[];
}

export default function AssignVehiclePage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [routes, setRoutes] = useState<any[]>([]);
    const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<RouteAssignment[]>([]);

    // Form State
    const [selectedRouteId, setSelectedRouteId] = useState("");
    const [selectedVehicleIds, setSelectedVehicleIds] = useState<number[]>([]);
    const [isEditing, setIsEditing] = useState(false);

    // Pagination
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
            setRoutes(routesRes.data.data);
            setAvailableVehicles(vehiclesRes.data.data);
            setAssignments(assignmentsRes.data.data.filter((r: any) => r.vehicles && r.vehicles.length > 0));
        } catch (error) {
            toast("error", "Failed to load mapping data");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleVehicle = (vehicleId: number) => {
        setSelectedVehicleIds(prev =>
            prev.includes(vehicleId) ? prev.filter(v => v !== vehicleId) : [...prev, vehicleId]
        );
    };

    const handleSave = async () => {
        if (!selectedRouteId || selectedVehicleIds.length === 0) {
            toast("error", "Please select route and at least one vehicle");
            return;
        }

        setLoading(true);
        try {
            await api.post("/transport/route-vehicles", {
                route_id: selectedRouteId,
                vehicle_ids: selectedVehicleIds
            });
            toast("success", isEditing ? "Assignment updated successfully" : "Vehicles assigned successfully");
            setIsEditing(false);
            setSelectedRouteId("");
            setSelectedVehicleIds([]);
            fetchData();
        } catch (error) {
            toast("error", "Failed to save assignment");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (assignment: RouteAssignment) => {
        setSelectedRouteId(assignment.id.toString());
        setSelectedVehicleIds(assignment.vehicles.map(v => v.id));
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (routeId: number) => {
        if (!confirm("Are you sure you want to remove all vehicle assignments for this route?")) return;
        try {
            await api.delete(`/transport/route-vehicles/${routeId}`);
            toast("success", "Assignments removed successfully");
            fetchData();
        } catch (error) {
            toast("error", "Failed to remove assignments");
        }
    };

    const filteredAssignments = assignments.filter((a) =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.vehicles.some(v => v.vehicle_no.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedAssignments = filteredAssignments.slice(startIndex, startIndex + itemsPerPage);

    // Export Functions
    const exportToExcel = () => {
        const data = filteredAssignments.map(a => ({
            Route: a.title,
            Vehicles: a.vehicles.map(v => v.vehicle_no).join(', ')
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
            head: [['Route', 'Assigned Vehicles']],
            body: filteredAssignments.map(a => [a.title, a.vehicles.map(v => v.vehicle_no).join(', ')]),
            startY: 20
        });
        doc.save("vehicle_assignments.pdf");
    };

    const copyToClipboard = () => {
        const text = filteredAssignments.map(a => `${a.title}\t${a.vehicles.map(v => v.vehicle_no).join(', ')}`).join('\n');
        navigator.clipboard.writeText(text);
        toast("success", "Data copied to clipboard");
    };

    if (fetching) return <div className="p-8 text-center text-gray-400 italic">Loading mapping data...</div>;

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Section: Assign Vehicle On Route Form */}
                <div className="w-full lg:w-1/3 xl:w-1/4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden sticky top-4">
                        <div className="p-4 border-b border-gray-100">
                            <h2 className="text-sm font-medium text-gray-800 tracking-tight">
                                {isEditing ? "Update Vehicle Assignment" : "Assign Vehicle On Route"}
                            </h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    Route <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Select value={selectedRouteId} onValueChange={setSelectedRouteId} disabled={isEditing}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] focus:ring-indigo-500 rounded shadow-none">
                                        <SelectValue placeholder="Select Route" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {routes.map((r) => (
                                            <SelectItem key={r.id} value={r.id.toString()}>{r.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    Vehicle <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <div className="space-y-2.5 ml-1 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                    {availableVehicles.map((v) => (
                                        <div key={v.id} className="flex items-center space-x-2.5 group cursor-pointer">
                                            <Checkbox
                                                id={`v-${v.id}`}
                                                checked={selectedVehicleIds.includes(v.id)}
                                                onCheckedChange={() => toggleVehicle(v.id)}
                                                className="h-3.5 w-3.5 border-gray-300 accent-indigo-500 rounded-sm"
                                            />
                                            <Label htmlFor={`v-${v.id}`} className="text-[11px] text-gray-600 font-medium cursor-pointer group-hover:text-indigo-600 transition-colors">
                                                {v.vehicle_no}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                {isEditing && (
                                    <Button
                                        variant="outline"
                                        onClick={() => { setIsEditing(false); setSelectedRouteId(""); setSelectedVehicleIds([]); }}
                                        className="h-8 text-[11px] font-bold uppercase rounded shadow-sm px-6"
                                    >
                                        Cancel
                                    </Button>
                                )}
                                <Button
                                    disabled={loading}
                                    onClick={handleSave}
                                    variant="gradient"
                                    className="px-8 h-10 text-[11px] font-bold uppercase transition-all rounded-full shadow-lg min-w-[120px]"
                                >
                                    {loading ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Vehicle Route List */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                        <h2 className="text-sm font-medium text-gray-800 tracking-tight">Vehicle Route List</h2>

                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50 pb-4">
                            <div className="relative w-full md:w-64">
                                <Input
                                    placeholder="Search"
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 mr-2">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{itemsPerPage}</span>
                                    <Select value={itemsPerPage.toString()} onValueChange={(val) => { setItemsPerPage(parseInt(val)); setCurrentPage(1); }}>
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
                                    <Button onClick={copyToClipboard} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button onClick={exportToExcel} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button onClick={exportToPDF} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                        <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button onClick={() => window.print()} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
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
                            <Table className="min-w-[600px]">
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Route <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Vehicle <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedAssignments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-10 text-gray-400 italic">No assignments found</TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedAssignments.map((assignment) => (
                                            <TableRow key={assignment.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                                                <TableCell className="py-3 text-gray-700 font-medium">{assignment.title}</TableCell>
                                                <TableCell className="py-3 text-gray-500 leading-relaxed italic font-medium">
                                                    {assignment.vehicles.map(v => v.vehicle_no).join(", ")}
                                                </TableCell>
                                                <TableCell className="py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button onClick={() => handleEdit(assignment)} size="icon" variant="ghost" title="Edit" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                            <Pencil className="h-3 w-3" />
                                                        </Button>
                                                        <Button onClick={() => handleDelete(assignment.id)} size="icon" variant="ghost" title="Delete" className="h-6 w-6 bg-red-500 hover:bg-red-600 text-white rounded shadow-sm">
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

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium pt-4 border-t border-gray-100">
                                <div>
                                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAssignments.length)} of {filteredAssignments.length} entries
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
            </div>
        </div>
    );
}
