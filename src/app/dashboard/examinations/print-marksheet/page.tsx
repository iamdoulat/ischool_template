"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Download, Printer } from "lucide-react";
import Link from "next/link";

interface Student {
    id: string;
    admissionNo: string;
    studentName: string;
    fatherName: string;
    dateOfBirth: string;
    gender: string;
    category: string;
    mobileNumber: string;
}

const mockStudents: Student[] = [
    { id: "1", admissionNo: "120038", studentName: "Ayan Desai", fatherName: "Abhinand", dateOfBirth: "10/15/2015", gender: "Male", category: "General", mobileNumber: "9087875674" },
    { id: "2", admissionNo: "96302", studentName: "Jacob Bethell", fatherName: "Brydon", dateOfBirth: "06/19/2016", gender: "Male", category: "General", mobileNumber: "065758879" },
    { id: "3", admissionNo: "2152", studentName: "Kaylan", fatherName: "Lyndon", dateOfBirth: "05/19/2019", gender: "Female", category: "", mobileNumber: "54180185420" },
    { id: "4", admissionNo: "410020", studentName: "kristian clarke", fatherName: "", dateOfBirth: "05/13/2009", gender: "Male", category: "General", mobileNumber: "90078684" },
    { id: "5", admissionNo: "032002", studentName: "Liam Dawson", fatherName: "John", dateOfBirth: "06/17/2020", gender: "Male", category: "Special", mobileNumber: "80678456" },
    { id: "6", admissionNo: "8000", studentName: "Rocky Flintoff", fatherName: "Jordan", dateOfBirth: "04/20/2012", gender: "Male", category: "General", mobileNumber: "800905673" },
];

export default function PrintMarksheetPage() {
    return (
        <div className="space-y-6">
            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-6">
                <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Select Criteria</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <div className="space-y-2 lg:col-span-1">
                        <Label htmlFor="examGroup" className="text-xs font-semibold text-gray-600">
                            Exam Group <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="grading">
                            <SelectTrigger id="examGroup">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="grading">Grading System (School Based Grading System)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 lg:col-span-1">
                        <Label htmlFor="exam" className="text-xs font-semibold text-gray-600">
                            Exam <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="periodic">
                            <SelectTrigger id="exam">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="periodic">Periodic Weekly Test (January-2026)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 lg:col-span-1">
                        <Label htmlFor="session" className="text-xs font-semibold text-gray-600">
                            Session <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="2025-26">
                            <SelectTrigger id="session">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2025-26">2025-26</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 lg:col-span-1">
                        <Label htmlFor="class" className="text-xs font-semibold text-gray-600">
                            Class <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="class2">
                            <SelectTrigger id="class">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="class2">Class 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 lg:col-span-1">
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

                    <div className="space-y-2 lg:col-span-1">
                        <Label htmlFor="template" className="text-xs font-semibold text-gray-600">
                            Marksheet Template <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue="school">
                            <SelectTrigger id="template">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="school">school marksheet</SelectItem>
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
            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                    <h2 className="text-lg font-medium text-gray-800">Student List</h2>
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 text-xs h-8">
                        Bulk Download
                    </Button>
                </div>

                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50 text-xs uppercase">
                            <TableRow>
                                <TableHead className="w-[40px] px-4 text-center">
                                    <Checkbox className="border-gray-400" />
                                </TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[120px]">Admission No</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[150px]">Student Name</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[150px]">Father Name</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[120px]">Date Of Birth</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[100px]">Gender</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[100px]">Category</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[120px]">Mobile Number</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-right min-w-[100px]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockStudents.map((student) => (
                                <TableRow key={student.id} className="text-sm hover:bg-gray-50">
                                    <TableCell className="text-center px-4">
                                        <Checkbox className="border-gray-400" />
                                    </TableCell>
                                    <TableCell className="text-gray-600 font-medium">{student.admissionNo}</TableCell>
                                    <TableCell>
                                        <Link href="#" className="font-medium text-blue-600 hover:underline">
                                            {student.studentName}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-gray-600">{student.fatherName}</TableCell>
                                    <TableCell className="text-gray-600">{student.dateOfBirth}</TableCell>
                                    <TableCell className="text-gray-600">{student.gender}</TableCell>
                                    <TableCell className="text-gray-600">{student.category}</TableCell>
                                    <TableCell className="text-gray-600">{student.mobileNumber}</TableCell>
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
                                                title="Print"
                                            >
                                                <Printer className="h-4 w-4" />
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
