"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, FileSpreadsheet, FileText, Printer, Columns, Search, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface ExamResult {
    id: string;
    admissionNo: string;
    rollNumber: string;
    studentName: string;
    english: { marks: string; grade: string; isAbsent: boolean };
    hindi: { marks: string; grade: string; isAbsent: boolean };
    mathematics: { marks: string; grade: string; isAbsent: boolean };
    science: { marks: string; grade: string; isAbsent: boolean };
    grandTotal: string;
    percent: string;
    rank: number;
    result: string;
}

const mockResultData: ExamResult[] = [
    {
        id: "1",
        admissionNo: "120020",
        rollNumber: "100020",
        studentName: "Ashwani Kumar",
        english: { marks: "", grade: "B-", isAbsent: true },
        hindi: { marks: "34.00", grade: "B", isAbsent: false },
        mathematics: { marks: "45.00", grade: "B+", isAbsent: false },
        science: { marks: "34.00", grade: "B", isAbsent: false },
        grandTotal: "113.00/300.00",
        percent: "37.67 (B-)",
        rank: 25,
        result: ""
    },
    {
        id: "2",
        admissionNo: "18001",
        rollNumber: "100035",
        studentName: "Edward Thomas",
        english: { marks: "73.00", grade: "A++", isAbsent: false },
        hindi: { marks: "73.00", grade: "A++", isAbsent: false },
        mathematics: { marks: "34.00", grade: "B", isAbsent: false },
        science: { marks: "71.00", grade: "A++", isAbsent: false },
        grandTotal: "251.00/300.00",
        percent: "83.67 (A+)",
        rank: 1,
        result: ""
    },
    {
        id: "3",
        admissionNo: "19001",
        rollNumber: "201",
        studentName: "Edward Thomas",
        english: { marks: "42.00", grade: "B+", isAbsent: false },
        hindi: { marks: "34.00", grade: "B", isAbsent: false },
        mathematics: { marks: "55.00", grade: "A", isAbsent: false },
        science: { marks: "34.00", grade: "B", isAbsent: false },
        grandTotal: "165.00/300.00",
        percent: "55.00 (B+)",
        rank: 10,
        result: ""
    },
    {
        id: "4",
        admissionNo: "25001",
        rollNumber: "32005",
        studentName: "Georgia Wareham",
        english: { marks: "23.00", grade: "B-", isAbsent: false },
        hindi: { marks: "55.00", grade: "A", isAbsent: false },
        mathematics: { marks: "32.00", grade: "B", isAbsent: false },
        science: { marks: "55.00", grade: "A", isAbsent: false },
        grandTotal: "165.00/300.00",
        percent: "55.00 (B+)",
        rank: 14,
        result: ""
    },
    {
        id: "5",
        admissionNo: "659990",
        rollNumber: "549900",
        studentName: "James Bennett",
        english: { marks: "33.00", grade: "B", isAbsent: false },
        hindi: { marks: "22.00", grade: "B-", isAbsent: false },
        mathematics: { marks: "23.00", grade: "B-", isAbsent: false },
        science: { marks: "", grade: "B-", isAbsent: true },
        grandTotal: "78.00/300.00",
        percent: "26.00 (B-)",
        rank: 27,
        result: ""
    },
    {
        id: "6",
        admissionNo: "125005",
        rollNumber: "32001",
        studentName: "Nehal Wadhara",
        english: { marks: "23.00", grade: "B-", isAbsent: false },
        hindi: { marks: "22.00", grade: "B-", isAbsent: false },
        mathematics: { marks: "63.00", grade: "A+", isAbsent: false },
        science: { marks: "45.00", grade: "B+", isAbsent: false },
        grandTotal: "153.00/300.00",
        percent: "51.00 (B+)",
        rank: 17,
        result: ""
    },
    {
        id: "7",
        admissionNo: "10024",
        rollNumber: "20026",
        studentName: "Steve Taylor",
        english: { marks: "53.00", grade: "A", isAbsent: false },
        hindi: { marks: "66.00", grade: "A+", isAbsent: false },
        mathematics: { marks: "34.00", grade: "B", isAbsent: false },
        science: { marks: "65.00", grade: "A+", isAbsent: false },
        grandTotal: "218.00/300.00",
        percent: "72.67 (A)",
        rank: 4,
        result: ""
    },
    {
        id: "8",
        admissionNo: "520039",
        rollNumber: "120025",
        studentName: "xavier bartlett",
        english: { marks: "45.00", grade: "B+", isAbsent: false },
        hindi: { marks: "45.00", grade: "B+", isAbsent: false },
        mathematics: { marks: "45.00", grade: "B+", isAbsent: false },
        science: { marks: "22.00", grade: "B-", isAbsent: false },
        grandTotal: "157.00/300.00",
        percent: "52.33 (B+)",
        rank: 18,
        result: ""
    },
];

