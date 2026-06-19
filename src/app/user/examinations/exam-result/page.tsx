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
import { cn } from "@/lib/utils";

const examResultData = [
    {
        examName: "CBSE Monthly Test - May",
        columns: ["Max Marks", "Min Marks", "Marks Obtained", "Result"],
        subjects: [
            { name: "English (210)", max: "100.00", min: "33.00", obtained: "43.00", result: "Pass", note: "" },
            { name: "Hindi (230)", max: "100.00", min: "33.00", obtained: "89.00", result: "Pass", note: "" },
            { name: "Mathematics (110)", max: "100.00", min: "33.00", obtained: "76.00", result: "Pass", note: "" },
            { name: "Science (111)", max: "100.00", min: "33.00", obtained: "56.00", result: "Pass", note: "" }
        ],
        summary: {
            percentage: "66.00",
            rank: "2",
            result: "Pass",
            division: "First",
            grandTotal: "400",
            totalObtain: "264"
        }
    },
    {
        examName: "CBSE Periodic Test 1(May)",
        columns: ["Max Marks", "Min Marks", "Marks Obtained", "Grade"],
        subjects: [
            { name: "Mathematics (110)", max: "100.00", min: "33.00", obtained: "34.00", grade: "B-", note: "" },
            { name: "Science (111)", max: "100.00", min: "33.00", obtained: "45.00", grade: "B", note: "" },
            { name: "English (210)", max: "100.00", min: "33.00", obtained: "54.00", grade: "B+", note: "" }
        ],
        summary: {
            percentage: "44.33",
            rank: "4",
            result: "Pass",
            division: "Second",
            grandTotal: "300",
            totalObtain: "133"
        }
    },
    {
        examName: "College Grade Test (May-2026)",
        columns: ["Max Marks", "Min Marks", "Marks Obtained", "Grade"],
        subjects: [
            { name: "English (210)", max: "100.00", min: "40.00", obtained: "56.00", grade: "B+", note: "" },
            { name: "Mathematics (110)", max: "100.00", min: "40.00", obtained: "23.00", grade: "B-", note: "" },
            { name: "Science (111)", max: "100.00", min: "40.00", obtained: "56.00", grade: "B+", note: "" }
        ],
        summary: {
            percentage: "45.00",
            rank: "5",
            result: "Fail",
            division: "Second",
            grandTotal: "300",
            totalObtain: "135"
        }
    },
    {
        examName: "Average Passing Test",
        columns: ["Max Marks", "Marks Obtained"],
        subjects: [
            { name: "English (210)", max: "100.00", obtained: "65.00", note: "" },
            { name: "Mathematics (110)", max: "100.00", obtained: "44.00", note: "" },
            { name: "Science (111)", max: "100.00", obtained: "44.00", note: "" },
            { name: "Social Studies (212)", max: "100.00", obtained: "45.00", note: "" }
        ],
        summary: {
            percentage: "49.50",
            rank: "2",
            result: "Fail",
            division: "Second",
            grandTotal: "400",
            totalObtain: "198"
        }
    }
];

export default function UserExaminationsResultPage() {
    return (
        <div className="p-4 space-y-4 bg-gray-50/10 min-h-screen font-sans">
            <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-100 p-4 flex justify-between items-center">
                    <h1 className="text-[16px] font-medium text-gray-700 tracking-tight">Exam Result</h1>
                    <Button className="bg-[#7e57c2] hover:bg-[#7048b6] text-white h-8 w-8 p-0 rounded shadow-none transition-all active:scale-95">
                        <Printer className="h-4 w-4" />
                    </Button>
                </div>

                <div className="p-4 space-y-6">
                    {examResultData.map((exam, index) => (
                        <div key={index} className="border border-gray-200 rounded-sm overflow-hidden">
                            {/* Exam Title Bar */}
                            <div className="bg-gray-100/80 p-3 border-b border-gray-200 text-[14px] text-gray-700 font-medium">
                                {exam.examName}
                            </div>
                            
                            {/* Data Table */}
                            <div className="overflow-x-auto">
                                <Table className="min-w-[800px]">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent border-b border-gray-200">
                                            <TableHead className="w-[200px] text-[12px] font-bold text-gray-700 h-auto py-3">Subject</TableHead>
                                            {exam.columns.map((col, cIdx) => (
                                                <TableHead key={cIdx} className="text-center text-[12px] font-bold text-gray-700 h-auto py-3">
                                                    {col}
                                                </TableHead>
                                            ))}
                                            <TableHead className="text-right text-[12px] font-bold text-gray-700 h-auto py-3 pr-6">Note</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {exam.subjects.map((subject: any, sIdx) => (
                                            <TableRow key={sIdx} className="hover:bg-gray-50/50 border-b border-gray-100">
                                                <TableCell className="text-[13px] text-gray-600 py-3 font-medium">{subject.name}</TableCell>
                                                
                                                {exam.columns.includes("Max Marks") && (
                                                    <TableCell className="text-center text-[13px] text-gray-600 py-3">{subject.max}</TableCell>
                                                )}
                                                
                                                {exam.columns.includes("Min Marks") && (
                                                    <TableCell className="text-center text-[13px] text-gray-600 py-3">{subject.min}</TableCell>
                                                )}
                                                
                                                {exam.columns.includes("Marks Obtained") && (
                                                    <TableCell className="text-center text-[13px] text-gray-600 py-3">{subject.obtained}</TableCell>
                                                )}
                                                
                                                {exam.columns.includes("Result") && (
                                                    <TableCell className="text-center text-[13px] py-3">
                                                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-bold text-white bg-[#5cb85c]">
                                                            {subject.result}
                                                        </span>
                                                    </TableCell>
                                                )}
                                                
                                                {exam.columns.includes("Grade") && (
                                                    <TableCell className="text-center text-[13px] text-gray-600 py-3">{subject.grade}</TableCell>
                                                )}

                                                <TableCell className="text-right text-[13px] text-gray-600 py-3 pr-6">{subject.note}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Summary Footer */}
                            <div className="grid grid-cols-2 md:grid-cols-5 p-3 border-t border-gray-200 bg-gray-100/60 text-[13px] font-bold text-gray-700 gap-4 items-center">
                                <div>Percentage : {exam.summary.percentage}</div>
                                <div className="text-center">Rank : {exam.summary.rank}</div>
                                <div className="text-center flex items-center justify-center gap-1">
                                    Result : 
                                    <span className={cn(
                                        "inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-bold text-white ml-1 mr-1",
                                        exam.summary.result === "Pass" ? "bg-[#5cb85c]" : "bg-[#d9534f]"
                                    )}>
                                        {exam.summary.result}
                                    </span> 
                                    Division : {exam.summary.division}
                                </div>
                                <div className="text-center">Grand Total : {exam.summary.grandTotal}</div>
                                <div className="text-right">Total Obtain Marks : {exam.summary.totalObtain}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
