/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    MapPinned,
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
import { useSettings } from "@/components/providers/settings-provider";

interface Stop {
    id: number;
    name: string;
    pivot: {
        id: number;
        route_id: number;
        pickup_point_id: number;
        monthly_fees: string;
        distance: string;
        pickup_time: string;
    };
}

interface RouteMapping {
    id: number;
    title: string;
    pickup_points: Stop[];
}

const TABLE_COLS = 6;

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

const EMPTY_FORM = { route_id: "", pickup_point_id: "", monthly_fees: "", distance: "", pickup_time: "" };

export default function RoutePickupPointPage() {
    const { toast } = useToast();
    const { settings } = useSettings();
    const [currencySymbol, setCurrencySymbol] = useState("₹");
    const [searchTerm, setSearchTerm] = useState("");
    const [mappings, setMappings] = useState<RouteMapping[]>([]);
    const [loading, setLoading] = useState(true);
    const [routes, setRoutes] = useState<any[]>([]);
    const [pickupPoints, setPickupPoints] = useState<any[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMapping, setEditingMapping] = useState<any>(null);
    const [formState, setFormState] = useState({ ...EMPTY_FORM });

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [mappingsRes, routesRes, pointsRes, currenciesRes] = await Promise.all([
                api.get("/transport/route-pickup-points"),
                api.get("/transport/routes"),
                api.get("/transport/pickup-points"),
                api.get("/system-setting/currencies"),
            ]);
            setMappings(mappingsRes.data.data);
            setRoutes(routesRes.data.data);
            setPickupPoints(pointsRes.data.data);
            const activeCurrency = currenciesRes.data.data?.find((c: any) => c.is_active);
            if (activeCurrency) {
                setCurrencySymbol(activeCurrency.symbol);
            } else if (settings?.currency_format) {
                setCurrencySymbol(settings.currency_format);
            }
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
            setFormState({ ...EMPTY_FORM });
            fetchData();
        } catch (error: any) {
            toast("error", error.response?.data?.message || "Failed to save mapping");
        }
    };

    const handleEdit = (mapping: any, stop: Stop) => {
        setEditingMapping(stop.pivot);
        setFormState({
            route_id: mapping.id.toString(),
            pickup_point_id: stop.id.toString(),
            monthly_fees: stop.pivot.monthly_fees?.toString() || "",
            distance: stop.pivot.distance?.toString() || "",
            pickup_time: stop.pivot.pickup_time || "",
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

    const allFilteredData = mappings.filter((item) => item.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const totalPages = Math.ceil(allFilteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = allFilteredData.slice(startIndex, startIndex + itemsPerPage);

    const exportToExcel = () => {
        const dataToExport = mappings.flatMap(route => route.pickup_points.map((stop) => ({
            'Route': route.title, 'Pickup Point': stop.name, 'Monthly Fees': stop.pivot.monthly_fees,
            'Distance (km)': stop.pivot.distance, 'Pickup Time': stop.pivot.pickup_time
        })));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Route Mappings");
        XLSX.writeFile(wb, "route_pickup_points.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Route Pickup Point Mappings", 14, 15);
        const tableData = mappings.flatMap(route => route.pickup_points.map((stop) => [route.title, stop.name, stop.pivot.monthly_fees, stop.pivot.distance, stop.pivot.pickup_time]));
        autoTable(doc, { head: [['Route', 'Pickup Point', 'Monthly Fees', 'Distance (km)', 'Pickup Time']], body: tableData, startY: 20 });
        doc.save("route_pickup_points.pdf");
    };

    const copyToClipboard = () => {
        const text = mappings.flatMap(route => route.pickup_points.map((stop) => `${route.title}\t${stop.name}\t${stop.pivot.monthly_fees}\t${stop.pivot.distance}\t${stop.pivot.pickup_time}`)).join('\n');
        navigator.clipboard.writeText(text);
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
            <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                        <MapPinned className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Route Pickup Point</CardTitle>
                        <p className="text-[11px] text-gray-500 mt-1">{allFilteredData.length} route{allFilteredData.length === 1 ? "" : "s"} mapped</p>
                    </div>
                    <Button onClick={() => { setFormState({ ...EMPTY_FORM }); setIsAddModalOpen(true); }} className="ml-auto h-9 px-5 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                        <Plus className="h-4 w-4" /> Add
                    </Button>
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
                                    <SelectItem value="100">100</SelectItem>
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
                        <Table className="min-w-[1100px]">
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow className="hover:bg-transparent whitespace-nowrap">
                                    <TableHead className="font-semibold text-gray-600">Route</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Pickup Point</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Monthly Fees ({currencySymbol})</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Distance (km)</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Pickup Time</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <SkeletonRows rows={6} cols={TABLE_COLS} />
                                ) : allFilteredData.length === 0 ? (
                                    <TableRow><TableCell colSpan={TABLE_COLS} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">No mappings found</TableCell></TableRow>
                                ) : paginatedData.map((item) => (
                                    <TableRow key={item.id} className="text-xs hover:bg-gray-50/60 transition-colors align-top">
                                        <TableCell className="py-4 text-gray-700 font-medium">{item.title}</TableCell>
                                        <TableCell className="py-4">
                                            <div className="space-y-1">{item.pickup_points.map((stop, i) => (<div key={i} className="text-gray-600 font-medium">{stop.name}</div>))}</div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="space-y-1">{item.pickup_points.map((stop, i) => (<div key={i} className="flex items-center h-4 text-gray-600">{stop.pivot.monthly_fees}</div>))}</div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="space-y-1">{item.pickup_points.map((stop, i) => (<div key={i} className="flex items-center h-4 text-gray-600">{stop.pivot.distance || '-'}</div>))}</div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="space-y-1">{item.pickup_points.map((stop, i) => (<div key={i} className="flex items-center h-4 text-gray-600">{stop.pivot.pickup_time || '-'}</div>))}</div>
                                        </TableCell>
                                        <TableCell className="py-4 text-right">
                                            <div className="space-y-1">{item.pickup_points.map((stop, i) => (
                                                <div key={i} className="flex items-center justify-end gap-1">
                                                    <Button onClick={() => handleEdit(item, stop)} size="sm" className="h-6 w-6 bg-amber-500 hover:bg-amber-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Pencil className="h-3 w-3" /></Button>
                                                    <Button onClick={() => handleDelete(stop.pivot.id)} size="sm" className="h-6 w-6 bg-red-500 hover:bg-red-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Trash2 className="h-3 w-3" /></Button>
                                                </div>
                                            ))}</div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-2">
                        <div>Showing {allFilteredData.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, allFilteredData.length)} of {allFilteredData.length} entries</div>
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

            {/* Add/Edit Modal */}
            <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if (!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); } }}>
                <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none shadow-2xl bg-white">
                    <DialogHeader className="p-6 bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-left">
                        <DialogTitle className="text-white text-xl font-bold tracking-tight">{isEditModalOpen ? "Edit Mapping" : "Add Route Mapping"}</DialogTitle>
                        <p className="text-indigo-100 text-xs font-medium opacity-90">Assign pickup points to routes and set fees.</p>
                    </DialogHeader>
                    <div className="p-6 space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="route">Route <span className="text-red-500">*</span></Label>
                            <Select value={formState.route_id} onValueChange={(val) => setFormState({ ...formState, route_id: val })}>
                                <SelectTrigger className="h-8 text-[11px]"><SelectValue placeholder="Select Route" /></SelectTrigger>
                                <SelectContent>{routes.map((r) => <SelectItem key={r.id} value={r.id.toString()}>{r.title}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="point">Pickup Point <span className="text-red-500">*</span></Label>
                            <Select value={formState.pickup_point_id} onValueChange={(val) => setFormState({ ...formState, pickup_point_id: val })}>
                                <SelectTrigger className="h-8 text-[11px]"><SelectValue placeholder="Select Point" /></SelectTrigger>
                                <SelectContent>{pickupPoints.map((p) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="fees">Monthly Fees <span className="text-red-500">*</span></Label>
                            <Input id="fees" type="number" value={formState.monthly_fees} onChange={(e) => setFormState({ ...formState, monthly_fees: e.target.value })} className="h-8 text-[11px]" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="distance">Distance (km)</Label>
                            <Input id="distance" type="number" value={formState.distance} onChange={(e) => setFormState({ ...formState, distance: e.target.value })} className="h-8 text-[11px]" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="time">Pickup Time</Label>
                            <Input id="time" value={formState.pickup_time} onChange={(e) => setFormState({ ...formState, pickup_time: e.target.value })} className="h-8 text-[11px]" placeholder="e.g. 9:00 AM" />
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-gray-50/50 block sm:flex sm:justify-end gap-3 border-t border-gray-100">
                        <Button variant="outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="w-full sm:w-auto h-10 px-6 text-[11px] font-bold uppercase rounded-lg border-gray-200 hover:bg-gray-100 transition-all shadow-sm">Cancel</Button>
                        <Button onClick={handleSubmit} className="w-full sm:w-auto h-10 px-8 rounded-lg bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-[11px] font-bold uppercase shadow-lg active:scale-95 transition-all">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