export default function ExamResultPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState("50");

    const filteredData = mockResultData.filter((item) =>
        item.studentName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-6">
                <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Select Criteria</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
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

                    <div className="space-y-2">
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

                    <div className="space-y-2">
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
                                <SelectItem value="b">B</SelectItem>
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

            {/* Exam Result List Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
                <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Exam Result</h2>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-48">
                        <Input
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-3"
                        />
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
                                <TableHead className="font-semibold text-gray-600 min-w-[100px]">Admission No</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[100px]">Roll Number</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[150px]">Student Name</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[120px]">
                                    <div>English</div>
                                    <div className="text-[10px] text-gray-500">(25.00/75.00 - 210)</div>
                                </TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[120px]">
                                    <div>Hindi</div>
                                    <div className="text-[10px] text-gray-500">(25.00/75.00 - 230)</div>
                                </TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[120px]">
                                    <div>Mathematics</div>
                                    <div className="text-[10px] text-gray-500">(25.00/75.00 - 110)</div>
                                </TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[120px]">
                                    <div>Science</div>
                                    <div className="text-[10px] text-gray-500">(25.00/75.00 - 111)</div>
                                </TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[100px]">Grand Total</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[100px]">Percent (%)</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[60px]">Rank</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[60px]">Result</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.map((item) => (
                                <TableRow key={item.id} className="text-sm hover:bg-gray-50">
                                    <TableCell className="text-gray-600 font-medium">{item.admissionNo}</TableCell>
                                    <TableCell className="text-gray-600">{item.rollNumber}</TableCell>
                                    <TableCell>
                                        <Link href="#" className="font-medium text-blue-600 hover:underline">
                                            {item.studentName}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-gray-600">
                                        {item.english.isAbsent ? (
                                            <div>
                                                <div className="text-xs font-semibold text-gray-400">({item.english.grade})</div>
                                                <div className="text-red-500 font-medium">Absent</div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="font-medium">{item.english.marks} <span className="text-xs text-gray-400">({item.english.grade})</span></div>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-gray-600">
                                        {item.hindi.isAbsent ? (
                                            <div>
                                                <div className="text-xs font-semibold text-gray-400">({item.hindi.grade})</div>
                                                <div className="text-red-500 font-medium">Absent</div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="font-medium">{item.hindi.marks} <span className="text-xs text-gray-400">({item.hindi.grade})</span></div>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-gray-600">
                                        {item.mathematics.isAbsent ? (
                                            <div>
                                                <div className="text-xs font-semibold text-gray-400">({item.mathematics.grade})</div>
                                                <div className="text-red-500 font-medium">Absent</div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="font-medium">{item.mathematics.marks} <span className="text-xs text-gray-400">({item.mathematics.grade})</span></div>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-gray-600">
                                        {item.science.isAbsent ? (
                                            <div>
                                                <div className="text-xs font-semibold text-gray-400">({item.science.grade})</div>
                                                <div className="text-red-500 font-medium">Absent</div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="font-medium">{item.science.marks} <span className="text-xs text-gray-400">({item.science.grade})</span></div>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-gray-600 font-medium">{item.grandTotal}</TableCell>
                                    <TableCell className="text-gray-600 font-medium">{item.percent}</TableCell>
                                    <TableCell className="text-gray-600">{item.rank}</TableCell>
                                    <TableCell className="text-gray-600">{item.result}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-2">
                    <div>
                        Showing 1 to {filteredData.length} of {mockResultData.length} entries
                    </div>
                    <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled><ChevronLeft className="h-3.5 w-3.5" /></Button>
                        <Button variant="default" size="sm" className="h-7 w-7 p-0 bg-indigo-500 hover:bg-indigo-600 text-white">1</Button>
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled><ChevronRight className="h-3.5 w-3.5" /></Button>
                    </div>
                </div>

            </div>
        </div>
    );
}
