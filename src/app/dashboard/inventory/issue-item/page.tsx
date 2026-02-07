"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Plus,
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Trash2,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface InventoryIssue {
    id: string;
    item: string;
    note: string;
    itemCategory: string;
    issuePeriod: string;
    issueTo: string;
    issuedBy: string;
    quantity: number;
    status: "pending" | "returned";
}

const mockIssues: InventoryIssue[] = [
    { id: "1", item: "Football", note: "", itemCategory: "Sports", issuePeriod: "02/11/2025 - 02/21/2025", issueTo: "aman (GS4)", issuedBy: "William Abbot (9003)", quantity: 2, status: "pending" },
    { id: "2", item: "Lab Equipment", note: "", itemCategory: "Chemistry Lab Apparatus", issuePeriod: "02/24/2025 - 02/28/2025", issueTo: "Nishant Khare (1002)", issuedBy: "Nishant Khare (1002)", quantity: 13, status: "pending" },
    { id: "3", item: "Class Board", note: "", itemCategory: "Books Stationery", issuePeriod: "02/18/2025 - 02/27/2025", issueTo: "Brandon Heart (9003)", issuedBy: "James Decker (9004)", quantity: 12, status: "pending" },
    { id: "4", item: "Paper and Pencils", note: "", itemCategory: "Books Stationery", issuePeriod: "02/17/2025 - 02/20/2025", issueTo: "James Decker (9004)", issuedBy: "William Abbot (9003)", quantity: 5, status: "pending" },
    { id: "5", item: "Uniform", note: "", itemCategory: "Staff Dress", issuePeriod: "02/11/2025 - 02/17/2025", issueTo: "Shivam Verma (9002)", issuedBy: "Brandon Heart (9006)", quantity: 3, status: "pending" },
    { id: "6", item: "Cricket Bat", note: "", itemCategory: "Sports", issuePeriod: "02/04/2025 - 02/09/2025", issueTo: "William Abbot (9003)", issuedBy: "Joe Black (9000)", quantity: 2, status: "pending" },
    { id: "7", item: "Cricket Bat", note: "", itemCategory: "Sports", issuePeriod: "01/22/2025 - 01/23/2025", issueTo: "Shivam Verma (9002)", issuedBy: "aman (GS4)", quantity: 23, status: "pending" },
    { id: "8", item: "Staff Uniform", note: "", itemCategory: "Staff Dress", issuePeriod: "01/27/2025 - 01/31/2025", issueTo: "William Abbot (9003)", issuedBy: "Shivam Verma (9002)", quantity: 2, status: "pending" },
    { id: "9", item: "Projectors", note: "", itemCategory: "Chemistry Lab Apparatus", issuePeriod: "01/22/2025 - 01/27/2025", issueTo: "Jason Sharkey (90006)", issuedBy: "Joe Black (9000)", quantity: 2, status: "pending" },
    { id: "10", item: "Benches", note: "", itemCategory: "Furniture", issuePeriod: "01/17/2025 - 01/25/2025", issueTo: "Maria Ford (9005)", issuedBy: "Brandon Heart (9006)", quantity: 5, status: "returned" },
    { id: "11", item: "Notebooks", note: "", itemCategory: "Books Stationery", issuePeriod: "01/06/2025 - 01/13/2025", issueTo: "Brandon Heart (9003)", issuedBy: "Shivam Verma (9002)", quantity: 5, status: "pending" },
    { id: "12", item: "Class Board", note: "", itemCategory: "Books Stationery", issuePeriod: "01/03/2025 - 01/03/2025", issueTo: "Shivam Verma (9002)", issuedBy: "William Abbot (9003)", quantity: 2, status: "returned" },
];

export default function IssueItemPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredIssues = mockIssues.filter((issue) =>
        issue.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.issueTo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-sm font-medium text-gray-800 tracking-tight">Issue Item List</h1>
                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-7 px-3 text-[10px] font-bold uppercase transition-all rounded shadow-sm">
                    <Plus className="h-3 w-3" /> Issue Item
                </Button>
            </div>

            <div className="bg-white rounded shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-3 h-8 text-[11px] border-gray-200 focus-visible:ring-indigo-500 rounded shadow-none"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">50</span>
                            <Select defaultValue="50">
                                <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none rounded">
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
                            {[Copy, FileSpreadsheet, FileText, Printer, Columns].map((Icon, i) => (
                                <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded text-gray-400">
                                    <Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Action Table */}
                <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1200px]">
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Item <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Note <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Item Category <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Issue - Return</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Issue To <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Issued By <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Quantity <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Status</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredIssues.map((issue) => (
                                <TableRow key={issue.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                    <TableCell className="py-3 text-gray-700 font-medium">{issue.item}</TableCell>
                                    <TableCell className="py-3 text-gray-400">{issue.note || "-"}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{issue.itemCategory}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{issue.issuePeriod}</TableCell>
                                    <TableCell className="py-3 text-gray-700 font-medium">{issue.issueTo}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{issue.issuedBy}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{issue.quantity}</TableCell>
                                    <TableCell className="py-3">
                                        {issue.status === "pending" ? (
                                            <Button className="h-5 px-2 bg-red-500 hover:bg-red-600 text-white text-[9px] font-bold rounded uppercase whitespace-nowrap">
                                                Click to Return
                                            </Button>
                                        ) : (
                                            <span className="h-5 px-2 bg-green-500 text-white text-[9px] font-bold rounded uppercase flex items-center justify-center w-fit">
                                                Returned
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-3 text-right">
                                        <Button size="icon" variant="ghost" className="h-6 w-6 bg-[#6366f1] hover:bg-[#5558dd] text-white rounded shadow-sm">
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-50">
                    <div>
                        Showing 1 to {filteredIssues.length} of {mockIssues.length} entries
                    </div>
                    <div className="flex gap-1 items-center">
                        <span className="text-gray-400 mr-2 cursor-pointer hover:text-gray-600 text-[10px]">‹</span>
                        <Button variant="default" size="sm" className="h-6 w-6 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0 text-[10px] rounded">
                            1
                        </Button>
                        <span className="text-gray-400 ml-2 cursor-pointer hover:text-gray-600 text-[10px]">›</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
