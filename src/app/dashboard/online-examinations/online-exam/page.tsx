"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Plus, Search, Copy, FileSpreadsheet, FileText, Printer, Columns,
    ChevronLeft, ChevronRight, CheckCircle2, XCircle, Eye, Pencil, Trash2,
    ListOrdered, LayoutGrid, FileSearch, UserCheck, ShieldClose
} from "lucide-react";

interface OnlineExam {
    id: string;
    exam: string;
    isQuiz: boolean;
    totalQuestions: number;
    descriptiveQuestions: number;
    attempt: number;
    examFrom: string;
    examTo: string;
    duration: string;
    examPublished: boolean;
    resultPublished: boolean;
    description: string;
}

const mockExams: OnlineExam[] = [
    {
        id: "1",
        exam: "Final Revision Test",
        isQuiz: false,
        totalQuestions: 8,
        descriptiveQuestions: 3,
        attempt: 7,
        examFrom: "02/22/2026 01:23 pm",
        examTo: "02/28/2026 01:23 pm",
        duration: "01:00:00",
        examPublished: true,
        resultPublished: false,
        description: "This revision test is conducted online to help students revise important topics before the final examination. Attempt all questions sincerely."
    },
    {
        id: "2",
        exam: "Class Evaluation Test",
        isQuiz: false,
        totalQuestions: 11,
        descriptiveQuestions: 5,
        attempt: 5,
        examFrom: "02/17/2026 01:30 pm",
        examTo: "02/23/2026 01:31 pm",
        duration: "01:00:00",
        examPublished: true,
        resultPublished: false,
        description: "This online evaluation test assesses students' overall performance and concept clarity. Results will help teachers identify areas for improvement."
    },
    {
        id: "3",
        exam: "Unit Test - Term I",
        isQuiz: false,
        totalQuestions: 8,
        descriptiveQuestions: 0,
        attempt: 10,
        examFrom: "02/12/2026 01:27 pm",
        examTo: "02/16/2026 01:27 pm",
        duration: "01:00:00",
        examPublished: true,
        resultPublished: false,
        description: "This online unit test covers the prescribed syllabus of Term I. Students are advised to read questions carefully and submit the exam on time."
    },
    {
        id: "4",
        exam: "Monthly Assessment Test",
        isQuiz: false,
        totalQuestions: 13,
        descriptiveQuestions: 2,
        attempt: 10,
        examFrom: "02/05/2026 01:22 pm",
        examTo: "02/10/2026 01:23 pm",
        duration: "01:30:00",
        examPublished: true,
        resultPublished: true,
        description: "This online exam is conducted to evaluate students' understanding of the subjects taught during the month. Students must attempt all questions within the given time."
    },
    {
        id: "5",
        exam: "All Subject wise exam (February-2026)",
        isQuiz: false,
        totalQuestions: 45,
        descriptiveQuestions: 10,
        attempt: 10,
        examFrom: "02/03/2026 01:30 pm",
        examTo: "02/11/2026 01:31 pm",
        duration: "01:30:00",
        examPublished: true,
        resultPublished: true,
        description: "1. The examination will comprise of Objective type Multiple Choice Questions. 2. The Subjects or topics covered in the exam will be as per the Syllabus."
    }
];

export default function OnlineExamPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredExams = mockExams.filter(exam =>
        exam.exam.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-medium text-gray-800">Online Exam List</h1>
                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-4 h-8 text-xs gap-1.5 shadow-sm">
                    <Plus className="h-4 w-4" /> Add Exam
                </Button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="px-4 pt-3">
                    <Tabs defaultValue="upcoming" className="w-full">
                        <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-6">
                            <TabsTrigger
                                value="upcoming"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-2 text-sm font-medium text-gray-500 data-[state=active]:text-indigo-600"
                            >
                                Upcoming Exams
                            </TabsTrigger>
                            <TabsTrigger
                                value="closed"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-2 text-sm font-medium text-gray-500 data-[state=active]:text-indigo-600"
                            >
                                Closed Exams
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="p-4 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-64">
                            <Input
                                placeholder="Search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-3 h-8 text-xs border-gray-200"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 mr-2">
                                <span className="text-xs text-gray-500">50</span>
                                <ChevronLeft className="h-3 w-3 text-gray-400 rotate-90" />
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                    <FileText className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100">
                                    <Columns className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50 text-[11px] uppercase">
                                <TableRow>
                                    <TableHead className="font-semibold text-gray-600">Exam</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-center w-[40px]">Quiz</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Questions</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-center w-[60px]">Attempt</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Exam From</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Exam To</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Duration</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-center">Exam Published</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-center">Result Published</TableHead>
                                    <TableHead className="font-semibold text-gray-600 min-w-[300px]">Description</TableHead>
                                    <TableHead className="font-semibold text-gray-600 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredExams.map((exam) => (
                                    <TableRow key={exam.id} className="text-[12px] hover:bg-gray-50/50">
                                        <TableCell className="font-medium text-gray-700 py-3">{exam.exam}</TableCell>
                                        <TableCell className="text-center">
                                            {exam.isQuiz ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" strokeWidth={3} />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-gray-400 mx-auto" strokeWidth={3} />
                                            )}
                                        </TableCell>
                                        <TableCell className="text-gray-600">
                                            <div>{exam.totalQuestions}</div>
                                            <div className="text-[10px] text-gray-400 capitalize">(Descriptive:{exam.descriptiveQuestions})</div>
                                        </TableCell>
                                        <TableCell className="text-center text-gray-600">{exam.attempt}</TableCell>
                                        <TableCell className="text-gray-500 whitespace-nowrap">{exam.examFrom}</TableCell>
                                        <TableCell className="text-gray-500 whitespace-nowrap">{exam.examTo}</TableCell>
                                        <TableCell className="text-gray-500">{exam.duration}</TableCell>
                                        <TableCell className="text-center">
                                            {exam.examPublished ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" strokeWidth={3} />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-gray-400 mx-auto" strokeWidth={3} />
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {exam.resultPublished ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" strokeWidth={3} />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-gray-400 mx-auto" strokeWidth={3} />
                                            )}
                                        </TableCell>
                                        <TableCell className="text-gray-500 leading-relaxed max-w-[400px]">
                                            {exam.description}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1 flex-wrap max-w-[200px] ml-auto">
                                                <Button size="icon" variant="ghost" className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                    <LayoutGrid className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                    <Plus className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                    <ListOrdered className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                    <FileSearch className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                    <Trash2 className="h-3.5 w-3.5" />
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
                            Showing 1 to {filteredExams.length} of {mockExams.length} entries
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
        </div>
    );
}
