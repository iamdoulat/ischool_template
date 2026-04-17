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

interface PickupPoint {
    id: number;
    name: string;
    latitude: string;
    longitude: string;
}

export default function PickupPointPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [points, setPoints] = useState<PickupPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPoint, setCurrentPoint] = useState<PickupPoint | null>(null);
    const [isViewing, setIsViewing] = useState(false);
    const [formState, setFormState] = useState({
        name: "",
        latitude: "",
        longitude: ""
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get("/transport/pickup-points");
            setPoints(response.data.data);
        } catch (error) {
            console.error("Error fetching pickup points:", error);
            toast("error", "Failed to load pickup points");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async () => {
        if (!formState.name) {
            toast("error", "Pickup point name is required");
            return;
        }

        try {
            if (isEditing && currentPoint) {
                await api.put(`/transport/pickup-points/${currentPoint.id}`, formState);
                toast("success", "Pickup point updated successfully");
            } else {
                await api.post("/transport/pickup-points", formState);
                toast("success", "Pickup point created successfully");
            }
            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            toast("error", error.response?.data?.message || "Failed to save pickup point");
        }
    };

    const handleView = (point: PickupPoint) => {
        setCurrentPoint(point);
        setFormState({
            name: point.name || "",
            latitude: point.latitude || "",
            longitude: point.longitude || ""
        });
        setIsEditing(false);
        setIsViewing(true);
        setIsModalOpen(true);
    };

    const handleEdit = (point: PickupPoint) => {
        setCurrentPoint(point);
        setFormState({
            name: point.name || "",
            latitude: point.latitude || "",
            longitude: point.longitude || ""
        });
        setIsEditing(true);
        setIsViewing(false);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this pickup point?")) return;
        try {
            await api.delete(`/transport/pickup-points/${id}`);
            toast("success", "Pickup point deleted successfully");
            fetchData();
        } catch (error) {
            toast("error", "Failed to delete pickup point");
        }
    };

    const resetForm = () => {
        setFormState({
            name: "",
            latitude: "",
            longitude: ""
        });
        setIsEditing(false);
        setIsViewing(false);
        setCurrentPoint(null);
    };

    const filteredPoints = points.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredPoints.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredPoints.slice(startIndex, startIndex + itemsPerPage);

    // Export Functions
    const exportToExcel = () => {
        const dataToExport = points.map(p => ({
            'Name': p.name,
            'Latitude': p.latitude,
            'Longitude': p.longitude
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "PickupPoints");
        XLSX.writeFile(wb, "transport_pickup_points.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Transport Pickup Points List", 14, 15);
        autoTable(doc, {
            head: [['Name', 'Latitude', 'Longitude']],
            body: points.map(p => [p.name, p.latitude, p.longitude]),
            startY: 20,
        });
        doc.save("transport_pickup_points.pdf");
    };

    const copyToClipboard = () => {
        const text = points.map(p => `${p.name} (${p.latitude}, ${p.longitude})`).join('\n');
        navigator.clipboard.writeText(text);
        toast("success", "Data copied to clipboard");
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-sm font-medium text-gray-800 tracking-tight">Pickup Point List</h2>
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
                        <Table className="min-w-[800px]">
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                        <div className="flex items-center gap-1 cursor-pointer">Name <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                    </TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Latitude</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Longitude</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 text-gray-400 italic">Loading points...</TableCell>
                                    </TableRow>
                                ) : paginatedData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 text-gray-400 italic">No pickup points found</TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedData.map((point) => (
                                        <TableRow key={point.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                            <TableCell className="py-3 text-gray-700 font-medium">{point.name}</TableCell>
                                            <TableCell className="py-3 text-right text-gray-500 font-medium">{point.latitude}</TableCell>
                                            <TableCell className="py-3 text-right text-gray-500 font-medium">{point.longitude}</TableCell>
                                            <TableCell className="py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button onClick={() => handleView(point)} size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded">
                                                        <Eye className="h-3 w-3" />
                                                    </Button>
                                                    <Button onClick={() => handleEdit(point)} size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded">
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                    <Button onClick={() => handleDelete(point.id)} size="icon" variant="ghost" className="h-6 w-6 bg-red-500 hover:bg-red-600 text-white rounded">
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

            {/* Pickup Point Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl bg-white">
                    <DialogHeader className="p-6 bg-gradient-to-r from-indigo-600 to-violet-600">
                        <DialogTitle className="text-white text-xl font-bold tracking-tight">
                            {isViewing ? "View Pickup Point" : isEditing ? "Edit Pickup Point" : "Add Pickup Point"}
                        </DialogTitle>
                        <p className="text-indigo-100 text-xs font-medium opacity-90">
                            {isViewing ? "Pickup point details." : "Manage transit location details."}
                        </p>
                    </DialogHeader>
                    <div className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Pickup Point Name <span className="text-red-500">*</span></Label>
                            <Input
                                value={formState.name}
                                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                                readOnly={isViewing}
                                className="h-10 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-xl text-xs"
                                placeholder="e.g. Brooklyn North"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Latitude</Label>
                                <Input
                                    value={formState.latitude}
                                    onChange={(e) => setFormState({ ...formState, latitude: e.target.value })}
                                    readOnly={isViewing}
                                    className="h-10 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-xl text-xs"
                                    placeholder="23.2195..."
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Longitude</Label>
                                <Input
                                    value={formState.longitude}
                                    onChange={(e) => setFormState({ ...formState, longitude: e.target.value })}
                                    readOnly={isViewing}
                                    className="h-10 border-gray-100 bg-gray-50/30 focus-visible:ring-indigo-500 rounded-xl text-xs"
                                    placeholder="79.9206..."
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-gray-50/50 block sm:flex sm:justify-end gap-3 border-t border-gray-100">
                        <Button
                            onClick={() => setIsModalOpen(false)}
                            variant="outline"
                            className="w-full sm:w-auto px-6 h-10 text-[11px] font-bold uppercase rounded-xl border-gray-200 hover:bg-gray-100 transition-all shadow-sm"
                        >
                            {isViewing ? "Close" : "Cancel"}
                        </Button>
                        {!isViewing && (
                            <Button
                                onClick={handleSubmit}
                                variant="gradient"
                                className="w-full sm:w-auto px-10 h-10 text-[11px] font-bold uppercase transition-all rounded-xl shadow-lg hover:shadow-indigo-200"
                            >
                                {isEditing ? "Save Changes" : "Create Point"}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
