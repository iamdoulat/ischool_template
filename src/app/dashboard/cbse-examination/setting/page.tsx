"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, FileSpreadsheet, FileText, Printer, Columns, Pencil, X, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CategoryRecord {
    id: string;
    category: string;
}

const categoryData: CategoryRecord[] = [
    { id: "1", category: "Main Subjects" },
    { id: "2", category: "Internal Assessment" },
];

const menuItems = [
    { name: "Exam Category", active: true },
    { name: "Exam Grade", active: false },
    { name: "Assessment", active: false },
    { name: "Term", active: false },
];

export default function CBSESettingsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState("50");

    const filteredData = categoryData.filter((item) =>
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column: Settings Menu */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <nav className="flex flex-col">
                            {menuItems.map((item) => (
                                <button
                                    key={item.name}
                                    className={cn(
                                        "text-left px-4 py-3 text-sm font-medium border-l-2 transition-colors",
                                        item.active
                                            ? "border-indigo-500 text-indigo-600 bg-indigo-50"
                                            : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    )}
                                >
                                    {item.name}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Middle Column: Create Category Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4 h-fit">
                        <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Create Category</h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-xs font-semibold text-gray-600">
                                    Category <span className="text-red-500">*</span>
                                </Label>
                                <Input id="category" />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6">
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Category List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
                        <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Category List</h2>

                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex w-full md:w-auto items-center gap-2">
                                <div className="relative w-full md:w-48">
                                    <Input
                                        placeholder="Search"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-3"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                                    <SelectTrigger className="w-[70px] h-8 text-xs">
                                        <SelectValue placeholder="50" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center gap-1 text-gray-500">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                        <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                        <Columns className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50 text-xs uppercase">
                                    <TableRow>
                                        <TableHead className="font-semibold text-gray-600 w-full">Category</TableHead>
                                        <TableHead className="font-semibold text-gray-600 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.map((item) => (
                                        <TableRow key={item.id} className="text-sm">
                                            <TableCell className="font-medium text-gray-700 py-3">{item.category}</TableCell>
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
                                Showing 1 to {filteredData.length} of {categoryData.length} entries
                            </div>
                            <div className="flex gap-1">
                                <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled><ChevronLeft className="h-3.5 w-3.5" /></Button>
                                <Button variant="default" size="sm" className="h-7 w-7 p-0 bg-indigo-500 hover:bg-indigo-600 text-white">1</Button>
                                <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled><ChevronRight className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
