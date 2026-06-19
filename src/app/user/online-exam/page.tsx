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
    FileBox, Printer, Eye, CheckSquare, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const upcomingExams = [
    { id: 1, exam: "Monthly Assessment", isQuiz: true, dateFrom: "06/21/2026 01:47 pm", dateTo: "06/30/2026 01:47 pm", duration: "01:00:00", totalAttempt: 5, attempted: 0, status: "Available" },
    { id: 2, exam: "Quiz - June 2026", isQuiz: true, dateFrom: "06/11/2026 01:43 pm", dateTo: "06/20/2026 01:43 pm", duration: "01:00:00", totalAttempt: 5, attempted: 0, status: "Available" }
];

const closedExams = [
    { id: 3, exam: "Monthly Online Test (June)", isQuiz: true, dateFrom: "06/02/2026 01:36 pm", dateTo: "06/10/2026 01:36 pm", duration: "01:00:00", totalAttempt: 5, attempted: 0, status: "Available" },
    { id: 4, exam: "Monthly Assessment", isQuiz: false, dateFrom: "05/18/2026 04:36 pm", dateTo: "05/30/2026 04:36 pm", duration: "01:00:00", totalAttempt: 4, attempted: 0, status: "Available" },
    { id: 5, exam: "Quiz - May 2026", isQuiz: true, dateFrom: "05/11/2026 04:55 pm", dateTo: "05/20/2026 04:55 pm", duration: "01:00:00", totalAttempt: 4, attempted: 0, status: "Available" },
    { id: 6, exam: "Online Test - May 2026", isQuiz: true, dateFrom: "05/04/2026 04:55 pm", dateTo: "05/11/2026 04:55 pm", duration: "01:00:00", totalAttempt: 3, attempted: 0, status: "Available" },
    { id: 7, exam: "Monthly Online Test - May", isQuiz: false, dateFrom: "05/04/2026 04:32 pm", dateTo: "05/20/2026 04:32 pm", duration: "01:00:00", totalAttempt: 5, attempted: 0, status: "Available" },
    { id: 8, exam: "Quiz - April 2026", isQuiz: true, dateFrom: "04/19/2026 09:00 am", dateTo: "04/23/2026 04:00 pm", duration: "00:30:00", totalAttempt: 5, attempted: 0, status: "Available" },
    { id: 9, exam: "Assingment 1", isQuiz: true, dateFrom: "04/08/2026 05:23 pm", dateTo: "04/09/2026 05:23 pm", duration: "01:00:00", totalAttempt: 5, attempted: 0, status: "Available" },
    { id: 10, exam: "Online Test - April 2026", isQuiz: false, dateFrom: "04/01/2026 10:00 am", dateTo: "04/22/2026 02:00 pm", duration: "01:30:00", totalAttempt: 10, attempted: 1, status: "Available" }
];

export default function UserOnlineExamPage() {
    const [activeTab, setActiveTab] = useState<"upcoming" | "closed">("upcoming");
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState("50");
    const [currentPage, setCurrentPage] = useState(1);

    const dataToDisplay = activeTab === "upcoming" ? upcomingExams : closedExams;

    // Filter by search term
    const filteredData = dataToDisplay.filter(c =>
        c.exam.toLowerCase().includes(searchTerm.toLowerCase())
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
                <div className="border-b border-gray-100 p-4">
                    <h1 className="text-[15px] font-medium text-gray-700 tracking-tight">Online Exam</h1>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => { setActiveTab("upcoming"); setCurrentPage(1); }}
                        className={cn(
                            "px-6 py-3 text-[13px] font-medium transition-colors border-b-2",
                            activeTab === "upcoming" 
                                ? "border-[#7e57c2] text-[#7e57c2]" 
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        )}
                    >
                        Upcoming Exams
                    </button>
                    <button
                        onClick={() => { setActiveTab("closed"); setCurrentPage(1); }}
                        className={cn(
                            "px-6 py-3 text-[13px] font-medium transition-colors border-b-2",
                            activeTab === "closed" 
                                ? "border-[#7e57c2] text-[#7e57c2]" 
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        )}
                    >
                        Closed Exam
                    </button>
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
                                    <TableHead className="py-3 px-4 h-auto">Exam <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Quiz <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Date From <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Date To <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Duration <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto text-center">Total Attempt <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto text-center">Attempted <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto">Status <ArrowUpDown className="h-3 w-3 inline ml-1 text-gray-400" /></TableHead>
                                    <TableHead className="py-3 px-4 h-auto text-right">Action</TableHead>
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
                                        <TableRow key={item.id || idx} className="text-[13px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors whitespace-nowrap text-gray-600">
                                            <TableCell className="py-3 px-4">{item.exam}</TableCell>
                                            <TableCell className="py-3 px-4">
                                                {item.isQuiz ? (
                                                    <CheckSquare className="h-4 w-4 text-gray-600" />
                                                ) : (
                                                    <AlertCircle className="h-4 w-4 fill-gray-800 text-white" />
                                                )}
                                            </TableCell>
                                            <TableCell className="py-3 px-4">{item.dateFrom}</TableCell>
                                            <TableCell className="py-3 px-4">{item.dateTo}</TableCell>
                                            <TableCell className="py-3 px-4">{item.duration}</TableCell>
                                            <TableCell className="py-3 px-4 text-center">{item.totalAttempt}</TableCell>
                                            <TableCell className="py-3 px-4 text-center">{item.attempted}</TableCell>
                                            <TableCell className="py-3 px-4">{item.status}</TableCell>
                                            <TableCell className="py-3 px-4 text-right">
                                                <Button 
                                                    className="bg-[#7e57c2] hover:bg-[#7048b6] text-white px-2.5 h-6 rounded shadow-none flex items-center justify-center transition-all active:scale-95 ml-auto"
                                                    title="View Exam"
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
