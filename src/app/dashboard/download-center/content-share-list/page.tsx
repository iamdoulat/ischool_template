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
    Search,
    Copy,
    FileSpreadsheet,
    FileText,
    Printer,
    Columns,
    ChevronLeft,
    ChevronRight,
    Eye,
    Trash2,
    ArrowUpDown,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SharedContent {
    id: string;
    title: string;
    sendTo: string;
    shareDate: string;
    validUpto: string;
    sharedBy: string;
    description: string;
}

const mockSharedContent: SharedContent[] = [
    { id: "1", title: "share all", sendTo: "Group", shareDate: "01/22/2026", validUpto: "01/30/2026", sharedBy: "Joe Black (9000)", description: "No Description" },
    { id: "2", title: "New CBSE Books List", sendTo: "Group", shareDate: "01/02/2026", validUpto: "01/31/2026", sharedBy: "Joe Black (9000)", description: "New CBSE Books List" },
    { id: "3", title: "Fees Structure", sendTo: "Group", shareDate: "01/01/2026", validUpto: "01/31/2026", sharedBy: "Joe Black (9000)", description: "Fees Structure" },
    { id: "4", title: "Fees Updates Structure", sendTo: "Group", shareDate: "12/02/2025", validUpto: "12/31/2025", sharedBy: "Joe Black (9000)", description: "Fees Updates Structure" },
    { id: "5", title: "New Books Collection", sendTo: "Group", shareDate: "12/01/2025", validUpto: "12/30/2025", sharedBy: "Joe Black (9000)", description: "New Books Collection" },
    { id: "6", title: "New Study Material Books", sendTo: "Group", shareDate: "11/05/2025", validUpto: "11/30/2025", sharedBy: "Joe Black (9000)", description: "New Study Material Books" },
    { id: "7", title: "Update Fees Details", sendTo: "Group", shareDate: "11/01/2025", validUpto: "11/30/2025", sharedBy: "Joe Black (9000)", description: "Update Fees Details" },
    { id: "8", title: "Fees Structure details", sendTo: "Group", shareDate: "10/01/2025", validUpto: "10/30/2025", sharedBy: "Joe Black (9000)", description: "Fees Structure details" },
    { id: "9", title: "New Cbse Books", sendTo: "Group", shareDate: "08/01/2025", validUpto: "08/30/2025", sharedBy: "Joe Black (9000)", description: "New Cbse Books" },
    { id: "10", title: "English Syllabus", sendTo: "Group", shareDate: "07/01/2025", validUpto: "07/31/2025", sharedBy: "Joe Black (9000)", description: "English Syllabus" },
    { id: "11", title: "Science Study Syllabus", sendTo: "Group", shareDate: "07/01/2025", validUpto: "07/31/2025", sharedBy: "Joe Black (9000)", description: "Science Study Syllabus" },
    { id: "12", title: "New Books List", sendTo: "Group", shareDate: "08/03/2025", validUpto: "08/30/2025", sharedBy: "Joe Black (9000)", description: "No Description" },
    { id: "13", title: "Fees-Structure", sendTo: "Group", shareDate: "05/01/2025", validUpto: "05/31/2025", sharedBy: "Joe Black (9000)", description: "Fees-Structure" },
    { id: "14", title: "Long Short Mathematics", sendTo: "Group", shareDate: "04/05/2025", validUpto: "04/30/2025", sharedBy: "Joe Black (9000)", description: "Long Short" },
    { id: "15", title: "Chapter 4 Fraction", sendTo: "Group", shareDate: "04/01/2025", validUpto: "04/30/2025", sharedBy: "William Abbot (9003)", description: "Chapter 4 Fraction" },
];

export default function ContentShareListPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredContent = mockSharedContent.filter(
        (item) =>
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-sm font-medium text-gray-800">Content Share List</h1>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-4 space-y-4">
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
                                <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded">
                                    <Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Table */}
                <div className="rounded border border-gray-50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100">
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Title <ArrowUpDown className="h-2.5 w-2.5" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Send To <ArrowUpDown className="h-2.5 w-2.5" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Share Date <ArrowUpDown className="h-2.5 w-2.5" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Valid Upto <ArrowUpDown className="h-2.5 w-2.5" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1">Shared By <ArrowUpDown className="h-2.5 w-2.5" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Description</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredContent.map((item) => (
                                <TableRow key={item.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                                    <TableCell className="py-3 text-gray-700 font-medium">{item.title}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{item.sendTo}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{item.shareDate}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{item.validUpto}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{item.sharedBy}</TableCell>
                                    <TableCell className="py-3 text-gray-500 truncate max-w-[200px]">{item.description}</TableCell>
                                    <TableCell className="py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded">
                                                <Eye className="h-3 w-3" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded">
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-50">
                    <div>
                        Showing 1 to {filteredContent.length} of {mockSharedContent.length} entries
                    </div>
                    <div className="flex gap-1 items-center">
                        <span className="text-gray-400 mr-2 cursor-pointer hover:text-gray-600 text-sm">‹</span>
                        <Button variant="default" size="sm" className="h-6 w-6 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0 text-[10px] rounded">
                            1
                        </Button>
                        <span className="text-gray-400 ml-2 cursor-pointer hover:text-gray-600 text-sm">›</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
