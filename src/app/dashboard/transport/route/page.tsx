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
    Columns,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Trash2,
    ArrowUpDown,
    Save,
    Route as RouteIcon,
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

interface Route {
    id: number;
    title: string;
    description?: string;
}

const TABLE_COLS = 2;

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

export default function RoutePage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
    const [formState, setFormState] = useState({ title: "" });

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get("/transport/routes");
            setRoutes(response.data.data || []);
        } catch (error) {
            console.error("Error fetching routes:", error);
            setRoutes([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => { setIsEditing(false); setCurrentRoute(null); setFormState({ title: "" }); };

    const handleSubmit = async () => {
        if (!formState.title.trim()) {
            toast("error", "Route title is required");
            return;
        }
        setSaving(true);
        try {
            if (isEditing && currentRoute) {
                await api.put(`/transport/routes/${currentRoute.id}`, formState);
                toast("success", "Route updated successfully");
            } else {
                await api.post("/transport/routes", formState);
                toast("success", "Route created successfully");
            }
            resetForm();
            fetchData();
        } catch (error: any) {
            toast("error", error.response?.data?.message || "Failed to save route");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (route: Route) => {
        setCurrentRoute(route);
        setFormState({ title: route.title });
        setIsEditing(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this route?")) return;
        try {
            await api.delete(`/transport/routes/${id}`);
            toast("success", "Route deleted successfully");
            fetchData();
        } catch (error) {
            toast("error", "Failed to delete route");
        }
    };

    const filteredRoutes = routes.filter((r) => r.title?.toLowerCase().includes(searchTerm.toLowerCase()));
    const totalPages = Math.ceil(filteredRoutes.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredRoutes.slice(startIndex, startIndex + itemsPerPage);

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(routes.map(r => ({ 'Route Title': r.title })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Routes");
        XLSX.writeFile(wb, "transport_routes.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Transport Routes", 14, 15);
        autoTable(doc, { head: [['Route Title']], body: routes.map(r => [r.title]), startY: 20 });
        doc.save("transport_routes.pdf");
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(routes.map(r => r.title).join('\n'));
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
                            <RouteIcon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">{isEditing ? "Edit Route" : "Create Route"}</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">Configure your transport routes</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">Route Title <span className="text-red-500">*</span></Label>
                            <Input value={formState.title} onChange={(e) => setFormState({ title: e.target.value })} placeholder="Enter route title" />
                        </div>
                        <div className="flex justify-end pt-2 gap-2">
                            {isEditing && <Button variant="outline" onClick={resetForm} className="h-9 px-6 rounded-full text-xs font-bold">Cancel</Button>}
                            <Button onClick={handleSubmit} disabled={saving} className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all">
                                <Save className="h-4 w-4" /> {isEditing ? "Update" : "Save"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Right: List */}
                <Card className="lg:col-span-2 border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <RouteIcon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Route List</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{filteredRoutes.length} route{filteredRoutes.length === 1 ? "" : "s"}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                            <Input placeholder="Search routes..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="h-9 text-xs w-full md:w-64" />
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
                            <Table className="min-w-[500px]">
                                <TableHeader className="bg-gray-50 text-xs uppercase">
                                    <TableRow className="hover:bg-transparent whitespace-nowrap">
                                        <TableHead className="font-semibold text-gray-600"><div className="flex items-center gap-1">Route Title <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div></TableHead>
                                        <TableHead className="font-semibold text-gray-600 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <SkeletonRows rows={6} cols={TABLE_COLS} />
                                    ) : paginatedData.length === 0 ? (
                                        <TableRow><TableCell colSpan={TABLE_COLS} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">No routes found</TableCell></TableRow>
                                    ) : paginatedData.map((route) => (
                                        <TableRow key={route.id} className="text-xs hover:bg-gray-50/60 transition-colors">
                                            <TableCell className="py-3 text-gray-700 font-medium">{route.title}</TableCell>
                                            <TableCell className="py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button onClick={() => handleEdit(route)} size="sm" className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Pencil className="h-4 w-4" /></Button>
                                                    <Button onClick={() => handleDelete(route.id)} size="sm" className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium pt-2">
                            <div>Showing {filteredRoutes.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredRoutes.length)} of {filteredRoutes.length} entries</div>
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
