"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    CalendarDays
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

interface LeaveType {
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

export default function LeaveTypePage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
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
            const response = await api.get("/hr/leave-type");
            setLeaveTypes(response.data.data);
        } catch (error) {
            console.error("Error fetching leave types:", error);
            toast("error", "Failed to load leave types");
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
                await api.put(`/hr/leave-type/${currentId}`, { name });
                toast("success", "Leave type updated successfully");
            } else {
                await api.post("/hr/leave-type", { name });
                toast("success", "Leave type created successfully");
            }
            resetForm();
            fetchData();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number } };
            toast("error", err.response?.data?.message || "Failed to save leave type");
        }
    };

    const handleEdit = (lt: LeaveType) => {
        setIsEditing(true);
        setCurrentId(lt.id);
        setName(lt.name);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this leave type?")) return;
        try {
            await api.delete(`/hr/leave-type/${id}`);
            toast("success", "Leave type deleted successfully");
            fetchData();
        } catch (error) {
            toast("error", "Failed to delete leave type");
        }
    };

    const resetForm = () => {
        setName("");
        setIsEditing(false);
        setCurrentId(null);
    };

    const filteredLeaveTypes = leaveTypes.filter(lt =>
        lt.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredLeaveTypes.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredLeaveTypes.slice(startIndex, startIndex + itemsPerPage);

    // Export Functions
    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(leaveTypes.map(lt => ({ "Leave Type": lt.name })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Leave Types");
        XLSX.writeFile(wb, "leave_types.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Leave Type List", 14, 15);
        autoTable(doc, {
            head: [['No', 'Leave Type Name']],
            body: leaveTypes.map((lt, idx) => [idx + 1, lt.name]),
            startY: 20,
        });
        doc.save("leave_types.pdf");
    };

    const copyToClipboard = () => {
        const text = leaveTypes.map(lt => lt.name).join('\n');
        navigator.clipboard.writeText(text);
        toast("success", "Data copied to clipboard");
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-4 font-sans bg-gray-50/10 min-h-screen">
            {/* Left Column: Add Leave Type Form */}
            <div className="w-full lg:w-1/3">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0 sticky top-6">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <CalendarDays className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">
                                {isEditing ? "Edit Leave Type" : "Add Leave Type"}
                            </CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">
                                {isEditing ? "Update existing leave type" : "Create a new leave type"}
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="px-5">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                    Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-9 border-gray-200 text-xs shadow-none focus-visible:ring-indigo-500 rounded-lg"
                                    placeholder="e.g. Sick Leave"
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
                                    className="px-8 h-8 text-[11px] uppercase shadow-sm flex items-center gap-1.5 min-w-[80px]"
                                >
                                    {isEditing ? "UPDATE" : "SAVE"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Leave Type List */}
            <div className="w-full lg:w-2/3">
                <Card className="border-[0.5px] border-gray-300 shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-card/50 backdrop-blur-sm overflow-hidden pt-0">
                    <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 px-5 py-4 bg-gradient-to-r from-[#FFF5E7] to-[#EFF0FD]">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-sm">
                            <CalendarDays className="h-5 w-5" />
                        </span>
                        <div>
                            <CardTitle className="text-base font-bold tracking-tight text-slate-800 leading-none">Leave Type List</CardTitle>
                            <p className="text-[11px] text-gray-500 mt-1">{filteredLeaveTypes.length} leave type(s)</p>
                        </div>
                    </CardHeader>
                    <CardContent className="px-5 space-y-4">
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
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 w-[60px] text-center">No.</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Leave Type</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableSkeleton rows={5} cols={3} />
                                    ) : paginatedData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="px-4 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">No data found</TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedData.map((lt, idx) => (
                                            <TableRow key={lt.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/20 transition-colors">
                                                <TableCell className="py-3.5 text-gray-500 font-medium text-center">{startIndex + idx + 1}</TableCell>
                                                <TableCell className="py-3.5 text-gray-700 font-medium">{lt.name}</TableCell>
                                                <TableCell className="py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button onClick={() => handleEdit(lt)} size="icon" variant="ghost" className="h-7 w-7 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors shadow-sm">
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button onClick={() => handleDelete(lt.id)} size="icon" variant="ghost" className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors shadow-sm">
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
                                className="h-8 w-8 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white disabled:opacity-30"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant="ghost"
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                        "h-8 w-8 rounded-[10px] text-[10px] font-bold p-0 transition-all",
                                        currentPage === page
                                            ? "bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white shadow-md scale-105"
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
                                className="h-8 w-8 rounded-[10px] bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white disabled:opacity-30"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
