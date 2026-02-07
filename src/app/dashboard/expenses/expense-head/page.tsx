"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, FileSpreadsheet, FileText, Printer, Columns, Pencil, X, ChevronLeft, ChevronRight } from "lucide-react";

interface ExpenseHeadRecord {
    id: string;
    expenseHead: string;
    description: string;
}

const expenseHeadData: ExpenseHeadRecord[] = [
    { id: "1", expenseHead: "Stationery Purchase", description: "" },
    { id: "2", expenseHead: "Electricity Bill", description: "" },
    { id: "3", expenseHead: "Telephone Bill", description: "" },
    { id: "4", expenseHead: "Miscellaneous", description: "" },
    { id: "5", expenseHead: "Flower", description: "" },
];

export default function ExpenseHeadPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState("50");

    const filteredData = expenseHeadData.filter((item) =>
        item.expenseHead.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Add Expense Head Form */}
                <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4 h-fit">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Add Expense Head</h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="expense-head" className="text-xs font-semibold text-gray-600">
                                Expense Head <span className="text-red-500">*</span>
                            </Label>
                            <Input id="expense-head" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-xs font-semibold text-gray-600">
                                Description
                            </Label>
                            <Textarea id="description" className="resize-none" rows={4} />
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6">
                                Save
                            </Button>
                        </div>
                    </div>
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
                                    <TableHead className="font-semibold text-gray-600">Expense Head</TableHead>
                                    <TableHead className="font-semibold text-gray-600 w-full">Description</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((item) => (
                                    <TableRow key={item.id} className="text-sm">
                                        <TableCell className="font-medium text-gray-700 py-3">{item.expenseHead}</TableCell>
                                        <TableCell className="text-gray-600">{item.description}</TableCell>
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
                                                    <X className="h-4 w-4" />
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
                            Showing 1 to {filteredData.length} of {expenseHeadData.length} entries
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
