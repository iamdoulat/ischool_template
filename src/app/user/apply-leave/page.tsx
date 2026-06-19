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
    FileBox, Printer, Columns, Plus, Pencil, X
} from "lucide-react";
import { cn } from "@/lib/utils";

const leavesData = [
    { id: 1, class: "Class 1", section: "A", applyDate: "04/01/2026", fromDate: "04/16/2026", toDate: "04/17/2026", reason: "sick", status: "Pending" },
    { id: 2, class: "Class 1", section: "A", applyDate: "04/01/2026", fromDate: "04/03/2026", toDate: "04/04/2026", reason: "emergency", status: "Pending" },
    { id: 3, class: "Class 1", section: "A", applyDate: "04/02/2026", fromDate: "04/03/2026", toDate: "04/04/2026", reason: "SICK", status: "Approved (04/02/2026)" },
    { id: 4, class: "Class 1", section: "A", applyDate: "05/01/2026", fromDate: "05/05/2026", toDate: "05/09/2026", reason: "sick", status: "Pending" },
    { id: 5, class: "Class 1", section: "A", applyDate: "05/01/2026", fromDate: "05/15/2026", toDate: "05/19/2026", reason: "", status: "Pending" },
    { id: 6, class: "Class 1", section: "A", applyDate: "05/01/2026", fromDate: "05/05/2026", toDate: "05/07/2026", reason: "", status: "Approved (05/01/2026)" },
    { id: 7, class: "Class 1", section: "A", applyDate: "05/06/2026", fromDate: "05/14/2026", toDate: "05/16/2026", reason: "", status: "Approved (05/01/2026)" },
    { id: 8, class: "Class 1", section: "A", applyDate: "05/04/2026", fromDate: "05/27/2026", toDate: "05/29/2026", reason: "", status: "Pending" },
    { id: 9, class: "Class 1", section: "A", applyDate: "06/01/2026", fromDate: "06/04/2026", toDate: "06/06/2026", reason: "", status: "Pending" },
    { id: 10, class: "Class 1", section: "A", applyDate: "06/25/2026", fromDate: "06/26/2026", toDate: "06/30/2026", reason: "", status: "Approved (06/01/2026)" },
    { id: 11, class: "Class 1", section: "A", applyDate: "06/01/2026", fromDate: "06/03/2026", toDate: "06/06/2026", reason: "", status: "Pending" },
    { id: 12, class: "Class 1", section: "A", applyDate: "06/01/2026", fromDate: "06/24/2026", toDate: "06/26/2026", reason: "", status: "Pending" },
    { id: 13, class: "Class 1", section: "A", applyDate: "06/02/2026", fromDate: "06/03/2026", toDate: "06/06/2026", reason: "", status: "Pending" },
    { id: 14, class: "Class 1", section: "A", applyDate: "06/02/2026", fromDate: "06/24/2026", toDate: "06/27/2026", reason: "", status: "Pending" }
];

export default function UserApplyLeavePage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState("50");
    const [currentPage, setCurrentPage] = useState(1);

    // Filter by search term
    const filteredData = leavesData.filter(c =>
        c.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.applyDate.includes(searchTerm)
    );

    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const totalEntries = filteredData.length;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;
    
    const paginatedData = filteredData.slice(startIndex, startIndex + sizeNum);

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 p-4">
                    <h1 className="text-[15px] font-medium text-gray-700 tracking-tight">Leave List</h1>
                    <Button className="bg-[#7e57c2] hover:bg-[#7048b6] text-white px-3 h-8 text-[12px] font-medium rounded shadow-none transition-all active:scale-95 flex items-center gap-1.5">
                        <Plus className="h-3.5 w-3.5" />
                        Add
                    </Button>
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
                                        <SelectValue placeholder="50" />
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
                                {[Copy, FileSpreadsheet, FileBox, Printer, Columns].map((Icon, i) => (
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
                                    <TableHead className="py-3 px-4 h-auto">Class <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Section <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Apply Date <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">From Date <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">To Date <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Reason</TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Status <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedData.length === 0 ? (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={8} className="text-center py-8 text-gray-500 text-sm">
                                            No data available in table
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedData.map((item, idx) => {
                                        const isApproved = item.status.startsWith("Approved");
                                        return (
                                            <TableRow key={item.id || idx} className="text-[13px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors whitespace-nowrap text-gray-600">
                                                <TableCell className="py-3 px-4">{item.class}</TableCell>
                                                <TableCell className="py-3 px-4">{item.section}</TableCell>
                                                <TableCell className="py-3 px-4">{item.applyDate}</TableCell>
                                                <TableCell className="py-3 px-4">{item.fromDate}</TableCell>
                                                <TableCell className="py-3 px-4">{item.toDate}</TableCell>
                                                <TableCell className="py-3 px-4">{item.reason}</TableCell>
                                                <TableCell className="py-3 px-4">
                                                    <span className={cn(
                                                        "inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-bold text-white shadow-sm",
                                                        isApproved ? "bg-[#4caf50]" : "bg-[#f89b29]"
                                                    )}>
                                                        {item.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {!isApproved && (
                                                            <>
                                                                <Button 
                                                                    className="bg-[#7e57c2] hover:bg-[#7048b6] text-white p-1 h-6 w-6 rounded shadow-none flex items-center justify-center transition-all active:scale-95"
                                                                    title="Edit"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button 
                                                                    className="bg-[#7e57c2] hover:bg-[#7048b6] text-white p-1 h-6 w-6 rounded shadow-none flex items-center justify-center transition-all active:scale-95"
                                                                    title="Delete"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
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
