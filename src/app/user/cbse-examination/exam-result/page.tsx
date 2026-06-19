"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const examData = [
    {
        examName: "CBSE Assessment Test ( June)",
        columns: [
            { name: "Theory (TH02)", max: 100 },
            { name: "Practical (PC03)", max: 75 },
            { name: "Assignment (AS05)", max: 20 }
        ],
        subjects: [
            { name: "English (210)", scores: ["75.00", "45.00", "9.00"], total: "129.00", note: "" },
            { name: "Hindi (230)", scores: ["77.00", "56.00", "10.00"], total: "143.00", note: "" }
        ],
        summary: {
            totalMarks: "272/390",
            percentage: "69.74",
            grade: "B",
            rank: "2"
        }
    },
    {
        examName: "Monthly Test Examination(June)",
        columns: [
            { name: "Theory (TH02)", max: 100 },
            { name: "Practical (PC03)", max: 75 },
            { name: "Assignment (AS05)", max: 20 }
        ],
        subjects: [
            { name: "English (210)", scores: ["76.00", "55.00", "15.00"], total: "146.00", note: "" },
            { name: "Mathematics (110)", scores: ["65.00", "56.00", "8.00"], total: "129.00", note: "" },
            { name: "Computer (00220)", scores: ["87.00", "65.00", "8.00"], total: "160.00", note: "" }
        ],
        summary: {
            totalMarks: "435/585",
            percentage: "74.36",
            grade: "B+",
            rank: "1"
        }
    },
    {
        examName: "Unit Test(June)",
        columns: [
            { name: "Theory (TH02)", max: 100 },
            { name: "Practical (PC03)", max: 75 },
            { name: "Assignment (AS05)", max: 20 }
        ],
        subjects: [
            { name: "English (210)", scores: ["67.00", "65.00", "9.00"], total: "141.00", note: "" },
            { name: "Mathematics (110)", scores: ["87.00", "34.00", "16.00"], total: "137.00", note: "" },
            { name: "Science (111)", scores: ["56.00", "32.00", "15.00"], total: "103.00", note: "" }
        ],
        summary: {
            totalMarks: "381/585",
            percentage: "65.13",
            grade: "B",
            rank: "3"
        }
    },
    {
        examName: "CBSE Half Yearly Examination",
        columns: [
            { name: "Theory (TH02)", max: 100 },
            { name: "Practical (PC03)", max: 75 },
            { name: "Assignment (AS05)", max: 20 }
        ],
        subjects: [
            { name: "English (210)", scores: ["76.00", "45.00", "20.00"], total: "141.00", note: "" },
            { name: "Hindi (230)", scores: ["66.00", "45.00", "18.00"], total: "129.00", note: "" },
            { name: "Mathematics (110)", scores: ["76.00", "35.00", "10.00"], total: "121.00", note: "" },
            { name: "Science (111)", scores: ["55.00", "34.00", "13.00"], total: "102.00", note: "" }
        ],
        summary: {
            totalMarks: "493/780",
            percentage: "63.21",
            grade: "B",
            rank: "1"
        }
    },
    {
        examName: "CBSE Practical Examination",
        columns: [
            { name: "Theory (TH02)", max: 100 },
            { name: "Practical (PC03)", max: 75 }
        ],
        subjects: [
            { name: "English (210)", scores: ["34.00", "56.00"], total: "90.00", note: "" },
            { name: "Mathematics (110)", scores: ["N/A", "N/A"], total: "0.00", note: "" },
            { name: "Science (111)", scores: ["76.00", "23.00"], total: "99.00", note: "" }
        ],
        summary: {
            totalMarks: "189/525",
            percentage: "36.00",
            grade: "E",
            rank: "3"
        }
    }
];

export default function UserCBSEExamResultPage() {
    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-100 p-4 flex justify-between items-center">
                    <h1 className="text-[16px] font-medium text-gray-700 tracking-tight">CBSE Exam Result</h1>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-gray-500 shadow-none hover:bg-gray-50">
                        <Printer className="h-4 w-4" />
                    </Button>
                </div>

                <div className="p-4 space-y-6">
                    {examData.map((exam, index) => (
                        <div key={index} className="border border-gray-200 rounded-sm overflow-hidden">
                            {/* Exam Title Bar */}
                            <div className="bg-gray-100/80 p-3 border-b border-gray-200 text-[14px] text-gray-600 font-medium">
                                {exam.examName}
                            </div>
                            
                            {/* Data Table */}
                            <div className="overflow-x-auto">
                                <Table className="min-w-[800px]">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="w-[200px] text-[12px] font-bold text-gray-700 h-auto py-3">Subject</TableHead>
                                            {exam.columns.map((col, cIdx) => (
                                                <TableHead key={cIdx} className="text-center text-[12px] font-bold text-gray-700 h-auto py-3">
                                                    <div>{col.name}</div>
                                                    <div className="font-normal">(Max {col.max})</div>
                                                </TableHead>
                                            ))}
                                            <TableHead className="text-center text-[12px] font-bold text-gray-700 h-auto py-3">Total</TableHead>
                                            <TableHead className="text-[12px] font-bold text-gray-700 h-auto py-3">Note</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {exam.subjects.map((subject, sIdx) => (
                                            <TableRow key={sIdx} className="hover:bg-gray-50/50">
                                                <TableCell className="text-[13px] text-gray-600 py-2.5">{subject.name}</TableCell>
                                                {subject.scores.map((score, idx) => (
                                                    <TableCell key={idx} className="text-center text-[13px] text-gray-600 py-2.5">{score}</TableCell>
                                                ))}
                                                <TableCell className="text-center text-[13px] text-gray-600 font-medium py-2.5">{subject.total}</TableCell>
                                                <TableCell className="text-[13px] text-gray-600 py-2.5">{subject.note}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Summary Footer */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border-t border-gray-200 bg-white text-[13px] font-bold text-gray-700 gap-2">
                                <div>Total Marks : {exam.summary.totalMarks}</div>
                                <div>Percentage (%) : {exam.summary.percentage}</div>
                                <div>Grade : {exam.summary.grade}</div>
                                <div>Rank : {exam.summary.rank}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
