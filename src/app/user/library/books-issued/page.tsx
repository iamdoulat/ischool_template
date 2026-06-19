"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search, ChevronLeft, ChevronRight,
    ArrowUpDown, Video, Copy, FileSpreadsheet,
    FileBox, Printer, Columns
} from "lucide-react";
import { cn } from "@/lib/utils";

const mockBooksIssued = [
    { id: 1, title: 'चंद्र गहना से लौटती बेर"', bookNumber: "5463", author: "Suresh Kumar", issueDate: "04/01/2026", dueReturnDate: "04/01/2026", returnDate: "" },
    { id: 2, title: "Human-environment interactions", bookNumber: "56328", author: "Lokesh Mishra", issueDate: "04/01/2026", dueReturnDate: "04/01/2026", returnDate: "" },
    { id: 3, title: "संसार पुस्तक है।", bookNumber: "657", author: "Robert", issueDate: "05/04/2026", dueReturnDate: "05/04/2026", returnDate: "" },
    { id: 4, title: "The Little Fir Tree", bookNumber: "64342", author: "John", issueDate: "05/04/2026", dueReturnDate: "05/22/2026", returnDate: "" },
    { id: 5, title: "Physical and Chemical Changes", bookNumber: "42355", author: "Arun Gyal", issueDate: "06/02/2026", dueReturnDate: "06/02/2026", returnDate: "" },
    { id: 6, title: "Building With Bricks", bookNumber: "DA23111", author: "David Wood", issueDate: "06/02/2026", dueReturnDate: "06/11/2026", returnDate: "" },
    { id: 7, title: "Respiration in Organisms", bookNumber: "7856", author: "John Wilson", issueDate: "06/02/2026", dueReturnDate: "06/25/2026", returnDate: "" },
    { id: 8, title: "Physical and Chemical Changes", bookNumber: "42355", author: "Arun Gyal", issueDate: "04/01/2026", dueReturnDate: "04/23/2026", returnDate: "04/01/2026" },
    { id: 9, title: "Respiration in Organisms", bookNumber: "123", author: "John Wilson", issueDate: "05/04/2026", dueReturnDate: "05/07/2026", returnDate: "05/08/2026" },
];

export default function UserBooksIssuedPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredData = mockBooksIssued.filter((item) => {
        const searchStr = searchTerm.toLowerCase();
        return (
            item.title.toLowerCase().includes(searchStr) ||
            item.bookNumber.toLowerCase().includes(searchStr) ||
            item.author.toLowerCase().includes(searchStr)
        );
    });

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-t-lg">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Book Issued</h2>
                </div>

                <div className="p-4">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                        <div className="relative">
                            <Input
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-3 pr-10 w-[200px] h-9"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Select defaultValue="50">
                                <SelectTrigger className="w-[70px] h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            
                            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 overflow-hidden">
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none border-r border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800" title="Copy">
                                    <Copy className="h-4 w-4 text-slate-500" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none border-r border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800" title="Excel">
                                    <FileSpreadsheet className="h-4 w-4 text-slate-500" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none border-r border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800" title="CSV">
                                    <FileSpreadsheet className="h-4 w-4 text-slate-500" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none border-r border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800" title="PDF">
                                    <FileBox className="h-4 w-4 text-slate-500" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none border-r border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800" title="Print">
                                    <Printer className="h-4 w-4 text-slate-500" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none hover:bg-slate-100 dark:hover:bg-slate-800" title="Columns">
                                    <Columns className="h-4 w-4 text-slate-500" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 w-[25%]">
                                        <div className="flex items-center justify-between cursor-pointer">
                                            Book Title <ArrowUpDown className="h-3 w-3 opacity-50" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 w-[15%]">
                                        <div className="flex items-center justify-between cursor-pointer">
                                            Book Number <ArrowUpDown className="h-3 w-3 opacity-50" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 w-[20%]">
                                        <div className="flex items-center justify-between cursor-pointer">
                                            Author <ArrowUpDown className="h-3 w-3 opacity-50" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                                        <div className="flex items-center justify-between cursor-pointer">
                                            Issue Date <ArrowUpDown className="h-3 w-3 opacity-50" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                                        <div className="flex items-center justify-between cursor-pointer">
                                            Due Return Date <ArrowUpDown className="h-3 w-3 opacity-50" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right">
                                        <div className="flex items-center justify-end cursor-pointer gap-2">
                                            Return Date
                                        </div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.length > 0 ? (
                                    filteredData.map((item) => (
                                        <TableRow 
                                            key={item.id} 
                                            className={cn(
                                                item.returnDate 
                                                    ? "bg-[#dcfce7] hover:bg-[#dcfce7]/90 dark:bg-green-900/20 dark:hover:bg-green-900/30" 
                                                    : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/50"
                                            )}
                                        >
                                            <TableCell className="font-medium text-slate-700 dark:text-slate-300">{item.title}</TableCell>
                                            <TableCell>{item.bookNumber}</TableCell>
                                            <TableCell>{item.author}</TableCell>
                                            <TableCell>{item.issueDate}</TableCell>
                                            <TableCell>{item.dueReturnDate}</TableCell>
                                            <TableCell className="text-right">{item.returnDate}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No data available in table
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            Showing 1 to {filteredData.length} of {filteredData.length} entries
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-8 w-8 disabled:opacity-50" disabled>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800">
                                1
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 disabled:opacity-50" disabled>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
