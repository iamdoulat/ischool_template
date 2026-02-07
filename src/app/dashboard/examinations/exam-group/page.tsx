"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, X, Plus, Copy, FileSpreadsheet, FileText, Printer, Columns, ChevronLeft, ChevronRight } from "lucide-react";

interface ExamGroup {
    id: string;
    name: string;
    noOfExams: number;
    examType: string;
}

const examGroupData: ExamGroup[] = [
    { id: "1", name: "General Exam (Pass / Fail)", noOfExams: 6, examType: "General Purpose (Pass/Fail)" },
    { id: "2", name: "Grading System (School Based Grading System)", noOfExams: 4, examType: "School Based Grading System" },
    { id: "3", name: "CGPA (College Based Grading System)", noOfExams: 4, examType: "College Based Grading System" },
    { id: "4", name: "GPA Exam Grading System", noOfExams: 3, examType: "GPA Grading System" },
    { id: "5", name: "Average Passing Exam", noOfExams: 4, examType: "Average Passing" },
    { id: "6", name: "Exam Group", noOfExams: 1, examType: "Average Passing" },
    { id: "7", name: "Final Exam", noOfExams: 2, examType: "School Based Grading System" },
    { id: "8", name: "Examination Term2(February)", noOfExams: 2, examType: "General Purpose (Pass/Fail)" },
];

export default function ExamGroupPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState("50");

    const filteredData = examGroupData.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Add Exam Group Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
                        <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Add Exam Group</h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="className" className="text-xs font-semibold text-gray-600">
                                    Name <span className="text-red-500">*</span>
                                </Label>
                                <Input id="className" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="examType" className="text-xs font-semibold text-gray-600">
                                    Exam Type <span className="text-red-500">*</span>
                                </Label>
                                <Select>
                                    <SelectTrigger id="examType">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">General Purpose (Pass/Fail)</SelectItem>
                                        <SelectItem value="school">School Based Grading System</SelectItem>
                                        <SelectItem value="college">College Based Grading System</SelectItem>
                                        <SelectItem value="gpa">GPA Grading System</SelectItem>
                                        <SelectItem value="average">Average Passing</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-xs font-semibold text-gray-600">
                                    Description
                                </Label>
                                <Textarea id="description" className="min-h-[100px]" />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6">
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Exam Group List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
                        <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Exam Group List</h2>

                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex w-full md:w-auto items-center gap-2">
                                <div className="relative w-full md:w-48">
                                    <Input
                                        placeholder="Search"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-3"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                                    <SelectTrigger className="w-[70px] h-8 text-xs">
                                        <SelectValue placeholder="50" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center gap-1 text-gray-500">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                        <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                        <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                        <Columns className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50 text-xs uppercase">
                                    <TableRow>
                                        <TableHead className="font-semibold text-gray-600 min-w-[200px]">Name</TableHead>
                                        <TableHead className="font-semibold text-gray-600 w-[100px] text-center">No Of Exams</TableHead>
                                        <TableHead className="font-semibold text-gray-600 min-w-[200px]">Exam Type</TableHead>
                                        <TableHead className="font-semibold text-gray-600 text-right min-w-[120px]">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.map((item) => (
                                        <TableRow key={item.id} className="text-sm">
                                            <TableCell className="font-medium text-gray-700 py-3">{item.name}</TableCell>
                                            <TableCell className="text-center text-gray-600">{item.noOfExams}</TableCell>
                                            <TableCell className="text-gray-600">{item.examType}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        size="sm"
                                                        className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm"
                                                        title="Add"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm"
                                                        title="Delete"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2">
                            <div>
                                Showing 1 to {filteredData.length} of {examGroupData.length} entries
                            </div>
                            <div className="flex gap-1">
                                <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled><ChevronLeft className="h-3.5 w-3.5" /></Button>
                                <Button variant="default" size="sm" className="h-7 w-7 p-0 bg-indigo-500 hover:bg-indigo-600 text-white">1</Button>
                                <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled><ChevronRight className="h-3.5 w-3.5" /></Button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
