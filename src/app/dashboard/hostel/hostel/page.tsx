"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface HostelMaster {
    id: number;
    name: string;
    type: string;
    address: string;
    intake: number;
    description: string;
}

export default function HostelMasterPage() {
    const { toast } = useToast();
    const [hostels, setHostels] = useState<HostelMaster[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [form, setForm] = useState({
        id: null as number | null,
        name: "",
        type: "",
        address: "",
        intake: "",
        description: "",
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    const fetchHostels = async () => {
        setFetching(true);
        try {
            const res = await api.get("/hostels");
            setHostels(res.data.data || []);
        } catch (error) {
            toast("error", "Failed to fetch hostels");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchHostels();
    }, []);

    const handleSave = async () => {
        if (!form.name || !form.type) {
            toast("error", "Please fill required fields");
            return;
        }

        setLoading(true);
        const submitData = {
            ...form,
            intake: form.intake ? parseInt(form.intake) : null
        };

        try {
            if (form.id) {
                await api.put(`/hostels/${form.id}`, submitData);
                toast("success", "Hostel updated successfully");
            } else {
                await api.post("/hostels", submitData);
                toast("success", "Hostel created successfully");
            }
            setForm({ id: null, name: "", type: "", address: "", intake: "", description: "" });
            fetchHostels();
        } catch (error) {
            toast("error", "Failed to save hostel");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (hostel: HostelMaster) => {
        setForm({
            id: hostel.id,
            name: hostel.name,
            type: hostel.type,
            address: hostel.address || "",
            intake: hostel.intake?.toString() || "",
            description: hostel.description || "",
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this hostel?")) return;
        try {
            await api.delete(`/hostels/${id}`);
            toast("success", "Hostel deleted successfully");
            fetchHostels();
        } catch (error) {
            toast("error", "Failed to delete hostel");
        }
    };

    const filteredHostels = hostels.filter((h) =>
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination logic
    const totalPages = Math.ceil(filteredHostels.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedHostels = filteredHostels.slice(startIndex, startIndex + itemsPerPage);

    const exportToExcel = () => {
        const data = filteredHostels.map(h => ({
            'Hostel Name': h.name,
            'Type': h.type,
            'Address': h.address,
            'Intake': h.intake
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Hostels");
        XLSX.writeFile(wb, "hostels.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Hostel List", 14, 15);
        autoTable(doc, {
            head: [['Hostel Name', 'Type', 'Address', 'Intake']],
            body: filteredHostels.map(h => [h.name, h.type, h.address, h.intake]),
            startY: 20,
        });
        doc.save("hostels.pdf");
    };

    const copyToClipboard = () => {
        const text = filteredHostels.map(h => `${h.name}\t${h.type}\t${h.address}\t${h.intake}`).join('\n');
        navigator.clipboard.writeText(text);
        toast("success", "Copied to clipboard");
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Section: Add Hostel Form */}
                <div className="w-full lg:w-1/3 xl:w-1/4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h2 className="text-sm font-medium text-gray-800 tracking-tight">Add Hostel</h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    Hostel Name <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none"
                                    placeholder=""
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    Type <span className="text-red-500 font-bold">*</span>
                                </Label>
                                <Select value={form.type} onValueChange={(val) => setForm({ ...form, type: val })}>
                                    <SelectTrigger className="h-8 border-gray-200 text-[11px] focus:ring-indigo-500 rounded shadow-none">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="boys">Boys</SelectItem>
                                        <SelectItem value="girls">Girls</SelectItem>
                                        <SelectItem value="combine">Combine</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Address</Label>
                                <Input
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none"
                                    placeholder=""
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Intake</Label>
                                <Input
                                    value={form.intake}
                                    onChange={(e) => setForm({ ...form, intake: e.target.value })}
                                    className="h-8 border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none"
                                    placeholder=""
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Description</Label>
                                <Textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="min-h-[80px] border-gray-200 text-[11px] focus-visible:ring-indigo-500 rounded shadow-none resize-none"
                                    placeholder=""
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={handleSave}
                                    disabled={loading}
                                    variant="gradient"
                                    className="px-8 h-10 text-[11px] font-bold uppercase transition-all rounded-full shadow-lg min-w-[100px]"
                                >
                                    {loading ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Hostel List */}
                <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                        <h2 className="text-sm font-medium text-gray-800 tracking-tight">Hostel List</h2>

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
                            <Table className="min-w-[800px]">
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Hostel Name <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Type <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                            <div className="flex items-center gap-1 cursor-pointer">Address <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1 cursor-pointer">Intake <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                        </TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fetching ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-10 text-gray-400 italic">Loading hostels...</TableCell>
                                        </TableRow>
                                    ) : paginatedHostels.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-10 text-gray-400 italic">No hostels found</TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedHostels.map((hostel) => (
                                            <TableRow key={hostel.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                                <TableCell className="py-3 text-gray-700 font-medium">{hostel.name}</TableCell>
                                                <TableCell className="py-3 text-gray-500 capitalize">{hostel.type}</TableCell>
                                                <TableCell className="py-3 text-gray-500">{hostel.address || '-'}</TableCell>
                                                <TableCell className="py-3 text-gray-500 text-right">{hostel.intake || '-'}</TableCell>
                                                <TableCell className="py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button onClick={() => handleEdit(hostel)} size="icon" variant="gradient" className="h-6 w-6 text-white rounded shadow-sm">
                                                            <Pencil className="h-3 w-3" />
                                                        </Button>
                                                        <Button onClick={() => handleDelete(hostel.id)} size="icon" variant="ghost" className="h-6 w-6 bg-red-500 hover:bg-red-600 text-white rounded shadow-sm">
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
                                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredHostels.length)} of {filteredHostels.length} entries
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
