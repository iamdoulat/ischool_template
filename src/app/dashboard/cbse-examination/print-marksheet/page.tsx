"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Mail, Search } from "lucide-react";
import Link from "next/link";

interface StudentRecord {
    id: string;
    admissionNo: string;
    studentName: string;
    fatherName: string;
    dateOfBirth: string;
    gender: string;
    mobileNo: string;
}

const studentData: StudentRecord[] = [
    {
        id: "1",
        admissionNo: "10024",
        studentName: "Steven Taylor",
        fatherName: "Jason Taylor",
        dateOfBirth: "08/17/2017",
        gender: "Male",
        mobileNo: "890567345",
    },
    {
        id: "2",
        admissionNo: "120020",
        studentName: "Ashwani Kumar",
        fatherName: "Arjun Kumar",
        dateOfBirth: "09/25/2009",
        gender: "Male",
        mobileNo: "980678463",
    },
    {
        id: "3",
        admissionNo: "125005",
        studentName: "Nehal Wadhera",
        fatherName: "Karun wadhera",
        dateOfBirth: "11/23/2006",
        gender: "Male",
        mobileNo: "890786784",
    },
    {
        id: "4",
        admissionNo: "18001",
        studentName: "Edward Thomas",
        fatherName: "Olivier Thomas",
        dateOfBirth: "10/24/2013",
        gender: "Male",
        mobileNo: "8906785875",
    },
    {
        id: "5",
        admissionNo: "19001",
        studentName: "Edward Thomas",
        fatherName: "Olivier Thomas",
        dateOfBirth: "11/03/2014",
        gender: "Male",
        mobileNo: "8233366613",
    },
    {
        id: "6",
        admissionNo: "25001",
        studentName: "Georgia Wareham",
        fatherName: "Zakary Foulkes",
        dateOfBirth: "05/10/2021",
        gender: "Female",
        mobileNo: "9806908777",
    },
    {
        id: "7",
        admissionNo: "520039",
        studentName: "xavier bartlett",
        fatherName: "David bartlett",
        dateOfBirth: "05/13/2009",
        gender: "Male",
        mobileNo: "0890789657",
    },
    {
        id: "8",
        admissionNo: "659990",
        studentName: "James Bennett",
        fatherName: "David Wilson",
        dateOfBirth: "05/05/2009",
        gender: "Male",
        mobileNo: "8978788888",
    },
];

export default function PrintMarksheetPage() {
    return (
        <div className="space-y-6">
            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-medium text-gray-800 border-b pb-4 mb-4">Select Criteria</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="class-select" className="text-xs font-semibold text-gray-600">
                            Class <span className="text-red-500">*</span>
                        </Label>
                        <Select>
                            <SelectTrigger id="class-select">
                                <SelectValue placeholder="Class 1" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="class-1">Class 1</SelectItem>
                                <SelectItem value="class-2">Class 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="section-select" className="text-xs font-semibold text-gray-600">
                            Section <span className="text-red-500">*</span>
                        </Label>
                        <Select>
                            <SelectTrigger id="section-select">
                                <SelectValue placeholder="A" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="a">A</SelectItem>
                                <SelectItem value="b">B</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="template-select" className="text-xs font-semibold text-gray-600">
                            Template <span className="text-red-500">*</span>
                        </Label>
                        <Select>
                            <SelectTrigger id="template-select">
                                <SelectValue placeholder="Periodic Singlewise Test Template" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="periodic">Periodic Singlewise Test Template</SelectItem>
                                <SelectItem value="term">Term End Template</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end mt-4">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 h-9 text-sm">
                        <Search className="mr-2 h-4 w-4" /> Search
                    </Button>
                </div>
            </div>

            {/* Student List Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                    <h2 className="text-lg font-medium text-gray-800">Student List</h2>
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white text-xs h-8">
                        Bulk Download
                    </Button>
                </div>

                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50 text-xs uppercase">
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox className="border-gray-300" />
                                </TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[100px]">Admission No</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[150px]">Student Name</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[150px]">Father Name</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[100px]">Date Of Birth</TableHead>
                                <TableHead className="font-semibold text-gray-600">Gender</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[100px]">Mobile No.</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-right min-w-[100px]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {studentData.map((student) => (
                                <TableRow key={student.id} className="text-sm hover:bg-gray-50">
                                    <TableCell>
                                        <Checkbox className="border-gray-300" />
                                    </TableCell>
                                    <TableCell className="text-gray-600">{student.admissionNo}</TableCell>
                                    <TableCell>
                                        <Link href="#" className="text-indigo-500 hover:text-indigo-700 font-medium">
                                            {student.studentName}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-gray-600">{student.fatherName}</TableCell>
                                    <TableCell className="text-gray-600">{student.dateOfBirth}</TableCell>
                                    <TableCell className="text-gray-600">{student.gender}</TableCell>
                                    <TableCell className="text-gray-600">{student.mobileNo}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                size="sm"
                                                className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm"
                                                title="Download"
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm"
                                                title="Send Mail"
                                            >
                                                <Mail className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
