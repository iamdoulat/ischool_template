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

const mockClasses = [
    { id: 1, title: "Computer Science", dateTime: "06/15/2026 10:11:00", duration: 60, className: "Class 1 (A)", host: "Nishant Khare (Teacher : 1002)", description: "", status: "Awaited", url: "#" },
    { id: 2, title: "Extra Class Social Studies", dateTime: "06/08/2026 10:00:00", duration: 60, className: "Class 1 (A)", host: "Shivam Verma (Teacher : 9002)", description: "", status: "Awaited", url: "#" },
    { id: 3, title: "Doubt Question Answer", dateTime: "05/20/2026 10:00:00", duration: 60, className: "Class 1 (A)", host: "Nishant Khare (Teacher : 1002)", description: "", status: "Awaited", url: "#" },
    { id: 4, title: "Exam Preparation", dateTime: "05/15/2026 10:30:00", duration: 60, className: "Class 1 (A)", host: "Jason Sharlton (Teacher : 90006)", description: "", status: "Awaited", url: "#" },
    { id: 5, title: "Maths Extra Class", dateTime: "05/11/2026 10:30:00", duration: 60, className: "Class 1 (A)", host: "Shivam Verma (Teacher : 9002)", description: "", status: "Awaited", url: "#" },
    { id: 6, title: "Computer Studies Classes", dateTime: "04/25/2026 10:35:00", duration: 45, className: "Class 1 (A)", host: "Nishant Khare (Teacher : 1002)", description: "", status: "Finished", url: "#" },
    { id: 7, title: "Chemistry Revision Class", dateTime: "04/15/2026 10:34:00", duration: 45, className: "Class 1 (A)", host: "Jason Sharlton (Teacher : 90006)", description: "", status: "Awaited", url: "#" },
    { id: 8, title: "Board Exam Preparation", dateTime: "04/10/2026 10:33:00", duration: 45, className: "Class 1 (A)", host: "Shivam Verma (Teacher : 9002)", description: "", status: "Cancelled", url: "#" }
];

export default function UserZoomLiveClassesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState("50");
    const [currentPage, setCurrentPage] = useState(1);

    // Filter by search term
    const filteredData = mockClasses.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.host.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sizeNum = parseInt(itemsPerPage, 10) || 50;
    const totalEntries = filteredData.length;
    const totalPages = Math.ceil(totalEntries / sizeNum) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * sizeNum;
    
    const paginatedData = filteredData.slice(startIndex, startIndex + sizeNum);

    const getStatusStyle = (status: string) => {
        switch(status) {
            case 'Awaited': return 'bg-[#ff9800] text-white';
            case 'Finished': return 'bg-[#4caf50] text-white';
            case 'Cancelled': return 'bg-[#e0e0e0] text-gray-600';
            default: return 'bg-gray-200 text-gray-700';
        }
    };

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-100 p-4">
                    <h1 className="text-[15px] font-medium text-gray-700 tracking-tight">Live Classes</h1>
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
                                    <TableHead className="py-3 px-4 h-auto">Class Title <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Date Time <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Class Duration (Minutes) <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Class <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Class Host <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Description</TableHead>
                                    <TableHead className="py-3 px-4 h-auto text-center">Status <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
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
                                    paginatedData.map((item, idx) => (
                                        <TableRow key={item.id || idx} className="text-[13px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors whitespace-nowrap">
                                            <TableCell className="py-3 px-4 text-[#6366f1]">{item.title}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-600">{item.dateTime}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-600">{item.duration}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-600">{item.className}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-600">{item.host}</TableCell>
                                            <TableCell className="py-3 px-4 text-gray-600">{item.description}</TableCell>
                                            <TableCell className="py-3 px-4 text-center">
                                                <span className={cn(
                                                    "inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-medium",
                                                    getStatusStyle(item.status)
                                                )}>
                                                    {item.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-right">
                                                {item.status === 'Awaited' && (
                                                    <Button 
                                                        onClick={() => {
                                                            if (item.url) window.open(item.url, '_blank');
                                                        }}
                                                        className="bg-[#4caf50] hover:bg-[#43a047] text-white px-2 h-6 text-[11px] font-bold rounded shadow-none flex items-center gap-1 transition-all active:scale-95 ml-auto"
                                                    >
                                                        <Video className="h-3 w-3" />
                                                        Join
                                                    </Button>
                                                )}
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
