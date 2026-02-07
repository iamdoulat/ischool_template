"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search } from "lucide-react";

interface Student {
    id: string;
    admissionNo: string;
    studentName: string;
    fatherName: string;
    dob: string;
    result: "pass" | "fail";
    status: "continue" | "leave";
}

const mockStudents: Student[] = [
    { id: "1", admissionNo: "120020", studentName: "Ashwani Kumar", fatherName: "Arjun Kumar", dob: "09/25/2009", result: "pass", status: "continue" },
    { id: "2", admissionNo: "10001", studentName: "Edward Thomas", fatherName: "Olivier Thomas", dob: "10/24/2013", result: "pass", status: "continue" },
    { id: "3", admissionNo: "520039", studentName: "xavier bartlett", fatherName: "David bartlett", dob: "05/13/2009", result: "pass", status: "continue" },
    { id: "4", admissionNo: "125005", studentName: "Nehal Wadhera", fatherName: "Karn Wadhera", dob: "11/23/2006", result: "pass", status: "continue" },
    { id: "5", admissionNo: "10024", studentName: "Steven Taylor", fatherName: "Jason Taylor", dob: "08/17/2017", result: "pass", status: "continue" },
    { id: "6", admissionNo: "25001", studentName: "Georgia Wareham", fatherName: "Zakary Foulkes", dob: "05/10/2021", result: "pass", status: "continue" },
    { id: "7", admissionNo: "659990", studentName: "James Bennett", fatherName: "David Wilson", dob: "05/05/2009", result: "pass", status: "continue" },
    { id: "8", admissionNo: "10001", studentName: "Edward Thomas", fatherName: "Olivier Thomas", dob: "11/03/2014", result: "pass", status: "continue" },
    { id: "9", admissionNo: "5001", studentName: "Niharika", fatherName: "ajay", dob: "01/07/2020", result: "pass", status: "continue" },
    { id: "10", admissionNo: "66001", studentName: "Matthew Bacon", fatherName: "Jason", dob: "12/31/2018", result: "pass", status: "continue" },
    { id: "11", admissionNo: "7656", studentName: "RAM", fatherName: "jay", dob: "01/07/2020", result: "pass", status: "continue" },
    { id: "12", admissionNo: "90034", studentName: "Nidhi Verma", fatherName: "Babu", dob: "09/02/2021", result: "pass", status: "continue" },
    { id: "13", admissionNo: "5004", studentName: "AVYAAN", fatherName: "sur", dob: "10/14/2020", result: "pass", status: "continue" },
    { id: "14", admissionNo: "0212860", studentName: "Sanjit Kumar", fatherName: "Amrender Ram", dob: "06/08/2024", result: "pass", status: "continue" },
];

export default function PromoteStudentsPage() {
    const [students, setStudents] = useState<Student[]>(mockStudents);

    const handleResultChange = (id: string, value: "pass" | "fail") => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, result: value } : s));
    };

    const handleStatusChange = (id: string, value: "continue" | "leave") => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, status: value } : s));
    };

    return (
        <div className="space-y-6">
            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
                <h2 className="text-lg font-medium text-gray-800 border-b pb-2 mb-4">Select Criteria</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <Select defaultValue="a">
                            <SelectTrigger id="section">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="a">A</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Promote Students In Next Session Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
                <h2 className="text-lg font-medium text-gray-800 border-b pb-2 mb-4">Promote Students In Next Session</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    <div className="space-y-2">
                        <Label htmlFor="promote-session" className="text-xs font-semibold text-gray-600">
                            Promote In Session <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="2016-17">
                            <SelectTrigger id="promote-session">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2016-17">2016-17</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="promote-class" className="text-xs font-semibold text-gray-600">
                            Class <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="class1">
                            <SelectTrigger id="promote-class">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="class1">Class 1</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="promote-section" className="text-xs font-semibold text-gray-600">
                            Section <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="a">
                            <SelectTrigger id="promote-section">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="a">A</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end pt-2 border-t mt-4">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6 h-9 text-xs gap-2">
                        <Search className="h-3.5 w-3.5" /> Search
                    </Button>
                </div>
            </div>

            {/* Student List Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4 font-sans">
                <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Student List</h2>
                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50 text-[11px] uppercase">
                            <TableRow>
                                <TableHead className="w-[40px] px-4">
                                    <Checkbox className="border-gray-300" />
                                </TableHead>
                                <TableHead className="font-semibold text-gray-600">Admission No</TableHead>
                                <TableHead className="font-semibold text-gray-600">Student Name</TableHead>
                                <TableHead className="font-semibold text-gray-600">Father Name</TableHead>
                                <TableHead className="font-semibold text-gray-600">Date Of Birth</TableHead>
                                <TableHead className="font-semibold text-gray-600">Current Result</TableHead>
                                <TableHead className="font-semibold text-gray-600">Next Session Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map((student) => (
                                <TableRow key={student.id} className="text-[13px] hover:bg-gray-50/50">
                                    <TableCell className="px-4">
                                        <Checkbox className="border-gray-300" />
                                    </TableCell>
                                    <TableCell className="text-gray-600">{student.admissionNo}</TableCell>
                                    <TableCell className="text-gray-900 font-medium">{student.studentName}</TableCell>
                                    <TableCell className="text-gray-600">{student.fatherName}</TableCell>
                                    <TableCell className="text-gray-600">{student.dob}</TableCell>
                                    <TableCell>
                                        <RadioGroup
                                            defaultValue={student.result}
                                            onValueChange={(val) => handleResultChange(student.id, val as "pass" | "fail")}
                                            className="flex gap-4"
                                        >
                                            <div className="flex items-center space-x-1.5">
                                                <RadioGroupItem value="pass" id={`result-pass-${student.id}`} className="h-4 w-4 border-indigo-300 text-indigo-600" />
                                                <Label htmlFor={`result-pass-${student.id}`} className="text-xs font-medium text-gray-700">Pass</Label>
                                            </div>
                                            <div className="flex items-center space-x-1.5">
                                                <RadioGroupItem value="fail" id={`result-fail-${student.id}`} className="h-4 w-4 border-indigo-300 text-indigo-600" />
                                                <Label htmlFor={`result-fail-${student.id}`} className="text-xs font-medium text-gray-700">Fail</Label>
                                            </div>
                                        </RadioGroup>
                                    </TableCell>
                                    <TableCell>
                                        <RadioGroup
                                            defaultValue={student.status}
                                            onValueChange={(val) => handleStatusChange(student.id, val as "continue" | "leave")}
                                            className="flex gap-4"
                                        >
                                            <div className="flex items-center space-x-1.5">
                                                <RadioGroupItem value="continue" id={`status-cont-${student.id}`} className="h-4 w-4 border-indigo-300 text-indigo-600" />
                                                <Label htmlFor={`status-cont-${student.id}`} className="text-xs font-medium text-gray-700">Continue</Label>
                                            </div>
                                            <div className="flex items-center space-x-1.5">
                                                <RadioGroupItem value="leave" id={`status-leave-${student.id}`} className="h-4 w-4 border-indigo-300 text-indigo-600" />
                                                <Label htmlFor={`status-leave-${student.id}`} className="text-xs font-medium text-gray-700">Leave</Label>
                                            </div>
                                        </RadioGroup>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex justify-end pt-4">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-8 h-9 text-xs shadow-sm">
                        Promote
                    </Button>
                </div>
            </div>
        </div>
    );
}
