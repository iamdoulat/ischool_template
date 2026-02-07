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
    Send
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface StudentCredential {
    id: string;
    admissionNo: string;
    studentName: string;
    class: string;
    dob: string;
    gender: string;
    mobile: string;
}

const mockStudents: StudentCredential[] = [
    { id: "1", admissionNo: "0212360", studentName: "Sanjit Kumar", class: "Class 1(A)", dob: "05/08/2024", gender: "Male", mobile: "111111111111" },
    { id: "2", admissionNo: "10024", studentName: "Steven Taylor", class: "Class 1(A)", dob: "08/17/2017", gender: "Male", mobile: "890567345" },
    { id: "3", admissionNo: "120020", studentName: "Ashwani Kumar", class: "Class 1(A)", dob: "09/05/2009", gender: "Male", mobile: "980678463" },
    { id: "4", admissionNo: "125005", studentName: "Nehal Wadhera", class: "Class 1(A)", dob: "11/23/2005", gender: "Male", mobile: "890786784" },
    { id: "5", admissionNo: "18001", studentName: "Edward Thomas", class: "Class 1(A)", dob: "10/24/2013", gender: "Male", mobile: "8906785675" },
    { id: "6", admissionNo: "19001", studentName: "Edward Thomas", class: "Class 1(A)", dob: "11/03/2014", gender: "Male", mobile: "8233306613" },
    { id: "7", admissionNo: "25001", studentName: "Georgia Wareham", class: "Class 1(A)", dob: "05/10/2021", gender: "Female", mobile: "9006906777" },
    { id: "8", admissionNo: "520038", studentName: "xavier bartlett", class: "Class 1(A)", dob: "05/13/2009", gender: "Male", mobile: "0890786657" },
    { id: "9", admissionNo: "650000", studentName: "James Bennett", class: "Class 1(A)", dob: "05/05/2009", gender: "Male", mobile: "8978786888" },
    { id: "10", admissionNo: "7856", studentName: "RAM", class: "Class 1(A)", dob: "01/07/2020", gender: "Male", mobile: "" },
    { id: "11", admissionNo: "9001", studentName: "Niharika", class: "Class 1(A)", dob: "01/07/2020", gender: "Female", mobile: "" },
    { id: "12", admissionNo: "90034", studentName: "Nidhi Verma", class: "Class 1(A)", dob: "09/02/2021", gender: "Female", mobile: "76785683786" },
    { id: "13", admissionNo: "9004", studentName: "AVYAAN", class: "Class 1(A)", dob: "10/14/2020", gender: "Male", mobile: "78846736787" },
    { id: "14", admissionNo: "95001", studentName: "Matthew Bacon", class: "Class 1(A)", dob: "12/31/2018", gender: "Male", mobile: "08909789" },
];

export default function LoginCredentialsSendPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="flex justify-between items-center">
                <h1 className="text-sm font-medium text-gray-800 uppercase tracking-tight">Login Credentials Send</h1>
            </div>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="text-sm font-medium text-gray-800 border-b pb-2">Select Criteria</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">
                            Class <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="class1">
                            <SelectTrigger className="h-9 border-gray-200 text-sm focus:ring-indigo-500 rounded">
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
                        <div className="flex gap-2 items-center">
                            <Select defaultValue="a">
                                <SelectTrigger className="h-9 border-gray-200 text-sm focus:ring-indigo-500 rounded flex-1">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="a">A</SelectItem>
                                    <SelectItem value="b">B</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white gap-2 h-9 px-4 text-xs shadow-sm transition-all rounded">
                                <Search className="h-4 w-4" /> Search
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dispatch Configuration Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 pt-6 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start mb-6">
                    <div className="space-y-3">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">Select All</Label>
                        <div className="flex items-center gap-2">
                            <Checkbox className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-5 w-5" />
                        </div>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">
                            Message To <span className="text-red-500">*</span>
                        </Label>
                        <Select>
                            <SelectTrigger className="h-10 border-gray-200 text-sm focus:ring-indigo-500 rounded">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="parent">Parent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-gray-500 uppercase">
                            Notification Type <span className="text-red-500">*</span>
                        </Label>
                        <Select>
                            <SelectTrigger className="h-10 border-gray-200 text-sm focus:ring-indigo-500 rounded">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="sms">SMS</SelectItem>
                                <SelectItem value="both">Both</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-3 h-8 text-xs border-gray-200 focus-visible:ring-indigo-500"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 mr-2">
                            <span className="text-[10px] text-gray-500 font-bold uppercase">SD</span>
                            <Select defaultValue="50">
                                <SelectTrigger className="h-7 w-12 text-[10px] border-gray-200 bg-transparent shadow-none">
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
                                <Button key={i} variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                    <Icon className="h-3.5 w-3.5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Student Credential Table */}
                <div className="rounded-md border border-gray-50 overflow-hidden mb-4">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-gray-100">
                                <TableHead className="w-[50px] py-3">
                                    <Checkbox className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-4 w-4" />
                                </TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Admission No</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Student Name</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Class</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Date Of Birth</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3">Gender</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-gray-600 py-3 text-right">Mobile Number</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockStudents.map((student) => (
                                <TableRow key={student.id} className="text-[11px] border-b border-gray-50 hover:bg-gray-50/20 transition-colors">
                                    <TableCell className="py-3.5">
                                        <Checkbox className="border-gray-300 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-4 w-4" />
                                    </TableCell>
                                    <TableCell className="py-3.5 text-gray-500">{student.admissionNo}</TableCell>
                                    <TableCell className="py-3.5 text-[#6366f1] font-bold cursor-pointer hover:underline">{student.studentName}</TableCell>
                                    <TableCell className="py-3.5 text-gray-500">{student.class}</TableCell>
                                    <TableCell className="py-3.5 text-gray-500">{student.dob}</TableCell>
                                    <TableCell className="py-3.5 text-gray-500">{student.gender}</TableCell>
                                    <TableCell className="py-3.5 text-right text-gray-500">{student.mobile || "-"}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer */}
                <div className="flex flex-col md:flex-row items-center justify-between border-t pt-4">
                    <div className="text-[11px] text-gray-500 font-medium mb-4 md:mb-0">
                        Showing 1 to {mockStudents.length} of {mockStudents.length} entries
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="flex gap-1 items-center">
                            <span className="text-gray-400 mr-2 cursor-pointer hover:text-gray-600">‹</span>
                            <Button variant="default" size="sm" className="h-7 w-7 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0">
                                1
                            </Button>
                            <span className="text-gray-400 ml-2 cursor-pointer hover:text-gray-600">›</span>
                        </div>
                        <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-9 text-[10px] font-bold uppercase transition-all rounded shadow-md shadow-indigo-100">
                            Send
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
