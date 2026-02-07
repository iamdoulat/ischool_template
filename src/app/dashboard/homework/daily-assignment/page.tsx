"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
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
    ArrowUpDown,
    Inbox
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function DailyAssignmentPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-sm font-medium text-gray-800 border-b pb-2">Select Criteria</h2>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">
                            Class <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="class2">
                            <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="class1">Class 1</SelectItem>
                                <SelectItem value="class2">Class 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">
                            Section <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="b">
                            <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="a">A</SelectItem>
                                <SelectItem value="b">B</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">
                            Subject Group <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="group2">
                            <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="group2">Class 2nd Subject Group</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">
                            Subject <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="hindi">
                            <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hindi">Hindi (230)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">
                            Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            type="text"
                            defaultValue="02/05/2026"
                            className="h-9 border-gray-200 text-xs focus-visible:ring-indigo-500 rounded shadow-none"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-8 px-6 text-[11px] font-bold uppercase transition-all rounded shadow-sm">
                        <Search className="h-3.5 w-3.5" /> Search
                    </Button>
                </div>
            </div>

            {/* Daily Assignment List Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 pt-6">
                <h2 className="text-sm font-medium text-gray-800 mb-6">Daily Assignment List</h2>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
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

                <div className="rounded border border-gray-50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100">
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    Student Name <ArrowUpDown className="h-2.5 w-2.5 inline-block ml-1 opacity-50" />
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Class</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Section</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Subject</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Title</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Submission Date</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Evaluation Date</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Evaluated By</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={9} className="h-72 text-center py-10">
                                    <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                                        <div className="relative">
                                            <Inbox className="h-16 w-16 text-gray-200" />
                                            <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full">
                                                <div className="h-4 w-4 bg-gray-100 rounded-full" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-red-400">No data available in table</p>
                                            <p className="text-[10px] text-indigo-500 font-medium cursor-pointer hover:underline">
                                                ← Add new record or search with different criteria.
                                            </p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-4 mt-2 border-t border-gray-50">
                    <div>
                        Showing 0 to 0 of 0 entries
                    </div>
                    <div className="flex gap-1 items-center">
                        <span className="text-gray-400 mr-2 cursor-pointer hover:text-gray-600 text-[10px]">‹</span>
                        <span className="text-gray-400 ml-2 cursor-pointer hover:text-gray-600 text-[10px]">›</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
