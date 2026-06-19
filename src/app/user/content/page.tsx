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
    ArrowUpDown, Copy, FileSpreadsheet,
    FileBox, Printer, Eye
} from "lucide-react";

const contentData = [
    { id: 1, title: "Fees Structure", shareDate: "05/22/2026", validUpto: "05/30/2026", sharedBy: "" },
    { id: 2, title: "School Admission", shareDate: "05/04/2026", validUpto: "05/14/2026", sharedBy: "" },
    { id: 3, title: "Fees", shareDate: "04/10/2026", validUpto: "04/30/2026", sharedBy: "" },
    { id: 4, title: "Admission", shareDate: "04/01/2026", validUpto: "04/16/2026", sharedBy: "" },
    { id: 5, title: "share all", shareDate: "01/22/2026", validUpto: "01/30/2026", sharedBy: "" },
    { id: 6, title: "New CBSE Books List", shareDate: "01/02/2026", validUpto: "01/31/2026", sharedBy: "" },
    { id: 7, title: "Fees Structure", shareDate: "01/01/2026", validUpto: "01/31/2026", sharedBy: "" },
    { id: 8, title: "Fass Updates Structure", shareDate: "12/02/2025", validUpto: "12/31/2025", sharedBy: "" },
    { id: 9, title: "New Books Collection", shareDate: "12/01/2025", validUpto: "12/30/2025", sharedBy: "" },
    { id: 10, title: "New Study Material Books", shareDate: "11/05/2025", validUpto: "11/30/2025", sharedBy: "" },
    { id: 11, title: "Update Fees Details", shareDate: "11/01/2025", validUpto: "11/30/2025", sharedBy: "" },
    { id: 12, title: "Fees Structure details", shareDate: "10/01/2025", validUpto: "10/30/2025", sharedBy: "" },
    { id: 13, title: "New Cbse Books", shareDate: "08/01/2025", validUpto: "08/30/2025", sharedBy: "" },
    { id: 14, title: "English Syllabus", shareDate: "07/01/2025", validUpto: "07/30/2025", sharedBy: "" },
    { id: 15, title: "Science Study Syllabus", shareDate: "07/01/2025", validUpto: "07/31/2025", sharedBy: "" },
    { id: 16, title: "New Books List", shareDate: "06/03/2025", validUpto: "06/30/2025", sharedBy: "" },
    { id: 17, title: "Fees-Structure", shareDate: "05/01/2025", validUpto: "05/31/2025", sharedBy: "" },
    { id: 18, title: "Long Short Mathematics", shareDate: "04/05/2025", validUpto: "04/30/2025", sharedBy: "" },
    { id: 19, title: "Chapter 4 Fraction", shareDate: "04/01/2025", validUpto: "04/30/2025", sharedBy: "William Abbot (9003)" }
];

export default function UserContentPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState("100");
    const [currentPage, setCurrentPage] = useState(1);

    // Filter by search term
    const filteredData = contentData.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.sharedBy.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sizeNum = parseInt(itemsPerPage, 10) || 100;
    const totalEntries = filteredData.length;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;
    
    const paginatedData = filteredData.slice(startIndex, startIndex + sizeNum);

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-100 p-4">
                    <h1 className="text-[15px] font-medium text-gray-700 tracking-tight">Content List</h1>
                </div>

                <div className="p-4 space-y-4">
                    {/* Table Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-8 text-[12px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center mr-2">
                                <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}>
                                    <SelectTrigger className="h-8 w-16 text-[12px] border-gray-200 shadow-none rounded font-medium">
                                        <SelectValue placeholder="100" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-1 text-gray-500">
                                {[Copy, FileSpreadsheet, FileBox, Printer].map((Icon, i) => (
                                    <Button key={i} variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100 rounded text-gray-500">
                                        <Icon className="h-4 w-4" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded border border-gray-100 overflow-x-auto custom-scrollbar">
                        <Table className="min-w-[1000px]">
                            <TableHeader className="bg-transparent border-b border-gray-100">
                                <TableRow className="hover:bg-transparent whitespace-nowrap text-[12px] font-bold text-gray-700">
                                    <TableHead className="py-3 px-4 h-auto">Title <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Share Date <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Valid Upto <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Shared By <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedData.length === 0 ? (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={5} className="text-center py-8 text-gray-500 text-sm">
                                            No data available in table
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedData.map((item, idx) => (
                                        <TableRow key={item.id || idx} className="text-[13px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors whitespace-nowrap text-gray-600">
                                            <TableCell className="py-3 px-4">{item.title}</TableCell>
                                            <TableCell className="py-3 px-4">{item.shareDate}</TableCell>
                                            <TableCell className="py-3 px-4">{item.validUpto}</TableCell>
                                            <TableCell className="py-3 px-4">{item.sharedBy}</TableCell>
                                            <TableCell className="py-3 px-4 text-right">
                                                <Button 
                                                    className="bg-[#7e57c2] hover:bg-[#7048b6] text-white px-2.5 h-6 rounded shadow-none flex items-center justify-center transition-all active:scale-95 ml-auto"
                                                    title="View Content"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Footer Pagination */}
                    <div className="flex items-center justify-between text-[12px] text-gray-500 pt-2 pb-2">
                        <div>
                            Showing {totalEntries > 0 ? startIndex + 1 : 0} to{" "}
                            {Math.min(startIndex + sizeNum, totalEntries)} of {totalEntries} entries
                        </div>

                        {totalEntries > 0 && (
                            <div className="flex items-center gap-1 border border-gray-200 rounded overflow-hidden">
                                <button
                                    disabled={safePage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                    className="h-8 px-2 bg-white hover:bg-gray-50 text-gray-400 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 border-r border-gray-200"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button className="h-8 px-3 text-xs flex items-center justify-center bg-[#6366f1] text-white font-medium border-r border-gray-200">
                                    1
                                </button>
                                <button
                                    disabled={safePage === totalPages}
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                    className="h-8 px-2 bg-white hover:bg-gray-50 text-gray-400 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
