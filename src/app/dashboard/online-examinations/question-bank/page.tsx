"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Plus, Upload, Trash2, Search, Pencil, Eye,
    Copy, FileSpreadsheet, FileText, Printer, Columns
} from "lucide-react";

interface Question {
    id: string;
    qId: string;
    class: string;
    subject: string;
    type: string;
    level: string;
    question: string;
    createdBy: string;
}

const mockQuestions: Question[] = [
    { id: "1", qId: "90", class: "Class 1 (A)", subject: "Science (111)", type: "True/False", level: "Low", question: "Fish can walk on land.", createdBy: "Joe Black (9000)" },
    { id: "2", qId: "89", class: "Class 1 (A)", subject: "English (210)", type: "True/False", level: "Low", question: "The sun rises in the east.", createdBy: "Joe Black (9000)" },
    { id: "3", qId: "88", class: "Class 1 (A)", subject: "English (210)", type: "Multiple Choice", level: "Low", question: "Which of these are colours? ☐ Red ☐ Dog ☐ Blue ☐ Green", createdBy: "Joe Black (9000)" },
    { id: "4", qId: "87", class: "Class 1 (A)", subject: "Science (111)", type: "Multiple Choice", level: "Low", question: "How many legs does a bird have? a) Two b) Four c) Six d) Eight", createdBy: "Joe Black (9000)" },
    { id: "5", qId: "86", class: "Class 1 (A)", subject: "English (210)", type: "Single Choice", level: "Low", question: "Which animal says \"Meow\"? a) Dog b) Cat c) Cow d) Lion", createdBy: "Joe Black (9000)" },
    { id: "6", qId: "85", class: "Class 1 (A)", subject: "English (210)", type: "Descriptive", level: "Medium", question: "What is your name? Name your favourite fruit. How many days are there in a week? Write the name of your Read more...", createdBy: "Joe Black (9000)" },
    { id: "7", qId: "84", class: "Class 1 (A)", subject: "English (210)", type: "Single Choice", level: "Medium", question: "Robots get their power from: A. Battery B. Paper C. Plastic D. Water", createdBy: "Joe Black (9000)" },
    { id: "8", qId: "83", class: "Class 1 (A)", subject: "Science (111)", type: "Descriptive", level: "Medium", question: "Write a yoga short essay?", createdBy: "Joe Black (9000)" },
    { id: "9", qId: "73", class: "Class 5 (I)", subject: "Hindi (230)", type: "Single Choice", level: "Medium", question: "सूर्य का सही संधि-विच्छेद क्या है?", createdBy: "Jason Sharlton (12008)" },
];

export default function QuestionBankPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="space-y-6">
            {/* Header Buttons */}
            <div className="flex justify-end gap-2">
                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-3 h-8 text-xs gap-1 shadow-sm">
                    <Plus className="h-4 w-4" /> Add Question
                </Button>
                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-3 h-8 text-xs gap-1 shadow-sm">
                    <Upload className="h-4 w-4" /> Import
                </Button>
                <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-3 h-8 text-xs gap-1 shadow-sm">
                    <Trash2 className="h-4 w-4" /> Bulk Delete
                </Button>
            </div>

            {/* Select Criteria Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-6">
                <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Select Criteria</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="class" className="text-xs font-semibold text-gray-600">Class</Label>
                        <Select>
                            <SelectTrigger id="class" className="h-9">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="class1">Class 1</SelectItem>
                                <SelectItem value="class2">Class 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="section" className="text-xs font-semibold text-gray-600">Section</Label>
                        <Select>
                            <SelectTrigger id="section" className="h-9">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="a">A</SelectItem>
                                <SelectItem value="b">B</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="subject" className="text-xs font-semibold text-gray-600">Subject</Label>
                        <Select>
                            <SelectTrigger id="subject" className="h-9">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="science">Science (111)</SelectItem>
                                <SelectItem value="english">English (210)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type" className="text-xs font-semibold text-gray-600">Question Type</Label>
                        <Select>
                            <SelectTrigger id="type" className="h-9">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true_false">True/False</SelectItem>
                                <SelectItem value="multiple">Multiple Choice</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="level" className="text-xs font-semibold text-gray-600">Question Level</Label>
                        <Select>
                            <SelectTrigger id="level" className="h-9">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="createdBy" className="text-xs font-semibold text-gray-600">Created By</Label>
                        <Select>
                            <SelectTrigger id="createdBy" className="h-9">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="joe">Joe Black (9000)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button className="bg-[#6366f1] hover:bg-[#5558dd] text-white px-6 h-9 text-xs gap-2">
                        <Search className="h-3.5 w-3.5" /> Search
                    </Button>
                </div>
            </div>

            {/* Question Bank Section */}
            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
                <h2 className="text-lg font-medium text-gray-800 border-b pb-2">Question Bank</h2>

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
                            <Columns className="h-3.5 w-3.5 text-gray-400" />
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
                        </div>
                    </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50 text-[11px] uppercase">
                            <TableRow>
                                <TableHead className="w-[40px] px-4">
                                    <Checkbox className="border-gray-400" />
                                </TableHead>
                                <TableHead className="font-semibold text-gray-600">Q. ID</TableHead>
                                <TableHead className="font-semibold text-gray-600">Class</TableHead>
                                <TableHead className="font-semibold text-gray-600">Subject</TableHead>
                                <TableHead className="font-semibold text-gray-600">Question Type</TableHead>
                                <TableHead className="font-semibold text-gray-600">Level</TableHead>
                                <TableHead className="font-semibold text-gray-600 min-w-[300px]">Question</TableHead>
                                <TableHead className="font-semibold text-gray-600">Created By</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockQuestions.map((q) => (
                                <TableRow key={q.id} className="text-[12px] hover:bg-gray-50/50">
                                    <TableCell className="px-4">
                                        <Checkbox className="border-gray-400" />
                                    </TableCell>
                                    <TableCell className="text-gray-600">{q.qId}</TableCell>
                                    <TableCell className="text-gray-600">{q.class}</TableCell>
                                    <TableCell className="text-gray-600">{q.subject}</TableCell>
                                    <TableCell className="text-gray-600">{q.type}</TableCell>
                                    <TableCell className="text-gray-600">{q.level}</TableCell>
                                    <TableCell className="text-gray-600 leading-relaxed font-medium">
                                        {q.question}
                                    </TableCell>
                                    <TableCell className="text-gray-500 whitespace-nowrap">{q.createdBy}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button size="icon" variant="ghost" className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded shadow-sm">
                                                <Pencil className="h-3.5 w-3.5" />
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
            </div>
        </div>
    );
}
