"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, FileSpreadsheet, FileText, Printer, Columns, Pencil, X, ChevronLeft, ChevronRight, Plus, FileCode, CheckSquare } from "lucide-react";

interface ExamRecord {
    id: string;
    examName: string;
    classSection: string;
    term: string;
    subjectsIncluded: number;
    examPublished: boolean;
    publishedResult: boolean;
    categoryName: string;
    description: string;
    createdAt: string;
}

const examData: ExamRecord[] = [
    {
        id: "1",
        examName: "Assessment Practice Test(February-2026)",
        classSection: "Class 1 (A, B, C, D)",
        term: "Term 2",
        subjectsIncluded: 4,
        examPublished: true,
        publishedResult: true,
        categoryName: "Internal Assessment",
        description: "Assessment Practice Test(February-2026)",
        createdAt: "02/03/2026",
    },
    {
        id: "2",
        examName: "Assessment Practice Test(January-2026)",
        classSection: "Class 1 (A, B, C, D)",
        term: "Term 1",
        subjectsIncluded: 4,
        examPublished: true,
        publishedResult: true,
        categoryName: "Main Subjects",
        description: "Assessment Practice Test",
        createdAt: "01/02/2026",
    },
    {
        id: "3",
        examName: "Periodic Term-end Exams(December-2025)",
        classSection: "Class 1 (A, B, C, D)",
        term: "Term 1",
        subjectsIncluded: 4,
        examPublished: true,
        publishedResult: true,
        categoryName: "Internal Assessment",
        description: "Periodic Term-end Exams",
        createdAt: "12/01/2025",
    },
    {
        id: "4",
        examName: "Online Assessment Test (November)",
        classSection: "Class 2 (A, B, C, D)",
        term: "Term 2",
        subjectsIncluded: 4,
        examPublished: true,
        publishedResult: true,
        categoryName: "Main Subjects",
        description: "",
        createdAt: "11/01/2025",
    },
    {
        id: "5",
        examName: "Internal Assessments Exam (November-2025)",
        classSection: "Class 1 (A, B, C, D)",
        term: "Term 1",
        subjectsIncluded: 4,
        examPublished: true,
        publishedResult: true,
        categoryName: "",
        description: "Internal Assessments Exam (November-2025)",
        createdAt: "11/01/2025",
    },
    {
        id: "6",
        examName: "Online Assessment Test (October-2025)",
        classSection: "Class 1 (A, B, C, D)",
        term: "Term 1",
        subjectsIncluded: 4,
        examPublished: true,
        publishedResult: true,
        categoryName: "",
        description: "",
        createdAt: "10/01/2025",
    },
    {
        id: "7",
        examName: "Monthly Periodic exam(September-2025)",
        classSection: "Class 1 (A, B, C, D)",
        term: "Term 2",
        subjectsIncluded: 4,
        examPublished: true,
        publishedResult: true,
        categoryName: "",
        description: "Monthly Periodic exam",
        createdAt: "09/02/2025",
    },
    {
        id: "8",
        examName: "Assessment Test Chapter Wise",
        classSection: "Class 1 (A, B, C, D)",
        term: "Term 1",
        subjectsIncluded: 4,
        examPublished: true,
        publishedResult: true,
        categoryName: "",
        description: "Assessment Test Chapter Wise",
        createdAt: "08/02/2025",
    },
    {
        id: "9",
        examName: "Periodic Assessments Test (July)",
        classSection: "Class 5 (A, B, C, D)",
        term: "Term 1",
        subjectsIncluded: 4,
        examPublished: true,
        publishedResult: true,
        categoryName: "",
        description: "Periodic tests are assessments conducted at regular intervals, often within a larger assessment framework.",
        createdAt: "07/01/2025",
    },
    {
        id: "10",
        examName: "Subject wise Test -2",
        classSection: "Class 5 (A, B, C, D)",
        term: "Term 2",
        subjectsIncluded: 4,
        examPublished: true,
        publishedResult: true,
        categoryName: "",
        description: "",
        createdAt: "06/02/2025",
    },
    {
        id: "11",
        examName: "Online Assessment Test",
        classSection: "Class 2 (A, B, C, D)",
        term: "Term 2",
        subjectsIncluded: 4,
        examPublished: true,
        publishedResult: true,
        categoryName: "",
        description: "Online Assessment Test",
        createdAt: "04/01/2025",
    },
];

export default function ExamListPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState("50");

    const filteredData = examData.filter((item) =>
        item.examName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-t-lg border-b shadow-sm">
                <h2 className="text-xl font-medium text-gray-800">Exam List</h2>
                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white">
                    <Plus className="mr-2 h-4 w-4" /> Add
                </Button>
            </div>

            <div className="bg-white rounded-b-lg shadow-sm border p-4 space-y-4 -mt-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-3 pr-10"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                            <SelectTrigger className="w-[70px]">
                                <SelectValue placeholder="50" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center border rounded-md p-1 bg-gray-50 text-gray-500">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                <FileSpreadsheet className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                <Printer className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-200">
                                <Columns className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50 text-xs uppercase">
                            <TableRow>
                                <TableHead className="font-semibold text-gray-600 min-w-[200px]">Exam Name</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[150px]">Class (Sections)</TableHead>
                                <TableHead className="font-semibold text-gray-600">Term</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-center">Subjects Included</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-center">Exam Published</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-center">Published Result</TableHead>
                                <TableHead className="font-semibold text-gray-600">Category Name</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[200px]">Description</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[100px]">Created At</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-right min-w-[140px]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.map((item) => (
                                <TableRow key={item.id} className="text-sm">
                                    <TableCell className="font-medium text-gray-700 py-3">{item.examName}</TableCell>
                                    <TableCell className="text-gray-600">{item.classSection}</TableCell>
                                    <TableCell className="text-gray-600">{item.term}</TableCell>
                                    <TableCell className="text-gray-600 text-center">{item.subjectsIncluded}</TableCell>
                                    <TableCell className="text-center">
                                        <Checkbox checked={item.examPublished} className="data-[state=checked]:bg-indigo-500 border-gray-300" />
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Checkbox checked={item.publishedResult} className="data-[state=checked]:bg-indigo-500 border-gray-300" />
                                    </TableCell>
                                    <TableCell className="text-gray-600">{item.categoryName}</TableCell>
                                    <TableCell className="text-gray-600 text-xs">{item.description}</TableCell>
                                    <TableCell className="text-gray-600">{item.createdAt}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                size="sm"
                                                className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm"
                                                title="Assign / View Student"
                                            >
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded p-0 shadow-sm"
                                                title="Link Exam"
                                            >
                                                <CheckSquare className="h-4 w-4" />
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
                        Showing 1 to {filteredData.length} of {examData.length} entries
                    </div>
                    <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant="default" size="sm" className="h-8 w-8 p-0 bg-indigo-500 hover:bg-indigo-600 text-white">1</Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </div>

            </div>
        </div>
    );
}
