"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Pencil,
    Trash2,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    BadgeCheck
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Designation {
    id: number;
    name: string;
}

function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-b border-muted/30">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded-md bg-muted/60 animate-pulse" style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

export default function DesignationPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [designations, setDesignations] = useState<Designation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [name, setName] = useState("");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get("/hr/designation");
            setDesignations(response.data.data);
        } catch (error) {
            console.error("Error fetching designations:", error);
            toast("error", "Failed to load designations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast("error", "Name is required");
            return;
        }

        try {
            if (isEditing && currentId) {
                await api.put(`/hr/designation/${currentId}`, { name });
                toast("success", "Designation updated successfully");
            } else {
                await api.post("/hr/designation", { name });
                toast("success", "Designation created successfully");
            }
            resetForm();
            fetchData();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            toast("error", err.response?.data?.message || "Failed to save designation");
        }
    };

    const handleEdit = (des: Designation) => {
        setIsEditing(true);
        setCurrentId(des.id);
        setName(des.name);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this designation?")) return;
        try {
            await api.delete(`/hr/designation/${id}`);
            toast("success", "Designation deleted successfully");
            fetchData();
        } catch (error) {
            toast("error", "Failed to delete designation");
        }
    };

    const resetForm = () => {
        setName("");
        setIsEditing(false);
        setCurrentId(null);
    };

    const filteredDesignations = designations.filter(des =>
        des.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredDesignations.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredDesignations.slice(startIndex, startIndex + itemsPerPage);

    // Export Functions
    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(designations.map(d => ({ Designation: d.name })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Designations");
        XLSX.writeFile(wb, "designations.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Designation List", 14, 15);
        autoTable(doc, {
            head: [['No', 'Designation']],
            body: designations.map((d, idx) => [idx + 1, d.name]),
            startY: 20,
        });
        doc.save("designations.pdf");
    };

    const copyToClipboard = () => {
        const text = designations.map(d => d.name).join('\n');
        navigator.clipboard.writeText(text);
        toast("success", "Data copied to clipboard");
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-4 font-sans bg-gray-50/10 min-h-screen">
            {/* Left Column: Add Designation Form */}
            <div className="w-full lg:w-1/3">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <BadgeCheck className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                {isEditing ? "Edit Designation" : "Add Designation"}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">Manage staff designations</p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                    Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-9 border-gray-200 text-xs shadow-none focus-visible:ring-indigo-500 rounded-lg"
                                    placeholder="e.g. Faculty"
                                />
                            </div>

                            <div className="flex justify-end pt-2 gap-2">
                                {isEditing && (
                                    <Button
                                        onClick={resetForm}
                                        variant="outline"
                                        className="px-6 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-sm"
                                    >
                                        Cancel
                                    </Button>
                                )}
                                <Button
                                    onClick={handleSubmit}
                                    variant="gradient"
                                    className="px-8 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-sm flex items-center gap-1.5"
                                >
                                    {isEditing ? "Update" : "Save"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Designation List */}
            <div className="w-full lg:w-2/3">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <BadgeCheck className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Designation List</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{filteredDesignations.length} designation(s)</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="relative w-full md:w-64">
                                <Input
                                    placeholder="Search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-3 h-8 text-xs border-gray-200 focus-visible:ring-indigo-500 rounded-lg"
                                />
                            </div>

                            <div className="flex items-center gap-2">
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
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-1 text-gray-400">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={copyToClipboard}>
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={exportToExcel}>
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={exportToPDF}>
                                        <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors" onClick={() => window.print()}>
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded transition-colors">
                                        <Columns className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="rounded border border-gray-50 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="hover:bg-transparent border-gray-100">
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Designation</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={2} />
                                    ) : paginatedData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">No data found</TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedData.map((des) => (
                                            <TableRow key={des.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/20 transition-colors">
                                                <TableCell className="py-3.5 text-[12px] text-gray-700 font-medium">{des.name}</TableCell>
                                                <TableCell className="py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button onClick={() => handleEdit(des)} size="icon" variant="ghost" className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors shadow-sm">
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button onClick={() => handleDelete(des.id)} size="icon" variant="ghost" className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors shadow-sm">
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

                        <div className="flex justify-end items-center gap-2 py-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                className="h-8 w-8 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-90 disabled:opacity-30"
                            >
                                <ChevronLeft className="h-4 w-4 text-white" />
                            </Button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant="ghost"
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "h-8 w-8 rounded-[10px] text-[10px] font-bold p-0 transition-all",
                                        currentPage === page
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md"
                                            : "bg-white border border-gray-200 text-gray-600 hover:text-indigo-600"
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
                                className="h-8 w-8 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white hover:opacity-90 disabled:opacity-30"
                            >
                                <ChevronRight className="h-4 w-4 text-white" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
