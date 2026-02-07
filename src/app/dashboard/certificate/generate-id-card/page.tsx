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

interface Student {
    admissionNo: string;
    name: string;
    class: string;
    fatherName: string;
    dob: string;
    gender: string;
    category: string;
    mobile: string;
}

const mockStudents: Student[] = [
    { admissionNo: "10024", name: "Steven Taylor", class: "Class 1(A)", fatherName: "Jason Taylor", dob: "08/17/2017", gender: "Male", category: "General", mobile: "890567345" },
    { admissionNo: "120020", name: "Ashwani Kumar", class: "Class 1(A)", fatherName: "Arjun Kumar", dob: "09/25/2009", gender: "Male", category: "General", mobile: "980678463" },
    { admissionNo: "125005", name: "Nehal Wadhera", class: "Class 1(A)", fatherName: "Karan wadhera", dob: "11/22/2006", gender: "Male", category: "General", mobile: "890786784" },
    { admissionNo: "18001", name: "Edward Thomas", class: "Class 1(A)", fatherName: "Olivier Thomas", dob: "10/24/2013", gender: "Male", category: "General", mobile: "8905785675" },
    { admissionNo: "19001", name: "Edward Thomas", class: "Class 1(A)", fatherName: "Olivier Thomas", dob: "11/03/2014", gender: "Male", category: "", mobile: "8233366613" },
    { admissionNo: "25001", name: "Georgia Wareham", class: "Class 1(A)", fatherName: "Zakary Foulkes", dob: "05/10/2021", gender: "Female", category: "General", mobile: "8808908777" },
    { admissionNo: "520039", name: "xavier bartlett", class: "Class 1(A)", fatherName: "David bartlett", dob: "05/12/2009", gender: "Male", category: "", mobile: "08907898557" },
    { admissionNo: "650990", name: "James Bennett", class: "Class 1(A)", fatherName: "David Wilson", dob: "05/05/2009", gender: "Male", category: "General", mobile: "8978786866" },
    { admissionNo: "7856", name: "RAM", class: "Class 1(A)", fatherName: "jay", dob: "01/07/2020", gender: "Male", category: "General", mobile: "" },
    { admissionNo: "9001", name: "Niharika", class: "Class 1(A)", fatherName: "ajay", dob: "01/07/2020", gender: "Female", category: "General", mobile: "" },
    { admissionNo: "90034", name: "Nidhi Verma", class: "Class 1(A)", fatherName: "Babu", dob: "09/02/2021", gender: "Female", category: "", mobile: "76785683788" },
    { admissionNo: "9004", name: "AVYAAN", class: "Class 1(A)", fatherName: "s.r", dob: "10/14/2020", gender: "Male", category: "", mobile: "78846738787" },
    { admissionNo: "98001", name: "Matthew Bacon", class: "Class 1(A)", fatherName: "Jason", dob: "12/31/2018", gender: "Male", category: "", mobile: "08906789" },
];

export default function GenerateIDCardPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredStudents = mockStudents.filter((s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admissionNo.includes(searchTerm)
    );

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-sm font-medium text-gray-800 tracking-tight">Select Criteria</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                            Class <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <Select>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] focus:ring-indigo-500 rounded shadow-none">
                                <SelectValue placeholder="Class 1" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="c1">Class 1</SelectItem>
                                <SelectItem value="c2">Class 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section</Label>
                        <Select>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] focus:ring-indigo-500 rounded shadow-none">
                                <SelectValue placeholder="A" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="a">A</SelectItem>
                                <SelectItem value="b">B</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                            ID Card Template <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <Select>
                            <SelectTrigger className="h-8 border-gray-200 text-[11px] focus:ring-indigo-500 rounded shadow-none">
                                <SelectValue placeholder="Sample Student Identity Card" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="tc">Sample Student Identity Card</SelectItem>
                                <SelectItem value="mc">Staff ID Card</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-sm flex items-center gap-1.5">
                        <Search className="h-3.5 w-3.5" />
                        Search
                    </Button>
                </div>
            </div>

            {/* Student List Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                <div className="flex justify-between items-center">
                    <h2 className="text-sm font-medium text-gray-800 tracking-tight">Student List</h2>
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6 h-8 text-[11px] font-bold uppercase transition-all rounded shadow-sm flex items-center gap-1.5">
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
                    <Table className="min-w-[1200px]">
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap text-[10px] font-bold uppercase text-gray-600">
                                <TableHead className="py-3 px-4 w-10">
                                    <Checkbox className="h-3.5 w-3.5 border-gray-300 accent-indigo-500 shadow-none" />
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Admission No <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Student Name <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Class <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Father Name <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Date Of Birth <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Gender <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Category <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="py-3 px-4">
                                    <div className="flex items-center gap-1 cursor-pointer">Mobile Number <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStudents.map((student) => (
                                <TableRow key={student.admissionNo} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap">
                                    <TableCell className="py-3 px-4">
                                        <Checkbox className="h-3.5 w-3.5 border-gray-300 accent-indigo-500 shadow-none" />
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-gray-700 font-medium">{student.admissionNo}</TableCell>
                                    <TableCell className="py-3 px-4">
                                        <span className="text-[#6366f1] font-medium hover:underline cursor-pointer">{student.name}</span>
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{student.class}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{student.fatherName}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{student.dob}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{student.gender}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{student.category}</TableCell>
                                    <TableCell className="py-3 px-4 text-gray-500">{student.mobile}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-50">
                    <div>
                        Showing 1 to {filteredStudents.length} of {mockStudents.length} entries
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
