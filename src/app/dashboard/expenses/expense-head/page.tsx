"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, FileSpreadsheet, FileText, Printer, Columns, Pencil, X, ChevronLeft, ChevronRight, Loader2, Save, Trash2, FileCode } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExpenseHeadRecord {
    id: string;
    expense_head: string;
    description: string;
}

export default function ExpenseHeadPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState("50");
    const [expenseHeads, setExpenseHeads] = useState<ExpenseHeadRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        expense_head: "",
        description: ""
    });

    const fetchExpenseHeads = async () => {
        try {
            setLoading(true);
            const res = await api.get("expense/expense-heads");
            if (res.data?.status === "Success") {
                const mappedData = res.data.data.map((item: any) => ({
                    id: item.id.toString(),
                    expense_head: item.expense_head,
                    description: item.description || ""
                }));
                setExpenseHeads(mappedData);
            }
        } catch (error) {
            console.error("Error fetching expense heads:", error);
            toast.error("Failed to load expense heads");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenseHeads();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.expense_head) {
            toast.error("Expense Head name is required");
            return;
        }

        try {
            setSaving(true);
            const res = editingId 
                ? await api.put(`expense/expense-heads/${editingId}`, formData)
                : await api.post("expense/expense-heads", formData);

            if (res.data?.status === "Success") {
                toast.success(editingId ? "Expense Head updated successfully" : "Expense Head saved successfully");
                resetForm();
                fetchExpenseHeads();
            }
        } catch (error) {
            console.error("Error saving expense head:", error);
            toast.error("Failed to save expense head");
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({ expense_head: "", description: "" });
        setEditingId(null);
    };

    const handleEdit = (item: ExpenseHeadRecord) => {
        setEditingId(item.id);
        setFormData({
            expense_head: item.expense_head,
            description: item.description
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this expense head?")) return;

        try {
            const res = await api.delete(`expense/expense-heads/${id}`);
            if (res.data?.status === "Success") {
                toast.success("Expense Head deleted successfully");
                fetchExpenseHeads();
            }
        } catch (error) {
            console.error("Error deleting expense head:", error);
            toast.error("Failed to delete expense head");
        }
    };

    const filteredData = expenseHeads.filter((item) =>
        item.expense_head.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const exportData = filteredData.map(item => ({
        'Expense Head': item.expense_head,
        'Description': item.description
    }));

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ExpenseHeads");
        XLSX.writeFile(wb, "expense_heads.xlsx");
        toast.success("Exported to Excel");
    };

    const exportToCSV = () => {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "expense_heads.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Exported to CSV");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Expense Head List", 14, 15);
        autoTable(doc, {
            head: [['Expense Head', 'Description']],
            body: filteredData.map(item => [item.expense_head, item.description]),
            startY: 20,
        });
        doc.save("expense_heads.pdf");
        toast.success("Exported to PDF");
    };

    const copyToClipboard = () => {
        const text = exportData.map(d => Object.values(d).join('\t')).join('\n');
        const header = Object.keys(exportData[0] || {}).join('\t');
        navigator.clipboard.writeText(header + '\n' + text);
        toast.success("Copied to clipboard");
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Add Expense Head Form */}
                <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4 h-fit">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2">
                        {editingId ? "Edit Expense Head" : "Add Expense Head"}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="expense-head" className="text-xs font-semibold text-gray-600">
                                Expense Head <span className="text-red-500">*</span>
                            </Label>
                            <Input 
                                id="expense-head" 
                                value={formData.expense_head}
                                onChange={(e) => setFormData({ ...formData, expense_head: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-xs font-semibold text-gray-600">
                                Description
                            </Label>
                            <Textarea 
                                id="description" 
                                className="resize-none" 
                                rows={4} 
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="flex justify-end pt-2 gap-2">
                            {editingId && (
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={resetForm}
                                    className="h-9 px-6 rounded-full text-xs font-bold"
                                >
                                    Cancel
                                </Button>
                            )}
                            <Button 
                                type="submit"
                                disabled={saving}
                                className="h-9 px-6 rounded-full bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white text-xs font-bold gap-2 shadow-lg active:scale-95 transition-all"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {editingId ? "Update" : "Save"}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Right Column: Expense Head List */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-4 space-y-4">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Expense Head List</h2>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex w-full md:w-auto items-center gap-2">
                            <div className="relative w-full md:w-64">
                                <Input
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-3 pr-10"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                                <SelectTrigger className="w-[70px]">
                                    <SelectValue placeholder="50" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center border rounded-md p-1 bg-gray-50 text-gray-500">
                                <Button 
                                    variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                                    onClick={copyToClipboard}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button 
                                    variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                                    onClick={exportToExcel}
                                >
                                    <FileSpreadsheet className="h-4 w-4" />
                                </Button>
                                <Button 
                                    variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                                    onClick={exportToCSV}
                                >
                                    <FileText className="h-4 w-4" />
                                </Button>
                                <Button 
                                    variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                                    onClick={exportToPDF}
                                >
                                    <FileCode className="h-4 w-4" />
                                </Button>
                                <Button 
                                    variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                                    onClick={() => window.print()}
                                >
                                    <Printer className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                    <Columns className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-md border overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow>
                                    <TableHead className="font-semibold text-gray-600">Expense Head</TableHead>
                                    <TableHead className="font-semibold text-gray-600 w-full text-center">Description</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-500" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                                            No records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredData.map((item) => (
                                        <TableRow key={item.id} className="text-sm">
                                            <TableCell className="font-medium text-gray-700 py-3">{item.expense_head}</TableCell>
                                            <TableCell className="text-gray-600 text-center">{item.description}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleEdit(item)}
                                                        className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleDelete(item.id)}
                                                        className="h-7 w-7 bg-red-500 hover:bg-red-600 text-white rounded p-0 shadow-sm active:scale-95 transition-all"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2">
                        <div>
                            Showing 1 to {filteredData.length} of {expenseHeads.length} entries
                        </div>
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-md shadow-sm" disabled><ChevronLeft className="h-4 w-4" /></Button>
                            <Button variant="default" size="sm" className="h-8 w-8 p-0 rounded-md bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md">1</Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-md shadow-sm" disabled><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
