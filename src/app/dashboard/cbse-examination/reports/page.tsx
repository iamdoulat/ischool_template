"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet, Printer, Search } from "lucide-react";

interface SubjectMarks {
    theory: string | number;
    practical: string | number;
}

interface StudentReport {
    id: string;
    studentName: string;
    admissionNo: string;
    fatherName: string;
    subjects: {
        english: SubjectMarks;
        hindi: SubjectMarks;
        maths: SubjectMarks;
        science: SubjectMarks;
    };
    totalMarks: string;
    percentage: string;
    grade: string;
    rank: number;
}

const reportData: StudentReport[] = [
    {
        id: "1",
        studentName: "Edward Thomas",
        admissionNo: "18001",
        fatherName: "Olivier Thomas",
        subjects: {
            english: { theory: 87.00, practical: "xx" },
            hindi: { theory: 64.00, practical: "xx" },
            maths: { theory: 75.00, practical: "xx" },
            science: { theory: 56.00, practical: "xx" },
        },
        totalMarks: "282/400",
        percentage: "70.50",
        grade: "B+",
        rank: 1,
    },
    {
        id: "2",
        studentName: "Edward Thomas",
        admissionNo: "19001",
        fatherName: "Olivier Thomas",
        subjects: {
            english: { theory: 45.00, practical: "xx" },
            hindi: { theory: 34.00, practical: "xx" },
            maths: { theory: 34.00, practical: "xx" },
            science: { theory: 87.00, practical: "xx" },
        },
        totalMarks: "200/400",
        percentage: "50.00",
        grade: "C",
        rank: 2,
    },
    {
        id: "3",
        studentName: "RKS Kumar",
        admissionNo: "RKS001",
        fatherName: "SR",
        subjects: {
            english: { theory: 56.00, practical: "xx" },
            hindi: { theory: 42.00, practical: "xx" },
            maths: { theory: 34.00, practical: "xx" },
            science: { theory: 65.00, practical: "xx" },
        },
        totalMarks: "197/400",
        percentage: "49.25",
        grade: "D",
        rank: 3,
    },
    {
        id: "4",
        studentName: "Ashwani Kumar",
        admissionNo: "120020",
        fatherName: "Arjun Kumar",
        subjects: {
            english: { theory: 45.00, practical: "xx" },
            hindi: { theory: 76.00, practical: "xx" },
            maths: { theory: 23.00, practical: "xx" },
            science: { theory: 43.00, practical: "xx" },
        },
        totalMarks: "187/400",
        percentage: "46.75",
        grade: "D",
        rank: 4,
    },
    {
        id: "5",
        studentName: "Nishant Sindhu",
        admissionNo: "120028",
        fatherName: "Jayant Sindhu",
        subjects: {
            english: { theory: 78.00, practical: "xx" },
            hindi: { theory: 12.00, practical: "xx" },
            maths: { theory: 45.00, practical: "xx" },
            science: { theory: 33.00, practical: "xx" },
        },
        totalMarks: "168/400",
        percentage: "42.00",
        grade: "D",
        rank: 5,
    },
    {
        id: "6",
        studentName: "Steven Taylor",
        admissionNo: "10024",
        fatherName: "Jason Taylor",
        subjects: {
            english: { theory: 56.00, practical: "xx" },
            hindi: { theory: 45.00, practical: "xx" },
            maths: { theory: 67.00, practical: "xx" },
            science: { theory: "ABS", practical: "xx" },
        },
        totalMarks: "168/400",
        percentage: "42.00",
        grade: "D",
        rank: 5,
    },
    {
        id: "7",
        studentName: "Nidhi Varma",
        admissionNo: "90034",
        fatherName: "Babu",
        subjects: {
            english: { theory: 11.00, practical: "xx" },
            hindi: { theory: 34.00, practical: "xx" },
            maths: { theory: 24.00, practical: "xx" },
            science: { theory: 65.00, practical: "xx" },
        },
        totalMarks: "134/400",
        percentage: "33.50",
        grade: "E",
        rank: 6,
    },
    {
        id: "8",
        studentName: "Niharika",
        admissionNo: "9001",
        fatherName: "ajay",
        subjects: {
            english: { theory: 34.00, practical: "xx" },
            hindi: { theory: 11.00, practical: "xx" },
            maths: { theory: 53.00, practical: "xx" },
            science: { theory: 23.00, practical: "xx" },
        },
        totalMarks: "121/400",
        percentage: "30.25",
        grade: "E",
        rank: 7,
    },
    {
        id: "9",
        studentName: "Georgia Wareham",
        admissionNo: "25001",
        fatherName: "Zakary Foulkes",
        subjects: {
            english: { theory: 12.00, practical: "xx" },
            hindi: { theory: 54.00, practical: "xx" },
            maths: { theory: "ABS", practical: "xx" },
            science: { theory: 45.00, practical: "xx" },
        },
        totalMarks: "111/400",
        percentage: "27.75",
        grade: "E",
        rank: 8,
    },
    {
        id: "10",
        studentName: "AVYAAN",
        admissionNo: "9004",
        fatherName: "s.r",
        subjects: {
            english: { theory: 22.00, practical: "xx" },
            hindi: { theory: 22.00, practical: "xx" },
            maths: { theory: 46.00, practical: "xx" },
            science: { theory: "ABS", practical: "xx" },
        },
        totalMarks: "90/400",
        percentage: "22.50",
        grade: "E",
        rank: 9,
    },
    {
        id: "11",
        studentName: "RAM",
        admissionNo: "7656",
        fatherName: "jay",
        subjects: {
            english: { theory: "ABS", practical: "xx" },
            hindi: { theory: 34.00, practical: "xx" },
            maths: { theory: 11.00, practical: "xx" },
            science: { theory: 34.00, practical: "xx" },
        },
        totalMarks: "79/400",
        percentage: "19.75",
        grade: "E",
        rank: 10,
    },
    {
        id: "12",
        studentName: "Vinay Singh",
        admissionNo: "5422",
        fatherName: "arun singh",
        subjects: {
            english: { theory: "ABS", practical: "xx" },
            hindi: { theory: "ABS", practical: "xx" },
            maths: { theory: 65.00, practical: "xx" },
            science: { theory: 11.00, practical: "xx" },
        },
        totalMarks: "76/400",
        percentage: "19.00",
        grade: "E",
        rank: 11,
    },
];

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState("subject-marks");

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {/* Tabs Header */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab("subject-marks")}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === "subject-marks"
                                ? "border-indigo-500 text-gray-800 bg-gray-50"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        Subject Marks Report
                    </button>
                    <button
                        onClick={() => setActiveTab("template-marks")}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === "template-marks"
                                ? "border-indigo-500 text-gray-800 bg-gray-50"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        Template Marks Report
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === "subject-marks" && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-medium text-gray-800">Subject wise Marks Report</h2>

                            {/* Filter Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b">
                                <div className="space-y-2">
                                    <Label htmlFor="exam-select" className="text-xs font-semibold text-gray-600">
                                        Exam <span className="text-red-500">*</span>
                                    </Label>
                                    <Select>
                                        <SelectTrigger id="exam-select">
                                            <SelectValue placeholder="Assessment Practice Test(February-2026)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="assessment-feb">Assessment Practice Test(February-2026)</SelectItem>
                                            <SelectItem value="assessment-jan">Assessment Practice Test(January-2026)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-end justify-end">
                                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 h-9 text-sm">
                                        <Search className="mr-2 h-4 w-4" /> Search
                                    </Button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-start gap-1">
                                <Button size="icon" className="h-8 w-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                    <Printer className="h-4 w-4" />
                                </Button>
                                <Button size="icon" className="h-8 w-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                    <FileSpreadsheet className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Table */}
                            <div className="rounded-md border overflow-x-auto">
                                <Table className="border-collapse">
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead rowSpan={2} className="border text-xs font-semibold text-gray-600 min-w-[150px] bg-gray-50">Student</TableHead>
                                            <TableHead rowSpan={2} className="border text-xs font-semibold text-gray-600 min-w-[100px] bg-gray-50">Admission No</TableHead>
                                            <TableHead rowSpan={2} className="border text-xs font-semibold text-gray-600 min-w-[150px] bg-gray-50">Father Name</TableHead>

                                            <TableHead colSpan={2} className="border text-center text-xs font-semibold text-gray-600 bg-gray-50">English (210)</TableHead>
                                            <TableHead colSpan={2} className="border text-center text-xs font-semibold text-gray-600 bg-gray-50">Hindi (230)</TableHead>
                                            <TableHead colSpan={2} className="border text-center text-xs font-semibold text-gray-600 bg-gray-50">Mathematics (110)</TableHead>
                                            <TableHead colSpan={2} className="border text-center text-xs font-semibold text-gray-600 bg-gray-50">Science (111)</TableHead>

                                            <TableHead rowSpan={2} className="border text-xs font-semibold text-gray-600 w-[100px] text-center bg-gray-50">Total Marks</TableHead>
                                            <TableHead rowSpan={2} className="border text-xs font-semibold text-gray-600 w-[100px] text-center bg-gray-50">Percentage (%)</TableHead>
                                            <TableHead rowSpan={2} className="border text-xs font-semibold text-gray-600 w-[60px] text-center bg-gray-50">Grade</TableHead>
                                            <TableHead rowSpan={2} className="border text-xs font-semibold text-gray-600 w-[60px] text-center bg-gray-50">Rank</TableHead>
                                        </TableRow>
                                        <TableRow>
                                            <TableHead className="border text-[10px] text-center font-medium text-gray-500 min-w-[80px] bg-gray-50">Theory (TH02)<br />(Max - 100)</TableHead>
                                            <TableHead className="border text-[10px] text-center font-medium text-gray-500 min-w-[80px] bg-gray-50">Practical (PC03)<br />(Max - 75)</TableHead>

                                            <TableHead className="border text-[10px] text-center font-medium text-gray-500 min-w-[80px] bg-gray-50">Theory (TH02)<br />(Max - 100)</TableHead>
                                            <TableHead className="border text-[10px] text-center font-medium text-gray-500 min-w-[80px] bg-gray-50">Practical (PC03)<br />(Max - 75)</TableHead>

                                            <TableHead className="border text-[10px] text-center font-medium text-gray-500 min-w-[80px] bg-gray-50">Theory (TH02)<br />(Max - 100)</TableHead>
                                            <TableHead className="border text-[10px] text-center font-medium text-gray-500 min-w-[80px] bg-gray-50">Practical (PC03)<br />(Max - 75)</TableHead>

                                            <TableHead className="border text-[10px] text-center font-medium text-gray-500 min-w-[80px] bg-gray-50">Theory (TH02)<br />(Max - 100)</TableHead>
                                            <TableHead className="border text-[10px] text-center font-medium text-gray-500 min-w-[80px] bg-gray-50">Practical (PC03)<br />(Max - 75)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reportData.map((item) => (
                                            <TableRow key={item.id} className="text-xs hover:bg-gray-50">
                                                <TableCell className="border font-medium text-gray-700 py-2">{item.studentName}</TableCell>
                                                <TableCell className="border text-gray-600 py-2">{item.admissionNo}</TableCell>
                                                <TableCell className="border text-gray-600 py-2">{item.fatherName}</TableCell>

                                                <TableCell className="border text-center text-gray-600">{item.subjects.english.theory}</TableCell>
                                                <TableCell className="border text-center text-gray-600">{item.subjects.english.practical}</TableCell>

                                                <TableCell className="border text-center text-gray-600">{item.subjects.hindi.theory}</TableCell>
                                                <TableCell className="border text-center text-gray-600">{item.subjects.hindi.practical}</TableCell>

                                                <TableCell className="border text-center text-gray-600">{item.subjects.maths.theory}</TableCell>
                                                <TableCell className="border text-center text-gray-600">{item.subjects.maths.practical}</TableCell>

                                                <TableCell className="border text-center text-gray-600">{item.subjects.science.theory}</TableCell>
                                                <TableCell className="border text-center text-gray-600">{item.subjects.science.practical}</TableCell>

                                                <TableCell className="border text-center text-gray-600 font-medium">{item.totalMarks}</TableCell>
                                                <TableCell className="border text-center text-gray-600">{item.percentage}</TableCell>
                                                <TableCell className="border text-center text-gray-600">{item.grade}</TableCell>
                                                <TableCell className="border text-center text-gray-600">{item.rank}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                    {activeTab === "template-marks" && (
                        <div className="text-center py-10 text-gray-500">
                            Template Marks Report functionality coming soon.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
