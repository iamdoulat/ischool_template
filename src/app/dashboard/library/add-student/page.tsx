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
    TableRow,
} from "@/components/ui/table";
import {
    Search,
    Plus,
    RotateCcw,
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

interface StudentMember {
    id: string;
    memberId: string;
    libraryCardNo: string;
    admissionNo: string;
    studentName: string;
    class: string;
    fatherName: string;
    dob: string;
    gender: string;
    mobile: string;
    isMember: boolean;
}

const mockStudents: StudentMember[] = [
    { id: "1", memberId: "50", libraryCardNo: "234", admissionNo: "120020", studentName: "Ashwani Kumar", class: "Class 1(A)", fatherName: "Arjun Kumar", dob: "09/25/2009", gender: "Male", mobile: "900678463", isMember: true },
    { id: "2", memberId: "52", libraryCardNo: "8907", admissionNo: "18001", studentName: "Edward Thomas", class: "Class 1(A)", fatherName: "Olivier Thomas", dob: "10/24/2013", gender: "Male", mobile: "8906785675", isMember: true },
    { id: "3", memberId: "", libraryCardNo: "", admissionNo: "520030", studentName: "xavier bartlett", class: "Class 1(A)", fatherName: "David bartlett", dob: "05/13/2009", gender: "Male", mobile: "890785657", isMember: false },
    { id: "4", memberId: "53", libraryCardNo: "67888", admissionNo: "125005", studentName: "Nukul Wadhera", class: "Class 1(A)", fatherName: "Karun wadhera", dob: "11/23/2008", gender: "Male", mobile: "8907865784", isMember: true },
    { id: "5", memberId: "54", libraryCardNo: "1211", admissionNo: "10024", studentName: "Steven Taylor", class: "Class 1(A)", fatherName: "Jason Taylor", dob: "08/17/2017", gender: "Male", mobile: "800567345", isMember: true },
    { id: "6", memberId: "", libraryCardNo: "", admissionNo: "25001", studentName: "Georgia Wareham", class: "Class 1(A)", fatherName: "Zakary Foulkes", dob: "05/10/2021", gender: "Female", mobile: "9808908777", isMember: false },
    { id: "7", memberId: "56", libraryCardNo: "78900", admissionNo: "656999", studentName: "James Bennett", class: "Class 1(A)", fatherName: "David Wilson", dob: "05/05/2009", gender: "Male", mobile: "8978788865", isMember: true },
    { id: "8", memberId: "", libraryCardNo: "", admissionNo: "19001", studentName: "Edward Thomas", class: "Class 1(A)", fatherName: "Olivier Thomas", dob: "10/03/2014", gender: "Male", mobile: "8233366613", isMember: false },
    { id: "9", memberId: "", libraryCardNo: "", admissionNo: "9001", studentName: "Niharika", class: "Class 1(A)", fatherName: "ajay", dob: "01/07/2020", gender: "Female", mobile: "", isMember: false },
    { id: "10", memberId: "", libraryCardNo: "", admissionNo: "98001", studentName: "Matthew Bacon", class: "Class 1(A)", fatherName: "Jason", dob: "12/31/2018", gender: "Male", mobile: "08909789", isMember: false },
    { id: "11", memberId: "58", libraryCardNo: "788", admissionNo: "7656", studentName: "RAM", class: "Class 1(A)", fatherName: "Joy", dob: "01/07/2020", gender: "Male", mobile: "", isMember: true },
    { id: "12", memberId: "", libraryCardNo: "", admissionNo: "90034", studentName: "Nidhi Verma", class: "Class 1(A)", fatherName: "Balbir", dob: "09/02/2021", gender: "Female", mobile: "7676563786", isMember: false },
    { id: "13", memberId: "", libraryCardNo: "", admissionNo: "9004", studentName: "AVYAAN", class: "Class 1(A)", fatherName: "s r", dob: "10/14/2020", gender: "Male", mobile: "78646736787", isMember: false },
];

export default function AddStudentLibraryPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredStudents = mockStudents.filter((student) =>
        student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.admissionNo.includes(searchTerm)
    );

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans text-xs">
            {/* Select Criteria Section */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-sm font-medium text-gray-800 border-b pb-2">Select Criteria</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">
                            Class <span className="text-red-500 font-bold">*</span>
                        </Label>
                        <Select defaultValue="class1">
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
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">Section</Label>
                        <Select defaultValue="a">
                            <SelectTrigger className="h-9 border-gray-200 text-xs focus:ring-indigo-500 rounded">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="a">A</SelectItem>
                                <SelectItem value="b">B</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-8 px-6 text-[11px] font-bold uppercase transition-all rounded shadow-sm">
                        <Search className="h-3.5 w-3.5" /> Search
                    </Button>
                </div>
            </div>

            {/* Student Members List Section */}
            <div className="bg-white rounded shadow-sm border border-gray-100 p-4 space-y-4 overflow-hidden">
                <h2 className="text-sm font-medium text-gray-800">Student Members List</h2>

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

                {/* List Table */}
                <div className="rounded border border-gray-50 overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[1200px]">
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100 whitespace-nowrap">
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Member ID <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Library Card No.</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Admission No</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Student Name</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Class <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Father Name</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Date Of Birth <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">
                                    <div className="flex items-center gap-1 cursor-pointer">Gender <ArrowUpDown className="h-2.5 w-2.5 opacity-30" /></div>
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Mobile Number</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStudents.map((student) => (
                                <TableRow
                                    key={student.id}
                                    className={cn(
                                        "text-[11px] border-b border-gray-50 hover:bg-gray-50/30 transition-colors whitespace-nowrap",
                                        student.isMember && "bg-[#e8f5e9]/60 hover:bg-[#c8e6c9]/60" // Light green for members
                                    )}
                                >
                                    <TableCell className="py-3 text-gray-500">{student.memberId}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{student.libraryCardNo}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{student.admissionNo}</TableCell>
                                    <TableCell className="py-3 text-gray-700 font-medium">{student.studentName}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{student.class}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{student.fatherName}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{student.dob}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{student.gender}</TableCell>
                                    <TableCell className="py-3 text-gray-500">{student.mobile || "-"}</TableCell>
                                    <TableCell className="py-3 text-right">
                                        <Button size="icon" variant="ghost" className="h-6 w-6 bg-[#6366f1] hover:bg-[#5558dd] text-white rounded shadow-sm">
                                            {student.isMember ? (
                                                <RotateCcw className="h-3 w-3" />
                                            ) : (
                                                <Plus className="h-3.5 w-3.5 font-bold" />
                                            )}
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
                        Showing 1 to {filteredStudents.length} of {mockStudents.length} entries
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
