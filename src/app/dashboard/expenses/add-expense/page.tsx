"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Copy, FileSpreadsheet, FileText, Printer, Columns, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2, Save, FileCode } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExpenseRecord {
    id: string;
    name: string;
    description: string;
    invoice_number: string;
    date: string;
    expense_head_id: string;
    expense_head: { expense_head: string };
    amount: number;
    document?: string;
}

interface ExpenseHead {
    id: string;
    expense_head: string;
}

export default function AddExpensePage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState("50");
    const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
    const [expenseHeads, setExpenseHeads] = useState<ExpenseHead[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        expense_head_id: "",
        name: "",
        invoice_number: "",
        date: new Date().toISOString().split('T')[0],
        amount: "",
        description: "",
        document: null as File | null
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [expenseRes, headRes] = await Promise.all([
                api.get("expense/expenses"),
                api.get("expense/expense-heads")
            ]);

            if (expenseRes.data?.status === "Success") {
                setExpenses(expenseRes.data.data);
            }
            if (headRes.data?.status === "Success") {
                setExpenseHeads(headRes.data.data);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load records");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, document: e.target.files[0] });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.expense_head_id || !formData.name || !formData.date || !formData.amount) {
            toast.error("Please fill in all required fields");
            return;
        }

        const data = new FormData();
        data.append("expense_head_id", formData.expense_head_id);
        data.append("name", formData.name);
        data.append("invoice_number", formData.invoice_number);
        data.append("date", formData.date);
        data.append("amount", formData.amount);
        data.append("description", formData.description);
        if (formData.document) {
            data.append("document", formData.document);
        }

        try {
            setSaving(true);
            let res;
            if (editingId) {
                // Laravel handles PUT with FormData differently, often requires _method spoofing
                data.append("_method", "PUT");
                res = await api.post(`expense/expenses/${editingId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                res = await api.post("expense/expenses", data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            if (res.data?.status === "Success") {
                toast.success(editingId ? "Expense updated successfully" : "Expense saved successfully");
                resetForm();
                fetchData();
            }
        } catch (error) {
            console.error("Error saving expense:", error);
            toast.error("Failed to save expense");
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
            expense_head_id: "",
            name: "",
            invoice_number: "",
            date: new Date().toISOString().split('T')[0],
            amount: "",
            description: "",
            document: null
        });
        setEditingId(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleEdit = (item: ExpenseRecord) => {
        setEditingId(item.id);
        setFormData({
            expense_head_id: item.expense_head_id.toString(),
            name: item.name,
            invoice_number: item.invoice_number || "",
            date: item.date,
            amount: item.amount.toString(),
            description: item.description || "",
            document: null
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this expense?")) return;
        try {
            const res = await api.delete(`expense/expenses/${id}`);
            if (res.data?.status === "Success") {
                toast.success("Expense deleted successfully");
                fetchData();
            }
        } catch (error) {
            console.error("Error deleting expense:", error);
            toast.error("Failed to delete expense");
        }
    };

    const filteredData = expenses.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.expense_head.expense_head.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.invoice_number && item.invoice_number.includes(searchTerm))
    );

    const exportData = filteredData.map(item => ({
        'Name': item.name,
        'Description': item.description,
        'Invoice Number': item.invoice_number,
        'Date': item.date,
        'Expense Head': item.expense_head.expense_head,
        'Amount': item.amount
    }));

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Expenses");
        XLSX.writeFile(wb, "expenses.xlsx");
        toast.success("Exported to Excel");
    };

    const exportToCSV = () => {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "expenses.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Exported to CSV");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Expense List", 14, 15);
        autoTable(doc, {
            head: [['Name', 'Invoice', 'Date', 'Head', 'Amount']],
            body: filteredData.map(item => [item.name, item.invoice_number, item.date, item.expense_head.expense_head, item.amount]),
            startY: 20,
        });
        doc.save("expenses.pdf");
        toast.success("Exported to PDF");
    };

    const copyToClipboard = () => {
        if (exportData.length === 0) return;
        const text = exportData.map(d => Object.values(d).join('\t')).join('\n');
        const header = Object.keys(exportData[0] || {}).join('\t');
        navigator.clipboard.writeText(header + '\n' + text);
        toast.success("Copied to clipboard");
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Add Expense Form */}
                <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4 h-fit">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2">
                        {editingId ? "Edit Expense" : "Add Expense"}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="expense-head" className="text-xs font-semibold text-gray-600">
                                Expense Head <span className="text-red-500">*</span>
                            </Label>
                            <Select 
                                value={formData.expense_head_id} 
                                onValueChange={(val) => setFormData({ ...formData, expense_head_id: val })}
                            >
                                <SelectTrigger id="expense-head">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {expenseHeads.map((head) => (
                                        <SelectItem key={head.id} value={head.id.toString()}>{head.expense_head}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-semibold text-gray-600">
                                Name <span className="text-red-500">*</span>
                            </Label>
                            <Input 
                                id="name" 
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="invoice-number" className="text-xs font-semibold text-gray-600">
                                Invoice Number
                            </Label>
                            <Input 
                                id="invoice-number" 
                                value={formData.invoice_number}
                                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date" className="text-xs font-semibold text-gray-600">
                                Date <span className="text-red-500">*</span>
                            </Label>
                            <Input 
                                id="date" type="date" 
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-xs font-semibold text-gray-600">
                                Amount <span className="text-red-500">*</span>
                            </Label>
                            <Input 
                                id="amount" 
                                type="number"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">
                                Attach Document
                            </Label>
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer group"
                            >
                                <Upload className="h-6 w-6 mb-2 group-hover:text-indigo-500 transition-colors" />
                                <span className="text-xs font-medium">
                                    {formData.document ? formData.document.name : "Drag and drop a file here or click"}
                                </span>
                                <Input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    onChange={handleFileChange}
                                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-xs font-semibold text-gray-600">
                                Description
                            </Label>
                            <Textarea 
                                id="description" 
                                className="resize-none" 
                                rows={3} 
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

                {/* Right Column: Expense List */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-4 space-y-4">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Expense List</h2>

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
                        <Table>
                            <TableHeader className="bg-gray-50 text-xs uppercase">
                                <TableRow>
                                    <TableHead className="font-semibold text-gray-600 whitespace-nowrap">Name</TableHead>
                                    <TableHead className="font-semibold text-gray-600 min-w-[300px]">Description</TableHead>
                                    <TableHead className="font-semibold text-gray-600 whitespace-nowrap">Invoice Number</TableHead>
                                    <TableHead className="font-semibold text-gray-600 whitespace-nowrap">Date</TableHead>
                                    <TableHead className="font-semibold text-gray-600 whitespace-nowrap">Expense Head</TableHead>
                                    <TableHead className="font-semibold text-gray-600 whitespace-nowrap text-right">Amount ($)</TableHead>
                                    <TableHead className="font-semibold text-gray-600 whitespace-nowrap text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-500" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-gray-500 font-medium">
                                            No records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredData.map((item) => (
                                        <TableRow key={item.id} className="text-sm">
                                            <TableCell className="font-medium text-gray-700 py-3">{item.name}</TableCell>
                                            <TableCell className="text-gray-600 text-xs">{item.description}</TableCell>
                                            <TableCell className="text-gray-600">{item.invoice_number}</TableCell>
                                            <TableCell className="text-gray-600">{item.date}</TableCell>
                                            <TableCell className="text-gray-600">{item.expense_head.expense_head}</TableCell>
                                            <TableCell className="text-gray-600 text-right font-semibold">${item.amount}</TableCell>
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
                            Showing 1 to {filteredData.length} of {expenses.length} entries
                        </div>
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-md shadow-sm" disabled><ChevronLeft className="h-4 w-4" /></Button>
                            <Button variant="default" size="sm" className="h-8 w-8 p-0 rounded-md bg-gradient-to-r from-[#FF9800] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#818cf8] text-white shadow-md font-bold">1</Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-md shadow-sm" disabled><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
