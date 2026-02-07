"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, Save, Copy, FileSpreadsheet, FileText, Printer, Columns, ChevronLeft, ChevronRight } from "lucide-react";

interface Student {
    id: string;
    admissionNo: string;
    rollNumber: string;
    name: string;
    attendance: string;
    note: string;
}

const mockStudents: Student[] = [
    { id: "1", admissionNo: "5422", rollNumber: "632010", name: "Vinay Singh", attendance: "present", note: "" },
    { id: "2", admissionNo: "120028", rollNumber: "100028", name: "Nishant Sindhu", attendance: "present", note: "" },
    { id: "3", admissionNo: "541200", rollNumber: "36200", name: "David wilson", attendance: "present", note: "" },
    { id: "4", admissionNo: "RKS001", rollNumber: "8544", name: "RKS Kumar", attendance: "present", note: "" },
];

export default function PeriodAttendancePage() {
    const [students, setStudents] = useState<Student[]>(mockStudents);
    const [bulkAttendance, setBulkAttendance] = useState("present");

    const handleBulkAttendanceChange = (value: string) => {
        setBulkAttendance(value);
        setStudents(prev => prev.map(s => ({ ...s, attendance: value })));
    };

    const handleIndividualAttendanceChange = (id: string, value: string) => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, attendance: value } : s));
    };

    const handleNoteChange = (id: string, value: string) => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, note: value } : s));
    };

    return (
        <div className="space-y-6">
            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-6">
                <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Select Criteria</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="class" className="text-xs font-semibold text-gray-600">
                            Class <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="class1">
                            <SelectTrigger id="class">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="class1">Class 1</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="section" className="text-xs font-semibold text-gray-600">
                            Section <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="b">
                            <SelectTrigger id="section">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="b">B</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date" className="text-xs font-semibold text-gray-600">
                            Date <span className="text-red-500">*</span>
                        </Label>
                        <Input type="text" defaultValue="02/06/2026" id="date" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="subject" className="text-xs font-semibold text-gray-600">
                            Subject <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="hindi">
                            <SelectTrigger id="subject">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hindi">Hindi (9:00 AM - 09:45 AM) By Shivam Verma (9002)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 gap-2 text-xs">
                        <Search className="h-3.5 w-3.5" /> Search
                    </Button>
                </div>
            </div>

            {/* Student List Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-6">
                <div className="flex justify-between items-center border-b pb-2">
                    <h2 className="text-lg font-medium text-gray-800">Student List</h2>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col space-y-3">
                        <Label className="text-xs font-bold text-gray-700 uppercase">Set attendance for all students as</Label>
                        <RadioGroup
                            defaultValue="present"
                            value={bulkAttendance}
                            onValueChange={handleBulkAttendanceChange}
                            className="flex flex-wrap gap-4"
                        >
                            {[
                                { label: "Present", value: "present" },
                                { label: "Late", value: "late" },
                                { label: "Absent", value: "absent" },
                                { label: "Holiday", value: "holiday" },
                                { label: "Half Day", value: "half_day" }
                            ].map((item) => (
                                <div key={item.value} className="flex items-center space-x-1.5">
                                    <RadioGroupItem value={item.value} id={`bulk-${item.value}`} className="border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4" />
                                    <Label htmlFor={`bulk-${item.value}`} className="text-xs font-medium text-gray-600 cursor-pointer">{item.label}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 gap-1.5 text-xs h-9">
                        <Save className="h-4 w-4" /> Save Attendance
                    </Button>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t">
                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder="Search"
                            className="pl-3 h-8 text-xs border-gray-200"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Select defaultValue="50">
                            <SelectTrigger className="w-[70px] h-8 text-xs">
                                <SelectValue placeholder="50" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1 text-gray-400">
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                <FileSpreadsheet className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                <Printer className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                <Columns className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50 text-[11px] uppercase">
                            <TableRow>
                                <TableHead className="font-semibold text-gray-600 w-[60px]">#</TableHead>
                                <TableHead className="font-semibold text-gray-600">Admission No</TableHead>
                                <TableHead className="font-semibold text-gray-600">Roll Number</TableHead>
                                <TableHead className="font-semibold text-gray-600">Name</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[400px]">Attendance</TableHead>
                                <TableHead className="font-semibold text-gray-600">Note</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map((student, index) => (
                                <TableRow key={student.id} className="text-[13px] hover:bg-gray-50/50">
                                    <TableCell className="text-gray-600">{index + 1}</TableCell>
                                    <TableCell className="text-gray-600">{student.admissionNo}</TableCell>
                                    <TableCell className="text-gray-600">{student.rollNumber}</TableCell>
                                    <TableCell className="text-[#6366f1] font-medium">{student.name}</TableCell>
                                    <TableCell>
                                        <RadioGroup
                                            value={student.attendance}
                                            onValueChange={(val) => handleIndividualAttendanceChange(student.id, val)}
                                            className="flex flex-wrap gap-4"
                                        >
                                            {[
                                                { label: "Present", value: "present" },
                                                { label: "Late", value: "late" },
                                                { label: "Absent", value: "absent" },
                                                { label: "Holiday", value: "holiday" },
                                                { label: "Half Day", value: "half_day" }
                                            ].map((item) => (
                                                <div key={item.value} className="flex items-center space-x-1.5">
                                                    <RadioGroupItem value={item.value} id={`${student.id}-${item.value}`} className="border-gray-300 text-indigo-600 h-4 w-4" />
                                                    <Label htmlFor={`${student.id}-${item.value}`} className="text-xs font-medium text-gray-600 cursor-pointer">{item.label}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            value={student.note}
                                            onChange={(e) => handleNoteChange(student.id, e.target.value)}
                                            className="h-8 text-xs border-gray-200"
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2">
                    <div>
                        Showing 1 to {students.length} of {students.length} entries
                    </div>
                    <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0 group" disabled>
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="default" size="sm" className="h-7 w-7 p-0 bg-indigo-500 hover:bg-indigo-600 text-white border-0">
                            1
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0 group" disabled>
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}
