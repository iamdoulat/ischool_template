"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Copy, FileSpreadsheet, FileText, Printer, Columns, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

interface ExpenseRecord {
    id: string;
    name: string;
    description: string;
    invoiceNumber: string;
    date: string;
    expenseHead: string;
    amount: number;
}

const expenseData: ExpenseRecord[] = [
    {
        id: "1",
        name: "CBSE BOOKS",
        description: "NCRT Books are essential materials for students of all classes",
        invoiceNumber: "7755",
        date: "02/28/2026",
        expenseHead: "Stationery Purchase",
        amount: 150.00,
    },
    {
        id: "2",
        name: "Staff Training",
        description: "Stock is an odd name for a flower. It seems to be a reference to the \"stocky\"",
        invoiceNumber: "5754",
        date: "02/18/2026",
        expenseHead: "Miscellaneous",
        amount: 200.00,
    },
    {
        id: "3",
        name: "Airtel Broad Band",
        description: "The new billing solution is faster and more accurate than its existing systems.",
        invoiceNumber: "8989",
        date: "02/20/2026",
        expenseHead: "Telephone Bill",
        amount: 250.00,
    },
    {
        id: "4",
        name: "The Power Center",
        description: "The new billing solution is faster and more accurate than its existing systems.",
        invoiceNumber: "5645",
        date: "02/11/2026",
        expenseHead: "Electricity Bill",
        amount: 200.00,
    },
    {
        id: "5",
        name: "Online Course Classes",
        description: "Online Course Classes",
        invoiceNumber: "8757",
        date: "02/02/2026",
        expenseHead: "Miscellaneous",
        amount: 150.00,
    },
    {
        id: "6",
        name: "CBSE BOOKS",
        description: "NCRT Books are essential materials for students of all classes",
        invoiceNumber: "5667",
        date: "01/26/2026",
        expenseHead: "Stationery Purchase",
        amount: 150.00,
    },
    {
        id: "7",
        name: "Staff Training",
        description: "Staff Training Teaches programs",
        invoiceNumber: "7888",
        date: "01/22/2026",
        expenseHead: "Miscellaneous",
        amount: 200.00,
    },
    {
        id: "8",
        name: "Stock Flower",
        description: "Stock is an odd name for a flower. It seems to be a reference to the \"stocky\"",
        invoiceNumber: "7894",
        date: "01/17/2026",
        expenseHead: "Flower",
        amount: 150.00,
    },
    {
        id: "9",
        name: "Airtel Broad Band",
        description: "The new billing solution is faster and more accurate than its existing systems.",
        invoiceNumber: "2341",
        date: "01/12/2026",
        expenseHead: "Telephone Bill",
        amount: 150.00,
    },
    {
        id: "10",
        name: "The Power Center",
        description: "The new billing solution is faster and more accurate than its existing systems.",
        invoiceNumber: "345345",
        date: "01/06/2026",
        expenseHead: "Electricity Bill",
        amount: 200.00,
    },
    {
        id: "11",
        name: "Online Course Classes",
        description: "Online Course Classes",
        invoiceNumber: "5342",
        date: "01/03/2026",
        expenseHead: "Miscellaneous",
        amount: 150.00,
    },
    // Adding more dummy data to match "Showing 1 to 17 of 17 entries" somewhat
    {
        id: "12",
        name: "CBSE BOOKS",
        description: "NCRT Books are essential materials for students of all classes",
        invoiceNumber: "5667",
        date: "12/25/2025",
        expenseHead: "Stationery Purchase",
        amount: 150.00,
    },
    {
        id: "13",
        name: "Staff Training",
        description: "Staff Training Teaches programs",
        invoiceNumber: "7888",
        date: "12/22/2025",
        expenseHead: "Miscellaneous",
        amount: 200.00,
    },
    {
        id: "14",
        name: "Stock Flower",
        description: "Stock is an odd name for a flower. It seems to be a reference to the \"stocky\"",
        invoiceNumber: "7894",
        date: "12/17/2025",
        expenseHead: "Flower",
        amount: 150.00,
    },
    {
        id: "15",
        name: "Airtel Broad Band",
        description: "The new billing solution is faster and more accurate than its existing systems.",
        invoiceNumber: "2341",
        date: "12/11/2025",
        expenseHead: "Telephone Bill",
        amount: 150.00,
    },
    {
        id: "16",
        name: "The Power Center",
        description: "The new billing solution is faster and more accurate than its existing systems.",
        invoiceNumber: "345345",
        date: "12/06/2025",
        expenseHead: "Electricity Bill",
        amount: 200.00,
    },
    {
        id: "17",
        name: "Online Course Classes",
        description: "Online Course Classes",
        invoiceNumber: "5342",
        date: "12/03/2025",
        expenseHead: "Miscellaneous",
        amount: 150.00,
    },
];

export default function AddExpensePage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState("50");

    const filteredData = expenseData.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Add Expense Form */}
                <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4 h-fit">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Add Expense</h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="expense-head" className="text-xs font-semibold text-gray-600">
                                Expense Head <span className="text-red-500">*</span>
                            </Label>
                            <Select>
                                <SelectTrigger id="expense-head">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="stationery">Stationery Purchase</SelectItem>
                                    <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
                                    <SelectItem value="telephone">Telephone Bill</SelectItem>
                                    <SelectItem value="electricity">Electricity Bill</SelectItem>
                                    <SelectItem value="flower">Flower</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-semibold text-gray-600">
                                Name <span className="text-red-500">*</span>
                            </Label>
                            <Input id="name" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="invoice-number" className="text-xs font-semibold text-gray-600">
                                Invoice Number
                            </Label>
                            <Input id="invoice-number" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date" className="text-xs font-semibold text-gray-600">
                                Date <span className="text-red-500">*</span>
                            </Label>
                            <Input id="date" type="date" defaultValue="2026-02-06" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-xs font-semibold text-gray-600">
                                Amount ($) <span className="text-red-500">*</span>
                            </Label>
                            <Input id="amount" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">
                                Attach Document
                            </Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
                                <Upload className="h-6 w-6 mb-2" />
                                <span className="text-xs">Drag and drop a file here or click</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-xs font-semibold text-gray-600">
                                Description
                            </Label>
                            <Textarea id="description" className="resize-none" rows={3} />
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6">
                                Save
                            </Button>
                        </div>
                    </div>
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
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                    <FileSpreadsheet className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                    <FileText className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
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
                                {filteredData.map((item) => (
                                    <TableRow key={item.id} className="text-sm">
                                        <TableCell className="font-medium text-gray-700 py-3">{item.name}</TableCell>
                                        <TableCell className="text-gray-600 text-xs">{item.description}</TableCell>
                                        <TableCell className="text-gray-600">{item.invoiceNumber}</TableCell>
                                        <TableCell className="text-gray-600">{item.date}</TableCell>
                                        <TableCell className="text-gray-600">{item.expenseHead}</TableCell>
                                        <TableCell className="text-gray-600 text-right">${item.amount.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    size="sm"
                                                    className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2">
                        <div>
                            Showing 1 to {filteredData.length} of {expenseData.length} entries
                        </div>
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled><ChevronLeft className="h-4 w-4" /></Button>
                            <Button variant="default" size="sm" className="h-8 w-8 p-0 bg-indigo-500 hover:bg-indigo-600 text-white">1</Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
