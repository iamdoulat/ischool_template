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
    TableRow
} from "@/components/ui/table";
import {
    Pencil,
    X,
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const gradBtn = "bg-gradient-to-r from-orange-400 to-indigo-500 hover:from-orange-500 hover:to-indigo-600 text-white font-bold shadow-md transition-all rounded-full border-none disabled:opacity-60";
const gradPill = "bg-gradient-to-r from-orange-400 to-indigo-500 text-white border-0 hover:from-orange-500 hover:to-indigo-600 shadow-md";

interface LeaveType {
    id: string;
    name: string;
}

export default function LeaveTypePage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [types, setTypes] = useState<LeaveType[]>([]);
    const [name, setName] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Fetch types
    const fetchTypes = async () => {
        setLoading(true);
        try {
            const res = await api.get("/hr/leave-types");
            if (res.data?.success) setTypes(res.data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTypes();
    }, []);

    const handleSave = async () => {
        if (!name.trim()) return;
        setSubmitLoading(true);
        try {
            if (editingId) {
                const res = await api.put(`/hr/leave-types/${editingId}`, { name });
                if (res.data?.success) {
                    setEditingId(null);
                    setName("");
                    fetchTypes();
                    toast("success", "Leave type updated successfully!");
                }
            } else {
                const res = await api.post("/hr/leave-types", { name });
                if (res.data?.success) {
                    setName("");
                    fetchTypes();
                    toast("success", "Leave type saved successfully!");
                }
            }
        } catch (e) {
            console.error(e);
            toast("error", "Failed to save leave type.");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleEdit = (t: LeaveType) => {
        setEditingId(Number(t.id));
        setName(t.name);
    };

    const handleDelete = (id: number) => {
        setDeleteId(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await api.delete(`/hr/leave-types/${deleteId}`);
            if (res.data?.success) {
                fetchTypes();
                toast("success", "Leave type deleted.");
            }
        } catch (e) {
            console.error(e);
            toast("error", "Failed to delete.");
        } finally {
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    const filteredLeaveTypes = types.filter(type =>
        type.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCopy = () => {
        if (!filteredLeaveTypes.length) return;
        const text = filteredLeaveTypes.map(t => t.name).join('\n');
        navigator.clipboard.writeText("Name\n" + text);
        toast("success", "Copied to clipboard!");
    };

    const handleExportCSV = () => {
        if (!filteredLeaveTypes.length) return;
        const csv = ["Name", ...filteredLeaveTypes.map(t => `"${t.name}"`)].join('\n');
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "leave_types.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => window.print();

    return (
        <>
            <div className="flex flex-col lg:flex-row gap-6 p-4 font-sans bg-gray-50/10 min-h-screen">
                {/* Left Column: Add Leave Type Form */}
                <div className="w-full lg:w-1/3">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                        <h2 className="text-sm font-medium text-gray-800 border-b pb-2 mb-4">Add Leave Type</h2>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">
                                    Name <span className="text-red-500">*</span>
                                </Label>
                                <Input value={name} onChange={e => setName(e.target.value)} className="h-9 border-gray-200 text-xs shadow-none focus-visible:ring-indigo-500" />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button onClick={handleSave} disabled={submitLoading} className={cn("gap-2 h-9 px-8 text-sm font-bold rounded-full cursor-pointer", gradBtn)}>
                                    SAVE
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Leave Type List */}
                <div className="w-full lg:w-2/3">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                        <h2 className="text-sm font-medium text-gray-800 border-b pb-2">Leave Type List</h2>

                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="relative w-full md:w-64">
                                <Input
                                    placeholder="Search"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-3 h-8 text-xs border-gray-200 focus-visible:ring-indigo-500"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 mr-2">
                                    <span className="text-[10px] text-gray-500 font-bold">50</span>
                                    <Select defaultValue="50">
                                        <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <ChevronLeft className="h-3 w-3 text-gray-400 rotate-90" />
                                </div>
                                <div className="flex items-center gap-1 text-gray-400">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100" onClick={handleCopy} title="Copy">
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100" onClick={handleExportCSV} title="Export Excel (CSV)">
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100" onClick={handlePrint} title="Export PDF">
                                        <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100" onClick={handlePrint} title="Print">
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                        <Columns className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-md border border-gray-50 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="hover:bg-transparent border-gray-100">
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Name</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLeaveTypes.map((type) => (
                                        <TableRow key={type.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/20 transition-colors">
                                            <TableCell className="py-3.5 text-gray-700 font-medium">{type.name}</TableCell>
                                            <TableCell className="py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 bg-[#6366f1] hover:bg-[#5558dd] text-white rounded shadow-sm" onClick={() => handleEdit(type)}>
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-6 w-6 bg-[#6366f1] hover:bg-[#5558dd] text-white rounded shadow-sm" onClick={() => handleDelete(Number(type.id))}>
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium pt-2">
                            <div>
                                Showing 1 to {filteredLeaveTypes.length} of {types.length} entries
                            </div>
                            <div className="flex gap-2 items-center">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-2xl border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 shadow-sm"
                                    disabled={true}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                        "h-8 w-8 rounded-2xl font-bold shadow-sm transition-all",
                                        gradPill
                                    )}
                                >
                                    1
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-2xl border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 shadow-sm"
                                    disabled={true}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the leave type from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
