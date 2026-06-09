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
            setRoutes(response.data.data || []);
        } catch (error) {
            console.error("Error fetching routes:", error);
            // Fallback to empty if API fails for now to avoid crashes during development
            setRoutes([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async () => {
        if (!formState.title.trim()) {
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
        r.title?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="p-6 space-y-6 bg-gray-50/10 min-h-screen font-sans">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Section: Create/Edit Route Form */}
                <div className="w-full lg:w-1/3 xl:w-1/4">
                    <div className="bg-white rounded-lg shadow-xl shadow-black/5 border border-gray-100 overflow-hidden sticky top-6">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-base font-semibold text-gray-800 tracking-tight">
                                {isEditing ? "Edit Route" : "Create Route"}
                            </h2>
                            <p className="text-xs text-gray-400 mt-1">Configure your transport routes</p>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Route Title <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Input
                                    value={formState.title}
                                    onChange={(e) => setFormState({ title: e.target.value })}
                                    className="h-11 border-gray-200 text-sm focus-visible:ring-primary rounded-lg shadow-none transition-all focus:border-primary"
                                    placeholder="Enter route title"
                                />
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <Button
                                    onClick={handleSubmit}
                                    variant="gradient"
                                    className="w-full h-11 text-xs font-bold uppercase tracking-widest transition-all rounded-lg shadow-lg"
                                >
                                    {isEditing ? "Update Route" : "Save Route"}
                                </Button>
                                {isEditing && (
                                    <Button
                                        onClick={() => { setIsEditing(false); setFormState({ title: "" }); }}
                                        variant="outline"
                                        className="w-full h-11 text-xs font-bold uppercase tracking-widest rounded-lg border-gray-200 text-gray-500 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Route List */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-lg shadow-xl shadow-black/5 border border-gray-100 p-6 space-y-6 overflow-hidden">
                        <div className="flex justify-between items-center">
                            <h2 className="text-base font-semibold text-gray-800 tracking-tight">Route List</h2>
                            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest border border-indigo-100">
                                {filteredRoutes.length} Total
                            </span>
                        </div>

                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50 pb-6">
                            <div className="relative w-full md:w-80 group">
                                <Input
                                    placeholder="Search routes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-4 h-10 text-xs border-gray-200 focus-visible:ring-primary rounded-lg shadow-none transition-all focus:border-primary pr-10"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors">
                                    <Plus className="h-4 w-4 rotate-45" />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-gray-400">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={copyToClipboard}>
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={exportToExcel}>
                                        <FileSpreadsheet className="h-3.5 w-3.5 text-green-600" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={exportToPDF}>
                                        <FileText className="h-3.5 w-3.5 text-red-600" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={() => window.print()}>
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-1.5 mr-2">
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
                                        <SelectContent className="rounded-lg">
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="rounded-lg border border-gray-100 overflow-x-auto custom-scrollbar">
                            <Table className="min-w-[600px]">
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                        <TableHead className="text-xs font-bold uppercase text-gray-500 py-4 px-6">
                                            <div className="flex items-center gap-2 cursor-pointer group">
                                                Route Title 
                                                <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-xs font-bold uppercase text-gray-500 py-4 px-6 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-20">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                                    <p className="text-xs text-gray-400 font-medium">Loading routes...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-20">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="bg-gray-50 p-4 rounded-full">
                                                        <FileText className="h-8 w-8 text-gray-300" />
                                                    </div>
                                                    <p className="text-xs text-gray-400 font-medium">No routes found</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedData.map((route) => (
                                            <TableRow key={route.id} className="text-sm border-b border-gray-50 hover:bg-gray-50/30 transition-colors group">
                                                <TableCell className="py-4 px-6 text-gray-700 font-medium">{route.title}</TableCell>
                                                <TableCell className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button 
                                                            onClick={() => handleEdit(route)} 
                                                            size="icon" 
                                                            variant="ghost" 
                                                            className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded transition-colors shadow-sm"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button 
                                                            onClick={() => handleDelete(route.id)} 
                                                            size="icon" 
                                                            variant="ghost" 
                                                            className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded transition-colors shadow-sm"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
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
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4 border-t border-gray-50">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                Showing {Math.min(startIndex + 1, filteredRoutes.length)} to {Math.min(startIndex + itemsPerPage, filteredRoutes.length)} of {filteredRoutes.length} Entries
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    className="h-9 w-9 rounded-lg border-gray-100 hover:bg-gray-50 hover:border-primary/20 disabled:opacity-30 transition-all shadow-sm"
                                >
                                    <ChevronLeft className="h-4 w-4 text-gray-600" />
                                </Button>

                                <div className="flex items-center gap-1.5 px-2">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? "gradient" : "outline"}
                                            onClick={() => setCurrentPage(page)}
                                            className={cn(
                                                "h-8 w-8 rounded-lg text-[10px] font-bold p-0 transition-all",
                                                currentPage === page ? "shadow-md scale-105" : "border-gray-100 text-gray-400 hover:text-indigo-600"
                                            )}
                                        >
                                            {page}
                                        </Button>
                                    ))}
                                </div>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    className="h-9 w-9 rounded-lg border-gray-100 hover:bg-gray-50 hover:border-primary/20 disabled:opacity-30 transition-all shadow-sm"
                                >
                                    <ChevronRight className="h-4 w-4 text-gray-600" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
