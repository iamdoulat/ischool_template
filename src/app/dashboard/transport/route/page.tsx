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

interface Route {
    id: number;
    title: string;
    description?: string;
}

export default function RoutePage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
    const [formState, setFormState] = useState({ title: "" });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get("/transport/routes");
            setRoutes(response.data.data);
        } catch (error) {
            console.error("Error fetching routes:", error);
            toast("error", "Failed to load routes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async () => {
        if (!formState.title) {
            toast("error", "Route title is required");
            return;
        }

        try {
            if (isEditing && currentRoute) {
                await api.put(`/transport/routes/${currentRoute.id}`, formState);
                toast("success", "Route updated successfully");
            } else {
                await api.post("/transport/routes", formState);
                toast("success", "Route created successfully");
            }
            setFormState({ title: "" });
            setIsEditing(false);
            setCurrentRoute(null);
            fetchData();
        } catch (error: any) {
            toast("error", error.response?.data?.message || "Failed to save route");
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

    const filteredRoutes = routes.filter((r) =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredRoutes.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredRoutes.slice(startIndex, startIndex + itemsPerPage);

    // Export Functions
    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(routes.map(r => ({ 'Route Title': r.title })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Routes");
        XLSX.writeFile(wb, "transport_routes.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Transport Routes", 14, 15);
        autoTable(doc, {
            head: [['Route Title']],
            body: routes.map(r => [r.title]),
            startY: 20,
        });
        doc.save("transport_routes.pdf");
    };

    const copyToClipboard = () => {
        const text = routes.map(r => r.title).join('\n');
        navigator.clipboard.writeText(text);
        toast("success", "Data copied to clipboard");
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Section: Create/Edit Route Form */}
                <div className="w-full lg:w-1/3 xl:w-1/4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h2 className="text-sm font-medium text-gray-800 tracking-tight">
                                {isEditing ? "Edit Route" : "Create Route"}
                            </h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    Route Title <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Input
                                    value={formState.title}
                                    onChange={(e) => setFormState({ title: e.target.value })}
                                    className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none"
                                    placeholder="Enter route title"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                {isEditing && (
                                    <Button
                                        onClick={() => { setIsEditing(false); setFormState({ title: "" }); }}
                                        variant="outline"
                                        className="px-6 h-8 text-[11px] font-bold uppercase rounded shadow-sm"
                                    >
                                        Cancel
                                    </Button>
                                )}
                                <Button
                                    onClick={handleSubmit}
                                    variant="gradient"
                                    className="px-8 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-sm"
                                >
                                    {isEditing ? "Update" : "Save"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Route List */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                        <h2 className="text-sm font-medium text-gray-800 tracking-tight">Route List</h2>

                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50 pb-4">
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
                            <Table className="min-w-[600px]">
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Route Title <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-10 text-gray-400 italic">Loading routes...</TableCell>
                                        </TableRow>
                                    ) : paginatedData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-10 text-gray-400 italic">No routes found</TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedData.map((route) => (
                                            <TableRow key={route.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                                                <TableCell className="py-3 text-gray-700 font-medium">{route.title}</TableCell>
                                                <TableCell className="py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button onClick={() => handleEdit(route)} size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded">
                                                            <Pencil className="h-3 w-3" />
                                                        </Button>
                                                        <Button onClick={() => handleDelete(route.id)} size="icon" variant="ghost" className="h-6 w-6 bg-red-500 hover:bg-red-600 text-white rounded">
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
            </div>
        </div>
    );
}
