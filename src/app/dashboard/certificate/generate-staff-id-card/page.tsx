"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

interface Staff {
    staffId: string;
    name: string;
    role: string;
    designation: string;
    department: string;
    fatherName: string;
    motherName: string;
    joiningDate: string;
    phone: string;
    dob: string;
}

const mockStaff: Staff[] = [
    { staffId: "9002", name: "Shivam Verma", role: "Teacher", designation: "Faculty", department: "Academic", fatherName: "Pulkit Verma", motherName: "Manisha Verma", joiningDate: "03/10/2010", phone: "9552654564", dob: "06/18/1982" },
    { staffId: "90005", name: "Jason Shariton", role: "Teacher", designation: "Faculty", department: "Academic", fatherName: "Max Shariton", motherName: "Arya Shariton", joiningDate: "08/24/2018", phone: "48548854564", dob: "06/16/1980" },
    { staffId: "1002", name: "Nishant Khare", role: "Teacher", designation: "", department: "", fatherName: "", motherName: "", joiningDate: "12/10/2020", phone: "9885757857", dob: "12/11/2000" },
    { staffId: "654", name: "aman", role: "Teacher", designation: "Faculty", department: "Academic", fatherName: "", motherName: "", joiningDate: "", phone: "", dob: "01/14/2026" },
];

export default function GenerateStaffIDCardPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredStaff = mockStaff.filter((s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.staffId.includes(searchTerm)
    );

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-sm font-medium text-gray-800 tracking-tight">Select Criteria</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                            Role <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <Select>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] focus:ring-indigo-500 rounded shadow-none">
                                <SelectValue placeholder="Teacher" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="teacher">Teacher</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                            ID Card Template <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <Select>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] focus:ring-indigo-500 rounded shadow-none">
                                <SelectValue placeholder="Sample Staff ID Card" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="s1">Sample Staff ID Card</SelectItem>
                                <SelectItem value="s2">Sample Staff ID Card Vertical</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-sm flex items-center gap-1.5 font-bold tracking-tight">
                        <Search className="h-3.5 w-3.5" />
                        Search
                    </Button>
                </div>
            </div>

            {/* Staff List Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                <div className="flex justify-between items-center">
                    <h2 className="text-sm font-medium text-gray-800 tracking-tight">Staff List</h2>
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-sm flex items-center gap-1.5 font-bold tracking-tight">
                        Generate
                    </Button>
                </div>

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
                    <Table className="min-w-[1500px]">
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4 w-10">
                                    <Checkbox className="h-3.5 w-3.5 border-gray-300 accent-indigo-500 shadow-none focus:ring-0" />
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Staff ID <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Staff Name <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Role <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Designation <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Department <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Father Name <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Mother Name <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Date Of Joining <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Phone <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Date Of Birth <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStaff.map((person) => (
                                <TableRow key={person.staffId} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                    <TableCell className="py-3 px-4">
                                        <Checkbox className="h-3.5 w-3.5 border-gray-300 accent-indigo-500 shadow-none focus:ring-0" />
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-gray-700 font-medium">{person.staffId}</TableCell>
                                    <TableCell className="py-3 px-4">
                                        <span className="text-[#6366f1] font-medium hover:underline cursor-pointer">{person.name}</span>
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{person.role}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{person.designation}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{person.department}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{person.fatherName}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{person.motherName}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{person.joiningDate}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{person.phone}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{person.dob}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-50">
                    <div>
                        Showing 1 to {filteredStaff.length} of {mockStaff.length} entries
                    </div>
                    <div className="flex gap-1 items-center">
                        <span className="text-gray-400 mr-2 cursor-pointer hover:text-gray-600 text-[10px]">‹</span>
                        <Button variant="default" size="sm" className="h-6 w-6 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0 text-[10px] rounded shadow-sm">
                            1
                        </Button>
                        <span className="text-gray-400 ml-2 cursor-pointer hover:text-gray-600 text-[10px]">›</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
