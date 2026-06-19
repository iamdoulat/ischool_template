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
    ArrowUpDown, Copy, FileSpreadsheet,
    FileBox, Printer, Columns, Plus, Star, ChevronLeft, ChevronRight
} from "lucide-react";

const reviewsData = [
    {
        id: 1,
        teacherName: "Shivam Verma (9002)",
        isClassTeacher: true,
        email: "manisha@gmail.com",
        phone: "9552654564",
        rating: 3,
        comment: "GOOD",
        schedule: [
            { subject: "English theory (210)", time: "Monday (8:00 AM To 08:45 AM)", room: "100" },
            { subject: "English theory (210)", time: "Tuesday (8:00 AM To 08:30 AM)", room: "12" },
            { subject: "English theory (210)", time: "Wednesday (8:00 AM To 08:30 AM)", room: "12" },
            { subject: "English theory (210)", time: "Thursday (8:00 AM To 08:30 AM)", room: "12" },
            { subject: "Science practical (111)", time: "Saturday (8:00 AM To 08:30 AM)", room: "12" },
            { subject: "English theory (210)", time: "Friday (9:40 AM To 10:05 AM)", room: "12" }
        ]
    },
    {
        id: 2,
        teacherName: "Jason Sharlton (90006)",
        isClassTeacher: true,
        email: "jason@gmail.com",
        phone: "46546654564",
        rating: null,
        comment: "",
        schedule: [
            { subject: "Hindi theory (230)", time: "Monday (8:45 AM To 9:30 AM)", room: "100" },
            { subject: "Hindi theory (230)", time: "Tuesday (08:35 AM To 09:05 AM)", room: "12" },
            { subject: "Hindi theory (230)", time: "Wednesday (08:35 AM To 09:05 AM)", room: "12" },
            { subject: "Hindi theory (230)", time: "Thursday (08:35 AM To 09:05 AM)", room: "12" },
            { subject: "Hindi theory (230)", time: "Friday (8:00 AM To 08:30 AM)", room: "12" }
        ]
    },
    {
        id: 3,
        teacherName: "Nishant Khare (1002)",
        isClassTeacher: false,
        email: "nishant@gmail.com",
        phone: "9865757657",
        rating: null,
        comment: "",
        schedule: [
            { subject: "Mathematics practical (110)", time: "Monday (9:30 AM To 10:15 AM)", room: "100" },
            { subject: "Mathematics practical (110)", time: "Tuesday (09:10 AM To 09:40 AM)", room: "12" },
            { subject: "Mathematics practical (110)", time: "Wednesday (09:10 AM To 09:40 AM)", room: "12" },
            { subject: "Mathematics practical (110)", time: "Thursday (09:10 AM To 09:40 AM)", room: "12" },
            { subject: "Mathematics practical (110)", time: "Friday (08:35 AM To 09:05 AM)", room: "12" }
        ]
    },
    {
        id: 4,
        teacherName: "Aman Verma (654)",
        isClassTeacher: false,
        email: "aman@gmail.com",
        phone: "",
        rating: null,
        comment: "",
        schedule: [
            { subject: "Science practical (111)", time: "Monday (10:15 AM To 11:00 AM)", room: "100" },
            { subject: "Science practical (111)", time: "Tuesday (09:45 AM To 10:15 AM)", room: "12" },
            { subject: "Science practical (111)", time: "Wednesday (09:45 AM To 10:15 AM)", room: "12" },
            { subject: "Science practical (111)", time: "Thursday (09:45 AM To 10:15 AM)", room: "12" },
            { subject: "Science practical (111)", time: "Friday (09:10 AM To 9:40 AM)", room: "12" },
            { subject: "English theory (210)", time: "Saturday (08:35 AM To 09:05 AM)", room: "12" }
        ]
    }
];

function RatingStars({ rating }: { rating: number | null }) {
    if (rating === null) return null;
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                    key={star} 
                    className={`h-3 w-3 ${star <= rating ? "text-[#f39c12] fill-[#f39c12]" : "text-gray-300 fill-gray-300"}`} 
                />
            ))}
            <span className="ml-1 font-bold text-gray-700 text-[12px]">{rating}</span>
        </div>
    );
}

export default function UserTeachersReviewsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState("50");
    const [currentPage, setCurrentPage] = useState(1);

    const filteredData = reviewsData.filter(c =>
        c.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
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
                <div className="border-b border-gray-100 p-4 flex justify-between items-center">
                    <h1 className="text-[15px] font-medium text-gray-700 tracking-tight">Teachers Reviews</h1>
                </div>

                <div className="p-4 space-y-4">
                    {/* Table Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search"
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
                        <Table className="min-w-[1200px]">
                            <TableHeader className="bg-transparent border-b border-gray-100">
                                <TableRow className="hover:bg-transparent whitespace-nowrap text-[12px] font-bold text-gray-700">
                                    <TableHead className="py-3 px-4 h-auto">Teacher Name <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Subject <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Time <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto text-center">Room No.</TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Email <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Phone <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">My Rating <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Comment <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto text-right">Rate</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedData.length === 0 ? (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={9} className="text-center py-8 text-gray-500 text-sm">
                                            No data available in table
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedData.map((item, idx) => (
                                        <TableRow key={item.id} className="text-[13px] border-b border-gray-100 hover:bg-gray-50/50 transition-colors whitespace-nowrap text-gray-600 align-top">
                                            <TableCell className="py-4 px-4 font-medium text-gray-700">
                                                <div className="flex items-center mt-1">
                                                    {item.teacherName}
                                                    {item.isClassTeacher && (
                                                        <span className="ml-2 px-1.5 py-0.5 bg-[#5cb85c] text-white text-[10px] rounded font-bold">
                                                            Class Teacher
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-4 text-[12px]">
                                                {item.schedule.map((s, i) => (
                                                    <div key={i} className="mb-1 last:mb-0 text-gray-600">{s.subject}</div>
                                                ))}
                                            </TableCell>
                                            <TableCell className="py-4 px-4 text-[12px]">
                                                {item.schedule.map((s, i) => (
                                                    <div key={i} className="mb-1 last:mb-0 text-gray-600">{s.time}</div>
                                                ))}
                                            </TableCell>
                                            <TableCell className="py-4 px-4 text-[12px] text-center">
                                                {item.schedule.map((s, i) => (
                                                    <div key={i} className="mb-1 last:mb-0 text-gray-600">{s.room}</div>
                                                ))}
                                            </TableCell>
                                            <TableCell className="py-4 px-4">
                                                <div className="mt-1">{item.email}</div>
                                            </TableCell>
                                            <TableCell className="py-4 px-4">
                                                <div className="mt-1">{item.phone}</div>
                                            </TableCell>
                                            <TableCell className="py-4 px-4">
                                                <div className="mt-1">
                                                    <RatingStars rating={item.rating} />
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 px-4">
                                                <div className="mt-1">{item.comment}</div>
                                            </TableCell>
                                            <TableCell className="py-4 px-4 text-right">
                                                {item.rating === null && (
                                                    <div className="mt-1 flex justify-end">
                                                        <Button className="bg-[#7e57c2] hover:bg-[#7048b6] text-white h-6 w-6 p-0 rounded-sm shadow-none">
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
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
