"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    Download,
    ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Student {
    admissionNo: string;
    studentName: string;
    dateOfBirth: string;
    gender: string;
    category: string;
    mobileNumber: string;
}

const students: Student[] = [
    { admissionNo: "120020", studentName: "Nishant Sindhu", dateOfBirth: "08/06/2016", gender: "Male", category: "OBC", mobileNumber: "890578574" },
    { admissionNo: "541200", studentName: "David Wilson", dateOfBirth: "05/01/2019", gender: "Male", category: "General", mobileNumber: "+9162" },
    { admissionNo: "5422", studentName: "Vinay Singh", dateOfBirth: "12/31/2018", gender: "Male", category: "General", mobileNumber: "+916266000225" },
    { admissionNo: "RKS001", studentName: "RKS Kumar", dateOfBirth: "01/01/2019", gender: "Male", category: "OBC", mobileNumber: "" },
];

export default function DownloadCVPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="p-6 space-y-6 bg-[#f8f9fa] min-h-screen font-sans text-xs">
            {/* Select Criteria Section */}
            <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                    <h2 className="text-sm font-medium text-gray-700 tracking-tight">Select Criteria</h2>
                </div>
                <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        <div className="space-y-1.5 text-gray-400">
                            <Label className="text-[11px] font-bold uppercase tracking-tight">
                                Class <span className="text-red-500">*</span>
                            </Label>
                            <Select defaultValue="class-1">
                                <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded shadow-none text-gray-600 font-medium">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="class-1">Class 1</SelectItem>
                                    <SelectItem value="class-2">Class 2</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5 text-gray-400">
                            <Label className="text-[11px] font-bold uppercase tracking-tight">Section</Label>
                            <Select defaultValue="a">
                                <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded shadow-none text-gray-600 font-medium">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="a">A</SelectItem>
                                    <SelectItem value="b">B</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-md flex items-center gap-1.5 min-w-[100px]">
                            <Search className="h-3 w-3" />
                            Search
                        </Button>
                    </div>
                </div>
            </div>

            {/* Student List Section */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                <h2 className="text-sm font-medium text-gray-700 tracking-tight">Student List</h2>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-50 pb-4">
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

                {/* Table */}
                <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1000px]">
                        <TableHeader className="bg-gray-50/30">
                            <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                <TableHead className="text-[10px] font-bold uppercase text-gray-400 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Admission No <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-400 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Student Name <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-400 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Date Of Birth <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-400 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Gender <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-400 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Category <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-400 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Mobile Number <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-400 py-3 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.length > 0 ? (
                                students.map((student) => (
                                    <TableRow key={student.admissionNo} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap group">
                                        <TableCell className="py-3.5 text-gray-700 font-medium">{student.admissionNo}</TableCell>
                                        <TableCell className="py-3.5 text-indigo-500 underline underline-offset-2 decoration-indigo-200 cursor-pointer font-medium">{student.studentName}</TableCell>
                                        <TableCell className="py-3.5 text-gray-500">{student.dateOfBirth}</TableCell>
                                        <TableCell className="py-3.5 text-gray-500">{student.gender}</TableCell>
                                        <TableCell className="py-3.5 text-gray-500">{student.category || "—"}</TableCell>
                                        <TableCell className="py-3.5 text-gray-500">{student.mobileNumber || "—"}</TableCell>
                                        <TableCell className="py-3.5 text-right">
                                            <Button size="icon" variant="ghost" className="h-6 w-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                <Download className="h-3 w-3" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-gray-400 font-medium">
                                        No results found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold pt-4 border-t border-gray-50">
                    <div>
                        Showing 1 to {students.length} of {students.length} entries
                    </div>
                    <div className="flex gap-1 items-center">
                        <span className="text-gray-300 mr-2 cursor-pointer hover:text-gray-500 text-sm">‹</span>
                        <Button variant="default" size="sm" className="h-6 w-6 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0 text-[10px] rounded shadow-sm">
                            1
                        </Button>
                        <span className="text-gray-300 ml-2 cursor-pointer hover:text-gray-500 text-sm">›</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
