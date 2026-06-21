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
    Columns,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    ArrowUpDown,
    Save,
    Bus,
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

const TABLE_COLS = 3;

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

export default function AssignVehiclePage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [routes, setRoutes] = useState<any[]>([]);
    const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<RouteAssignment[]>([]);

    const [selectedRouteId, setSelectedRouteId] = useState("");
    const [selectedVehicleIds, setSelectedVehicleIds] = useState<number[]>([]);
    const [isEditing, setIsEditing] = useState(false);

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
        setSelectedVehicleIds(prev => prev.includes(vehicleId) ? prev.filter(v => v !== vehicleId) : [...prev, vehicleId]);
    };

    const resetForm = () => { setIsEditing(false); setSelectedRouteId(""); setSelectedVehicleIds([]); };

    const handleSave = async () => {
        if (!selectedRouteId || selectedVehicleIds.length === 0) {
            toast("error", "Please select route and at least one vehicle");
            return;
        }
        setLoading(true);
        try {
            await api.post("/transport/route-vehicles", { route_id: selectedRouteId, vehicle_ids: selectedVehicleIds });
            toast("success", isEditing ? "Assignment updated successfully" : "Vehicles assigned successfully");
            resetForm();
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
    const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedAssignments = filteredAssignments.slice(startIndex, startIndex + itemsPerPage);

    const exportToExcel = () => {
        const data = filteredAssignments.map(a => ({ Route: a.title, Vehicles: a.vehicles.map(v => v.vehicle_no).join(', ') }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Vehicle Assignments");
        XLSX.writeFile(wb, "vehicle_assignments.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Vehicle Route Assignments", 14, 15);
        autoTable(doc, { head: [['Route', 'Assigned Vehicles']], body: filteredAssignments.map(a => [a.title, a.vehicles.map(v => v.vehicle_no).join(', ')]), startY: 20 });
        doc.save("vehicle_assignments.pdf");
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(filteredAssignments.map(a => `${a.title}\t${a.vehicles.map(v => v.vehicle_no).join(', ')}`).join('\n'));
        toast("success", "Data copied to clipboard");
    };

    const toolbarActions = [
        { Icon: Copy, onClick: copyToClipboard, title: "Copy" },
        { Icon: FileSpreadsheet, onClick: exportToExcel, title: "Excel" },
        { Icon: FileText, onClick: exportToPDF, title: "PDF" },
        { Icon: Printer, onClick: () => window.print(), title: "Print" },
        { Icon: Columns, onClick: () => {}, title: "Columns" },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Form */}
                <Card className="h-fit border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Bus className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{isEditing ? "Update Assignment" : "Assign Vehicle On Route"}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">Map vehicles to a route</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">Route <span className="text-red-500">*</span></Label>
                            <Select value={selectedRouteId} onValueChange={setSelectedRouteId} disabled={isEditing}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select Route" /></SelectTrigger>
                                <SelectContent>{routes.map((r) => <SelectItem key={r.id} value={r.id.toString()}>{r.title}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-xs font-semibold text-gray-600">Vehicle <span className="text-red-500">*</span></Label>
                            <div className="space-y-2.5 ml-1 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                {availableVehicles.map((v) => (
                                    <div key={v.id} className="flex items-center space-x-2.5 group cursor-pointer">
                                        <Checkbox id={`v-${v.id}`} checked={selectedVehicleIds.includes(v.id)} onCheckedChange={() => toggleVehicle(v.id)} className="h-3.5 w-3.5 border-gray-300 accent-indigo-500 rounded-sm" />
                                        <Label htmlFor={`v-${v.id}`} className="text-[11px] text-gray-600 font-medium cursor-pointer group-hover:text-indigo-600 transition-colors">{v.vehicle_no}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            {isEditing && <Button variant="outline" onClick={resetForm} className="h-9 px-6 rounded-full text-xs font-bold">Cancel</Button>}
                            <Button disabled={loading} onClick={handleSave} className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                                <Save className="h-4 w-4" /> {loading ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Right: List */}
                <Card className="lg:col-span-2 border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <Bus className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Vehicle Route List</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{filteredAssignments.length} assignment{filteredAssignments.length === 1 ? "" : "s"}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                            <Input placeholder="Search..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="h-9 text-xs w-full md:w-64" />
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
                            <Table className="min-w-[600px]">
                                <TableHeader className="bg-gray-50 text-xs uppercase">
                                    <TableRow className="hover:bg-transparent whitespace-nowrap">
                                        <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">Route <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                        <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">Vehicle <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                        <TableHead className="font-semibold text-gray-600 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fetching ? (
                                        <SkeletonRows rows={6} cols={TABLE_COLS} />
                                    ) : paginatedAssignments.length === 0 ? (
                                        <TableRow><TableCell colSpan={TABLE_COLS} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">No assignments found</TableCell></TableRow>
                                    ) : paginatedAssignments.map((assignment) => (
                                        <TableRow key={assignment.id} className="text-xs hover:bg-gray-50/60 transition-colors">
                                            <TableCell className="py-3 text-gray-700 font-medium">{assignment.title}</TableCell>
                                            <TableCell className="py-3 text-gray-500 italic">{assignment.vehicles.map(v => v.vehicle_no).join(", ")}</TableCell>
                                            <TableCell className="py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button onClick={() => handleEdit(assignment)} size="sm" title="Edit" className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Pencil className="h-4 w-4" /></Button>
                                                    <Button onClick={() => handleDelete(assignment.id)} size="sm" title="Delete" className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-2">
                            <div>Showing {filteredAssignments.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAssignments.length)} of {filteredAssignments.length} entries</div>
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
            </div>
        </div>
    );
}
