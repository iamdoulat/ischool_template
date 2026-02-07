"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Upload, Copy, FileSpreadsheet, FileText, Printer, Columns, Pencil, Trash2 } from "lucide-react";

interface IncomeRecord {
    id: string;
    name: string;
    description: string;
    invoiceNumber: string;
    date: string;
    incomeHead: string;
    amount: number;
}

const incomeData: IncomeRecord[] = [
    {
        id: "1",
        name: "Student Uniform",
        description: "Dress codes are used to communicate to employees what the organization considers appropriate work attire.",
        invoiceNumber: "6756",
        date: "02/17/2026",
        incomeHead: "Uniform Sale",
        amount: 250.00,
    },
    {
        id: "2",
        name: "Monthly Bus Rent",
        description: "The transporting students to and from school or school-related activities. often through a charter bus.",
        invoiceNumber: "0987",
        date: "02/14/2026",
        incomeHead: "Rent",
        amount: 200.00,
    },
    {
        id: "3",
        name: "Happy Independence Day Celebration",
        description: "Happy Independence Day! Let's celebrate the freedom and unity of our nation, remembering the sacrifices of our heroes and striving for a better future.",
        invoiceNumber: "5443",
        date: "02/25/2026",
        incomeHead: "Miscellaneous",
        amount: 150.00,
    },
    {
        id: "4",
        name: "NCRT NEW Books Publisher",
        description: "NCRT Books are essential materials for students of all classes.",
        invoiceNumber: "",
        date: "02/11/2026",
        incomeHead: "Book Sale",
        amount: 200.00,
    },
    {
        id: "5",
        name: "School Donation",
        description: "Donation fee is fee which you have to give to make you eligible for admission",
        invoiceNumber: "67567",
        date: "02/02/2026",
        incomeHead: "Donation",
        amount: 250.00,
    },
    {
        id: "6",
        name: "Fees Donation",
        description: "Donation fee is fee which you have to give to make you eligible for admission e.g.",
        invoiceNumber: "3423",
        date: "01/30/2026",
        incomeHead: "Donation",
        amount: 250.00,
    },
    {
        id: "7",
        name: "Happy Independence Day Celebration",
        description: "Happy Independence Day! Let's celebrate the freedom and unity of our nation, remembering the sacrifices of our heroes and striving for a better future.",
        invoiceNumber: "3422",
        date: "01/27/2026",
        incomeHead: "Miscellaneous",
        amount: 200.00,
    },
    {
        id: "8",
        name: "Monthly Bus Rent",
        description: "The transporting students to and from school or school-related activities. often through a charter bus.",
        invoiceNumber: "5234",
        date: "01/22/2026",
        incomeHead: "Rent",
        amount: 150.00,
    },
    {
        id: "9",
        name: "NCRT NEW Books Publisher",
        description: "NCRT Books are essential materials for students of all classes.",
        invoiceNumber: "8794",
        date: "01/17/2026",
        incomeHead: "Book Sale",
        amount: 150.00,
    },
    {
        id: "10",
        name: "Class III to V - Patriotic Song Competition",
        description: "A patriotic song competition will be held for students of classes III to V. encouraging them to express their love for the country.",
        invoiceNumber: "2341",
        date: "01/12/2026",
        incomeHead: "Miscellaneous",
        amount: 150.00,
    },
    {
        id: "11",
        name: "School Donation",
        description: "Donation fee is fee which you have to give to make you eligible for admission e.g.",
        invoiceNumber: "88678",
        date: "01/06/2026",
        incomeHead: "Donation",
        amount: 200.00,
    },
];

export default function AddIncomePage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState("50");

    const filteredData = incomeData.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Add Income Form */}
                <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4 h-fit">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Add Income</h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="income-head" className="text-xs font-semibold text-gray-600">
                                Income Head <span className="text-red-500">*</span>
                            </Label>
                            <Select>
                                <SelectTrigger id="income-head">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="donation">Donation</SelectItem>
                                    <SelectItem value="features-sale">Book Sale</SelectItem>
                                    <SelectItem value="uniform-sale">Uniform Sale</SelectItem>
                                    <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
                                    <SelectItem value="rent">Rent</SelectItem>
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
                            <Input id="date" type="date" />
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

                {/* Right Column: Income List */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-4 space-y-4">
                    <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Income List</h2>

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
                                    <TableHead className="font-semibold text-gray-600 whitespace-nowrap">Income Head</TableHead>
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
                                        <TableCell className="text-gray-600">{item.incomeHead}</TableCell>
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
                </div>

            </div>
        </div>
    );
}
